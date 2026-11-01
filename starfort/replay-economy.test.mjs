import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {battleMarkup} from './battle-view.js';
const t=Date.UTC(2026,10,1,12);
const clone=s=>JSON.parse(JSON.stringify(s));
function win(state,id){
  assert.equal(R.startBattle(state,id).ok,true);
  state.battle.enemies.forEach(e=>e.hp=0);
  assert.equal(R.battleTurn(state,'strike').ok,true);
  assert.equal(state.battle.status,'won');
}
test('first normal story victory is full reward; repeat victory is only 40 percent',()=>{
  const state=R.createState(t),before=clone(state.res),base=R.STAGES[0].reward;
  win(state,1);
  assert.deepEqual(state.battle.reward,base);
  assert.equal(state.battle.replay,false);
  for(const [id,amount] of Object.entries(base))assert.equal(state.res[id],before[id]+amount,id);
  const afterFirst=clone(state.res);
  win(state,1);
  const reduced=R.replayReward(1);
  assert.deepEqual(reduced,{gold:48,wood:24,stone:14,aether:5});
  assert.deepEqual(state.battle.reward,reduced);
  assert.equal(state.battle.replay,true);
  for(const [id,amount] of Object.entries(reduced))assert.equal(state.res[id],afterFirst[id]+amount,id);
});
test('replay outcome is stable across both active and completed save round trips',()=>{
  const state=R.createState(t);
  win(state,1);
  const firstWin=R.restoreState(clone(state),t);
  assert.equal(firstWin.battle.replay,false);
  assert.deepEqual(firstWin.battle.reward,R.STAGES[0].reward);
  assert.deepEqual(firstWin,state);
  assert.equal(R.startBattle(state,1).ok,true);
  assert.equal(state.battle.replay,true);
  const active=R.restoreState(clone(state),t);
  assert.deepEqual(active,state);
  active.battle.enemies.forEach(e=>e.hp=0);
  assert.equal(R.battleTurn(active,'strike').ok,true);
  const final=R.restoreState(clone(active),t);
  assert.deepEqual(final,active);
  assert.equal(final.battle.rewardApplied,true);
  assert.equal(R.battleTurn(final,'strike').ok,false);
});
test('existing legacy active saves keep their originally advertised full payout',()=>{
 const state=R.createState(t);win(state,1);
 assert.equal(R.startBattle(state,1).ok,true);
 delete state.battle.replay;
 state.battle.reward={...R.STAGES[0].reward}; // pre-40% client saved this amount
 const restored=R.restoreState(clone(state),t);
 assert.equal(restored.battle.replay,false);
 assert.deepEqual(restored.battle.reward,R.STAGES[0].reward);
 restored.battle.enemies.forEach(e=>e.hp=0);
 const before=clone(restored.res);
 assert.equal(R.battleTurn(restored,'strike').ok,true);
 for(const [id,amount] of Object.entries(R.STAGES[0].reward))assert.equal(restored.res[id],before[id]+amount);
});
test('veteran and weekly rift payouts are not reduced by replay policy',()=>{
 const state=R.createState(t);win(state,1);
 assert.equal(R.startVeteranBattle(state,1,1).ok,true);
 assert.equal(state.battle.replay,false);
 for(const [id,amount] of Object.entries(R.STAGES[0].reward))
   assert.equal(state.battle.reward[id],Math.round(amount*1.16));
 const rift=R.createState(t);rift.cleared=R.STAGES.map(x=>x.id);
 assert.equal(R.startWeeklyRift(rift,t).ok,true);
 assert.equal(rift.battle.replay,false);
 const stage=R.STAGES[rift.battle.stageId-1];
 for(const [id,amount] of Object.entries(stage.reward))
   assert.equal(rift.battle.reward[id],Math.round(amount*1.48));
});
test('repeat result accurately labels the reward while first clear does not',()=>{
 const state=R.createState(t);win(state,1);
 assert.doesNotMatch(battleMarkup({battle:state.battle}),/Tekrar seferi/);
 win(state,1);
 assert.match(battleMarkup({battle:state.battle}),/Tekrar seferi.*%40/);
});
