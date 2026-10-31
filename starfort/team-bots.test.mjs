import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamService,teamBotInput,stepTeamRoom} from './team-arena.js';
const user={id:'1'.repeat(24),name:'Solo Tester'};
test('solo practice creates server-owned 2v2 with one human and three bots',()=>{
  let now=100000;
  const service=createTeamService({now:()=>now});
  assert.equal(service.queueBot(user,{size:3})[0],400);
  assert.equal(service.queueBot(user,{size:2,variant:'siege'})[0],400);
  const [status,state]=service.queueBot(user,{size:2});
  assert.equal(status,200);assert.equal(state.status,'active');assert.equal(state.room.isPractice,true);
  assert.equal(state.room.players.length,4);
  assert.equal(state.room.players.filter(p=>p.isBot).length,3);
  const r=service.rooms.values().next().value;
  const before=r.players.filter(p=>p.isBot).map(p=>p.x);
  for(let i=0;i<80;i++){now+=50;service.tick(.05);}
  assert.equal(service.result(user).status,'active');
  assert.ok(r.players.filter(p=>p.isBot).some((p,i)=>Math.abs(p.x-before[i])>.3),'bots move on server tick');
  assert.equal(service.input({id:'bot-hack'},{} )[0],409);
  assert.equal(service.input(user,{seq:1,x:0,y:1,attack:true,burst:false,dash:false})[0],200);
  assert.equal(service.leave(user).status,'idle');
});
test('solo practice creates 5v5 siege, bots make tactical input, resets after leave',()=>{
  let now=100000;
  const service=createTeamService({now:()=>now});
  const result=service.queueBot(user,{size:5,variant:'siege'})[1];
  assert.equal(result.room.variant,'siege');assert.equal(result.room.players.length,10);
  assert.equal(result.room.players.filter(p=>p.isBot).length,9);
  const room=service.rooms.values().next().value;
  const ai=teamBotInput(room,room.players[1]);
  assert.ok(Number.isFinite(ai.x)&&Number.isFinite(ai.y));
  for(let i=0;i<10;i++){now+=50;service.tick(.05);}
  assert.ok(room.elapsed>.4);
  assert.ok(room.players.filter(p=>p.isBot).some(p=>p.input.attack));
  service.leave(user);
  const again=service.queueBot(user,{size:5,variant:'siege'})[1];
  assert.equal(again.status,'active');assert.notEqual(again.room.id,result.room.id);
});
