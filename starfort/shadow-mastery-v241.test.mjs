import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHADOW_MASTERY_THRESHOLDS,SHADOW_MASTERY_TITLES,SHADOW_MASTERY_WEEKLY_LIMIT,
 shadowRankFromXp,shadowRankReward,shadowMasterySnapshot,shadowMasteryMarkup} from './shadow-mastery-v241.js';
import {validateShadowSnapshot,shadowRequest} from './shadow-frontier-v238.js';
import {loadAccountSession} from './account-auth.js';
const blank=()=>({ok:true,source:'server-shadow',heroPaths:{},cleared:[],stars:{},
 battle:null,lastReport:null,revision:1,masteryXp:0,masteryRank:0,masteryClaimed:0,
 weeklyRenown:0,weeklyWins:0,weeklyLimit:100,week:'2026-45'});
test('twelve deliberately progressive mastery ranks take many weeks and contain no login-streak requirement',()=>{
 assert.equal(SHADOW_MASTERY_THRESHOLDS.length,12);
 assert.equal(SHADOW_MASTERY_TITLES.length,12);
 assert.equal(new Set(SHADOW_MASTERY_TITLES).size,12);
 assert.equal(SHADOW_MASTERY_THRESHOLDS.at(-1),1120);
 assert.equal(SHADOW_MASTERY_WEEKLY_LIMIT,100);
 assert.ok(SHADOW_MASTERY_THRESHOLDS.every((x,i)=>i===0||x>SHADOW_MASTERY_THRESHOLDS[i-1]));
 assert.ok(SHADOW_MASTERY_THRESHOLDS.at(-1)/SHADOW_MASTERY_WEEKLY_LIMIT>=11);
 assert.equal(shadowRankFromXp(0),0);
 assert.equal(shadowRankFromXp(11),0);
 assert.equal(shadowRankFromXp(12),1);
 assert.equal(shadowRankFromXp(29),1);
 assert.equal(shadowRankFromXp(30),2);
 assert.equal(shadowRankFromXp(1120),12);
 assert.equal(shadowRankFromXp(999999),12);
});
test('milestone rewards grow predictably with no client-supplied currency amounts',()=>{
 assert.deepEqual(shadowRankReward(1),{gold:140,wood:70,stone:65,aether:14});
 assert.deepEqual(shadowRankReward(2),{gold:200,wood:100,stone:95,aether:20});
 assert.deepEqual(shadowRankReward(12),{gold:800,wood:400,stone:395,aether:80});
 for(const rank of [0,-1,13,'1',null])assert.equal(shadowRankReward(rank),null);
});
test('server mastery checks reject falsified ranks, claims, excessive weekly budget and malformed periods',()=>{
 const d=blank();assert.deepEqual(shadowMasterySnapshot(d),{
  xp:0,rank:0,claimed:0,weekly:0,wins:0,limit:100,week:'2026-45'});
 const wrong=[
  {masteryXp:-1},{masteryXp:30,masteryRank:1},
  {masteryXp:12,masteryRank:2},{masteryXp:0,masteryRank:1},
  {masteryClaimed:1},{masteryRank:0,masteryClaimed:12},
  {weeklyRenown:101},{weeklyRenown:-1},{weeklyWins:-1},
  {weeklyWins:100001},{weeklyLimit:9999},{week:'nextweek'},
  {masteryXp:1.8},{masteryRank:'1'}
 ];
 for(const bad of wrong){
  assert.throws(()=>shadowMasterySnapshot({...d,...bad}),JSON.stringify(bad));
  assert.throws(()=>validateShadowSnapshot({...d,...bad}),JSON.stringify(bad));
 }
 const earned=validateShadowSnapshot({...d,masteryXp:19,masteryRank:1,weeklyRenown:19,weeklyWins:1});
 assert.equal(earned.masteryRank,1);
 assert.equal(earned.masteryXp,19);
 assert.equal(earned.weeklyRenown,19);
 // Old browser test fixtures are accepted with conservative zero mastery, never a forged reward.
 const legacy=validateShadowSnapshot({ok:true,source:'server-shadow',heroPaths:{},cleared:[],stars:{},
  battle:null,lastReport:null,revision:1});
 assert.equal(legacy.masteryClaimed,0);
 assert.equal(legacy.masteryRank,0);
});
test('milestone panel shows real player progress, 12-rank map and one-time payout',()=>{
 const d={...blank(),masteryXp:19,masteryRank:1,weeklyRenown:19,weeklyWins:1};
 const markup=shadowMasteryMarkup(d);
 assert.match(markup,/Sınır Ustalığı/);
 assert.match(markup,/1<small>\/12/);
 assert.match(markup,/19 \/ 30 itibar/);
 assert.match(markup,/19 \/ 100 itibar/);
 assert.match(markup,/Ustalık ödülün hazır/);
 assert.match(markup,/140 altın/);
 assert.match(markup,/data-shadow-action="claim_mastery"/);
 assert.equal((markup.match(/<li class=/g)||[]).length,12);
 assert.match(markup,/kesintisiz giriş şartı yok/);
 assert.match(markup,/100 itibar/);
 assert.match(markup,/%38 → %22 → %10/);
 const claimed=shadowMasteryMarkup({...d,masteryClaimed:1});
 assert.match(claimed,/Yeni rütbe bekleniyor/);
 const busy=shadowMasteryMarkup(d,{busy:true});
 assert.match(busy,/data-shadow-action="claim_mastery" disabled/);
 const inBattle=shadowMasteryMarkup(d,{inBattle:true});
 assert.match(inBattle,/data-shadow-action="claim_mastery" disabled/);
 const max=shadowMasteryMarkup({...d,masteryXp:1120,masteryRank:12,masteryClaimed:12,weeklyRenown:100,weeklyWins:30});
 assert.match(max,/Son rütbeye ulaştın/);
});
test('new mastery claim RPC uses only action & UUID and never takes fake XP or prices',async()=>{
 const user='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'qa-access',refresh_token:'qa-refresh',
  expires_at:Math.floor(Date.now()/1000)+3600,user:{id:user,email:'qa@starfort.test'}})});
 let sent,uri,auth;
 const fetcher=async(url,opts)=>{uri=url;sent=JSON.parse(opts.body);auth=opts.headers.Authorization;
  return {ok:true,json:async()=>blank()};
 };
 const res=await shadowRequest('claim_mastery',{requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.equal(res.identity,user);
 assert.equal(res.snapshot.masteryClaimed,0);
 assert.match(uri,/\/rest\/v1\/rpc\/sfb_shadow_api/);
 assert.equal(auth,'Bearer qa-access');
 assert.deepEqual(sent,{p_action:'claim_mastery',p_target:null,p_aux:null,
  p_request_id:'22222222-2222-4222-8222-222222222222'});
 assert.ok(!JSON.stringify(sent).includes('gold'));
});
test('SQL hardens weekly replay soft caps and one-time claims under row locks',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v241-shadow-mastery-balance.sql',import.meta.url),'utf8');
 for(const expected of [
  /mastery_xp bigint not null default 0/,
  /mastery_claimed integer not null default 0/,
  /week_renown integer not null default 0/,
  /if p_action='claim_mastery' then/,
  /w\.mastery_claimed>=mastery_rank/,
  /w\.mastery_claimed:=claimed_rank/,
  /weekly_limit integer:=100/,
  /w\.week_id<>current_week/,
  /repeat_factor:=case when w\.week_wins<6 then \.38/,
  /when w\.week_wins<12 then \.22 else \.10 end/,
  /gained_renown:=least\(new_gain,greatest\(0,weekly_limit-w\.week_renown\)\)/,
  /'renown',gained_renown/,
  /select response into prior from public\.starfort_shadow_requests/,
  /select \* into strict w from public\.starfort_shadow_frontier where user_id=uid for update/
 ])assert.match(sql,expected);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/action==='claim_mastery'/);
 const exp=readFileSync(new URL('./shadow-frontier-v238.js',import.meta.url),'utf8');
 assert.match(exp,/shadowMasteryMarkup\(front/);
 const css=readFileSync(new URL('./shadow-mastery-v241.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:650px\)/);
});
