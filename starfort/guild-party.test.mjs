import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamService} from './team-arena.js';
const people=(n,offset=1)=>Array.from({length:n},(_,i)=>({id:(offset+i).toString(16).padStart(24,'0'),name:'Warrior '+(i+offset)}));
test('two clans are matched as intact teams, never split across factions',()=>{
  const service=createTeamService(),red=people(5),blue=people(5,10);
  assert.equal(service.queueParty(red,5,'a'.repeat(24),'Kızıl Muhafızlar')[1].status,'waiting');
  assert.equal(service.result(red[4]).party,true);
  assert.equal(service.queueParty(blue,5,'b'.repeat(24),'Mavi Nöbetçiler')[0],200);
  const room=service.result(blue[3]).room;
  assert.deepEqual(room.guilds,['Kızıl Muhafızlar','Mavi Nöbetçiler']);
  assert.equal(room.mode,'5v5');
  assert.equal(room.players.length,10);
  assert.ok(red.every(p=>room.players.find(x=>x.id===p.id).team===0));
  assert.ok(blue.every(p=>room.players.find(x=>x.id===p.id).team===1));
  assert.equal(service.queue(red[0],{size:2})[1].status,'active');
});
test('party queue is atomic, rejects duplicate/busy members and cancellation removes all',()=>{
  const svc=createTeamService(),red=people(2),blue=people(2,30);
  assert.equal(svc.queueParty([red[0],red[0]],2,'a'.repeat(24),'Red')[0],400);
  assert.equal(svc.queueParty(red,2,'a'.repeat(24),'Red')[0],200);
  assert.equal(svc.queueParty(red,2,'a'.repeat(24),'Red')[0],409);
  assert.equal(svc.queue(red[1],{size:2})[1].party,true);
  assert.equal(svc.leave(red[1]).status,'idle');
  assert.equal(svc.result(red[0]).status,'idle');
  assert.equal(svc.queueParty(blue,2,'b'.repeat(24),'Blue')[1].waiting,2);
  assert.equal(svc.result(blue[1]).status,'waiting');
});
test('clan group expires when a teammate does not connect to combat screen',()=>{
 let time=1_000_000;
 const svc=createTeamService({now:()=>time}),roster=people(2);
 svc.queueParty(roster,2,'a'.repeat(24),'Red');
 time+=30_000;assert.equal(svc.result(roster[0]).status,'waiting');
 time+=16_000;svc.tick(.05);
 assert.equal(svc.result(roster[0]).status,'idle');
 assert.equal(svc.result(roster[1]).status,'idle');
});
