import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {LONG_ROAD_KEYS,LONG_ROAD_TRANSLATIONS,auditLongRoadLanguages,
 longRoadStatus,longRoadMarkup} from './long-horizon-v249.js';
import {isoWeek} from './official-progress-coach.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {createState} from './rules.js';

const NOW=Date.UTC(2026,10,3,12),WEEK=isoWeek(NOW);
const account=()=>({
 cleared:[],campaignStars:{},act2Cleared:[],act2Stars:{},veteranMedals:{},mazeFloor:0,
 riftWeek:null,bossWeek:null,worldBoss:{week:WEEK,goal:4500,damage:0,victories:0,claimed:false},
 counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},
 contractClaims:{},titles:[],mission:null,lastReport:null,heroes:{aldren:1,lyra:1,rovan:1},
 inventory:{iron_sword:1,ward_mail:1},loadouts:{},team:['aldren','lyra','rovan']
});
const range=()=>Array.from({length:8},(_,i)=>i+1);
const complete=()=>{
 const a=account();a.cleared=range();a.act2Cleared=range();
 a.campaignStars=Object.fromEntries(range().map(i=>[i,3]));
 a.act2Stars=Object.fromEntries(range().map(i=>[i,3]));
 a.veteranMedals=Object.fromEntries(range().map(i=>[i,3]));
 a.mazeFloor=16;a.riftWeek=WEEK;a.bossWeek=WEEK;
 a.counters.win=1800;
 a.contractClaims=Object.fromEntries(Array.from({length:30},(_,i)=>['chronicle:'+(i+1),2*(i+1)**2]));
 return a;
};
test('14 supported languages have every long-term route string with nonempty native copy',()=>{
 assert.deepEqual(Object.keys(LONG_ROAD_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(LONG_ROAD_KEYS.length,21);
 assert.deepEqual(auditLongRoadLanguages(SUPPORTED_LOCALES),[]);
 for(const locale of SUPPORTED_LOCALES){
  setLocale(locale);
  const html=longRoadMarkup(account(),NOW);
  assert.ok(html.includes(LONG_ROAD_TRANSLATIONS[locale].heading),locale);
  assert.ok(html.includes(LONG_ROAD_TRANSLATIONS[locale].intro),locale);
  assert.ok(!html.includes('undefined'),locale);
 }
 setLocale('tr');
});
test('new account sees server-verified roadmap and next real campaign region, no client rewards',()=>{
 const a=account(),status=longRoadStatus(a,NOW),html=longRoadMarkup(a,NOW);
 assert.equal(status.permanentCompleted,0);
 assert.equal(status.permanentTotal,7);
 assert.deepEqual(status.focus,{id:'story',stage:1});
 assert.equal(status.goals.length,9);
 for(const id of ['story','storyStars','act2','act2Stars','veteran','maze','chronicle','rift','boss'])
  assert.ok(html.includes(LONG_ROAD_TRANSLATIONS.tr[id]),id);
 assert.match(html,/<details class="long-road">/);
 assert.match(html,/progress max="24" value="0"/);
 assert.doesNotMatch(html,/data-account-stage=|data-account-contract=|data-account-title=/);
 assert.match(html,/Bu panel ek ödül dağıtmaz/);
 assert.equal(longRoadStatus(null,NOW),null);
});
test('after both acts, smart replay recommends lowest-rated cleared chapter, then Act II stars',()=>{
 const a=complete();
 a.campaignStars={...a.campaignStars,2:2,4:1};
 assert.deepEqual(longRoadStatus(a,NOW).focus,{id:'storyStars',stars:1,stage:4});
 assert.match(longRoadMarkup(a,NOW),/★☆☆ → ★★★/);
 a.campaignStars[2]=3;a.campaignStars[4]=3;
 a.act2Stars={...a.act2Stars,3:1,6:2};
 assert.deepEqual(longRoadStatus(a,NOW).focus,{id:'act2Stars',stars:1,stage:3});
});
test('permanent journey completion uses claims, not fabricated win milestones',()=>{
 const a=complete(),status=longRoadStatus(a,NOW);
 assert.equal(status.permanentCompleted,7);
 assert.equal(status.weeklyCompleted,2);
 assert.equal(status.focus.id,'done');
 delete a.contractClaims['chronicle:30'];
 const missing=longRoadStatus(a,NOW);
 assert.equal(missing.focus.id,'chronicle');
 assert.equal(missing.focus.claim,true);
 assert.equal(missing.goals.find(x=>x.id==='chronicle').value,29);
 assert.equal(missing.permanentCompleted,6);
});
test('weekly world boss and rift are measured by the current server week, not last week',()=>{
 const a=complete();
 const later=NOW+8*86400000,st=longRoadStatus(a,later);
 assert.equal(st.goals.find(x=>x.id==='rift').value,0);
 assert.equal(st.goals.find(x=>x.id==='boss').value,0);
 assert.equal(st.weeklyCompleted,0);
 assert.equal(st.focus.id,'rift');
 assert.notEqual(st.week,WEEK);
});
test('fully mastered veteran chapters no longer offer rejected tier-three replay and weekly rift is locked',()=>{
 const a=complete(),game=createState(NOW);
 const html=accountExpeditionMarkup(game,a,NOW);
 assert.ok(html.includes('long-road'));
 assert.doesNotMatch(html,/data-account-veteran=/,'completed veteran tiers should not be offered again');
 assert.match(html,/data-account-rift disabled/,'claimed weekly rift cannot be replayed for reward');
 const first=account();first.cleared=[1];first.campaignStars={1:2};first.veteranMedals={1:2};
 const stage=accountExpeditionMarkup(game,first,NOW);
 assert.match(stage,/data-account-veteran="1:3"/,'tier 3 remains accessible when tier 2 was cleared');
 assert.match(stage,/data-account-rift disabled/,'rift unavailable before 8 story chapters');
});
test('server values outside expected caps cannot inflate roadmap or HTML injection',()=>{
 const a=complete();a.veteranMedals[1]=999;a.campaignStars[1]=99;a.counters.win=1000000000;
 a.worldBoss.week='<script>alert(1)</script>';
 const status=longRoadStatus(a,NOW),html=longRoadMarkup(a,NOW);
 assert.equal(status.goals.find(x=>x.id==='veteran').value,24);
 assert.equal(status.goals.find(x=>x.id==='storyStars').value,24);
 assert.equal(status.goals.find(x=>x.id==='boss').value,0);
 assert.doesNotMatch(html,/<script>/);
});
