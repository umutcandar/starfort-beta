import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamService,createTeamRoom,stepTeamRoom,sanitizeTeamInput} from './team-arena.js';

const people=Array.from({length:4},(_,i)=>({id:(i+1).toString(16).padStart(24,'0'),name:`Oyuncu ${i+1}`}));
const command=(seq,order,squad='all',focus=null)=>({seq,x:0,y:0,attack:false,burst:false,dash:false,order,squad,focus});

test('unknown squad selectors, unscoped and malicious commands are rejected',()=>{
  assert.equal(sanitizeTeamInput(command(1,'push','enemy')),null);
  assert.equal(sanitizeTeamInput(command(1,'push','constructor')),null);
  assert.equal(sanitizeTeamInput({...command(1,'push','archer'),squad:{}}),null);
  assert.equal(sanitizeTeamInput({...command(1,'push','guard'),order:undefined}),null);
  assert.equal(sanitizeTeamInput(command(1,'push','guard')).squad,'guard');
  assert.equal(sanitizeTeamInput({...command(1,'hold'),squad:undefined}).squad,'all');
});

test('guard pushes while archer holds independently within same player army',()=>{
  const svc=createTeamService(),users=people;users.forEach(u=>svc.queue(u,{size:2}));
  const id=users[0].id;
  let result=svc.input(users[0],command(1,'push','guard'));
  assert.equal(result[0],200);
  const room=[...svc.rooms.values()][0];room.elapsed+=.5;
  result=svc.input(users[0],command(2,'hold','archer'));
  assert.equal(result[0],200);
  const mine=result[1].room.squads.filter(s=>s.ownerId===id);
  assert.equal(mine.find(s=>s.type==='guard').order,'push');
  assert.equal(mine.find(s=>s.type==='archer').order,'hold');
  assert.equal(result[1].room.players.find(p=>p.id===id).order,'follow');
  for(let i=0;i<14;i++)stepTeamRoom(room,.05);
  const guard=room.squads.find(s=>s.ownerId===id&&s.type==='guard');
  const archer=room.squads.find(s=>s.ownerId===id&&s.type==='archer');
  assert.notEqual(guard.x,archer.x);
  assert.equal(guard.order,'push');assert.equal(archer.order,'hold');
});

test('all-unit commands update both squads but never other players squads',()=>{
  const svc=createTeamService();people.forEach(u=>svc.queue(u,{size:2}));
  const room=[...svc.rooms.values()][0];
  const otherBefore=room.squads.find(s=>s.ownerId===people[1].id).order;
  const response=svc.input(people[0],command(1,'push'));
  assert.equal(response[0],200);
  const mine=room.squads.filter(s=>s.ownerId===people[0].id);
  assert.ok(mine.every(s=>s.order==='push'));
  assert.equal(room.squads.find(s=>s.ownerId===people[1].id).order,otherBefore);
});

test('squad focus command remains independent and untrusted focus IDs are rejected',()=>{
  const svc=createTeamService();people.forEach(u=>svc.queue(u,{size:2}));
  const room=[...svc.rooms.values()][0],target=room.players[1];
  assert.equal(svc.input(people[0],command(1,'focus','archer',target.id))[0],200);
  const [guard,archer]=['guard','archer'].map(t=>room.squads.find(s=>s.ownerId===people[0].id&&s.type===t));
  assert.equal(archer.focus,target.id);assert.equal(guard.focus,null);
  assert.equal(svc.input(people[0],command(2,'focus','guard','<script>'))[0],400);
});

test('bot ID target is legal, non-bot forged ID stays invalid',()=>{
  const botId='bot-'+'abcdef0123456789ab';
  assert.equal(sanitizeTeamInput(command(1,'focus','guard',botId))?.focus,botId);
  assert.equal(sanitizeTeamInput(command(1,'focus','guard','bot-notahexstringgggg')),null);
});
