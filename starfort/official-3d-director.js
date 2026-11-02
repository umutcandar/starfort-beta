/** One GPU presentation driver for authenticated story, maze, veteran, rift and boss.
 * Uses exactly the same renderer as real-time guild battles. Only the database RPC
 * can modify combat, resources, or rewards. Never reads/writes local save state. */
import {createBattleRenderer} from './battle-render-adapter.js';
import {officialBattleRoom,officialMissionIdentity} from './official-battle-bridge.js';
const KEY='starfort:official-3d-v228';
export function officialGraphicsPreference(store){
 try{return store?.getItem(KEY)==='2d'?'2d':'3d';}catch{return '3d';}
}
export function createOfficialBattleDirector({store=null,onModeChange=()=>{},motionPreference=false}={}){
 let preferred=officialGraphicsPreference(store),renderer=null,canvas=null,active=null,party=[],previous=null,owner=null;
 let clock=0,frameId=null,lastRender=0,disposed=false,root=null,mode='sprites',lost=()=>{};
 function stop(){if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}}
 function release(){
  stop();try{canvas?.removeEventListener('webglcontextlost',lost);}catch{}
  try{renderer?.dispose();}catch{}
  renderer=null;canvas=null;mode='sprites';previous=null;active=null;party=[];owner=null;
  if(root){root.classList.remove('is-3d');root=null;}
 }
 function frame(){
  frameId=null;
  if(disposed||!renderer||!active||!root?.isConnected||document.hidden){if(!document.hidden&&!disposed&&renderer&&root?.isConnected)frameId=requestAnimationFrame(frame);return;}
  if(root.clientWidth!==lastRender){renderer.resize();lastRender=root.clientWidth;}
  const now=Date.now(),room=officialBattleRoom(party,active,{now,previous});
  if(room){
   try{renderer.render(room,room.you,now/1000,{quality:root.clientWidth<560?'performance':'balanced',cameraMode:'overview',reducedMotion:motionPreference});}
   catch(error){console.warn('Resmî 3D çizimi devre dışı:',error);release();onModeChange('sprites');return;}
  }
  frameId=requestAnimationFrame(frame);
 }
 function displayMode(el){
  el?.classList.toggle('is-3d',mode==='webgl3d');
  const badge=el?.querySelector('[data-official-render-state]');
  if(badge)badge.textContent=mode==='webgl3d'?'3D canlı savaş':'2D savaş';
  const button=el?.querySelector('[data-official-render-toggle]');
  if(button){button.textContent=mode==='webgl3d'?'3D açık · 2D’ye geç':'2D açık · 3D’yi dene';button.setAttribute('aria-pressed',String(mode==='webgl3d'));}
 }
 function sync(container,team,mission,userId=null){
  if(disposed)return;
  const view=container?.querySelector('.official-combat-scene');
  if(!mission||!view||!userId){release();return;}
  const id=officialMissionIdentity(mission);
  if(!id){release();return;}
  if(owner!==null&&owner!==userId)release();
  if(active&&id!==officialMissionIdentity(active)){release();}
  const prev=active;
  party=[...team];active={...mission,cooldowns:{...(mission.cooldowns||{})}};owner=userId;
  if(prev&&prev.turn<mission.turn)previous=prev;
  root=view;
  if(preferred==='2d'){release();mode='sprites';displayMode(view);return;}
  const spot=view.querySelector('[data-official-3d-view]');
  if(!spot)return;
  if(!renderer){
   const fresh=document.createElement('canvas');fresh.className='official-3d-canvas';
   fresh.setAttribute('aria-hidden','true');spot.append(fresh);
   let candidate;
   try{candidate=createBattleRenderer(fresh,{quality:spot.clientWidth<560?'performance':'balanced',renderMode:'3d',reducedMotion:motionPreference});}
   catch(error){console.warn('3D savaşı açılamadı:',error);release();displayMode(view);return;}
   if(candidate.mode!=='webgl3d'){candidate.dispose();candidate.canvas.remove();mode='sprites';displayMode(view);return;}
   renderer=candidate;canvas=candidate.canvas;mode='webgl3d';
   lost=()=>{release();onModeChange('sprites');};
   canvas.addEventListener('webglcontextlost',lost,{once:true});
  }else if(canvas.parentNode!==spot){spot.append(canvas);}
  displayMode(view);
  stop();frameId=requestAnimationFrame(frame);
 }
 function toggle(container,team,mission,userId){
  preferred=preferred==='3d'?'2d':'3d';
  try{store?.setItem(KEY,preferred);}catch{}
  release();onModeChange(preferred);
  sync(container,team,mission,userId);
  return preferred;
 }
 function pause(){stop();}
 function resume(){if(renderer&&active&&!disposed&&frameId===null)frameId=requestAnimationFrame(frame);}
 function destroy(){release();disposed=true;}
 return {sync,toggle,pause,resume,destroy,mode:()=>mode,preference:()=>preferred,stats:()=>renderer?.stats()||{mode:'sprites'}};
}
