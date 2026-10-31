import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const dir=await mkdtemp(path.join(os.tmpdir(),'starfort-party-'));
process.env.STARFORT_DATA_DIR=dir;
const {createGuildServer}=await import('./guild-server.mjs');
test('HTTP two 2-member guilds can enter as separate teams; leader/ready authorization',async()=>{
  const server=await createGuildServer({host:'127.0.0.1',port:0});
  const base=`http://127.0.0.1:${server.address().port}`;
  const req=async(route,token,body)=>{const r=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});return [r.status,await r.json()]};
  try{
    const users=[];for(let i=0;i<4;i++)users.push((await req('register',null,{name:'Klan Komutan '+i}))[1]);
    const createA=(await req('guild/create',users[0].token,{name:'Ay Kalkanları'}))[1];
    const createB=(await req('guild/create',users[2].token,{name:'Güneş Muhafızları'}))[1];
    assert.equal((await req('guild/join',users[1].token,{code:createA.guild.code}))[0],200);
    assert.equal((await req('guild/join',users[3].token,{code:createB.guild.code}))[0],200);
    assert.equal((await req('team/party/queue',users[1].token,{size:2}))[0],403);
    assert.equal((await req('team/party/queue',users[0].token,{size:2}))[0],409);
    for(const u of users)assert.equal((await req('guild/war/prepare',u.token,{ready:true,role:'frontline'}))[0],200);
    assert.equal((await req('team/party/queue',users[0].token,{size:2}))[1].status,'waiting');
    assert.equal((await req('team/state',users[1].token))[1].party,true);
    assert.equal((await req('team/party/queue',users[2].token,{size:2}))[1].status,'active');
    const snapshots=await Promise.all(users.map(u=>req('team/state',u.token)));
    const room=snapshots[0][1].room;
    assert.equal(room.players.length,4);
    assert.deepEqual(room.guilds,['Ay Kalkanları','Güneş Muhafızları']);
    assert.equal(new Set(snapshots.map(s=>s[1].room.id)).size,1);
    assert.equal(room.players.find(p=>p.id===users[0].player.id).team,0);
    assert.equal(room.players.find(p=>p.id===users[1].player.id).team,0);
    assert.equal(room.players.find(p=>p.id===users[2].player.id).team,1);
    assert.equal(room.players.find(p=>p.id===users[3].player.id).team,1);
    assert.equal((await req('team/input',users[1].token,{seq:1,x:1,y:0,attack:false,burst:false,dash:false,order:'push'}))[0],200);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
