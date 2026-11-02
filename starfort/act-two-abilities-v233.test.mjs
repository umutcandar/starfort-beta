import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SECOND_ACT} from './second-act.js';
import {ACT_TWO_ABILITIES,actTwoBossAbility} from './act-two-abilities.js';
import {actTwoBossStatus} from './act-two-boss.js';
import {recommendedActTwoPower,requiredActTwoPower,actTwoEnemyMaxHp,simulateActTwoBattle} from './act-two-balance.js';
import {createState} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
const t=Date.UTC(2026,10,2,18);
const sql=readFileSync(new URL('./sql/starfort-v233-eight-boss-abilities.sql',import.meta.url),'utf8');
test('each of eight new bosses has a distinct, documented skill with a visible tactical counter',()=>{
 assert.equal(SECOND_ACT.length,8);assert.equal(ACT_TWO_ABILITIES.length,8);
 assert.equal(new Set(ACT_TWO_ABILITIES.map(x=>x.id)).size,8);
 assert.equal(new Set(ACT_TWO_ABILITIES.map(x=>x.name)).size,8);
 assert.ok(ACT_TWO_ABILITIES.every((x,i)=>x.stage===i+1&&x.trigger&&['guard','skill'].includes(x.counter)&&x.hint.length>30));
 for(let stage=1;stage<=8;stage++){
  const skill=ACT_TWO_ABILITIES[stage-1];
  const active=actTwoBossAbility({mode:'act2',stage,wave:3,waves:3,enemyIntent:skill.trigger});
  assert.equal(active.active,true);assert.equal(active.id,skill.id);
  assert.equal(actTwoBossAbility({mode:'act2',stage,wave:2,waves:3,enemyIntent:skill.trigger}),null);
  const phase=actTwoBossStatus({mode:'act2',stage,wave:3,waves:3,enemyIntent:skill.trigger,enemyMaxHp:300,enemyHp:70});
  assert.equal(phase.phase,3);assert.equal(phase.ability.id,skill.id);
 }
});
test('all eight server effects are backed by stage-specific SQL branches and final wave only',()=>{
 for(let stage=1;stage<=8;stage++)assert.match(sql,new RegExp('when '+stage+' then\\s*if battle->>\\\'enemyIntent\\\''),'stage '+stage);
 assert.match(sql,/if battle->>'mode'='act2' and \(battle->>'wave'\)::integer=3/);
 assert.match(sql,/p_action='mission_turn'/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/if ehp=0 or php=0/);
 assert.match(sql,/revoke all on function public\.sfb_starfort_progress/);
});
test('HP scaling has a hard cap: larger invested power never makes enemies endlessly stronger',()=>{
 for(let stage=1;stage<=8;stage++){
  const cap=recommendedActTwoPower(stage)*1.25;
  for(let wave=1;wave<=3;wave++){
   assert.equal(actTwoEnemyMaxHp(stage,wave,cap),actTwoEnemyMaxHp(stage,wave,cap*4));
   assert.ok(actTwoEnemyMaxHp(stage,wave,cap/2)<actTwoEnemyMaxHp(stage,wave,cap*4));
  }
 }
 assert.equal((sql.match(/least\(power,\(1000\+stage\*150\)\*1\.25\)/g)||[]).length,2);
});
test('36-turn modeled campaigns are survivable at power gate and reward mastery at strong investment',()=>{
 for(let stage=1;stage<=8;stage++){
  const threshold=requiredActTwoPower(stage);
  const gate=simulateActTwoBattle({stage,power:threshold});
  const trained=simulateActTwoBattle({stage,power:recommendedActTwoPower(stage)*2.25});
  assert.ok(gate.won,'gate team should have a tactical winning line in region '+stage+' '+JSON.stringify(gate));
  assert.ok(gate.turns>=9,'three waves should not end in a few trivial moves: '+stage);
  assert.ok(trained.won&&trained.stars===3,'3 star victory must be achievable via investment region '+stage+' '+JSON.stringify(trained));
  assert.ok(trained.turns<gate.turns,'training must reduce time to victory region '+stage);
  assert.ok(gate.history.every(e=>e.turn<=36));
 }
});
test('blind basic attacks perform worse than planned guards and skills',()=>{
 let demonstrable=0;
 for(let stage=1;stage<=8;stage++){
  const power=requiredActTwoPower(stage);
  const smart=simulateActTwoBattle({stage,power,policy:'tactical'});
  const blind=simulateActTwoBattle({stage,power,policy:'blind'});
  if(smart.playerHp>blind.playerHp||smart.won&&!blind.won)demonstrable++;
 }
 assert.ok(demonstrable>=6,'Tactical choice should matter across most bosses');
});
test('the live battle UI highlights the active region-specific boss ability',()=>{
 const game=createState(t);
 const mission={mode:'act2',stage:7,wave:3,waves:3,turn:14,waveTurn:3,startedAt:t,lastTurnAt:t-6000,playerHp:620,playerMaxHp:1000,enemyHp:150,enemyMaxHp:600,enemyIntent:'crush',cooldowns:{},lastAction:'strike'};
 const account={cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6],act2Stars:{1:2},campaignStars:{},mazeFloor:0,mission,veteranMedals:{},
  counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},titles:[],worldBoss:null,loadouts:{},inventory:{},team:game.team};
 const html=accountExpeditionMarkup(game,account,t);
 assert.match(html,/Zincir Yıldırım/);assert.match(html,/act-two-special active/);
 assert.match(html,/Siper seç/);
 assert.match(html,/SAFHA 3\/3/);
});
