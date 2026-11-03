import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,getLocale,setLocale} from './locale-v243.js';
import {FIRST_MINUTE_KEYS,FIRST_MINUTE_TRANSLATIONS,fm,firstMinuteGuide,labeledBattleAction,bagAction,auditFirstMinuteLanguages,auditCombatLanguages} from './first-minutes-v255.js';
import {createState} from './rules.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
import {premiumStoreMarkup} from './premium-store.js';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const app=read('./app.js'),guild=read('./guild-client.js'),arena=read('./arena-view.js'),css=read('./account-expedition.css');
const sql=read('./sql/starfort-v255-first-minute-combat.sql');
const TODAY=Date.UTC(2026,10,3,20);
const snapshot=()=>({
 source:'server',ok:true,revision:4,serverNow:TODAY,
 res:{gold:500,wood:400,stone:300,aether:200},
 buildings:{keep:1,farm:1,lumber:1,quarry:1,forge:1,tavern:1,observatory:1},
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},
 loadouts:{},team:['aldren','lyra','rovan'],cleared:[],campaignStars:{},
 act2Cleared:[],act2Stars:{},mazeFloor:0,veteranMedals:{},riftWeek:null,bossWeek:null,
 worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0,claimed:false},
 counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[],
 itemUpgrades:{},relicAscensions:{},bossSeals:0,mission:null,lastReport:null
});
test('complete native first-minute guide, victory and combat text in all 14 supported languages',()=>{
 assert.deepEqual(Object.keys(FIRST_MINUTE_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditFirstMinuteLanguages(SUPPORTED_LOCALES),[]);
 assert.deepEqual(auditCombatLanguages(SUPPORTED_LOCALES),[]);
 assert.equal(new Set(FIRST_MINUTE_KEYS).size,FIRST_MINUTE_KEYS.length);
 const previous=getLocale();
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   for(const key of FIRST_MINUTE_KEYS)assert.ok(fm(key).trim(),lang+' '+key);
   assert.ok(firstMinuteGuide(snapshot()).includes(fm('step1')),lang);
   assert.ok(firstMinuteGuide(snapshot()).includes(fm('step2')),lang);
   assert.ok(firstMinuteGuide(snapshot()).includes(fm('step3')),lang);
   for(const action of ['strike','guard','feint','rally','skill:lyra','skill'])
    assert.notEqual(labeledBattleAction(action),action,lang+':'+action);
   assert.notEqual(bagAction(),'');
   assert.ok(labeledBattleAction('Dalga 2 başladı').includes('2'));
  }
 }finally{setLocale(previous)}
});
test('guide directs a new player to the first server fight and disappears after earned win',()=>{
 const state=snapshot();
 assert.match(firstMinuteGuide(state),/<details class="sf-first-guide" open>/);
 assert.match(firstMinuteGuide(state),/data-guide-first-stage/);
 assert.doesNotMatch(firstMinuteGuide(state),/data-local|data-guest/);
 assert.equal(firstMinuteGuide({...state,counters:{...state.counters,win:1}}),'');
 assert.equal(firstMinuteGuide({...state,cleared:[1]}),'');
});
test('official battle displays translated server action history rather than raw English IDs',()=>{
 const state=snapshot();
 state.mission={mode:'story',balanceVersion:6,stage:1,wave:2,waves:3,turn:4,waveTurn:2,
  tier:0,floor:0,power:267,playerHp:220,playerMaxHp:290,enemyHp:90,enemyMaxHp:150,
  enemyIntent:'shield',lastAction:'skill:lyra',lastRallyTurn:0,lastTurnAt:TODAY-10000,cooldowns:{}};
 const html=accountExpeditionMarkup(createState(TODAY),state,TODAY);
 assert.match(html,/data-account-turn="skill:lyra"/);
 assert.doesNotMatch(html,/Son hamle<\/[^>]*>:\s*skill:lyra/);
 assert.match(html,/Kahraman yeteneği/);
 assert.match(html,/data-real-bot-practice/);
 assert.ok(html.indexOf('server-mission')<html.indexOf('long-road'),'combat must be encountered before grind lists');
});
test('victory opens a centered result, real server rewards and actionable next chapter',()=>{
 const state=snapshot();
 state.cleared=[1];state.campaignStars={'1':3};state.counters.win=1;
 state.lastReport={won:true,mode:'story',stage:1,stars:3,turns:10,
  reward:{gold:120,wood:60,stone:35,aether:12}};
 const rendered=accountExpeditionMarkup(createState(TODAY),state,TODAY,null,null,null,null,null,{},true);
 assert.match(rendered,/server-mission-result win celebration/);
 assert.match(rendered,/aria-modal="true"/);
 assert.match(rendered,/data-result-next="2"/);
 assert.match(rendered,/data-result-dismiss/);
 assert.match(rendered,/data-view="armory"/);
 assert.match(rendered,/Kazanılan ödüller/);
 assert.match(rendered,/120<\/strong> Altın/);
 assert.match(rendered,/★★★/);
 const plain=accountExpeditionMarkup(createState(TODAY),state,TODAY);
 assert.doesNotMatch(plain,/aria-modal="true"/);
});
test('post-login creates village automatically with bounded retries, no fake success',()=>{
 assert.match(app,/async function refreshVillageOnSignIn/);
 assert.match(app,/for\(const delay of \[0,350,950,1800\]\)/);
 assert.match(app,/await refreshVillageOnSignIn\(\)/);
 assert.match(app,/if\(ready&&accountReady\(\)\)/);
 assert.match(app,/if\(!silent\)notify/);
 assert.match(app,/let victoryVisible=false/);
 assert.match(app,/setTimeout\(\(\)=>\{el\.classList\.remove\('show'\);el\.textContent='';\},2800\)/);
 assert.match(app,/const authRedirect=\(\)=> 'https:\/\/starfort-online-beta\.onrender\.com\/starfort\/'/);
});
test('verified guild profile is automatically linked to existing Supabase email identity',()=>{
 assert.match(guild,/route==='me'&&status===404/);
 assert.match(guild,/return rpc\('register',null,\{name:safeName\}\)/);
 assert.match(guild,/active\.user\.id\.replace/);
 assert.match(app,/const overview=.*guildSnapshot\.player\.name/);
 const portion=app.slice(app.indexOf('function renderGuild(){'),app.indexOf('async function refreshGuild(){'));
 assert.doesNotMatch(portion,/data-guild-action="register"/);
 assert.match(portion,/data-guild-action="create"/);
 assert.match(portion,/data-guild-action="join"/);
});
test('automatic equipment uses one busy lock across all hero slots',()=>{
 const portion=app.slice(app.indexOf('async function accountAutoEquip(heroId)'),app.indexOf('function dispatch(action)'));
 assert.match(portion,/villageBusy=true/);
 assert.match(portion,/for\(const slot of changes\)/);
 assert.match(portion,/await accountProgressRequest\('unequip'/);
 assert.match(portion,/await accountProgressRequest\('equip'/);
 assert.match(portion,/finally\{[\s\S]*villageBusy=false/);
 assert.match(portion,/await refreshVillage\(\{preserve:true,silent:true\}\)/);
});
test('the playable bot uses official signed-in hero roster and is discoverable in Seferler',()=>{
 assert.match(app,/activeView='arena';render\(\);return/);
 assert.match(app,/mountArena\(workspaceEl,villageView\(\)\)/);
 assert.match(arena,/verifiedGame\?\.serverVillage\?verifiedGame:R\.restoreState/);
 assert.match(app,/data-view="arena"/);
 assert.match(read('./guild-server.mjs'),/route==='\/api\/arena\/bot'/);
 assert.match(read('./account-only.js'),/ACCOUNT_ONLY=true/);
});
test('shop purchase and unavailable rewards are visually and functionally disabled',()=>{
 const season={month:'2026-11',wins:0,thresholds:[2,5,10,18],
  freeClaims:[],premium:false,premiumClaims:[]};
 const html=premiumStoreMarkup({source:'server-premium',ok:true,paymentsEnabled:false,crystals:0,
  vipUntil:null,owned:[],equipped:{},revision:1,season});
 assert.match(html,/premium-availability/);
 assert.match(html,/data-premium-action="purchase"[\s\S]*?disabled/);
 assert.match(html,/Not yet earned|Henüz kazanılmadı/);
 assert.match(app,/shopPreview/);
 assert.doesNotMatch(app,/Eğitim denemeleri ücretsizdir/);
 assert.doesNotMatch(app,/data-trial="\$\{hero\.id\}"/);
});
test('upgrade window labels owned and required, keep gate and sticky safe-area button',()=>{
 const game=createState(TODAY);game.serverVillage=true;
 const mark=buildingWorkshopMarkup(game,'farm',{icon:()=>'',number:String,now:TODAY});
 assert.match(mark,/Sahip olduğun:/);
 assert.match(mark,/Gerekli:/);
 assert.match(read('./building-workshop.css'),/\.ws-actions\{position:sticky/);
 assert.match(read('./building-workshop.css'),/safe-area-inset-bottom/);
 assert.match(app,/fm\('keepFirst'\)/);
 assert.match(read('./official-progress-coach.js'),/'Çantaya git'/);
});
test('battle arena, hit visuals and reward overlay have legible scaled mobile styles',()=>{
 assert.match(css,/\.server-mission \.official-combat-scene\{min-height:420px/);
 assert.match(css,/\.server-mission \.official-weapon-flash/);
 assert.match(css,/\.server-mission-result\.celebration\{position:fixed/);
 assert.match(css,/\.victory-prizes/);
 assert.match(css,/\.victory-actions/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('live-RPC version-6 early-game tuning affects only new battles and never rewards/owners',()=>{
 assert.match(sql,/Live baseline MD5 b1848362b2822c0d78f7c4f0e38397df/);
 assert.match(sql,/'balanceVersion',6/);
 assert.match(sql,/battle->>'mode'='story' and coalesce\(\(battle->>'balanceVersion'\)::integer,1\)>=6/);
 assert.match(sql,/then 1\.12 else 1\.06 end/);
 assert.match(sql,/then \.18 else \.11 end/);
 assert.match(sql,/else case when battle->>'mode'='act2' then \.34 else \.24 end/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/grant execute on function public\.sfb_starfort_progress.*to authenticated/);
 assert.doesNotMatch(sql,/delete from public\.starfort|truncate table public\.starfort/i);
});
