import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {TRAINING_EVENT_KEYS,TRAINING_EVENT_TRANSLATIONS,trainingEventText,displayTrainingEvent} from './locale-training-v247.js';
import {createTraining,heroAbility,orderSquad} from './tactics.js';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('ten actual tactical runtime notifications are translated across all fourteen locales',()=>{
 assert.equal(TRAINING_EVENT_KEYS.length,10);
 assert.deepEqual(Object.keys(TRAINING_EVENT_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   const pack=TRAINING_EVENT_TRANSLATIONS[language];
   assert.deepEqual(Object.keys(pack).sort(),[...TRAINING_EVENT_KEYS].sort(),language);
   for(const key of TRAINING_EVENT_KEYS){
    assert.ok(pack[key]?.trim(),language+' '+key);
    assert.equal(trainingEventText(key,{hits:3}),pack[key].replace('{hits}','3'));
   }
   assert.equal(displayTrainingEvent('Kapıya ilerlemek için birliklerine emir ver.'),pack.intro);
   assert.equal(displayTrainingEvent('Haritada birlik için hedef noktayı seç.'),pack.choose);
   assert.equal(displayTrainingEvent('Yıldız darbesi: 3 hedef vuruldu.'),pack.burstHit.replace('{hits}','3'));
   assert.equal(displayTrainingEvent('Aldren: İlerle'),'Aldren: '+(language==='tr'?'İlerle':({en:'Advance',es:'Avanzar','pt-BR':'Avançar',fr:'Avancer',de:'Vorrücken',it:'Avanza',ru:'Вперёд',ar:'تقدم',hi:'आगे बढ़ो',id:'Maju',ja:'前進',ko:'전진','zh-CN':'前进'})[language]));
  }
 }finally{setLocale('tr');}
});
test('translated tactical messages never change simulation input or damage',()=>{
 const initial=createTraining();const stateBefore=JSON.stringify(initial);
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   assert.ok(displayTrainingEvent(initial.event).length>4);
   assert.equal(JSON.stringify(initial),stateBefore);
  }
  setLocale('en');
  const result=createTraining();
  orderSquad(result,0,'follow');
  assert.match(displayTrainingEvent(result.event),/Follow/);
  assert.equal(result.orderCount,1);
  const role=result.squads[0].order;assert.equal(role,'follow');
  assert.equal(JSON.stringify(initial),stateBefore);
 }finally{setLocale('tr');}
});
test('training view localizes labels but keeps all keyboard, skill and squad action IDs',()=>{
 const source=read('tactics-view.js');
 for(const token of ['data-training-ability="burst"','data-training-ability="dash"','data-training-ability="rally"',
  'data-training-pause','data-training-reset','data-training-order','data-training-squad','data-move="up"'])
  assert.ok(source.includes(token),token);
 assert.match(source,/displayTrainingEvent\(game\.event\)/);
 assert.match(source,/tt\('starStrike'\)/);
 assert.match(source,/lt\('Kuşatma Tatbikatı','Siege Training'\)/);
 assert.doesNotMatch(source,/data-guest/);
});
