/** Pure presentation-layer motion and impact choreography. Never changes the server state. */
export const ANIMATION_STATES=Object.freeze(['idle','run','attack','cast','hit','down']);
const finite=v=>Number.isFinite(v)?v:0;
export const saturate=v=>Math.min(1,Math.max(0,finite(v)));
export function easeOutCubic(v){const t=saturate(v);return 1-(1-t)**3;}
export function actorPose({time=0,speed=0,walk=0,hit=0,face=1,attack=0,cast=0,hp=1,reducedMotion=false}={}){
  if(hp<=0)return {state:'down',bob:0,lean:0,legSwing:0,weaponAngle:0,flash:0,trail:0,scale:1,face:face<0?-1:1};
  const move=saturate(speed),hurt=saturate(hit),strike=saturate(attack),spell=saturate(cast);
  const state=hurt>.14?'hit':spell>.1?'cast':strike>.1?'attack':move>.06?'run':'idle';
  if(reducedMotion)return {state,bob:0,lean:0,legSwing:0,weaponAngle:0,flash:hurt*.45,trail:0,scale:1,face:face<0?-1:1};
  const phase=finite(walk)*1.55+finite(time)*1.4;
  const stride=Math.sin(phase*2.4)*move;
  const swing=Math.sin(phase*1.2)*move;
  const combo=Math.sin(strike*Math.PI)*strike;
  return {state,bob:Math.abs(Math.sin(phase*2.4))*move*3.8+Math.sin(finite(time)*1.8)*.7,
    lean:swing*.045+combo*.11-hurt*.085,legSwing:stride*.65,
    weaponAngle:-.22+swing*.22-combo*.98+spell*.52,
    flash:hurt*.65,trail:Math.max(move*.75,combo*.8),scale:1+combo*.06-hurt*.035,
    face:face<0?-1:1};
}
export function fxLifetime(type){return /gate-down|core-down|ram-down/.test(type)?1.4:/burst|ram-strike|gate-hit/.test(type)?.9:.55;}
export function impactFrame(fx,elapsed){
  if(!fx||!Number.isFinite(fx.t)||!Number.isFinite(elapsed))return null;
  const duration=fxLifetime(String(fx.type||''));const age=elapsed-fx.t;
  if(age<0||age>=duration)return null;
  const phase=saturate(age/duration),intensity=(1-phase)**1.6;
  const severe=/gate-down|core-down|ram-down/.test(String(fx.type));
  return {phase,intensity,duration,severe,radius:(severe?230:90)*(0.28+easeOutCubic(phase)),alpha:intensity*(severe?.95:.7)};
}
/** Palette and effect-density budget based on device quality. */
export function effectsBudget(quality='balanced',reduced=false){
  if(reduced)return {embers:0,shards:0,softLight:false};
  if(quality==='ultra')return {embers:65,shards:16,softLight:true};
  if(quality==='performance')return {embers:10,shards:4,softLight:false};
  return {embers:26,shards:8,softLight:true};
}

/** Perspective ground projection: server coordinates stay in 0..100 × 0..60 units.
 * A perspective backdrop must never show units floating in the mountain skyline. */
export function groundY(serverY){return 385+Math.max(0,Math.min(600,Number(serverY)||0))*.30;}
export function inverseGroundY(screenY){return (Number(screenY)-385)/.30;}
export function depthScale(serverY){return .57+Math.max(0,Math.min(600,Number(serverY)||0))/600*.43;}
