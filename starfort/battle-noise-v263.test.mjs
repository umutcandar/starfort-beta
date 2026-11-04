import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cinematicCombatMarkup,officialSkillSpotlight} from './official-cinematic-v260.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const m={mode:'story',stage:1,turn:2,playerHp:210,playerMaxHp:250,enemyHp:30,enemyMaxHp:130,
 enemyIntent:'strike',lastAction:'strike',wave:1,waves:3};
const team=['aldren','lyra','rovan'];
const verified=(action)=>({turn:2,initial:false,damage:100,received:12,healed:0,action});
test('routine attacks and defensive orders never hide the 3D models under a cut-in panel',()=>{
 for(const action of ['strike','guard','feint','rally']){
  const moment=officialSkillSpotlight(m,verified(action),team,'en');
  assert.ok(moment);
  assert.notEqual(moment.kind,'skill');
  const html=cinematicCombatMarkup(m,team,verified(action),'en');
  assert.match(html,/sf-cinematic-hud/);
  assert.match(html,/sf-cinematic-portraits/);
  assert.doesNotMatch(html,/class="sf-cinematic-moment/);
 }
});
test('real named hero special abilities still earn a cinematic shot when verified',()=>{
 const html=cinematicCombatMarkup({...m,lastAction:'skill:lyra'},team,verified('skill:lyra'),'en');
 assert.match(html,/sf-cinematic-moment kind-skill hero-lyra/);
 assert.match(html,/Lyra/);
 assert.match(html,/⚔ −100/);
 assert.doesNotMatch(cinematicCombatMarkup(m,team,{...verified('skill:lyra'),initial:true},'en'),/class="sf-cinematic-moment/);
});
test('non-final signed server turns have no redundant toast and win overlay has no competing toast',()=>{
 const app=source('./app.js');
 const action=app.slice(app.indexOf('async function accountProgressAction('),app.indexOf('async function serverVillageAction('));
 assert.match(action,/if\(action!=='mission_turn'\)/);
 assert.match(action,/if\(!report\.won\)notify/);
 assert.match(action,/victoryVisible=true/);
 assert.doesNotMatch(action,/notify\(report\.won\?/);
});
