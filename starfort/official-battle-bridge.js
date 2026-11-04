/** STARFORT v2.28 — the existing WebGL battle renderer displays one server-owned PvE state.
 * This module cannot decide damage, rewards or victories; it only maps the accepted
 * Supabase mission snapshot to the same room format used by the arena renderer. */
import {HEROES} from './rules.js';
import {SECOND_ACT} from './second-act.js';
import {actTwoEncounter} from './act-two-encounters.js';
import {officialStrikeWindow,officialBattleFormation,officialClashEffects} from './official-3d-choreography-v259.js';
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
 const allyHealth=clamp(mission.playerHp/Math.max(1,mission.playerMaxHp),0,1);
 const enemyHealth=clamp(mission.enemyHp/Math.max(1,mission.enemyMaxHp),0,1);
 const encounter=actTwoEncounter(mission);
 const enemyIds=encounter?encounter.roster.map(unit=>unit.kind):enemiesFor(mission);
 // 3D movement is only choreographed for an accepted transition seen in this session.
 const clash=officialStrikeWindow(previous,mission,now);
 const form=officialBattleFormation(roster,enemyIds,clash);
 const ally=form.actors.map(a=>({
   id:'official-hero-'+a.id,heroId:a.id,name:HEROES.find(h=>h.id===a.id)?.name||a.id,
   team:0,x:a.x,y:a.y,type:null,role:a.role,
   hp:Math.max(1,Math.round(allyHealth*1000)),maxHp:1000,
   action:a.action,face:a.face,attackAt:mission.lastTurnAt/1000
 }));
 const foes=form.foes.map((a,i)=>({
   id:'official-enemy-'+i,name:encounter?.roster[i]?.name||(a.kind==='boss'?(mission.mode==='act2'?SECOND_ACT[mission.stage-1]?.boss||'Kadim Hükümdar':'Kadim Hükümdar'):a.kind==='caster'?'Gölge Büyücüsü':'Kül Akıncısı'),
   team:1,x:a.x,y:a.y,type:a.kind,role:a.role,face:a.face,
   hp:Math.max(1,Math.round(enemyHealth*1000)),maxHp:1000,
   action:a.action,attackAt:mission.lastTurnAt/1000
 }));
 const fx=officialClashEffects(clash,now);
 return {id,variant:'official',stage:mission.stage,mode:mission.mode,wave:mission.wave,
   players:ally,squads:foes,you:ally[0]?.id||null,fx,
   turn:mission.turn,result:'server-only',source:'authenticated-postgres'};
}
export function officialBattleDelta(before,after){
 if(!after)return null;
 if(!before||officialMissionIdentity(before)!==officialMissionIdentity(after))return {turn:after.turn,damage:0,received:0,action:after.lastAction,initial:true};
 if(after.turn<=before.turn)return null;
 return Object.freeze({turn:after.turn,waveAdvanced:after.wave>before.wave,damage:after.wave>before.wave?Math.max(0,before.enemyHp):Math.max(0,before.enemyHp-after.enemyHp),
  received:Math.max(0,before.playerHp-after.playerHp),
  healed:Math.max(0,after.playerHp-before.playerHp),action:after.lastAction,initial:false});
}
export function officialBattleOutcome(before,report){
 if(!before||!report||typeof report.won!=='boolean')return null;
 if(!['story','act2','maze','veteran','rift','boss'].includes(before.mode)||before.stage!==report.stage)return null;
 return Object.freeze({won:report.won,stars:clamp(Number(report.stars)||0,0,3),stage:report.stage,
  reward:report.won&&report.reward&&typeof report.reward==='object'?{...report.reward}:{},source:'server'});
}
