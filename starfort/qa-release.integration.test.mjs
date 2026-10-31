import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
const temp=await mkdtemp(path.join(os.tmpdir(),'sf-qa-release-'));
process.env.STARFORT_DATA_DIR=temp;
const {createGuildServer}=await import('./guild-server.mjs');
test('release serves actual entry files and executes registration, guild and solo combat APIs',async()=>{
 const server=await createGuildServer({host:'127.0.0.1',port:0});
 const base=`http://127.0.0.1:${server.address().port}`;
 const req=async(route,token=null,data=undefined)=>{
  const res=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{}) ,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});
  return [res.status,await res.json()];
 };
 try{
  for(const asset of ['index.html','app.js','quick-play.js','team-view.js','arena-view.js','graphics-scene-v2.js','assets/battlefield.webp','assets/siege-cinematic-poster.webp']){
   const response=await fetch(base+'/starfort/'+asset);
   assert.equal(response.status,200,asset);
   assert.ok((await response.arrayBuffer()).byteLength>100,asset);
  }
  assert.equal((await fetch(base+'/starfort/.local-data/guilds.json')).status,403);
  assert.equal((await req('/api/status'))[1].version,'2.8.0-commander-journey');
  assert.equal((await req('/api/team/bot',null,{size:5,variant:'siege'}))[0],401);
  const [ra,alice]=await req('/api/register',null,{name:'QA Leader'});
  const [rb,bob]=await req('/api/register',null,{name:'QA Member'});
  assert.equal(ra,201);assert.equal(rb,201);
  const a=alice.token,b=bob.token;
  const [cg,guild]=await req('/api/guild/create',a,{name:'Test Klanı'});assert.equal(cg,200);
  assert.equal((await req('/api/guild/join',b,{code:guild.guild.code}))[0],200);
  assert.equal((await req('/api/guild/war/prepare',a,{role:'siege',ready:true}))[0],200);
  assert.equal((await req('/api/guild/war/prepare',b,{role:'ranged',ready:true}))[0],200);
  assert.equal((await req('/api/guild/war/plan',a,{objective:'gate',brief:'Kapıyı birlikte yık'}))[0],200);
  const [raidcode,raid]=await req('/api/guild/raid',b,{});assert.equal(raidcode,200);
  assert.equal(raid.guild.members.length,2);
  const [td,duel]=await req('/api/arena/bot',a,{});assert.equal(td,200);assert.equal(duel.status,'active');
  assert.equal((await req('/api/arena/input',a,{seq:1,x:1,y:0,attack:true,burst:false,dash:false}))[0],200);
  assert.equal((await req('/api/arena/leave',a,{}))[1].status,'idle');
  const [tm,team]=await req('/api/team/bot',a,{size:5,variant:'siege'});assert.equal(tm,200);assert.equal(team.room.players.length,10);
  assert.equal((await req('/api/team/input',a,{seq:1,x:1,y:0,attack:true,burst:false,dash:false,order:'push'}))[0],200);
  assert.equal((await req('/api/team/leave',a,{}))[1].status,'idle');
 }finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
