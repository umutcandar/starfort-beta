import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SECOND_ACT,secondActReadiness,secondActMission} from './second-act.js';
import {operationStatus} from './story-operations.js';
import {createState,BUILDINGS} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {validateAccountSnapshot} from './account-progression.js';
import {officialBattleOutcome,officialMissionIdentity} from './official-battle-bridge.js';
const T=Date.UTC(2026,10,2,10);
const base=()=>({ok:true,source:'server',serverNow:T,res:{gold:250,wood:150,stone:100,aether:40},buildings:Object.fromEntries(BUILDINGS.map(x=>[x.id,1])),
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1},loadouts:{},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6,7,8],campaignStars:{},act2Cleared:[],act2Stars:{},
 veteranMedals:{},mazeFloor:0,mission:null,lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[],itemUpgrades:{},bossWeek:null,worldBoss:null});
test('Act II adds eight named regions and twenty-four separate objectives',()=>{
 assert.equal(SECOND_ACT.length,8);
 assert.equal(new Set(SECOND_ACT.map(s=>s.name)).size,8);
 assert.equal(new Set(SECOND_ACT.flatMap(s=>s.operations.map(o=>o.name))).size,24);
 assert.ok(SECOND_ACT.every(s=>s.operations.length===3&&s.boss&&s.lore&&s.recommendedPower>900));
});
test('only eight original regions open Act II, then progress is sequential and strength gated',()=>{
 const p=base();
 assert.equal(secondActReadiness({...p,cleared:[]},10000,1).ok,false);
 assert.equal(secondActReadiness(p,900,1).ok,true);
 assert.equal(secondActReadiness(p,10000,2).ok,false);
 p.act2Cleared=[1];
 assert.equal(secondActReadiness(p,10000,2).ok,true);
 assert.equal(secondActReadiness(p,10000,4).ok,false);
 assert.equal(secondActReadiness(p,500,2).ok,false);
});
test('second act stores independently validated stars and rejects forged progress',()=>{
 const p=base();p.act2Cleared=[1,2];p.act2Stars={1:3,2:1};
 assert.deepEqual(validateAccountSnapshot(p).act2Cleared,[1,2]);
 assert.throws(()=>validateAccountSnapshot({...p,act2Cleared:[1,3]}));
 assert.throws(()=>validateAccountSnapshot({...p,act2Stars:{3:3}}));
 assert.throws(()=>validateAccountSnapshot({...p,act2Stars:{1:4}}));
});
test('Act II mission 3-wave checkpoint is verified, identifiable and server-owned',()=>{
 const p=base(),m={mode:'act2',stage:1,waves:3,wave:2,waveTurn:5,turn:14,startedAt:T,lastTurnAt:T,enemyHp:160,enemyMaxHp:300,playerHp:600,playerMaxHp:700,enemyIntent:'drain',cooldowns:{rovan:16}};
 assert.equal(validateAccountSnapshot({...p,mission:m}).mission.wave,2);
 assert.equal(secondActMission(m).stage.name,SECOND_ACT[0].name);
 assert.equal(operationStatus(m).title,SECOND_ACT[0].operations[1].name);
 assert.equal(officialMissionIdentity(m),officialMissionIdentity({...m,wave:3,turn:17}));
 assert.equal(officialBattleOutcome(m,{won:true,stage:1,stars:2,reward:{gold:100}}).source,'server');
});
test('Act II has eight selectable missions and does not forge victory from display markup',()=>{
 const game=createState(T),account=validateAccountSnapshot(base());
 const html=accountExpeditionMarkup(game,account,T);
 assert.match(html,/Şafağın Ötesi/);
 assert.equal((html.match(/data-realm-mission="act2:\d"/g)||[]).length,8);
 assert.match(html,/Kızıl Ufuk/);assert.match(html,/Şafak Uçurumu/);
 assert.doesNotMatch(html,/SUNUCU ZAFERİ/);
});
test('authoritative DB script checks Act II order and does not reward intermediate waves',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v231-second-act.sql',import.meta.url),'utf8');
 assert.match(sql,/act2_cleared jsonb not null/);
 assert.match(sql,/if stage>jsonb_array_length\(act2\)\+1/);
 assert.match(sql,/if not \(act2 @> to_jsonb\(array\[stage\]\)\)/);
 assert.match(sql,/if ehp=0 or php=0/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/from public\.starfort_village_requests/);
 assert.match(sql,/revoke all on function public\.sfb_starfort_progress/);
});
