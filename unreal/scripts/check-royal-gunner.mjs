// Machine-readable FIRST PASS only. An artist must still review the result against the agreed concept.
import {readFileSync} from 'node:fs';

export function readGLBMetadata(bytes){
 if(!Buffer.isBuffer(bytes))throw Error('GLB must be a Buffer');
 if(bytes.length<28||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||
  bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid or incomplete GLB 2.0');
 const length=bytes.readUInt32LE(12),type=bytes.readUInt32LE(16);
 if(type!==0x4e4f534a||length<100||length+20>bytes.length)throw Error('Missing GLB JSON chunk');
 let meta;
 try{meta=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));}
 catch {throw Error('Invalid GLB JSON metadata');}
 if(!meta||!Array.isArray(meta.meshes))throw Error('No meshes in GLB JSON');
 const binaryOffset=20+length+((4-length%4)%4);
 let binaryLength=0;
 if(binaryOffset+8<=bytes.length&&bytes.readUInt32LE(binaryOffset+4)===0x004e4942){
  binaryLength=bytes.readUInt32LE(binaryOffset);
  if(binaryOffset+8+binaryLength>bytes.length)throw Error('Incomplete GLB BIN chunk');
 }
 return {meta,binaryLength};
}

export function auditRoyalGunnerGLB(bytes){
 const {meta,binaryLength}=readGLBMetadata(bytes);
 const problems=[];
 const meshes=meta.meshes||[],skins=meta.skins||[],nodes=meta.nodes||[],
  mats=meta.materials||[],images=meta.images||[],accessors=meta.accessors||[];
 const animated=new Set((meta.animations||[]).map(a=>String(a.name||'').trim().toLowerCase()));
 const required=['idle','walk','run','attack','hit','death'];
 const joints=Math.max(0,...skins.map(s=>Array.isArray(s.joints)?s.joints.length:0));
 const triangleCount=meshes.flatMap(m=>m.primitives||[]).reduce((n,p)=>{
  if((p.mode??4)!==4)return n;
  const index=p.indices!=null?accessors[p.indices]:accessors[p.attributes?.POSITION];
  return n+(Number.isFinite(index?.count)?Math.floor(index.count/3):0);
 },0);
 const skinned=nodes.some(n=>Number.isInteger(n.skin)&&Number.isInteger(n.mesh));
 const pbr=mats.filter(m=>m.pbrMetallicRoughness&&(
  m.pbrMetallicRoughness.baseColorTexture||m.normalTexture||m.pbrMetallicRoughness.metallicRoughnessTexture
 )).length;
 if(binaryLength<1000000)problems.push('Complete real geometry buffers are required (minimum 1 MiB BIN chunk)');
 if(!skinned||joints<50)problems.push('Production-grade humanoid skin with >=50 joints required');
 if(triangleCount<30000)problems.push('Low-poly toy geometry rejected: minimum 30000 LOD0 triangles for the hero close-up');
 if(triangleCount>100000)problems.push('Hero LOD0 too costly for baseline mobile budget: more than 100000 triangles');
 if(mats.length<4||pbr<3||images.length<3)problems.push('Missing full PBR material/texture structure');
 for(const clip of required)if(!animated.has(clip))problems.push('Missing animation: '+clip);
 const report={triangleCount,joints,materials:mats.length,pbrMaterials:pbr,textures:images.length,
  animationNames:[...animated],binaryBytes:binaryLength,issues:problems,
  status:problems.length===0?'metadata-pass-only-human-review-required':'rejected'};
 return report;
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(!process.argv[2]){console.error('Usage: node check-royal-gunner.mjs /path/to/actual-rigged-character.glb');process.exit(2);}
 try{
  const report=auditRoyalGunnerGLB(readFileSync(process.argv[2]));
  console.log(JSON.stringify(report,null,2));
  if(report.issues.length)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
