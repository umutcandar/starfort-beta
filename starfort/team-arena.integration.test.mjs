import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
const data=await mkdtemp(path.join(os.tmpdir(),'starfort-team-'));
process.env.STARFORT_DATA_DIR=data;
const {createGuildServer}=await import('./guild-server.mjs');
test('HTTP 2v2 team battle sync and server validation',async()=>{
 const server=await createGuildServer({host:'127.0.0.1',port:0}),base=`http://127.0.0.1:${server.address().port}`;
 const req=async(route,token,body)=>{const r=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});return [r.status,await r.json()]};
 try{
  assert.ok((await req('status'))[1].features.includes('live-2v2-and-5v5-team-battles'));
  assert.equal((await req('team/queue','a'.repeat(64),{size:2}))[0],401);
  const accounts=[];for(let i=0;i<4;i++)accounts.push((await req('register',null,{name:'Team Hero '+i}))[1]);
  const tokens=accounts.map(p=>p.token);
  for(const token of tokens)assert.equal((await req('team/queue',token,{size:2}))[0],200);
  const a=(await req('team/state',tokens[0]))[1],b=(await req('team/state',tokens[3]))[1];
  assert.equal(a.status,'active');assert.equal(a.room.id,b.room.id);assert.equal(a.room.squads.length,8);
  const invalid={seq:0,x:5,y:0,attack:false,burst:false,dash:false};assert.equal((await req('team/input',tokens[0],invalid))[0],400);
  const order={seq:1,x:1,y:0,attack:false,burst:false,dash:false,order:'push'};
  assert.equal((await req('team/input',tokens[0],order))[0],200);
  await new Promise(resolve=>setTimeout(resolve,200));
  const updated=(await req('team/state',tokens[2]))[1];
  assert.ok(updated.room.players.find(p=>p.id===accounts[0].player.id).x>a.room.players[0].x);
  assert.equal(updated.room.players[0].order,'push');
  assert.equal((await req('team/leave',tokens[0],{}))[1].status,'idle');
  assert.equal((await req('team/state',tokens[1]))[1].status,'active');
  assert.equal((await fetch(base+'/starfort/team-view.js')).status,200);
  assert.equal((await fetch(base+'/starfort/team.css')).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(data,{recursive:true,force:true});}
});
test('HTTP matchmaking forms a synchronized ten-player 5v5 lobby',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'starfort-ten-'));
 const server=await createGuildServer({host:'127.0.0.1',port:0}),base=`http://127.0.0.1:${server.address().port}`;
 const request=async(route,token,body)=>{const r=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});return [r.status,await r.json()]};
 try{
  const tokens=[];for(let i=0;i<10;i++){const r=(await request('register',null,{name:'Ten Crew '+i}))[1];tokens.push(r.token)}
  for(let i=0;i<10;i++)assert.equal((await request('team/queue',tokens[i],{size:5}))[0],200);
  const states=await Promise.all(tokens.map(token=>request('team/state',token)));
  assert.ok(states.every(([status,s])=>status===200&&s.status==='active'));
  assert.equal(new Set(states.map(x=>x[1].room.id)).size,1);
  assert.equal(states[0][1].room.players.length,10);assert.equal(states[0][1].room.squads.length,20);
  assert.equal((await request('team/input',tokens[4],{seq:1,x:0,y:0,attack:true,burst:true,dash:false,order:'hold'}))[0],200);
  assert.equal((await request('team/state',tokens[7]))[1].room.players[4].order,'hold');
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
