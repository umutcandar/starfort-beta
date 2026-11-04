import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {firstMinuteGuide} from './first-minutes-v255.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.UTC(2026,10,4,18);
const game=createState(now);
const account={...game,heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},
 team:['aldren','lyra','rovan'],loadouts:{},cleared:[],campaignStars:{},veteranMedals:{},
 mazeFloor:0,riftWeek:null,mission:null,lastReport:null,contractClaims:{},titles:[],itemUpgrades:{},
 counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},worldBoss:null};
const mission={mode:'story',stage:1,wave:1,waves:3,turn:2,startedAt:now-30_000,lastTurnAt:now-3300,
 power:300,playerHp:220,playerMaxHp:300,enemyHp:90,enemyMaxHp:130,enemyIntent:'strike',
 lastAction:'strike',cooldowns:{},lastRallyTurn:0,balanceVersion:6};
test('no obscuring guide or campaign stats above the battle on mobile',()=>{
 const snapshot={...account,mission};
 const html=accountExpeditionMarkup(game,snapshot,now);
 assert.match(html,/class="server-expedition in-battle"/);
 assert.ok(html.indexOf('class="server-mission"') < html.indexOf('class="sf-bot-entry"'));
 assert.ok(html.indexOf('class="server-mission"')>=0);
 assert.doesNotMatch(html,/class="server-progress-header"/);
 assert.doesNotMatch(html,/class="server-summary"/);
 assert.doesNotMatch(html,/class="official-next-goal"/);
 assert.match(html,/official-war-room/);
 assert.match(html,/official-combat-scene/);
 const app=source('./app.js');
 assert.match(app,/accountProgressSnapshot\?\.mission\|\|victoryVisible\?'':firstMinuteGuide\(accountProgressSnapshot\)/);
});
test('onboarding remains available before the FIRST battle only',()=>{
 assert.match(firstMinuteGuide(account),/sf-first-guide/);
 const html=accountExpeditionMarkup(game,account,now);
 assert.match(html,/class="server-progress-header"/);
 assert.match(html,/class="server-summary"/);
 assert.match(html,/class="official-next-goal"/);
 assert.match(html,/class="server-expedition "/);
});
test('victory overlay does not compete with the next-goal panel or a fading transparent backdrop',()=>{
 const after={...account,mission:null,cleared:[1],campaignStars:{1:3},counters:{...account.counters,win:1},
 lastReport:{won:true,mode:'story',stage:1,turns:5,stars:3,reward:{gold:120}}};
 const html=accountExpeditionMarkup(game,after,now,null,null,null,null,null,{},true);
 assert.match(html,/server-mission-result win celebration/);
 assert.doesNotMatch(html,/class="official-next-goal"/);
 const regular=accountExpeditionMarkup(game,after,now);
 assert.match(regular,/class="official-next-goal"/);
 const css=source('./account-expedition.css');
 assert.match(css,/@keyframes sf-victory-arrive\{from\{opacity:1;/);
 assert.match(css,/\.workspace:has\(\.server-expedition\.in-battle\)/);
 assert.match(css,/@media\(max-width:760px\)/);
});
