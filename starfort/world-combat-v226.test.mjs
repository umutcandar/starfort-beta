import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {realmMapModel,realmMapMarkup,routeToNextRealm,REALMS} from './realm-map.js';
import {officialCombatScene,officialSpriteStyle} from './official-combat-scene.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {validateAccountSnapshot,accountServerView,ACCOUNT_ACTIONS} from './account-progression.js';
const NOW=Date.UTC(2026,10,2,10);
const fixture=()=>({
 ok:true,source:'server',serverNow:NOW,revision:8,lastCollected:NOW,lastDailyReward:null,mastery:0,construction:null,
 res:{gold:280,wood:180,stone:150,aether:65},
 buildings:Object.fromEntries(R.BUILDINGS.map(b=>[b.id,1])),
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},
 loadouts:{},team:['aldren','lyra','rovan'],cleared:[],campaignStars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,
 itemUpgrades:{},worldBoss:{week:'2026-45',goal:4500,damage:2100,victories:1,claimed:false},
 bossWeek:null,mission:null,lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[]
});
test('interactive world map has 8 geographic regions, 24 stars and 24 veteran challenges without inventing new story stages',()=>{
 const model=realmMapModel({cleared:[],campaignStars:{},veteranMedals:{}});
 assert.equal(REALMS.length,8);
 assert.deepEqual(model.map(x=>x.chapter),Array.from({length:8},(_,i)=>i+1));
 assert.equal(model.filter(x=>x.unlocked).length,1);
 assert.equal(routeToNextRealm({cleared:[]}).chapter,1);
 for(const n of model){assert.ok(n.x>=0&&n.x<=100&&n.y>=0&&n.y<=100);assert.ok(n.name);}
 const account={cleared:[1,2,3,4],campaignStars:{1:3,2:2,3:3,4:1},veteranMedals:{1:2,2:3},mission:null};
 assert.equal(routeToNextRealm(account).chapter,5);
 const markup=realmMapMarkup(account,{selected:2});
 assert.equal((markup.match(/data-realm-select=/g)||[]).length,8);
 assert.match(markup,/data-realm-mission="2"/);
 assert.match(markup,/data-account-veteran="2:3"/);
 assert.match(markup,/realm-map-trails/);
 assert.match(markup,/Kırık Şapel/);
 assert.match(markup,/aria-pressed="true"/);
});
test('official combat reuses real hero enemy atlases, chapter biome and server HP without trusting client outcomes',()=>{
 for(const id of R.HEROES.map(x=>x.id).concat(['raider','caster','boss'])){
   const style=officialSpriteStyle(id);
   assert.match(style,/assets\/battle-/);assert.match(style,/--atlas-size:/);assert.match(style,/--atlas-x:/);
 }
 const game=R.createState(NOW);
 const mission={mode:'story',stage:3,turn:2,enemyHp:75,enemyMaxHp:260,playerHp:165,playerMaxHp:295,power:410,lastAction:'guard'};
 const html=officialCombatScene(game,mission);
 assert.match(html,/scene-forest/);
 assert.match(html,/battle-heroes-1.webp/);assert.match(html,/battle-enemies.webp/);
 assert.match(html,/SUNUCU ONAYLI/);assert.match(html,/Siperler kuruldu/); 
 assert.match(html,/official-combat-scene/);
 assert.doesNotMatch(html,/data-claim-|data-stage="3"|data-reward=/);
 assert.equal(officialCombatScene(game,null),'');
});
test('item upgrades cost quadratic rarities and apply server-matched permanent hero stats',()=>{
 const common=R.itemById('iron_sword'),epic=R.itemById('ember_blade'),legendary=R.itemById('starbreaker');
 assert.deepEqual(R.gearMasteryCost(common,0),{gold:120,stone:40,aether:8});
 assert.deepEqual(R.gearMasteryCost(epic,1),{gold:960,stone:160,aether:64});
 assert.deepEqual(R.gearMasteryCost(legendary,4),{gold:9000,stone:600,aether:600});
 assert.equal(R.gearMasteryCost(legendary,5),null);
 const s=R.createState(NOW);s.loadouts.aldren={weapon:'iron_sword'};s.inventory.iron_sword=1;
 const base=R.equipmentStats(s,'aldren');
 s.itemUpgrades={iron_sword:3};
 const extra=R.equipmentStats(s,'aldren');
 assert.equal(extra.attack-base.attack,9);assert.equal(extra.hp-base.hp,24);
 assert.deepEqual(s.inventory,{iron_sword:1,ward_mail:1});
});
test('account schema verifies world boss and enhancements without assuming saved test progress is real',()=>{
 const good=fixture();const valid=validateAccountSnapshot(good);
 assert.equal(valid.worldBoss.week,'2026-45');assert.equal(valid.itemUpgrades.iron_sword,undefined);
 assert.ok(ACCOUNT_ACTIONS.includes('enhance'));
 assert.ok(ACCOUNT_ACTIONS.includes('boss_claim'));
 const alt={...good,itemUpgrades:{iron_sword:5}};const p=validateAccountSnapshot(alt);
 const view=accountServerView(R.createState(NOW),p);
 assert.equal(view.itemUpgrades.iron_sword,5);
 view.itemUpgrades.iron_sword=4;assert.equal(p.itemUpgrades.iron_sword,5);
 const invalid=[
  {...good,itemUpgrades:{iron_sword:6}},
  {...good,itemUpgrades:{fake_loot:1}},
  {...good,itemUpgrades:{starbreaker:2}},
  {...good,worldBoss:{...good.worldBoss,damage:9999}},
  {...good,worldBoss:{...good.worldBoss,claimed:'yes'}},
  {...good,bossWeek:'fake-too-long-id'}
 ];
 for(const data of invalid)assert.throws(()=>validateAccountSnapshot(data));
});
test('authenticated campaign contains battle scene, world map, shared boss and safe claim controls',()=>{
 const state=R.createState(NOW),account=validateAccountSnapshot(fixture());
 const html=accountExpeditionMarkup(state,account,NOW);
 assert.equal((html.match(/data-account-stage=/g)||[]).length,8);
 assert.match(html,/data-realm-select=/);assert.match(html,/data-account-boss/);assert.match(html,/data-account-boss-claim/);
 assert.match(html,/4\.500/);assert.match(html,/Küllerin Kadim Hükümdarı/);
 assert.match(html,/data-account-boss disabled/);
 account.cleared=[1,2,3,4];
 account.worldBoss={week:'2026-45',goal:4500,damage:4500,victories:3,claimed:false};account.bossWeek='2026-45';
 const unlocked=accountExpeditionMarkup(state,account,NOW);
 assert.match(unlocked,/data-account-boss-claim/);
 assert.doesNotMatch(unlocked,/data-account-boss-claim disabled/);
 account.mission={mode:'boss',stage:4,turn:1,enemyHp:300,enemyMaxHp:400,playerHp:250,playerMaxHp:300,power:550,lastTurnAt:NOW,lastAction:'skill',tier:1,floor:0};
 const combat=accountExpeditionMarkup(state,account,NOW+3500);
 assert.match(combat,/official-combat-scene/);
 assert.match(combat,/data-account-turn="strike"/);
 assert.match(combat,/DÜNYA PATRONU/);
 assert.equal((combat.match(/data-account-turn="skill:[a-z]+"/g)||[]).length,3,'each hero has a server-validated unique ability');
 assert.match(combat,/official-hero-ability-strip/);
 account.mission.cooldowns={aldren:4};
 account.mission.turn=1;
 const cooling=accountExpeditionMarkup(state,account,NOW+3500);
 assert.match(cooling,/data-account-turn="skill:aldren" disabled/);

});
test('SQL does not expose the shared boss ledger and computes gear costs, set synergies and rewards server-side',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v226-world-boss-gear.sql',import.meta.url),'utf8');
 assert.match(sql,/alter table public.starfort_world_boss_week enable row level security/);
 assert.match(sql,/alter table public.starfort_world_boss_contribution enable row level security/);
 assert.match(sql,/revoke all on public.starfort_world_boss_week from public,anon,authenticated/);
 assert.match(sql,/revoke all on public.starfort_world_boss_contribution from public,anon,authenticated/);
 assert.match(sql,/auth.uid\(\)/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/where user_id=u and request_id=p_request_id/);
 assert.match(sql,/p_action='enhance'/);
 assert.match(sql,/item_upgrades=enchant/);
 assert.match(sql,/p_action='boss_claim'/);
 assert.match(sql,/from public.starfort_world_boss_week/);
 assert.match(sql,/on conflict\(week,user_id\) do update/);
 assert.match(sql,/p_target='boss'/);
 assert.match(sql,/power:=power\+coalesce\(\(enchant->>item_id\)::integer,0\)\*9/);
 assert.match(sql,/n>=2 then power:=power\+case slot/);
 assert.match(sql,/grant execute on function public.sfb_starfort_progress/);
 const skills=readFileSync(new URL('./sql/starfort-v226-hero-abilities.sql',import.meta.url),'utf8');
 assert.match(skills,/p_aux !~ '\^skill:\(aldren\|lyra/);
 assert.match(skills,/roster @> to_jsonb\(array\[hero\]\)/);
 assert.match(skills,/cooldowns/);
 assert.match(skills,/when 'mira' then/);
 assert.match(skills,/when 'vesper' then/);
 assert.match(skills,/grant execute on function public.sfb_starfort_progress/);

});
test('server enhancements, map selection and community boss are wired to real actions',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8'),
  armory=readFileSync(new URL('./armory-v212.js',import.meta.url),'utf8'),
  html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(app,/button.dataset.realmSelect/);
 assert.match(app,/button.dataset.realmMission/);
 assert.match(app,/accountProgressAction\('enhance'/);
 assert.match(app,/accountProgressAction\('boss_claim'/);
 assert.match(app,/accountProgressAction\('mission_start','boss'/);
 assert.match(armory,/data-account-enhance=/);
 assert.match(html,/world-combat-v226\.css/);
 assert.match(html,/v2\.36\.0/);
});
