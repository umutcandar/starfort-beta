import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,getLocale,setLocale} from './locale-v243.js';
import {BOSS_V250_KEYS,BOSS_V250_TRANSLATIONS,auditBossV250Languages,
 bossV250Phase,bossV250Markup} from './story-boss-v250.js';
import {validateAccountSnapshot} from './account-progression.js';

const NOW=Date.UTC(2026,10,3,16);
const mission=(overrides={})=>({
 mode:'story',balanceVersion:2,stage:6,wave:3,waves:3,waveTurn:4,turn:11,
 startedAt:NOW-37000,lastTurnAt:NOW-4000,enemyHp:250,enemyMaxHp:900,
 playerHp:400,playerMaxHp:560,power:650,tier:0,floor:0,
 lastAction:'strike',enemyIntent:'shield',cooldowns:{},lastRallyTurn:0,...overrides
});
const sql=readFileSync(new URL('./sql/starfort-v250-boss-endurance.sql',import.meta.url),'utf8');
const snapshot=(battle)=>({
 ok:true,source:'server',serverNow:NOW,revision:2,
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},
 loadouts:{},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6],campaignStars:{1:2},
 act2Cleared:[],act2Stars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,
 mission:battle,lastReport:null,counters:{win:6,hero:0,forge:0,maze:0,rift:0,veteran:0},
 contractClaims:{},titles:[]
});
test('all 14 active locales contain complete late-boss guidance; none falls back to Turkish',()=>{
 assert.deepEqual(Object.keys(BOSS_V250_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(BOSS_V250_KEYS.length,10);
 assert.deepEqual(auditBossV250Languages(SUPPORTED_LOCALES),[]);
 const saved=getLocale();
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   const html=bossV250Markup(mission());
   assert.ok(html.includes(BOSS_V250_TRANSLATIONS[locale].boss),locale);
   assert.ok(html.includes(BOSS_V250_TRANSLATIONS[locale].shield),locale);
   assert.ok(!html.includes('undefined'),locale);
  }
 }finally{setLocale(saved)}
});
test('boss phase thresholds are independent of client timing and ignore legacy battles',()=>{
 assert.equal(bossV250Phase(mission({enemyHp:901})),null);
 assert.equal(bossV250Phase(mission({enemyHp:700})).phase,1);
 assert.equal(bossV250Phase(mission({enemyHp:604})).phase,1);
 assert.equal(bossV250Phase(mission({enemyHp:603})).phase,2);
 assert.equal(bossV250Phase(mission({enemyHp:300})).phase,2);
 assert.equal(bossV250Phase(mission({enemyHp:297})).phase,3);
 assert.equal(bossV250Phase(mission({stage:3})),null);
 assert.equal(bossV250Phase(mission({wave:2})),null);
 assert.equal(bossV250Phase(mission({mode:'act2'})),null);
 assert.equal(bossV250Phase(mission({balanceVersion:1})),null);
 assert.equal(bossV250Markup(mission({balanceVersion:undefined})), '');
 assert.equal(bossV250Phase(mission({enemyMaxHp:0})),null);
});
test('boss hints correspond to immutable server intent counters and end-stage telegraphs',()=>{
 const saved=getLocale();setLocale('en');
 try{
  const phases={crush:'guard',shield:'shield',drain:'drain',strike:'strike'};
  for(const [intent,key] of Object.entries(phases)){
   const html=bossV250Markup(mission({enemyIntent:intent,enemyHp:200}));
   assert.match(html,/phase-3/);
   assert.ok(html.includes(BOSS_V250_TRANSLATIONS.en[key]));
   assert.match(html,/3 \/ 3/);
   assert.ok(!html.includes('data-account-turn='));
  }
 }finally{setLocale(saved)}
});
test('new server mission snapshot is accepted but forged/unknown versions are rejected',()=>{
 assert.equal(validateAccountSnapshot(snapshot(mission())).mission.balanceVersion,2);
 const legacy=mission({balanceVersion:undefined});
 assert.equal(validateAccountSnapshot(snapshot(legacy)).mission.balanceVersion,undefined);
 for(const version of [-1,0,7,1.5,'2',null])
  assert.throws(()=>validateAccountSnapshot(snapshot(mission({balanceVersion:version}))),/sürümü/);
});
test('server patch applies new HP strictly to new high-level story bosses and new weekly bosses',()=>{
 assert.match(sql,/'balanceVersion',2/);
 assert.match(sql,/if mode='boss' then\s+ehp:=greatest\(ehp,round\(least\(power,1800\)\*1\.65\)::integer\)/);
 assert.match(sql,/when battle->>'mode'='story' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=2/);
 assert.match(sql,/and stage>=4 and req=3 then/);
 assert.match(sql,/greatest\(\(110\+stage\*45\)\*1\.25,least\(power,750\+stage\*90\)\*1\.40\)/);
 assert.ok((sql.match(/coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=2/g)||[]).length>=5);
 for(const power of [450,650,1100,2200]){
  for(const stage of [4,5,6,7,8]){
   const oldHp=Math.round((110+stage*45)*1.25);
   const newHp=Math.round(Math.max(oldHp,Math.min(power,750+stage*90)*1.4));
   assert.ok(newHp>=oldHp);
   assert.ok(newHp<=Math.max(oldHp,Math.round((750+stage*90)*1.4)));
  }
  const baseline=Math.round((110+4*45)*1.4);
  const hp=Math.max(baseline,Math.round(Math.min(power,1800)*1.65));
  assert.ok(hp>=baseline&&hp<=2970);
 }
});
test('boss phases have telegraphed counters, fair star threshold and no repeat-farm bonus',()=>{
 assert.match(sql,/if battle->>'mode'='story' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=2[\s\S]+?case \(battle->>'stage'\)::integer[\s\S]+?when 8 then/);
 assert.match(sql,/battle->>'enemyIntent'='crush' and ability<>'guard'/);
 assert.match(sql,/ability not like 'skill:%' and ability<>'feint'/);
 assert.match(sql,/mode='story' and stage>=4 and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=2 then 24/);
 assert.match(sql,/mode in \('story','act2'\).*then 18 else 5 end/);
 assert.match(sql,/mode='story' and stage>=4 and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=2\s+and not \(cleared @> to_jsonb\(array\[stage\]\)\)/);
 assert.match(sql,/when act2 @> to_jsonb\(array\[stage\]\) then \.5 else 1\.65 end/);
 assert.match(sql,/reward->>c\)::numeric\*\.4/);
 assert.doesNotMatch(sql,/\b(?:delete from|truncate table|drop table)\s+public\.starfort/i);
 assert.match(sql,/u uuid:=auth\.uid\(\)/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/\$function\$;\s*revoke all on function public\.sfb_starfort_progress/,'DDL must end with a semicolon before GRANT and REVOKE');
 assert.match(sql,/revoke all on function public\.sfb_starfort_progress/);
 assert.match(sql,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
});
test('expedition view wires story boss visual cue and respects new three-star turn limit',()=>{
 const source=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 assert.match(source,/import \{bossV250Markup\} from '\.\/story-boss-v250\.js'/);
 assert.match(source,/\$\{bossV250Markup\(mission\)\}/);
 assert.match(source,/mission\?\.balanceVersion>=2&&mission\?\.mode==='story'&&mission\?\.stage>=4\?24/);
});
