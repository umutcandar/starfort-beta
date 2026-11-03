import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAccountSnapshot,accountProgressRequest} from './account-progression.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {createState} from './rules.js';
import {simulateActTwoBattle,recommendedActTwoPower} from './act-two-balance.js';
import {bossV250Phase} from './story-boss-v250.js';

const sql=readFileSync(new URL('./sql/starfort-v254-four-player-battle-fixes.sql',import.meta.url),'utf8');
const client=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
const agents=readFileSync(new URL('./scripts/four-player-agents.mjs',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/four-player-agents.yml',import.meta.url),'utf8');
const NOW=Date.UTC(2026,10,3,20);
const active=(extra={})=>({mode:'act2',balanceVersion:5,stage:8,wave:3,waves:3,waveTurn:9,turn:21,
 tier:0,floor:0,power:1800,playerHp:450,playerMaxHp:500,enemyHp:200,enemyMaxHp:900,
 enemyIntent:'eclipse',lastAction:'guard',lastTurnAt:NOW-9000,lastRallyTurn:0,cooldowns:{},...extra});
const snapshot=battle=>({ok:true,source:'server',serverNow:NOW,revision:10,
 heroes:{aldren:16,lyra:16,rovan:16},inventory:{iron_sword:1,ward_mail:1},loadouts:{},
 team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6,7,8],campaignStars:{'1':3,'2':2},
 act2Cleared:[1,2,3,4,5,6,7],act2Stars:{'1':3,'2':2},
 veteranMedals:{},mazeFloor:7,riftWeek:null,bossWeek:null,
 worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0,claimed:false},
 mission:battle,lastReport:null,counters:{win:35,hero:0,forge:0,maze:7,rift:0,veteran:0},
 contractClaims:{},titles:[],itemUpgrades:{},relicAscensions:{},bossSeals:0});

