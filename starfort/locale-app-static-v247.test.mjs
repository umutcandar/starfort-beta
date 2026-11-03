import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {APP_STATIC_KEYS,APP_STATIC_TRANSLATIONS,appStaticText,auditAppStatic} from './locale-app-static-v247.js';
test('69 distinct home text fragments have English and all 12 additional-language translations',()=>{
 assert.equal(APP_STATIC_KEYS.length,69);assert.equal(new Set(APP_STATIC_KEYS).size,69);
 assert.deepEqual(auditAppStatic(),[]);
 assert.equal(Object.keys(APP_STATIC_TRANSLATIONS).length,13);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr')){
  assert.equal(Object.keys(APP_STATIC_TRANSLATIONS[lang]).length,69);
  for(const key of APP_STATIC_KEYS)assert.ok(APP_STATIC_TRANSLATIONS[lang][key]?.trim()&&!/<script|javascript:|onerror\\s*=/i.test(APP_STATIC_TRANSLATIONS[lang][key]),lang+':'+key);
 }
});
test('visible home HTML contains no unlocalized Turkish except native language option',()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const match=[...source.matchAll(/>[^<>{}\n]*[ğüşöçıİĞÜŞÖÇ][^<>{}\n]*</gu)].map(m=>m[0]);
 assert.deepEqual(match,['>Türkçe<']);
 assert.equal((source.match(/\$\{appStaticText\(/g)||[]).length,72);
 const ref=[...source.matchAll(/appStaticText\(("(?:\\.|[^"\\])*")\)/g)].map(x=>JSON.parse(x[1]));
 assert.deepEqual([...new Set(ref)].sort(),[...APP_STATIC_KEYS].sort());
 assert.match(source,/data-view=|data-upgrade-building|data-home/);
});
test('14 user languages change only presentation, never account, action or purchase capabilities',()=>{
 const before=JSON.stringify(APP_STATIC_KEYS);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  for(const key of APP_STATIC_KEYS){const visible=appStaticText(key);assert.ok(visible.length>0);
   if(lang==='tr')assert.equal(visible,key);
   else assert.equal(visible,APP_STATIC_TRANSLATIONS[lang][key]);
  }
 }}finally{setLocale('tr');}
 assert.equal(JSON.stringify(APP_STATIC_KEYS),before);
});
