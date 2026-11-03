import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {WORLD_LANGUAGES,worldBuilding,worldStage,worldResource} from './locale-world-v247.js';
import {BUILDINGS,STAGES,createState} from './rules.js';
import {displayBuilding,displayStage,displayResource} from './locale-game-content-v245.js';
const res=['gold','wood','stone','aether'];
test('all fourteen languages contain seven named buildings and descriptions, eight chapters and four resources',()=>{
 assert.deepEqual(Object.keys(WORLD_LANGUAGES).sort(),[...SUPPORTED_LOCALES].sort());
 for(const code of SUPPORTED_LOCALES){
  const pack=WORLD_LANGUAGES[code];
  assert.equal(Object.keys(pack.buildings).length,7);
  assert.equal(Object.keys(pack.stages).length,8);
  assert.equal(Object.keys(pack.resources).length,4);
  for(const b of BUILDINGS){
   assert.ok(pack.buildings[b.id].name.trim(),code+': building '+b.id);
   assert.ok(pack.buildings[b.id].description.trim(),code+': building description '+b.id);
   assert.doesNotMatch(pack.buildings[b.id].description,/<script|onerror\s*=/i);
  }
  for(const stage of STAGES)assert.ok(pack.stages[stage.id].name.trim(),code+': stage '+stage.id);
  for(const id of res)assert.ok(pack.resources[id].trim(),code+': resource '+id);
 }
});
test('world language selects native building names, all chapter names and resource text with immutable economy',()=>{
 const original=createState(Date.UTC(2026,10,3,10)),baseline=JSON.stringify(original);
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   assert.equal(getLocale(),lang);
   for(const building of BUILDINGS){
    const result=displayBuilding(building);
    assert.equal(result.name,worldBuilding(building.id).name);
    assert.equal(result.description,worldBuilding(building.id).description);
    assert.equal(result.id,building.id);
    assert.equal(result.baseCost,building.baseCost);
    assert.equal(result.maxLevel,building.maxLevel);
    assert.equal(result.production,building.production);
   }
   for(const stage of STAGES){
    const result=displayStage(stage);
    assert.equal(result.name,worldStage(stage.id).name);
    assert.equal(result.id,stage.id);
    assert.equal(result.recommendedPower,stage.recommendedPower);
    assert.equal(result.reward,stage.reward);
   }
   for(const id of res)assert.equal(displayResource(id),worldResource(id),lang+': '+id);
   assert.equal(JSON.stringify(original),baseline,lang+': display must be read-only');
  }
  setLocale('ar');
  assert.equal(displayBuilding(BUILDINGS[0]).name,'قلعة النجوم');
  setLocale('ja');
  assert.equal(displayResource('wood'),'木材');
  setLocale('es');
  assert.equal(displayStage(STAGES[0]).name,'Paso de las Cenizas');
  setLocale('tr');
  assert.equal(displayBuilding(BUILDINGS[0]),BUILDINGS[0]);
 }finally{setLocale('tr');}
});
