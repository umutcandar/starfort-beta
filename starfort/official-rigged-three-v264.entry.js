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
import {RIGGED_ASSETS,riggedModelForUnit,riggedAnimationForUnit,officialRiggedWorldPosition} from './official-rigged-contract-v264.js';

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
function setShadow(o,enabled=true){o.traverse(obj=>{if(obj.isMesh){obj.castShadow=enabled;obj.receiveShadow=true;}});}
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
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(45,31),new THREE.MeshStandardMaterial({
  map:groundCanvas(stage,pal),color:pal.ground,roughness:.99,metalness:0
 }));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;add(plane);
 // A weathered raised combat lane; beveled edge, no grid or toy checkerboard.
 const lane=add(new THREE.Mesh(new THREE.BoxGeometry(24,.15,8),material(0x777064)));
 lane.position.y=-.055;lane.receiveShadow=true;
 const road=add(new THREE.Mesh(new THREE.PlaneGeometry(22.5,7.2),
  new THREE.MeshStandardMaterial({color:0x645d51,roughness:.99,transparent:true,opacity:.57})));
 road.rotation.x=-Math.PI/2;road.position.y=.028;road.receiveShadow=true;
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
   cylinder(.13,.19,2.7,wood,x,z);
   const leaf=material(stage===6?0xaac3ca:0x365e4a);
   const crown=add(new THREE.Mesh(new THREE.ConeGeometry(stage===6?.98:1.2,3.3,8),leaf));
   crown.position.set(x,3.7,z);crown.castShadow=true;
  }else{
   cylinder(.58,.68,2.9+((i*7)%4)*.35,stone,x,z);
   box(1.4,.35,1.4,darkStone,x,3.18+((i*7)%4)*.35,z);
   if(i%3===0)box(.5,.35,1.75,stone,x-1.3,.18,z-.8,.26);
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
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.79,.036,5,30),
 new THREE.MeshBasicMaterial({color:team===0?0x63e0cc:0xf57868,transparent:true,opacity:.55,depthWrite:false}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.06;
 model.add(ring);return ring;
}
function prepareActor(gltf,unit,scene){
 const root=new THREE.Group(),model=cloneSkinned(gltf.scene);
 root.add(model);
 const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);
 // Some real GLBs are authored in millimetre-scale source units. Normalize
 // skinned geometry by measured height; tiny ≠ invalid. A 1 mm Archer is valid.
 if(!Number.isFinite(size.y)||size.y<1e-7||size.y>1000)throw Error('Character geometry has no finite usable height: '+riggedModelForUnit(unit));
 const targetHeight=unit.type==='boss'?3.55:unit.team===0?2.5:2.25;
 const scale=targetHeight/size.y;
 model.scale.setScalar(scale);
 const bounds=new THREE.Box3().setFromObject(model);
 model.position.y-=bounds.min.y;
 const ring=appearance(root,unit.team);
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
 return {root,mixer,actions,current:null,lastActionKey:null,lastPosition:root.position.clone(),ring,
  team:unit.team,name:riggedModelForUnit(unit)};
}
function setActorClip(actor,name,unit,room){
 if(!actor.actions.has(name))name='Idle';
 const trigger=name==='Attack'||name==='Special'||name==='Hit';
 const key=room.turn+':'+name+':'+unit.action;
 if(actor.current===name&&(!trigger||actor.lastActionKey===key))return;
 const next=actor.actions.get(name);if(!next)return;
 const old=actor.current?actor.actions.get(actor.current):null;
 if(old&&old!==next){old.fadeOut(.17);}
 next.reset().fadeIn(.16).play();
 actor.current=name;actor.lastActionKey=key;
}
function createImpact(scene){
 const impacts=new Map();
 function update(fx,time,quality){
  const keys=new Set();
  for(const item of fx||[]){
   if(!Number.isFinite(item.t)||!Number.isFinite(item.x)||!Number.isFinite(item.y))continue;
   const age=time-item.t;if(age<0||age>1.9)continue;
   const key=item.t+':'+item.type+':'+item.team;keys.add(key);
   let rec=impacts.get(key);
   if(!rec){
    const kind=item.type||'impact';
    const color=item.team===1?0xff6558:kind==='heal'?0x65efbc:kind==='ward'?0x72cfff:0xe9b66d;
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false,
      blending:THREE.AdditiveBlending});
    const mesh=new THREE.Mesh(kind==='heal'||kind==='ward'
      ?new THREE.TorusGeometry(1.2,.1,7,36):new THREE.IcosahedronGeometry(.32,1),mat);
    mesh.position.set((item.x-50)*.235,kind==='spell'?2.1:.65,(item.y-30)*.17);
    if(kind==='heal'||kind==='ward')mesh.rotation.x=-Math.PI/2;
    scene.add(mesh);rec={mesh,kind};impacts.set(key,rec);
   }
   const p=bounded(age/1.9,0,1),size=rec.kind==='heal'||rec.kind==='ward'?.8+p*1.7:1+p*3.5;
   rec.mesh.scale.setScalar(size);
   rec.mesh.material.opacity=(1-p)*.78;
   if(rec.kind==='spell')rec.mesh.position.x=((item.x-50)-12+p*22)*.235;
  }
  for(const [key,rec]of impacts)if(!keys.has(key)){
   scene.remove(rec.mesh);rec.mesh.geometry.dispose();rec.mesh.material.dispose();impacts.delete(key);
  }
 }
 function dispose(){for(const rec of impacts.values()){scene.remove(rec.mesh);rec.mesh.geometry.dispose();rec.mesh.material.dispose();}impacts.clear();}
 return {update,dispose};
}
export async function createRiggedBattle(canvas,{quality='balanced',reducedMotion=false}={}){
 if(!canvas||typeof window==='undefined')throw Error('Rigged battles require a browser canvas');
 const context=canvas.getContext('webgl2',{antialias:quality!=='performance',alpha:false,depth:true,
  powerPreference:'high-performance'});
 if(!context)throw Error('WebGL2 is required for the skinned 3D renderer');
 const renderer=new THREE.WebGLRenderer({canvas,context,alpha:false,antialias:quality!=='performance',
  powerPreference:'high-performance',preserveDrawingBuffer:false});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.37;
 renderer.shadowMap.enabled=quality!=='performance';renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.08,140);
 const hemi=new THREE.HemisphereLight(0xa6d8fc,0x453e2f,2.2);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffe4bd,4.4);sun.position.set(-7,12,8);
 sun.castShadow=quality!=='performance';sun.shadow.mapSize.set(quality==='ultra'?2048:1024,quality==='ultra'?2048:1024);
 sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;
 sun.shadow.normalBias=.015;scene.add(sun,sun.target);
 const rim=new THREE.DirectionalLight(0x8ac9fc,2.0);rim.position.set(4,6,-9);scene.add(rim);
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
  const dpr=Math.min(qualityName==='performance'?1:1.55,window.devicePixelRatio||1);
  renderer.setPixelRatio(dpr);
  const width=Math.max(1,canvas.clientWidth||1000),height=Math.max(1,canvas.clientHeight||600);
  renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 function render(room,you,time=0,opts={}){
  if(disposed||!room||room.variant!=='official')return;
  if(room.id!==lastRoom){for(const actor of actors.values()){scene.remove(actor.root);actor.mixer.stopAllAction();}
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
   if(!actor){actor=prepareActor(gltf,unit,scene);actors.set(id,actor);}
   const target=new THREE.Vector3(point.x,0,point.z);
   const distance=actor.root.position.distanceTo(target);
   actor.root.position.lerp(target,animate?1-Math.exp(-11*delta):1);
   actor.root.rotation.y=unit.team===0?Math.PI/2:-Math.PI/2;
   const desired=animate?riggedAnimationForUnit(unit,distance>.10):'Idle';
   setActorClip(actor,desired,unit,room);
   actor.mixer.update(animate?delta:0);
  }
  for(const [id,actor]of actors)if(!active.has(id)){scene.remove(actor.root);
   actor.mixer.stopAllAction();actors.delete(id);}
  impacts.update(room.fx,time,qualityName);
  const yaw=bounded(Number(opts.cameraYaw)||0,-.85,.85);
  const distance=bounded(Number(opts.cameraDistance)||51,43,95)*.29;
  camera.position.set(Math.sin(yaw)*distance,5.2+distance*.15,Math.cos(yaw)*distance);
  camera.lookAt(0,1.45,0);
  renderer.render(scene,camera);drawn++;
 }
 return {
  mode:'rigged3d',kind:'rigged-webgl2',ready:Promise.resolve(true),canvas,render,resize,
  setQuality(q){qualityName=q;stage=-1;},
  toWorld(){return {x:-1e6,y:-1e6};},
  stats(){return {mode:'rigged3d',skinnedModels:assets.size,animatedActors:actors.size,frames:drawn,
   pipeline:'textured-PBR-skeletal',quality:qualityName};},
  dispose(){if(disposed)return;disposed=true;stageCleanup();impacts.dispose();
   for(const actor of actors.values()){scene.remove(actor.root);actor.mixer.stopAllAction();}
   actors.clear();assets.clear();renderer.dispose();}
 };
}
