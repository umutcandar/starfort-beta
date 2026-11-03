import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {ACT_TWO_NATIVE,ACT_TWO_GATES,ACT_TWO_GATE_KEYS,nativeSecondRegion,nativeSecondOperation,nativeSecondGate,auditActTwo} from './locale-act2-v247.js';
import {SECOND_ACT,secondActMission,secondActReadiness} from './second-act.js';
import {SECOND_ACT_DISPLAY_EN,displaySecondAct,displaySecondActOperation,secondActGateMessage} from './locale-act-two-v245.js';
import {createState} from './rules.js';
const others=SUPPORTED_LOCALES.filter(id=>!['tr','en'].includes(id));
test('all 12 additional languages have eight region names, lore, zone, boss and 24 mission descriptions',()=>{
 assert.deepEqual(Object.keys(ACT_TWO_NATIVE).sort(),[...others].sort());
 assert.deepEqual(auditActTwo(),[]);
 for(const lang of others){
  const stages=ACT_TWO_NATIVE[lang];
  assert.equal(Object.keys(stages).length,8);
  for(let stage=1;stage<=8;stage++){
   const entry=stages[stage];
   for(const field of ['name','zone','lore','boss']){
    assert.ok(typeof entry[field]==='string'&&entry[field].trim(),lang+' '+stage+' '+field);
    assert.doesNotMatch(entry[field],/<script|onerror\s*=|javascript:/i);
   }
   assert.equal(Object.keys(entry.operations).length,3);
   for(let wave=1;wave<=3;wave++){
    const op=entry.operations[stage+'-'+wave];
    assert.ok(op?.name?.trim()&&op?.objective?.trim(),lang+' stage '+stage+' wave '+wave);
    assert.doesNotMatch(op.name+op.objective,/<script|onerror\s*=|javascript:/i);
   }
  }
 }
});
test('14 locales translate all second-act access gates with numerical requirements unchanged',()=>{
 assert.deepEqual(Object.keys(ACT_TWO_GATES).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(ACT_TWO_GATE_KEYS.length,4);
 const samples=[
  ['Bilinmeyen ikinci perde bölgesi.','unknown'],
  ['Önce sekiz ana hikâye bölgesini tamamla.','mainStory'],
  ['Önce ikinci perdenin önceki bölgesini bitir.','priorRegion'],
  ['Gerekli güç 1734. Kahraman ve ekipmanı geliştir.','power']
 ];
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   for(const key of ACT_TWO_GATE_KEYS)assert.ok(ACT_TWO_GATES[locale]?.[key]?.trim(),locale+': '+key);
   for(const [canonical,key] of samples){
    const actual=secondActGateMessage(canonical);
    const expected=nativeSecondGate(key,{power:'1734'});
    assert.equal(actual,canonical&&locale==='tr'?canonical:expected,locale+': '+key);
    if(key==='power')assert.ok(actual.includes('1734'));
   }
  }
 }finally{setLocale('tr');}
});
test('all 14 languages show Act II regions and 24 operations without altering server combat state',()=>{
 const state=createState(Date.UTC(2026,10,3,12)),before=JSON.stringify(state);
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   for(const stage of SECOND_ACT){
    const shown=displaySecondAct(stage);
    assert.equal(shown.id,stage.id);
    assert.equal(shown.recommendedPower,stage.recommendedPower);
    assert.equal(shown.operations.length,3);
    if(language==='tr')assert.equal(shown,stage);
    else if(language==='en')assert.equal(shown.name,SECOND_ACT_DISPLAY_EN[stage.id].name);
    else for(const key of ['name','zone','lore','boss'])assert.equal(shown[key],nativeSecondRegion(stage.id)[key]);
    for(const operation of stage.operations){
     const view=displaySecondActOperation(operation);
     assert.equal(view.id,operation.id);
     assert.equal(view.name,language==='tr'?operation.name:language==='en'?SECOND_ACT_DISPLAY_EN[stage.id].operations[Number(operation.id.at(-1))-1].name:nativeSecondOperation(operation.id).name);
     assert.equal(view.objective,language==='tr'?operation.objective:language==='en'?SECOND_ACT_DISPLAY_EN[stage.id].operations[Number(operation.id.at(-1))-1].objective:nativeSecondOperation(operation.id).objective);
    }
   }
   assert.equal(JSON.stringify(state),before,language);
  }
  const mission=secondActMission({mode:'act2',stage:4,waves:3,wave:2});
  assert.equal(mission.id,'4-2');
  assert.equal(mission.stage.recommendedPower,SECOND_ACT[3].recommendedPower);
  assert.equal(secondActReadiness({cleared:[],act2Cleared:[]},0,1).ok,false);
 }finally{setLocale('tr');}
});
test('localized second-act display must not alter battle or server progression',()=>{
 for(const path of ['locale-act2-eu-v247.js','locale-act2-asia1-v247.js','locale-act2-asia2-v247.js','locale-act2-v247.js']){
  const contents=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(contents,/supabase|localStorage\.setItem|fetch\(|\.reward\s*=|\.recommendedPower\s*=/);
 }
});
