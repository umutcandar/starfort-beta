import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {exportSave,importSave} from './backup.js';
import {createSaveGuard} from './save-guard.js';
import {seasonStatus,seasonEvent} from './season-campaign.js';
const time=Date.UTC(2026,10,1,12),clone=v=>JSON.parse(JSON.stringify(v));
test('two tabs cannot overwrite newer progress with an old in-memory castle',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const first=R.createState(time),second=clone(first);
 const a=createSaveGuard(storage,R.STORAGE_KEY),b=createSaveGuard(storage,R.STORAGE_KEY);
 first.buildings.keep=2;
 assert.equal(a.write(first),true);
 const current=storage.getItem(R.STORAGE_KEY);
 second.buildings.keep=1;
 assert.equal(b.write(second),false);
 assert.equal(b.conflicted,true);
 assert.equal(storage.getItem(R.STORAGE_KEY),current);
 assert.equal(JSON.parse(storage.getItem(R.STORAGE_KEY)).buildings.keep,2);
 assert.equal(b.observe(current),false);
 assert.equal(b.write(second),false);
});
test('corrupt season metadata fails closed without replacing a level 6 village',()=>{
 const s=R.createState(time);
 s.buildings.keep=6;s.cleared=[1,2,3,4];
 const payload=JSON.parse(exportSave(s));
 payload.state.season.legacy={unexpected:true};
 assert.throws(()=>importSave(JSON.stringify(payload)),/hasarlı|tutarsız/);
 const original=importSave(exportSave(s));
 assert.equal(original.buildings.keep,6);
 assert.deepEqual(original.cleared,[1,2,3,4]);
});
test('missing required resources, malformed team, invalid season counters reject backups',()=>{
 const s=R.createState(time);
 for(const patch of [
  x=>delete x.state.res.gold,
  x=>x.state.team=['aldren','aldren','lyra'],
  x=>x.state.season.progress.win={counter:8},
  x=>x.state.buildings.keep=0,
  x=>x.state.cleared=[1,3]
 ]){
   const data=JSON.parse(exportSave(s));patch(data);
   assert.throws(()=>importSave(JSON.stringify(data)));
 }
});
test('maxed-out heroes, stars, forge and maze still reach the 29-point season title',()=>{
 const s=R.createState(time);
 s.cleared=R.STAGES.map(x=>x.id);s.labyrinth.cleared=16;s.labyrinth.floor=16;
 for(const b of R.BUILDINGS)s.buildings[b.id]=b.maxLevel;
 for(const hero of Object.values(s.heroes))hero.level=20;
 for(let i=0;i<8;i++)seasonEvent(s,'win',time);
 for(let i=0;i<8;i++)seasonEvent(s,'upgrade',time);
 for(let i=0;i<4;i++)seasonEvent(s,'forge',time);
 for(let i=0;i<4;i++)seasonEvent(s,'maze',time);
 for(let i=0;i<4;i++)seasonEvent(s,'star',time);
 seasonEvent(s,'rift',time);
 assert.equal(seasonStatus(s,time).points,29);
 assert.equal(R.claimSeasonTitle(s,'Yıldız Vekili',time).ok,true);
});
test('live win and ability after midnight apply to the new daily contract',()=>{
 const yesterday=Date.UTC(2026,9,31,11,0,0),today=yesterday+24*60*60*1000;
 const s=R.createState(yesterday);s.contracts.day='2026-10-31';
 assert.equal(R.startLiveBattle(s,1).ok,true);
 for(const enemy of s.battle.enemies)enemy.hp=0;
 assert.equal(R.advanceCombat(s,50,today).ok,true);
 const status=R.contractsStatus(s,today);
 assert.equal(status.contracts.find(c=>c.id==='victory').progress,1);
 assert.equal(s.contracts.day, '2026-11-01');
 assert.equal(R.claimCampaignContract(s,'victory',today).ok,true);
});
