import test from 'node:test';import assert from 'node:assert/strict';
import {ARENA,newRoom,sanitizeInput,stepRoom,createArenaService} from './arena.js';
const users=[{id:'p1',name:'Aldren'},{id:'p2',name:'Eira'}];
test('server validates control payload, normalizes diagonals and rejects NaN',()=>{
  assert.equal(sanitizeInput({seq:1,x:NaN,y:0,attack:true,burst:false,dash:false}),null);
  assert.equal(sanitizeInput({seq:1,x:2,y:0,attack:true,burst:false,dash:false}),null);
  assert.ok(Math.abs(sanitizeInput({seq:1,x:1,y:1,attack:true,burst:false,dash:false}).x-Math.SQRT1_2)<1e-12);
  assert.equal(sanitizeInput({seq:1,x:0,y:0,attack:'yes',burst:false,dash:false}),null);
  assert.equal(sanitizeInput({seq:-1,x:0,y:0,attack:false,burst:false,dash:false}),null);
});
test('authoritative movement caps speed, clamps bounds and ignores oversized dt',()=>{
  const room=newRoom(...users);room.players[0].input={x:1,y:0,attack:false};
  const x=room.players[0].x;stepRoom(room,500);assert.ok(room.players[0].x<=x+ARENA.speed*.10001);
  for(let i=0;i<80;i++)stepRoom(room,.10);
  assert.ok(room.players[0].x<=97);
});
test('server computes damage and ability cooldown independently of fake client HP',()=>{
  const room=newRoom(...users);const [a,b]=room.players;a.x=40;b.x=45;
  a.input={x:0,y:0,attack:true};stepRoom(room,.05);assert.equal(b.hp,127);
  stepRoom(room,.05);assert.equal(b.hp,127);
  a.pendingBurst=true;stepRoom(room,.05);assert.equal(b.hp,99);
  a.pendingBurst=true;stepRoom(room,.05);assert.equal(b.hp,99);
});
test('equal damage at timeout causes draw',()=>{
  const room=newRoom(...users);room.elapsed=ARENA.duration-.03;stepRoom(room,.05);assert.equal(room.status,'ended');assert.equal(room.winner,null);
});
test('matchmaker pairs two, prevents duplicate waiting and supports forfeit',()=>{
  const service=createArenaService();const a=service.queue(users[0]);assert.equal(a.status,'waiting');
  assert.equal(service.queue(users[0]).status,'waiting');
  const b=service.queue(users[1]);assert.equal(b.status,'active');
  assert.equal(service.result(users[0]).room.id,b.room.id);
  assert.equal(service.leave(users[0]).status,'idle');
  assert.equal(service.result(users[1]).room.winner,users[1].id);
});
test('out of order client commands do not replace latest input',()=>{
  const service=createArenaService();service.queue(users[0]);service.queue(users[1]);
  assert.equal(service.input(users[0],{seq:8,x:1,y:0,attack:true,burst:true,dash:false})[0],200);
  assert.equal(service.input(users[0],{seq:7,x:-1,y:0,attack:false,burst:false,dash:false})[0],200);
  assert.equal([...service.rooms.values()][0].players[0].input.x,1);
});
test('stale user is disconnected by server, cannot keep ghost match alive',()=>{
  let current=Date.now();const service=createArenaService({now:()=>current});service.queue(users[0]);service.queue(users[1]);current+=19000;service.tick(.05);
  assert.equal(service.result(users[0]).status,'ended');
});
