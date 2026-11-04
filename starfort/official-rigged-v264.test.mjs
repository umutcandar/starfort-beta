import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {RIGGED_ASSETS,RIGGED_CLIPS,RIGGED_HERO_MAP,RIGGED_LOCAL_DIR,RIGGED_BUNDLE,
 riggedModelForUnit,riggedAnimationForUnit,officialRiggedWorldPosition} from './official-rigged-contract-v264.js';
import {officialGraphicsPreference,premiumRiggedBundleUrl,createOfficialBattleDirector} from './official-3d-director.js';
import {officialBattleRoom} from './official-battle-bridge.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const root=new URL('./',import.meta.url);
const dir=new URL('./assets/rigged/',import.meta.url);
const script=source('./scripts/build-rigged3d.mjs');
function parseMeta(buf){
 const view=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);
 assert.equal(view.getUint32(0,true),0x46546c67);
 assert.equal(view.getUint32(4,true),2);
 assert.equal(view.getUint32(8,true),buf.byteLength);
 const jsonLength=view.getUint32(12,true);
 const json=JSON.parse(new TextDecoder().decode(buf.subarray(20,20+jsonLength)));
 return json;
}
test('8 actual local GLBs (not boxes) are textured, skinned and contain all 7 original named animation clips',()=>{
 assert.equal(Object.keys(RIGGED_ASSETS).length,8);
 for(const name of Object.keys(RIGGED_ASSETS)){
  const file=new URL(name+'.glb',dir);
  assert.ok(existsSync(file),name+' must be self-hosted by release build');
  const data=readFileSync(file);
  assert.ok(data.byteLength>1000&&data.byteLength<8*1024*1024);
  const meta=parseMeta(data);
  assert.equal(meta.asset?.version,'2.0',name);
  assert.ok(meta.skins?.length>0,name+' is a real skinned mesh');
  const actions=new Set((meta.animations||[]).map(x=>x.name));
  for(const clip of RIGGED_CLIPS)assert.ok(actions.has(clip),name+' needs animation '+clip);
  assert.ok(meta.materials?.length>0);
  assert.ok((meta.images||[]).length>0 ||(meta.textures||[]).length>0 || (meta.materials||[]).length>0);
 }
});
test('prevent giant shader-skinned fighters: scale from local mesh vertices, never shrunk GLB scene bounds',()=>{
 const engine=source('./official-rigged-three-v264.entry.js');
 assert.match(engine,/object\.isSkinnedMesh/);
 assert.match(engine,/const height=Math\.max\(0,\.\.\.localHeights\)/);
 assert.match(engine,/const scale=targetHeight\/height/);
 assert.doesNotMatch(engine,/targetHeight\/size\.y/);
 for(const name of Object.keys(RIGGED_ASSETS)){
  const data=readFileSync(new URL(name+'.glb',dir));
  const json=parseMeta(data);
  const heights=(json.meshes||[]).flatMap(mesh=>(mesh.primitives||[]).map(p=>{
   const pos=json.accessors?.[p.attributes?.POSITION];return pos?.min&&pos?.max?pos.max[1]-pos.min[1]:0;
  }));
  assert.ok(heights.some(y=>y>.02&&y<20),name+' must have valid unscaled local geometry dimensions');
 }
});
test('Three.js production bundle exists on same-origin static server with working model urls',()=>{
 const bundled=new URL('./'+RIGGED_BUNDLE,root);
 assert.ok(existsSync(bundled));
 assert.ok(statSync(bundled).size>300000,'real Three.js GLTF + animation pipeline');
 const bundle=readFileSync(bundled,'utf8');
 assert.ok(bundle.includes('SkinnedMesh')||bundle.includes('skinIndex'),'actual skeleton support');
 assert.match(script,/fetch\(url/);
 assert.match(script,/checkGLB\(data,name\)/);
 assert.match(script,/RIGGED_LICENSE/);
 assert.doesNotMatch(script,/https?:\/\/(?:cdn\.jsdelivr|esm\.sh)/);
 const pkg=JSON.parse(source('./package.json'));
 assert.match(pkg.version,/beta\.(15|16|17|18)$/);
 assert.ok(pkg.dependencies.three&&pkg.dependencies.esbuild);
 assert.match(pkg.scripts['prestart:cloud'],/build:rigged3d/);
 assert.match(pkg.scripts['qa:all'],/build:rigged3d/);
});
test('authenticated team classes use genuine rigged character models',()=>{
 const hero=[...new Set(Object.values(RIGGED_HERO_MAP))];
 for(const model of hero)assert.ok(RIGGED_ASSETS[model]);
 assert.equal(riggedModelForUnit({team:0,heroId:'aldren'}),'KnightCaptain');
 assert.equal(riggedModelForUnit({team:0,heroId:'rovan'}),'Archer');
 assert.equal(riggedModelForUnit({team:0,heroId:'mira'}),'Priestess');
 assert.equal(riggedModelForUnit({team:1,type:'boss'}),'King');
 assert.equal(riggedModelForUnit({team:1,type:'raider'}),'Footman');
 assert.equal(riggedAnimationForUnit({hp:100,action:'attack'}),'Attack');
 assert.equal(riggedAnimationForUnit({hp:100,action:'cast'}),'Special');
 assert.equal(riggedAnimationForUnit({hp:100,action:'guard'}),'Special');
 assert.equal(riggedAnimationForUnit({hp:100,action:'hit'}),'Hit');
 assert.equal(riggedAnimationForUnit({hp:100,action:'idle'},true),'Run');
 assert.equal(riggedAnimationForUnit({hp:0}),'Death');
});
test('only finite SERVER-approved movement coordinates are accepted in the 3D engine',()=>{
 assert.equal(officialRiggedWorldPosition({x:NaN,y:30}),null);
 assert.equal(officialRiggedWorldPosition({x:20,y:Infinity}),null);
 assert.deepEqual(officialRiggedWorldPosition({x:50,y:30}),{x:0,z:0});
 assert.ok(Math.abs(officialRiggedWorldPosition({x:10000,y:-9000}).x)<=12);
 const mission={mode:'story',stage:1,startedAt:1760000000000,turn:1,lastTurnAt:1760000003100,
 playerHp:210,playerMaxHp:300,enemyHp:130,enemyMaxHp:180,enemyIntent:'crush',lastAction:'strike'};
 const room=officialBattleRoom(['aldren','lyra','rovan'],mission,{now:1760000005000});
 assert.equal(room.source,'authenticated-postgres');
 assert.equal(room.result,'server-only');
 for(const unit of [...room.players,...room.squads]){
  const pos=officialRiggedWorldPosition(unit);
  assert.ok(pos&&Number.isFinite(pos.x)&&Number.isFinite(pos.z));
 }
});
test('official game uses rigged WebGL on Render/GH pages and honest 2D fallback, not the old cube renderer',()=>{
 const director=source('./official-3d-director.js');
 const engine=source('./official-rigged-three-v264.entry.js');
 assert.match(director,/import\(premiumRiggedBundleUrl\(host\)\)/);
 assert.match(director,/mode='rigged3d'/);
 assert.match(director,/pendingCanvas/);
 assert.match(director,/preferred='2d'/);
 assert.doesNotMatch(director,/createGraphics3D|createBattleRenderer/);
 assert.match(engine,/GLTFLoader/);
 assert.match(engine,/SkeletonUtils\.js/);
 assert.match(engine,/THREE\.AnimationMixer/);
 assert.match(engine,/THREE\.ACESFilmicToneMapping/);
 assert.match(engine,/renderer\.shadowMap/);
 assert.match(engine,/scene\.fog/);
 assert.match(engine,/actor\.mixer\.update/);
 assert.match(engine,/room\.variant!=='official'/);
 assert.match(engine,/officialRiggedWorldPosition/);
 assert.doesNotMatch(engine,/accountProgressRequest|supabase|\.rpc\(|reward\.gold|setItem\(/);
 assert.equal(premiumRiggedBundleUrl('umutcandar.github.io'),'https://starfort-online-beta.onrender.com/starfort/assets/rigged/engine-v264.js');
 assert.equal(premiumRiggedBundleUrl('starfort-online-beta.onrender.com'),'./assets/rigged/engine-v264.js');
 assert.equal(officialGraphicsPreference({getItem:()=>null}),'3d');
 const client=createOfficialBattleDirector();
 assert.equal(client.mode(),'sprites');client.sync(null);client.destroy();
});
