import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createArenaService} from './arena.js';
import {createTeamService} from './team-arena.js';
import * as R from './rules.js';
import {battleMarkup} from './battle-view.js';
const temp=await mkdtemp(path.join(os.tmpdir(),'starfort-http-queue-'));
process.env.STARFORT_DATA_DIR=temp;
const {createGuildServer}=await import('./guild-server.mjs');
test('incomplete HTTP POST cannot hold health or static requests hostage',async()=>{
 const server=await createGuildServer({host:'127.0.0.1',port:0}),base=`http://127.0.0.1:${server.address().port}`;
 const pending=http.request(base+'/api/register',{method:'POST',headers:{'Content-Type':'application/json'}});
 pending.on('error',()=>{});pending.write('{"name":"Sta');
 try {
   const results=await Promise.all([
     fetch(base+'/api/status',{signal:AbortSignal.timeout(1500)}),
     fetch(base+'/starfort/index.html',{signal:AbortSignal.timeout(1500)}),
   ]);
   assert.deepEqual(results.map(r=>r.status),[200,200]);
   assert.equal((await results[0].json()).ok,true);
   assert.match(await results[1].text(),/STARFORT/);
 }finally{pending.destroy();await new Promise(resolve=>server.close(resolve));}
});
test('arena reconnect restores accepted input sequence; new input keeps user alive',()=>{
 let now=Date.now();
 const service=createArenaService({now:()=>now});
 const user={id:'playerA',name:'Aldren'};
 service.queueBot(user);
 assert.equal(service.input(user,{seq:842,x:1,y:0,attack:true,burst:false,dash:false})[0],200);
 const after=service.result(user);
 assert.equal(after.inputSeq,842);
 const newClientCounter=after.inputSeq;
 now+=16000;
 assert.equal(service.input(user,{seq:newClientCounter+1,x:0,y:-1,attack:true,burst:false,dash:false})[0],200);
 now+=4000;service.tick(.05);
 assert.equal(service.result(user).status,'active');
});
test('team reconnect restores server command sequence instead of sending stale command',()=>{
 let now=Date.now();
 const service=createTeamService({now:()=>now});
 const user={id:'playerT',name:'Lyra'};
 assert.equal(service.queueBot(user,{size:2,variant:'flags'})[0],200);
 const input={seq:320,x:0,y:0,attack:false,burst:false,dash:false};
 assert.equal(service.input(user,input)[0],200);
 const snapshot=service.result(user);
 assert.equal(snapshot.inputSeq,320);
 assert.equal(service.input(user,{...input,seq:snapshot.inputSeq+1,x:1})[0],200);
 now+=18000;service.tick(.05);
 assert.equal(service.result(user).status,'active');
});
test('retry buttons preserve veteran or weekly rift mode, never silently normal story',()=>{
 const now=Date.UTC(2026,10,1,12);
 const state=R.createState(now);state.cleared=R.STAGES.map(s=>s.id);
 assert.equal(R.startVeteranBattle(state,2,2).ok,true);
 state.battle.status='lost';
 assert.match(battleMarkup({battle:state.battle}),/data-retry-mode="veteran" data-retry-tier="2"/);
 state.battle=null;
 assert.equal(R.startWeeklyRift(state,now).ok,true);
 state.battle.status='lost';
 assert.match(battleMarkup({battle:state.battle}),/data-retry-mode="rift"/);
});
test.after(async()=>rm(temp,{force:true,recursive:true}));
