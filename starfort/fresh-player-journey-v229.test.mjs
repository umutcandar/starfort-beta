import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
const T=Date.UTC(2026,10,2,10),DAY=86400000,STARTING={gold:280,wood:180,stone:150,aether:65};
function fight(s,stage=null,now=T){
 const begun=stage===null?R.startLabyrinthBattle(s):R.startLiveBattle(s,stage,{enforceGates:true});
 if(!begun.ok)return {ok:false,reason:begun.error,phase:'start'};
 for(let f=0;f<1800&&s.battle.status==='active';f++){
  const progress=R.advanceCombat(s,300,now);assert.equal(progress.ok,true);
  if(s.battle.status==='active')for(const hero of s.battle.allies){
    if(hero.hp>0&&R.abilityState(s.battle,hero.id).ready){
      const done=R.useHeroAbility(s,hero.id,now);
      assert.equal(done.ok,true,'a ready hero ability must be castable');
    }
  }
 }
 assert.notEqual(s.battle.status,'active','the battle may not run infinitely');
 return {ok:s.battle.status==='won',reason:s.battle.status,phase:'combat'};
}
function mazeFloor(s,now){
 const layout=R.labyrinthLayout(s.labyrinth.floor);
 for(const cell of layout.path.slice(1)){
  const move=R.moveLabyrinth(s,cell);
  assert.equal(move.ok,true,'each true corridor move must be legal');
  if(cell===layout.guard){
   const guardian=fight(s,null,now);
   if(!guardian.ok)return guardian;
   assert.equal(s.labyrinth.guardianDefeated,true);
  }
 }
 const finish=R.completeLabyrinthFloor(s);
 assert.equal(finish.ok,true,'after real guardian fight and exit, next floor must unlock');
 return {ok:true};
}
function upgradeOnce(s,id,now,history){
 const result=R.upgradeBuildingFromProduction(s,id,now);
 if(result.ok)history.push('build '+id+' '+s.buildings[id]+(result.started?' queued':' ready'));
 return result.ok;
}
export function autoplayHonestNewPlayer({days=45}={}){
 const state=R.createState(T),history=[],checks=[];
 let furthest=0,daysUsed=0,firstWinDay=null,firstGate=null;
 assert.deepEqual(state.res,STARTING);
 const all=()=>state.cleared.length===8;
 for(let day=0;day<days&&!all();day++){
  const now=T+day*DAY;daysUsed=day;
  if(day>0){const collected=R.collect(state,now);assert.equal(collected.ok,true);checks.push({day,gain:collected.gain});}
  const reward=R.claimDailyReward(state,now);
  assert.equal(reward.ok,true,'one reward per virtual day');
  assert.equal(R.claimDailyReward(state,now).ok,false,'no same-day double award');
  if(state.construction&&now>=state.construction.endsAt){
   const finished=R.completeConstruction(state,now);
   assert.equal(finished.ok,true,'the actual queued construction must finish');
   history.push('day '+day+' complete '+finished.id+' '+finished.level);
  }
  // Spend only already earned resources, and use the same in-game upgrade APIs.
  if(day===0){
   assert.equal(R.equipItem(state,'aldren','iron_sword').ok,true);
   assert.equal(R.equipItem(state,'aldren','ward_mail').ok,true);
  }
  if(state.cleared.length>=1&&state.inventory.lunar_charm)R.equipItem(state,'aldren','lunar_charm');
  const nextStage=R.STAGES[state.cleared.length]||R.STAGES[7];
  const tierMax=Math.min(20,1+day*2);
  for(let pass=0;pass<35&&R.teamPower(state)<nextStage.recommendedPower*1.12;pass++){
   const id=state.team.slice().sort((a,b)=>state.heroes[a].level-state.heroes[b].level)[0];
   if(state.heroes[id].level>=tierMax)break;
   if(!R.upgradeHero(state,id).ok)break;
  }
  if(!state.construction){
   if(state.buildings.keep<Math.min(3,1+Math.floor((day+2)/2)))upgradeOnce(state,'keep',now,history);
   else if(state.buildings.forge<4)upgradeOnce(state,'forge',now,history);
  }
  for(let step=0;step<20&&!all();step++){
   const stage=state.cleared.length+1;
   const gate=R.stageRequirements(state,R.STAGES[stage-1],R.teamPower(state));
   if(!gate.available){
    firstGate||=gate.reasons.join('; ');
    if(gate.requirements.some(x=>x.key==='maze'&&!x.met)){
     if(R.labyrinthStatus(state).available){
      const outcome=mazeFloor(state,now);
      if(!outcome.ok){history.push('day '+day+' guardian not won: '+outcome.reason);break;}
      history.push('day '+day+' maze cleared '+state.labyrinth.cleared);
      continue;
     }
    }
    break;
   }
   const outcome=fight(state,stage,now);
   if(!outcome.ok){history.push('day '+day+' stage '+stage+' loss '+outcome.reason);break;}
   history.push('day '+day+' story victory '+stage+' stars '+(state.campaignStars[stage]||'?'));
   if(firstWinDay===null)firstWinDay=day;
   furthest=stage;
  }
  const save=R.restoreState(JSON.stringify(state),now);
  assert.equal(save.cleared.length,state.cleared.length,'server-independent local save survives each honest day');
  assert.equal(save.buildings.keep,state.buildings.keep);
 }
 return {state,daysUsed,furthest,firstWinDay,firstGate,history,checks};
}
test('a completely fresh unboosted player can win the first chapter with only genuine starter resources, starter equipment and earned actions',()=>{
 const s=R.createState(T),before=structuredClone(s.res);
 assert.equal(R.equipItem(s,'aldren','iron_sword').ok,true);
 assert.equal(R.equipItem(s,'aldren','ward_mail').ok,true);
 assert.deepEqual(s.res,before,'starter equipment cannot cost imaginary currency');
 const result=fight(s,1,T);
 assert.equal(result.ok,true,'chapter 1 should be winnable without 20-level heroes or gifted resources: '+result.reason);
 assert.deepEqual(s.cleared,[1]);
 assert.ok(s.res.gold>=before.gold);
 assert.ok(s.campaignStars[1]>=1);
});
test('honest virtual player reaches all eight chapters without injecting resources, mastery, stars, maze clears or maxing buildings',()=>{
 const result=autoplayHonestNewPlayer({days:90}),s=result.state;
 assert.equal(result.firstWinDay,0,'first victory must not be hidden behind a day-long paywall');
 assert.equal(result.furthest,8,JSON.stringify({daysUsed:result.daysUsed,firstGate:result.firstGate,history:result.history.slice(-18),team:s.team,power:R.teamPower(s),res:s.res,buildings:s.buildings,labyrinth:s.labyrinth?.cleared}));
 assert.equal(s.cleared.length,8);
 assert.ok(result.daysUsed>=0&&result.daysUsed<90);
 assert.ok(result.history.some(v=>v.includes('maze cleared')),'real guardian and corridor gameplay must be needed');
 assert.ok(result.history.some(v=>v.includes('build forge')),'demirhane upgrades are genuinely required');
 assert.ok(s.buildings.forge<=4,'the full story need not instantly max every village building');
 assert.ok(s.heroes.aldren.level<=20);
 console.log('Honest player eight-chapter path: ',JSON.stringify({days:result.daysUsed,events:result.history.length,stars:R.campaignStarStatus(s).total,forge:s.buildings.forge,maze:s.labyrinth.cleared,power:R.teamPower(s)}));
});
test('the first playthrough regression forbids artificially inflating resources and heroes',()=>{
 const script=readFileSync(new URL('./fresh-player-journey-v229.test.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(script,/s\.res\[.*\]\s*=\s*1e[6-9]/);
 assert.doesNotMatch(script,/s\.buildings\[.*\]\s*=\s*8/);
 assert.doesNotMatch(script,/s\.heroes\[.*\]\s*=\s*\{level:20\}/);
 assert.match(script,/R\.moveLabyrinth/);
 assert.match(script,/R\.completeLabyrinthFloor/);
 assert.match(script,/R\.startLiveBattle/);
});
