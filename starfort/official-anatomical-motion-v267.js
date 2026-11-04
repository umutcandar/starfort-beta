/** STARFORT v2.51: human-rig animation adapter, visual only.
 * The source CC0 MakeHuman GLB has body-sized native idle/walk/run, not attacks.
 * All combat clips below are ORIGINAL procedural THREE keyframes, not mislabeled
 * stock mocap. They run only when the authenticated server has approved a turn.
 */
import * as THREE from 'three';
import {ANATOMICAL_MODEL,anatomicalPreset} from './official-anatomical-v267.js';

const clipLabels=Object.freeze({idle:'Idle',walk:'Walk',run:'Run'});
const poses=Object.freeze({
 Attack:{
  duration:.92,times:[0,.15,.31,.47,.64,.92],
  joints:{
   spine_03:[[0,0,0],[.05,-.25,-.09],[.1,.14,.2],[0,.36,.18],[.04,.18,.05],[0,0,0]],
   upperarm_r:[[0,0,0],[-.85,-.15,-.22],[-1.1,-.4,.08],[.15,.64,.35],[.25,.30,.1],[0,0,0]],
   lowerarm_r:[[0,0,0],[-.2,0,-.3],[-.45,0,0],[.3,0,-.45],[.13,0,-.18],[0,0,0]],
   pelvis:[[0,0,0],[.06,-.12,0],[.10,.16,0],[.11,.24,0],[.04,.1,0],[0,0,0]]
  }
 },
 Special:{
  duration:1.12,times:[0,.14,.35,.59,.83,1.12],
  joints:{
   spine_03:[[0,0,0],[0,-.08,0],[-.12,0,0],[-.1,.09,0],[-.05,0,0],[0,0,0]],
   upperarm_l:[[0,0,0],[-.38,0,-.23],[-.88,0,-.50],[-.96,-.14,-.43],[-.30,0,-.14],[0,0,0]],
   upperarm_r:[[0,0,0],[-.38,0,.23],[-.88,0,.50],[-.96,.14,.43],[-.30,0,.14],[0,0,0]],
   lowerarm_l:[[0,0,0],[-.25,.18,0],[-.47,.12,0],[-.42,0,0],[-.1,0,0],[0,0,0]],
   lowerarm_r:[[0,0,0],[-.25,-.18,0],[-.47,-.12,0],[-.42,0,0],[-.1,0,0],[0,0,0]]
  }
 },
 Guard:{
  duration:.85,times:[0,.15,.36,.56,.74,.85],
  joints:{
   spine_03:[[0,0,0],[-.09,0,0],[-.15,0,0],[-.15,0,0],[-.04,0,0],[0,0,0]],
   upperarm_l:[[0,0,0],[-.64,0,-.5],[-.9,.1,-.62],[-.9,.1,-.62],[-.3,0,-.2],[0,0,0]],
   upperarm_r:[[0,0,0],[-.55,0,.42],[-.78,-.12,.57],[-.78,-.12,.57],[-.3,0,.2],[0,0,0]]
  }
 },
 Hit:{
  duration:.62,times:[0,.09,.20,.36,.50,.62],
  joints:{
   spine_03:[[0,0,0],[.25,0,.16],[.34,-.13,-.13],[.19,-.04,.05],[.05,0,0],[0,0,0]],
   head:[[0,0,0],[.16,-.07,.06],[.3,-.1,0],[.10,0,0],[.04,0,0],[0,0,0]],
   upperarm_r:[[0,0,0],[.17,0,.22],[.3,0,.30],[.17,0,.10],[.05,0,0],[0,0,0]],
   upperarm_l:[[0,0,0],[.16,0,-.18],[.27,0,-.27],[.15,0,-.08],[.04,0,0],[0,0,0]]
  }
 },
 Death:{
  duration:1.40,times:[0,.24,.50,.85,1.18,1.40],
  joints:{
   pelvis:[[0,0,0],[.12,0,0],[.27,0,.15],[.40,0,.25],[.43,0,.28],[.43,0,.28]],
   spine_03:[[0,0,0],[.18,0,.1],[.48,0,.28],[.80,0,.35],[.92,0,.34],[.92,0,.34]],
   head:[[0,0,0],[.15,0,0],[.35,0,.1],[.51,0,.18],[.51,0,.18],[.51,0,.18]]
  }
 }
});
function quaternionTrack(model,name,angles,times){
 const bone=model.getObjectByName(name);
 if(!bone?.isBone)throw Error('Anatomical rig missing pose joint '+name);
 const rest=bone.quaternion.clone(),values=[];
 for(const [x,y,z] of angles){
  const q=rest.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'))).normalize();
  values.push(q.x,q.y,q.z,q.w);
 }
 return new THREE.QuaternionKeyframeTrack(name+'.quaternion',times,values);
}
export function prepareAnatomicalClips(gltf){
 const clipByName=new Map(gltf.animations.map(clip=>[clip.name.toLowerCase(),clip]));
 const converted=[];
 for(const [name,target] of Object.entries(clipLabels)){
  const base=clipByName.get(name);
  if(!base)throw Error('Missing human movement clip '+name);
  const clip=base.clone();clip.name=target;converted.push(clip);
 }
 for(const [name,pose] of Object.entries(poses)){
  const tracks=Object.entries(pose.joints).map(([bone,values])=>
   quaternionTrack(gltf.scene,bone,values,pose.times));
  converted.push(new THREE.AnimationClip(name,pose.duration,tracks));
 }
 return {...gltf,animations:converted};
}
export function applyAnatomicalPreset(model,unit){
 const preset=anatomicalPreset(unit);
 const values={gender_female:preset.sex==='female'?1:0,gender_male:preset.sex==='male'?1:0,
   age_old:preset.age,weight_heavy:Math.max(0,preset.build),
   weight_light:Math.max(0,-preset.build),height_tall:Math.max(0,preset.height),
   height_short:Math.max(0,-preset.height)};
 let updated=0;
 model.traverse(obj=>{
  const dict=obj.morphTargetDictionary,weights=obj.morphTargetInfluences;
  if(!dict||!weights)return;
  for(const [name,value]of Object.entries(values)){
   const slot=dict[name];if(Number.isInteger(slot)&&slot>=0&&slot<weights.length){
    weights[slot]=Math.max(0,Math.min(1,value));updated++;
   }
  }
 });
 return updated;
}
export function anatomicalClipNames(){return Object.freeze(['Idle','Walk','Run',...Object.keys(poses)]);}
