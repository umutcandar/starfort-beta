/** Read-only building roadmap. All resource and effect numbers are derived
 * from the existing economy; never invents upgrades, timers or rewards.
 */
import {BUILDINGS,production,upgradeCost} from './rules.js';
const CAP=1e9,DAY=24*60*60*1000;
const kinds={keep:'Merkez',farm:'Üretim',lumber:'Üretim',quarry:'Üretim',forge:'Ordu',tavern:'Ordu',observatory:'Üretim'};
const labels={gold:'Altın',wood:'Kereste',stone:'Taş',aether:'Yıldız özü'};
export const villageResourceNames=Object.freeze(labels);
export function upgradeEffect(state,building,level){
 const keep=state.buildings.keep;
 if(building.production){
   const speed=building.production.perMinute*level*(1+(keep-1)*.05);
   return {value:Number(speed.toFixed(2)),unit:labels[building.production.resource]+' / dk'};
 }
 if(building.id==='keep')return {value:(level-1)*5,unit:'% köy üretim bonusu'};
 if(building.id==='forge')return {value:(level-1)*5,unit:'% takım saldırısı'};
 return {value:(level-1)*4,unit:'% takım canı'};
}
function balance(state,now){
 const pending=production(state,now);
 return Object.fromEntries(Object.keys(labels).map(id=>[id,Math.min(CAP,(state.res[id]||0)+Math.max(0,pending[id]||0))]));
}
function waitUntilAffordable(state,cost,now){
 const limit=Math.max(now,state.lastCollected+DAY);
 const enough=timestamp=>{const res=balance(state,timestamp);return Object.entries(cost).every(([id,c])=>res[id]>=c);};
 if(enough(now))return 0;
 if(!enough(limit))return null;
 let left=now,right=limit;
 for(let i=0;i<32;i++){const mid=Math.floor((left+right)/2);if(mid===left)break;if(enough(mid))right=mid;else left=mid;}
 return Math.max(1,Math.ceil((right-now)/60000));
}
export function buildingUpgradePlan(state,id,now=Date.now()){
 const building=BUILDINGS.find(x=>x.id===id);
 if(!building)return null;
 const level=state.buildings[id],maxed=level>=building.maxLevel;
 const cost=maxed?{}:upgradeCost(state,id);
 const pending=production(state,now);
 const available=balance(state,now);
 const missing=Object.fromEntries(Object.entries(cost).map(([resource,amount])=>[resource,Math.max(0,amount-available[resource])]));
 const direct=Object.entries(cost).every(([resource,amount])=>state.res[resource]>=amount);
 const affordable=Object.values(missing).every(n=>n===0);
 const locked=building.id!=='keep'&&level>=state.buildings.keep+1;
 const battling=state.battle?.status==='active';
 const status=maxed?'maxed':battling?'battle':locked?'locked':direct?'ready':affordable?'collect':'short';
 const progress=maxed?100:Object.keys(cost).length?Math.round(100*Math.min(...Object.entries(cost).map(([r,n])=>Math.min(1,available[r]/n)))):100;
 const etaMinutes=status==='short'?waitUntilAffordable(state,cost,now):null;
 return {building,id,kind:kinds[id],level,nextLevel:Math.min(level+1,building.maxLevel),maxed,cost,pending,available,missing,
   locked,battling,status,progress,etaMinutes,
   current:upgradeEffect(state,building,level),
   next:upgradeEffect(state,building,Math.min(level+1,building.maxLevel)),
   effectIncrease:upgradeEffect(state,building,Math.min(level+1,building.maxLevel)).value-upgradeEffect(state,building,level).value};
}
export function buildingRoadmap(state,now=Date.now()){
 const plans=BUILDINGS.map(b=>buildingUpgradePlan(state,b.id,now));
 const actionable=plans.filter(p=>['ready','collect'].includes(p.status));
 const next=actionable.find(p=>p.id==='keep')||actionable.find(p=>p.id!=='keep')||plans.find(p=>p.status==='short'&&p.id==='keep')||plans.find(p=>p.status==='short')||null;
 return {plans,ready:actionable.length,completed:plans.filter(p=>p.maxed).length,next};
}
