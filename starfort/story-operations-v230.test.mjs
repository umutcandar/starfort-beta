import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_OPERATIONS,operationStatus} from './story-operations.js';
import {createState} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {officialBattleDelta,officialBattleRoom} from './official-battle-bridge.js';
test('24 independent objectives exist, 3 per canonical chapter',()=>{
 assert.equal(Object.keys(STORY_OPERATIONS).length,8);
 const all=Object.values(STORY_OPERATIONS).flat();
 assert.equal(all.length,24);
 assert.equal(new Set(all.map(x=>x.title)).size,24);
 assert.ok(all.every(x=>x.objective.length>25));
});
test('new story mission recognizes 3 waves, legacy story mission remains 1',()=>{
 assert.equal(operationStatus({mode:'story',stage:4,wave:2,waves:3}).title,STORY_OPERATIONS[4][1].title);
 assert.equal(operationStatus({mode:'story',stage:4}).total,1);
 assert.equal(operationStatus({mode:'veteran',stage:4}),null);
 assert.equal(operationStatus({mode:'story',stage:99}),null);
});
test('verified campaign UI shows 3 objectives without granting rewards on a wave',()=>{
 const game=createState();const account={cleared:[],campaignStars:{},inventory:{iron_sword:1},loadouts:{},counters:{},mazeFloor:0,team:game.team,worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0},titles:[],veteranMedals:{},mission:{mode:'story',stage:1,wave:2,waves:3,turn:4,lastTurnAt:0,startedAt:10,power:250,playerHp:260,playerMaxHp:300,enemyHp:120,enemyMaxHp:120,enemyIntent:'crush',cooldowns:{}}};
 const html=accountExpeditionMarkup(game,account,Date.now());
 assert.match(html,/8 Bölge · 24 Hikâye Görevi/);
 assert.match(html,/GÖREV 2 \/ 3/);
 assert.match(html,/Erzak Yolu/);
 assert.match(html,/Kül Kumandanı/);
 assert.equal((html.match(/class="story-operation-list"/g)||[]).length,8);
 assert.doesNotMatch(html,/SUNUCU ZAFERİ/);
});
test('wave boundary damage is nonnegative and server-owned battle identity persists',()=>{
 const start={mode:'story',stage:1,wave:1,waves:3,turn:2,startedAt:123,lastTurnAt:10000,enemyHp:40,enemyMaxHp:124,playerHp:180,playerMaxHp:300,lastAction:'strike'};
 const next={...start,wave:2,turn:3,enemyHp:155,enemyMaxHp:155,lastTurnAt:13000};
 assert.equal(officialBattleDelta(start,next).damage,40);
 assert.equal(officialBattleDelta(start,next).waveAdvanced,true);
 assert.equal(officialBattleRoom(['aldren','lyra','rovan'],start).id,officialBattleRoom(['aldren','lyra','rovan'],next).id);
});
