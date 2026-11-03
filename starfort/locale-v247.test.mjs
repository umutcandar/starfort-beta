import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {SHARED_KEYS,SHARED_TRANSLATIONS,textKey,longText,auditSharedTranslations} from './locale-sections-v247.js';
import {labyrinthMarkup,translatedMazeZone} from './labyrinth-view.js';
import {CARAVAN_ROUTES,CARAVAN_DAILY_LIMIT,caravanMarkup,caravanStatus,displayCaravanRoute} from './kingdom-caravan.js';
import {WARFRONT_DOCTRINES,warfrontMarkup,displayWarfrontDoctrine,WARFRONT_DAILY_REWARD} from './warfront-v237.js';
import {PREMIUM_COSMETICS,FREE_SEASON,CRYSTAL_PACKS,PREMIUM_ALL_ITEMS,displayPremiumItem,premiumStoreMarkup} from './premium-store.js';
import {CHRONICLE_MILESTONES,chronicleState,chronicleMarkup,displayChronicleRank} from './commander-chronicle.js';
import {createState} from './rules.js';
const NOW=Date.UTC(2026,10,3,10);
const village=()=>({serverVillage:true,serverVillageReady:true,buildings:{keep:4,farm:1,lumber:1,quarry:1,forge:1,tavern:1,observatory:1},
 res:{gold:800,wood:300,stone:240,aether:10},tradeDay:null,tradeRoutes:[]});
const front={pending:null,revision:1,wins:0,dailyWins:0,weeklyWins:0,day:'2026-11-03',week:'2026-45',dailyClaimed:false,weeklyClaimed:false,chestsClaimed:0,nextChestWins:3,lastLoot:null};
const store=()=>({paymentsEnabled:false,crystals:0,revision:1,vipUntil:null,owned:[],equipped:{},
 season:{month:'2026-11',wins:0,thresholds:[2,5,10,18],freeClaims:[],premium:false,premiumClaims:[]}});
test('a unified 60-key glossary exists in all 14 supported locales',()=>{
 assert.equal(SHARED_KEYS.length,60);
 assert.deepEqual(Object.keys(SHARED_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditSharedTranslations(),[]);
 for(const code of SUPPORTED_LOCALES){
  const pack=SHARED_TRANSLATIONS[code];
  assert.deepEqual(Object.keys(pack).sort(),[...SHARED_KEYS].sort(),code);
  for(const [key,value] of Object.entries(pack)){
   assert.ok(typeof value==='string'&&value.trim(),code+': '+key);
   assert.doesNotMatch(value,/<script|javascript:|onerror\s*=/i,code+': '+key);
  }
 }
});
test('all 14 languages translate common game buttons in labyrinth, trade, warfront, store and chronicle',()=>{
 const game=createState(NOW);
 const original=JSON.stringify(game);
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   const maze=labyrinthMarkup(game);
   const caravan=caravanMarkup(village(),NOW);
   const warfront=warfrontMarkup(front,game,null);
   const premium=premiumStoreMarkup(store());
   const chronicle=chronicleMarkup({counters:{win:0},contractClaims:{}});
   assert.equal(getLocale(),language);
   assert.ok(maze.includes(textKey('labTitle')),language+' labyrinth');
   assert.ok(caravan.includes(textKey('carTitle')),language+' caravan');
   assert.ok(warfront.includes(textKey('warTitle')),language+' frontier');
   assert.ok(premium.includes(textKey('premiumTitle')),language+' store');
   assert.ok(chronicle.includes(textKey('chronicleTitle')),language+' chronicle');
   for(const markup of [maze,caravan,warfront,premium,chronicle])assert.doesNotMatch(markup,/<script|javascript:/i);
   assert.ok(maze.includes('data-view="expedition"'));
   assert.ok(caravan.includes('data-caravan-trade="wood"'));
   assert.ok(warfront.includes('data-warfront-action="prepare"'));
   assert.ok(premium.includes('data-premium-action="purchase"'));
   assert.ok(chronicle.includes('data-account-chronicle="1"'));
   assert.equal(JSON.stringify(game),original,'Localized views may never mutate canonical state');
  }
 }finally{setLocale('tr');}
});
test('English fallback does not affect canonical IDs, thresholds, prices or reward economics',()=>{
 try{
  setLocale('en');
  for(const route of CARAVAN_ROUTES){
   const display=displayCaravanRoute(route);
   assert.equal(display.id,route.id); assert.equal(display.cost,route.cost);assert.equal(display.reward,route.reward);
   assert.notEqual(display.name,route.name);
  }
  assert.equal(CARAVAN_DAILY_LIMIT,2);
  assert.equal(caravanStatus(village(),NOW).remaining,2);
  for(const doctrine of WARFRONT_DOCTRINES){
   const display=displayWarfrontDoctrine(doctrine);
   assert.equal(display.id,doctrine.id);assert.equal(display.cost,doctrine.cost);
   assert.notEqual(display.name,doctrine.name);
  }
  assert.equal(WARFRONT_DAILY_REWARD.gold,160);
  assert.equal(PREMIUM_COSMETICS.length,8);
  for(const item of PREMIUM_ALL_ITEMS){
   const display=displayPremiumItem(item);
   assert.equal(display.id,item.id);assert.equal(display.price,item.price);assert.equal(display.kind,item.kind);
  }
  assert.deepEqual(FREE_SEASON.map(x=>x.wins),[2,5,10,18]);
  assert.equal(CRYSTAL_PACKS.length,3);
  for(const rank of CHRONICLE_MILESTONES){
   assert.equal(rank.wins,rank.rank**2*2);
   assert.notEqual(displayChronicleRank(rank),rank.name);
  }
  assert.equal(chronicleState({counters:{win:0}}).claimed,0);
  assert.equal(longText('Türkçe örnek','English example'),'English example');
  assert.equal(translatedMazeZone({name:'Kül Merdivenleri',hint:'x'}).name,'Ash Stairs');
  setLocale('tr'); assert.equal(longText('Türkçe örnek','English example'),'Türkçe örnek');
  assert.equal(displayPremiumItem(PREMIUM_COSMETICS[0]),PREMIUM_COSMETICS[0]);
 }finally{setLocale('tr');}
});
test('subscription and combat controls remain server-only; presentation modules never mint rewards',()=>{
 for(const file of ['locale-sections-v247.js','labyrinth-view.js','kingdom-caravan.js','commander-chronicle.js']){
  const contents=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.doesNotMatch(contents,/localStorage\.setItem\(|supabase\.from\(|p_action\s*:/);
 }
 const premium=readFileSync(new URL('premium-store.js',import.meta.url),'utf8');
 const frontier=readFileSync(new URL('warfront-v237.js',import.meta.url),'utf8');
 assert.match(premium,/p_action:action/);
 assert.match(frontier,/p_action:action/);
 assert.match(frontier,/claim_chest/);
 assert.match(premium,/paymentsEnabled!==false/);
});
test('duel and team shells use translation rather than introducing anonymous play actions',()=>{
 const arena=readFileSync(new URL('arena-view.js',import.meta.url),'utf8');
 assert.match(arena,/locale-sections-v247/);
 assert.match(arena,/tx\('botMatch'\)/);
 assert.match(arena,/tx\('liveMatch'\)/);
 assert.doesNotMatch(arena,/data-guest-login/);
});
