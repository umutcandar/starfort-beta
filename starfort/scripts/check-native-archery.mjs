import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
const bytes=await readFile(new URL('../assets/heroes-3d/rovan-native.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const root=gltf.scene;
const node=name=>{const object=root.getObjectByName(name);assert.ok(object,name+' exists');return object;};
const bow=node('rovan_bow');
const string=node('rovan_bowstring');
const limbs=node('rovan_bow_limbs');
const arrow=node('rovan_arrow');
assert.equal(bow.userData.equipment_slot,'weapon');
assert.ok(string.morphTargetDictionary.Draw!==undefined,'actual deforming string');
assert.ok(limbs.morphTargetDictionary.Draw!==undefined,'actual bending limbs');
assert.notEqual(node('rovan_arrow_shaft').geometry,string.geometry,'independent arrow geometry');
const mixer=new THREE.AnimationMixer(root);
const attack=gltf.animations.find(clip=>clip.name==='Attack');
assert.ok(attack,'archery clip');
mixer.clipAction(attack).play();
function sample(fraction){mixer.setTime(attack.duration*fraction);root.updateMatrixWorld(true);}
function ringCenter(mesh,start){
 const center=new THREE.Vector3();
 for(let i=start;i<start+8;i++)center.add(mesh.getVertexPosition(i,new THREE.Vector3()));
 return mesh.localToWorld(center.multiplyScalar(1/8));
}
sample(.2);
const loose=string.morphTargetInfluences[string.morphTargetDictionary.Draw];
sample(.59);
assert.ok(string.morphTargetInfluences[string.morphTargetDictionary.Draw]>.95,'string reaches full draw');
assert.ok(loose<.05,'draw starts after nocking');
const nock=ringCenter(string,8);
assert.ok(nock.distanceTo(arrow.getWorldPosition(new THREE.Vector3()))<.015,'arrow tail stays on string');
assert.ok(nock.distanceTo(node('hand_r').getWorldPosition(new THREE.Vector3()))<.12,'drawing hand stays at nock');
assert.ok(bow.getWorldPosition(new THREE.Vector3()).distanceTo(node('hand_l').getWorldPosition(new THREE.Vector3()))<.10,'bow grip stays in holding hand');
const holding=node('hand_r').getWorldPosition(new THREE.Vector3());
for(const fraction of [.35,.50,.59,.68]){
 sample(fraction);
 assert.ok(ringCenter(string,0).distanceTo(ringCenter(limbs,0))<.03,'lower tip attachment');
 assert.ok(ringCenter(string,16).distanceTo(ringCenter(limbs,64*8))<.03,'upper tip attachment');
}
sample(.76);
assert.ok(string.morphTargetInfluences[string.morphTargetDictionary.Draw]<.05,'string springs back after release');
assert.ok(node('hand_r').getWorldPosition(new THREE.Vector3()).distanceTo(holding)<.08,'drawing hand follows through behind string');
assert.ok(arrow.getWorldPosition(new THREE.Vector3()).distanceTo(nock)>1,'released arrow actually leaves bow');
console.log('Rovan: bow/hand contact, nock attachment, full draw, limb flex, release and arrow flight passed');
