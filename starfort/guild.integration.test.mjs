import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const temp=await mkdtemp(path.join(os.tmpdir(),'starfort-qa-'));
process.env.STARFORT_DATA_DIR=temp;
const {createGuildServer}=await import('./guild-server.mjs');
test('two-player guild war room persists and enforces leader permissions',async()=>{
  const server=await createGuildServer({host:'127.0.0.1',port:0});
  const base=`http://127.0.0.1:${server.address().port}`;
  const call=async(route,token,body)=>{const res=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};};
  try{
    const a=await call('register',null,{name:'Komutan A'}),b=await call('register',null,{name:'Komutan B'});
    assert.equal(a.status,201);assert.equal(b.status,201);
    const first=await call('guild/create',a.data.token,{name:'Ejderler'});assert.equal(first.status,200);
    const code=first.data.guild.code;
    const join=await call('guild/join',b.data.token,{code});assert.equal(join.status,200);
    assert.equal(join.data.guild.members.length,2);
    const denied=await call('guild/war/plan',b.data.token,{objective:'north',brief:'Kuzey suruna ilerleyin'});assert.equal(denied.status,403);
    assert.equal((await call('guild/war/plan',a.data.token,{objective:'north',brief:'Öncüler kuzey surunu tutacak'})).status,200);
    assert.equal((await call('guild/war/prepare',b.data.token,{role:'ranged',ready:true})).status,200);
    const guild=(await call('me',a.data.token)).data.guild;
    assert.equal(guild.warPlan.objective,'north');assert.equal(guild.warRoster.find(u=>u.userId===b.data.player.id).ready,true);
    assert.equal((await call('guild/war/plan',a.data.token,{objective:'<script>',brief:'injection test'})).status,400);
    assert.equal((await call('guild/war/prepare',b.data.token,{role:'god',ready:true})).status,400);
    assert.equal((await call('guild/war/prepare','0'.repeat(64),{role:'ranged',ready:true})).status,401);
    assert.equal((await call('guild/leave',b.data.token,{})).status,200);
    assert.equal((await call('me',a.data.token)).data.guild.warRoster.length,1);
    assert.equal((await call('status')).data.features.includes('war-room'),true);
    const page=await fetch(base+'/starfort/tactics.js');assert.equal(page.status,200);assert.match(await page.text(),/createTraining/);
    const forbidden=await fetch(base+'/starfort/.local-data/guilds.json');assert.equal(forbidden.status,403);
  } finally {await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));await rm(temp,{recursive:true,force:true});}
});
