import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamRoom,sanitizeTeamInput,stepTeamRoom,createTeamService,TEAM_RULES} from './team-arena.js';
const users=n=>Array.from({length:n},(_,i)=>({id:(i+1).toString(16).padStart(24,'0'),name:'Commander '+i}));
const input=(seq,props={})=>({seq,x:0,y:0,attack:false,burst:false,dash:false,...props});
test('validate move bounds, commands, target and normalize diagonals',()=>{
  assert.equal(sanitizeTeamInput(input(1,{x:2})),null);
  assert.equal(sanitizeTeamInput(input(1,{x:NaN})),null);
  assert.equal(sanitizeTeamInput(input(1,{order:'admin'})),null);
  assert.equal(sanitizeTeamInput(input(1,{focus:'<script>'})),null);
  assert.equal(sanitizeTeamInput({...input(1),seq:-1}),null);
  const clean=sanitizeTeamInput(input(1,{x:1,y:1,order:'push'}));assert.ok(Math.abs(Math.hypot(clean.x,clean.y)-1)<1e-8);
});
test('matchmaker isolates mode queues and creates 2v2 with two squads per hero',()=>{
  let now=10000;const srv=createTeamService({now:()=>now});const u=users(14);
  assert.equal(srv.queue(u[0],{size:7})[0],400);
  assert.equal(srv.queue(u[0],{size:2})[1].status,'waiting');
  assert.equal(srv.queue(u[4],{size:5})[1].status,'waiting');
  u.slice(1,4).forEach(p=>srv.queue(p,{size:2}));
  assert.equal(srv.result(u[0]).status,'active');assert.equal(srv.result(u[4]).status,'waiting');
  assert.equal(srv.result(u[0]).room.squads.length,8);
  assert.deepEqual(srv.result(u[0]).room.players.map(p=>p.team),[0,1,0,1]);
  assert.equal(srv.queue(u[0],{size:5})[1].room.mode,'2v2');
  assert.equal(srv.input(u[0],input(1,{order:'push'}))[0],200);assert.equal(srv.result(u[0]).room.players[0].order,'push');
  assert.equal(srv.input(u[0],input(0,{order:'hold'}))[0],200);assert.equal(srv.result(u[0]).room.players[0].order,'push');
  now+=21000;srv.tick(.05);assert.equal(srv.result(u[4]).status,'idle');
});
test('5v5 shared room supports 10 users and squad commands',()=>{
  const srv=createTeamService(),u=users(10);u.forEach(p=>assert.equal(srv.queue(p,{size:5})[0],200));
  assert.equal(srv.rooms.size,1);assert.equal(srv.result(u[0]).room.players.length,10);
  assert.equal(srv.result(u[9]).room.squads.length,20);
  assert.equal(srv.input(u[7],input(1,{order:'hold'}))[0],200);
  assert.equal(srv.result(u[3]).room.players.find(p=>p.id===u[7].id).order,'hold');
  assert.equal(srv.input(u[0],input(1,{x:999}))[0],400);
});
test('movement, capture, unit tactics and damage are server-owned',()=>{
  const room=createTeamRoom(users(4),2,0),p=room.players[0],s=room.squads.find(s=>s.ownerId===p.id);
  p.input={x:1,y:0,attack:false};const before=p.x;stepTeamRoom(room,.05);assert.ok(p.x>before);
  const old=s.x;p.order='push';for(let i=0;i<10;i++)stepTeamRoom(room,.05);assert.ok(s.x>old);
  p.x=50;p.y=20;room.players[1].x=90;room.players[1].y=50;room.players[2].x=50;room.players[2].y=40;room.players[3].x=90;room.players[3].y=50;
  room.players.forEach(p=>p.input={x:0,y:0,attack:false});
  for(let i=0;i<50;i++)stepTeamRoom(room,.05);
  assert.ok(room.score[0]>room.score[1]);
  assert.ok(room.capture.includes(0));
  const enemy=room.players[1];enemy.x=p.x+3;enemy.y=p.y;p.input.attack=true;const hp=enemy.hp;
  for(let i=0;i<20;i++)stepTeamRoom(room,.05);assert.ok(enemy.hp<hp);
});
test('cooldown, respawn, score win and leave conditions',()=>{
  const room=createTeamRoom(users(4),2,0);const p=room.players[0],enemy=room.players[1];p.x=30;p.y=30;enemy.x=30;enemy.y=30;p.burst=true;stepTeamRoom(room,.05);const hp=enemy.hp;
  p.burst=true;stepTeamRoom(room,.05);assert.equal(enemy.hp,hp);
  enemy.hp=1;enemy.respawnAt=0;p.input.attack=true;for(let i=0;i<25;i++)stepTeamRoom(room,.05);assert.equal(enemy.hp,0);assert.ok(enemy.respawnAt>room.elapsed);
  const respawnAt=enemy.respawnAt;while(room.elapsed<respawnAt+.05)stepTeamRoom(room,.05);assert.equal(enemy.hp,TEAM_RULES.heroHp);
  room.score[0]=100;stepTeamRoom(room,.05);assert.equal(room.status,'ended');assert.equal(room.winner,0);
  const srv=createTeamService(),u=users(4);u.forEach(x=>srv.queue(x,{size:2}));srv.leave(u[0]);assert.equal(srv.result(u[0]).status,'idle');assert.equal(srv.result(u[1]).status,'active');srv.leave(u[2]);assert.equal(srv.result(u[1]).status,'ended');assert.equal(srv.result(u[1]).room.winner,1);
});
test('disconnect creates team victory rather than zombie combat',()=>{
  let now=1_000_000;const svc=createTeamService({now:()=>now}),u=users(4);u.forEach(p=>svc.queue(p,{size:2}));now+=61000;svc.tick(.05);assert.equal(svc.result(u[0]).status,'ended');assert.equal(svc.result(u[0]).room.reason,'disconnect');
});
