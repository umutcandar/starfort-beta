import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {specialEnemyAttack} from './encounters.js';
import {seasonEvent,seasonId,seasonStatus,claimSeasonTitle} from './season-campaign.js';
import {createGameAudio,AUDIO_KEY} from './audio.js';
import {accountSignIn,accountSignOut,accountSession,accountBackup,loadAccountSession} from './account-auth.js';
const NOW=Date.UTC(2026,10,1,12),copy=x=>JSON.parse(JSON.stringify(x));
function eligible(stageId){
 const s=R.createState(NOW);
 s.cleared=Array.from({length:stageId-1},(_,i)=>i+1);
 s.buildings.forge=8;s.buildings.keep=8;s.buildings.tavern=8;
 for(const id of Object.keys(s.heroes))s.heroes[id].level=20;
 s.labyrinth.cleared=16;s.labyrinth.floor=16;
 R.equipItem(s,'aldren','iron_sword');
 R.equipItem(s,'lyra','ward_mail');
 s.inventory.lunar_charm=1;R.equipItem(s,'rovan','lunar_charm');
 return s;
}
test('story chapters 3-8 have power, forge, equipped and maze gates',()=>{
 const s=R.createState(NOW);s.cleared=[1,2];
 const original=copy(s);
 const result=R.startLiveBattle(s,3,{enforceGates:true});
 assert.equal(result.ok,false);
 assert.match(result.error,/Demirhane|labirent|gücü/);
 assert.deepEqual(s,original,'a blocked battle must never mutate local saves');
 const ready=eligible(3);
 assert.equal(R.stageRequirements(ready,R.STAGES[2],R.teamPower(ready)).available,true);
 assert.equal(R.startLiveBattle(ready,3,{enforceGates:true}).ok,true);
 for(let i=3;i<=8;i++){
   const state=eligible(i), gate=R.stageRequirements(state,R.STAGES[i-1],R.teamPower(state));
   assert.ok(gate.requirements.length>=4);
   assert.ok(gate.available,JSON.stringify(gate.reasons));
   assert.equal(R.startLiveBattle(state,i,{enforceGates:true}).ok,true);
 }
});
test('completed story stages stay replayable even if new gates were introduced',()=>{
 const s=R.createState(NOW);s.cleared=[1,2,3,4];s.labyrinth.cleared=0;
 assert.equal(R.startLiveBattle(s,4,{enforceGates:true}).ok,true);
});
test('stage 6 frost and stage 7 siphon and three final boss phases have distinct intents',()=>{
 const frozen={stageId:6,combatVersion:2,round:1};
 assert.equal(specialEnemyAttack({stageId:3,combatVersion:2},{role:'raider'},3).type,'thorn');
 assert.equal(specialEnemyAttack({stageId:4,combatVersion:2},{role:'boss'},4).type,'shatter');
 assert.equal(specialEnemyAttack({stageId:5,combatVersion:2},{role:'caster'},2).type,'grave');
 assert.equal(specialEnemyAttack(frozen,{role:'caster',hp:20,maxHp:20},2).type,'frost');
 assert.equal(specialEnemyAttack({stageId:7,combatVersion:2},{role:'caster'},2).type,'drain');
 const s={stageId:8,combatVersion:2};
 assert.equal(specialEnemyAttack(s,{role:'boss',hp:90,maxHp:100},3).type,'crush');
 assert.equal(specialEnemyAttack(s,{role:'boss',hp:50,maxHp:100},2).type,'drain');
 assert.equal(specialEnemyAttack(s,{role:'boss',hp:20,maxHp:100},2).type,'nova');
 assert.equal(specialEnemyAttack({...s,combatVersion:1},{role:'boss',hp:20,maxHp:100},2),null);
});
test('special skills alter actual turn-based state rather than only flavor text',()=>{
 const s=eligible(6);R.startBattle(s,6);
 s.battle.round=1;s.battle.allies.forEach(x=>x.attack=1);
 const caster=s.battle.enemies.find(x=>x.role==='caster');
 assert.ok(caster);
 const before=s.battle.starCharge;
 const result=R.battleTurn(s,'guard');
 assert.equal(result.ok,true);
 assert.ok(result.frames.some(x=>x.kind==='frost'));
 assert.ok(s.battle.starCharge<before+40);
 const boss=eligible(8);R.startBattle(boss,8);
 boss.battle.allies.forEach(x=>x.attack=1);
 boss.battle.round=1;
 const enemy=boss.battle.enemies.find(x=>x.role==='boss');enemy.hp=Math.floor(enemy.maxHp/4);
 const outcome=R.battleTurn(boss,'guard');
 assert.equal(outcome.ok,true);
 assert.ok(outcome.frames.some(x=>x.kind==='nova'));
});
test('28 day quests give cosmetic titles only, never modify battle rewards',()=>{
 const s=R.createState(NOW),resources=copy(s.res);
 for(let i=0;i<4;i++)assert.equal(seasonEvent(s,'win',NOW),true);
 assert.equal(seasonStatus(s,NOW).points,4);
 assert.equal(claimSeasonTitle(s,'Vadi İz Sürücüsü',NOW).ok,true);
 assert.equal(claimSeasonTitle(s,'Vadi İz Sürücüsü',NOW).ok,false);
 assert.deepEqual(s.res,resources);
 assert.deepEqual(R.restoreState(copy(s),NOW),s);
 const later=NOW+28*86400000+1000,old=seasonId(NOW);
 assert.equal(seasonId(later),old+1);
 const next=seasonStatus(s,later);
 assert.equal(next.points,0);
 assert.ok(next.legacy.includes('S'+old+':Vadi İz Sürücüsü'));
});
test('audio remains silent until player enables, supports accessible off switch',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 let contexts=0,events=0;
 class FakeAudio{
  constructor(){contexts++;this.currentTime=0;this.state='running';this.destination={};}
  createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){events++},stop(){},type:''};}
  suspend(){}resume(){}close(){}
 }
 const audio=createGameAudio({storage,Audio:FakeAudio});
 audio.cue('victory');assert.equal(contexts,0);
 assert.equal(audio.toggle(),true);audio.cue('victory');assert.ok(events>=4);
 assert.equal(store.get(AUDIO_KEY),'1');
 assert.equal(audio.toggle(),false);audio.dispose();
 assert.equal(store.get(AUDIO_KEY),'0');
});
test('email login and authenticated backups send bearer JWT, never untrusted guild token',async()=>{
 const fakeJwt='test.jwt.token',userId='123e4567-e89b-12d3-a456-426614174000';
 let calls=[];
 const fetcher=async(url,opts)=>{
   calls.push({url,opts});
   if(url.includes('/auth/v1/token'))return {ok:true,json:async()=>({access_token:fakeJwt,refresh_token:'refresh',expires_in:3600,user:{id:userId,email:'p@example.com'}})};
   if(url.includes('/rest/v1/'))return {ok:true,json:async()=>[]};
   if(url.includes('/auth/v1/logout'))return {ok:true,json:async()=>({})};
   throw Error('unexpected '+url);
 };
 await accountSignIn('p@example.com','test-password',fetcher);
 assert.equal(accountSession().user.email,'p@example.com');
 assert.equal(await accountBackup('get',{},fetcher),null);
 const req=calls.find(x=>x.url.includes('starfort_account_backups'));
 assert.equal(req.opts.headers.Authorization,'Bearer '+fakeJwt);
 assert.ok(req.url.includes(userId));
 await assert.rejects(()=>accountBackup('save',{state:{version:0},revision:0},fetcher),/Geçersiz/);
 await accountSignOut(fetcher);
 assert.equal(accountSession(),null);
 loadAccountSession({getItem(){return null;}});
});
