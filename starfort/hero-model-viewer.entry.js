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
const roles=['Öncü · Kılıç ve kalkan','Yıldız büyücüsü · Asa','Orman avcısı · Yay','Işık rahibesi · Asa','Muhafız · Savaş baltası','Gölge suikastçısı · Çift hançer','Buz büyücüsü · Asa'];
const nativePreview=new URLSearchParams(location.search).get('experiment')==='native';
document.querySelector('#wardrobe').hidden=!nativePreview;
document.querySelector('#version-note').textContent=nativePreview?'Yeni karakter çalışması · Görsel düzeltmeler sürüyor.':'';
const loader=new GLTFLoader();let actor=null,selection=0,mixer=null,currentAction=null;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let speed=1;
const pauseButton=document.querySelector('#pause-motion');
function updatePause(){
 if(mixer)mixer.timeScale=paused?0:speed;
 pauseButton.textContent=paused?'Hareketi sürdür':'Hareketi duraklat';
}
updatePause();
document.querySelector('#heroes').innerHTML=heroes.map((id,i)=>`<button data-id="${id}" aria-pressed="false"><img src="assets/heroes-3d/source/${id}.png" alt="" loading="lazy"><span>${labels[i]}</span></button>`).join('');
function release(root){
 const materials=new Set(),textures=new Set(),skeletons=new Set();
 root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material))materials.add(m);if(o.skeleton)skeletons.add(o.skeleton);}});
 for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();}
 for(const texture of textures){texture.dispose();texture.image?.close?.();}
 for(const skeleton of skeletons)skeleton.dispose();
}
async function select(id){
 const request=++selection;document.querySelector('#status').textContent='Model yükleniyor…';
 if(actor)actor.visible=false;
 const experimental=id==='rovan'&&new URLSearchParams(location.search).get('experiment')==='archery';
 const native=nativePreview;
 document.querySelector('#reference').src=`assets/heroes-3d/source/${experimental||(native&&id==='rovan')?'rovan-unarmed':id}.png`;
 document.querySelector('#name').textContent=labels[heroes.indexOf(id)];
 document.querySelector('#hero-role').textContent=roles[heroes.indexOf(id)];
 for(const b of document.querySelectorAll('[data-id]'))b.setAttribute('aria-pressed',String(b.dataset.id===id));
 try{
  const file=native?id+'-native.glb':experimental?'rovan-archery-experiment.glb':id+'-rigged.glb';
  const gltf=await loader.loadAsync('assets/heroes-3d/'+file);
  if(request!==selection){release(gltf.scene);return;}
  if(actor){mixer?.stopAllAction();mixer?.uncacheRoot(actor);scene.remove(actor);release(actor);}
  actor=gltf.scene;
  actor.userData.heroId=id;
  actor.userData.archery=experimental||(native&&id==='rovan');
  const box=new THREE.Box3();
  if(native){actor.updateMatrixWorld(true);actor.traverse(o=>{if(o.isSkinnedMesh)box.union(new THREE.Box3().setFromObject(o));});}
  else box.setFromObject(actor);
  const size=box.getSize(new THREE.Vector3());
  actor.scale.setScalar(2.6/size.y);
  const center=box.getCenter(new THREE.Vector3());
  actor.position.set(-center.x*actor.scale.x,-box.min.y*actor.scale.y,-center.z*actor.scale.z);
  actor.rotation.y=native?0:Math.PI;
  scene.add(actor);
  applyWardrobe();
  actor.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  mixer=new THREE.AnimationMixer(actor);
  currentAction=null;
  updatePause();
  actor.userData.clips=gltf.animations;
  for(const option of document.querySelector('#motion').options)option.disabled=!gltf.animations.some(c=>c.name===option.value);
  if(document.querySelector('#motion').selectedOptions[0].disabled)document.querySelector('#motion').value='Idle';
  playClip(document.querySelector('#motion').value);
  controls.reset();controls.target.set(0,1.2,0);
  if(experimental||native){camera.position.set(3.8,2.1,5.6);controls.target.set(0,1.4,0);}else camera.position.set(.15,1.4,5.6);
  document.querySelector('#status').textContent=experimental?'Deneysel atış · Gövde düzeltmesi sürüyor':'Model hazır';
 }catch(error){if(request===selection)document.querySelector('#status').textContent='Model açılamadı. '+error.message;}
}
document.querySelector('#heroes').onclick=e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(id)select(id);};
const resizeObserver=new ResizeObserver(()=>{
 const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
});
resizeObserver.observe(canvas);
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
 if(paused){mixer.stopAllAction();next.reset().stopFading().setEffectiveWeight(1).play();mixer.update(0);}
 else{currentAction?.fadeOut(.18);next.reset().fadeIn(.18).play();}
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
 currentAction.time=Math.min(.999999,Number(e.target.value)/100)*currentAction.getClip().duration;
 mixer.update(0);
});
document.querySelector('#speed').addEventListener('change',e=>{speed=Number(e.target.value);updatePause();});
document.querySelector('#full-body').addEventListener('click',()=>{controls.target.set(0,1.4,0);camera.position.set(3.8,2.1,5.6);controls.update();});
document.querySelector('#front-view').addEventListener('click',()=>{controls.target.set(0,1.4,0);camera.position.set(0,1.7,6.2);controls.update();});
document.querySelector('#back-view').addEventListener('click',()=>{controls.target.set(0,1.4,0);camera.position.set(0,1.7,-6.2);controls.update();});
document.querySelector('#face-view').addEventListener('click',()=>{controls.target.set(0,2.25,0);camera.position.set(.08,2.3,1.65);controls.update();});
let cloakVisible=true;
function applyWardrobe(){
 if(!actor||!nativePreview)return;
 const armor=document.querySelector('#armor').value;
 actor.traverse(o=>{
  if(o.userData.armor_style==='plate')o.visible=armor==='plate';
  if(o.userData.equipment_slot==='cloak')o.visible=cloakVisible;
 });
}
document.querySelector('#armor').addEventListener('change',applyWardrobe);
document.querySelector('#toggle-cloak').addEventListener('click',e=>{
 cloakVisible=!cloakVisible;e.currentTarget.setAttribute('aria-pressed',String(cloakVisible));
 e.currentTarget.textContent=cloakVisible?'Pelerin açık':'Pelerin kapalı';applyWardrobe();
});
const requested=new URLSearchParams(location.search).get('hero');
select(heroes.includes(requested)?requested:'aldren');
window.addEventListener('pagehide',()=>{selection++;renderer.setAnimationLoop(null);resizeObserver.disconnect();controls.dispose();if(actor)release(actor);pedestal.geometry.dispose();pedestal.material.dispose();environment.dispose();renderer.dispose();},{once:true});
