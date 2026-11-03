import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {loadAccountSession} from './account-auth.js';
import {validateWarfrontSnapshot,warfrontRequest,warfrontMarkup,
 WARFRONT_DOCTRINES,WARFRONT_LOOT,warfrontChestTarget,warfrontChestPrize,
 WARFRONT_DAILY_REWARD,WARFRONT_WEEKLY_REWARD} from './warfront-v237.js';
const TODAY=Date.UTC(2026,10,3,12);
const example=()=>({ok:true,source:'server-warfront',pending:null,revision:1,
 wins:0,dailyWins:0,weeklyWins:0,day:'2026-11-03',week:'2026-45',
 dailyClaimed:false,weeklyClaimed:false,chestsClaimed:0,nextChestWins:3,lastLoot:null});
test('three server-paid doctrines offer risk, defense and shield tactics, never a client damage value',()=>{
 assert.deepEqual(WARFRONT_DOCTRINES.map(x=>x.id),['assault','bulwark','recon']);
 assert.ok(WARFRONT_DOCTRINES.every(x=>Object.keys(x.cost).length===2&&Object.values(x.cost).every(n=>n>0)));
 assert.equal(WARFRONT_DOCTRINES.length,3);
 const sql=readFileSync(new URL('./sql/starfort-v237-tactical-combat.sql',import.meta.url),'utf8');
 assert.match(sql,/pending_doctrine into v_doctrine.*for update/);
 assert.match(sql,/set pending_doctrine=null,revision=revision\+1/);
 assert.match(sql,/if v_doctrine='assault'/);
 assert.match(sql,/if v_doctrine='bulwark'/);
 assert.match(sql,/v_doctrine='recon' and ability='feint'/);
 assert.match(sql,/ability='rally'/);
 assert.match(sql,/lastRallyTurn/);
 assert.match(sql,/if ability not like 'skill:%' and ability<>'feint'/);
});
test('guaranteed equipment chests extend to unlimited repeatable milestones and known in-game equipment',()=>{
 assert.deepEqual([0,1,2,3,4,5,6,7,8].map(warfrontChestTarget),[3,8,15,24,36,48,60,72,84]);
 assert.deepEqual([0,1,2,3,4,5,6,7].map(x=>warfrontChestPrize(x).rarity),
  ['uncommon','rare','epic','legendary','rare','rare','epic','legendary']);
 assert.ok(WARFRONT_LOOT.every(x=>R.ITEMS.some(item=>item.id===x.id)));
});
test('server snapshots are validated, cloned and cannot claim unearned wins',()=>{
 const value=validateWarfrontSnapshot(example());
 assert.equal(value.wins,0);assert.equal(value.pending,null);
 const bad=[{source:'client'},{pending:'admin'},{revision:0},{wins:-1},{dailyWins:3},
  {week:'oops'},{chestsClaimed:2},{nextChestWins:1000},{dailyClaimed:1},
  {lastLoot:{item:'admin',rarity:'rare',chest:1,converted:false}}];
 for(const x of bad)assert.throws(()=>validateWarfrontSnapshot({...example(),...x}));
 const good=validateWarfrontSnapshot({...example(),wins:3,dailyWins:2,chestsClaimed:1,nextChestWins:8,
  lastLoot:{item:'ward_mail',rarity:'uncommon',chest:1,converted:false}});
 assert.equal(good.lastLoot.item,'ward_mail');
});
test('authenticated RPC sends only action,target,UUID, never any user-supplied resources',async()=>{
 const user='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({
  access_token:'warfront-test-token',refresh_token:'refresh',expires_at:Math.floor(Date.now()/1000)+3600,
  user:{id:user,email:'qa@starfort.test'}
 })});
 let body,url,headers;
 const fetcher=async(u,options)=>{url=u;body=JSON.parse(options.body);headers=options.headers;
  return {ok:true,json:async()=>example()};
 };
 const v=await warfrontRequest('prepare',{target:'assault',requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.equal(v.identity,user);
 assert.equal(v.snapshot.revision,1);
 assert.match(url,/\/rest\/v1\/rpc\/sfb_warfront_api$/);
 assert.equal(headers.Authorization,'Bearer warfront-test-token');
 assert.deepEqual(body,{p_action:'prepare',p_target:'assault',p_request_id:'22222222-2222-4222-8222-222222222222'});
 assert.ok(!JSON.stringify(body).includes('gold'));
 for(const [action,target] of [['prepare','__proto__'],['claim_fake',null],['steal','assault']])
  await assert.rejects(warfrontRequest(action,{target,fetcher}));
});
test('warfront UI reveals preview, correct affordability, pending supplies, server bounties and guarded claim',()=>{
 const game={res:{gold:1000,wood:1000,stone:1000,aether:100}};
 const html=warfrontMarkup(validateWarfrontSnapshot(example()),game,null);
 for(const x of ['data-warfront-target="assault"','data-warfront-target="bulwark"','data-warfront-target="recon"',
  'data-warfront-action="claim_daily"','data-warfront-action="claim_weekly"',
  'data-warfront-action="claim_chest"','Cephe Karargâhı','Garantili'])assert.match(html,new RegExp(x));
 assert.equal(WARFRONT_DAILY_REWARD.aether,14);assert.equal(WARFRONT_WEEKLY_REWARD.aether,50);
 const insufficient=warfrontMarkup(validateWarfrontSnapshot(example()),{res:{gold:1,wood:0,stone:0,aether:0}},null);
 assert.match(insufficient,/Kaynak eksik/);
 const queued=warfrontMarkup(validateWarfrontSnapshot({...example(),pending:'assault'}),game,null);
 assert.match(queued,/Hazır ikmal/);
 assert.match(queued,/data-warfront-action="cancel"/);
 const done=warfrontMarkup(validateWarfrontSnapshot({...example(),wins:3,weeklyWins:3,dailyWins:2,
  dailyClaimed:true}),game,{doctrine:'assault'});
 assert.match(done,/Bu dönem alındı/);
 assert.match(done,/Sürmekte olan savaş doktrini/);
 assert.match(done,/Sandığı aç/);
});
test('SQL warfront prevents replay, direct table writes, unverified rewards and early battle prep',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v237-warfront.sql',import.meta.url),'utf8');
 assert.match(sql,/revoke all on public\.starfort_warfront from public,anon,authenticated/);
 assert.match(sql,/revoke all on public\.starfort_warfront_requests from public,anon,authenticated/);
 assert.match(sql,/security definer set search_path=''/);
 assert.match(sql,/where user_id=uid for update/);
 assert.match(sql,/select response into previous from public\.starfort_warfront_requests/);
 assert.match(sql,/if day_progress<2/);
 assert.match(sql,/if week_progress<8/);
 assert.match(sql,/wins<target_wins/);
 assert.match(sql,/coalesce\(\(inv->>item_id\)::integer,0\)>=20/);
 assert.match(sql,/pg\.mission is not null/);
 assert.match(sql,/set res=v_resources,revision=revision\+1/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/warfrontAction\(button\.dataset\.warfrontAction/);
 assert.match(app,/refreshWarfront\(\)/);
 assert.match(app,/warfrontOwner===accountSession\(\)\?\.user\?\.id\?warfrontSnapshot/);
 const exp=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 assert.match(exp,/data-account-turn="feint"/);
 assert.match(exp,/data-account-turn="rally"/);
 assert.match(exp,/warfrontMarkup\(warfront,game,anyMission\)/);
});
