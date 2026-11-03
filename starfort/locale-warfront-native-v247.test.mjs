import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {WARFRONT_NATIVE,WARFRONT_NATIVE_KEYS,auditWarfrontNative} from './locale-warfront-native-v247.js';
import {bilingual} from './locale-unified-v247.js';
import {warfrontMarkup} from './warfront-v237.js';
test('all twenty-five Warfront native labels exist in 12 additional languages',()=>{
 assert.equal(WARFRONT_NATIVE_KEYS.length,25);assert.deepEqual(auditWarfrontNative(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en')){
  assert.deepEqual(Object.keys(WARFRONT_NATIVE[lang]).sort(),[...WARFRONT_NATIVE_KEYS].sort());
  for(const text of Object.values(WARFRONT_NATIVE[lang]))assert.ok(text.trim()&&!/<script|javascript:/.test(text));
 }
});
test('server Warfront status copy follows selected locale and never creates rewards',()=>{
 const status={pending:null,revision:1,wins:0,dailyWins:0,weeklyWins:0,day:'2026-11-03',week:'2026-45',dailyClaimed:false,weeklyClaimed:false,chestsClaimed:0,nextChestWins:3,lastLoot:null};
 const village={res:{gold:500,wood:300,stone:200,aether:20},buildings:{keep:4}};
 const original=JSON.stringify(status);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=warfrontMarkup(status,village,null);
  assert.ok(html.includes(bilingual('Sunucu Cephe Karargâhı','Server Frontier Headquarters')),lang);
  assert.match(html,/data-warfront-action=/);
  assert.equal(JSON.stringify(status),original);
 }}finally{setLocale('tr');}
});
