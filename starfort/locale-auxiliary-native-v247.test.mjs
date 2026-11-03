import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {AUXILIARY_KEYS,AUXILIARY_NATIVE,auditAuxiliary} from './locale-auxiliary-native-v247.js';
import {bilingual,hasNativeBilingual} from './locale-unified-v247.js';
import {premiumCatalogMarkup} from './premium-catalog.js';
test('56 global helper, training and shadow outcome texts have full 14-language mappings',()=>{
 assert.equal(AUXILIARY_KEYS.length,56);assert.equal(new Set(AUXILIARY_KEYS).size,56);
 assert.deepEqual(auditAuxiliary(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  for(const key of AUXILIARY_KEYS){assert.equal(hasNativeBilingual(key,lang),true,lang+':'+key);
   assert.ok(AUXILIARY_NATIVE[lang][key]?.trim());
  }
 }
});
test('original training and reward bilingual strings can never silently regress to English',()=>{
 const re=/\b(?:local|lt|l)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 for(const name of ['premium-catalog.js','tactics-view.js','shadow-rewards-v239.js']){
  const source=readFileSync(new URL(name,import.meta.url),'utf8');
  for(const found of source.matchAll(re)){
   const en=(found[3]??found[4]).replace(/\\(['"\\])/g,'$1');
   assert.ok(AUXILIARY_KEYS.includes(en),name+': '+en);
  }
 }
});
test('unreleased purchases remain disabled even in 14 localized concept screens',()=>{
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=premiumCatalogMarkup();
  assert.ok(html.includes(bilingual('Gelecekte ücretli sunulabilecek güçlü PvE ekipmanları. Bu sürümde örnek tasarım ve istatistiklerdir; eşya verilmez, para çekilmez.','These are concept designs for possible future PvE gear. They grant no items and charge no money in this version.'))||html.includes(bilingual('Satın alma henüz açık değil','Purchases not yet available')),lang);
  assert.doesNotMatch(html,/data-payment|data-checkout|payment-url/i);
 }}finally{setLocale('tr');}
});
