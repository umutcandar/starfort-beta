import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createMatchLedger} from './match-ledger.js';
import {createMatchReceiptRecovery} from './match-receipts.js';
const A='123e4567-e89b-12d3-a456-426614174001';
const B='123e4567-e89b-12d3-a456-426614174002';
const secret='b'.repeat(64);
const memory=()=>{
 const data=new Map();
 return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
};
const endedRoom=clock=>({id:'abcdeffedcba9876',status:'ended',winner:A,reason:'knockout',
  startedAt:clock-14000,players:[{id:A,heroId:'aldren'},{id:B,heroId:'lyra'}]});
test('one server-signed receipt survives a Render restart and browser reload',async()=>{
 let clock=Date.UTC(2026,10,2,13,0),calls=0;
 const live=createMatchLedger({secret,now:()=>clock,fetcher:async()=>({ok:false,status:503})});
 const room=endedRoom(clock);
 assert.equal(live.enqueue(room,'duel'),true);
 const receipt=live.receiptFor(room,'duel');
 assert.equal(live.enqueue(room,'duel'),false);
 assert.equal(receipt.p_sig,createHmac('sha256',secret).update(receipt.p_body).digest('hex'));
 assert.equal(await live.flush(),false);
 const storage=memory();
 const client=createMatchReceiptRecovery({storage,userId:A,now:()=>clock,fetcher:async()=>{throw Error('offline');}});
 assert.equal(client.remember({status:'ended',room:{id:room.id},matchReceipt:receipt}),true);
 assert.equal(client.pending,1);
 // The first server and browser objects no longer exist. Browser storage survives.
 clock+=61000;
 const restarted=createMatchReceiptRecovery({storage,userId:A,now:()=>clock,fetcher:async(url,opts)=>{
   calls++;
   assert.match(url,/\/rpc\/sfb_match_ingest$/);
   const body=JSON.parse(opts.body);
   assert.deepEqual(body,receipt);
   return {ok:true,json:async()=>({ok:true,processed:2})};
 }});
 assert.equal(await restarted.flush(),true);
 assert.equal(restarted.pending,0);assert.equal(calls,1);
 assert.equal(await restarted.flush(),true);assert.equal(calls,1);
});

test('other account, practice room, malformed receipt and expired receipt cannot enter recovery',()=>{
 let clock=Date.UTC(2026,10,2,13,0);
 const receipt=createMatchLedger({secret,now:()=>clock}).receiptFor(endedRoom(clock),'duel');
 const storage=memory();
 const other=createMatchReceiptRecovery({storage,userId:B+'x',now:()=>clock});
 assert.equal(other.remember({status:'ended',matchReceipt:receipt}),false);
 const client=createMatchReceiptRecovery({storage,userId:A,now:()=>clock});
 assert.equal(client.remember({status:'active',matchReceipt:receipt}),false);
 assert.equal(client.remember({status:'ended',room:{isPractice:true},matchReceipt:receipt}),false);
 assert.equal(client.remember({status:'ended',matchReceipt:{p_body:'{}',p_sig:'a'.repeat(64)}}),false);
 const fromOther=createMatchReceiptRecovery({storage,userId:B,now:()=>clock});
 assert.equal(fromOther.remember({status:'ended',matchReceipt:receipt}),true);
 assert.equal(client.pending,0);
 clock+=6*24*3600000+1;
 assert.equal(fromOther.pending,0);
});

test('repeated snapshots only save one receipt and failed ingest stays pending for retry',async()=>{
 let clock=Date.UTC(2026,10,2,13,0);
 const storage=memory();
 const receipt=createMatchLedger({secret,now:()=>clock}).receiptFor(endedRoom(clock),'duel');
 let requests=0;
 const client=createMatchReceiptRecovery({storage,userId:A,now:()=>clock,fetcher:async()=>{
   requests++;return requests===1?{ok:false,status:503}:{ok:true,json:async()=>({ok:true,processed:0})};
 }});
 const snapshot={status:'ended',room:{id:'abcdeffedcba9876'},matchReceipt:receipt};
 assert.equal(client.remember(snapshot),true);
 assert.equal(client.remember(snapshot),true);
 assert.equal(client.pending,1);
 assert.equal(await client.flush(),false);assert.equal(client.pending,1);
 assert.equal(await client.flush(),false);assert.equal(requests,1);
 clock+=30001;
 assert.equal(await client.flush(),true);assert.equal(requests,2);
});
test('falsified victory is not stored when Supabase refuses its signature',async()=>{
 const clock=Date.UTC(2026,10,2,13,0),storage=memory();
 const receipt=createMatchLedger({secret,now:()=>clock}).receiptFor(endedRoom(clock),'duel');
 const tampered={...receipt,p_body:receipt.p_body.replace('"loss"','"win"')};
 assert.notEqual(tampered.p_sig,createHmac('sha256',secret).update(tampered.p_body).digest('hex'));
 const client=createMatchReceiptRecovery({storage,userId:A,now:()=>clock,fetcher:async(url,opts)=>{
   const body=JSON.parse(opts.body);
   const ok=createHmac('sha256',secret).update(body.p_body).digest('hex')===body.p_sig;
   return {ok,status:ok?200:403,json:async()=>({ok})};
 }});
 assert.equal(client.remember({status:'ended',matchReceipt:tampered}),true);
 assert.equal(await client.flush(),false);
 assert.equal(client.pending,1);
});
