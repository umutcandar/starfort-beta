import test from 'node:test';import assert from 'node:assert/strict';
import * as R from './rules.js';import {exportSave,importSave} from './backup.js';
test('all eight campaign battles play to victory, unlock sequentially and survive save/restore',()=>{
 let s=R.createState(Date.UTC(2026,9,31,12));
 for(const key of Object.keys(s.res))s.res[key]=10000000;
 for(const key of Object.keys(s.buildings))s.buildings[key]=8;
 for(const hero of R.ALL_HEROES)s.heroes[hero.id]={level:20};
 s.team=['aldren','lyra','rovan'];
 for(let stage=1;stage<=8;stage++){
  assert.equal(R.startLiveBattle(s,stage).ok,true);
  for(let frame=0;frame<1500&&s.battle.status==='active';frame++){
   assert.equal(R.advanceCombat(s,300).ok,true);
   for(const h of s.battle.allies)if(s.battle.status==='active'&&h.hp>0&&R.abilityState(s.battle,h.id).ready)R.useHeroAbility(s,h.id);
  }
  assert.equal(s.battle.status,'won',`stage ${stage}`);
  assert.deepEqual(s.cleared,Array.from({length:stage},(_,i)=>i+1));
  assert.equal(s.battle.rewardApplied,true);
  s=importSave(exportSave(s,new Date('2026-10-31T12:00:00Z')));
  assert.equal(s.cleared.length,stage);
 }
 assert.equal(s.cleared.length,8);
});
