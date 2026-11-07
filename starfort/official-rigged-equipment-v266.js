/** STARFORT v2.50 — original modular fantasy armour, weapons and animated cloth.
 * Display-only: never reads/writes health, damage, account, currency or RPC.
 * Works with the existing commercially usable CC0 Gobkit skeletons.
 * Geometry is authored for STARFORT in Three.js; every buffer/material is owned
 * by its fighter and explicitly disposed with that fighter.
 */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {combatAppearance} from './official-rigged-style-v265.js';

const BONES=Object.freeze({
 pelvis:'kynnpa',chest:'b46s2a',neck:'gb9m4b',head:'tvbace',
 shoulderR:'wx9ery',wristR:'vsfhv4',shoulderL:'tuy4up',wristL:'deh583',
 thighR:'xamxkb',shinR:'gpwkp6',thighL:'u3pz5t',shinL:'q4udtn'
});
const HUMAN_BONES=Object.freeze({
 pelvis:'pelvis',chest:'spine_03',neck:'neck_01',head:'head',
 shoulderR:'upperarm_r',wristR:'hand_r',shoulderL:'upperarm_l',wristL:'hand_l',
 thighR:'thigh_r',shinR:'calf_r',thighL:'thigh_l',shinL:'calf_l'
});
// Identified from skins[].joints and the rest-pose parent/translation tree,
// not guessed from the randomized node labels.
const HERO_KITS=Object.freeze({
 aldren:{kind:'knight',weapon:'sword',offhand:'shield',head:'visor',cape:true,plate:true},
 lyra:{kind:'cleric',weapon:'staff',offhand:'orb',head:'hood',cape:true,plate:false},
 rovan:{kind:'royal-gunner',weapon:'energy-cannon',offhand:'support',head:'open',cape:true,plate:true},
 mira:{kind:'sorceress',weapon:'firestaff',offhand:'orb',head:'crown',cape:true,plate:false},
 doran:{kind:'guardian',weapon:'hammer',offhand:'shield',head:'visor',cape:true,plate:true},
 vesper:{kind:'assassin',weapon:'dagger',offhand:'dagger',head:'mask',cape:true,plate:false},
 eira:{kind:'druid',weapon:'branch',offhand:'orb',head:'circlet',cape:true,plate:false}
});
const ENEMY_KITS=Object.freeze({
 raider:{kind:'raider',weapon:'axe',offhand:'shield',head:'mask',cape:false,plate:false},
 caster:{kind:'warlock',weapon:'firestaff',offhand:'orb',head:'hood',cape:true,plate:false},
 archer:{kind:'raider',weapon:'bow',offhand:'quiver',head:'hood',cape:false,plate:false},
 boss:{kind:'overlord',weapon:'greatsword',offhand:'shield',head:'crown',cape:true,plate:true}
});
export function riggedGearProfile(unit){
 return unit?.team===0?(HERO_KITS[unit?.heroId]||HERO_KITS.aldren):
  (ENEMY_KITS[unit?.type]||ENEMY_KITS.raider);
}
export function riggedEquipmentBone(slot,rig='gobkit'){return (rig==='human'?HUMAN_BONES:BONES)[slot]||null;}

const sin=Math.sin,PI=Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const vec=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const tmpWorld=new THREE.Vector3(),tmpQuat=new THREE.Quaternion(),tmpRootQuat=new THREE.Quaternion();
const inv=new THREE.Quaternion(),localQ=new THREE.Quaternion();

