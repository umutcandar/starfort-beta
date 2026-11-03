import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {APP_NATIVE_KEYS,APP_NATIVE,auditAppNative} from './locale-app-native-v247.js';
import {bilingual,hasNativeBilingual} from './locale-unified-v247.js';
test('every one of 74 village, heroes and clan bilingual literals is translated in all 14 languages',()=>{
 assert.equal(APP_NATIVE_KEYS.length,74);assert.equal(new Set(APP_NATIVE_KEYS).size,74);
 assert.deepEqual(auditAppNative(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en'))for(const key of APP_NATIVE_KEYS){
  assert.equal(hasNativeBilingual(key,lang),true,lang+':'+key);
  assert.ok(APP_NATIVE[lang][key]?.trim()&&!/<script|javascript:|onerror\s*=/i.test(APP_NATIVE[lang][key]));
 }
});
test('main game locale audit covers exact source phrases without modifying click actions',()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const regex=/\b(?:local|lt|l)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 const keys=[...new Set([...source.matchAll(regex)].map(m=>(m[3]??m[4]).replace(/\\(['"\\])/g,'$1')))];
 assert.equal(keys.length,72);assert.deepEqual(keys,APP_NATIVE_KEYS.filter(k=>keys.includes(k)));
 assert.match(source,/data-account-maze|data-labyrinth-open/);
 assert.ok(source.includes('accountReady()'));
});
