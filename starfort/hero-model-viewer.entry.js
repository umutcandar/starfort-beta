import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const canvas=document.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#101b22');
const camera=new THREE.PerspectiveCamera(35,1,.01,40);
camera.position.set(.15,1.4,5.6);
const controls=new OrbitControls(camera,canvas);
controls.target.set(0,1.2,0);controls.enableDamping=true;
controls.minDistance=1;controls.maxDistance=7;
scene.add(new THREE.HemisphereLight(0xe2efff,0x3e302c,2));
for(const [color,power,x,y,z] of [[0xffe7c5,2,3,5,4],[0xa9c9ff,2,-4,3,-2]]){
 const light=new THREE.DirectionalLight(color,power);light.position.set(x,y,z);scene.add(light);
}
const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.83,.87,.08,64),new THREE.MeshStandardMaterial({color:0x243641,roughness:.7}));
pedestal.position.y=-.06;scene.add(pedestal);
const heroes=['aldren','lyra','rovan','mira','doran','vesper','eira'];
const labels=['Aldren','Lyra','Rovan','Mira','Doran','Vesper','Eira'];
const loader=new GLTFLoader();let actor=null,selection=0,mixer=null,currentAction=null;
document.querySelector('#heroes').innerHTML=heroes.map((id,i)=>`<button data-id="${id}" aria-pressed="false">${labels[i]}</button>`).join('');
function release(root){
 root.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}}});
}
async function select(id){
 const request=++selection;document.querySelector('#status').textContent='Model yükleniyor…';
 document.querySelector('#reference').src=`assets/heroes-3d/source/${id}.png`;
 document.querySelector('#name').textContent=labels[heroes.indexOf(id)];
 for(const b of document.querySelectorAll('[data-id]'))b.setAttribute('aria-pressed',String(b.dataset.id===id));
 try{
  const gltf=await loader.loadAsync(`assets/heroes-3d/${id}-rigged.glb`);
  if(request!==selection){release(gltf.scene);return;}
  if(actor){mixer?.stopAllAction();mixer?.uncacheRoot(actor);scene.remove(actor);release(actor);}
  actor=gltf.scene;
  const box=new THREE.Box3().setFromObject(actor),size=box.getSize(new THREE.Vector3());
  actor.scale.setScalar(2.6/size.y);
  const center=box.getCenter(new THREE.Vector3());
  actor.position.set(-center.x*actor.scale.x,-box.min.y*actor.scale.y,-center.z*actor.scale.z);
  actor.rotation.y=Math.PI;
  scene.add(actor);
  mixer=new THREE.AnimationMixer(actor);
  actor.userData.clips=gltf.animations;
  playClip(document.querySelector('#motion').value);
  controls.reset();controls.target.set(0,1.2,0);camera.position.set(.15,1.4,5.6);
  document.querySelector('#status').textContent='Model hazır';
 }catch(error){document.querySelector('#status').textContent='Model açılamadı. '+error.message;}
}
document.querySelector('#heroes').onclick=e=>{const id=e.target.closest('[data-id]')?.dataset.id;if(id)select(id);};
new ResizeObserver(()=>{
 const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}).observe(canvas);
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const delta=Math.min(clock.getDelta(),.05);mixer?.update(delta);controls.update();renderer.render(scene,camera);});
function playClip(name){
 if(!mixer||!actor)return;
 const clip=actor.userData.clips.find(c=>c.name===name);
 if(!clip)return;
 currentAction?.stop();
 currentAction=mixer.clipAction(clip);
 currentAction.reset().play();
}
document.querySelector('#motion').addEventListener('change',e=>playClip(e.target.value));
document.querySelector('#pause-motion').addEventListener('click',e=>{
 if(!mixer)return;
 mixer.timeScale=mixer.timeScale?0:1;
 e.target.textContent=mixer.timeScale?'Hareketi duraklat':'Hareketi sürdür';
});
const requested=new URLSearchParams(location.search).get('hero');
select(heroes.includes(requested)?requested:'aldren');
window.addEventListener('pagehide',()=>{selection++;renderer.setAnimationLoop(null);controls.dispose();if(actor)release(actor);renderer.dispose();},{once:true});
