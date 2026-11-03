import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {DISCIPLINE_KEYS,DISCIPLINE_TEXT,disciplineText,auditDisciplineText} from './locale-shadow-discipline-v247.js';
import {heroDisciplinesMarkup,HERO_DISCIPLINES,HERO_TRAINING} from './shadow-frontier-v238.js';
test('all 23 permanent 3-rank specialization labels in all 14 languages',()=>{
 assert.equal(DISCIPLINE_KEYS.length,23);assert.deepEqual(auditDisciplineText(),[]);
 for(const lang of SUPPORTED_LOCALES){const dict=DISCIPLINE_TEXT[lang];assert.equal(Object.keys(dict).length,23);
  for(const key of DISCIPLINE_KEYS)assert.ok(dict[key]?.trim(),lang+':'+key);
 }
 assert.deepEqual(HERO_DISCIPLINES.map(x=>x.id),['assault','warden']);
 assert.deepEqual(HERO_TRAINING.map(x=>x.rank),[1,2,3]);
});
test('hero path identity, training price and immutable server parameters survive 14 locale changes',()=>{
 const front={heroPaths:{},battle:null},account={heroes:{aldren:5},cleared:[1,2,3],act2Cleared:[],mission:null},res={gold:1000,aether:1000,stone:1000};
 const before=JSON.stringify([front,account,res,HERO_TRAINING]);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=heroDisciplinesMarkup(front,account,res,false);
  assert.ok(html.includes(disciplineText('disciplineTitle')),lang);
  assert.ok(html.includes(disciplineText('assaultName').replace(/['"&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))),lang);
  assert.ok(html.includes(disciplineText('wardenName').replace(/['"&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))),lang);
  assert.match(html,/data-shadow-path="assault"/);
  assert.match(html,/data-shadow-path="warden"/);
  assert.match(html,/data-shadow-train="aldren"/);
  assert.ok(html.includes('250')&&html.includes('45')&&html.includes('25'));
  const loading=heroDisciplinesMarkup(null,null);
  assert.ok(loading.includes(disciplineText('loading')));
  assert.equal(JSON.stringify([front,account,res,HERO_TRAINING]),before);
 }}finally{setLocale('tr');}
});
