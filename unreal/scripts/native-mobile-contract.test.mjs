import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditRoyalGunnerGLB,readGLBMetadata} from './check-royal-gunner.mjs';

const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function makeGLB(meta,binLength=1048576){
 const json=Buffer.from(JSON.stringify(meta),'utf8');
 const jLength=Math.ceil(json.length/4)*4,bLength=Math.ceil(binLength/4)*4;
 const buf=Buffer.alloc(12+8+jLength+8+bLength);
 buf.writeUInt32LE(0x46546c67,0);
 buf.writeUInt32LE(2,4);
 buf.writeUInt32LE(buf.length,8);
 buf.writeUInt32LE(jLength,12);
 buf.writeUInt32LE(0x4e4f534a,16);
 json.copy(buf,20);buf.fill(32,20+json.length,20+jLength);
 const binOffset=20+jLength;
 buf.writeUInt32LE(bLength,binOffset);buf.writeUInt32LE(0x004e4942,binOffset+4);
 return buf;
}
const ideal=()=>({
 asset:{version:'2.0'},
 meshes:[{primitives:[{mode:4,indices:0}]}],
 accessors:[{count:150000}],
 nodes:[{mesh:0,skin:0}],
 skins:[{joints:Array.from({length:60},(_,i)=>i)}],
 materials:Array.from({length:4},()=>({pbrMetallicRoughness:{baseColorTexture:{index:0}}})),
 images:[{uri:'albedo.png'},{uri:'normal.png'},{uri:'orm.png'}],
 animations:['Idle','Walk','Run','Attack','Hit','Death'].map(name=>({name}))
});

test('Unreal 5.8 is the only NEW mobile client target (no HTML or Three.js runtime)',()=>{
 const project=JSON.parse(file('../STARFORT_UE58/StarfortUnreal.uproject'));
 assert.equal(project.EngineAssociation,'5.8');
 const render=file('../STARFORT_UE58/Config/DefaultEngine.ini');
 const game=file('../STARFORT_UE58/Config/DefaultGame.ini');
 const readme=file('../README.md');
 assert.match(render,/r\.Mobile\.ShadingPath=1/);
 assert.match(render,/bBuildForArm64=True/);
 assert.match(render,/bSupportsPortraitOrientation=False/);
 assert.match(render,/bSupportsLandscapeLeftOrientation=True/);
 assert.match(game,/STARFORT/);
 assert.match(readme,/native iOS \+ Android/);
 assert.doesNotMatch(file('../STARFORT_UE58/Source/StarfortUnreal/Private/StarfortMobileHeroPawn.cpp'),/WebBrowser|Three\.js|document\.querySelector/);
});

test('native touch hero pawn uses real skeletal mesh and refuses missing art',()=>{
 const s=file('../STARFORT_UE58/Source/StarfortUnreal/Private/StarfortMobileHeroPawn.cpp');
 assert.match(s,/CreateDefaultSubobject<USkeletalMeshComponent>/);
 assert.match(s,/GetInputTouchState\(ETouchIndex::Touch1/);
 assert.match(s,/GetInputTouchState\(ETouchIndex::Touch2/);
 assert.match(s,/Missing approved skeletal hero mesh/);
 assert.doesNotMatch(s,/CreateDefaultSubobject<UStaticMeshComponent>|CreateDefaultSubobject<UInstancedStaticMeshComponent>/);
});

test('quality gate never passes empty, blocky or poorly animated GLB metadata',()=>{
 assert.throws(()=>readGLBMetadata(Buffer.from('not a model')),/Invalid or incomplete/);
 const valid=auditRoyalGunnerGLB(makeGLB(ideal()));
 assert.equal(valid.status,'metadata-pass-only-human-review-required');
 assert.equal(valid.triangleCount,50000);
 assert.equal(valid.joints,60);
 assert.equal(valid.issues.length,0);
 const toy=ideal();toy.accessors=[{count:3000}];toy.skins=[{joints:[0,1,2]}];toy.animations=[{name:'Idle'}];
 const rejected=auditRoyalGunnerGLB(makeGLB(toy));
 assert.equal(rejected.status,'rejected');
 assert.ok(rejected.issues.some(i=>i.includes('Low-poly toy')));
 assert.ok(rejected.issues.some(i=>i.includes('Missing animation')));
 assert.ok(rejected.issues.some(i=>i.includes('humanoid skin')));
 assert.equal(auditRoyalGunnerGLB(makeGLB(ideal(),256)).status,'rejected');
});

test('no false claim of shipping without art import, mobile maps and hardware tests',()=>{
 const doc=file('../STARFORT_UE58/CONTENT_ASSET_REQUIREMENTS.md');
 assert.match(doc,/human visual review/i);
 assert.match(doc,/no verified APK\/IPA/i);
 assert.match(doc,/iOS/i);assert.match(doc,/Android/i);
});
