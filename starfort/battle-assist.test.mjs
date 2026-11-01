import test from 'node:test';import assert from 'node:assert/strict';
import {assistMove,nearestEnemy,hpEvents,practiceReward,rewardMode} from './battle-assist.js';
test('assist walks toward an out-of-range target only when attacking without stick input',()=>{
  const me={x:10,y:30},t={x:50,y:30};
  assert.deepEqual(assistMove(me,t,{x:0,y:0},{range:15,wantsAction:true}),{x:1,y:0,assisted:true});
  assert.equal(assistMove(me,t,{x:0,y:0},{range:15,wantsAction:false}).assisted,false);
  assert.deepEqual(assistMove(me,t,{x:0,y:-1},{range:15,wantsAction:true}),{x:0,y:-1,assisted:false});
  assert.equal(assistMove(me,{x:20,y:30},{x:0,y:0},{range:15,wantsAction:true}).assisted,false);
});
test('nearest living enemy ignores allies and the dead',()=>{
  const me={id:'a',side:0,x:0,y:0};
  const ps=[me,{id:'b',side:0,x:1,y:0,hp:5},{id:'c',side:1,x:9,y:0,hp:0},{id:'d',side:1,x:20,y:0,hp:3},{id:'e',side:1,x:30,y:0,hp:3}];
  assert.equal(nearestEnemy(me,ps).id,'d');
});
test('hp events report damage and heals',()=>{
  const ev=hpEvents([{id:'a',hp:100},{id:'b',hp:50}],[{id:'a',hp:72,x:1,y:2},{id:'b',hp:50}]);
  assert.deepEqual(ev,[{id:'a',x:1,y:2,delta:-28,crit:true}]);
});
test('practice rewards are fixed and doubled on the first win of the day',()=>{
  assert.deepEqual(practiceReward('hard',true,true),{gold:200,aether:14,bonus:true});
  assert.deepEqual(practiceReward('easy',false),{gold:10,aether:0,bonus:false});
});
test('mode multipliers match the server table',()=>{
  assert.deepEqual(practiceReward('hard',true,true,'siege'),{gold:400,aether:28,bonus:true});
  assert.deepEqual(practiceReward('normal',true,false,'team2'),{gold:90,aether:6,bonus:false});
  assert.equal(rewardMode({variant:'siege',teamSize:5}),'siege');assert.equal(rewardMode({variant:'flags',teamSize:2}),'team2');assert.equal(rewardMode({players:[]}),'duel');
});
