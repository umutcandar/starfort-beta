import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {loadAccountSession} from './account-auth.js';
import {accountProgressRequest,accountServerView,validateAccountSnapshot} from './account-progression.js';
import {accountExpeditionMarkup} from './account-expedition.js';
const NOW=Date.UTC(2026,10,2,12);
const source=()=>({
 ok:true,source:'server',serverNow:NOW,revision:2,lastCollected:NOW,lastDailyReward:null,mastery:0,construction:null,
 res:{gold:280,wood:180,stone:150,aether:65},
 buildings:Object.fromEntries(R.BUILDINGS.map(b=>[b.id,1])),
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},loadouts:{},team:['aldren','lyra','rovan'],
 cleared:[],campaignStars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,
 mission:null,lastReport:null,
 counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[]
});
function login(){
 const uid='11111111-1111-4111-8111-111111111111';
 loadAccountSession({getItem:()=>JSON.stringify({access_token:'qa-token',refresh_token:'secret',user:{id:uid},expires_at:Math.floor(Date.now()/1000)+3600})});
 return uid;
}
test('server profile overlays forged local level 20 heroes and legendary gear without mutating the local backup',()=>{
 const state=R.createState(NOW);
 state.heroes.aldren.level=20;state.inventory.starbreaker=20;state.team=['aldren','lyra','rovan'];state.cleared=[1,2,3,4,5,6,7,8];
 const before=JSON.stringify(state),p=validateAccountSnapshot(source()),view=accountServerView(state,p);
 assert.equal(view.heroes.aldren.level,1);
 assert.equal(view.inventory.starbreaker,undefined);
 assert.equal(view.cleared.length,0);
 assert.deepEqual(view.team,['aldren','lyra','rovan']);
 assert.equal(JSON.stringify(state),before);
 view.inventory.iron_sword=9;
 assert.equal(p.inventory.iron_sword,1);
});
test('reject invalid inventory, duplicate gear, ownerless heroes, fake missions and story skips',()=>{
 const f=source();
 const variants=[
 {heroes:{aldren:25,lyra:1,rovan:1}},
 {inventory:{aegis:21}},
 {inventory:{fake_sword:1}},
 {loadouts:{evil:{weapon:'iron_sword'}}},
 {loadouts:{aldren:{weapon:'fake'}}},
 {loadouts:{aldren:{weapon:'iron_sword'},lyra:{weapon:'iron_sword'}}},
 {team:['aldren','aldren','rovan']},
 {team:['aldren','mira','rovan']},
 {cleared:[1,3]},
 {campaignStars:{'5':3}},
 {mazeFloor:30},
 {counters:{win:0,hero:0,forge:0,maze:-1,rift:0,veteran:0}},
 {mission:{mode:'story',stage:1,turn:0,enemyHp:9999999,playerHp:100,lastTurnAt:NOW}}
 ];
 for(const changes of variants)assert.throws(()=>validateAccountSnapshot({...f,...changes}),JSON.stringify(changes));
 const valid={...f,cleared:[1,2],campaignStars:{'1':3},heroes:{...f.heroes,mira:1},
  inventory:{...f.inventory,lunar_charm:1},loadouts:{mira:{relic:'lunar_charm'}},
  team:['aldren','lyra','mira'],mazeFloor:3,
  mission:{mode:'maze',stage:2,turn:3,enemyHp:55,playerHp:170,lastTurnAt:NOW}};
 assert.deepEqual(validateAccountSnapshot(valid).team,['aldren','lyra','mira']);
});
test('authenticated RPC transmits action IDs only, never client levels, damage, rewards or currency',async()=>{
 const uid=login();let received;
 const fetcher=async(url,opts)=>{received={url,opts};return {ok:true,json:async()=>source()}};
 const got=await accountProgressRequest('mission_turn',{target:null,aux:'skill',requestId:'22222222-2222-4222-8222-222222222222',fetcher});
 assert.equal(got.identity,uid);
 assert.match(received.url,/\/rest\/v1\/rpc\/sfb_account_api$/);
 assert.equal(received.opts.headers.Authorization,'Bearer qa-token');
 const args=JSON.parse(received.opts.body);
 assert.deepEqual(Object.keys(args).sort(),['p_action','p_aux','p_request_id','p_target']);
 assert.equal(args.p_action,'mission_turn');assert.equal(args.p_aux,'skill');
 assert.ok(!JSON.stringify(args).includes('damage'));
 await assert.rejects(accountProgressRequest('mission_turn',{aux:'instant-win',fetcher}));
 await assert.rejects(accountProgressRequest('grant-gold',{fetcher}));
 await assert.rejects(accountProgressRequest('hero',{target:'x'.repeat(91),fetcher}));
 await assert.rejects(accountProgressRequest('hero',{fetcher:async()=>{throw Error('offline')}}),/bağlanılamadı/);
});
test('authenticated expedition renders server-only eight chapters, turn controls and unique star rewards',()=>{
 const state=R.createState(NOW);
 const account=validateAccountSnapshot(source());
 const first=accountExpeditionMarkup(state,account,NOW);
 assert.equal((first.match(/data-account-stage=/g)||[]).length,8);
 assert.match(first,/data-account-maze/);assert.match(first,/data-account-rift/);
 assert.match(first,/data-account-contract=/);assert.match(first,/data-account-title=/);
 assert.doesNotMatch(first,/data-stage="1"/);
 assert.doesNotMatch(first,/data-claim-contract=/);
 const mission={mode:'story',stage:1,turn:1,enemyHp:80,enemyMaxHp:155,playerHp:210,playerMaxHp:285,lastTurnAt:NOW,power:290,lastAction:'strike'};
 account.mission=mission;
 const battle=accountExpeditionMarkup(state,account,NOW+4000);
 assert.match(battle,/data-account-turn="strike"/);
 assert.match(battle,/data-account-turn="skill"/);
 assert.match(battle,/data-account-abandon/);
 assert.match(battle,/CANLI SUNUCU MUHAREBESİ/);
 account.mission=null;account.lastReport={won:true,mode:'story',stage:1,stars:3,turns:3,reward:{gold:120}};
 assert.match(accountExpeditionMarkup(state,account,NOW),/SUNUCU ZAFERİ/);
});
test('server migration has a locked canonical ledger, active mission, server-calculated actions and no client-trusted rewards',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v225-account-progression.sql',import.meta.url),'utf8');
 const patch=readFileSync(new URL('./sql/starfort-v225-account-safety-patch.sql',import.meta.url),'utf8');
 assert.match(sql,/alter table public\.starfort_player_progress enable row level security/);
 assert.match(sql,/revoke all on public\.starfort_player_progress from public,anon,authenticated/);
 assert.match(sql,/language plpgsql security definer set search_path=''/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/from public\.starfort_village_ledger/);
 assert.match(sql,/from public\.starfort_player_progress/);
 assert.match(sql,/p_action='mission_turn'/);
 assert.match(sql,/p_action='mission_start'/);
 assert.match(sql,/if ms-last_action<3000/);
 assert.match(sql,/if ehp=0 or php=0 or turns>=14/);
 assert.match(sql,/stage:=p_target::integer/);
 assert.match(sql,/grant execute on function public\.sfb_account_api/);
 assert.match(patch,/gear:=jsonb_set\(gear,array\[hero\],coalesce\(gear->hero/);
 assert.match(patch,/counter_value<=fee/);
 assert.doesNotMatch(sql,/grant\s+update\s+on\s+public\.starfort_player_progress\s+to\s+authenticated/i);
});
test('app routes all account-mode spenders and reward-bearing battles into the unified server account',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('./account-expedition.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(app,/import \{accountProgressRequest,accountServerView\}/);
 assert.match(app,/accountProgressRequest\('get'\)/);
 assert.match(app,/accountProgressAction\('hero'/);
 assert.match(app,/accountProgressAction\('forge'/);
 assert.match(app,/accountProgressAction\('equip'/);
 assert.match(app,/accountProgressAction\('unequip'/);
 assert.match(app,/accountProgressAction\('team'/);
 assert.match(app,/accountProgressAction\('mission_start'/);
 assert.match(app,/accountProgressAction\('mission_turn'/);
 assert.match(app,/accountProgressAction\('contract'/);
 assert.match(app,/accountProgressAction\('title'/);
 assert.match(app,/accountExpeditionMarkup\(villageView\(\),accountProgressSnapshot/);
 assert.match(html,/v2\.25\.0/);
 assert.match(css,/@media\(max-width:510px\)/);
});
