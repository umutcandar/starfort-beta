import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
const directory=await mkdtemp(path.join(os.tmpdir(),'starfort-siege-'));
process.env.STARFORT_DATA_DIR=directory;
const {createGuildServer}=await import('./guild-server.mjs');
test('authenticated HTTP 5v5 siege, separate queue, client assets and authoritative objectives',async()=>{
 const server=await createGuildServer({host:'127.0.0.1',port:0});
 const base=`http://127.0.0.1:${server.address().port}`;
 const req=async(route,token,body)=>{const response=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});return [response.status,await response.json()]};
 try{
  const status=(await req('status'))[1];assert.ok(status.features.includes('live-5v5-siege'));
  const users=[];
  for(let i=0;i<10;i++)users.push((await req('register',null,{name:`Kusatma Tester ${i}`}))[1]);
  assert.equal((await req('team/queue',users[0].token,{size:2,variant:'siege'}))[0],400);
  for(const u of users)assert.equal((await req('team/queue',u.token,{size:5,variant:'siege'}))[0],200);
  const states=await Promise.all(users.map(u=>req('team/state',u.token)));
  assert.ok(states.every(([code,state])=>code===200&&state.status==='active'));
  const room=states[0][1].room;
  assert.equal(room.variant,'siege');assert.equal(room.siege.gate.hp,900);assert.equal(room.siege.core.hp,1000);
  assert.equal(new Set(states.map(x=>x[1].room.id)).size,1);
  assert.equal((await req('team/input',users[0].token,{seq:1,x:1,y:0,attack:false,burst:false,dash:false,order:'push'}))[0],200);
  const latest=(await req('team/state',users[8].token))[1];assert.equal(latest.room.players[0].order,'push');
  assert.equal((await req('team/input',users[0].token,{seq:2,x:0,y:0,attack:true,burst:false,dash:false,order:'hack'}))[0],400);
  for(const asset of ['team-renderer.js','siege-rules.js','unit-dawn-1.webp','unit-dusk-1.webp']){
    const url=asset.endsWith('.webp')?'assets/'+asset:asset;
    assert.equal((await fetch(base+'/starfort/'+url)).status,200,asset);
  }
 }finally{await new Promise(res=>server.close(res));await rm(directory,{recursive:true,force:true});}
});
