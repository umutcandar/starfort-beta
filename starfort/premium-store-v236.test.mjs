import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadAccountSession} from './account-auth.js';
import {PREMIUM_COSMETICS,CRYSTAL_PACKS,FREE_SEASON,validatePremium,premiumRequest,premiumStoreMarkup,applyPremiumAppearance} from './premium-store.js';
const today={month:'2026-11',wins:0,thresholds:[2,5,10,18],freeClaims:[],premium:false,premiumClaims:[]};
const baseline=()=>({ok:true,source:'server-premium',paymentsEnabled:false,crystals:0,vipUntil:null,equipped:{},owned:[],revision:1,season:{...today},applied:'get'});
test('only cosmetic products, free season tiers and fixed-priced crystal packages are displayed',()=>{
 assert.equal(PREMIUM_COSMETICS.length,8);
 assert.equal(FREE_SEASON.length,4);
 assert.equal(CRYSTAL_PACKS.length,3);
 assert.ok(PREMIUM_COSMETICS.every(x=>x.price>0&&Number.isInteger(x.price)));
 assert.ok(PREMIUM_COSMETICS.every(x=>['castle','cape','banner','victory'].includes(x.kind)));
 assert.deepEqual(FREE_SEASON.map(x=>x.wins),[2,5,10,18]);
 assert.ok(PREMIUM_COSMETICS.every(x=>!/saldırı|can\b|hasar|hız|PvP gücü/i.test(x.detail)));
});
test('premium snapshot refuses forged balances, unknown cosmetics and unsigned responses',()=>{
 assert.equal(validatePremium(baseline()).crystals,0);
 const bad=[
  {source:'browser'},{paymentsEnabled:true},{crystals:-1},{crystals:1.5},{crystals:1e15},
  {revision:0},{vipUntil:'tomorrow'},{owned:['__proto__']},{owned:['castle-aurora','castle-aurora']},
  {equipped:{banner:'banner-royal'}},{equipped:JSON.parse('{"__proto__":"x"}')},
  {season:{...today,wins:-1}},{season:{...today,freeClaims:['2','2']}},
  {season:{...today,month:'future'}},{season:{...today,premium:true}},
  {season:{...today,thresholds:[0,0,0,0]}}
 ];
 for(const change of bad)assert.throws(()=>validatePremium({...baseline(),...change}),JSON.stringify(change));
 const good=validatePremium({...baseline(),owned:['banner-trailblazer'],equipped:{banner:'banner-trailblazer'},season:{...today,wins:3,freeClaims:['1']}});
 assert.deepEqual(good.equipped,{banner:'banner-trailblazer'});
});
test('premium client sends only server action, trusted item and request id, no pricing or wallet values',async()=>{
 loadAccountSession({getItem:()=>JSON.stringify({
  access_token:'qa-access',refresh_token:'qa-refresh',expires_at:Math.floor(Date.now()/1000)+3600,
  user:{id:'11111111-1111-4111-8111-111111111111',email:'qa@starfort.test'}
 })});
 let payload={},auth;
 const fetcher=async (url,options)=>{
  assert.match(url,/rest\/v1\/rpc\/sfb_premium_api/);
  payload=JSON.parse(options.body);
  auth=options.headers.Authorization;
  return {ok:true,json:async()=>({...baseline(),applied:payload.p_action})};
 };
 const result=await premiumRequest('get',{fetcher});
 assert.equal(result.snapshot.crystals,0);
 assert.equal(result.identity,'11111111-1111-4111-8111-111111111111');
 assert.match(auth,/^Bearer qa-access$/);
 assert.deepEqual(payload,{p_action:'get',p_item:null,p_request_id:null});
 await premiumRequest('claim',{item:'1',requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.deepEqual(payload,{p_action:'claim',p_item:'1',p_request_id:'22222222-2222-4222-8222-222222222222'});
 assert.ok(!JSON.stringify(payload).includes('crystals'));
 for(const [action,item] of [['purchase','__proto__'],['equip','fake'],['unequip','__proto__'],['claim','999'],['fund','crystals1200']])
  await assert.rejects(premiumRequest(action,{item,fetcher}));
});
test('storefront displays balance, owned item controls and real free progress without pretending to charge',()=>{
 const html=premiumStoreMarkup(validatePremium(baseline()));
 assert.match(html,/Gerçek para ödemeleri henüz kapalı/);
 assert.match(html,/0 ✦/);
 assert.match(html,/Sezon Yolu/);
 assert.match(html,/data-premium-action="claim"/);
 assert.match(html,/data-premium-action="purchase"/);
 assert.match(html,/Yakında/);
 assert.match(html,/disabled/);
 const owned=validatePremium({...baseline(),owned:['banner-trailblazer','castle-aurora'],crystals:400,
  equipped:{banner:'banner-trailblazer'},season:{...today,wins:5,freeClaims:['1']}});
 const a=premiumStoreMarkup(owned);
 assert.match(a,/Kuşanımı kaldır/);
 assert.match(a,/data-premium-action="equip"/);
 assert.match(a,/Ödülü al/);
 assert.match(a,/Öncü Sancağı/);
});
test('appearance applies only validated ownership, with no stat modifications',()=>{
 const body={dataset:{},querySelector:()=>null};
 const badge={textContent:'',hidden:true};
 const doc={body,querySelector:x=>x==='#premium-wear-badge'?badge:null};
 const snap=validatePremium({...baseline(),owned:['banner-trailblazer','castle-aurora'],equipped:{banner:'banner-trailblazer',castle:'castle-aurora'}});
 applyPremiumAppearance(snap,doc);
 assert.equal(body.dataset.premiumCastle,'castle-aurora');
 assert.equal(body.dataset.premiumBanner,'banner-trailblazer');
 assert.match(badge.textContent,/Öncü Sancağı/);
 applyPremiumAppearance(null,doc);
 assert.deepEqual(body.dataset,{});
 assert.equal(badge.hidden,true);
});
test('SQL grants no anonymous spending or user-paid fulfillment; no payment provider credentials',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v236-premium-foundation.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.starfort_premium_wallet from public,anon,authenticated/);
 assert.match(sql,/revoke all on public\.starfort_premium_events from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.sfb_premium_fulfill\(uuid,text,text,text\) from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.sfb_premium_fulfill\(uuid,text,text,text\) to service_role/);
 assert.match(sql,/paymentsEnabled',false/);
 assert.match(sql,/if w\.crystals<price then raise exception/);
 assert.match(sql,/if progress<threshold then raise exception/);
 assert.match(sql,/select response into prev from public\.starfort_premium_requests/);
 assert.match(sql,/Ücretli satın alma devre dışı/);
 assert.doesNotMatch(sql,/service_role\s*(?:=|:)/i);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/premiumStoreMarkup\(/);
 assert.match(app,/void premiumAction\(button\.dataset\.premiumAction/);
 assert.match(app,/activeView==='shop'\)void refreshPremium\(\)/);
});
