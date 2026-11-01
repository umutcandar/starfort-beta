import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createMatchContinuity} from './match-continuity.js';
import {matchRecord,createMatchLedger} from './match-ledger.js';
import {createArenaService} from './arena.js';
import {createTeamService} from './team-arena.js';
const UUID_A='123e4567-e89b-12d3-a456-426614174001',UUID_B='123e4567-e89b-12d3-a456-426614174002';
const store=()=>{let x=new Map();return{getItem:k=>x.get(k)||null,setItem:(k,v)=>x.set(k,v),removeItem:k=>x.delete(k)};};
test('refresh reconnects the same exact match and never creates false loss',()=>{
  const st=store(),first=createMatchContinuity(st,'starfort:last-duel');
  const active=first.accept({status:'active',room:{id:'0123456789abcdef'},serverEpoch:'render-1'});
  assert.equal(active.status,'active');
  const second=createMatchContinuity(st,'starfort:last-duel');
  const resumed=second.accept({status:'active',room:{id:'0123456789abcdef'},serverEpoch:'render-1'});
  assert.equal(resumed.reconnected,true);
  const cancelled=second.accept({status:'idle',serverEpoch:'render-2'});
  assert.equal(cancelled.status,'interrupted');assert.equal(cancelled.reason,'server-restart');
  assert.match(cancelled.message,/yenilgi yazılmadı/);
  assert.equal(second.accept({status:'idle',serverEpoch:'render-2'}).status,'idle');
});
test('normal completed matches clear session continuity',()=>{
 const st=store(),continuity=createMatchContinuity(st,'r');
 continuity.accept({status:'active',room:{id:'aa'},serverEpoch:'boot'});
 continuity.accept({status:'ended',room:{id:'aa'},serverEpoch:'boot'});
 assert.equal(continuity.pending,null);
 assert.equal(createMatchContinuity(st,'r').accept({status:'idle',serverEpoch:'boot'}).status,'idle');
});
test('authenticated duel heartbeat supports 55-second network loss and 60-second cutoff',()=>{
 let current=Date.now(),svc=createArenaService({now:()=>current}),a={id:UUID_A,name:'A'},b={id:UUID_B,name:'B'};
 svc.queue(a);svc.queue(b);const id=svc.result(a).room.id;
 current+=55000;svc.result(a);svc.result(b);svc.tick(.05);
 assert.equal(svc.result(a).status,'active');assert.equal(svc.result(b).room.id,id);
 current+=61000;svc.tick(.05);
 assert.equal(svc.result(a).status,'ended');assert.equal(svc.result(a).room.reason,'disconnect');
});
test('team reconnects with previous command sequence and remains active in grace',()=>{
 let current=Date.now(),svc=createTeamService({now:()=>current});
 const people=Array.from({length:4},(_,i)=>({id:'123e4567-e89b-12d3-a456-'+String(426614174001+i).padStart(12,'0'),name:'U'+i}));
 for(const p of people)svc.queue(p,{size:2});
 const first=svc.result(people[0]);
 assert.equal(first.status,'active');
 const cmd={seq:99,x:1,y:0,attack:false,burst:false,dash:false};
 assert.equal(svc.input(people[0],cmd)[0],200);
 current+=45000;for(const p of people)svc.result(p);
 svc.tick(.05);assert.equal(svc.result(people[0]).status,'active');
 assert.equal(svc.result(people[0]).inputSeq,99);
 assert.equal(svc.input(people[0],{...cmd,seq:100})[0],200);
});
test('server-authored results have per-player win/loss and cannot be forged by browser',()=>{
 const started=Date.now()-22000;
 const duel={id:'0123456789abcdef',status:'ended',winner:UUID_A,reason:'knockout',startedAt:started,
   players:[{id:UUID_A,heroId:'aldren'},{id:UUID_B,heroId:'lyra'}]};
 const record=matchRecord(duel,'duel',Date.now());
 assert.equal(record.players[0].outcome,'win');assert.equal(record.players[1].outcome,'loss');
 assert.equal(record.mode,'duel');assert.equal(record.players.length,2);
 assert.equal(matchRecord({...duel,status:'active'},'duel'),null);
 assert.equal(matchRecord({...duel,isPractice:true},'duel'),null);
});
test('signed server ingress retries failures and idempotently queues the match once',async()=>{
 const secret='f'.repeat(64),started=Date.now()-20000,room={id:'abcdef0123456789',status:'ended',winner:UUID_A,reason:'knockout',startedAt:started,
 players:[{id:UUID_A,heroId:'aldren'},{id:UUID_B,heroId:'lyra'}]};
 let calls=0,t=Date.now(),validated=false;
 const ledger=createMatchLedger({secret,now:()=>t,fetcher:async(url,opts)=>{
   calls++;const {p_body,p_sig}=JSON.parse(opts.body);
   assert.equal(p_sig,createHmac('sha256',secret).update(p_body).digest('hex'));
   validated=JSON.parse(p_body).players.length===2;
   return calls===1?{ok:false,status:503}:{ok:true,json:async()=>({ok:true,processed:2})};
 }});
 assert.equal(ledger.enqueue(room,'duel'),true);
 assert.equal(ledger.enqueue(room,'duel'),false);
 assert.equal(await ledger.flush(),false);
 assert.equal(ledger.status.pending,1);
 t+=61000;assert.equal(await ledger.flush(),true);
 assert.equal(ledger.status.pending,0);
 assert.equal(ledger.status.sent,1);assert.equal(calls,2);assert.equal(validated,true);
});
