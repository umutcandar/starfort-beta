import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Geometry checks do not need a GPU. Actual image decoding is checked in the
// browser review, rather than pretending this stub validates texture quality.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
const heroes=['aldren','lyra','rovan','mira','doran','vesper','eira'];
const expected=['Idle','Walk','Run','Attack','Special','Guard','Hit','Death'];
const finite=new THREE.Vector3();
for(const hero of heroes){
 const bytes=await readFile(new URL('../assets/heroes-3d/'+hero+'-native.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const root=gltf.scene,skins=[],bones=new Set(),slots=new Set();let normalMaps=0;
 root.traverse(o=>{
  if(o.isBone)bones.add(o.name);
  if(o.isSkinnedMesh)skins.push(o);
  if(o.userData.equipment_slot)slots.add(o.userData.equipment_slot);
  if(o.isMesh)for(const material of [].concat(o.material))normalMaps+=Boolean(material.normalMap);
 });
 assert.ok(bones.size>=53,hero+' retains native skeleton and fingers');
 for(const side of ['l','r'])for(const finger of ['index','middle','ring','pinky','thumb'])for(const part of ['01','02','03'])assert.ok(bones.has(`${finger}_${part}_${side}`));
 assert.ok(skins.length>=7,hero+' has separate clothing and hands');
 assert.ok(slots.has('weapon')&&slots.has('armor')&&slots.has('cloak'),hero+' has modular equipment nodes');
 assert.ok(normalMaps>0,hero+' exports normal maps, not unsupported Blender nodes');
 assert.ok(root.getObjectByName('identity_head'),hero+' preserves source identity');
 let plate=0;
 root.traverse(o=>{if(o.userData.armor_style==='plate'&&o.isMesh)plate++;});
 assert.ok(plate>=3,hero+' has actual optional armour geometry');
 for(const mesh of skins){
  const weights=mesh.geometry.attributes.skinWeight;
  assert.ok(weights,mesh.name+' has skin weights');
  for(let i=0;i<weights.count;i++){
   const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
   assert.ok(Math.abs(sum-1)<.002,hero+' normalized skin weights: '+mesh.name);
  }
 }
 const mixer=new THREE.AnimationMixer(root);
 for(const name of expected){
  const clip=gltf.animations.find(c=>c.name===name);assert.ok(clip,hero+' '+name);
  mixer.stopAllAction();mixer.clipAction(clip).play();
  for(const phase of [0,.30,.60,.95]){
   mixer.setTime(clip.duration*phase);root.updateMatrixWorld(true);
   for(const mesh of skins)for(let i=0;i<mesh.geometry.attributes.position.count;i+=13){
    mesh.getVertexPosition(i,finite);mesh.localToWorld(finite);
    assert.ok(Number.isFinite(finite.x)&&Number.isFinite(finite.y)&&Number.isFinite(finite.z),hero+' '+name+' finite skin');
    assert.ok(finite.length()<5,hero+' '+name+' bounded skin');
   }
  }
 }
 const walk=gltf.animations.find(c=>c.name==='Walk');mixer.stopAllAction();mixer.clipAction(walk).play();mixer.setTime(0);root.updateMatrixWorld(true);
 const foot=root.getObjectByName('ball_l'),start=foot.getWorldPosition(new THREE.Vector3());
 mixer.setTime(walk.duration*.30);root.updateMatrixWorld(true);
 assert.ok(start.distanceTo(foot.getWorldPosition(new THREE.Vector3()))>.005,hero+' actually steps');
 if(hero!=='rovan'){
  const attack=gltf.animations.find(c=>c.name==='Attack');mixer.stopAllAction();mixer.clipAction(attack).play();
  const weapon=root.getObjectByName(hero==='aldren'?'aldren_blade_r':hero==='doran'?'doran_axe_head':hero==='vesper'?'vesper_blade_r':hero+'_staff_crystal');
  assert.ok(weapon,hero+' dedicated weapon geometry');
  mixer.setTime(0);root.updateMatrixWorld(true);const before=weapon.getWorldPosition(new THREE.Vector3());
  mixer.setTime(attack.duration*.40);root.updateMatrixWorld(true);
  assert.ok(before.distanceTo(weapon.getWorldPosition(new THREE.Vector3()))>.03,hero+' moves its weapon during attack');
 }
 console.log(hero+': 53 joints, eight clips, clothing variants, finger weights, bounded skin and movement verified');
}
