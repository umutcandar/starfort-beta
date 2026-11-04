/** STARFORT Beta.15: actual skinned GLB combat in authenticated PvE.
 * The previous custom cube rig remains available to guild/arena renderers,
 * NEVER as the official "premium 3D" fallback. If genuine rigs can't load
 * we show existing painted 2D art, not pretend boxes are quality models.
 *
 * All character health, actions, loot, turns remain authenticated-server-owned.
 */
import {officialBattleRoom,officialMissionIdentity} from './official-battle-bridge.js';
import {CAMERA_DEFAULT,orbitCamera,zoomCamera} from './official-3d-camera-v259.js';
import {cinematicCameraShot} from './official-3d-camera-shots-v260.js';
import {officialStrikeWindow} from './official-3d-choreography-v259.js';
const KEY='starfort:official-3d-v228';
export function officialGraphicsPreference(store){
 try{return store?.getItem(KEY)==='2d'?'2d':'3d';}catch{return '3d';}
}
export function premiumRiggedBundleUrl(host=''){
 return host==='umutcandar.github.io'
  ?'https://starfort-online-beta.onrender.com/starfort/assets/rigged/engine-v264.js'
  :'./assets/rigged/engine-v264.js';
}
export function createOfficialBattleDirector({store=null,onModeChange=()=>{},motionPreference=false,audioCue=()=>{}}={}){
 let preferred=officialGraphicsPreference(store),renderer=null,canvas=null,active=null,party=[],previous=null,owner=null;
 let frameId=null,lastRender=0,lastPaint=0,disposed=false,root=null,mode='sprites',lost=()=>{},lastSoundKey=null;
 let camera={...CAMERA_DEFAULT,distance:51},down=null,dragEl=null,loading=null,pendingCanvas=null,generation=0;
 function stop(){if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}}
 function pointerDown(e){if(e.button!==0&&e.pointerType==='mouse')return;
  down={id:e.pointerId,x:e.clientX};try{dragEl?.setPointerCapture(e.pointerId);}catch{}}
 function pointerMove(e){if(!down||e.pointerId!==down.id)return;camera=orbitCamera(camera,e.clientX-down.x);down.x=e.clientX;}
 function pointerUp(e){if(down?.id===e.pointerId)down=null;}
 function wheel(e){if(!e.ctrlKey)e.preventDefault();camera=zoomCamera(camera,e.deltaY);}
 function detachCanvas(){
  if(dragEl){dragEl.removeEventListener('pointerdown',pointerDown);
   dragEl.removeEventListener('pointermove',pointerMove);
   dragEl.removeEventListener('pointerup',pointerUp);
   dragEl.removeEventListener('pointercancel',pointerUp);
   dragEl.removeEventListener('wheel',wheel);dragEl=null;down=null;}
  try{canvas?.removeEventListener('webglcontextlost',lost);}catch{}
  try{canvas?.remove();}catch{}
  try{pendingCanvas?.remove();}catch{}
  canvas=null;pendingCanvas=null;
 }
 function release(){
  generation++;stop();detachCanvas();
  try{renderer?.dispose();}catch{}renderer=null;loading=null;
  mode='sprites';previous=null;active=null;party=[];owner=null;lastPaint=0;lastSoundKey=null;
  if(root){root.classList.remove('is-3d');root.classList.remove('is-loading-rigs');root=null;}
 }
 function displayMode(el){
  el?.classList.toggle('is-3d',mode==='rigged3d');
  el?.classList.toggle('is-loading-rigs',mode==='loading');
  const badge=el?.querySelector('[data-official-render-state]');
  if(badge)badge.textContent=mode==='rigged3d'?'3D karakter savaşı':mode==='loading'?'3D modeller yükleniyor':'2D savaş';
  const button=el?.querySelector('[data-official-render-toggle]');
  if(button){button.textContent=mode==='rigged3d'?'3D açık · 2D’ye geç':mode==='loading'?'3D modeller yükleniyor…':'2D açık · 3D’yi dene';
   button.disabled=mode==='loading';button.setAttribute('aria-pressed',String(mode==='rigged3d'));}
 }
 function frame(){
  frameId=null;
  if(disposed||!renderer||!active||!root?.isConnected||document.hidden){
   if(!document.hidden&&!disposed&&renderer&&root?.isConnected)frameId=requestAnimationFrame(frame);return;
  }
  if(root.clientWidth!==lastRender){renderer.resize();lastRender=root.clientWidth;}
  const clock=performance.now(),interval=root.clientWidth<560?48:32;
  if(lastPaint&&clock-lastPaint<interval){frameId=requestAnimationFrame(frame);return;}
  lastPaint=clock;
  const now=Date.now(),room=officialBattleRoom(party,active,{now,previous});
  const shot=cinematicCameraShot(previous,active,now,camera,{reducedMotion:motionPreference});
  const verified=officialStrikeWindow(previous,active,now);
  if(room&&verified&&verified.action!=='reinforce'){
   const key=room.id+':'+room.turn;
   if(lastSoundKey!==key){
    lastSoundKey=key;
    const action=verified.action;
    const sound=action==='guard'?'shield':action==='rally'||action.startsWith('skill:')?'spell':
     action==='feint'?'bow':verified.enemyHit>100?'heavy':'sword';
    try{audioCue(sound);}catch(error){console.warn('Savaş sesi oynatılamadı:',error);}
   }
  }
  if(room){
   try{renderer.render(room,room.you,now/1000,{quality:root.clientWidth<560?'performance':'balanced',
     cameraMode:'cinematic',cameraYaw:shot.yaw,cameraDistance:shot.distance,reducedMotion:motionPreference});
    // Read-only diagnostics: tests require on-screen anatomical bodies, not a fake 3D badge.
    const visual=renderer.stats();
    root.dataset.officialAnatomicalActors=String(visual.anatomicalActors||0);
    root.dataset.officialDrawCalls=String(visual.drawCalls||0);
   }
   catch(error){console.warn('3D iskeletli savaş çizimi durduruldu:',error);
    preferred='2d';try{store?.setItem(KEY,'2d');}catch{}release();onModeChange('sprites');return;}
  }
  frameId=requestAnimationFrame(frame);
 }
 function attachInput(fresh){
  dragEl=fresh;
  fresh.addEventListener('pointerdown',pointerDown);fresh.addEventListener('pointermove',pointerMove);
  fresh.addEventListener('pointerup',pointerUp);fresh.addEventListener('pointercancel',pointerUp);
  fresh.addEventListener('wheel',wheel,{passive:false});
  lost=()=>{preferred='2d';try{store?.setItem(KEY,'2d');}catch{}release();onModeChange('sprites');};
  fresh.addEventListener('webglcontextlost',lost,{once:true});
 }
 function loadRealModels(spot){
  const id=++generation;
  const fresh=document.createElement('canvas');fresh.className='official-3d-canvas';
  fresh.setAttribute('aria-hidden','true');pendingCanvas=fresh;spot.append(fresh);
  mode='loading';displayMode(root);
  loading=(async()=>{
   // This module is bundled at deployment and serves the GLBs from the same host.
   const host=typeof location==='undefined'?'':location.hostname;
   const module=await import(premiumRiggedBundleUrl(host));
   if(typeof module.createRiggedBattle!=='function')throw Error('Real 3D engine missing');
   const instance=await module.createRiggedBattle(fresh,{quality:spot.clientWidth<560?'performance':'balanced',
     reducedMotion:motionPreference});
   if(disposed||id!==generation||preferred!=='3d'||!active){instance.dispose();fresh.remove();return;}
   renderer=instance;canvas=fresh;pendingCanvas=null;mode='rigged3d';
   attachInput(canvas);displayMode(root);stop();frameId=requestAnimationFrame(frame);
  })().catch(error=>{
   console.warn('3D modeller yüklenemedi, 2D çizimler korunuyor:',error);
   if(disposed||id!==generation)return;
   preferred='2d';try{store?.setItem(KEY,'2d');}catch{}
   release();onModeChange('sprites');
  }).finally(()=>{if(generation===id)loading=null;});
 }
 function sync(container,team,mission,userId=null){
  if(disposed)return;
  const view=container?.querySelector('.official-combat-scene');
  if(!mission||!view||!userId){release();return;}
  const id=officialMissionIdentity(mission);if(!id){release();return;}
  if(owner!==null&&owner!==userId)release();
  if(active&&id!==officialMissionIdentity(active))release();
  const prev=active;
  party=[...(Array.isArray(team)?team:[])];
  active={...mission,cooldowns:{...(mission.cooldowns||{})}};owner=userId;
  if(prev&&prev.turn<mission.turn)previous=prev;
  root=view;
  if(preferred==='2d'){if(renderer||loading)release();mode='sprites';displayMode(view);return;}
  const spot=view.querySelector('[data-official-3d-view]');if(!spot)return;
  if(!renderer&&!loading)loadRealModels(spot);
  else if(canvas&&canvas.parentNode!==spot)spot.append(canvas);
  else if(pendingCanvas&&pendingCanvas.parentNode!==spot)spot.append(pendingCanvas);
  displayMode(view);
  if(renderer){stop();frameId=requestAnimationFrame(frame);}
 }
 function toggle(container,team,mission,userId){
  preferred=preferred==='3d'?'2d':'3d';
  try{store?.setItem(KEY,preferred);}catch{}
  release();onModeChange(preferred);sync(container,team,mission,userId);return preferred;
 }
 function pause(){stop();}
 function resume(){if(renderer&&active&&!disposed&&frameId===null)frameId=requestAnimationFrame(frame);}
 function destroy(){release();disposed=true;}
 return {sync,toggle,pause,resume,destroy,mode:()=>mode,preference:()=>preferred,
  camera:()=>({...camera}),stats:()=>renderer?.stats()||{mode,loading:Boolean(loading)}};
}
