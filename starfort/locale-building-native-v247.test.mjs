import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {BUILDING_NATIVE,BUILDING_NATIVE_KEYS,auditBuildingNative} from './locale-building-native-v247.js';
import {BUILDING_ADVANCED_NATIVE,BUILDING_ADVANCED_KEYS,auditBuildingAdvanced} from './locale-building-advanced-v247.js';
import {bilingual} from './locale-unified-v247.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
import {createState} from './rules.js';
test('all 91 literal building-workshop phrases are translated in all 12 additional languages',()=>{
 const source=readFileSync(new URL('building-workshop.js',import.meta.url),'utf8');
 const regex=/\blocal\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 const words=[...new Set([...source.matchAll(regex)].map(m=>(m[3]??m[4]).replace(/\\(['"\\])/g,'$1')))];
 const keys=[...BUILDING_NATIVE_KEYS,...BUILDING_ADVANCED_KEYS];
 assert.equal(words.length,91);
 assert.equal(keys.length,91);
 assert.equal(new Set(keys).size,91);
 assert.deepEqual([...words].sort(),[...keys].sort());
 assert.deepEqual(auditBuildingNative(),[]);
 assert.deepEqual(auditBuildingAdvanced(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en')){
  for(const key of keys){
   const value=(BUILDING_NATIVE[lang]||{})[key]??(BUILDING_ADVANCED_NATIVE[lang]||{})[key];
   assert.ok(value?.trim()&&!/<script|javascript:|onerror\s*=/i.test(value),lang+':'+key);
  }
 }
});
test('building workshop uses translated upgrade controls with immutable construction economy',()=>{
 const state=createState(Date.UTC(2026,10,3,10));
 const original=JSON.stringify(state);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=buildingWorkshopMarkup(state,'keep',{icon:()=>'<i></i>',now:Date.UTC(2026,10,3,10)});
  assert.ok(html.includes(bilingual('Köy Geliştirme Merkezi','Village Upgrade Center')),lang);
  assert.ok(html.includes(bilingual('KRALLIK MİMARISI','KINGDOM ARCHITECTURE')),lang);
  assert.match(html,/data-plan-building="keep"/);
  assert.equal(JSON.stringify(state),original,lang+' view mutated game state');
 }}finally{setLocale('tr');}
});
