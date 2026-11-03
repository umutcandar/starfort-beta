import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {SCENE_KEYS,OFFICIAL_SCENE_TEXT,sceneText,sceneMood,sceneBossAbility,sceneStageEnemy,auditSceneCopy} from './locale-official-scene-v247.js';
import {officialCombatScene} from './official-combat-scene.js';
import {createState} from './rules.js';
const t=Date.UTC(2026,10,3,12);
const scenario=mode=>({mode,stage:1,wave:3,waves:3,turn:4,power:540,playerHp:250,playerMaxHp:300,enemyHp:150,enemyMaxHp:300,enemyIntent:'crush',lastAction:'strike'});
test('all scene headings, biomes and Act II boss powers are translated in 14 languages',()=>{
 assert.equal(SCENE_KEYS.length,28);assert.deepEqual(auditSceneCopy(),[]);
 for(const lang of SUPPORTED_LOCALES){assert.equal(Object.keys(OFFICIAL_SCENE_TEXT[lang]).length,28);}
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  assert.ok(sceneMood(1).trim()&&sceneBossAbility(1).trim());
  assert.ok(sceneStageEnemy(1).trim()&&sceneStageEnemy(8).trim());
  assert.equal(sceneText('actorSkill',{hero:'Aldren'}).includes('Aldren'),true);
 }}finally{setLocale('tr');}
});
test('server-verified battle keeps canonical state and controls in all 14 languages',()=>{
 const state=createState(t),mission=scenario('story'),before=JSON.stringify([state,mission]);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  for(const mode of ['story','act2','boss']){
   const game=officialCombatScene(state,{...mission,mode});
   assert.ok(game.includes(sceneText('arenaLabel')),lang+' aria scene');
   assert.ok(game.includes(sceneText('switchOn')),lang+' switch');
   assert.ok(game.includes(sceneText('power')),lang+' power');
   assert.match(game,/data-official-render-toggle/);
   assert.match(game,/data-official-render-state/);
   if(lang!=='tr')assert.doesNotMatch(game,/Sunucu tarafından yönetilen görsel savaş alanı|Kılıçlar çarpıştı|Güç 540 hamle/);
  }
  assert.equal(JSON.stringify([state,mission]),before);
 }}finally{setLocale('tr');}
});
