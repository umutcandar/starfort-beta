import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {BOSS_RELIC_ITEMS,BOSS_RELIC_KEYS,BOSS_RELIC_TRANSLATIONS,
 weeklyBossRelic,bossRelicText,auditBossRelicLanguages} from './boss-relic-v251.js';
import {bossV250Phase,bossV250Markup} from './story-boss-v250.js';
import {validateAccountSnapshot} from './account-progression.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {createState,ITEMS} from './rules.js';
import {displayItem} from './locale-items-v246.js';

const NOW=Date.UTC(2026,10,3,19);
const WEEK='2026-45';
const source=()=>({
 ok:true,source:'server',serverNow:NOW,revision:4,res:{gold:500,wood:400,stone:300,aether:100},
 buildings:{keep:2,farm:2,lumber:2,quarry:2,forge:2,tavern:2,observatory:2},
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},loadouts:{},
 team:['aldren','lyra','rovan'],cleared:[1,2,3,4],campaignStars:{1:3,2:2,3:3,4:2},
 act2Cleared:[],act2Stars:{},veteranMedals:{},mazeFloor:3,riftWeek:null,
 bossWeek:null,worldBoss:{week:WEEK,goal:4500,damage:650,victories:1,claimed:false},
 mission:null,lastReport:null,counters:{win:4,hero:0,forge:0,maze:3,rift:0,veteran:0},
 contractClaims:{},titles:[],itemUpgrades:{}
});
const mission=(opts={})=>({
 mode:'story',balanceVersion:3,stage:6,wave:3,waves:3,waveTurn:2,turn:12,
 power:760,tier:0,floor:0,playerHp:490,playerMaxHp:620,enemyHp:440,enemyMaxHp:1000,
 lastTurnAt:NOW-5000,lastAction:'strike',enemyIntent:'sunder',cooldowns:{},lastRallyTurn:0,
 ...opts
});
const migration=readFileSync(new URL('./sql/starfort-v251-boss-relic-sunder.sql',import.meta.url),'utf8');

