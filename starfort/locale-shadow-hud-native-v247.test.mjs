import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {SHADOW_HUD_KEYS,SHADOW_HUD_NATIVE,auditShadowHud} from './locale-shadow-hud-native-v247.js';
import {bilingual,hasNativeBilingual} from './locale-unified-v247.js';
test('all 78 Shadow Frontier combat and mastery strings have native presentation in 14 languages',()=>{
 assert.equal(SHADOW_HUD_KEYS.length,78);assert.equal(new Set(SHADOW_HUD_KEYS).size,78);
 assert.deepEqual(auditShadowHud(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en'))for(const key of SHADOW_HUD_KEYS){
  assert.equal(hasNativeBilingual(key,lang),true,lang+':'+key);
  assert.ok(SHADOW_HUD_NATIVE[lang][key]?.trim()&&!/<script|javascript:|onerror\s*=/i.test(SHADOW_HUD_NATIVE[lang][key]));
 }
});
test('Shadow user-facing source strings remain complete; changing rank rewards never follows translation',()=>{
 const re=/\b(?:local|lt|l)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 for(const name of ['shadow-frontier-v238.js','shadow-mastery-v241.js']){
  const text=readFileSync(new URL(name,import.meta.url),'utf8');
  for(const m of text.matchAll(re)){
   const word=(m[3]??m[4]).replace(/\\(['"\\])/g,'$1');
   assert.ok(SHADOW_HUD_KEYS.includes(word),name+':'+word);
  }
 }
 const source=readFileSync(new URL('locale-shadow-hud-native-v247.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/localStorage[.]setItem|supabase[.]from|p_action:|payment-url/i);
});
