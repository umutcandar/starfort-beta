import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {PREMIUM_STORE_KEYS,PREMIUM_STORE_NATIVE,auditPremiumStoreNative} from './locale-premium-store-native-v247.js';
import {bilingual} from './locale-unified-v247.js';
import {premiumStoreMarkup} from './premium-store.js';
const store=()=>({paymentsEnabled:false,crystals:0,revision:1,vipUntil:null,owned:[],equipped:{},season:{month:'2026-11',wins:0,thresholds:[2,5,10,18],freeClaims:[],premium:false,premiumClaims:[]}});
test('all eighteen verified shop messages are complete in twelve extra languages',()=>{
 assert.equal(PREMIUM_STORE_KEYS.length,18);assert.deepEqual(auditPremiumStoreNative(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en')){
  assert.deepEqual(Object.keys(PREMIUM_STORE_NATIVE[lang]).sort(),[...PREMIUM_STORE_KEYS].sort());
  for(const value of Object.values(PREMIUM_STORE_NATIVE[lang]))assert.ok(value.trim()&&!/<script|javascript:/i.test(value));
 }
});
test('real server store has translated safety disclosure and does not enable purchases',()=>{
 const values=store(),original=JSON.stringify(values);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=premiumStoreMarkup(values);
  assert.ok(html.includes(bilingual('SUNUCU KONTROLLÜ MAĞAZA','SERVER-AUTHORITATIVE STORE')),lang);
  assert.ok(html.includes(bilingual('Gerçek para ödemeleri henüz kapalı','Real-money payments are disabled')),lang);
  assert.match(html,/data-premium-action="purchase"/);
  assert.doesNotMatch(html,/checkout-session|payment-url/i);
  assert.equal(JSON.stringify(values),original);
 }}finally{setLocale('tr');}
});
