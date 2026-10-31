import test from 'node:test';import assert from 'node:assert/strict';
import {createArenaService,botInput} from './arena.js';
const user={id:'f'.repeat(24),name:'Tester'};
test('solo bot fills an arena with server-controlled rival',()=>{
 let now=10000;const svc=createArenaService({now:()=>now});
 svc.queue(user);assert.equal(svc.result(user).status,'waiting');
 const room=svc.queueBot(user);assert.equal(room.status,'active');assert.equal(room.room.players.filter(p=>p.isBot).length,1);
 const bot=svc.rooms.get(room.room.id).players[1];const human=svc.rooms.get(room.room.id).players[0];
 assert.equal(botInput(bot,human).attack,false);
 for(let i=0;i<100;i++){now+=50;svc.tick(.05);}
 assert.ok(bot.x<85);
 assert.ok(svc.result(user).room.isPractice);
});
