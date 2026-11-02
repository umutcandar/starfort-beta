/** STARFORT v2.28 — the existing WebGL battle renderer displays one server-owned PvE state.
 * This module cannot decide damage, rewards or victories; it only maps the accepted
 * Supabase mission snapshot to the same room format used by the arena renderer. */
import {HEROES} from './rules.js';
import {SECOND_ACT} from './second-act.js';
import {actTwoEncounter} from './act-two-encounters.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const enemiesFor=mission=>mission.mode==='act2'&&mission.wave===3?['caster','boss','raider']:mission.mode==='act2'&&mission.wave===2?['raider','caster','caster']:mission.mode==='story'&&mission.waves>1&&mission.wave===mission.waves?['raider','boss','caster']:mission.mode==='story'&&mission.wave===2?['caster','raider','caster']:mission.mode==='boss'||mission.stage>=7?['raider','boss','caster']:['raider','caster','raider'];
export function officialMissionIdentity(mission){
 if(!mission||!Number.isSafeInteger(mission.startedAt))return null;
 return `pve:${mission.mode}:${mission.stage}:${mission.startedAt}`;
}
export function officialBattleRoom(team,mission,{now=Date.now(),previous=null}={}){
 if(!mission||!Array.isArray(team)||!Number.isInteger(mission.stage)||!Number.isInteger(mission.turn))return null;
 const id=officialMissionIdentity(mission);
 if(!id)return null;
 const roster=team.filter(hero=>HEROES.some(h=>h.id===hero)).slice(0,3);
 const isRecent=Number.isFinite(now)&&now-mission.lastTurnAt>=0&&now-mission.lastTurnAt<1450;
 const outgoing=mission.lastAction?.startsWith('skill:')||mission.lastAction==='skill';
 const allyHealth=clamp(mission.playerHp/Math.max(1,mission.playerMaxHp),0,1);
 const enemyHealth=clamp(mission.enemyHp/Math.max(1,mission.enemyMaxHp),0,1);
 const currentTurn=mission.turn;
 // Positions are animation choreography, never submitted to the game server.
 const impulse=isRecent&&currentTurn>0?1:0;
 const ally=roster.map((hero,i)=>({
  id:'official-hero-'+hero,heroId:hero,name:HEROES.find(h=>h.id===hero)?.name||hero,
  team:0,x:24+i*4+impulse*3,y:20+i*12,type:null,
  hp:Math.max(1,Math.round(allyHealth*1000)),maxHp:1000,
  action:impulse&&((outgoing&&mission.lastAction==='skill:'+hero)||(mission.lastAction==='strike'&&i===0))?'cast':'idle',
  attackAt:isRecent?mission.lastTurnAt/1000:0
 }));
 const encounter=actTwoEncounter(mission);
 const enemyIds=encounter?encounter.roster.map(unit=>unit.kind):enemiesFor(mission);
 const foes=enemyIds.map((kind,i)=>({
  id:'official-enemy-'+i,name:encounter?.roster[i]?.name||(kind==='boss'?(mission.mode==='act2'?SECOND_ACT[mission.stage-1]?.boss||'Kadim Hükümdar':'Kadim Hükümdar'):kind==='caster'?'Gölge Büyücüsü':'Kül Akıncısı'),
  team:1,x:72-i*4-impulse*2,y:20+i*12,type:kind,
  hp:Math.max(1,Math.round(enemyHealth*1000)),maxHp:1000,
  action:impulse&&i===1?'attack':'idle',attackAt:isRecent?mission.lastTurnAt/1000:0
 }));
 const fx=[];
 if(impulse){
  const changed=previous&&previous.turn<mission.turn;
  if(changed){
   fx.push({x:61,y:31,t:now/1000,team:0,type:outgoing?'skill':'strike'});
   if(mission.playerHp<previous.playerHp)fx.push({x:36,y:35,t:now/1000,team:1,type:'impact'});
  }
 }
 return {id,variant:'duel',players:ally,squads:foes,you:ally[0]?.id||null,fx,
  turn:currentTurn,result:'server-only',source:'authenticated-postgres'};
}
export function officialBattleDelta(before,after){
 if(!after)return null;
 if(!before||officialMissionIdentity(before)!==officialMissionIdentity(after))return {turn:after.turn,damage:0,received:0,action:after.lastAction,initial:true};
 if(after.turn<=before.turn)return null;
 return Object.freeze({turn:after.turn,waveAdvanced:after.wave>before.wave,damage:after.wave>before.wave?Math.max(0,before.enemyHp):Math.max(0,before.enemyHp-after.enemyHp),
  received:Math.max(0,before.playerHp-after.playerHp),action:after.lastAction,initial:false});
}
export function officialBattleOutcome(before,report){
 if(!before||!report||typeof report.won!=='boolean')return null;
 if(!['story','act2','maze','veteran','rift','boss'].includes(before.mode)||before.stage!==report.stage)return null;
 return Object.freeze({won:report.won,stars:clamp(Number(report.stars)||0,0,3),stage:report.stage,
  reward:report.won&&report.reward&&typeof report.reward==='object'?{...report.reward}:{},source:'server'});
}
