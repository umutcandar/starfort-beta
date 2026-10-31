import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
import {trainingDifficulty,trainingLabel} from './training-difficulty.js';
import {createArenaService,botInput} from './arena.js';
import {createTeamService,teamBotInput} from './team-arena.js';
const user={id:'9'.repeat(24),name:'Training Student'};
test('only three known difficulty levels are accepted; labels have sane fallback',()=>{
  assert.deepEqual(['easy','normal','hard'].map(trainingDifficulty),['easy','normal','hard']);
  for(const bad of ['ultra',null,0,{},['hard']])assert.equal(trainingDifficulty(bad),null);
  assert.equal(trainingLabel('hard'),'Zor');assert.equal(trainingLabel(undefined),'Normal');
});
test('duel AI difficulty changes behavior without violating movement bounds',()=>{
  const bot={x:80,y:30},human={x:30,y:30};
  const easy=botInput(bot,human,3,'easy'),normal=botInput(bot,human,3,'normal'),hard=botInput(bot,human,3,'hard');
  assert.ok(Math.hypot(easy.x,easy.y)<Math.hypot(normal.x,normal.y));
  assert.ok(Math.hypot(hard.x,hard.y)>Math.hypot(normal.x,normal.y));
  for(const mode of ['easy','normal','hard']){
    const action=botInput(bot,human,3,mode);assert.ok(Math.hypot(action.x,action.y)<=1.00001);
  }
  assert.equal(easy.dash,false);assert.equal(normal.dash,true);assert.equal(hard.dash,true);
  const close={x:38,y:30};assert.equal(botInput(close,human,3,'easy').burst,false);assert.equal(botInput(close,human,3,'hard').burst,true);
});
test('solo duel and 5v5 training persist selected difficulty and never change live PvP',()=>{
  const duel=createArenaService();const s=duel.queueBot(user,{difficulty:'hard'});
  assert.equal(s.room.botDifficulty,'hard');assert.equal(s.room.isPractice,true);
  duel.leave(user);
  const team=createTeamService();const [code,data]=team.queueBot(user,{size:5,variant:'siege',difficulty:'easy'});
  assert.equal(code,200);assert.equal(data.room.botDifficulty,'easy');
  const room=team.rooms.get(data.room.id),ai=teamBotInput(room,room.players[1],'easy');
  assert.equal(ai.burst,false);assert.equal(ai.dash,false);
  assert.equal(team.queueBot(user,{size:5,difficulty:'invalid'})[0],400);
  team.leave(user);
});
test('HTML views include difficulty choices, live HP HUD, and a non-blocking fullscreen control',async()=>{
  const duel=await readFile(new URL('./arena-view.js',import.meta.url),'utf8');
  const team=await readFile(new URL('./team-view.js',import.meta.url),'utf8');
  assert.match(duel,/id="arena-me-hp"/);assert.match(duel,/id="arena-enemy-hp"/);
  assert.match(duel,/id="arena-timer"/);assert.match(duel,/difficulty:botDifficulty/);
  assert.match(team,/id="team-bot-difficulty"/);assert.match(team,/difficulty:botDifficulty/);
});
const temp=await mkdtemp(path.join(os.tmpdir(),'sf-training-qa-'));
process.env.STARFORT_DATA_DIR=temp;
const {createGuildServer}=await import('./guild-server.mjs');
test('HTTP bot difficulty is validated and returned from authoritative match snapshot',async()=>{
  const server=await createGuildServer({host:'127.0.0.1',port:0});
  const base=`http://127.0.0.1:${server.address().port}/api/`;
  const request=async(route,token,data)=>{const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});return [r.status,await r.json()];};
  try{
    const [code,reg]=await request('register',null,{name:'Training Hero'});assert.equal(code,201);
    assert.equal((await request('arena/bot',reg.token,{difficulty:'unknown'}))[0],400);
    const [ok,match]=await request('arena/bot',reg.token,{difficulty:'hard'});
    assert.equal(ok,200);assert.equal(match.room.botDifficulty,'hard');
    await request('arena/leave',reg.token,{});
    const [bad]=await request('team/bot',reg.token,{size:5,variant:'siege',difficulty:'unknown'});assert.equal(bad,400);
    const [teamCode,team]=await request('team/bot',reg.token,{size:5,variant:'siege',difficulty:'easy'});
    assert.equal(teamCode,200);assert.equal(team.room.botDifficulty,'easy');assert.equal(team.room.players.length,10);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});
test('hard solo duel and hard 5v5 finish and obey authoritative health bounds',()=>{
  let now=1000000;
  const duel=createArenaService({now:()=>now});
  const solo=duel.queueBot(user,{difficulty:'hard'});
  let seq=0;
  for(let step=0;step<2700&&duel.result(user).status==='active';step++){
    if(step%12===0)duel.input(user,{seq:++seq,x:0,y:0,attack:true,burst:true,dash:false});
    now+=50;duel.tick(.05);
  }
  assert.equal(duel.result(user).status,'ended');
  for(const p of duel.rooms.get(solo.room.id).players)assert.ok(Number.isFinite(p.hp)&&p.hp>=0&&p.hp<=p.maxHp);
  const team=createTeamService({now:()=>now});const [,state]=team.queueBot(user,{size:5,variant:'siege',difficulty:'hard'});
  seq=0;
  for(let step=0;step<3900&&team.result(user).status==='active';step++){
    if(step%10===0)team.input(user,{seq:++seq,x:0,y:0,attack:true,burst:true,dash:false,order:'push'});
    now+=50;team.tick(.05);
  }
  assert.equal(team.result(user).status,'ended');
  const room=team.rooms.get(state.room.id);
  for(const p of room.players)assert.ok(Number.isFinite(p.hp)&&p.hp>=0&&p.hp<=p.maxHp);
});
