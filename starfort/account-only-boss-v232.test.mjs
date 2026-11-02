import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACCOUNT_ONLY,isLegacyOnlyAction,normalizeOnlineView} from './account-only.js';
import {ACT_TWO_BOSS_PHASES,actTwoBossStatus} from './act-two-boss.js';
import {createState} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
const T=Date.UTC(2026,10,2,12);
const mock=(dataset={},attributes=[])=>({dataset,hasAttribute:x=>attributes.includes(x)});
test('account-only build has no guest start, no guest reward routes and no browser game access',()=>{
 assert.equal(ACCOUNT_ONLY,true);
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(html,/class="account-locked"/);
 assert.match(html,/id="starfort-gate-form"/);
 assert.match(html,/id="account-gate"/);
 assert.doesNotMatch(html,/id="account-welcome"|data-welcome="guest"/);
 assert.match(app,/const accountReady=.*villageSignedIn/);
 assert.match(app,/if\(!accountReady\(\)\)return;/);
 assert.match(app,/if\(ACCOUNT_ONLY&&isLegacyOnlyAction\(button\)\)/);
 assert.doesNotMatch(app,/R\.claimDailyReward\(state/);
 assert.doesNotMatch(app,/addEventListener\('starfort:practice-result'/);
 assert.doesNotMatch(app,/saveGuard\.write\(state\)/);
 assert.doesNotMatch(app,/ensureTestCommander/);
});
test('guest-only operations are blocked; verified server commands are not',()=>{
 for(const x of ['welcome','quickBot','trial','retryStage','cloudAction','recoveryKey','accountTransfer','labyrinthMove','claimContract','seasonTitle','cosmeticInterest'])assert.equal(isLegacyOnlyAction(mock({[x]:'1'})),true,x);
 for(const x of ['data-export-save','data-import-save','data-labyrinth-complete','data-training-open'])assert.equal(isLegacyOnlyAction(mock({},[x])),true,x);
 for(const x of ['accountTurn','realmMission','accountStage','accountContract','upgradeBuilding','forge','equip'])assert.equal(isLegacyOnlyAction(mock({[x]:'1'})),false,x);
 assert.equal(normalizeOnlineView('expedition'),'campaign');
 assert.equal(normalizeOnlineView('labyrinth'),'campaign');
});
test('eight distinctive Act II bosses have complete three-phase terminology',()=>{
 assert.equal(ACT_TWO_BOSS_PHASES.length,8);
 assert.ok(ACT_TWO_BOSS_PHASES.every(x=>x.length===3));
 assert.equal(new Set(ACT_TWO_BOSS_PHASES.flat()).size,24);
});
test('Act II boss phase follows trusted HP ratio, with no fake or legacy phase',()=>{
 const base={mode:'act2',stage:4,turn:15,wave:3,waves:3,enemyHp:100,enemyMaxHp:100};
 assert.equal(actTwoBossStatus(base).phase,1);
 assert.equal(actTwoBossStatus({...base,enemyHp:67}).phase,2);
 assert.equal(actTwoBossStatus({...base,enemyHp:33}).phase,3);
 assert.equal(actTwoBossStatus({...base,enemyHp:34}).phase,2);
 assert.equal(actTwoBossStatus({...base,wave:2}),null);
 assert.equal(actTwoBossStatus({...base,enemyHp:180}),null);
 assert.equal(actTwoBossStatus({...base,mode:'story'}),null);
 assert.equal(actTwoBossStatus({...base,stage:0}),null);
});
test('real authenticated battle markup shows boss phase and tactical counter without local award',()=>{
 const game=createState(T);
 const mission={mode:'act2',stage:4,wave:3,waves:3,turn:17,waveTurn:3,startedAt:T,lastTurnAt:T-4000,playerHp:240,playerMaxHp:500,enemyHp:25,enemyMaxHp:100,enemyIntent:'crush',cooldowns:{},lastAction:'strike'};
 const acc={cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3],act2Stars:{1:2,2:2,3:1},campaignStars:{},mazeFloor:0,mission,
  veteranMedals:{},counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},titles:[],worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0},loadouts:{},inventory:{},team:game.team};
 const html=accountExpeditionMarkup(game,acc,T);
 assert.match(html,/second-act-boss-phase/);
 assert.match(html,/SAFHA 3\/3/);
 assert.match(html,/Diken Kraliçesi/);
 assert.match(html,/Siper komutunu kullan/);
 assert.doesNotMatch(html,/SUNUCU ZAFERİ/);
});
test('boss phases and final victory only exist in server-controlled SQL',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v232-boss-phases.sql',import.meta.url),'utf8');
 assert.match(sql,/if battle->>'mode'='act2' and coalesce\(\(battle->>'wave'\)::integer,1\)=3 then/);
 assert.match(sql,/edmg\*1\.27/);
 assert.match(sql,/case when turns%3=0 then 'drain' else 'crush' end/);
 assert.match(sql,/case when turns%3=0 then 'shield' else 'drain' end/);
 assert.match(sql,/if ehp=0 or php=0/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/from public\.starfort_village_requests/);
});
