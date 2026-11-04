import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createRiggedEquipment,riggedGearProfile,riggedEquipmentBone} from './official-rigged-equipment-v266.js';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const heroIds=['aldren','lyra','rovan','mira','doran','vesper','eira'];
test('seven heroes own distinct weapons, helmets, silhouettes and CC0 rig anchoring',()=>{
 const styles=heroIds.map(heroId=>riggedGearProfile({team:0,heroId}));
 assert.equal(styles.length,7);
 assert.equal(new Set(styles.map(s=>s.kind)).size,7);
 assert.equal(styles.find(s=>s.kind==='ranger').weapon,'bow');
 assert.equal(styles.find(s=>s.kind==='guardian').weapon,'hammer');
 assert.equal(styles.find(s=>s.kind==='assassin').offhand,'dagger');
 assert.equal(styles.find(s=>s.kind==='sorceress').weapon,'firestaff');
 assert.equal(styles.find(s=>s.kind==='knight').head,'visor');
 for(const slot of ['pelvis','chest','head','wristR','wristL','shoulderR','shoulderL','shinR'])
  assert.match(riggedEquipmentBone(slot),/^[a-z0-9]{6}$/);
 assert.equal(riggedEquipmentBone('no-such-bone'),null);
});
test('boss and raider do not share armour/weapon profile',()=>{
 const boss=riggedGearProfile({team:1,type:'boss'});
 const raider=riggedGearProfile({team:1,type:'raider'});
 assert.equal(boss.weapon,'greatsword');assert.equal(raider.weapon,'axe');
 assert.equal(boss.head,'crown');assert.equal(raider.head,'mask');
});
test('all seven hero gear kits create true reusable 3D meshes and dispose cleanly without WebGL',()=>{
 for(const heroId of heroIds){
  const root=new THREE.Group(),model=new THREE.Group();
  const gear=createRiggedEquipment(root,model,{team:0,heroId},{quality:'performance'});
  let count=0;gear.root.traverse(node=>{if(node.isMesh)count++;});
  assert.ok(count>20,heroId+' needs actual armour geometry');
  assert.ok(count<140,heroId+' must stay within mobile draw-call budget');
  assert.ok(gear.anchors>=7,'rig animation must have enough articulation links');
  assert.equal(root.children.length,1);
  gear.update(0,'Idle');gear.update(0.9,'Attack');gear.update(1.4,'Run');
  gear.dispose();gear.dispose();
  assert.equal(root.children.length,0,'equipment buffers must detach on teardown');
 }
});
test('rendered effect and hero equipment remain separate from server reward/action logic',()=>{
 const equip=src('./official-rigged-equipment-v266.js');
 const render=src('./official-rigged-three-v264.entry.js');
 assert.match(render,/createRiggedEquipment\(root,model,unit,\{quality\}\)/);
 assert.match(render,/actor\.equipment\.update\(time,desired,animate\)/);
 assert.match(render,/actor\.equipment\.dispose\(\)/);
 assert.match(equip,/model\.getObjectByName\(BONES\[slot\]\)/);
 assert.match(equip,/riggedGearProfile\(unit\)/);
 assert.match(equip,/cape\.geometry\.computeVertexNormals/);
 assert.doesNotMatch(equip,/accountProgressRequest|supabase|\.rpc\(|reward\.gold|setItem\(/i);
});
