import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {riftSchedule,weekIndex,restoreRiftRecords} from './weekly-rift.js';
const T=Date.UTC(2026,10,1,12);
const maxState=()=>{const s=R.createState(T);s.cleared=[1,2,3,4,5,6,7,8];return s;};
test('rotates a distinct tactical modifier and battleground across weeks',()=>{
  const a=riftSchedule(T),b=riftSchedule(T+7*86400000);
  assert.equal(b.week,a.week+1);assert.notEqual(a.modifier.id,b.modifier.id);
  assert.notEqual(a.stageId,b.stageId);
  assert.equal(weekIndex(T),weekIndex(T+4*3600000));
});
test('rift unlocks only after eight chapters and records a cosmetic clear once a week',()=>{
  const s=R.createState(T);
  assert.equal(R.startWeeklyRift(s,T).ok,false);
  s.cleared=[1,2,3,4,5,6,7,8];
  assert.equal(R.startWeeklyRift(s,T).ok,true);
  assert.equal(typeof s.battle.riftModifier,'string');
  assert.ok(s.battle.enemies.every(e=>e.maxHp>0));
  const replay=R.restoreState(JSON.stringify(s),T);
  assert.equal(replay.battle.riftWeek,s.battle.riftWeek);
  assert.deepEqual(replay.battle.enemies.map(e=>e.maxHp),s.battle.enemies.map(e=>e.maxHp));
  s.battle.live=null;for(const enemy of s.battle.enemies)enemy.hp=0;
  assert.equal(R.battleTurn(s,'strike').ok,true);
  assert.equal(s.riftRecords.length,1);
  assert.equal(R.battleTurn(s,'strike').ok,false);
  s.battle=null;
  assert.equal(R.startWeeklyRift(s,T).ok,true,'can replay for practice, but no second cosmetic record');
  s.battle.live=null;for(const enemy of s.battle.enemies)enemy.hp=0;
  R.battleTurn(s,'strike');assert.equal(s.riftRecords.length,1);
  s.battle=null;
  assert.equal(R.startWeeklyRift(s,T+7*86400000).ok,true);
  s.battle.live=null;for(const enemy of s.battle.enemies)enemy.hp=0;
  R.battleTurn(s,'strike');assert.equal(s.riftRecords.length,2);
});
test('accepts a bounded, deduplicated set of weekly cosmetic records in save file',()=>{
  assert.deepEqual(restoreRiftRecords(null),[]);
  const a=restoreRiftRecords([{week:100,stageId:8,modifier:'sorcery'},
    {week:100,stageId:8,modifier:'sorcery'},{week:101,stageId:7,modifier:'bad'},
    {week:102,stageId:6,modifier:'iron'}]);
  assert.deepEqual(a,[{week:100,stageId:8,modifier:'sorcery'},{week:102,stageId:6,modifier:'iron'}]);
});
