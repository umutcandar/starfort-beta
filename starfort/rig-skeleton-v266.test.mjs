import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RIGGED_ASSETS} from './official-rigged-contract-v264.js';
function gltfJson(path){
 const buf=readFileSync(new URL(path,import.meta.url));
 assert.equal(buf.readUInt32LE(0),0x46546c67);
 const length=buf.readUInt32LE(12);
 return JSON.parse(buf.subarray(20,20+length).toString());
}
test('rigged GLB joint topology is compatible with the bone-bound equipment renderer',()=>{
 for(const name of Object.keys(RIGGED_ASSETS)){
  const data=gltfJson('./assets/rigged/'+name+'.glb');
  const nodes=data.nodes||[],joints=(data.skins||[]).flatMap(s=>s.joints||[]);
  const names=[...new Set(joints.map(i=>nodes[i]?.name||''))].filter(Boolean);
  assert.ok(joints.length>=5,name+' must have actual animation bones');
  assert.ok(names.length>=5,name+' needs named skeleton joints');
  // The CC0 pack deliberately obfuscates bone labels. Lock their current
  // topology so a future asset replacement cannot silently detach gear.
  for(const required of ['tvbace','b46s2a','vsfhv4','deh583'])
   assert.ok(names.includes(required),name+' missing equipment anchor '+required);
 }
});
