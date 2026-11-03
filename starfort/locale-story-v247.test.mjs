import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {ACT_ONE_NATIVE,storyOperationNative,storyChapterNative,auditActOne} from './locale-story-v247.js';
import {OPERATION_DISPLAY_EN,STAGE_DISPLAY_EN,displayOperation,displayStage} from './locale-game-content-v245.js';
import {STORY_OPERATIONS} from './story-operations.js';
import {STAGES,createState} from './rules.js';
const twelve=SUPPORTED_LOCALES.filter(x=>!['tr','en'].includes(x));
test('all twelve non-TR/EN languages carry 24 mission objectives and titles and eight story descriptions',()=>{
 assert.equal(twelve.length,12);
 assert.deepEqual(Object.keys(ACT_ONE_NATIVE).sort(),[...twelve].sort());
 assert.deepEqual(auditActOne(),[]);
 for(const [language,pack] of Object.entries(ACT_ONE_NATIVE)){
  assert.equal(Object.keys(pack.operations).length,24,language);
  assert.equal(Object.keys(pack.stages).length,8,language);
  for(const [id,mission] of Object.entries(pack.operations)){
   assert.match(id,/^[1-8]-[1-3]$/);
   assert.ok(mission.title?.trim()&&mission.objective?.trim(),language+': '+id);
   assert.doesNotMatch(mission.title+mission.objective,/<script|onerror\s*=|javascript:/i);
  }
  for(const value of Object.values(pack.stages))assert.ok(value.trim(),language);
 }
});
test('native mission names and chapter objectives render in existing campaign without touching battle, rewards or IDs',()=>{
 const save=createState(Date.UTC(2026,10,3,10)),before=JSON.stringify(save);
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   for(const stage of STAGES){
    const shown=displayStage(stage);
    assert.equal(shown.id,stage.id);
    assert.equal(shown.reward,stage.reward);
    assert.equal(shown.recommendedPower,stage.recommendedPower);
    assert.equal(shown.enemyCount,stage.enemyCount);
    assert.equal(shown.description,language==='tr'?stage.description:language==='en'?STAGE_DISPLAY_EN[stage.id].description:storyChapterNative(stage.id));
    for(const op of STORY_OPERATIONS[stage.id]){
     const display=displayOperation(op);
     const original=op;
     assert.equal(display.id,original.id);
     assert.equal(display.title,language==='tr'?original.title:language==='en'?OPERATION_DISPLAY_EN[op.id].title:storyOperationNative(op.id).title);
     assert.equal(display.objective,language==='tr'?original.objective:language==='en'?OPERATION_DISPLAY_EN[op.id].objective:storyOperationNative(op.id).objective);
    }
   }
   assert.equal(JSON.stringify(save),before,language+' modified canonical state');
  }
 }finally{setLocale('tr');}
});
test('narrative strings are display only, no RPC or local save mutation',()=>{
 for(const path of ['locale-story-eu-v247.js','locale-story-asia-v247.js','locale-story-v247.js']){
  const src=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(src,/localStorage\.setItem|fetch\(|supabase|\.res\s*=|\.reward\s*=/);
 }
});