test('all four player agents have independent Chromium runners with artifact evidence',()=>{
 for(const role of ['rookie','tactician','veteran','breaker']){
  assert.ok(workflow.includes(role),'missing independent runner '+role);
  assert.match(agents,new RegExp("role==='"+role+"'"));
 }
 assert.match(workflow,/matrix:[\s\S]*player: \[rookie, tactician, veteran, breaker\]/);
 assert.match(workflow,/scripts\/four-player-agents\.mjs/);
 assert.match(workflow,/actions\/upload-artifact@v4/);
 assert.match(agents,/synthetic-account-network\.cjs/);
 assert.match(agents,/simulateActTwoBattle/);
 assert.match(agents,/Page\.captureScreenshot/);
 assert.doesNotMatch(agents,/production\.supabase\.co|service_role/);
});
test('new v5 missions are validated; old v1-v4 saves remain admissible',()=>{
 const r=validateAccountSnapshot(snapshot(active()));
 assert.equal(r.mission.balanceVersion,5);
 assert.equal(r.mission.enemyIntent,'eclipse');
 assert.equal(validateAccountSnapshot(snapshot(active({balanceVersion:4}))).mission.balanceVersion,4);
 assert.equal(validateAccountSnapshot(snapshot(active({balanceVersion:3,enemyIntent:'crush'}))).mission.balanceVersion,3);
 assert.equal(validateAccountSnapshot(snapshot(active({balanceVersion:2,enemyIntent:'shield'}))).mission.balanceVersion,2);
 assert.equal(validateAccountSnapshot(snapshot(active({balanceVersion:1,enemyIntent:'strike'}))).mission.balanceVersion,1);
 assert.throws(()=>validateAccountSnapshot(snapshot(active({balanceVersion:7}))),/sürümü/);
 assert.throws(()=>validateAccountSnapshot(snapshot(active({balanceVersion:3}))),/bozuk/);
 assert.equal(bossV250Phase(active({mode:'story',stage:7})).phase,3);
 assert.equal(bossV250Phase(active({mode:'boss',stage:4,wave:1,waves:1})).weekly,true);
});
test('Act II new v5 time target is correctly shown as 3★ in the actual expedition UI',()=>{
 const state=createState(NOW);
 const v5=accountExpeditionMarkup(state,validateAccountSnapshot(snapshot(active())),NOW);
 const legacy=accountExpeditionMarkup(state,validateAccountSnapshot(snapshot(active({balanceVersion:4}))),NOW);
 assert.match(v5,/3★/);
 assert.match(legacy,/2★/);
 assert.ok(v5.includes('data-account-turn="skill:aldren"'));
 assert.ok(v5.includes('data-account-turn="skill:lyra"'));
 assert.ok(v5.includes('data-account-turn="skill:rovan"'));
 assert.doesNotMatch(v5,/data-account-turn="skill"/,'generic skill has no cooldown and must be removed');
 assert.match(client,/mission\?\.balanceVersion>=5&&mission\?\.mode==='act2'&&mission\?\.waves===3\?24/);
});
test('generic skill requests are rejected locally before network or token discovery',async()=>{
 await assert.rejects(
  ()=>accountProgressRequest('mission_turn',{aux:'skill',fetcher:()=>{throw Error('Network touched')} }),
  /Geçersiz savaş hamlesi/,
 );
 assert.match(sql,/if p_aux not in \('strike','guard','feint','rally'\) and/);
 assert.match(sql,/p_aux !~ '\^skill:\(aldren\|lyra\|rovan\|mira\|doran\|vesper\|eira\)\$'/);
 assert.doesNotMatch(sql,/when 'skill' then 1\.3/);
 assert.match(sql,/if ability like 'skill:%' then/);
 assert.match(sql,/if coalesce\(\(battle->'cooldowns'->>hero\)::integer,0\)>turns then/);
 assert.match(sql,/array\['cooldowns',hero\],to_jsonb\(turns\+3\)/);
});
test('24-turn target turns tactical skill into a meaningful star advantage',()=>{
 let improved=0,legacyThree=0,newThree=0,spamThree=0;
 for(let stage=1;stage<=8;stage++){
  for(const ratio of [.75,1,1.25]){
   const power=Math.round(recommendedActTwoPower(stage)*ratio);
   const old=simulateActTwoBattle({stage,power,policy:'tactical',threeStarTurnLimit:18});
   const current=simulateActTwoBattle({stage,power,policy:'tactical',threeStarTurnLimit:24});
   const spam=simulateActTwoBattle({stage,power,policy:'strike',threeStarTurnLimit:24});
   assert.equal(old.won,current.won);
   assert.equal(old.turns,current.turns);
   assert.equal(old.playerHp,current.playerHp);
   if(current.stars>old.stars)improved++;
   if(old.stars===3)legacyThree++;
   if(current.stars===3)newThree++;
   if(spam.stars===3)spamThree++;
  }
 }
 assert.equal(legacyThree,0,'legacy model reproduced the 3-star blocker');
 assert.ok(improved>=15,'new target must reward tactical play in most power groups');
 assert.ok(newThree>=18,'tactical 3-star must be reasonably accessible');
 assert.ok(newThree>spamThree,'tactics must outperform strike spam');
 assert.equal(simulateActTwoBattle({stage:8,power:2200,policy:'tactical',threeStarTurnLimit:24}).stars,3);
 assert.throws(()=>simulateActTwoBattle({stage:8,power:2000,threeStarTurnLimit:0}),/rating threshold/);
});
test('production patch is versioned, idempotent, owner locked and does not inflate rewards',()=>{
 assert.match(sql,/PRODUCTION BASELINE MD5 c70257da3b29c677c39749c1659f94c5/);
 assert.match(sql,/'balanceVersion',5/);
 assert.match(sql,/when mode='act2' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=5\s+and coalesce\(\(battle->>'waves'\)::integer,1\)>1 then 24/);
 assert.match(sql,/when mode in \('story','act2'\) and coalesce\(\(battle->>'waves'\)::integer,1\)>1 then 18/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/auth\.jwt\(\)->>'is_anonymous'/);
 assert.match(sql,/\$function\$;\s*revoke all on function public\.sfb_starfort_progress/);
 assert.match(sql,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
 assert.doesNotMatch(sql,/\b(?:drop table|truncate table|delete from)\s+public\.starfort/i);
});
