import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {ITEM_NAMES,localizedItemName,localizedSetName} from './locale-item-names-v247.js';
import {displayItem,displayMaterial,displaySetName,ITEM_DISPLAY_EN} from './locale-items-v246.js';
import {ITEMS,createState} from './rules.js';
import {armoryMarkup} from './armory-v212.js';
const ids=ITEMS.map(x=>x.id),sets=['moon','ember','dawn'];
test('all 19 canonical items and 3 named sets are translated across 14 languages',()=>{
 assert.equal(ids.length,19);
 assert.deepEqual(Object.keys(ITEM_NAMES).sort(),[...SUPPORTED_LOCALES].sort());
 for(const locale of SUPPORTED_LOCALES){
  assert.deepEqual(Object.keys(ITEM_NAMES[locale].names).sort(),[...ids].sort(),locale);
  assert.deepEqual(Object.keys(ITEM_NAMES[locale].sets).sort(),sets.sort(),locale);
  for(const value of Object.values(ITEM_NAMES[locale].names)){
   assert.ok(value.trim(),locale);assert.doesNotMatch(value,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('localized item names, sets and resource cards never alter the server-owned gear and material values',()=>{
 const save=createState(Date.UTC(2026,10,3,12)),before=JSON.stringify(save);
 try{
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   assert.equal(getLocale(),language);
   for(const item of ITEMS){
    const view=displayItem(item);
    assert.equal(view.id,item.id);
    assert.equal(view.slot,item.slot);
    assert.equal(view.rarity,item.rarity);
    assert.equal(view.stats,item.stats);
    assert.equal(view.cost,item.cost);
    assert.equal(view.name,language==='tr'?item.name:localizedItemName(item.id));
   }
   for(const id of sets)assert.ok(displaySetName(id,'Set adı').trim());
   assert.equal(JSON.stringify(save),before,language);
   const markup=armoryMarkup(save,'aldren','owned','iron_sword');
   assert.ok(markup.includes(language==='tr'?'Yemin Kılıcı':localizedItemName('iron_sword')));
   assert.ok(markup.includes('data-equip="iron_sword"'));
  }
  setLocale('de');assert.equal(displayItem(ITEMS[0]).name,'Schwert des Eids');
  setLocale('ja');assert.equal(displaySetName('moon','Ay Siperleri'),'月の守護者');
  setLocale('tr');assert.equal(displayItem(ITEMS[0]),ITEMS[0]);
  setLocale('en');assert.equal(displayItem(ITEMS[0]).description,ITEM_DISPLAY_EN.iron_sword.description);
 }finally{setLocale('tr');}
});
