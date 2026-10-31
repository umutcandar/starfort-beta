// Accelerated deterministic 90-day gameplay audit, NOT a human retention or revenue test.
import * as R from '../rules.js';
import {recordContract} from '../campaign-contracts.js';
const START=Date.UTC(2026,10,1,12);
const players=[{name:'Kısa ziyaret (10 dk/gün)',visits:1,battles:1,upgrades:2},{name:'Düzenli oyuncu (30 dk/gün)',visits:1,battles:3,upgrades:6},{name:'Yoğun oyuncu (60 dk/gün)',visits:2,battles:6,upgrades:10}];
function playBattle(state,stageId,veteranTier){
  const result=veteranTier?R.startVeteranBattle(state,stageId,veteranTier):R.startBattle(state,stageId);
  if(!result.ok)return 'blocked';
  // Deterministic turn-based resolver for stress testing existing campaign rules.
  // This is a faster equivalent of repeated combat commands, not a video/UI test.
  if(veteranTier)state.battle.live=null;
  for(let j=0;j<100&&state.battle.status==='active';j++) {
    const outcome=R.battleTurn(state,state.battle.starCharge>=100?'star':'strike');
    if(!outcome.ok)break;
  }
  return state.battle.status;
}
function run(persona){
  const s=R.createState(START);let losses=0,wins=0,firstFullVillage=null,firstCampaignClear=null,firstAllMastery=null;
  const observations=[];let weeklyVictories=0;
  for(let day=1;day<=90;day++){
    const now=START+day*86400000;
    for(let visit=0;visit<persona.visits;visit++){
      const at=now+visit*3600000;
      R.collect(s,at);R.claimDailyReward(s,at);
      for(let j=0;j<persona.upgrades;j++){
        const ids=['keep','farm','lumber','quarry','forge','tavern','observatory'];
        const upgradeTarget=ids.find(id=>s.buildings[id]<8 && (id==='keep'||s.buildings[id]<s.buildings.keep+1) && Object.entries(R.upgradeCost(s,id)).every(([resource,amount])=>s.res[resource]>=amount));
        if(upgradeTarget)R.upgradeBuilding(s,upgradeTarget,at);
        else{
          const hero=Object.keys(s.heroes).find(id=>s.heroes[id].level<20&&Object.entries(R.heroCost(s,id)).every(([res,amount])=>s.res[res]>=amount));
          if(hero)R.upgradeHero(s,hero);else break;
        }
      }
      for(let j=0;j<persona.battles;j++){
        const next=s.cleared.length+1;
        let stageId,tier=0;
        if(next<=8)stageId=next;
        else{
          stageId=R.STAGES.find(st=>(s.veteranMedals[st.id]||0)<3)?.id;
          if(!stageId)break;
          tier=(s.veteranMedals[stageId]||0)+1;
        }
        const status=playBattle(s,stageId,tier);
        if(status==='won')wins++;else if(status==='lost')losses++;
      }
      if(s.cleared.length===8&&!R.weeklyRiftStatus(s,at).done){
        const rift=R.startWeeklyRift(s,at);
        if(rift.ok){
          s.battle.live=null;
          for(let i=0;i<100&&s.battle.status==='active';i++)R.battleTurn(s,s.battle.starCharge>=100?'star':'strike');
          if(s.battle.status==='won')weeklyVictories++;
        }
      }
      for(const id of ['supply','victory'])R.claimCampaignContract(s,id,at);
      // Only actual eligible ability commands grant the tactics contract.
      // This turn-based stress harness does not execute manual live abilities.
    }
    if(!firstFullVillage&&R.BUILDINGS.every(b=>s.buildings[b.id]===8))firstFullVillage=day;
    if(!firstCampaignClear&&s.cleared.length===8)firstCampaignClear=day;
    if(!firstAllMastery&&R.STAGES.every(st=>(s.veteranMedals[st.id]||0)===3))firstAllMastery=day;
    if([1,7,14,30,60,90].includes(day))observations.push({day,chapters:s.cleared.length,medals:Object.values(s.veteranMedals).reduce((a,b)=>a+b,0),buildings:s.buildings,heroLevels:Object.values(s.heroes).map(h=>h.level),gold:s.res.gold,totalContracts:s.contracts.totalClaims});
  }
  return {persona:persona.name,wins,losses,weeklyVictories,firstCampaignClear,firstFullVillage,firstAllMastery,observations};
}
console.log(JSON.stringify({title:'STARFORT 90-day simulated progression (NOT observed player behavior)',results:players.map(run)},null,2));
