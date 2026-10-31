import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {exportSave,importSave} from './backup.js';
import {action,newDb,safeName} from './guild-server.mjs';

const date=day=>Date.parse(day+'T12:00:00Z');
test('daily reward is once per UTC date, saved, and cannot be claimed during battle',()=>{
  const state=R.createState(date('2026-10-31'));const start=state.res.gold;
  assert.equal(R.claimDailyReward(state,date('2026-10-31')).ok,true);
  assert.equal(state.res.gold,start+R.DAILY_REWARD.gold);
  assert.equal(R.claimDailyReward(state,date('2026-10-31')).ok,false);
  const saved=R.restoreState(JSON.stringify(state),date('2026-10-31'));
  assert.equal(R.dailyRewardState(saved,date('2026-10-31')).available,false);
  assert.equal(R.claimDailyReward(saved,date('2026-11-01')).ok,true);
  assert.equal(R.startLiveBattle(saved,1).ok,true);
  assert.equal(R.claimDailyReward(saved,date('2026-11-02')).ok,false);
});

test('backup restores valid game and rejects invalid format',()=>{
  const state=R.createState();state.buildings.forge=3;
  const raw=exportSave(state,new Date('2026-10-31T00:00:00Z'));
  assert.equal(importSave(raw).buildings.forge,3);
  assert.throws(()=>importSave('{}'),/Starfort/);
  assert.throws(()=>importSave('xyz'),/JSON/);
  assert.throws(()=>importSave(' '.repeat(2_000_001)),/boyutu/);
});

test('tactical stance changes combat, rate limited, persists after save',()=>{
  const balanced=R.createState(),assault=R.createState(),guard=R.createState();
  for(const state of [balanced,assault,guard])assert.equal(R.startLiveBattle(state,1).ok,true);
  assert.equal(R.setBattleStance(assault,'assault').ok,true);
  assert.equal(R.setBattleStance(guard,'guard').ok,true);
  assert.equal(R.setBattleStance(guard,'assault').ok,false);
  assert.equal(R.setBattleStance(balanced,'something').ok,false);
  for(const state of [balanced,assault,guard])R.advanceCombat(state,800);
  assert.ok(assault.battle.enemies[0].hp<balanced.battle.enemies[0].hp);
  assert.ok(guard.battle.enemies[0].hp>=balanced.battle.enemies[0].hp);
  const loaded=R.restoreState(JSON.stringify(guard));
  assert.equal(loaded.battle.live.stance,'guard');
});

test('guild player names reject markup and guild membership is consistent',()=>{
  assert.equal(safeName('<img onerror=x>'),null);
  const db=newDb(),alice={id:'u1',name:'Alice',joinedAt:0},bob={id:'u2',name:'Bob',joinedAt:0};db.users.push(alice,bob);
  let [status,created]=action(db,alice,'/api/guild/create',{name:'Yıldız Şövalyeleri'},10000);
  assert.equal(status,200);assert.equal(created.guild.members.length,1);
  const code=created.guild.code;
  [status]=action(db,bob,'/api/guild/join',{code},10000);assert.equal(status,200);
  assert.equal(db.guilds[0].members.length,2);
  [status]=action(db,bob,'/api/guild/message',{message:'Birlikte kazanalım'},10000);assert.equal(status,200);
  [status]=action(db,bob,'/api/guild/message',{message:'Spam'},10001);assert.equal(status,429);
  [status]=action(db,bob,'/api/guild/raid',{},10000);assert.equal(status,200);
  [status]=action(db,bob,'/api/guild/raid',{},10001);assert.equal(status,429);
  [status]=action(db,alice,'/api/guild/leave',{},10000);assert.equal(status,200);
  assert.equal(db.guilds[0].ownerId,bob.id);
  [status]=action(db,bob,'/api/guild/leave',{},10001);assert.equal(status,200);
  assert.equal(db.guilds.length,0);
});
