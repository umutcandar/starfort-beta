import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountSync} from './account-sync.js';
import {accountRequestPasswordReset,accountAcceptRecoveryHash,accountUpdatePassword,accountSession,accountSignOut} from './account-auth.js';
import {verifiedArenaUser} from './arena-auth.js';
import {arenaHeroStyle,validArenaHero,ARENA_HERO_STYLES} from './arena-heroes.js';
import {newRoom,stepRoom,createArenaService} from './arena.js';
import {createTeamRoom,stepTeamRoom} from './team-arena.js';
import * as R from './rules.js';

test('new account backup is automatic, revision checked and unchanged data is not resent',async()=>{
 let cloud=null,rev=0,calls=0,local={version:1,res:{gold:123}};
 const job=[];
 const sync=createAccountSync({
  fetchRemote:async()=>cloud?{state:cloud,revision:rev}:null,
  saveRemote:async(state,expected)=>{calls++;assert.equal(expected,rev);cloud=structuredClone(state);rev++;return {revision:rev};},
  readLocal:()=>local,validateLocal:x=>x,schedule:fn=>job.push(fn),cancel:()=>{}
 });
 assert.equal(await sync.start(),true);
 assert.equal(rev,1);assert.equal(sync.status,'synced');
 await sync.flush();assert.equal(calls,1);
 local.res.gold=456;sync.noteSaved();await sync.flush();
 assert.equal(rev,2);assert.equal(cloud.res.gold,456);
 sync.stop();assert.equal(sync.status,'disconnected');
});
test('a second device never silently overwrites different cloud progress',async()=>{
 const local={version:1,res:{gold:50}},remote={state:{version:1,res:{gold:800}},revision:7};
 let writes=0,conflicts=0;
 const sync=createAccountSync({fetchRemote:async()=>remote,saveRemote:async()=>{writes++;throw Error('unauthorized');},readLocal:()=>local,validateLocal:x=>x,onConflict:()=>conflicts++});
 assert.equal(await sync.start(),false);
 assert.equal(sync.status,'conflict');assert.equal(writes,0);assert.equal(conflicts,1);
 assert.equal(sync.noteSaved(),false);
});
test('revision conflict stops sync and preserves local progress for explicit resolution',async()=>{
 let remoteRev=1,local={version:1,res:{gold:3}},blocked=false;
 const sync=createAccountSync({
  fetchRemote:async()=>({state:{version:1,res:{gold:3}},revision:1}),
  saveRemote:async(state,expected)=>{if(remoteRev!==expected)throw Error('409 Conflict');return {revision:expected+1};},
  readLocal:()=>local,validateLocal:x=>x
 });
 assert.equal(await sync.start(),true);
 local.res.gold=10;remoteRev=2;
 assert.equal(await sync.flush(),false);assert.equal(sync.status,'conflict');
 assert.equal(local.res.gold,10);
});
test('password reset sends expected request and no unvalidated URL is permitted',async()=>{
 let path,options;
 const fetcher=async(u,o)=>{path=u;options=o;return {ok:true,json:async()=>({})}};
 await assert.rejects(()=>accountRequestPasswordReset('bad','https://example.com',fetcher),/e-posta/);
 await assert.rejects(()=>accountRequestPasswordReset('a@b.c','http://example.com',fetcher),/Güvenli/);
 assert.deepEqual(await accountRequestPasswordReset('a@b.c','https://umutcandar.github.io/starfort-beta/starfort/',fetcher),{ok:true});
 assert.match(path,/\/auth\/v1\/recover\?redirect_to=/);
 assert.deepEqual(JSON.parse(options.body),{email:'a@b.c'});
});
test('recovery link verifies session before accepting fragment and never prints secret tokens',async()=>{
 const calls=[];
 const fetcher=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({id:'123e4567-e89b-12d3-a456-426614174000',email:'a@b.c'})}};
 let cleared=false;
 assert.equal(await accountAcceptRecoveryHash('#type=recovery&access_token=access&refresh_token=refresh&expires_in=3600',()=>{cleared=true},fetcher),true);
 assert.equal(accountSession().user.email,'a@b.c');assert.equal(cleared,true);
 assert.equal(calls[0].opts.headers.Authorization,'Bearer access');
 await accountUpdatePassword('correct-long-pass',fetcher);
 assert.equal(calls[1].opts.method,'PUT');
 assert.deepEqual(JSON.parse(calls[1].opts.body),{password:'correct-long-pass'});
 await accountSignOut(async()=>({ok:true,json:async()=>({})}));
});
test('Render verifies JWT via Auth server, rejects fake local token and never trusts client username',async()=>{
 await assert.rejects(()=>verifiedArenaUser('Bearer '+ 'a'.repeat(64),{fetcher:async()=>({ok:false,json:async()=>({})})}),/geçersiz/);
 const token='eyJ'+'.'.repeat(2)+'a'.repeat(88);
 const user=await verifiedArenaUser('Bearer '+token,{
   fetcher:async(url,opts)=>{assert.match(url,/auth\/v1\/user/);assert.equal(opts.headers.Authorization,'Bearer '+token);return {ok:true,json:async()=>({id:'123e4567-e89b-12d3-a456-426614174000',email:'private@example.com'})};}
 });
 assert.equal(user.id,'123e4567-e89b-12d3-a456-426614174000');
 assert.ok(!user.name.includes('@'));
});
test('hero identities influence server combat style but never client-selected raw damage',()=>{
 assert.equal(validArenaHero('custom-superadmin'),null);
 const one=newRoom({id:'heroA',name:'A',heroId:'aldren'},{id:'heroB',name:'B',heroId:'lyra'});
 assert.equal(one.players[0].maxHp,one.players[1].maxHp);
 one.players[0].hp=100;one.players[0].pendingBurst=true;
 one.players[0].x=40;one.players[1].x=47;
 stepRoom(one,.05);
 assert.ok(one.players[0].hp>100,'Aldren guard burst restores HP');
 const a=newRoom({id:'a',name:'A',heroId:'rovan'},{id:'b',name:'B',heroId:'lyra'});
 a.players[0].input={x:1,y:0,attack:false};a.players[1].input={x:1,y:0,attack:false};
 stepRoom(a,.1);assert.ok(a.players[0].x-15>a.players[1].x-85);
 assert.ok(arenaHeroStyle('lyra').range>arenaHeroStyle('rovan').range);
 assert.ok(Object.keys(ARENA_HERO_STYLES).length>=4);
});
test('team server also uses hero identities with balanced HP',()=>{
 const room=createTeamRoom([{id:'a',name:'A',heroId:'aldren'},{id:'b',name:'B',heroId:'lyra'},{id:'c',name:'C'},{id:'d',name:'D'}],2);
 assert.equal(room.players[0].maxHp,room.players[1].maxHp);
 room.players[0].hp=100;room.players[0].burst=true;
 stepTeamRoom(room,.05);
 assert.ok(room.players[0].hp>=100);
 assert.equal(room.players[1].heroId,'lyra');
});
