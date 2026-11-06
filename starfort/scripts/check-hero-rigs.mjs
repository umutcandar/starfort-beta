import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Geometry-only validation supplies an image handle; browser QA decodes textures.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
const names=['aldren','lyra','rovan','mira','doran','vesper','eira'];
for(const name of names){
 const buffer=await readFile(new URL('../assets/heroes-3d/'+name+'-rigged.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
 assert.ok(meshes.length>0,name+' requires deforming geometry');
 for(const required of ['Idle','Walk','Run','Attack','Special','Guard','Hit','Death'])assert.ok(gltf.animations.some(c=>c.name===required),required);
 for(const mesh of meshes){
  const weights=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<weights.count;i++)assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<.002,'normalized weights');
 }
 // Rigid accessories keep pairwise distances even during an attack.
 if(['aldren','lyra','mira','eira'].includes(name)){
  for(const mesh of meshes){
   const count=mesh.userData.rigid_accessory_vertices;
   assert.ok(count>100,name+' accessory binding metadata');
   const hand=name==='eira'?'hand_L':'hand_R';
   const joint=mesh.skeleton.bones.findIndex(b=>b.name===hand);
   const indices=mesh.geometry.attributes.skinIndex;
   const weights=mesh.geometry.attributes.skinWeight;
   const bound=[];
   for(let i=0;i<weights.count;i++)if(indices.getX(i)===joint&&weights.getX(i)>.9999)bound.push(i);
   assert.ok(bound.length>=count,name+' accessory vertices stay on their hand');
   const pair=[bound[0],bound[bound.length-1]];
   const point=index=>mesh.applyBoneTransform(index,new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,index));
   gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
   const restDistance=point(pair[0]).distanceTo(point(pair[1]));
   const probe=new THREE.AnimationMixer(gltf.scene);
   const attack=gltf.animations.find(c=>c.name==='Attack');probe.clipAction(attack).play();probe.setTime(attack.duration*.42);
   gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
   assert.ok(Math.abs(point(pair[0]).distanceTo(point(pair[1]))-restDistance)<.0001,name+' rigid accessory length');
   probe.stopAllAction();probe.uncacheRoot(gltf.scene);
  }
 }
 const mixer=new THREE.AnimationMixer(gltf.scene);
 let animatedDisplacement=0;
 for(const clip of gltf.animations){
  const action=mixer.clipAction(clip);action.play();
  for(const t of [0,.25,.5,.75,1]){
   mixer.setTime(t*clip.duration);gltf.scene.updateMatrixWorld(true);
   for(const mesh of meshes){mesh.skeleton.update();
    for(let i=0;i<mesh.geometry.attributes.position.count;i+=31){
     const v=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i);
     const rest=v.clone();
     mesh.applyBoneTransform(i,v);
     if(clip.name==='Walk')animatedDisplacement=Math.max(animatedDisplacement,v.distanceTo(rest));
     assert.ok(v.toArray().every(Number.isFinite),name+' '+clip.name);
     assert.ok(v.length()<7,name+' '+clip.name+' runaway vertex');
    }
   }
  }
  mixer.stopAllAction();
 }
 assert.ok(animatedDisplacement>.003,name+' walking must deform vertices');
 console.log(name+': skin weights and '+gltf.animations.length+' clips passed');
}
