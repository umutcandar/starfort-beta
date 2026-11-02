import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARAVAN_ROUTES,CARAVAN_DAILY_LIMIT,caravanMarkup,caravanStatus,caravanRecommendation} from './kingdom-caravan.js';
import {validateVillageSnapshot,villageServerView,villageAuthorityRequest} from './village-authority.js';
import {loadAccountSession} from './account-auth.js';
import {createState} from './rules.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
const TODAY=Date.UTC(2026,10,2,11);
const TODAY_DAY='2026-11-02';
const village=(change={})=>({serverVillage:true,serverVillageReady:true,buildings:{keep:4,farm:1,lumber:1,quarry:1,forge:1,tavern:1,observatory:1},
 res:{gold:800,wood:300,stone:240,aether:10},tradeDay:null,tradeRoutes:[],...change});
test('caravan routes have balanced one-way payouts and mutually exclusive daily quotas',()=>{
 assert.equal(CARAVAN_ROUTES.length,3);
 assert.equal(CARAVAN_DAILY_LIMIT,2);
 assert.deepEqual(CARAVAN_ROUTES.map(x=>x.id),['wood','stone','aether']);
 for(const x of CARAVAN_ROUTES){
  assert.ok(x.unlock>=2);
  assert.equal(Object.keys(x.reward).length,1);
  assert.ok(!(Object.keys(x.reward)[0] in x.cost),'route cannot buy and sell the same resource');
  assert.ok(Object.values(x.cost).every(n=>Number.isSafeInteger(n)&&n>0));
 }
 const all=caravanStatus(village(),TODAY);
 assert.equal(all.used,0);
 assert.equal(all.offers.filter(x=>x.available).length,3);
 const once=caravanStatus(village({tradeDay:TODAY_DAY,tradeRoutes:['wood']}),TODAY);
 assert.equal(once.used,1);assert.equal(once.offers[0].available,false);
 assert.equal(once.offers[1].available,true);
 const twice=caravanStatus(village({tradeDay:TODAY_DAY,tradeRoutes:['wood','stone']}),TODAY);
 assert.equal(twice.remaining,0);assert.equal(twice.offers.filter(x=>x.available).length,0);
 const next=caravanStatus(village({tradeDay:TODAY_DAY,tradeRoutes:['wood','stone']}),TODAY+86400000);
 assert.equal(next.remaining,2);
});
test('caravan requires castle progression, real resources and available server cache',()=>{
 assert.equal(caravanStatus(village({buildings:{keep:1}}),TODAY).offers.filter(x=>x.available).length,0);
 assert.deepEqual(caravanStatus(village({buildings:{keep:2}}),TODAY).offers.map(x=>x.available),[true,false,false]);
 assert.equal(caravanStatus(village({res:{gold:1,wood:1,stone:1,aether:0}}),TODAY).offers.filter(x=>x.available).length,0);
 assert.equal(caravanStatus(village({serverVillageReady:false}),TODAY).offers.filter(x=>x.available).length,0);
 assert.equal(caravanStatus(village({res:{gold:800,wood:1e9,stone:240,aether:10}}),TODAY).offers[0].available,false);
});
test('server-account building workshop presents actionable trades and never guest trades',()=>{
 const state={...createState(TODAY),...village(),serverMastery:0};
 const html=buildingWorkshopMarkup(state,'keep',{icon:()=>'<i></i>',now:TODAY});
 assert.match(html,/Kervan Pazarı/);assert.match(html,/data-caravan-trade="wood"/);
 assert.match(html,/data-caravan-trade="stone"/);assert.match(html,/data-caravan-trade="aether"/);
 assert.match(html,/2 HAK/);
 const g={...createState(TODAY),serverVillage:false};
 assert.doesNotMatch(caravanMarkup(g,TODAY),/data-caravan-trade/);
 assert.match(caravanMarkup(village({tradeDay:TODAY_DAY,tradeRoutes:['wood','stone']}),TODAY),/Günlük hak bitti|Bugün yapıldı/);
});
test('server snapshot validates claim shape and overlays only trusted server quotas',()=>{
 const initial={ok:true,source:'server',serverNow:TODAY,revision:3,lastCollected:TODAY,tradeDay:TODAY_DAY,tradeRoutes:['wood'],mastery:0,
  res:{gold:200,wood:300,stone:100,aether:10},
  buildings:{keep:4,farm:1,lumber:1,quarry:1,forge:1,tavern:1,observatory:1},construction:null,lastDailyReward:null};
 const snapshot=validateVillageSnapshot(initial);
 const state=villageServerView(createState(TODAY),snapshot);
 assert.equal(state.tradeDay,TODAY_DAY);assert.deepEqual(state.tradeRoutes,['wood']);
 assert.equal(caravanStatus(state,TODAY).used,1);
 for(const bad of [['wood','wood'],['wood','stone','aether'],['fake'],{},'wood'])
  assert.throws(()=>validateVillageSnapshot({...initial,tradeRoutes:bad}));
 assert.throws(()=>validateVillageSnapshot({...initial,tradeDay:'2026/11/02'}));
});
test('account request sends only route, action and unique request ID, never client balances',async()=>{
 const id='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'qa-test-jwt',refresh_token:'qa-refresh',user:{id},expires_at:Math.floor(Date.now()/1000)+3600})});
 let payload;
 const fetcher=async(url,opts)=>{payload=JSON.parse(opts.body);return {ok:true,json:async()=>({ok:true,source:'server',serverNow:TODAY,revision:3,lastCollected:TODAY,mastery:0,tradeDay:TODAY_DAY,tradeRoutes:['wood'],res:village().res,buildings:village().buildings,construction:null,lastDailyReward:null})}};
 await villageAuthorityRequest('trade',{building:'wood',requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.deepEqual(Object.keys(payload).sort(),['p_action','p_building','p_request_id','p_room_id']);
 assert.equal(payload.p_building,'wood');assert.equal(payload.p_action,'trade');
 assert.ok(!JSON.stringify(payload).includes('gold'));
 await assert.rejects(villageAuthorityRequest('trade',{building:'admin',fetcher}));
});
test('SQL is the sole authority for trade cost, guard, daily quota and idempotent ledger update',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v235-caravan-economy.sql',import.meta.url),'utf8');
 assert.match(sql,/elsif p_action='trade' then/);
 assert.match(sql,/jsonb_array_length\(v_row.trade_routes\)>=2/);
 assert.match(sql,/v_row.trade_routes \? p_building/);
 assert.match(sql,/v_keep<v_required/);
 assert.match(sql,/when 'wood' then '\{"gold":180,"stone":35\}'::jsonb/);
 assert.match(sql,/when 'stone' then '\{"gold":200,"wood":90\}'::jsonb/);
 assert.match(sql,/when 'wood' then '\{"wood":220\}'::jsonb/);
 assert.match(sql,/when 'stone' then '\{"stone":175\}'::jsonb/);
 assert.match(sql,/v_row.trade_routes:=v_row.trade_routes\|\|to_jsonb\(p_building\)/);
 assert.match(sql,/trade_day=v_row.trade_day,trade_routes=v_row.trade_routes/);
 assert.match(sql,/insert into public.starfort_village_requests\(user_id,request_id,response\)/);
 assert.match(sql,/revoke all on function public.sfb_village_api/);
});

test('workshop highlights an affordable caravan matching the missing building materials',()=>{
 const town=village();
 assert.equal(caravanRecommendation(town,{wood:110},TODAY),'wood');
 assert.equal(caravanRecommendation(town,{stone:180},TODAY),'stone');
 assert.equal(caravanRecommendation(town,{aether:10},TODAY),'aether');
 assert.equal(caravanRecommendation(town,{gold:100},TODAY),null);
 assert.match(caravanMarkup(town,TODAY,{missing:{wood:110}}),/caravan-route ready recommended/);
});

test('side inspector respects the same server mastery and one-builder restrictions as workshop',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/function renderInspector\(\)/);
 assert.match(app,/const job=R\.constructionStatus\(v,constructionUiNow\(\)\)/);
 assert.match(app,/!R\.buildingMasteryGate\(v,building\.id\)\.ok/);
 assert.match(app,/!!job\|\|Object\.entries\(cost\)/);
 assert.match(app,/job\.ready\?'İnşaat bitti/);
 assert.match(app,/data-caravan-trade/);
});
