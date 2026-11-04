import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {combatAppearance,combatCameraFrame,battlefieldScatter} from './official-rigged-style-v265.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('seven distinct heroes receive independent, server-rule-neutral cosmetic identities',()=>{
 const ids=['aldren','lyra','rovan','mira','doran','vesper','eira'];
 const colors=ids.map(heroId=>combatAppearance({team:0,heroId}).accent);
 assert.equal(new Set(colors).size,ids.length);
 assert.notEqual(combatAppearance({team:0,heroId:'lyra'}).tint,
  combatAppearance({team:0,heroId:'mira'}).tint);
 assert.ok(combatAppearance({team:1,type:'boss'}).build>
  combatAppearance({team:1,type:'raider'}).build);
 for(const id of ids){
  const s=combatAppearance({team:0,heroId:id});
  assert.ok(s.build>=.9&&s.build<=1.2);
  assert.ok(s.head>=.85&&s.head<=1);
 }
});

test('adaptive three-quarter camera holds fighters larger on desktop, safe on mobile',()=>{
 const wide=combatCameraFrame(51,2.28,'balanced'),mobile=combatCameraFrame(51,.8,'performance');
 assert.ok(wide.distance<11);
 assert.ok(wide.fov<mobile.fov);
 assert.ok(mobile.distance>=wide.distance);
 assert.ok(Number.isFinite(combatCameraFrame(Infinity,NaN).distance));
 assert.ok(combatCameraFrame(10000,2).distance<=20.5);
 assert.ok(combatCameraFrame(-10000,2).distance>=8.6);
});

test('decor positions are deterministic and do not call random APIs',()=>{
 assert.deepEqual(battlefieldScatter(3,17),battlefieldScatter(3,17));
 assert.notDeepEqual(battlefieldScatter(3,17),battlefieldScatter(4,17));
 for(let i=0;i<30;i++){
  const p=battlefieldScatter(8,i);
  assert.ok(p.x>=-19&&p.x<=19&&p.z>=-12.5&&p.z<=12.5);
 }
 assert.doesNotMatch(read('./official-rigged-style-v265.js'),/Math\.random\(/);
});

test('Three.js renderer uses skeletal GLBs, per-actor PBR finish and no toy combat board',()=>{
 const s=read('./official-rigged-three-v264.entry.js');
 assert.match(s,/cloneSkinned\(gltf\.scene\)/);
 assert.match(s,/SkeletonUtils\.js/);
 assert.match(s,/RoomEnvironment/);
 assert.match(s,/PMREMGenerator/);
 assert.match(s,/combatAppearance\(unit\)/);
 assert.match(s,/mat\.clone\(\)/);
 assert.match(s,/style\.head/);
 assert.match(s,/battlefieldScatter\(stage,i\)/);
 assert.match(s,/const frame=combatCameraFrame/);
 assert.match(s,/grounded contact shadow/i);
 assert.doesNotMatch(s,/raised combat lane/i);
 assert.doesNotMatch(s,/new THREE\.TorusGeometry\(\.79,\.036/);
 assert.match(s,/actor\.ownedMaterials\.forEach\(m=>m\.dispose\(\)\)/);
});

test('weapon trails and impacts use server-authorized action and effects only',()=>{
 const renderer=read('./official-rigged-three-v264.entry.js');
 const bridge=read('./official-battle-bridge.js');
 const choreography=read('./official-3d-choreography-v259.js');
 assert.match(renderer,/const attack=animate&&\(desired==='Attack'\|\|desired==='Special'\)/);
 assert.match(renderer,/for\(const item of fx\|\|\[\]\)/);
 assert.match(renderer,/if\(!Number\.isFinite\(item\.t\)/);
 assert.match(renderer,/new THREE\.Points\(geometry/);
 assert.match(renderer,/const impacts=new Map\(\),life=1\.9/);
 assert.match(bridge,/officialClashEffects\(clash,now\)/);
 assert.match(choreography,/acceptedOfficialTurn\(previous,mission\)/);
 assert.doesNotMatch(renderer,/supabase|accountProgressRequest|reward\.gold|\.rpc\(/i);
});
