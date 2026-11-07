/** Royal Gunner: interactive REAL 3D character inspection, independent of combat authority.
 * Shares the production anatomical skeleton and original armour/weapon geometry.
 * Never fabricates player data, currency, drops, or network-approved attacks.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {ANATOMICAL_MODEL} from './official-anatomical-v267.js';
import {prepareAnatomicalClips,applyAnatomicalPreset,createRoyalGunnerActionClips} from './official-anatomical-motion-v267.js';
import {createRiggedEquipment} from './official-rigged-equipment-v266.js';

const canvas=document.querySelector('#hero-canvas');
const stage=document.querySelector('#stage');
const loading=document.querySelector('#loading');
const buttons=[...document.querySelectorAll('[data-clip]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact=matchMedia('(max-width: 760px)').matches;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed');
let disposed=false,renderer=null,gear=null,mixer=null,model=null,environment=null,raf=0;
const actions=new Map();
let azimuth=.54,zoom=5.9,actionName='Idle',activeAction=null;
const camera=new THREE.PerspectiveCamera(38,1,.07,100);
const scene=new THREE.Scene();
const pointerPositions=new Map();
let lastPinch=null;
let frameAt=0;
const clock=new THREE.Clock();
function status(message,isError=false){
 loading.hidden=!message;loading.textContent=message||'';
 loading.style.color=isError?'#ffd5c2':'#f8dfaf';
}
function cameraPosition(){
 camera.position.set(Math.sin(azimuth)*zoom,2.15+zoom*.06,Math.cos(azimuth)*zoom);
 camera.lookAt(0,1.36,0);
}
function resize(){
 if(!renderer)return;
 const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 cameraPosition();
}
function clip(name){
 if(!mixer)return;
 const next=actions.get(name);
 if(!next)return;
 if(activeAction===next&&name!=='Attack'&&name!=='Special')return;
 if(activeAction&&activeAction!==next)activeAction.fadeOut(.14);
 next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.14).play();
 const oneShot=name==='Attack'||name==='Special';
 next.setLoop(oneShot?THREE.LoopOnce:THREE.LoopRepeat,oneShot?1:Infinity);
 next.clampWhenFinished=oneShot;
 activeAction=next;actionName=name;
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.clip===name)));
}
function tick(){
 raf=requestAnimationFrame(tick);
 if(disposed||!renderer||document.hidden)return;
 // Cap the sample turntable to ~30fps on mobile; keep skeletal animation smooth.
 const now=performance.now();
 if(compact&&now-frameAt<30)return;
 frameAt=now;
 const delta=Math.min(clock.getDelta(),.075);
 const t=clock.elapsedTime;
 mixer?.update(reduced?0:delta);
 gear?.update(t,actionName,!reduced);
 renderer.render(scene,camera);
}
function pointerDistance(){
 if(pointerPositions.size!==2)return null;
 const [a,b]=[...pointerPositions.values()];
 return Math.hypot(a.x-b.x,a.y-b.y);
}
function bindControls(){
 stage.addEventListener('pointerdown',event=>{
  if(event.target!==canvas)return;
  pointerPositions.set(event.pointerId,{x:event.clientX,y:event.clientY});
  canvas.setPointerCapture?.(event.pointerId);
  lastPinch=pointerDistance();
 });
 stage.addEventListener('pointermove',event=>{
  if(!pointerPositions.has(event.pointerId))return;
  const before=pointerPositions.get(event.pointerId);
  pointerPositions.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointerPositions.size===2){
   const current=pointerDistance();
   if(lastPinch&&current)zoom=clamp(zoom*lastPinch/current,3.7,9.0);
   lastPinch=current;
  }else azimuth+=clamp((event.clientX-before.x)*.008,-.3,.3);
  cameraPosition();
 });
 for(const eventName of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(eventName,event=>{
  pointerPositions.delete(event.pointerId);lastPinch=null;
 });
 stage.addEventListener('wheel',event=>{
  event.preventDefault();zoom=clamp(zoom+Math.sign(event.deltaY)*.27,3.7,9.0);cameraPosition();
 },{passive:false});
 for(const button of buttons)button.addEventListener('click',()=>clip(button.dataset.clip));
 document.querySelector('[data-camera="reset"]')?.addEventListener('click',()=>{
  azimuth=.54;zoom=5.9;cameraPosition();
 });
}
async function start(){
 if(!canvas?.getContext('webgl2'))throw Error('Cihaz WebGL2 desteklemiyor.');
 renderer=new THREE.WebGLRenderer({canvas,antialias:!compact,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.32;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,compact?1.45:1.85));
 renderer.shadowMap.enabled=!compact;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 if(!compact){
  const envSource=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
  environment=pmrem.fromScene(envSource).texture;
  scene.environment=environment;envSource.dispose();pmrem.dispose();
 }
 scene.add(new THREE.HemisphereLight(0xc1ddfa,0x39312b,1.95));
 const key=new THREE.DirectionalLight(0xffe3b8,3.6);
 key.position.set(-4.5,8,8);key.castShadow=!compact;key.shadow.mapSize.set(1024,1024);
 key.shadow.normalBias=.02;scene.add(key);
 const fill=new THREE.DirectionalLight(0x609fe8,2.1);fill.position.set(5,4,-5);scene.add(fill);
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.52,.18,48),
   new THREE.MeshStandardMaterial({color:0x3c4859,metalness:.76,roughness:.36}));
 pedestal.position.y=-.12;pedestal.receiveShadow=true;scene.add(pedestal);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.37,.033,8,64),
   new THREE.MeshStandardMaterial({color:0xe0b66c,metalness:.83,roughness:.25}));
 rim.rotation.x=-Math.PI/2;rim.position.y=.0;scene.add(rim);
 const gltf=prepareAnatomicalClips(await new GLTFLoader().loadAsync('./'+ANATOMICAL_MODEL.file));
 if(disposed)return;
 const root=new THREE.Group();
 model=cloneSkinned(gltf.scene);applyAnatomicalPreset(model,{team:0,heroId:'rovan'});
 root.add(model);
 const heights=[];
 model.traverse(obj=>{
  if(!obj.isSkinnedMesh)return;
  if(!obj.geometry.boundingBox)obj.geometry.computeBoundingBox();
  const bb=obj.geometry.boundingBox;
  if(bb&&Number.isFinite(bb.max.y-bb.min.y))heights.push(bb.max.y-bb.min.y);
  obj.castShadow=!compact;
 });
 const height=Math.max(0,...heights);
 if(!Number.isFinite(height)||height<.01)throw Error('3D insan modelinin ölçüleri geçersiz.');
 const scale=2.75/height;
 model.scale.setScalar(scale);
 const bounds=new THREE.Box3().setFromObject(model);
 if(Number.isFinite(bounds.min.y))model.position.y-=clamp(bounds.min.y,-.6,.6);
 gear=createRiggedEquipment(root,model,{team:0,heroId:'rovan'},
   {quality:compact?'performance':'balanced',rig:'human',reducedMotion:reduced});
 scene.add(root);
 mixer=new THREE.AnimationMixer(model);
 const gunnerClips=createRoyalGunnerActionClips(model);
 for(const animation of gltf.animations)
  actions.set(animation.name,mixer.clipAction(gunnerClips.get(animation.name)||animation));
 mixer.addEventListener('finished',event=>{
  if(event.action===activeAction&&(actionName==='Attack'||actionName==='Special'))clip('Idle');
 });
 bindControls();
 clip('Idle');resize();status('');
 window.addEventListener('resize',resize);
 window.addEventListener('pagehide',dispose,{once:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)clock.getDelta();});
 tick();
}
function dispose(){
 if(disposed)return;disposed=true;cancelAnimationFrame(raf);
 gear?.dispose();mixer?.stopAllAction();environment?.dispose();renderer?.dispose();
}
start().catch(error=>{
 console.error('Royal Gunner 3D preview failed:',error);
 status('Gerçek 3D karakter yüklenemedi: '+(error?.message||'Bilinmeyen hata'),true);
 dispose();
});
