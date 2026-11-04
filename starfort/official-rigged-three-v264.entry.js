/** STARFORT Beta.15 — AUTHENTIC RIGGED 3D GRAPHICS (official PvE only).
 * Unlike the old cube renderer this loads textured, skinned CC0 glTF figures
 * and plays their embedded Idle/Run/Attack/Hit/Special animation clips.
 *
 * Gameplay-authority boundary: the server owns every turn, health, skill,
 * reward and victory. This file owns only Three.js meshes, lights and pixels.
 * Models are self-hosted in assets/rigged by scripts/build-rigged3d.mjs.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RIGGED_ASSETS,riggedModelForUnit,riggedAnimationForUnit,officialRiggedWorldPosition} from './official-rigged-contract-v264.js';
import {combatAppearance,combatCameraFrame,battlefieldScatter} from './official-rigged-style-v265.js';
import {createRiggedEquipment,riggedEquipmentBone} from './official-rigged-equipment-v266.js';

const bounded=(v,a,b)=>Math.min(b,Math.max(a,v));
const RAD=Math.PI/180;
const colors=[
 {sky:0x28343c,ground:0x54493e,accent:0xf4ac64,stone:0x827969},
 {sky:0x273843,ground:0x484d4b,accent:0xb9c6d5,stone:0x737b7c},
 {sky:0x172d2e,ground:0x314737,accent:0x8fca82,stone:0x566d5e},
 {sky:0x26313e,ground:0x504a40,accent:0xeec47d,stone:0x898173},
 {sky:0x1b2b39,ground:0x353d43,accent:0x81bfe8,stone:0x64737d},
 {sky:0x293741,ground:0x63757b,accent:0x9ee2f0,stone:0xb2c4cb},
 {sky:0x271c36,ground:0x363047,accent:0xc38ae3,stone:0x716280},
 {sky:0x17172c,ground:0x2a2840,accent:0xe390b4,stone:0x645876}
];
const assetUrl=name=>new URL('./'+name+'.glb',import.meta.url).href;
function material(hex,roughness=.86){return new THREE.MeshStandardMaterial({color:hex,roughness,metalness:.06});}
function setShadow(o,enabled=true){o.traverse(obj=>{if(obj.isMesh){obj.castShadow=enabled;obj.receiveShadow=true;obj.frustumCulled=false;}});}
function addMesh(scene,geometry,mat,x,y,z,{rotY=0,shadow=true}={}){
 const obj=new THREE.Mesh(geometry,mat);obj.position.set(x,y,z);obj.rotation.y=rotY;
 obj.castShadow=shadow;obj.receiveShadow=true;scene.add(obj);return obj;
}
function groundCanvas(stage,palette){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d'),isIce=stage===6;
 ctx.fillStyle=isIce?'#7a919a':stage===3?'#455b44':'#6d6459';ctx.fillRect(0,0,512,512);
 let seed=(stage*941+19)>>>0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1400;i++){
  const x=rand()*512,y=rand()*512,r=1+rand()*13;
  ctx.fillStyle=isIce?'rgba(219,238,244,.11)':rand()>.5?'rgba(0,0,0,.07)':'rgba(227,211,170,.07)';
  ctx.beginPath();ctx.ellipse(x,y,r,r*.35,rand()*Math.PI,0,Math.PI*2);ctx.fill();
 }
 ctx.strokeStyle=isIce?'rgba(215,242,247,.20)':'rgba(36,32,32,.16)';
 for(let i=0;i<45;i++){const x=rand()*512,y=rand()*512;ctx.lineWidth=rand()*1.8+0.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*48-24,y+rand()*44-22);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(3.3,2.0);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 return texture;
}
function createArena(scene,stage,quality){
 const pal=colors[Math.max(0,Math.min(7,stage-1))],rich=quality!=='performance';
 scene.background=new THREE.Color(pal.sky);scene.fog=new THREE.FogExp2(pal.sky,quality==='performance'?.020:.016);
 const objs=[],add=(obj)=>{scene.add(obj);objs.push(obj);return obj;};
 // Uneven, shadow-catching ground replaces the featureless elevated toy board.
 const earth=new THREE.PlaneGeometry(45,31,42,30),heights=earth.attributes.position;
 for(let i=0;i<heights.count;i++){
  const x=heights.getX(i),z=heights.getY(i);
  const height=(Math.sin(x*.61+stage)*Math.cos(z*.68)+Math.sin(z*.91-x*.37))*.065;
  heights.setZ(i,height*(Math.abs(x)<8&&Math.abs(z)<4?.17:1));
 }
 earth.computeVertexNormals();
 const plane=add(new THREE.Mesh(earth,new THREE.MeshStandardMaterial({
  map:groundCanvas(stage,pal),color:0xa5a5a0,roughness:1,metalness:0
 })));
 plane.rotation.x=-Math.PI/2;plane.position.y=-.07;plane.receiveShadow=true;
 // Broken, partly buried limestone and fallen masonry beyond the frontline.
 const grit=[material(0x625f59),material(0x777169),material(0x454b4b)];
 for(let i=0;i<(rich?74:36);i++){
  const p=battlefieldScatter(stage,i),x=p.x,z=p.z;
  if(Math.abs(x)<7.8&&Math.abs(z)<4.5)continue;
  const shard=add(new THREE.Mesh(new THREE.DodecahedronGeometry(p.size*(.24+.26*p.variation),0),grit[i%3]));
  shard.position.set(x,p.size*.04-.13,z);
  shard.scale.set(1.7,.48,1.1);shard.rotation.set(.2,p.turn,.35);
  shard.castShadow=rich&&i%4===0;shard.receiveShadow=true;
 }
 const stone=material(pal.stone),darkStone=material(0x3b4343),wood=material(0x47372f);
 const gold=material(pal.accent,.36);
 const cylinder=(r1,r2,h,mat,x,z,y=0,n=9)=>{
  const ob=add(new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat));
  ob.position.set(x,y+h*.5,z);ob.castShadow=true;ob.receiveShadow=true;return ob;
 };
 const box=(w,h,d,mat,x,y,z,angle=0)=>{
  const ob=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat));
  ob.position.set(x,y,z);ob.rotation.y=angle;ob.castShadow=true;ob.receiveShadow=true;return ob;
 };
 const n=rich?10:5;
 for(let i=0;i<n;i++){
  const sign=i%2?1:-1,offset=(i*7%21)-10,x=offset,z=sign*(7.4+i%3*1.6);
  if(stage===3||stage===6){
   // Separate trunk, limbs and organic branches instead of triangular toy trees.
   cylinder(.18,.32,3.15,wood,x,z);
   const foliage=material(stage===6?0x93a7ab:0x374f43,.98);
   for(let j=0;j<4;j++){
    const cluster=add(new THREE.Mesh(new THREE.IcosahedronGeometry(.92-(j%2)*.14,1),foliage));
    cluster.position.set(x+Math.sin(i*2+j)*.43,2.80+j*.55,
      z+Math.cos(i*3+j)*.43);cluster.scale.set(1.18,.75,1.08);
    cluster.castShadow=rich;
   }
  }else{
   // Eroded ruins: irregular stone courses, broken columns and fallen blocks.
   const h=2.2+(i*13%5)*.42,angle=.03*Math.sin(i*4.1);
   const shaft=add(new THREE.Mesh(new THREE.CylinderGeometry(.46,.62,h,9,5),stone));
   shaft.position.set(x,h*.5,z);shaft.rotation.z=angle;
   shaft.castShadow=rich;shaft.receiveShadow=true;
   const crackedTop=add(new THREE.Mesh(new THREE.DodecahedronGeometry(.77,0),darkStone));
   crackedTop.position.set(x+Math.sin(i)*.14,h+.03,z+.04);
   crackedTop.scale.set(1,.23,.91);crackedTop.rotation.set(.12,i*.38,-.1);
   crackedTop.castShadow=rich;
   for(let j=0;j<3;j++){
    const rubble=add(new THREE.Mesh(new THREE.DodecahedronGeometry(.36+.09*j,0),j%2?stone:darkStone));
    rubble.position.set(x+(j-1)*.65,.04,z+(.5-j*.41));
    rubble.scale.set(1.5,.5,1.1);rubble.rotation.y=i*.9+j*.7;
    rubble.castShadow=rich;
   }
  }
 }
 for(const x of [-10,10])for(const z of [-6,6]){
  cylinder(.19,.42,1.5,wood,x,z);
  const glow=add(new THREE.PointLight(pal.accent,quality==='performance'?.5:1.5,8,2));
  glow.position.set(x,2.8,z);
  if(rich){const fire=add(new THREE.Mesh(new THREE.IcosahedronGeometry(.23,0),new THREE.MeshBasicMaterial({color:pal.accent})));
   fire.position.set(x,2.35,z);}
 }
 if([4,5,7,8].includes(stage)){
  for(let i=0;i<8;i++){
   const z=-10+i*2.8;
   box(1.05,4+(i%3)*.45,2.4,stone,11.7,1.9+(i%3)*.2,z);
   if(i%2===0)box(1.45,.45,2.8,darkStone,11.7,4.4+(i%3)*.45,z);
  }
 }
 if(stage>=7){
  cylinder(2.2,2.7,.32,gold,5.6,-.4,0,16);
  cylinder(1.7,2.2,.35,stone,5.6,-.4,.3,16);
 }
 return ()=>{for(const obj of objs){obj.geometry?.dispose();if(obj.material?.map)obj.material.map.dispose();
  if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose();scene.remove(obj);}};
}
function appearance(model,team,stage){
 // A grounded contact shadow, not a glowing arcade team ring.
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.85,32),
   new THREE.MeshBasicMaterial({color:0x0a0f14,transparent:true,opacity:.32,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;
 shadow.scale.set(1.1,.68,1);model.add(shadow);return shadow;
}
function prepareActor(gltf,unit,scene,quality){
 const root=new THREE.Group(),model=cloneSkinned(gltf.scene);
 root.add(model);
 // Real GLBs use a .01 scene root plus 100x inverse-bind matrices.
 // A world-space Box3 of the undeformed mesh is ~1mm tall but GPU-skinned
 // vertices span ~.18m. Using world Box3 would zoom into a giant character.
 // The raw SkinnedMesh POSITION attribute is the reliable normalization input.
 const localHeights=[];
 model.traverse(object=>{
  if(!object.isSkinnedMesh)return;
  if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
  const bb=object.geometry.boundingBox;
  if(bb&&Number.isFinite(bb.max.y-bb.min.y))localHeights.push(bb.max.y-bb.min.y);
 });
 const height=Math.max(0,...localHeights);
 if(!Number.isFinite(height)||height<1e-6||height>1000)
  throw Error('Unusable animated mesh dimensions for '+riggedModelForUnit(unit));
 const targetHeight=unit.type==='boss'?3.55:unit.team===0?2.75:2.48;
 const scale=targetHeight/height;
 const style=combatAppearance(unit);
 // A little taller and narrower than the source stylised figures.
 model.scale.set(scale*style.build*.91,scale*1.05,scale*.88);
 // Per-actor material clones: color schemes must never leak to a second hero.
 const ownedMaterials=[];
 model.traverse(obj=>{
  if(obj.isBone&&obj.name===riggedEquipmentBone('head'))obj.scale.multiplyScalar(style.head);
  if(!obj.isMesh)return;
  const finish=mat=>{
   if(!mat?.isMaterial)return mat;
   const copy=mat.clone();ownedMaterials.push(copy);
   if(copy.color)copy.color.lerp(new THREE.Color(style.tint),.22);
   if('metalness' in copy)copy.metalness=Math.max(copy.metalness||0,style.metal);
   if('roughness' in copy)copy.roughness=Math.min(.88,Math.max(.48,copy.roughness||.7));
   return copy;
  };
  obj.material=Array.isArray(obj.material)?obj.material.map(finish):finish(obj.material);
 });
 const bounds=new THREE.Box3().setFromObject(model);
 if(Number.isFinite(bounds.min.y))model.position.y-=Math.max(-.6,Math.min(.6,bounds.min.y));
 const ring=appearance(root,unit.team);
 const slash=new THREE.Mesh(new THREE.TorusGeometry(.95,.05,8,50,Math.PI*1.35),
  new THREE.MeshBasicMaterial({color:style.accent,transparent:true,opacity:0,
   depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 slash.rotation.set(.13,0,Math.PI/2);
 slash.position.set(unit.team===0?.52:-.52,1.38,.23);
 slash.visible=false;root.add(slash);
 const equipment=createRiggedEquipment(root,model,unit,{quality});
 const mixer=new THREE.AnimationMixer(model),actions=new Map();
 for(const clip of gltf.animations){
  if(!['Idle','Run','Walk','Attack','Special','Hit','Death'].includes(clip.name))continue;
  const action=mixer.clipAction(clip);
  if(['Attack','Special','Hit','Death'].includes(clip.name)){
   action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;
  }else action.setLoop(THREE.LoopRepeat,Infinity);
  actions.set(clip.name,action);
 }
 if(!actions.has('Idle')||!actions.has('Attack'))throw Error('Rig lacks required animation clips');
 setShadow(model,true);
 const base=officialRiggedWorldPosition(unit);root.position.set(base?.x||0,0,base?.z||0);
 root.rotation.y=unit.team===0?Math.PI/2:-Math.PI/2;
 scene.add(root);
 return {root,mixer,actions,current:null,lastActionKey:null,lastPosition:root.position.clone(),
  ring,slash,equipment,ownedMaterials,style,team:unit.team,name:riggedModelForUnit(unit)};
}
function setActorClip(actor,name,unit,room){
 if(!actor.actions.has(name))name='Idle';
 const trigger=name==='Attack'||name==='Special'||name==='Hit';
 const key=room.turn+':'+name+':'+unit.action;
 if(actor.current===name&&(!trigger||actor.lastActionKey===key))return;
 const next=actor.actions.get(name);if(!next)return;
 next.timeScale=name==='Attack'?1.32:name==='Hit'?1.18:1;
 const old=actor.current?actor.actions.get(actor.current):null;
 if(old&&old!==next){old.fadeOut(.17);}
 next.reset().fadeIn(.16).play();
 actor.current=name;actor.lastActionKey=key;
}
/** GPU primitives follow accepted server turn FX only; no predicted damage. */
function createImpact(scene){
 const impacts=new Map(),life=1.9;
 const create=(item)=>{
  const kind=item.type||'impact',friendly=item.team===0;
  const hex=kind==='heal'?0x6cf6c4:kind==='ward'?0x76bfff:
    kind==='spell'?(friendly?0x9cbbff:0xba78ef):
    friendly?0xffc177:0xfa6a58;
  const group=new THREE.Group();
  group.position.set((item.x-50)*.235,.16,(item.y-30)*.17);
  const components=[],add=(geo,mat,x=0,y=0,z=0)=>{
   const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);
   group.add(mesh);components.push(mesh);return mesh;
  };
  const glow=(opacity=.8)=>new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity,
   depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const ring=add(new THREE.TorusGeometry(kind==='ward'?1.05:.66,.045,7,42),glow(.53));
  ring.rotation.x=-Math.PI/2;ring.position.y=.12;
  let arc=null,orb=null,field=null;
  if(kind==='slash'||kind==='flank'||kind==='impact'){
   arc=add(new THREE.TorusGeometry(.88,.065,8,52,Math.PI*1.32),glow(.74),0,1.22,0);
   arc.rotation.set(.16,kind==='flank'?-.6:.4,Math.PI*.13);
  }else if(kind==='spell'){
   orb=add(new THREE.IcosahedronGeometry(.22,2),glow(.9),-2.8,1.25,0);
   add(new THREE.SphereGeometry(.37,10,8),glow(.24),0,1.25,0);
  }else if(kind==='ward'){
   field=add(new THREE.SphereGeometry(1.16,18,12,0,Math.PI*2,0,Math.PI*.75),
    new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.15,
      depthWrite:false,side:THREE.DoubleSide}),0,.12,0);
  }else if(kind==='heal'){
   const sigil=add(new THREE.TorusGeometry(.96,.025,5,54),glow(.38),0,.08,0);
   sigil.rotation.x=-Math.PI/2;
   const ray=add(new THREE.CylinderGeometry(.08,.36,2.2,12,1,true),
    new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.18,
      depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}),0,1.13,0);
   ray.rotation.y=.35;
  }
  // Short physically directional sparks. Every effect uses a stable visual seed.
  const count=kind==='heal'||kind==='ward'?8:18,geometry=new THREE.BufferGeometry();
  const pos=new Float32Array(count*3),vel=new Float32Array(count*3);
  const seed=Math.abs(Math.trunc(Number(item.t||0)*1e5))%9973;
  for(let i=0;i<count;i++){
   const theta=(i*2.399963+seed*.173),lift=.22+(i%7)*.085;
   vel[i*3]=Math.cos(theta)*(1.25+(i%5)*.21);
   vel[i*3+1]=lift*3.1;
   vel[i*3+2]=Math.sin(theta)*(1.25+(i%4)*.24);
  }
  geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const particles=new THREE.Points(geometry,
   new THREE.PointsMaterial({color:hex,size:.105,transparent:true,opacity:.89,
    depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));
  group.add(particles);
  const lamp=new THREE.PointLight(hex,1.5,5.4,2);
  lamp.position.y=1.25;group.add(lamp);
  scene.add(group);
  return {group,kind,ring,arc,orb,field,particles,vel,lamp,components};
 };
 function clear(rec){
  scene.remove(rec.group);
  for(const mesh of rec.components){
   mesh.geometry.dispose();mesh.material.dispose();
  }
  rec.particles.geometry.dispose();rec.particles.material.dispose();
 }
 function update(fx,time,quality){
  const alive=new Set();
  for(const item of fx||[]){
   if(!Number.isFinite(item.t)||!Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
   const age=time-item.t;if(age<0||age>life)continue;
   const key=item.t+':'+item.type+':'+item.team+':'+(item.heroId||'');alive.add(key);
   let rec=impacts.get(key);
   if(!rec){rec=create(item);impacts.set(key,rec);}
   const p=bounded(age/life,0,1),flash=Math.exp(-Math.pow((p-.41)/.19,2));
   rec.ring.scale.setScalar(.5+2.2*p);
   rec.ring.material.opacity=(1-p)*.45;
   if(rec.arc){
    rec.arc.scale.setScalar(.55+flash*1.1);
    rec.arc.rotation.z+=.009;
    rec.arc.material.opacity=Math.min(.85,flash);
   }
   if(rec.orb){
    rec.orb.position.x=-2.8+3.0*bounded(p*2.6,0,1);
    rec.orb.scale.setScalar(.65+flash*1.6);
    rec.orb.material.opacity=Math.min(.96,.25+flash);
   }
   if(rec.field){rec.field.scale.setScalar(.75+flash*.35);rec.field.material.opacity=.14*(1-p);}
   const arr=rec.particles.geometry.attributes.position;
   for(let i=0;i<arr.count;i++){
    const k=i*3,t=bounded((p-.10)*2.8,0,1.7);
    arr.setXYZ(i,rec.vel[k]*t,.6+rec.vel[k+1]*t-1.6*t*t,rec.vel[k+2]*t);
   }
   arr.needsUpdate=true;
   rec.particles.material.opacity=(1-p)*.75;
   rec.lamp.intensity=(quality==='performance'?.6:1.5)*flash;
  }
  for(const [key,rec] of impacts)if(!alive.has(key)){clear(rec);impacts.delete(key);}
 }
 function dispose(){for(const rec of impacts.values())clear(rec);impacts.clear();}
 return {update,dispose};
}
export async function createRiggedBattle(canvas,{quality='balanced',reducedMotion=false}={}){
 if(!canvas||typeof window==='undefined')throw Error('Rigged battles require a browser canvas');
 const context=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,
  powerPreference:'high-performance'});
 if(!context)throw Error('WebGL2 is required for the skinned 3D renderer');
 const renderer=new THREE.WebGLRenderer({canvas,context,alpha:false,antialias:true,
  powerPreference:'high-performance',preserveDrawingBuffer:false});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.37;
 renderer.shadowMap.enabled=quality!=='performance';renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.08,140);
 // Local studio environment adds physically based reflections to real metal armour.
 // No runtime external HDR downloads, so a missing CDN never breaks the battle.
 let environmentTexture=null;
 if(quality!=='performance'){
  const generator=new THREE.PMREMGenerator(renderer),roomEnvironment=new RoomEnvironment();
  environmentTexture=generator.fromScene(roomEnvironment).texture;
  scene.environment=environmentTexture;
  roomEnvironment.dispose();generator.dispose();
 }
 const hemi=new THREE.HemisphereLight(0xaac6da,0x3c3129,1.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffddb0,3.35);sun.position.set(-7,12,8);
 sun.castShadow=quality!=='performance';sun.shadow.mapSize.set(quality==='ultra'?2048:1024,quality==='ultra'?2048:1024);
 sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;
 sun.shadow.normalBias=.015;scene.add(sun,sun.target);
 const rim=new THREE.DirectionalLight(0x91b8dc,1.35);rim.position.set(4,6,-9);scene.add(rim);
 const loader=new GLTFLoader();
 const assets=new Map();let disposed=false;
 try{
  // Real textured meshes + skinned glTF skeletons load before 3D is advertised.
  await Promise.all(Object.keys(RIGGED_ASSETS).map(async name=>{
   const gltf=await loader.loadAsync(assetUrl(name));
   if(!gltf.scene||!Array.isArray(gltf.animations)||!gltf.animations.some(c=>c.name==='Attack')||
      !gltf.animations.some(c=>c.name==='Idle'))throw Error(name+' missing skinned animation');
   if(!gltf.scene.getObjectByProperty('type','SkinnedMesh')&&
      !gltf.scene.getObjectByProperty('isSkinnedMesh',true)){
     let skinned=false;gltf.scene.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});
     if(!skinned)throw Error(name+' is not rigged');
   }
   assets.set(name,gltf);
  }));
 }catch(error){renderer.dispose();throw new Error('Rigged character files could not be prepared: '+error.message);}
 let stage=-1,stageCleanup=()=>{},lastTime=null,lastRoom=null,drawn=0,actors=new Map(),qualityName=quality;
 const impacts=createImpact(scene);
 function resize(){
  const dpr=Math.min(qualityName==='performance'?1.45:1.75,window.devicePixelRatio||1);
  renderer.setPixelRatio(dpr);
  const width=Math.max(1,canvas.clientWidth||1000),height=Math.max(1,canvas.clientHeight||600);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 function render(room,you,time=0,opts={}){
  if(disposed||!room||room.variant!=='official')return;
  if(room.id!==lastRoom){for(const actor of actors.values()){
    scene.remove(actor.root);actor.mixer.stopAllAction();actor.equipment.dispose();actor.ownedMaterials.forEach(m=>m.dispose());
    actor.slash.geometry.dispose();actor.slash.material.dispose();
    actor.ring.geometry.dispose();actor.ring.material.dispose();
   }
   actors.clear();lastRoom=room.id;}
  const nextQ=opts.quality||qualityName;
  if(nextQ!==qualityName){qualityName=nextQ;renderer.shadowMap.enabled=nextQ!=='performance';stage=-1;}
  if(stage!==room.stage){stageCleanup();stageCleanup=createArena(scene,room.stage||1,qualityName);stage=room.stage||1;}
  resize();
  const delta=lastTime===null?0:bounded(time-lastTime,0,.08);lastTime=time;
  const animate=!opts.reducedMotion&&!reducedMotion;
  const roster=[...(room.squads||[]),...(room.players||[])];
  const active=new Set();
  for(const unit of roster){
   if(!unit||!unit.id||unit.hp<=0)continue;
   const id=String(unit.id),modelKey=riggedModelForUnit(unit),gltf=assets.get(modelKey);
   if(!gltf)continue;
   const point=officialRiggedWorldPosition(unit);if(!point)continue;
   active.add(id);
   let actor=actors.get(id);
   if(!actor){actor=prepareActor(gltf,unit,scene,qualityName);actors.set(id,actor);}
   const target=new THREE.Vector3(point.x,0,point.z);
   const distance=actor.root.position.distanceTo(target);
   actor.root.position.lerp(target,animate?1-Math.exp(-11*delta):1);
   actor.root.rotation.y=unit.team===0?Math.PI/2:-Math.PI/2;
   const desired=animate?riggedAnimationForUnit(unit,distance>.10):'Idle';
   setActorClip(actor,desired,unit,room);
   actor.mixer.update(animate?delta:0);
   actor.equipment.update(time,desired,animate);
   const attack=animate&&(desired==='Attack'||desired==='Special');
   const phase=attack?(actor.actions.get(desired)?.time||0)/
     Math.max(.01,actor.actions.get(desired)?.getClip().duration||1):0;
   actor.slash.visible=attack&&phase>.14&&phase<.78;
   if(actor.slash.visible){
    actor.slash.rotation.y=(unit.team===0?1:-1)*(-.7+phase*2.2);
    actor.slash.scale.setScalar(.65+Math.sin(phase*Math.PI)*.75);
    actor.slash.material.opacity=Math.min(.73,Math.sin((phase-.14)/.64*Math.PI));
   }
  }
  for(const [id,actor]of actors)if(!active.has(id)){scene.remove(actor.root);
   actor.mixer.stopAllAction();actor.ownedMaterials.forEach(m=>m.dispose());
   actor.slash.geometry.dispose();actor.slash.material.dispose();
   actor.ring.geometry.dispose();actor.ring.material.dispose();actors.delete(id);}
  impacts.update(room.fx,time,qualityName);
  const yaw=bounded(Number(opts.cameraYaw)||0,-.85,.85);
  const frame=combatCameraFrame(opts.cameraDistance,canvas.clientWidth/
    Math.max(1,canvas.clientHeight),qualityName),distance=frame.distance;
  if(camera.fov!==frame.fov){camera.fov=frame.fov;camera.updateProjectionMatrix();}
  // A three-quarter shot lets the player see helmets, breastplates and faces.
  camera.position.set(Math.sin(yaw+.19)*distance,frame.y+distance*.07,
    Math.cos(yaw+.19)*distance);
  camera.lookAt(0,frame.focusY,0);
  renderer.render(scene,camera);drawn++;

 }
 return {
  mode:'rigged3d',kind:'rigged-webgl2',ready:Promise.resolve(true),canvas,render,resize,
  setQuality(q){qualityName=q;stage=-1;},
  toWorld(){return {x:-1e6,y:-1e6};},
  stats(){return {mode:'rigged3d',skinnedModels:assets.size,animatedActors:actors.size,frames:drawn,
   equipmentActors:[...actors.values()].filter(a=>a.equipment).length,
   drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
   pipeline:'textured-PBR-skeletal-modular',quality:qualityName};},
  dispose(){if(disposed)return;disposed=true;stageCleanup();impacts.dispose();
   for(const actor of actors.values()){
    scene.remove(actor.root);actor.mixer.stopAllAction();actor.equipment.dispose();actor.ownedMaterials.forEach(m=>m.dispose());
    actor.slash.geometry.dispose();actor.slash.material.dispose();
    actor.ring.geometry.dispose();actor.ring.material.dispose();
   }
   actors.clear();assets.clear();environmentTexture?.dispose();renderer.dispose();}
 };
}
