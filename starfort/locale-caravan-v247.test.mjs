import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {CARAVAN_TRANSLATIONS,CARAVAN_UI_KEYS,auditCaravanTranslations} from './locale-caravan-v247.js';
import {CARAVAN_ROUTES,CARAVAN_DAILY_LIMIT,displayCaravanRoute,caravanMarkup,caravanStatus} from './kingdom-caravan.js';
const NOW=Date.UTC(2026,10,3,12);
const village=()=>({serverVillage:true,serverVillageReady:true,buildings:{keep:4},res:{gold:1000,wood:300,stone:300,aether:0},tradeRoutes:[],tradeDay:null});
test('3 caravan route names, descriptions, 10 status labels in each of 14 languages',()=>{
 assert.deepEqual(Object.keys(CARAVAN_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(CARAVAN_UI_KEYS.length,10);
 assert.deepEqual(auditCaravanTranslations(),[]);
 try{for(const locale of SUPPORTED_LOCALES){setLocale(locale);
  const pack=CARAVAN_TRANSLATIONS[locale];
  assert.deepEqual(Object.keys(pack.ui).sort(),[...CARAVAN_UI_KEYS].sort());
  for(const route of CARAVAN_ROUTES){const view=displayCaravanRoute(route),copy=pack.routes[route.id];
   assert.equal(view.id,route.id);assert.deepEqual(view.cost,route.cost);assert.deepEqual(view.reward,route.reward);
   assert.equal(view.name,copy.name);assert.equal(view.description,copy.description);
   assert.ok(view.name?.trim()&&view.description?.trim());
  }
  const html=caravanMarkup(village(),NOW);
  assert.ok(html.includes(pack.ui.intro));assert.ok(html.includes(pack.ui.note));
  assert.match(html,/data-caravan-trade=\"wood\"/);assert.match(html,/data-caravan-trade=\"stone\"/);assert.match(html,/data-caravan-trade=\"aether\"/);
 }}finally{setLocale('tr');}
});
test('all translations preserve server trade policy, caps, costs and rewards',()=>{
 const original=JSON.stringify(CARAVAN_ROUTES),v=village(),initial=JSON.stringify(v);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const state=caravanStatus(v,NOW);
  assert.equal(state.limit,2);assert.equal(state.remaining,2);
  for(const [index,route] of CARAVAN_ROUTES.entries()){
   const offer=state.offers[index];assert.equal(offer.id,route.id);assert.deepEqual(offer.cost,route.cost);assert.deepEqual(offer.reward,route.reward);
  }
  assert.equal(CARAVAN_DAILY_LIMIT,2);
  assert.equal(JSON.stringify(CARAVAN_ROUTES),original);assert.equal(JSON.stringify(v),initial);
 }}finally{setLocale('tr');}
});
