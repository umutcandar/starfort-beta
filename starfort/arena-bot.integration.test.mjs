import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const tmp=await mkdtemp(path.join(os.tmpdir(),'starfort-bot-'));
process.env.STARFORT_DATA_DIR=tmp;
const {createGuildServer}=await import('./guild-server.mjs');
test('solo clients can start both bot duel and 5v5 siege using real HTTP server',async()=>{
 const server=await createGuildServer({port:0,host:'127.0.0.1'});
 const base='http://127.0.0.1:'+server.address().port;
 const call=async(route,token,data)=>{const r=await fetch(base+'/api/'+route,{method:data===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return [r.status,await r.json()];};
 try{
  const register=(await call('register',null,{name:'Bot Student'}))[1];const token=register.token;
  const duel=await call('arena/bot',token,{});assert.equal(duel[0],200);assert.equal(duel[1].room.isPractice,true);
  assert.equal((await call('arena/leave',token,{}))[1].status,'idle');
  const team=await call('team/bot',token,{size:5,variant:'siege'});
  assert.equal(team[0],200);assert.equal(team[1].room.isPractice,true);assert.equal(team[1].room.players.length,10);
  const cur=(await call('team/state',token))[1];assert.equal(cur.room.id,team[1].room.id);
  assert.equal((await call('team/bot',token,{size:9}))[0],400);
  assert.equal((await call('team/leave',token,{}))[1].status,'idle');
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await rm(tmp,{recursive:true,force:true});}
});
