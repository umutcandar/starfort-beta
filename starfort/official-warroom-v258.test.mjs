import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES} from './locale-v243.js';
import {WAR_LOCALES,WAR_TEXT_KEYS,warText,warAdvice,warRallyCooldown,warSkillCooldown,verifiedSkillSpec,officialWarRoomMarkup,WAR_COMMANDS} from './official-warroom-v258.js';
import {officialCombatScene} from './official-combat-scene.js';
import {createState} from './rules.js';
const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const now=Date.UTC(2026,10,4,15);
const mission=(x={})=>({
 stage:1,mode:'story',wave:1,waves:3,turn:3,startedAt:now-30_000,lastTurnAt:now-3200,
 enemyIntent:'strike',playerHp:215,playerMaxHp:290,enemyHp:95,enemyMaxHp:200,
 lastAction:'strike',cooldowns:{},lastRallyTurn:0,power:310,...x
});
test('battle plan reacts to verified enemy tells and hero cooldowns',()=>{
 const squad=['aldren','lyra','rovan'];
 assert.equal(warAdvice(mission({enemyIntent:'crush'}),squad),'guard');
 assert.equal(warAdvice(mission({enemyIntent:'sunder'}),squad),'feint');
 assert.equal(warAdvice(mission({enemyIntent:'shield'}),squad),'skill:lyra');
 assert.equal(warAdvice(mission({enemyIntent:'shield',cooldowns:{lyra:9,rovan:9}}),squad),'feint');
 assert.equal(warAdvice(mission({enemyIntent:'eclipse',playerHp:100}),squad),'rally');
 assert.equal(warAdvice(mission({enemyIntent:'eclipse',playerHp:100,lastRallyTurn:2}),squad),'guard');
 assert.equal(warAdvice(mission({enemyIntent:'drain'}),squad),'skill:lyra');
 assert.equal(warAdvice(null,squad),null);
 assert.equal(warAdvice(mission({enemyIntent:'strike',playerHp:120}),squad),'rally');
});
test('cooldowns match the production RPC: 3 for hero skills, 4 for field recovery',()=>{
 const m=mission({turn:4,cooldowns:{lyra:8},lastRallyTurn:3});
 assert.equal(warSkillCooldown(m,'lyra'),3);
 assert.equal(warSkillCooldown(m,'rovan'),0);
 assert.equal(warRallyCooldown(m),2);
 assert.equal(warRallyCooldown(mission({turn:7,lastRallyTurn:3})),0);
 assert.equal(verifiedSkillSpec('lyra').strength,1.75);
 assert.equal(verifiedSkillSpec('mira').effect.includes('+42 + 6 × Lv HP'),true);
 assert.equal(verifiedSkillSpec('aldren').effect.includes('−62%'),true);
 assert.equal(verifiedSkillSpec('fake'),null);
});
test('all 14 language command packs are native and contain no missing keys',()=>{
 assert.deepEqual(WAR_LOCALES,SUPPORTED_LOCALES);
 for(const locale of SUPPORTED_LOCALES){
  for(const key of WAR_TEXT_KEYS){
   const value=warText(key,locale);
   assert.ok(value&&value.trim(),locale+' '+key);
  }
  for(const {id,key} of WAR_COMMANDS){
   const html=officialWarRoomMarkup(mission(),['aldren','lyra','rovan'],now,null,locale);
   assert.match(html,new RegExp('data-account-turn="'+id+'"'));
   assert.ok(html.includes(warText(key,locale)),locale+' '+key);
  }
 }
});
test('real buttons stay existing RPC commands; hero abilities are visible and informative',()=>{
 const m=mission({enemyIntent:'shield',cooldowns:{rovan:7}});
 const html=officialWarRoomMarkup(m,['aldren','lyra','rovan'],now);
 assert.equal((html.match(/data-account-turn="/g)||[]).length,7);
 assert.match(html,/data-account-turn="strike"/);
 assert.match(html,/data-account-turn="guard"/);
 assert.match(html,/data-account-turn="feint"/);
 assert.match(html,/data-account-turn="rally"/);
 assert.match(html,/data-account-turn="skill:lyra"/);
 assert.match(html,/×1\.75/);
 assert.match(html,/data-account-turn="skill:rovan" disabled/);
 assert.match(html,/data-account-turn="skill:lyra"/);
 assert.match(html,/war-recommended/);
 assert.match(html,/data-account-abandon/);
 assert.doesNotMatch(html,/data-account-turn="skill"/);
 assert.doesNotMatch(html,/data-account-turn="skill:nyxara"/);
});
test('no fake damage or unverified hero HP: battle summary needs same-turn signed delta',()=>{
 const m=mission();
 const unverified=officialWarRoomMarkup(m,['aldren'],now,{turn:2,damage:999,received:30,healed:20});
 assert.doesNotMatch(unverified,/war-verified-report/);
 const fabricated=officialWarRoomMarkup(m,['aldren'],now,{turn:3,damage:'999',received:1,healed:0,initial:false});
 assert.doesNotMatch(fabricated,/war-verified-report/);
 const verified=officialWarRoomMarkup(m,['aldren'],now,{turn:3,damage:70,received:13,healed:20,initial:false});
 assert.match(verified,/war-verified-report/);
 assert.match(verified,/>70</);
 assert.match(verified,/>13</);
 assert.match(verified,/>20</);
 const before=officialCombatScene(createState(now),m,null);
 assert.doesNotMatch(before,/war-verified-tracer/);
 const after=officialCombatScene(createState(now),m,{turn:3,initial:false,action:'strike',damage:70,received:13,healed:0});
 assert.match(after,/war-verified-tracer/);
 assert.match(after,/verified-offense/);
 assert.doesNotMatch(before,/verified-offense/);
});
test('deployment wiring preserves server actions, old saves, browser responsiveness and reduced motion',()=>{
 const markup=source('./account-expedition.js');
 const style=source('./official-warroom-v258.css');
 const entry=source('./index.html');
 const scene=source('./official-combat-scene.js');
 assert.match(markup,/officialWarRoomMarkup\(mission,game\.team\|\|\[\],now,combatDelta\)/);
 assert.match(entry,/official-warroom-v258\.css/);
 assert.match(style,/prefers-reduced-motion:reduce/);
 assert.match(style,/@media\(max-width:620px\)/);
 assert.match(style,/\.official-mini-health\{display:none\}/);
 assert.match(scene,/officialCombatImpact\(mission,combatDelta\)/);
 assert.match(scene,/war-verified-tracer/);
 assert.doesNotMatch(source('./official-warroom-v258.js'),/accountProgressRequest|fetch\(|service_role|localStorage\.setItem|rpc\(/i);
});
