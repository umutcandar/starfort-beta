import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {PREMIUM_NATIVE,nativePremiumItem,auditPremiumNative} from './locale-premium-v247.js';
import {bilingual} from './locale-unified-v247.js';
import {PREMIUM_COSMETICS,PREMIUM_ALL_ITEMS,CRYSTAL_PACKS,FREE_SEASON,displayPremiumItem,premiumStoreMarkup,validatePremium} from './premium-store.js';
const other=SUPPORTED_LOCALES.filter(x=>!['tr','en'].includes(x));
const sample={ok:true,source:'server-premium',paymentsEnabled:false,crystals:0,revision:1,vipUntil:null,owned:[],equipped:{},season:{month:'2026-11',wins:0,premium:false,thresholds:[2,5,10,18],freeClaims:[],premiumClaims:[]}};
test('all twelve extra languages have full names and descriptions for twelve cosmetics plus three future packs',()=>{
 assert.equal(PREMIUM_COSMETICS.length,8);
 assert.equal(PREMIUM_ALL_ITEMS.length,12);
 assert.equal(CRYSTAL_PACKS.length,3);
 assert.deepEqual(Object.keys(PREMIUM_NATIVE).sort(),[...other].sort());
 assert.deepEqual(auditPremiumNative(),[]);
 for(const lang of other){
  const catalog=PREMIUM_NATIVE[lang].items;
  assert.equal(Object.keys(catalog).length,15);
  for(const [id,copy] of Object.entries(catalog)){
   assert.ok(copy.name.trim()&&copy.detail.trim(),lang+':'+id);
   assert.doesNotMatch(copy.name+copy.detail,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('all fourteen languages preserve cosmetic prices, free win thresholds and disabled payment guard',()=>{
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   for(const item of [...PREMIUM_ALL_ITEMS,...CRYSTAL_PACKS]){
    const display=displayPremiumItem(item);
    assert.equal(display.id,item.id);
    assert.equal(display.price,item.price);
    assert.equal(display.crystals,item.crystals);
    assert.equal(display.kind,item.kind);
    assert.equal(display.name,locale==='tr'?item.name:locale==='en'?display.name:nativePremiumItem(item.id).name);
   }
   const snapshot=validatePremium(sample);
   assert.equal(snapshot.paymentsEnabled,false);
   assert.equal(snapshot.crystals,0);
   assert.deepEqual(FREE_SEASON.map(x=>x.wins),[2,5,10,18]);
   const html=premiumStoreMarkup(snapshot);
   assert.ok(html.includes(bilingual('Gerçek para ödemeleri henüz kapalı','Real-money payments are disabled')),locale+' native payment lock');
   assert.match(html,/data-premium-action="purchase"/);
   assert.match(html,/data-premium-action="claim"/);
   assert.ok(html.includes(locale==='tr'?'Kutup Işığı Hisarı':locale==='en'?'Aurora Keep':nativePremiumItem('castle-aurora').name),locale);
   assert.equal((html.match(/<button disabled class="secondary">/g)||[]).length,5,'All planned payment buttons stay disabled');
  }
 }finally{setLocale('tr');}
});
test('native premium catalogs remain read-only',()=>{
 for(const path of ['locale-premium-eu-v247.js','locale-premium-asia-v247.js','locale-premium-v247.js']){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(source,/fetch\(|localStorage\.setItem|supabase|p_action:|\.crystals\s*=/);
 }
});
