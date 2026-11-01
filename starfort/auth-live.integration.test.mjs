import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const dir=await mkdtemp(path.join(os.tmpdir(),'starfort-auth-live-'));
process.env.STARFORT_DATA_DIR=dir;
process.env.STARFORT_AUTH_REQUIRED='1';
const {createGuildServer}=await import('./guild-server.mjs');
const actual=globalThis.fetch;
test('JWT-only Render arena: real two-user pairing, CORS, no legacy guild registration',async()=>{
 let server;
 globalThis.fetch=async(url,opts={})=>{
   if(String(url).startsWith('https://ftbbzqzgafmallrfimnt.supabase.co/auth/v1/user')){
     const token=opts.headers?.Authorization?.slice(7);
     const id=token?.includes('alpha')?'123e4567-e89b-12d3-a456-426614174001':'123e4567-e89b-12d3-a456-426614174002';
     return {ok:true,json:async()=>({id,email:'hidden@example.com'})};
   }
   return actual(url,opts);
 };
 try{
   server=await createGuildServer({host:'127.0.0.1',port:0});
   const base='http://127.0.0.1:'+server.address().port;
   const jwtA='a'.repeat(64)+'alpha',jwtB='b'.repeat(64)+'beta';
   const req=async(route,token=null,data=null,method=data===null?'GET':'POST')=>{
     const response=await fetch(base+route,{method,headers:{Origin:'https://umutcandar.github.io',...(token?{Authorization:'Bearer '+token}:{}),...(data===null?{}:{'Content-Type':'application/json'})},...(data===null?{}:{body:JSON.stringify(data)})});
     return [response.status,await response.json(),response.headers];
   };
   assert.equal((await req('/api/status'))[0],200);
   assert.equal((await req('/api/register',null,{name:'Legacy'}))[0],410);
   assert.equal((await req('/api/arena/queue',null,{}))[0],401);
   const waiting=await req('/api/arena/queue',jwtA,{heroId:'lyra'});
   assert.equal(waiting[0],200);assert.equal(waiting[1].status,'waiting');
   const matched=await req('/api/arena/queue',jwtB,{heroId:'aldren'});
   assert.equal(matched[0],200);assert.equal(matched[1].status,'active');
   assert.equal(matched[2].get('access-control-allow-origin'),'https://umutcandar.github.io');
   const room=matched[1].room;
   const a=room.players.find(p=>p.id.endsWith('4001'));
   const b=room.players.find(p=>p.id.endsWith('4002'));
   assert.equal(a.heroId,'lyra');assert.equal(b.heroId,'aldren');
   assert.equal(a.maxHp,b.maxHp);
   assert.equal((await req('/api/arena/input',jwtA,{seq:1,x:1,y:0,attack:true,burst:false,dash:false}))[0],200);
   const forbidden=await fetch(base+'/api/arena/state',{headers:{Origin:'https://evil.example',Authorization:'Bearer '+jwtA}});
   assert.equal(forbidden.headers.get('access-control-allow-origin'),null);
 } finally {
   globalThis.fetch=actual;
   if(server)await new Promise(resolve=>server.close(resolve));
   await rm(dir,{force:true,recursive:true});
 }
});