export function createRiggedEquipment(actorRoot,model,unit,{quality='balanced',reducedMotion=false,rig='gobkit'}={}){
 const kit=riggedGearProfile(unit),style=combatAppearance(unit);
 const isBoss=unit?.type==='boss',scale=isBoss?1.23:1;
 const decoration=new THREE.Group();decoration.name='STARFORT-original-armour-'+(unit?.heroId||unit?.type||'unit');
 actorRoot.add(decoration);
 const geometries=new Set(),materials=new Set(),anchors=[];
 const detail=quality==='performance'?8:16;
 const metal=new THREE.MeshStandardMaterial({color:style.steel,metalness:.76,roughness:.29});
 const bright=new THREE.MeshStandardMaterial({color:style.accent,metalness:.68,roughness:.36});
 const black=new THREE.MeshStandardMaterial({color:0x242831,metalness:.35,roughness:.53});
 const leather=new THREE.MeshStandardMaterial({color:unit?.team===0?0x453a34:0x382c2c,roughness:.88});
 const cloth=new THREE.MeshStandardMaterial({color:style.tint,metalness:0,roughness:.94,
  side:THREE.DoubleSide});
 const emissive=new THREE.MeshStandardMaterial({color:style.accent,emissive:style.accent,
  emissiveIntensity:.52,metalness:.25,roughness:.26});
 // The Royal Gunner's sapphire reaction chamber remains visually distinct from gold armour.
 const energy=new THREE.MeshStandardMaterial({color:0x2f8fe7,emissive:0x126afa,
  emissiveIntensity:1.9,metalness:.25,roughness:.18});
 const hair=new THREE.MeshStandardMaterial({color:0xc79555,metalness:.1,roughness:.76});
 const flashMat=new THREE.MeshBasicMaterial({color:0x8bcfff,transparent:true,
  opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending});
 const mat=[metal,bright,black,leather,cloth,emissive,energy,hair,flashMat];
 mat.forEach(m=>materials.add(m));
 const add=(group,geo,material,x=0,y=0,z=0)=>{
  geometries.add(geo);
  const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 const ell=(g,material,x,y,z,w,h,d)=>{
  const m=add(g,new THREE.SphereGeometry(1,detail,Math.max(6,Math.round(detail*.7))),material,x,y,z);
  m.scale.set(w,h,d);return m;
 };
 const box=(g,material,x,y,z,w,h,d,rot=0)=>{
  const m=add(g,new THREE.BoxGeometry(w,h,d),material,x,y,z);m.rotation.z=rot;return m;
 };
 const tube=(g,points,r,material)=>{
  return add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>vec(...p))),
   Math.max(8,points.length*5),r,6,false),material);
 };
 const cylinder=(g,material,x,y,z,rt,rb,h,segments=detail)=>{
  return add(g,new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z);
 };
 const cone=(g,material,x,y,z,r,h)=>cylinder(g,material,x,y,z,0,r,h,detail);
 const anchor=(slot,position)=>{
  const g=new THREE.Group();g.position.copy(position);decoration.add(g);
  const bone=model.getObjectByName(riggedEquipmentBone(slot,rig));
  anchors.push({group:g,position:position.clone(),bone:bone?.isBone?bone:null,
   start:null,restRotation:null});
  return g;
 };
 const body=anchor('chest',vec(0,1.51,0));
 const head=anchor('head',vec(0,2.30,0));
 const shoulderR=anchor('shoulderR',vec(.49,1.90,0));
 const shoulderL=anchor('shoulderL',vec(-.49,1.90,0));
 const foreR=anchor('wristR',vec(.57,1.38,.20));
 const foreL=anchor('wristL',vec(-.57,1.38,.20));
 const kneeR=anchor('shinR',vec(.27,.68,.15));
 const kneeL=anchor('shinL',vec(-.27,.68,.15));
 const isCaster=['cleric','sorceress','warlock','druid'].includes(kit.kind);
 const isLeather=['ranger','raider','assassin'].includes(kit.kind);
 // Breastplate and anatomical tapered faulds
 ell(body,kit.plate?metal:isLeather?leather:cloth,0,.00,.205,.45,.54,.27);
 ell(body,kit.plate?metal:isLeather?leather:cloth,0,-.33,.19,.34,.27,.20);
 if(kit.plate){
  ell(body,bright,0,.16,.433,.27,.085,.047);
  box(body,black,0,.05,.461,.41,.045,.035);
  for(let i=0;i<3;i++)box(body,metal,0,-.34-i*.077,.375-i*.018,.60-i*.035,.067,.12);
 }else if(isCaster){
  ell(body,bright,0,.08,.433,.12,.20,.043);
  for(let i=0;i<3;i++)ell(body,bright,0,-.28-i*.12,.23,.28-i*.025,.035,.09);
 }else{
  box(body,bright,0,-.28,.372,.73,.082,.055);
  for(let side of [-1,1])box(body,black,side*.27,.02,.409,.07,.72,.065,.08*side);
 }
 // Belts, clasps and multiple articulated plate segments
 box(body,leather,0,-.46,.34,.78,.17,.10);
 cylinder(body,bright,0,-.46,.402,.12,.12,.07);
 const buckle=ell(body,black,0,-.46,.452,.057,.057,.022);buckle.castShadow=false;
 if(isCaster){
  for(const x of [-.29,.29]){
   const hem=ell(body,cloth,x,-.73,-.035,.22,.55,.16);hem.rotation.z=x*.3;
  }
 }else{
  for(const x of [-.25,0,.25])box(body,kit.plate?metal:leather,x,-.69,.18,.22,.36,.16);
 }
 // Shoulders, articulated upper-arm shells and forearm bracers
 for(const [side,g,fore,knee]of [[1,shoulderR,foreR,kneeR],[-1,shoulderL,foreL,kneeL]]){
  ell(g,kit.plate?metal:leather,0,-.06,.03,kit.plate?.34:.25,kit.plate?.31:.24,.30);
  ell(g,bright,0,.12,.13,.23,.075,.12);
  if(kit.plate){
   for(let i=0;i<3;i++)box(g,metal,side*.035,-.20-i*.088,.05,.47-i*.05,.074,.35);
  }
  ell(fore,kit.plate?metal:leather,0,-.08,.01,.18,.27,.18);
  ell(fore,bright,0,-.27,.035,.17,.06,.15);
  if(kit.plate){
   ell(knee,metal,0,-.05,.12,.18,.23,.20);
   ell(knee,bright,0,.10,.265,.13,.042,.06);
  }else ell(knee,leather,0,0,.07,.145,.17,.16);
 }
 // Human-sized helmet or cowl obscures the oversized toy-like face shape
 if(kit.head==='visor'){
  ell(head,metal,0,.11,0,.335,.39,.35);
  box(head,black,0,-.055,.32,.51,.095,.085);
  box(head,bright,0,-.055,.375,.54,.026,.04);
  box(head,metal,0,-.16,.255,.13,.21,.16);
  cylinder(head,bright,0,.51,0,.06,.10,.20);
  if(kit.kind==='guardian'){
   tube(head,[[0,.52,0],[0,.76,-.03],[0,.70,-.28]],.075,bright);
  }
 }else if(kit.head==='hood'){
  const hood=add(head,new THREE.ConeGeometry(.51,.74,detail,1,false),cloth,0,.27,-.055);
  hood.rotation.y=PI/4;
  ell(head,black,0,-.04,.18,.31,.27,.25);
  tube(head,[[-.31,-.11,.30],[0,-.29,.38],[.31,-.11,.30]],.06,bright);
 }else if(kit.head==='open'){
  // Keep the anatomical GLB face uncovered; build separated blond hair tufts.
  // No giant opaque helmet or cartoon visor over the realistic human head.
  for(let i=0;i<10;i++){
   const angle=i*PI*2/10;
   const tuft=ell(head,hair,sin(angle)*.245,.31+sin(i*1.7)*.055,Math.cos(angle)*.205,
     .16,.22,.13);
   tuft.rotation.z=-sin(angle)*.38;
  }
  ell(head,hair,0,.46,-.09,.30,.12,.29);
  for(let i=0;i<5;i++){
   const lock=ell(head,hair,-.23+i*.105,.38+i*.025,.20,.09,.20,.11);
   lock.rotation.z=-.55;
  }
  // Back of the tall royal tunic collar sits below the head, not through the jaw.
  box(body,bright,-.34,.44,-.16,.11,.28,.22,-.14);
  box(body,bright,.34,.44,-.16,.11,.28,.22,.14);
 }else if(kit.head==='mask'){
  ell(head,black,0,-.04,.12,.34,.32,.35);
  box(head,metal,0,-.10,.396,.46,.15,.055);
  for(const x of [-.18,.18])box(head,bright,x,-.08,.437,.10,.025,.038);
 }else if(kit.head==='crown'){
  ell(head,metal,0,-.14,.035,.29,.22,.30);
  cylinder(head,bright,0,.31,0,.34,.34,.14);
  for(let i=0;i<7;i++){
   const angle=i*PI*2/7;
   cone(head,metal,sin(angle)*.31,.49,Math.cos(angle)*.31,.085,.29);
  }
 }else{
  tube(head,[[-.38,.22,0],[-.27,.47,.06],[0,.51,.10],[.27,.47,.06],[.38,.22,0]],.07,bright);
  ell(head,emissive,0,.48,.13,.09,.075,.055);
 }
 // Hero-specific insignias, gem placement and collar
 ell(body,emissive,0,.12,.455,.086,.14,.055);
 for(const x of [-.26,.26])ell(body,bright,x,.30,.25,.10,.13,.11);
 if(kit.kind==='overlord'){
  for(const x of [-.33,.33])cone(shoulderR,bright,x,.30,-.13,.13,.57);
 }
 if(kit.kind==='royal-gunner'){
  // Gold heraldic plates, blue cartridges, dark leather harness and gilded pauldrons.
  const star=add(body,new THREE.OctahedronGeometry(.16,0),bright,0,.19,.48);
  star.scale.set(.8,1.1,.45);
  for(const side of [-1,1]){
   box(body,leather,side*.23,.01,.47,.085,.66,.11,-side*.18);
   for(let i=0;i<5;i++){
    const feather=ell(side===1?shoulderR:shoulderL,bright,
      side*(.07+i*.052),.19-i*.073,.13,.075,.17-i*.014,.075);
    feather.rotation.z=-side*.42;
   }
   const shin=side===1?kneeR:kneeL;
   box(shin,bright,0,-.19,.27,.16,.36,.06);
   ell(shin,energy,0,.045,.292,.055,.07,.026);
  }
  // Royal ammo cells are ornamental and do not change real server inventory.
  for(let i=0;i<4;i++){
   const x=-.33+i*.12;
   cylinder(body,bright,x,-.64,.48,.055,.055,.30,10);
   cylinder(body,energy,x,-.62,.48,.049,.049,.16,10);
  }
 }
 // All weapon meshes follow forearm rotation relative to the first rig pose.
 const weapon=new THREE.Group();foreR.add(weapon);
 weapon.position.set(.06,-.30,.28);weapon.rotation.z=-.17;
 function blade(g,length=1.10,wide=.11){
  cylinder(g,leather,0,.05,0,.055,.06,.38);
  cylinder(g,bright,0,.22,0,.12,.12,.075);
  box(g,metal,0,.61,0,wide,length*.63,.068);
  const tip=add(g,new THREE.ConeGeometry(wide*.79,length*.33,4),metal,0,.62+length*.48,0);
  tip.rotation.y=PI/4;
  box(g,bright,0,.26,0,.48,.055,.10);
  ell(g,bright,0,-.17,0,.08,.08,.08);
 }
 function makeAxe(g){
  cylinder(g,leather,0,.29,0,.057,.068,1.55);
  const edge=add(g,new THREE.ConeGeometry(.42,.7,3),metal,.28,.96,0);
  edge.rotation.z=-PI/2;edge.scale.z=.35;
  box(g,bright,0,.96,0,.56,.12,.12);
 }
 function makeHammer(g){
  cylinder(g,leather,0,.27,0,.075,.09,1.55);
  box(g,metal,0,1.02,0,.88,.35,.42);
  for(const x of [-.45,.45])ell(g,bright,x,1.02,0,.14,.21,.24);
 }
 function makeStaff(g,flame=false,branch=false){
  cylinder(g,branch?leather:metal,0,.45,0,.055,.065,1.95,detail);
  if(branch){
   tube(g,[[0,1.15,0],[-.20,1.50,0],[-.09,1.78,0]],.045,leather);
   tube(g,[[0,1.31,0],[.28,1.59,0],[.22,1.78,0]],.045,leather);
  }else{
   ell(g,metal,0,1.54,0,.23,.18,.23);
   tube(g,[[-.25,1.39,0],[0,1.87,0],[.25,1.39,0]],.05,bright);
  }
  const crystal=add(g,new THREE.OctahedronGeometry(flame?.24:.19,0),emissive,0,1.66,0);
  crystal.rotation.y=.4;
 }
 // Along the local Y-axis before a 90-degree turn; works with the existing hand rig.
 let royalMuzzle=null,royalBarrel=null;
 function makeRoyalCannon(g){
  const cannon=new THREE.Group();cannon.rotation.z=-PI/2;
  cannon.position.set(-.05,.18,.12);g.add(cannon);
  royalBarrel=cannon;
  // Rear stock and leather pistol grip.
  box(cannon,metal,0,-.47,0,.34,.58,.23);
  box(cannon,bright,0,-.75,.01,.42,.12,.29);
  box(cannon,leather,0,-.25,-.20,.12,.43,.13,-.2);
  box(cannon,black,0,.08,-.10,.34,.62,.33);
  box(cannon,metal,0,.18,0,.37,.70,.29);
  for(const sign of [-1,1]){
   box(cannon,bright,sign*.21,.13,.02,.065,.66,.25);
   box(cannon,bright,sign*.23,.49,.01,.11,.24,.21,sign*.10);
  }
  // Blue reactor core is a REAL illuminated 3D volume, not an image plane.
  cylinder(cannon,energy,0,.23,.02,.185,.185,.31,detail);
  for(let i=0;i<3;i++){
   const ring=cylinder(cannon,bright,0,.06+i*.17,.02,.225,.225,.045,detail);
   ring.scale.z=.85;
  }
  // Reinforced muzzle and concentric blue energy barrel.
  cylinder(cannon,black,0,.89,0,.205,.205,1.03,detail);
  cylinder(cannon,energy,0,.89,0,.147,.147,.99,detail);
  for(let i=0;i<5;i++){
   const band=cylinder(cannon,i%2?metal:bright,0,.59+i*.155,0,.215,.215,.055,detail);
   band.scale.z=.88;
  }
  cylinder(cannon,bright,0,1.43,0,.29,.26,.17,detail);
  cylinder(cannon,black,0,1.54,0,.245,.245,.065,detail);
  cylinder(cannon,energy,0,1.58,0,.175,.175,.035,detail);
  // Decorated scope, sight lenses and golden engraved wing-like fins.
  cylinder(cannon,black,0,.01,.43,.10,.10,.43,detail);
  cylinder(cannon,bright,0,.22,.43,.125,.125,.09,detail);
  cylinder(cannon,energy,0,.27,.43,.075,.075,.02,detail);
  for(let side of [-1,1]){
   for(let i=0;i<4;i++){
    const wing=ell(cannon,bright,side*(.20+i*.082),.19-i*.07,.13,
      .12,.22-i*.022,.06);
    wing.rotation.z=side*.5;
   }
   tube(cannon,[[side*.18,.31,.16],[side*.26,.62,.16],
     [side*.23,1.07,.13]],.026,bright);
  }
  royalMuzzle=ell(cannon,flashMat,0,1.73,0,.17,.30,.17);
  royalMuzzle.visible=false;
 }
 function makeBow(g){
  tube(g,[[0,-.20,0],[.22,.08,0],[.35,.51,0],[.22,.98,0],[0,1.25,0]],.066,leather);
  tube(g,[[0,-.20,0],[-.035,.54,0],[0,1.25,0]],.016,bright);
  box(g,black,0,.54,0,.16,.25,.10);
 }
 if(kit.weapon==='sword'||kit.weapon==='greatsword')blade(weapon,kit.weapon==='greatsword'?1.55:1.10,kit.weapon==='greatsword'?.18:.11);
 else if(kit.weapon==='dagger')blade(weapon,.65,.09);
 else if(kit.weapon==='axe')makeAxe(weapon);
 else if(kit.weapon==='hammer')makeHammer(weapon);
 else if(kit.weapon==='bow')makeBow(weapon);
 else if(kit.weapon==='energy-cannon')makeRoyalCannon(weapon);
 else makeStaff(weapon,kit.weapon==='firestaff',kit.weapon==='branch');
 const offhand=new THREE.Group();foreL.add(offhand);
 offhand.position.set(-.04,-.29,.25);
 if(kit.offhand==='shield'){
  const shield=add(offhand,new THREE.SphereGeometry(1,detail,detail),metal,-.08,-.17,.17);
  shield.scale.set(.40,.53,.11);
  ell(offhand,bright,-.08,-.17,.30,.12,.13,.038);
  tube(offhand,[[-.34,.17,.275],[-.39,-.13,.32],[-.08,-.65,.29],[.23,-.13,.32],[.18,.17,.275]],.031,bright);
 }else if(kit.offhand==='dagger'){
  blade(offhand,.63,.08);offhand.rotation.z=.4;
 }else if(kit.offhand==='support'){
  // Left gauntlet is left free for a natural two-handed gun pose.
  ell(offhand,bright,0,-.09,.015,.16,.10,.15);
 }else if(kit.offhand==='quiver'){
  const quiver=anchor('chest',vec(-.40,1.43,-.39));
  cylinder(quiver,leather,0,.08,0,.16,.13,.72);
  for(let i=0;i<5;i++){
   cylinder(quiver,bright,(i-2)*.055,.52,.0,.019,.019,.52,6);
   cone(quiver,cloth,(i-2)*.055,.84,0,.055,.17);
  }
 }else{
  ell(offhand,emissive,-.08,-.13,.2,.17,.19,.17);
  const aura=add(offhand,new THREE.TorusGeometry(.29,.018,6,34),bright,-.08,-.13,.2);
  aura.rotation.x=.32;
 }
 // Organic cloth cape with vertex deformation — follows torso, never cardboard-stiff.
 let cape=null,baseCape=null;
 if(kit.cape){
  const segments=quality==='performance'?5:10,rows=quality==='performance'?7:13;
  const verts=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
   const t=j/rows,x=(i/segments-.5)*(.83+t*.53);
   verts.push(x,.38-t*1.65,-.34-t*.25);uv.push(i/segments,t);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
   const a=j*(segments+1)+i,b=a+segments+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  cape=add(body,geo,cloth);baseCape=Float32Array.from(verts);
  for(let side of [-1,1]){
   ell(body,bright,side*.40,.34,-.25,.10,.11,.11);
  }
 }
 // Merge armour pieces sharing a material into one draw call per articulated
 // anchor. The cape stays separate because its vertices move on every frame.
 // This is essential for mobile GPU bandwidth and avoids external mesh engines.
 function batchStatic(group){
  for(const child of [...group.children])if(child.isGroup)batchStatic(child);
  const batches=new Map();
  for(const child of group.children){
   if(!child.isMesh||child===cape||!child.geometry||!child.material?.uuid)continue;
   const attrs=Object.keys(child.geometry.attributes).sort().join(',');
   const key=child.material.uuid+':'+Boolean(child.geometry.index)+':'+attrs;
   if(!batches.has(key))batches.set(key,[]);
   batches.get(key).push(child);
  }
  for(const meshes of batches.values()){
   if(meshes.length<2)continue;
   const clones=meshes.map(mesh=>{
    mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);
   });
   const combined=mergeGeometries(clones,false);
   clones.forEach(geo=>geo.dispose());
   if(!combined)continue;
   for(const mesh of meshes){
    group.remove(mesh);geometries.delete(mesh.geometry);mesh.geometry.dispose();
   }
   geometries.add(combined);
   const merged=new THREE.Mesh(combined,meshes[0].material);
   merged.castShadow=true;merged.receiveShadow=true;group.add(merged);
  }
 }
 if(quality==='performance')batchStatic(decoration);
 const worldLocal=(bone)=>{
  bone.getWorldPosition(tmpWorld);return actorRoot.worldToLocal(tmpWorld.clone());
 };
 let initialized=false,frameCounter=0,disposed=false;
 const update=(time=0,action='idle',animate=true)=>{
  if(disposed)return;
  actorRoot.updateWorldMatrix(true,true);
  if(!initialized){
   for(const a of anchors)if(a.bone){
    a.start=worldLocal(a.bone);
    a.bone.getWorldQuaternion(tmpQuat);
    actorRoot.getWorldQuaternion(tmpRootQuat);
    a.restRotation=tmpRootQuat.clone().invert().multiply(tmpQuat).normalize();
   }
   initialized=true;
  }
  if(animate){
   for(const a of anchors)if(a.bone&&a.start){
    const p=worldLocal(a.bone);
    const dx=clamp(p.x-a.start.x,-.34,.34);
    const dy=clamp(p.y-a.start.y,-.30,.30);
    const dz=clamp(p.z-a.start.z,-.34,.34);
    a.group.position.copy(a.position).add(vec(dx,dy,dz));
    a.bone.getWorldQuaternion(tmpQuat);
    actorRoot.getWorldQuaternion(tmpRootQuat);
    localQ.copy(tmpRootQuat).invert().multiply(tmpQuat).normalize();
    inv.copy(a.restRotation).invert();
    localQ.multiply(inv);
    a.group.quaternion.identity().slerp(localQ,kit.weapon==='bow'?.4:.58);
   }
  }
  if(royalMuzzle){
   const firing=animate&&(action==='Attack'||action==='Special');
   // Only a server-reported attack can trigger recoil or muzzle glow.
   const recoil=firing?Math.pow(Math.max(0,sin(time*17)),6):0;
   royalBarrel.position.y=.18-recoil*.095;
   royalMuzzle.visible=firing&&recoil>.15;
   royalMuzzle.scale.setScalar(1+recoil*1.25);
   flashMat.opacity=.38+recoil*.52;
  }
  if(cape&&baseCape&&!(reducedMotion||!animate)){
   frameCounter++;
   if(frameCounter%2===0){
    const attr=cape.geometry.attributes.position;
    for(let i=0;i<attr.count;i++){
     const k=i*3,t=clamp(.38-baseCape[k+1],0,1.65)/1.65;
     const wind=sin(time*1.75+i*.29)*(.04+.14*t*t);
     attr.setXYZ(i,baseCape[k]+wind*.38,baseCape[k+1],
       baseCape[k+2]+wind+(action==='Run'?.21*t:0));
    }
    attr.needsUpdate=true;cape.geometry.computeVertexNormals();
   }
  }
 };
 function dispose(){
  if(disposed)return;disposed=true;actorRoot.remove(decoration);
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }
 return {root:decoration,profile:kit,anchors:anchors.length,update,dispose};
}
