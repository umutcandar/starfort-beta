import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shadowBossArtwork,shadowBossPhase,shadowLootSummary} from './shadow-boss-art-v239.js';
import {shadowVictoryMarkup} from './shadow-rewards-v239.js';
import {shadowFrontierMarkup,validateShadowSnapshot,SHADOW_STAGES} from './shadow-frontier-v238.js';
const blank=()=>({ok:true,source:'server-shadow',heroPaths:{},cleared:[],stars:{},battle:null,lastReport:null,revision:1});
const fixture=()=>({heroes:{aldren:10,lyra:10,rovan:10},team:['aldren','lyra','rovan'],mission:null,
 cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6,7,8]});
const battle=()=>({mode:'shadow',stage:1,wave:3,waves:3,turn:6,waveTurn:2,power:900,playerHp:600,playerMaxHp:700,
 enemyHp:150,enemyMaxHp:500,enemyIntent:'shield',attackRanks:3,wardRanks:2,lastTurnAt:Date.now()-5000,lastRallyTurn:0,cooldowns:{}});
test('four hand-authored boss silhouette families are distinct and self-contained with no external references',()=>{
 const vector=SHADOW_STAGES.map(x=>shadowBossArtwork(x.id,{variant:'card'}));
 for(const [i,svg] of vector.entries()){
  assert.match(svg,/^<svg /);
  assert.match(svg,/<defs>/);
  assert.match(svg,/viewBox="0 0 420 300"/);
  assert.match(svg,/role="img"/);
  assert.match(svg,/<g class="shadow-boss-figure"/);
  assert.match(svg,/class="boss-eyes"/);
  assert.match(svg,/fill="url\(#sfb-v239-/);
  assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"',''),/(?:https?:\/\/|<script|<foreignObject|<image|onload=|eval\()/i);
  for(const [j,b] of vector.entries())if(i!==j)assert.notEqual(svg,b);
 }
 assert.notEqual(shadowBossArtwork(1,{variant:'card'}),shadowBossArtwork(1,{variant:'battle'}));
 assert.doesNotMatch(shadowBossArtwork(2,{intent:'<script>alert(1)</script>'}),/<script>|alert\(1\)/);
 assert.match(shadowBossArtwork(-100),/Diken Nöbetçisi/);
 assert.match(shadowBossArtwork(100),/Tutulma Hükümdarı/);
});
test('boss phases use server wave and remaining life, with Eclipse enragement at verifiable thresholds',()=>{
 const normal=shadowBossPhase(1,1,100,200);
 const guarded=shadowBossPhase(1,3,100,200);
 const siren=shadowBossPhase(2,3,100,200);
 assert.notEqual(normal.title,guarded.title);
 assert.match(guarded.hint,/Aldat/);
 assert.match(siren.hint,/Can emmesine/);
 const eclipse=shadowBossPhase(4,3,100,200);
 const enraged=shadowBossPhase(4,3,34,100);
 assert.equal(eclipse.id,'eclipse-rise');
 assert.equal(enraged.id,'eclipse-rage');
 assert.equal(enraged.danger,'high');
 assert.equal(shadowBossPhase(4,2,10,100).danger,'low');
});
test('victory ledger shows only real allowed numeric rewards, earned item and verified stars',()=>{
 const report={won:true,stage:1,stars:3,turns:11,at:1720000000000,item:'grave_seal',
  reward:{gold:420,wood:200,stone:210,aether:60,admin:99999999,stone_bonus:'HACK'}};
 assert.deepEqual(shadowLootSummary(report),[
  {id:'gold',value:420},{id:'wood',value:200},{id:'stone',value:210},{id:'aether',value:60}]);
 const html=shadowVictoryMarkup(report,SHADOW_STAGES);
 assert.match(html,/role="status"/);
 assert.match(html,/Gölge Sınırı Zaferi/);
 assert.match(html,/★★★/);
 assert.match(html,/data-resource="gold"/);
 assert.match(html,/data-loot-id="grave_seal"/);
 assert.match(html,/Mahzen Ruh Mührü/);
 assert.match(html,/data-shadow-open-armory/);
 assert.match(html,/data-shadow-dismiss-result/);
 assert.doesNotMatch(html,/stone_bonus|HACK/);
 const repeat=shadowVictoryMarkup({...report,item:null,reward:{gold:160,wood:76,stone:80,aether:23}},SHADOW_STAGES);
 assert.doesNotMatch(repeat,/data-loot-id=/);
 assert.match(repeat,/ilk-zafer ekipmanı verilmedi/);
 const loss=shadowVictoryMarkup({won:false,abandoned:true,at:1720000000001},SHADOW_STAGES);
 assert.doesNotMatch(loss,/shadow-reward-ledger|shadow-rare-loot/);
 assert.match(loss,/Seferden Çekildin/);
 assert.equal(shadowVictoryMarkup(null,SHADOW_STAGES),'');
});
test('real battle markup includes boss illustration, correct phase, intent and high-contrast wave progress',()=>{
 const d=validateShadowSnapshot({...blank(),battle:battle()});
 const html=shadowFrontierMarkup(d,fixture(),Date.now());
 assert.match(html,/data-boss-region="1"/);
 assert.match(html,/data-boss-wave="3"/);
 assert.match(html,/data-boss-intent="shield"/);
 assert.match(html,/Yaşayan Surlar/);
 assert.match(html,/art-thorns/);
 assert.match(html,/boss-wave-indicator/);
 assert.match(html,/shadow-progress-ribbon/);
 assert.match(html,/id="shadow-frontier"/);
 assert.equal((html.match(/class="shadow-stage-symbol"/g)||[]).length,4);
 const won={won:true,stage:1,stars:3,turns:11,at:1720000000000,item:'grave_seal',
  reward:{gold:420,wood:200,stone:210,aether:60}};
 const result=validateShadowSnapshot({...blank(),cleared:[1],stars:{'1':3},lastReport:won});
 const displayed=shadowFrontierMarkup(result,fixture(),Date.now());
 assert.match(displayed,/shadow-reward-ledger/);
 const dismissed=shadowFrontierMarkup(result,fixture(),Date.now(),false,{hiddenReportAt:won.at});
 assert.doesNotMatch(dismissed,/shadow-result-layout/);
 assert.match(dismissed,/shadow-stage-grid/);
});
test('motion accessibility, mobile responsive loot and header jump controls shipped',()=>{
 const css=readFileSync(new URL('./shadow-boss-v239.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:no-preference\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/\.shadow-result-layout/);
 assert.match(css,/\.shadow-stage-symbol/);
 assert.match(css,/\.shadow-boss-art/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/data-shadow-open-armory/);
 assert.match(app,/data-shadow-dismiss-result/);
 assert.match(app,/data-shadow-jump/);
 const exp=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 assert.match(exp,/shadowHiddenAt/);
 assert.match(exp,/data-shadow-jump/);
});
