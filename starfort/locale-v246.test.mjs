import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {ARMORY_TRANSLATIONS,ARMORY_KEYS,armoryText} from './locale-armory-v246.js';
import {ITEM_DISPLAY_EN,displayItem,displayMaterial,displaySetName} from './locale-items-v246.js';
import {ITEMS,createState,equipmentStats} from './rules.js';
import {armoryMarkup,previewGearDifference} from './armory-v212.js';
import {HERO_DISPLAY_EN} from './locale-heroes-v245.js';
const fixedTime=Date.UTC(2026,10,3,10,0,0);
test('inventory has 34 real labels for every one of the 14 selectable languages',()=>{
 assert.equal(ARMORY_KEYS.length,34);
 assert.deepEqual(Object.keys(ARMORY_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 for(const locale of SUPPORTED_LOCALES){
  const catalog=ARMORY_TRANSLATIONS[locale];
  assert.deepEqual(Object.keys(catalog).sort(),[...ARMORY_KEYS].sort(),locale);
  for(const [key,v] of Object.entries(catalog)){
   assert.equal(typeof v,'string');
   assert.ok(v.trim().length,locale+': '+key);
   assert.doesNotMatch(v,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('all nineteen canonical gear items have English fallback names and descriptions, preserving statistics',()=>{
 assert.equal(ITEMS.length,19);
 assert.deepEqual(Object.keys(ITEM_DISPLAY_EN).sort(),ITEMS.map(item=>item.id).sort());
 try{
  setLocale('en');
  for(const item of ITEMS){
   const view=displayItem(item);
   assert.equal(view.id,item.id);
   assert.equal(view.slot,item.slot);
   assert.equal(view.rarity,item.rarity);
   assert.equal(view.cost,item.cost);
   assert.equal(view.stats,item.stats);
   assert.equal(view.name,ITEM_DISPLAY_EN[item.id].name);
   assert.equal(view.description,ITEM_DISPLAY_EN[item.id].description);
   assert.notEqual(view.name,item.name);
  }
  assert.equal(displaySetName('moon','Ay Siperleri'),'Moon Wardens');
  setLocale('tr');
  for(const item of ITEMS)assert.equal(displayItem(item),item,'Turkish should reuse canonical item object');
 }finally{setLocale('tr');}
});
test('each selected language produces its own inventory headings without changing game progress',()=>{
 const state=createState(fixedTime), before=JSON.stringify(state),hero='aldren';
 const originalPower=equipmentStats(state,hero);
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   const html=armoryMarkup(state,hero,'owned','iron_sword');
   assert.equal(getLocale(),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].title),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].autoEquip),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].equip),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].inventory),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].weapon),locale);
   assert.ok(html.includes(ARMORY_TRANSLATIONS[locale].selectedDetails),locale);
   assert.match(html,/data-bag-item="iron_sword"/);
   assert.match(html,/data-equip="iron_sword"/);
   assert.match(html,/data-forge="iron_sword"/);
   assert.match(html,/data-auto-equip="aldren"/);
   assert.match(html,/data-bag-slot="owned"/);
   assert.doesNotMatch(html,/data-welcome="guest"/);
   assert.equal(JSON.stringify(state),before,locale+' read-only screen mutated the player save');
   assert.deepEqual(equipmentStats(state,hero),originalPower);
  }
  setLocale('es');
  assert.match(armoryMarkup(state,hero,'owned','iron_sword'),/Oath Sword/,'untranslated item lore falls back to English');
  setLocale('ar');
  assert.match(armoryMarkup(state,hero,'materials','material:gold'),/مخزوني/);
  assert.match(armoryMarkup(state,hero,'materials','material:gold'),/Gold/,'materials use English fallback until full translated names exist');
 }finally{setLocale('tr');}
});
test('English hero and inventory UI do not localize canonical action identifiers',()=>{
 const state=createState(fixedTime);
 try{
  setLocale('ja');
  const ui=armoryMarkup(state,'aldren','owned','iron_sword');
  assert.match(ui,/持ち物と装備/);
  assert.match(ui,/Oath Sword/);
  assert.match(ui,/data-equip="iron_sword"/);
  assert.match(ui,/data-unequip="weapon"|data-equip="iron_sword"/);
  assert.equal(previewGearDifference(state,'aldren','iron_sword').attack,4);
  assert.ok(HERO_DISPLAY_EN.aldren);
  assert.equal(armoryText('nonexistent_key'),'nonexistent_key');
 }finally{setLocale('tr');}
});
test('static internationalization audit generates partial coverage report and passes strict inventory guard',()=>{
 const txt=execFileSync(process.execPath,['scripts/i18n-coverage.mjs','--check'],{cwd:new URL('.',import.meta.url),encoding:'utf8'});
 const report=JSON.parse(txt);
 assert.equal(report.errors.length,0);
 assert.equal(report.verifiedPacks.armory.languages,14);
 assert.equal(report.verifiedPacks.armory.keysPerLanguage,34);
 assert.equal(report.verifiedPacks.dailyRewards.languages,14);
 assert.equal(report.verifiedPacks.gearEnglishFallback.translated,19);
 assert.ok(report.staticUiCandidates.some(row=>row.file==='arena-view.js'));
 assert.ok(report.staticUiCandidates.find(row=>row.file==='armory-v212.js').strict);
 assert.equal(report.staticUiCandidates.find(row=>row.file==='armory-v212.js').candidateVisibleTurkishFragments,0);
 assert.match(report.caveat,/partial/);
});
test('presentation modules do not write to the server or replace inventory rules',()=>{
 for(const path of ['locale-armory-v246.js','locale-items-v246.js']){
  const file=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(file,/localStorage\.setItem|fetch\(|guildRequest|supabase|\.inventory\s*=/);
 }
});
