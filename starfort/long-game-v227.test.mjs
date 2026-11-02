import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {rewardForDay} from './reward-calendar.js';
const T=Date.UTC(2026,10,2,10),DAY=86400000;
const resources=['gold','wood','stone','aether'];
function model(days,{collectEvery=1}={}){
 const s=R.createState(T),daily={gold:0,wood:0,stone:0,aether:0},production={gold:0,wood:0,stone:0,aether:0};
 for(let i=1;i<=days;i++){
  const d=(i-1)%28+1,r=rewardForDay(d);
  for(const k of resources)daily[k]+=r[k];
  if(i%collectEvery===0||i===days){
   const p=R.collect(s,T+i*DAY);
   assert.equal(p.ok,true);
   for(const k of resources)production[k]+=p.gain[k];
  }
 }
 return {days,production,daily,total:Object.fromEntries(resources.map(k=>[k,production[k]+daily[k]]))};
}
test('1-, 7-, 30-, 90-, and 180-day resource models retain a growing but bounded reward track',()=>{
 const horizons=[1,7,30,90,180].map(days=>model(days));
 for(let i=1;i<horizons.length;i++){
  const prev=horizons[i-1],next=horizons[i];
  for(const key of resources)assert.ok(next.total[key]>prev.total[key],key+' must increase over time');
 }
 for(const h of horizons){
  for(const key of resources){
   assert.ok(Number.isSafeInteger(h.total[key]));
   assert.ok(h.total[key]<1e9,'calendar cannot bypass resource cap');
  }
 }
 const monthly=horizons[2],halfYear=horizons.at(-1);
 assert.ok(halfYear.daily.gold>monthly.daily.gold*5,'repeating 28-day calendar must grow with sessions');
 assert.ok(halfYear.production.gold>halfYear.daily.gold,'daily chests do not replace village economy');
});
test('resource collection respects 24h cap, rewarding daily visits but not requiring hourly logins',()=>{
 const daily=model(30,{collectEvery:1}),weekly=model(30,{collectEvery:7});
 for(const key of resources)assert.ok(daily.production[key]>=weekly.production[key],key+' daily collection >= weekly');
 assert.ok(daily.production.gold>weekly.production.gold*2,'returning several times per month is materially rewarded');
 assert.deepEqual(daily.daily,weekly.daily,'missed resource pickups never change calendar reward plan');
});
test('longest construction requires an actual builder queue, not instant level 20',()=>{
 const levels=Array.from({length:18},(_,i)=>i+2);
 const forOne=levels.reduce((sum,n)=>sum+R.constructionDuration(n),0);
 assert.ok(forOne>10*DAY,'one maxed building uses many full days of builder time');
 assert.ok(forOne*7>100*DAY,'seven fully upgraded buildings require at least 100 days of serial builder time');
 assert.ok(R.constructionDuration(19)>R.constructionDuration(3));
 const s=R.createState(T);
 for(const building of R.BUILDINGS)assert.equal(building.maxLevel,20);
 const keep=R.upgradeCost(s,'keep');
 assert.ok(keep.gold>0);
});
test('high-level construction is not funded by a single week of starter village harvest',()=>{
 const s=R.createState(T);
 s.buildings.keep=15;
 const costly=R.upgradeCost(s,'keep');
 const week=model(7);
 assert.ok(costly.gold>week.total.gold,'level 15 keep requires economic growth not one week of idle collection');
});
export {model};
