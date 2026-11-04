/** STARFORT beta.13 — 3D battle direction from accepted official server turns.
 * Positions, travel and effects are read-only choreography, never physics authority.
 * A fresh visit/reload must not replay an unobserved hit. All HP, turns and rewards
 * continue to come from the authenticated PostgreSQL mission RPC.
 */
import {HEROES} from './rules.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=n=>Number.isFinite(n)?n:0;
const ease=t=>{const x=clamp(t,0,1);return x*x*(3-2*x);};
export const OFFICIAL_CLASH_MS=1900;
const roles=Object.freeze(Object.fromEntries(HEROES.map(h=>[h.id,h.role])));
const CLOSE=new Set(['tank','fighter','assassin']);
const isSkill=s=>typeof s==='string'&&s.startsWith('skill:');
export function acceptedOfficialTurn(previous,mission){
 return Boolean(previous&&mission&&
   previous.mode===mission.mode&&previous.stage===mission.stage&&
   previous.startedAt===mission.startedAt&&
   Number.isSafeInteger(previous.turn)&&Number.isSafeInteger(mission.turn)&&
   mission.turn===previous.turn+1&&
   Number.isSafeInteger(previous.playerHp)&&Number.isSafeInteger(mission.playerHp)&&
   Number.isSafeInteger(previous.enemyHp)&&Number.isSafeInteger(mission.enemyHp));
}
export function officialStrikeWindow(previous,mission,now=Date.now()){
 if(!acceptedOfficialTurn(previous,mission))return null;
 const elapsed=finite(now)-finite(mission.lastTurnAt);
 if(!Number.isFinite(now)||!Number.isFinite(mission.lastTurnAt)||elapsed<0||elapsed>OFFICIAL_CLASH_MS)return null;
 const playerHit=Math.max(0,previous.playerHp-mission.playerHp);
 const enemyHit=mission.wave>previous.wave?Math.max(0,previous.enemyHp):Math.max(0,previous.enemyHp-mission.enemyHp);
 const waveAdvanced=mission.wave>previous.wave;
 return Object.freeze({
  age:elapsed/1000,progress:clamp(elapsed/OFFICIAL_CLASH_MS,0,1),
  enemyHit,playerHit,waveAdvanced,action:waveAdvanced?'reinforce':String(mission.lastAction||'strike'),
  heroId:isSkill(mission.lastAction)?mission.lastAction.slice(6):null
 });
}
function surge(progress){
 // A single committed action: advance -> strike -> pull back. No idle attack loop.
 const peak=.48,move=progress<peak?ease(progress/peak):1-ease((progress-peak)/(1-peak));
 return clamp(move,0,1);
}
export function officialBattleFormation(team,enemyIds,window=null){
 const roster=(Array.isArray(team)?team:[]).filter(id=>roles[id]).slice(0,3);
 const enemies=(Array.isArray(enemyIds)?enemyIds:[]).filter(x=>typeof x==='string').slice(0,3);
 const action=window?.action||'idle',pulse=window?surge(window.progress):0;
 const active=window&&window.action!=='reinforce';
 const casting=isSkill(action)||action==='rally';
 const guard=action==='guard';
 const feint=action==='feint';
 const strike=action==='strike'||feint||isSkill(action);
 const actors=roster.map((id,i)=>{
  const role=roles[id],front=CLOSE.has(role),lane=(i-1)*12;
  const baseX=front?29:24,baseZ=30+lane;
  const selected=action==='skill:'+id;
  const push=active&&strike?(selected?18:front?13:4)*pulse:guard?(front?2:-2)*pulse:0;
  const dodge=feint?(i%2===0?-1:1)*7*pulse:0;
  const anim=active&&window.progress<.88?(selected||action==='rally'&&role==='healer'?'cast':guard?'guard':strike&&front?'attack':casting?'cast':'idle'):'idle';
  return Object.freeze({id,x:baseX+push,y:baseZ+dodge,action:anim,role,team:0,face:1,attackAt:window?window.age:0});
 });
 const foes=enemies.map((kind,i)=>{
  const isBoss=kind==='boss',baseX=isBoss?69:75,lane=(i-1)*11;
  const advancing=active&&window.playerHit>0;
  const enemySwing=advancing&&window.progress>.28&&window.progress<.83;
  return Object.freeze({
   kind,x:baseX-(advancing?(isBoss?8:11)*pulse:0),y:30+lane,
   action:enemySwing?'attack':window?.enemyHit>0&&window.progress>.3&&window.progress<.8?'hit':'idle',
   team:1,face:-1,role:isBoss?'boss':kind==='caster'?'mage':'fighter',attackAt:window?window.age:0
  });
 });
 return Object.freeze({actors:Object.freeze(actors),foes:Object.freeze(foes),active:Boolean(active),pulse});
}
export function officialClashEffects(window,now=Date.now()){
 if(!window||window.action==='reinforce')return [];
 const p=window.progress,age=window.age;
 const effects=[];
 if(window.enemyHit>0)effects.push(Object.freeze({
  x:54,y:30,type:isSkill(window.action)?'spell':window.action==='feint'?'flank':'slash',
  team:0,age,progress:p,t:now/1000-age
 }));
 if(window.playerHit>0)effects.push(Object.freeze({
  x:46,y:30,type:'impact',team:1,age,progress:p,t:now/1000
 }));
 return effects;
}
