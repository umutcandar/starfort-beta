import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,getLocale,setLocale} from './locale-v243.js';
import {ASCENSION_ITEMS,ASCENSION_WEEKS,ASCENSION_KEYS,ASCENSION_MAX_RANK,
 ASCENSION_POWER_PER_RANK,ASCENSION_TRANSLATIONS,auditAscensionLanguages,
 ascensionCost,ascensionStatus,ascensionMarkup} from './relic-ascension-v252.js';
import {validateAccountSnapshot,accountServerView,ACCOUNT_ACTIONS} from './account-progression.js';
import {armoryMarkup} from './armory-v212.js';
import {equipmentStats,ITEMS} from './equipment.js';
import {createState,teamPower} from './rules.js';
const ddl=readFileSync(new URL('./sql/starfort-v252-relic-ascension.sql',import.meta.url),'utf8');
const t=Date.UTC(2026,10,3,19);
function fixture(){
 return {ok:true,source:'server',serverNow:t,revision:2,
  heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1,ember_guard:1},
  loadouts:{},team:['aldren','lyra','rovan'],cleared:[1,2,3,4],campaignStars:{1:2},
  act2Cleared:[],act2Stars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,bossWeek:null,
  mission:null,lastReport:null,counters:{win:4,hero:0,forge:0,maze:0,rift:0,veteran:0},
  contractClaims:{},titles:[],itemUpgrades:{ember_guard:5},relicAscensions:{},bossSeals:0};
}
function village(){
 const x=createState(t);
 x.heroes={aldren:{level:1},lyra:{level:1},rovan:{level:1}};
 x.serverVillage=true;x.inventory={iron_sword:1,ward_mail:1,ember_guard:1};
 x.itemUpgrades={ember_guard:5};x.relicAscensions={};x.bossSeals=0;
 x.res={gold:100000,stone:10000,wood:5000,aether:3000};
 return x;
}
test('four guaranteed equipment types and 14-language native ascension messages',()=>{
 assert.deepEqual(ASCENSION_ITEMS,['ember_guard','star_spear','guardian_seal','starbreaker']);
 assert.ok(ASCENSION_ITEMS.every(id=>ITEMS.some(item=>item.id===id)));
 assert.deepEqual(Object.keys(ASCENSION_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(ASCENSION_KEYS.length,18);
 assert.deepEqual(auditAscensionLanguages(SUPPORTED_LOCALES),[]);
 const prev=getLocale();
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);const html=ascensionMarkup(village(),'ember_guard');
   assert.ok(html.includes(ASCENSION_TRANSLATIONS[lang].title),lang);
   assert.ok(html.includes(ASCENSION_TRANSLATIONS[lang].intro),lang);
   assert.ok(!html.includes('undefined'),lang);
  }
 }finally{setLocale(prev)}
});
test('four ranks take 2, 5, 9 and 14 separate weekly boss wins, never a daily streak',()=>{
 assert.deepEqual(ASCENSION_WEEKS,[2,5,9,14]);
 assert.equal(ASCENSION_MAX_RANK,4);
 const weekList=[1,2,5,8,11,15,19,23,28,33,37,41,46,51];
 assert.equal(new Set(weekList).size,14);
 const progress=[];
 for(let i=0;i<=weekList.length;i++){
  const v=village();v.bossSeals=i;
  let opened=0;
  for(let rank=1;rank<=4;rank++)if(v.bossSeals>=ASCENSION_WEEKS[rank-1])opened=rank;
  progress.push(opened);
 }
 assert.deepEqual([progress[1],progress[2],progress[4],progress[5],progress[8],progress[9],progress[13],progress[14]],[0,1,1,2,2,3,3,4]);
 assert.equal(weekList[13],51); // Missing weeks lengthen the journey rather than reset achievements.
});
test('ascending equipment consumes expensive server-matched resources, no premium currency',()=>{
 assert.deepEqual([1,2,3,4].map(ascensionCost),[
  {gold:1400,stone:420,aether:100},
  {gold:5600,stone:840,aether:400},
  {gold:12600,stone:1260,aether:900},
  {gold:22400,stone:1680,aether:1600}
 ]);
 assert.equal(ascensionCost(0),null);
 assert.equal(ascensionCost(5),null);
 assert.equal(ascensionCost(1.5),null);
 assert.equal(ASCENSION_POWER_PER_RANK,14);
 assert.equal(ASCENSION_WEEKS[3],14);
});
test('each locked state is explicit and only exact verified conditions enable the button',()=>{
 const state=village();
 assert.equal(ascensionStatus(state,'iron_sword'),null);
 assert.equal(ascensionStatus({...state,serverVillage:false},'ember_guard'),null);
 let st=ascensionStatus(state,'ember_guard');
 assert.equal(st.reason,'needWeeks');
 assert.equal(st.canAscend,false);
 state.bossSeals=2;
 st=ascensionStatus(state,'ember_guard');
 assert.equal(st.reason,null);assert.equal(st.next,1);
 assert.equal(st.canAscend,true);
 assert.match(ascensionMarkup(state,'ember_guard'),/data-account-ascend="ember_guard"/);
 state.itemUpgrades={};
 assert.equal(ascensionStatus(state,'ember_guard').reason,'needMastery');
 state.itemUpgrades={ember_guard:5};state.inventory={};
 assert.equal(ascensionStatus(state,'ember_guard').reason,'needGear');
 state.inventory={ember_guard:1};state.serverMission={mode:'story'};
 assert.equal(ascensionStatus(state,'ember_guard').reason,'battleBlocked');
 state.serverMission=null;state.serverShadowBattle=true;
 assert.equal(ascensionStatus(state,'ember_guard').reason,'battleBlocked');
 state.serverShadowBattle=false;state.res.gold=0;
 assert.equal(ascensionStatus(state,'ember_guard').reason,'needResources');
});
test('existing +5 users remain valid, server rejects unknown, unowned and forged ranks',()=>{
 assert.deepEqual(validateAccountSnapshot(fixture()).relicAscensions,{});
 assert.equal(validateAccountSnapshot(fixture()).bossSeals,0);
 const v=fixture();v.bossSeals=14;v.relicAscensions={ember_guard:4};
 const account=validateAccountSnapshot(v);
 assert.deepEqual(account.relicAscensions,{ember_guard:4});
 assert.equal(account.bossSeals,14);
 assert.ok(ACCOUNT_ACTIONS.includes('ascend'));
 const merged=accountServerView(village(),account);
 assert.equal(merged.relicAscensions.ember_guard,4);
 assert.equal(merged.bossSeals,14);
 for(const changed of [
  {relicAscensions:{iron_sword:1}},
  {relicAscensions:{ember_guard:0}},
  {relicAscensions:{ember_guard:5}},
  {relicAscensions:{ember_guard:'2'}},
  {relicAscensions:{ember_guard:2},itemUpgrades:{}},
  {relicAscensions:{star_spear:1}},
  {relicAscensions:[]},
  {bossSeals:-1},
  {bossSeals:1.5},
  {bossSeals:'14'}
 ])assert.throws(()=>validateAccountSnapshot({...v,...changed}),/işleme verisi/,JSON.stringify(changed));
});
test('rank 4 adds exactly +56 power per equipped relic, with no mutation of old local accounts',()=>{
 const st=village();st.loadouts={aldren:{armor:'ember_guard'}};st.bossSeals=14;
 const base=equipmentStats(st,'aldren'),power=teamPower(st);
 st.relicAscensions={ember_guard:4};
 const after=equipmentStats(st,'aldren');
 assert.equal(after.attack-base.attack,28);
 assert.equal(after.hp,base.hp);
 assert.equal(teamPower(st)-power,56);
 const generic=village();generic.serverVillage=false;generic.relicAscensions={};
 assert.equal(equipmentStats(generic,'aldren').attack,0);
 const label=armoryMarkup(st,'aldren','all','ember_guard');
 assert.match(label,/bag-v252-ascension/);
 assert.match(label,/relic-ascension/);
 assert.match(label,/4 \/ 4/);
 assert.match(label,/data-account-ascend="ember_guard" disabled/);
});
test('server SQL reuses canonical request receipts, authenticated ownership, shared battle power',()=>{
 assert.match(ddl,/add column if not exists relic_ascensions jsonb not null default/);
 assert.match(ddl,/jsonb_typeof\(relic_ascensions\)='object'/);
 assert.match(ddl,/ascensions:=coalesce\(p\.relic_ascensions/);
 assert.match(ddl,/elsif p_action='ascend' then/);
 assert.match(ddl,/if battle is not null then raise exception/);
 assert.match(ddl,/from public\.starfort_shadow_frontier[\s\S]{0,120}battle is not null/);
 assert.match(ddl,/item_id not in \('ember_guard','star_spear','guardian_seal','starbreaker'\)/);
 assert.match(ddl,/coalesce\(\(items->>item_id\)::integer,0\)<1/);
 assert.match(ddl,/coalesce\(\(enchant->>item_id\)::integer,0\)<5/);
 assert.match(ddl,/boss_seals<\(array\[2,5,9,14\]\)\[ascension_level\]/);
 assert.match(ddl,/from public\.starfort_world_boss_contribution[\s\S]{0,120}where user_id=u and damage>=300/);
 assert.match(ddl,/gold',1400\*ascension_level\*ascension_level/);
 assert.match(ddl,/stone',420\*ascension_level/);
 assert.match(ddl,/aether',100\*ascension_level\*ascension_level/);
 assert.match(ddl,/where user_id=u and request_id=p_request_id/);
 assert.match(ddl,/where user_id=u for update/);
 assert.match(ddl,/relic_ascensions=ascensions/);
 assert.match(ddl,/'relicAscensions',ascensions,'bossSeals',boss_seals/);
 assert.equal((ddl.match(/coalesce\(\((?:ascensions|p\.relic_ascensions)->>item_id\)::integer,0\)\*14/g)||[]).length,2);
 assert.match(ddl,/revoke all on function public\.sfb_starfort_progress/);
 assert.match(ddl,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
 assert.match(ddl,/revoke all on function public\.sfb_shadow_api/);
 assert.match(ddl,/grant execute on function public\.sfb_shadow_api.*to authenticated/);
 assert.doesNotMatch(ddl,/\b(?:drop table|truncate table|delete from)\s+public\.starfort/i);
 assert.match(ddl,/Baseli.*3f12acb4faa0da29e94a86f3d73ef683/i);
 assert.match(ddl,/baseline sfb_shadow_api md5 3c5c84262a67acb7e227dc0f4370b1f8/i);
 assert.ok(ddl.includes('$function$;\n\nrevoke all on function public.sfb_starfort_progress'));
 assert.ok(ddl.includes('$function$;\n\nrevoke all on function public.sfb_shadow_api'));
});
test('account UI never generates resources or locally changes boss progress',()=>{
 const state=village();state.bossSeals=2;
 const before=structuredClone(state);
 const ui=ascensionMarkup(state,'ember_guard',x=>x);
 assert.match(ui,/data-account-ascend="ember_guard"/);
 assert.deepEqual(state,before);
 assert.doesNotMatch(ui,/data-account-enhance|data-reward-claim|data-account-turn=/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/button\.dataset\.accountAscend/);
 assert.match(app,/accountProgressAction\('ascend',button\.dataset\.accountAscend\)/);
});
