import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const canvas=document.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#101b22');
const studio=new RoomEnvironment();
const generator=new THREE.PMREMGenerator(renderer);
const environment=generator.fromScene(studio).texture;
scene.environment=environment;
studio.dispose();generator.dispose();
const camera=new THREE.PerspectiveCamera(35,1,.01,40);
camera.position.set(.15,1.4,5.6);
const controls=new OrbitControls(camera,canvas);
controls.target.set(0,1.2,0);controls.enableDamping=true;
controls.minDistance=.65;controls.maxDistance=7;
scene.add(new THREE.HemisphereLight(0xe2efff,0x3e302c,.9));
for(const [color,power,x,y,z] of [[0xffe7c5,2.6,3,5,4],[0xa9c9ff,1.8,-4,3,-2]]){
 const light=new THREE.DirectionalLight(color,power);light.position.set(x,y,z);
 if(z>0){light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.normalBias=.025;light.shadow.camera.left=-3;light.shadow.camera.right=3;light.shadow.camera.top=4;light.shadow.camera.bottom=-3;}
 scene.add(light);
}
const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.83,.87,.08,64),new THREE.MeshStandardMaterial({color:0x243641,roughness:.7}));
pedestal.receiveShadow=true;pedestal.position.y=-.06;scene.add(pedestal);
const heroes=['aldren','lyra','rovan','mira','doran','vesper','eira'];
const labels=['Aldren','Lyra','Rovan','Mira','Doran','Vesper','Eira'];
const loader=new GLTFLoader();let actor=null,selection=0,mixer=null,currentAction=null;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let speed=1;
const pauseButton=document.querySelector('#pause-motion');
function updatePause(){
 if(mixer)mixer.timeScale=paused?0:speed;
 pauseButton.textContent=paused?'Hareketi sürdür':'Hareketi duraklat';
}
updatePause();
document.querySelector('#heroes').innerHTML=heroes.map((id,i)=>`<button data-id="${id}" aria-pressed="false">${labels[i]}</button>`).join('');
function release(root){
 root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}}});
}
async function select(id){
 const request=++selection;document.querySelector('#status').textContent='Model yükleniyor…';
 const experimental=id==='rovan'&&new URLSearchParams(location.search).get('experiment')==='archery';
 document.querySelector('#reference').src=`assets/heroes-3d/source/${experimental?'rovan-unarmed':id}.png`;
 document.querySelector('#name').textContent=labels[heroes.indexOf(id)];
 for(const b of document.querySelectorAll('[data-id]'))b.setAttribute('aria-pressed',String(b.dataset.id===id));
 try{
  const file=experimental?'rovan-archery-experiment.glb':id+'-rigged.glb';
  const gltf=await loader.loadAsync('assets/heroes-3d/'+file);
  if(request!==selection){release(gltf.scene);return;}
  if(actor){mixer?.stopAllAction();mixer?.uncacheRoot(actor);scene.remove(actor);release(actor);}
  actor=gltf.scene;
  actor.userData.heroId=id;
  actor.userData.archery=experimental;
  const box=new THREE.Box3().setFromObject(actor),size=box.getSize(new THREE.Vector3());
  actor.scale.setScalar(2.6/size.y);
  const center=box.getCenter(new THREE.Vector3());
  actor.position.set(-center.x*actor.scale.x,-box.min.y*actor.scale.y,-center.z*actor.scale.z);
  actor.rotation.y=Math.PI;
  scene.add(actor);
  actor.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  mixer=new THREE.AnimationMixer(actor);
  currentAction=null;
  updatePause();
  actor.userData.clips=gltf.animations;
  playClip(document.querySelector('#motion').value);
  controls.reset();controls.target.set(0,1.2,0);
  if(experimental)camera.position.set(3.2,1.7,4.5);else camera.position.set(.15,1.4,5.6);
  document.querySelector('#status').textContent=experimental?'Deneysel atış · Gövde düzeltmesi sürüyor':'Model hazır';
 }catch(error){document.querySelector('#status').textContent='Model açılamadı. '+error.message;}
}
document.querySelector('#heroes').onclick=e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(id)select(id);};
new ResizeObserver(()=>{
 const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}).observe(canvas);
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const delta=Math.min(clock.getDelta(),.05);mixer?.update(delta);
 if(currentAction){
  const progress=currentAction.time/currentAction.getClip().duration;
  const timeline=document.querySelector('#timeline');
  if(document.activeElement!==timeline)timeline.value=String(progress*100);
  const phase=document.querySelector('#phase');
  phase.textContent=actor?.userData.archery&&['Attack','Special'].includes(currentAction.getClip().name)
   ?progress<.24?'Yayı kaldır':progress<.30?'Oku yerleştir':progress<.56?'Kirişi çek':progress<.66?'Nişan al':progress<.80?'Oku bırak':'Toparlan'
   :'';
 }
 controls.update();renderer.render(scene,camera);});
function playClip(name){
 if(!mixer||!actor)return;
 const clip=actor.userData.clips.find(c=>c.name===name);
 if(!clip)return;
 const next=mixer.clipAction(clip);
 if(next===currentAction)return;
 currentAction?.fadeOut(.18);
 next.reset().fadeIn(.18).play();
 currentAction=next;
}
document.querySelector('#motion').addEventListener('change',e=>playClip(e.target.value));
document.querySelector('#pause-motion').addEventListener('click',e=>{
 paused=!paused;updatePause();
});
document.querySelector('#timeline').addEventListener('input',e=>{
 if(!currentAction||!mixer)return;
 paused=true;updatePause();mixer.stopAllAction();
 currentAction.reset().stopFading().setEffectiveWeight(1).play();
 currentAction.time=Number(e.target.value)/100*currentAction.getClip().duration;
 mixer.update(0);
});
document.querySelector('#speed').addEventListener('change',e=>{speed=Number(e.target.value);updatePause();});
document.querySelector('#full-body').addEventListener('click',()=>{controls.target.set(0,1.2,0);camera.position.set(.15,1.4,5.6);controls.update();});
document.querySelector('#face-view').addEventListener('click',()=>{controls.target.set(0,2.25,0);camera.position.set(.08,2.3,1.65);controls.update();});
const requested=new URLSearchParams(location.search).get('hero');
select(heroes.includes(requested)?requested:'aldren');
window.addEventListener('pagehide',()=>{selection++;renderer.setAnimationLoop(null);controls.dispose();if(actor)release(actor);pedestal.geometry.dispose();pedestal.material.dispose();environment.dispose();renderer.dispose();},{once:true});
