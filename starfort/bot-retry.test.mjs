import test from 'node:test';import assert from 'node:assert/strict';
import {createTeamService} from './team-arena.js';import {createArenaService} from './arena.js';
const user={id:'f'.repeat(24),name:'Tek Kişi'};
test('repeated bot practice exit never fills the server room pool',()=>{
 const team=createTeamService({now:()=>123456});const arena=createArenaService({now:()=>123456});
 for(let i=0;i<50;i++){
   assert.equal(team.queueBot(user,{size:5,variant:'siege'})[1].status,'active');
   assert.equal(team.leave(user).status,'idle');
   assert.equal(arena.queueBot(user).status,'active');
   assert.equal(arena.leave(user).status,'idle');
 }
 assert.equal(team.rooms.size,0);assert.equal(arena.rooms.size,0);
});
