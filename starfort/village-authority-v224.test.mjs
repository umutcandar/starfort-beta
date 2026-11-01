import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {loadAccountSession} from './account-auth.js';
import {villageAuthorityRequest,validateVillageSnapshot,villageServerView} from './village-authority.js';
const NOW=Date.UTC(2026,10,2,10);
const base=()=>({
 ok:true,source:'server',serverNow:NOW,lastCollected:NOW,revision:3,applied:'get',
 res:{gold:280,wood:180,stone:150,aether:65},
 buildings:Object.fromEntries(R.BUILDINGS.map(b=>[b.id,1])),
 mastery:0,construction:null,lastDailyReward:null,gain:{},reward:{}
});
test('server village response is schema checked before overlaying local progress',()=>{
 const s=R.createState(NOW);s.res.gold=999999;s.buildings.keep=20;s.campaignStars={1:3};
 const snap=validateVillageSnapshot(base()),view=villageServerView(s,snap);
 assert.equal(view.res.gold,280);assert.equal(view.buildings.keep,1);
 assert.equal(view.serverMastery,0);assert.equal(view.serverVillage,true);
 assert.equal(R.buildingMasteryGate(view,'keep').total,0);
 assert.equal(s.res.gold,999999);assert.equal(s.buildings.keep,20);
 view.res.gold=123;
 assert.equal(snap.res.gold,280,'display cannot mutate the stored authoritative snapshot');
 assert.equal(villageServerView(s,null).serverVillageReady,false);
 const corrupt=[
  {res:{...base().res,gold:Infinity}},{res:{...base().res,stone:-7}},
  {buildings:{...base().buildings,keep:21}},{mastery:999},
  {construction:{id:'keep',fromLevel:9,startedAt:NOW,endsAt:NOW+30000}},
  {lastCollected:'x'},{source:'browser'},{lastDailyReward:'01-01-2026'},{revision:NaN}
 ];
 for(const invalid of corrupt)assert.throws(()=>validateVillageSnapshot({...base(),...invalid}));
});
test('RPC sends only action and building ID; tampered browser resources are never included',async()=>{
 const uid='11111111-1111-4111-8111-111111111111';
 const stored={access_token:'fake-access',refresh_token:'refresh',user:{id:uid,email:'qa@example.com'},expires_at:Math.floor(Date.now()/1000)+3600};
 loadAccountSession({getItem:()=>JSON.stringify(stored)});
 let request;
 const fetcher=async(url,opts)=>{request={url,opts};return {ok:true,json:async()=>base()}};
 const result=await villageAuthorityRequest('upgrade',{building:'keep',requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.equal(result.identity,uid);
 assert.equal(result.snapshot.res.gold,280);
 assert.match(request.url,/\/rest\/v1\/rpc\/sfb_village_api$/);
 assert.match(request.opts.headers.Authorization,/^Bearer fake-access$/);
 const sent=JSON.parse(request.opts.body);
 assert.deepEqual(Object.keys(sent).sort(),['p_action','p_building','p_request_id','p_room_id']);
 assert.equal(sent.p_action,'upgrade');assert.equal(sent.p_building,'keep');
 assert.equal(sent.p_request_id,'22222222-2222-4222-8222-222222222222');
 assert.ok(!JSON.stringify(sent).includes('res'));
 assert.equal(request.opts.method,'POST');
 for(const building of ['__proto__','evil',0])await assert.rejects(villageAuthorityRequest('upgrade',{building,fetcher}));
 await assert.rejects(villageAuthorityRequest('admin',{fetcher}));
});
test('server rejects invalid response and unreachable network without optimistic mutation',async()=>{
 const uid='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'abc',refresh_token:'def',user:{id:uid},expires_at:Math.floor(Date.now()/1000)+3600})});
 await assert.rejects(villageAuthorityRequest('collect',{fetcher:async()=>{throw Error('offline')}}),/bağlanılamadı/);
 await assert.rejects(villageAuthorityRequest('finish',{fetcher:async()=>({ok:false,json:async()=>({message:'İnşaat henüz tamamlanmadı.'})})}),/tamamlanmadı/);
 await assert.rejects(villageAuthorityRequest('daily',{fetcher:async()=>({ok:true,json:async()=>({ok:true,source:'browser'})})}),/geçersiz/);
});
test('SQL ledger is protected with RLS, no direct auth table writes, server clock, row lock and idempotency',()=>{
 const sql=readFileSync(new URL('./sql/starfort-village-authority.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.starfort_village_ledger from public, anon, authenticated/);
 assert.match(sql,/revoke all on public\.starfort_village_match_claims from public, anon, authenticated/);
 assert.match(sql,/security definer\s+set search_path = ''/i);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/where user_id=v_user for update/);
 assert.match(sql,/v_row\.last_request_id=p_request_id/);
 assert.match(sql,/clock_timestamp\(\)/);
 assert.match(sql,/p_action not in \('get','collect','upgrade','finish','daily','match'\)/);
 assert.match(sql,/grant execute on function public\.sfb_village_api\(text,text,uuid,text\) to authenticated/);
 assert.match(sql,/v_row\.mastery<v_required/);
 assert.match(sql,/from public\.starfort_match_history/);
 assert.doesNotMatch(sql,/grant\s+(?:insert|update|delete|all)\s+on\s+public\.starfort_village_ledger\s+to\s+authenticated/i);
 const replay=readFileSync(new URL('./sql/starfort-village-replay-guard.sql',import.meta.url),'utf8');
 assert.match(replay,/primary key\(user_id,request_id\)/);
 assert.match(replay,/alter table public\.starfort_village_requests enable row level security/);
 assert.match(replay,/revoke all on public\.starfort_village_requests from public,anon,authenticated/);
 assert.match(replay,/select response into v_previous from public\.starfort_village_requests/);
 assert.match(replay,/if found then return v_previous/);
 assert.match(replay,/insert into public\.starfort_village_requests\(user_id,request_id,response\)/);

});
