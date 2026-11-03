import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {bilingual,shadowRankName,localizeServerError,UNIFIED_KEYS,UNIFIED_PACK,RANK_NAMES_EN,AUTH_ERROR_CODES,auditUnified} from './locale-unified-v247.js';
import {longText} from './locale-sections-v247.js';
import {local} from './locale-game-content-v245.js';
import {SHADOW_MASTERY_TITLES,SHADOW_MASTERY_THRESHOLDS,shadowRankFromXp} from './shadow-mastery-v241.js';
test('all 14 locales reuse the cross-screen phrase memory',()=>{
 assert.equal(UNIFIED_KEYS.length,15);assert.equal(RANK_NAMES_EN.length,12);
 assert.equal(Object.keys(AUTH_ERROR_CODES).length,12);assert.deepEqual(auditUnified(),[]);
 for(const [lang,pack] of Object.entries(UNIFIED_PACK)){
  assert.deepEqual(Object.keys(pack).sort(),[...UNIFIED_KEYS].sort());
  for(const text of Object.values(pack))assert.ok(text.trim()&&!/<script|javascript:|onerror=/i.test(text),lang);
 }
});
test('village, arena, team and shadow get the same localized text',()=>{
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const a=bilingual('Yıldız Düellosu','Star Duel');
  assert.equal(a,local('Yıldız Düellosu','Star Duel'));
  assert.equal(a,longText('Yıldız Düellosu','Star Duel'));
  assert.equal(a,lang==='tr'?'Yıldız Düellosu':lang==='en'?'Star Duel':UNIFIED_PACK[lang]['Star Duel']);
  assert.ok(bilingual('Kilitli','Locked'));
  assert.equal(bilingual('Farklı','New unseen phrase'),lang==='tr'?'Farklı':'New unseen phrase');
 }}finally{setLocale('tr');}
});
test('twelve permanent Shadow mastery ranks keep XP and server loot rules intact',()=>{
 const before=JSON.stringify({names:SHADOW_MASTERY_TITLES,thresholds:SHADOW_MASTERY_THRESHOLDS});
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  for(let i=0;i<12;i++){const name=lang==='tr'?SHADOW_MASTERY_TITLES[i]:shadowRankName(i);
   assert.ok(name?.trim());if(lang!=='tr'&&lang!=='en')assert.notEqual(name,RANK_NAMES_EN[i]);}
  assert.equal(shadowRankFromXp(12),1);assert.equal(shadowRankFromXp(1120),12);
 }}finally{setLocale('tr');}
 assert.equal(JSON.stringify({names:SHADOW_MASTERY_TITLES,thresholds:SHADOW_MASTERY_THRESHOLDS}),before);
});
test('display localization never changes server authentication error identity',()=>{
 const error={code:'invalid_credentials',message:'Invalid login credentials',status:400};
 const original=JSON.stringify(error);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  assert.ok(localizeServerError(error)?.trim());
  assert.ok(localizeServerError('session_expired')?.trim());
  assert.equal(localizeServerError('totally_unknown_error'),'totally_unknown_error');
  assert.equal(JSON.stringify(error),original);
 }}finally{setLocale('tr');}
});
test('every referenced gameplay renderer uses the display-only bridge',()=>{
 for(const name of ['locale-game-content-v245.js','locale-sections-v247.js','shadow-frontier-v238.js','shadow-mastery-v241.js','shadow-rewards-v239.js','app.js','arena-view.js','team-view.js']){
  assert.match(readFileSync(new URL(name,import.meta.url),'utf8'),/locale-unified-v247/);
 }
 assert.doesNotMatch(readFileSync(new URL('locale-unified-v247.js',import.meta.url),'utf8'),/supabase[.]from[(]|p_action:|localStorage[.]setItem[(]/);
});
