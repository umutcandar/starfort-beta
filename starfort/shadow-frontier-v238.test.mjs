import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadAccountSession} from './account-auth.js';
import {SHADOW_STAGES,HERO_DISCIPLINES,HERO_TRAINING,validateShadowSnapshot,
 shadowRequest,shadowFrontierMarkup,heroDisciplinesMarkup} from './shadow-frontier-v238.js';
const blank=()=>({ok:true,source:'server-shadow',heroPaths:{},cleared:[],stars:{},
 battle:null,lastReport:null,revision:1,serverNow:Date.UTC(2026,10,3),applied:'get'});
const player=()=>({heroes:{aldren:6,lyra:6,rovan:6},team:['aldren','lyra','rovan'],
 cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2],mission:null});
test('four new independently unlocked server boss chapters with fixed first-clear loot',()=>{
 assert.deepEqual(SHADOW_STAGES.map(x=>x.unlock),[2,4,6,8]);
 assert.deepEqual(SHADOW_STAGES.map(x=>x.firstItem),['grave_seal','eclipse_edge','guardian_seal','starbreaker']);
 assert.equal(new Set(SHADOW_STAGES.map(x=>x.boss)).size,4);
 assert.equal(HERO_DISCIPLINES.length,2);
 assert.deepEqual(HERO_TRAINING.map(x=>x.rank),[1,2,3]);
 assert.deepEqual(HERO_TRAINING.map(x=>x.gold),[250,1000,2250]);
});
test('snapshot strictly validates paths, stage order, permanent stars and active battle ownership',()=>{
 assert.deepEqual(validateShadowSnapshot(blank()).heroPaths,{});
 const rejected=[
  {source:'client'},{heroPaths:{admin:{path:'assault',rank:3}}},
  {heroPaths:{aldren:{path:'godmode',rank:2}}},
  {heroPaths:{aldren:{path:'warden',rank:4}}},
  {cleared:[1,3]},{cleared:[1,1]},{cleared:[1,2,3,4,5]},
  {stars:{'1':3}},{revision:0},{lastReport:[]},
  {battle:{mode:'shadow'}},{battle:{mode:'story'}}
 ];
 for(const p of rejected)assert.throws(()=>validateShadowSnapshot({...blank(),...p}),JSON.stringify(p));
 const b={mode:'shadow',stage:1,wave:2,waves:3,turn:3,power:620,playerHp:200,playerMaxHp:350,
  enemyHp:99,enemyMaxHp:300,attackRanks:2,wardRanks:1,enemyIntent:'shield',
  lastTurnAt:Date.UTC(2026,10,3),lastRallyTurn:0,cooldowns:{}};
 const good=validateShadowSnapshot({...blank(),heroPaths:{aldren:{path:'assault',rank:2}},
  cleared:[1],stars:{'1':3},battle:b});
 assert.equal(good.battle.stage,1);
 assert.equal(good.heroPaths.aldren.rank,2);
 assert.throws(()=>validateShadowSnapshot({...blank(),battle:{...b,enemyIntent:'admin'}}));
 assert.throws(()=>validateShadowSnapshot({...blank(),battle:{...b,wardRanks:10}}));
});
test('server-only shadow RPC never accepts client-provided HP, coins or loot',async()=>{
 const id='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'qa-access',refresh_token:'qa-refresh',
  expires_at:Math.floor(Date.now()/1000)+3600,user:{id,email:'qa@starfort.test'}})});
 let request,path,token;
 const fetcher=async(url,options)=>{path=url;request=JSON.parse(options.body);
  token=options.headers.Authorization;
  return {ok:true,json:async()=>blank()};
 };
 await shadowRequest('train',{target:'aldren',aux:'assault',
  requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.match(path,/rest\/v1\/rpc\/sfb_shadow_api/);
 assert.equal(token,'Bearer qa-access');
 assert.deepEqual(request,{p_action:'train',p_target:'aldren',p_aux:'assault',
  p_request_id:'22222222-2222-4222-8222-222222222222'});
 assert.ok(!JSON.stringify(request).includes('gold'));
 await shadowRequest('start',{target:'1',requestId:'33333333-3333-4333-8333-333333333333',fetcher});
 assert.equal(request.p_action,'start');
 assert.equal(request.p_target,'1');
 await shadowRequest('turn',{aux:'feint',requestId:'44444444-4444-4444-8444-444444444444',fetcher});
 assert.equal(request.p_aux,'feint');
 for(const x of [
  ['train','admin','warden'],['train','aldren','godmode'],['start','9',null],
  ['turn',null,'instant_win'],['delete','1',null]
 ]) await assert.rejects(shadowRequest(x[0],{target:x[1],aux:x[2],fetcher}));
});
test('new stage cards show act II locks, first-clear items and 3-wave real tactical combat',()=>{
 const p=player(),fresh=validateShadowSnapshot(blank());
 const html=shadowFrontierMarkup(fresh,p,Date.UTC(2026,10,3));
 assert.match(html,/Gölge Sınırı/);
 assert.match(html,/12 OPERASYON/);
 for(const i of [1,2,3,4])assert.match(html,new RegExp('data-shadow-start="'+i+'"'));
 assert.match(html,/İkinci Perde gerekli/);
 const active={...blank(),battle:{
  mode:'shadow',stage:1,wave:2,waves:3,turn:3,power:650,
  playerHp:300,playerMaxHp:400,enemyHp:200,enemyMaxHp:400,
  attackRanks:2,wardRanks:1,enemyIntent:'shield',lastTurnAt:Date.UTC(2026,10,3)-5000,
  lastRallyTurn:0,cooldowns:{}
 }};
 const battle=shadowFrontierMarkup(validateShadowSnapshot(active),p,Date.UTC(2026,10,3));
 assert.match(battle,/DALGA 2 \/ 3/);
 assert.match(battle,/Kalkan kalktı/);
 for(const action of ['strike','guard','feint','rally','skill:aldren']){
  assert.match(battle,new RegExp('data-shadow-move="'+action+'"'));
 }
 assert.match(battle,/data-shadow-action="abandon"/);
});
test('hero disciplines are permanently selectable, rank-gated and tied to verified roster',()=>{
 const p=player(),b=validateShadowSnapshot(blank());
 const html=heroDisciplinesMarkup(b,p,{gold:10000,aether:2000,stone:2000});
 assert.match(html,/Hücum Disiplini/);
 assert.match(html,/Muhafız Disiplini/);
 assert.match(html,/data-shadow-train="aldren"/);
 const owned=heroDisciplinesMarkup(validateShadowSnapshot({...blank(),heroPaths:{aldren:{path:'assault',rank:2}}}),
  p,{gold:10000,aether:2000,stone:2000});
 assert.match(owned,/Rütbe 2\/3/);
 const doc=owned.slice(owned.indexOf('alt="><strong>Aldren')-120,owned.indexOf('alt="><strong>Aldren')+1000);
 assert.doesNotMatch(doc,/data-shadow-path="warden"/);
});
test('SQL enforces separated battle lock, four stage gates and hero expertise with real resource debit',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v238-shadow-frontier.sql',import.meta.url),'utf8');
 assert.match(sql,/security definer set search_path=''/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.starfort_shadow_frontier from public,anon,authenticated/);
 assert.match(sql,/select response into prior from public\.starfort_shadow_requests/);
 assert.match(sql,/not in \('assault','warden'\)/);
 assert.match(sql,/if stage>jsonb_array_length\(cleared\)\+1/);
 assert.match(sql,/jsonb_array_length\(p\.act2_cleared\)<stage\*2/);
 assert.match(sql,/if first_clear then/);
 assert.match(sql,/coalesce\(\(inventory->>item_id\)::integer,0\)<20/);
 assert.match(sql,/new\.mission is not null and old\.mission is null/);
 assert.match(sql,/turn_no>=36/);
 assert.match(sql,/round\(received\*1\.34\)/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/shadowAction\('train',button\.dataset\.shadowTrain/);
 assert.match(app,/shadowAction\('turn',null,button\.dataset\.shadowMove/);
 assert.match(app,/heroDisciplinesMarkup\(/);
 const exp=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 assert.match(exp,/shadowFrontierMarkup\(/);
});
