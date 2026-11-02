import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {calendarFromServer,calendarRequest,normalizeCalendar,rewardForDay,REWARD_ITEMS,MILESTONES,rewardCalendarMarkup} from './reward-calendar.js';
import {loadAccountSession} from './account-auth.js';
const T=Date.UTC(2026,10,2,10),DAY=86400000;
test('28 visible days, milestone items and exact guaranteed resource schedule',()=>{
 assert.deepEqual(Object.keys(MILESTONES).map(Number),[7,14,21,28]);
 for(let day=1;day<=28;day++){
  const r=rewardForDay(day);
  for(const key of ['gold','wood','stone','aether'])assert.ok(Number.isInteger(r[key])&&r[key]>0);
  assert.equal(!!r.item,day%7===0);
  if(r.item)assert.ok(REWARD_ITEMS[r.item]);
 }
 assert.deepEqual(rewardForDay(1),{gold:102,wood:51,stone:40,aether:5,item:null});
 assert.deepEqual(rewardForDay(7),{gold:374,wood:177,stone:160,aether:28,item:'lunar_charm'});
 assert.deepEqual(rewardForDay(14),{gold:658,wood:309,stone:265,aether:49,item:'ember_blade'});
 assert.deepEqual(rewardForDay(21),{gold:1042,wood:431,stone:380,aether:80,item:'star_lens'});
 assert.deepEqual(rewardForDay(28),{gold:1626,wood:663,stone:555,aether:123,item:'royal_blade'});
 for(const d of [0,29,-1,NaN])assert.throws(()=>rewardForDay(d));
});
test('missed days keep 28-day calendar progress; consecutive streak resets without punishing the player',()=>{
 const s=R.createState(T);
 for(let day=1;day<=28;day++){
  const now=T+(day-1)*DAY;
  const previous=R.dailyRewardState(s,now);
  assert.equal(previous.nextDay,day);
  assert.equal(previous.available,true);
  const before=s.res.gold,claimed=R.claimDailyReward(s,now);
  assert.equal(claimed.ok,true);
  assert.equal(s.res.gold-before,rewardForDay(day).gold);
  assert.equal(R.claimDailyReward(s,now).ok,false,'cannot double-claim');
 }
 assert.equal(s.dailyCalendar.claimCount,28);
 assert.equal(s.dailyCalendar.streak,28);
 assert.ok(s.inventory.lunar_charm>=1);
 assert.ok(s.inventory.royal_blade>=1);
 const next=R.dailyRewardState(s,T+28*DAY);
 assert.equal(next.nextDay,1);
 assert.equal(next.cycle,2);
 assert.equal(R.claimDailyReward(s,T+30*DAY).ok,true,'skipped day should not erase progress');
 assert.equal(s.dailyCalendar.claimCount,29);
 assert.equal(s.dailyCalendar.streak,1);
 assert.equal(R.dailyRewardState(s,T+31*DAY).nextDay,2);
 const restored=R.restoreState(JSON.stringify(s),T+31*DAY);
 assert.deepEqual(restored.dailyCalendar,s.dailyCalendar);
});
test('legacy beta save migrates old daily chest, retains campaign and does not create two rewards today',()=>{
 const old=R.createState(T);
 old.lastDailyReward='2026-11-02';
 delete old.dailyCalendar;
 const restored=R.restoreState(JSON.stringify(old),T);
 assert.deepEqual(restored.dailyCalendar,{claimCount:1,streak:1,lastClaimDay:'2026-11-02'});
 assert.equal(R.claimDailyReward(restored,T).ok,false);
 assert.equal(R.dailyRewardState(restored,T+DAY).nextDay,2);
});
test('calendar can be opened after claiming and previews all next 28 rewards without fake waiting states',()=>{
 const current=normalizeCalendar({claimCount:0,streak:0,lastClaimDay:null,serverNow:T});
 const a=rewardCalendarMarkup(current,{online:true});
 assert.equal((a.match(/class="reward-day /g)||[]).length,28);
 assert.match(a,/GÜN 28/);assert.match(a,/Kraliyet Sandığı/);assert.match(a,/Bugünkü sandığı aç/);
 assert.match(a,/102 altın/);assert.match(a,/51 kereste/);assert.match(a,/40 taş/);
 assert.match(a,/28 GÜNLÜK/);assert.match(a,/Kaçırdığın günler ilerlemeni silmez/);
 const claimed=normalizeCalendar({claimCount:28,streak:28,lastClaimDay:'2026-11-02',serverNow:T});
 assert.equal(claimed.displayDay,28);assert.equal(claimed.nextDay,1);assert.equal(claimed.cycle,1);
 const html=rewardCalendarMarkup(claimed,{online:true});
 assert.match(html,/Bugünün ödülü alındı/);
 assert.match(html,/Sıradaki 1. gün/);
 assert.match(html,/disabled/);
 const guest=rewardCalendarMarkup(current,{online:false});assert.match(guest,/Yalnızca yerel kayıt/);
});
test('strict authenticated calendar verifies server state and never sends client resources or days',async()=>{
 const uid='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'qa-calendar-token',refresh_token:'keep',user:{id:uid},expires_at:Math.floor(Date.now()/1000)+3600})});
 let sent;
 const sample={ok:true,source:'server-calendar',claimCount:1,streak:1,lastClaimDay:'2026-11-02',
   available:false,nextDay:2,displayDay:1,serverNow:T,cycle:1,granted:null};
 const fetcher=async(url,init)=>{sent={url,init};return {ok:true,json:async()=>sample};};
 const res=await calendarRequest('get',{fetcher});
 assert.equal(res.identity,uid);
 assert.equal(res.calendar.displayDay,1);
 assert.match(sent.url,/\/rpc\/sfb_daily_calendar$/);
 assert.deepEqual(Object.keys(JSON.parse(sent.init.body)).sort(),['p_action','p_request_id']);
 assert.equal(sent.init.headers.Authorization,'Bearer qa-calendar-token');
 const bad=[
 {...sample,available:true},
 {...sample,claimCount:-1},
 {...sample,displayDay:28},
 {...sample,source:'local'},
 {...sample,lastClaimDay:'2026-11-03'},
 {...sample,serverNow:NaN}
 ];
 for(const item of bad)assert.throws(()=>calendarFromServer(item));
 await assert.rejects(calendarRequest('claim',{fetcher:async()=>{throw Error('disconnected');}}),/ulaşılamadı/);
});
test('database is the only source of guaranteed items, UTC eligibility and double-claim protection',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v227-reward-calendar.sql',import.meta.url),'utf8');
 assert.match(sql,/alter table public\.starfort_reward_calendar enable row level security/);
 assert.match(sql,/revoke all on public\.starfort_reward_calendar from public,anon,authenticated/);
 assert.match(sql,/language plpgsql security definer set search_path=''/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/for update/);
 assert.match(sql,/p_request_id/);
 assert.match(sql,/from public\.starfort_village_requests/);
 assert.match(sql,/clock_timestamp\(\) at time zone 'UTC'/);
 assert.match(sql,/cal\.claim_count%28\+1/);
 assert.match(sql,/if held_quantity<20 then/);
 assert.match(sql,/cal\.streak:=case when previous_day=today-1/);
 assert.match(sql,/raise exception 'Eski günlük sandık kapatıldı/);
 assert.match(sql,/grant execute on function public\.sfb_daily_calendar\(text,uuid\) to authenticated/);
});
test('app always opens calendar rather than blindly granting on the daily HUD button',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8'),
  app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),
  css=readFileSync(new URL('./reward-calendar.css',import.meta.url),'utf8');
 assert.match(html,/id="reward-dialog"/);
 assert.match(html,/reward-calendar\.css/);
 assert.match(html,/v2\.31\.0/);
 assert.match(app,/calendarRequest\('get'\)/);
 assert.match(app,/calendarRequest\('claim'\)/);
 assert.match(app,/rewardCalendarMarkup\(calendar/);
 assert.match(app,/data-daily-reward'\)\)\{\$\('#reward-dialog'\)\.showModal\(\)/);
 assert.match(css,/@media\(max-width:430px\)/);
});
