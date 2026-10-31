import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamRoom,stepTeamRoom,createTeamService} from './team-arena.js';
import {createSiege,siegeWall,siegeAttack,siegeOutcome,SIEGE} from './siege-rules.js';
const users=Array.from({length:10},(_,i)=>({id:(i+100).toString(16).padStart(24,'0'),name:`Siege Tester ${i}`}));

test('siege is strictly 5v5 and keeps separate gate and crystal HP',()=>{
  assert.throws(()=>createTeamRoom(users.slice(0,4),2,0,'siege'));
  const room=createTeamRoom(users,5,Date.now(),'siege');
  assert.equal(room.variant,'siege');assert.equal(room.siege.gate.hp,SIEGE.maxGateHp);
  assert.equal(room.siege.core.hp,SIEGE.maxCoreHp);
  assert.equal(room.players.filter(p=>p.team===0).length,5);
});

test('closed fortress blocks bypass and rejects defender damage',()=>{
  const room=createTeamRoom(users,5,Date.now(),'siege');
  const a=room.players.find(p=>p.team===0),d=room.players.find(p=>p.team===1);
  a.x=70;a.y=30;siegeWall(room,a);assert.equal(a.x,47);
  d.x=20;d.y=30;siegeWall(room,d);assert.equal(d.x,53);
  assert.equal(siegeAttack(room,d,1000,99),false);
  assert.equal(room.siege.gate.hp,SIEGE.maxGateHp);
  assert.equal(siegeAttack(room,a,13,13),true);
  assert.equal(room.siege.gate.hp,SIEGE.maxGateHp-13);
});

test('attackers demolish gate then crystal and win; defenders win when time expires',()=>{
  const room=createTeamRoom(users,5,Date.now(),'siege');
  for(const p of room.players.filter(p=>p.team===0)){p.x=47;p.y=30;p.input={x:0,y:0,attack:true};}
  for(const p of room.players.filter(p=>p.team===1)){p.x=95;p.y=56;p.input={x:0,y:0,attack:false};}
  for(let i=0;i<1400&&room.siege.gate.hp>0;i++)stepTeamRoom(room,.1);
  assert.equal(room.siege.gate.hp,0,'gate must fall under coordinated assault');
  assert.ok(room.siege.core.hp>0,'core is protected until the gate falls');
  for(const p of room.players.filter(p=>p.team===0)){p.x=75;p.y=30;}
  for(let i=0;i<1200&&room.status==='active';i++)stepTeamRoom(room,.1);
  assert.equal(room.siege.core.hp,0);assert.equal(room.winner,0);
  assert.equal(room.reason,'siege-victory');assert.equal(room.score[0],100);
  const defense=createTeamRoom(users,5,Date.now(),'siege');defense.elapsed=180;siegeOutcome(defense);
  assert.equal(defense.winner,1);assert.equal(defense.reason,'siege-defense');
});

test('10-player siege queues are separate from regular 5v5 queues',()=>{
  const srv=createTeamService();
  const [bad]=srv.queue(users[0],{size:2,variant:'siege'});assert.equal(bad,400);
  for(const u of users){const [status]=srv.queue(u,{size:5,variant:'siege'});assert.equal(status,200)}
  const state=srv.result(users[0]);assert.equal(state.status,'active');assert.equal(state.room.variant,'siege');
  assert.equal(state.room.players.length,10);
  const regular=createTeamService();
  regular.queue(users[0],{size:5});regular.queue(users[1],{size:5,variant:'siege'});
  assert.equal(regular.result(users[0]).status,'waiting');assert.equal(regular.result(users[1]).status,'waiting');
});

test('5v5 clan siege groups join only a siege group, not the normal queue',()=>{
  const srv=createTeamService();const guildA='a'.repeat(24),guildB='b'.repeat(24);
  assert.equal(srv.queueParty(users.slice(0,5),5,guildA,'A','siege')[0],200);
  assert.equal(srv.result(users[0]).status,'waiting');
  assert.equal(srv.queueParty(users.slice(5),5,guildB,'B','siege')[0],200);
  assert.equal(srv.result(users[0]).status,'active');
  const r=srv.result(users[0]).room;
  assert.deepEqual(r.guilds,['A','B']);assert.equal(r.variant,'siege');
  assert.equal(r.players.filter(p=>p.team===0).length,5);
});
