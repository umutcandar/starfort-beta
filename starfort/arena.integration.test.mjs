import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const temp=await mkdtemp(path.join(os.tmpdir(),'starfort-arena-'));
process.env.STARFORT_DATA_DIR=temp;
const {createGuildServer}=await import('./guild-server.mjs');
test('two authenticated browser sessions start a true shared 1v1 match',async()=>{
  const server=await createGuildServer({host:'127.0.0.1',port:0}),base=`http://127.0.0.1:${server.address().port}`;
  const call=async(route,token,data)=>{const r=await fetch(base+'/api/'+route,{method:data===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return [r.status,await r.json()];};
  try{
    const a=(await call('register',null,{name:'Duel A'}))[1],b=(await call('register',null,{name:'Duel B'}))[1];
    assert.equal((await call('arena/queue','e'.repeat(64),{}))[0],401);
    assert.equal((await call('arena/queue',a.token,{}))[1].status,'waiting');
    const started=(await call('arena/queue',b.token,{}))[1];assert.equal(started.status,'active');
    assert.equal((await call('arena/state',a.token))[1].room.id,started.room.id);
    assert.equal((await call('arena/input',b.token,{seq:0,x:999,y:0,attack:true,burst:false,dash:false}))[0],400);
    assert.equal((await call('arena/input',a.token,{seq:1,x:1,y:0,attack:false,burst:false,dash:false}))[0],200);
    await new Promise(resolve=>setTimeout(resolve,180));
    const after=(await call('arena/state',a.token))[1];
    assert.ok(after.room.players.find(p=>p.id===a.player.id).x>15);
    const second=(await call('arena/state',b.token))[1];assert.ok(second.room.players.find(p=>p.id===a.player.id).x>=after.room.players.find(p=>p.id===a.player.id).x);
    assert.equal((await call('arena/leave',b.token,{}))[1].status,'idle');
    assert.equal((await call('arena/state',a.token))[1].room.winner,a.player.id);
    assert.equal((await call('status'))[1].features.includes('live-1v1-duel'),true);
    assert.equal((await fetch(base+'/starfort/arena-view.js')).status,200);
  } finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await rm(temp,{recursive:true,force:true});}
});