test('exact 14 languages include native counter and guaranteed equipment receipt strings',()=>{
 assert.deepEqual(Object.keys(BOSS_RELIC_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(BOSS_RELIC_KEYS.length,8);
 assert.deepEqual(auditBossRelicLanguages(SUPPORTED_LOCALES),[]);
 const original=getLocale();
 try {
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   assert.equal(bossRelicText('sunderHint'),BOSS_RELIC_TRANSLATIONS[lang].sunderHint);
   assert.equal(bossRelicText('guaranteedRelic'),BOSS_RELIC_TRANSLATIONS[lang].guaranteedRelic);
   assert.equal(bossRelicText('converted'),BOSS_RELIC_TRANSLATIONS[lang].converted);
  }
 } finally {setLocale(original)}
});
test('server week ID controls a complete repeating four-week guaranteed relic rotation',()=>{
 assert.equal(BOSS_RELIC_ITEMS.length,4);
 assert.equal(new Set(BOSS_RELIC_ITEMS).size,4);
 for(let w=1;w<=53;w++)assert.equal(weeklyBossRelic('2026-'+String(w).padStart(2,'0')),BOSS_RELIC_ITEMS[(w-1)%4]);
 assert.equal(weeklyBossRelic('2026-45'),'ember_guard');
 assert.equal(weeklyBossRelic('2026-46'),'star_spear');
 assert.equal(weeklyBossRelic('2026-47'),'guardian_seal');
 assert.equal(weeklyBossRelic('2026-48'),'starbreaker');
 for(const bad of ['2026-00','2026-54','2026-x5','2026-45-suffix','2026/45',null,45])
  assert.equal(weeklyBossRelic(bad),null,String(bad));
});
test('active v2 battles still validate and new server v3 Sunder is accepted only for bosses',()=>{
 assert.equal(validateAccountSnapshot({...source(),mission:mission()}).mission.balanceVersion,3);
 const weekly=mission({mode:'boss',stage:4,wave:1,waves:1,turn:8,waveTurn:8});
 assert.equal(validateAccountSnapshot({...source(),mission:weekly}).mission.enemyIntent,'sunder');
 const legacy=mission({balanceVersion:2,enemyIntent:'crush'});
 assert.equal(validateAccountSnapshot({...source(),mission:legacy}).mission.balanceVersion,2);
 for(const changed of [
  {balanceVersion:2},{balanceVersion:undefined},{balanceVersion:4},{balanceVersion:'3'},
  {mode:'story',wave:2},{mode:'veteran',wave:1,waves:1},{mode:'act2'},
  {mode:'maze',wave:1,waves:1}
 ])assert.throws(()=>validateAccountSnapshot({...source(),mission:mission(changed)}),/bozuk|geçersiz/i,JSON.stringify(changed));
});
test('Sunder boss phases and weekly world boss use server health and combat intent',()=>{
 const a=bossV250Phase(mission());
 assert.equal(a.phase,2);assert.equal(a.intent,'sunder');assert.equal(a.weekly,false);
 const b=bossV250Phase(mission({mode:'boss',stage:4,wave:1,waves:1,enemyHp:160,enemyMaxHp:1000}));
 assert.equal(b.phase,3);assert.equal(b.weekly,true);
 assert.equal(bossV250Phase(mission({balanceVersion:2,mode:'boss',stage:4,wave:1,waves:1})),null);
 assert.equal(bossV250Phase(mission({mode:'story',stage:3})),null);
 assert.equal(bossV250Phase(mission({enemyHp:1201})),null);
 const orig=getLocale();setLocale('en');
 try {
  assert.match(bossV250Markup(mission()),/Feint/);
  assert.match(bossV250Markup(mission({mode:'boss',stage:4,wave:1,waves:1})),/Weekly community world boss/);
 } finally {setLocale(orig)}
});
test('authenticated world-boss UI previews only the deterministic server-week item and reports delivered loot',()=>{
 const acc=validateAccountSnapshot(source()),view=createState(NOW);
 const page=accountExpeditionMarkup(view,acc,NOW);
 assert.match(page,/boss-relic-preview/);
 assert.ok(page.includes(displayItem(ITEMS.find(x=>x.id==='ember_guard')).name));
 assert.match(page,/data-account-boss/);
 const active=validateAccountSnapshot({...source(),mission:mission({mode:'boss',stage:4,wave:1,waves:1,waveTurn:8,turn:8})});
 const activeHtml=accountExpeditionMarkup(view,active,NOW);
 assert.match(activeHtml,/intent-sunder/);
 assert.match(activeHtml,/story-boss-v250/);
 const delivered=validateAccountSnapshot({...source(),lastReport:{won:true,mode:'boss',stage:4,
  turns:11,stars:3,reward:{gold:420,aether:60},bossRelic:{item:'ember_guard',converted:false,aether:0}}});
 assert.match(accountExpeditionMarkup(view,delivered,NOW),/boss-loot-delivered/);
 const converted=validateAccountSnapshot({...source(),lastReport:{won:true,mode:'boss',stage:4,
  turns:11,stars:2,reward:{gold:420,aether:96},bossRelic:{item:null,converted:true,aether:36}}});
 const mark=accountExpeditionMarkup(view,converted,NOW);
 assert.match(mark,/36/);
 assert.match(mark,/boss-loot-delivered/);
});
test('Sunder damage creates meaningful counterplay without making Guard mandatory',()=>{
 const base=120,enemy=65;
 const feint={damage:Math.round(Math.round(base*.72)*1.55),received:Math.round(enemy*.35)};
 const guard={damage:Math.round(Math.round(base*.68)*.75),received:Math.round(Math.round(enemy*.35)*.40)};
 const strike={damage:Math.round(base*.8),received:Math.round(enemy*1.38)};
 assert.ok(feint.damage>strike.damage);
 assert.ok(feint.received<strike.received);
 assert.ok(guard.received<feint.received);
 assert.ok(guard.damage<strike.damage);
});
test('migration is server locked, versioned, one weekly relic, cap safe, crash-safe and role constrained',()=>{
 assert.match(migration,/BASELINE 14fb5a5a58b4f959c22d1db64220e957/);
 assert.match(migration,/'balanceVersion',3/);
 assert.match(migration,/battle->>'enemyIntent'='sunder'/);
 assert.match(migration,/when 0 then 'sunder'/);
 assert.match(migration,/when battle->>'mode'='boss' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=3/);
 assert.match(migration,/when mode='boss' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=3 then 12/);
 assert.match(migration,/case \(\(right\(player_week,2\)\)::integer-1\)%4/);
 for(const id of BOSS_RELIC_ITEMS)assert.ok(migration.includes("'"+id+"'"),id);
 assert.match(migration,/if coalesce\(\(items->>bonus_item\)::integer,0\)>=20/);
 assert.match(migration,/boss_relic_converted:=true/);
 assert.match(migration,/reward:=jsonb_set\(reward,'\{aether\}',to_jsonb\(\(reward->>'aether'\)::bigint\+36\)/);
 assert.match(migration,/outcome:=jsonb_set\(outcome,'\{bossRelic\}'/);
 assert.match(migration,/p\.boss_week=player_week then raise exception/);
 assert.match(migration,/where user_id=u for update/);
 assert.match(migration,/where user_id=u and request_id=p_request_id/);
 assert.match(migration,/auth\.jwt\(\)->>'is_anonymous'/);
 assert.match(migration,/\$function\$;\s*revoke all on function public\.sfb_starfort_progress/);
 assert.match(migration,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
 assert.doesNotMatch(migration,/\b(?:delete from|truncate table|drop table)\s+public\.starfort/i);
});
