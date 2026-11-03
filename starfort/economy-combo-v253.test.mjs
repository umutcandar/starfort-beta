import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,getLocale,setLocale} from './locale-v243.js';
import {ECONOMY_HORIZONS,ECONOMY_PROFILES,ECONOMY_KEYS,ECONOMY_TRANSLATIONS,
 auditEconomyLanguages,villageCollection,relicRoadRemaining,economyScenario,
 economyHorizonMarkup} from './economy-horizon-v253.js';
import {COMBO_KEYS,COMBO_TRANSLATIONS,comboText,auditComboLanguages} from './boss-combo-v253.js';
import {ASCENSION_ITEMS,ascensionCost,ascensionMarkup} from './relic-ascension-v252.js';
import {bossV250Phase,bossV250Markup} from './story-boss-v250.js';
import {validateAccountSnapshot} from './account-progression.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {createState} from './rules.js';

const sql=readFileSync(new URL('./sql/starfort-v253-eclipse-combo.sql',import.meta.url),'utf8');
const oldSql=readFileSync(new URL('./sql/starfort-v252-relic-ascension.sql',import.meta.url),'utf8');
const NOW=Date.UTC(2026,10,3,20);
function village({level=1,wallet={gold:0,wood:0,stone:0,aether:0}}={}){
 const state=createState(NOW);
 state.serverVillage=true;
 state.buildings={keep:level,farm:level,lumber:level,quarry:level,forge:level,tavern:level,observatory:level};
 state.res={...wallet};
 state.inventory={ember_guard:1,ward_mail:1,iron_sword:1};
 state.itemUpgrades={ember_guard:5};
 state.relicAscensions={};
 state.bossSeals=0;
 return state;
}
const mission=(changes={})=>({
 mode:'story',balanceVersion:4,stage:6,wave:3,waves:3,waveTurn:5,turn:12,
 startedAt:NOW-37000,lastTurnAt:NOW-4000,enemyHp:370,enemyMaxHp:900,
 playerHp:460,playerMaxHp:550,power:850,tier:0,floor:0,
 lastAction:'feint',enemyIntent:'eclipse',cooldowns:{},lastRallyTurn:0,...changes
});
function account(battle){
 return {
 ok:true,source:'server',serverNow:NOW,revision:3,res:{gold:400,wood:300,stone:200,aether:100},
 buildings:{keep:2,farm:2,lumber:2,quarry:2,forge:2,tavern:2,observatory:2},
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{ward_mail:1,iron_sword:1},
 loadouts:{},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6],
 campaignStars:{1:3,2:3},act2Cleared:[],act2Stars:{},veteranMedals:{},
 mazeFloor:0,riftWeek:null,bossWeek:null,worldBoss:{week:'2026-45',goal:4500,damage:100,victories:1,claimed:false},
 mission:battle,lastReport:null,counters:{win:4,hero:0,forge:0,maze:0,rift:0,veteran:0},
 contractClaims:{},titles:[],itemUpgrades:{},relicAscensions:{},bossSeals:0
 };
}
test('all 14 locales describe the economic assumptions and Eclipse counter without fallbacks',()=>{
 assert.deepEqual(Object.keys(ECONOMY_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(Object.keys(COMBO_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(ECONOMY_KEYS.length,18);
 assert.equal(COMBO_KEYS.length,5);
 assert.deepEqual(auditEconomyLanguages(SUPPORTED_LOCALES),[]);
 assert.deepEqual(auditComboLanguages(SUPPORTED_LOCALES),[]);
 const previous=getLocale();
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   const h=economyHorizonMarkup(village());
   const c=bossV250Markup(mission());
   assert.ok(h.includes(ECONOMY_TRANSLATIONS[lang].title),lang);
   assert.ok(h.includes(ECONOMY_TRANSLATIONS[lang].notGuaranteed),lang);
   assert.ok(c.includes(COMBO_TRANSLATIONS[lang].hint),lang);
   assert.equal(comboText('name'),COMBO_TRANSLATIONS[lang].name);
  }
 }finally{setLocale(previous)}
});
test('90/180-day production matches the live PostgreSQL 240-minute fast + 1200-minute 12%-slow cap',()=>{
 assert.deepEqual(ECONOMY_HORIZONS,[90,180]);
 assert.deepEqual(ECONOMY_PROFILES.map(x=>x.id),['casual','daily','active']);
 const b=village().buildings;
 assert.deepEqual(villageCollection(b,60),{gold:240,wood:180,stone:150,aether:36});
 assert.deepEqual(villageCollection(b,240),{gold:960,wood:720,stone:600,aether:144});
 assert.deepEqual(villageCollection(b,1440),{gold:1536,wood:1152,stone:960,aether:230});
 assert.deepEqual(villageCollection(b,720),{gold:1190,wood:892,stone:744,aether:178});
 assert.deepEqual(villageCollection(b,5000),villageCollection(b,1440),'no offline catchup after 24h');
 assert.equal(villageCollection({...b,keep:20,farm:10},1440).gold,Math.floor(4*10*1.95*384));
 const villageSql=readFileSync(new URL('./sql/starfort-village-authority.sql',import.meta.url),'utf8');
 assert.match(villageSql,/least\(240/);
 assert.match(villageSql,/0\.12/);
});
test('realistic long-horizon budget: casual 180 days cannot instantly max all four gear lines',()=>{
 const state=village();
 const cost=relicRoadRemaining(state);
 // Already at +5 for ember_guard, so remaining only its ascension costs.
 assert.deepEqual(cost,{gold:227400,stone:22200,aether:15960});
 const c90=economyScenario(state,90,'casual'),c180=economyScenario(state,180,'casual');
 const d90=economyScenario(state,90,'daily'),d180=economyScenario(state,180,'daily');
 const e180=economyScenario(state,180,'active');
 assert.equal(c90.collections,39);
 assert.equal(c180.collections,78);
 assert.equal(d90.collections,90);
 assert.equal(d180.collections,180);
 assert.equal(e180.collections,360);
 assert.equal(c90.produced.gold,39*1536);
 assert.equal(d180.produced.gold,180*1536);
 assert.ok(c180.shortfall.gold>0,'casual need months of further wins or upgrades');
 assert.ok(d90.shortfall.gold>0,'90 days at starter building is not enough for full relic completion');
 assert.equal(d180.shortfall.gold,0,'180 daily collections might cover equipment-only gold needs');
 assert.ok(d180.produced.aether>cost.aether);
 assert.equal(e180.sufficient,true);
 for(const scenario of [c90,c180,d90,d180,e180]){
  assert.ok(Number.isSafeInteger(scenario.produced.gold));
  assert.ok(scenario.total.gold>=scenario.produced.gold);
 }
});
test('relic budget sums exact server mastery +5 and each of four rank-IV costs, not invented rewards',()=>{
 const s=village();s.itemUpgrades={};const full=relicRoadRemaining(s);
 assert.deepEqual(full,{gold:240600,stone:23400,aether:16840});
 const a=ascensionCost(4);
 assert.deepEqual(a,{gold:22400,stone:1680,aether:1600});
 assert.deepEqual(ASCENSION_ITEMS,['ember_guard','star_spear','guardian_seal','starbreaker']);
 for(const id of ASCENSION_ITEMS){s.itemUpgrades[id]=5;s.relicAscensions[id]=4;}
 assert.deepEqual(relicRoadRemaining(s),{gold:0,stone:0,aether:0});
 assert.match(oldSql,/gold',120\*enchant_level\*enchant_level\*rarity/);
 assert.match(oldSql,/gold',1400\*ascension_level\*ascension_level/);
 assert.match(oldSql,/stone',420\*ascension_level/);
 assert.match(oldSql,/aether',100\*ascension_level\*ascension_level/);
});
test('projection is read-only and clearly excludes wins, quests, trades and future upgrades',()=>{
 const s=village({level:6,wallet:{gold:55,wood:45,stone:35,aether:25}});
 const copy=structuredClone(s);
 const html=ascensionMarkup(s,'ember_guard');
 assert.deepEqual(s,copy);
 assert.match(html,/economy-horizon-v253/);
 assert.match(html,/<details/);
 assert.match(html,/90/);
 assert.match(html,/180/);
 assert.match(html,/relic-ascension/);
 assert.doesNotMatch(html,/data-reward-claim|data-account-turn=|<script/);
 assert.equal(economyScenario(s,91,'daily'),null);
 assert.equal(economyScenario(s,90,'premium'),null);
 assert.equal(economyHorizonMarkup({...s,serverVillage:false}),'');
});
test('new v4 Eclipse intent accepts only verified late-story, advanced Act II, or world boss',()=>{
 assert.equal(validateAccountSnapshot(account(mission())).mission.balanceVersion,4);
 for(const pass of [
  mission({enemyIntent:'sunder'}),mission({mode:'boss',stage:4,wave:1,waves:1,turn:6,waveTurn:6}),
  mission({mode:'act2',stage:5,wave:3,waves:3})
 ])assert.equal(validateAccountSnapshot(account(pass)).mission.balanceVersion,4);
 for(const bad of [
  mission({balanceVersion:3}),mission({balanceVersion:2}),mission({balanceVersion:7}),
  mission({balanceVersion:'4'}),mission({stage:5}),
  mission({mode:'act2',stage:4}),mission({mode:'veteran',stage:7,wave:1,waves:1}),
  mission({mode:'boss',stage:5,wave:1,waves:1})
 ])assert.throws(()=>validateAccountSnapshot(account(bad)),/sürümü|bozuk/i,JSON.stringify(bad));
 const old=mission({balanceVersion:3,enemyIntent:'sunder'});
 assert.equal(validateAccountSnapshot(account(old)).mission.balanceVersion,3);
});
test('boss combo UI warns of two-movement attack and never awards combat resources on client',()=>{
 const game=createState(NOW);const snap=validateAccountSnapshot(account(mission()));
 const view=accountExpeditionMarkup(game,snap,NOW);
 assert.match(view,/intent-eclipse/);
 assert.match(view,/◉/);
 assert.match(view,/boss.*phase|story-boss-v250/);
 assert.match(view,/data-account-turn="guard"/);
 assert.match(view,/data-account-turn="rally"/);
 assert.equal(bossV250Phase(mission()).intent,'eclipse');
 assert.equal(bossV250Phase(mission({mode:'boss',stage:4,wave:1,waves:1})).weekly,true);
 assert.equal(bossV250Phase(mission({balanceVersion:3,mode:'act2'})),null);
 assert.doesNotMatch(view,/data-economy-award|data-boss-free-resource/);
});
test('live-derived server migration keeps row-lock, versioned two-step telegraph and fair counterplay',()=>{
 assert.match(sql,/LIVE BASELINE MD5 0bced2bd39dd7bdd185e5c33f56b41f2/);
 assert.match(sql,/'balanceVersion',4/);
 assert.match(sql,/enemyIntent'='eclipse' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=4/);
 assert.match(sql,/ability='guard' then\s+edmg:=greatest\(1,round\(edmg\*\.42/);
 assert.match(sql,/ability='rally' then\s+edmg:=greatest\(1,round\(edmg\*\.32/);
 assert.match(sql,/ability like 'skill:%' then\s+edmg:=greatest\(1,round\(edmg\*1\.30/);
 assert.match(sql,/battle->>'enemyIntent'='sunder'[\s\S]{0,440}then 'eclipse'/);
 assert.match(sql,/battle->>'enemyIntent'='shield'[\s\S]{0,350}then 'eclipse'/);
 assert.match(sql,/battle->>'mode'='act2' and \(battle->>'stage'\)::integer>=5/);
 assert.match(sql,/and ehp>0 and ehp <= \(battle->>'enemyMaxHp'\)::numeric\*\.50/);
 assert.match(sql,/if ms-last_action<3000 then/);
 assert.match(sql,/if battle is null then raise exception/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/auth\.jwt\(\)->>'is_anonymous'/);
 assert.match(sql,/\$function\$;\s*revoke all on function public\.sfb_starfort_progress/);
 assert.match(sql,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
 assert.doesNotMatch(sql,/\b(?:truncate table|delete from|drop table)\s+public\.starfort/i);
});
