import test from 'node:test';import assert from 'node:assert/strict';
import {createArenaService} from './arena.js';
import {createTeamService} from './team-arena.js';
const testUser={id:'1'.repeat(24),name:'Test Commander'};
test('a complete 1v1 bot duel reaches an end state and can be replayed',()=>{
 let now=100000;const svc=createArenaService({now:()=>now});
 assert.equal(svc.queueBot(testUser).status,'active');
 let state=svc.result(testUser);const first=state.room.id;
 for(let frame=0;frame<1350&&state.status==='active';frame++){
  now+=100;
  const input={seq:frame+1,x:0,y:0,attack:true,burst:frame%80===0,dash:false};
  const r=svc.input(testUser,input);assert.equal(r[0],200);
  svc.tick(.1);state=svc.result(testUser);
  for(const p of state.room.players){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.hp>=0)}
 }
 assert.equal(state.status,'ended','bot match must end with a win/loss/draw');
 assert.ok(['time','ko','knockout','disconnect'].includes(state.room.reason),state.room.reason);
 assert.equal(svc.queueBot(testUser).status,'active');
 assert.notEqual(svc.result(testUser).room.id,first);
 svc.leave(testUser);
});
test('2v2, 5v5 and 5v5 siege bot matches can be played through to a result',()=>{
 for(const [size,variant] of [[2,'flags'],[5,'flags'],[5,'siege']]){
  let now=100000;const svc=createTeamService({now:()=>now});
  assert.equal(svc.queueBot(testUser,{size,variant})[0],200);
  let state=svc.result(testUser);assert.equal(state.room.players.length,size*2);
  for(let frame=0;frame<1950&&state.status==='active';frame++){
   now+=100;
   assert.equal(svc.input(testUser,{seq:frame+1,x:.8,y:0,attack:true,burst:frame%80===0,dash:false,order:'push'})[0],200);
   svc.tick(.1);state=svc.result(testUser);
   assert.ok(state.room.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.hp)));
   assert.ok(state.room.squads.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.hp)));
  }
  assert.equal(state.status,'ended',`${size}v${size} ${variant} must terminate`);
  assert.ok(state.room.elapsed<=185,`end timer <= 185s: ${state.room.elapsed}`);
  assert.equal(svc.leave(testUser).status,'idle');
 }
});
