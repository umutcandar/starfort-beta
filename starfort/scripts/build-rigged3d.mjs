/** Deterministic beta.15 asset provisioning for Render and GitHub QA.
 * Bundles the Three.js skinned character renderer locally; fetches only the
 * eight explicitly pinned CC0 GLBs, validates binary header/size, fails closed.
 * Models are cached on build; no remote model hosts contacted during gameplay.
 */
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {build} from 'esbuild';
import {RIGGED_ASSETS,RIGGED_BUNDLE,RIGGED_LICENSE,RIGGED_CLIPS} from '../official-rigged-contract-v264.js';
import {ANATOMICAL_MODEL} from '../official-anatomical-v267.js';

const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DEST=resolve(dir,'assets/rigged');
const MAX_SIZE=8*1024*1024;
const MIN_SIZE=1000;
function checkGLB(buffer,name){
 const human=name===ANATOMICAL_MODEL.name;
 const min=human?ANATOMICAL_MODEL.minBytes:MIN_SIZE,max=human?ANATOMICAL_MODEL.maxBytes:MAX_SIZE;
 if(buffer.byteLength<min||buffer.byteLength>max)throw Error(name+' invalid size: '+buffer.byteLength);
 const b=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength);
 if(b.getUint32(0,true)!==0x46546c67||b.getUint32(4,true)!==2||b.getUint32(8,true)!==buffer.byteLength)throw Error(name+' is not a complete glTF v2 binary');
 if(!human)return;
 const n=b.getUint32(12,true);
 if(b.getUint32(16,true)!==0x4e4f534a||n<200||n>buffer.byteLength-20)
  throw Error('Missing anatomical glTF JSON metadata');
 const meta=JSON.parse(new TextDecoder().decode(buffer.subarray(20,20+n)));
 const clips=new Set((meta.animations||[]).map(clip=>clip.name));
 const joints=new Set((meta.skins||[]).flatMap(skin=>skin.joints||[]).map(id=>meta.nodes?.[id]?.name));
 if(!(meta.skins?.length>0))throw Error('Human lacks a deforming skeleton');
 for(const bone of ANATOMICAL_MODEL.requiredBones)if(!joints.has(bone))throw Error('Human missing bone: '+bone);
 for(const clip of ANATOMICAL_MODEL.requiredAnimations)if(!clips.has(clip))throw Error('Human missing animation: '+clip);
 if(!(meta.images?.length>0))throw Error('Human missing textures');
}
async function download(name,url){
 const dest=join(DEST,name+'.glb');
 try{const cached=await readFile(dest);checkGLB(cached,name);return {name,cached:true,size:cached.byteLength};}catch{}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),28000);
 let data;
 try{
  const response=await fetch(url,{signal:controller.signal,headers:{'User-Agent':'STARFORT-CC0-Asset-Build/2.48'}});
  if(!response.ok)throw Error(name+' unavailable: '+response.status);
  const size=Number(response.headers.get('content-length')||0);
  if(size>(name===ANATOMICAL_MODEL.name?ANATOMICAL_MODEL.maxBytes:MAX_SIZE))throw Error(name+' exceeded asset size budget');
  data=new Uint8Array(await response.arrayBuffer());
 }finally{clearTimeout(timeout);}
 checkGLB(data,name);
 await writeFile(dest,data);
 return {name,cached:false,size:data.byteLength};
}
await mkdir(DEST,{recursive:true});
const files=Object.entries(RIGGED_ASSETS);
const result=[];
for(let index=0;index<files.length;index+=3){
 const group=await Promise.all(files.slice(index,index+3).map(([name,url])=>download(name,url)));
 result.push(...group);
}
// A realistic animated, skinned human is required at build time, and is self-hosted.
result.push(await download(ANATOMICAL_MODEL.name,ANATOMICAL_MODEL.url));
await build({
 entryPoints:[join(dir,'official-rigged-three-v264.entry.js')],
 bundle:true,format:'esm',platform:'browser',target:['es2022'],
 outfile:resolve(dir,RIGGED_BUNDLE),minify:true,
 sourcemap:false,logLevel:'warning',legalComments:'none'
});
await build({
 entryPoints:[join(dir,'hero-model-viewer.entry.js')],
 bundle:true,format:'esm',platform:'browser',target:['es2022'],
 outfile:join(DEST,'hero-viewer.js'),minify:true,
 sourcemap:false,logLevel:'warning',legalComments:'none'
});
await writeFile(join(DEST,'MODEL-LICENSE.txt'),
 RIGGED_LICENSE+'\nhttps://gobkit.com/freebies\nhttps://creativecommons.org/publicdomain/zero/1.0/\n'+
 Object.entries(RIGGED_ASSETS).map(([k,v])=>k+': '+v).join('\n')+'\n'+
 'Anatomical MakeHuman/MPFB (generated CC0): '+ANATOMICAL_MODEL.url+'\n'+
 'Asset license: https://github.com/kblood/CharacterCreator/blob/main/LICENSE-NOTES.md\n');
const built=await stat(resolve(dir,RIGGED_BUNDLE));
if(built.size<20000)throw Error('Three.js skinned renderer bundle is unexpectedly small');
console.log('STARFORT rigged Three.js ready:',result.map(x=>x.name+' '+(x.size/1024).toFixed(0)+'KiB'+(x.cached?' (cache)':'')).join(', '),'bundle',Math.round(built.size/1024)+'KiB');
