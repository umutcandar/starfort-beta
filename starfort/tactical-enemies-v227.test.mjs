import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {accountExpeditionMarkup} from './account-expedition.js';
import {officialCombatScene} from './official-combat-scene.js';
import {validateAccountSnapshot} from './account-progression.js';
import * as R from './rules.js';
const NOW=Date.UTC(2026,10,2,10);
const base=()=>({
 ok:true,source:'server',serverNow:NOW,revision:3,lastCollected:NOW,lastDailyReward:null,mastery:0,construction:null,
 res:{gold:280,wood:180,stone:150,aether:65},buildings:Object.fromEntries(R.BUILDINGS.map(b=>[b.id,1])),
 heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},loadouts:{},team:['aldren','lyra','rovan'],
 cleared:[],campaignStars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,itemUpgrades:{},worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0,claimed:false},
 bossWeek:null,mission:null,lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[]
});
const battle={mode:'story',stage:3,tier:0,floor:0,turn:2,enemyHp:260,enemyMaxHp:380,playerHp:390,playerMaxHp:420,power:500,lastAction:'skill:lyra',lastTurnAt:NOW,cooldowns:{lyra:5}};
test('server skill and enemy intent model accepts only four named telegraphs',()=>{
 for(const intent of ['strike','crush','shield','drain']){
  const account=validateAccountSnapshot({...base(),mission:{...battle,enemyIntent:intent}});
  const html=accountExpeditionMarkup(R.createState(NOW),account,NOW+3500);
  assert.match(html,new RegExp('intent-'+intent));
  assert.match(html,/Sıradaki düşman hamlesi/);
  assert.match(html,/official-combat-scene/);
 }
 for(const bad of ['instant_win','javascript:','infinite',null,100]){
  assert.throws(()=>validateAccountSnapshot({...base(),mission:{...battle,enemyIntent:bad}}));
 }
});
test('tactics panel teaches counters for crush, shield and life drain',()=>{
 const game=R.createState(NOW);
 for(const [intent,hint]of [['crush','Siper komutunu kullan'],['shield','kalkanını deler'],['drain','kendini iyileştirir']]){
  const account=validateAccountSnapshot({...base(),mission:{...battle,enemyIntent:intent}});
  assert.match(accountExpeditionMarkup(game,account,NOW+3500),new RegExp(hint));
 }
 const h=officialCombatScene(game,{...battle,enemyIntent:'crush'});
 assert.match(h,/hero-skill-impact/);
 assert.match(h,/official-impact-ring/);
 assert.match(h,/özel yeteneğini kullandı/);
});
test('official server only dictates enemy action and computes damage and critical defense',()=>{
 const sql=readFileSync(new URL('./sql/starfort-v227-tactical-combat.sql',import.meta.url),'utf8');
 assert.match(sql,/enemyIntent','strike'/);
 assert.match(sql,/battle->>'enemyIntent'='crush'/);
 assert.match(sql,/battle->>'enemyIntent'='shield'/);
 assert.match(sql,/battle->>'enemyIntent'='drain'/);
 assert.match(sql,/case when ability='guard' then \.22 else 1\.70 end/);
 assert.match(sql,/if ability not like 'skill:%' then dmg:=greatest/);
 assert.match(sql,/php:=greatest\(0,php-edmg\)/);
 assert.match(sql,/ehp:=least\(\(battle->>'enemyMaxHp'\)::integer/);
 assert.match(sql,/battle:=jsonb_set\(battle,'\{enemyIntent\}'/);
 assert.match(sql,/where user_id=u for update/);
 assert.match(sql,/from public\.starfort_village_requests/);
});
