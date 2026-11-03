import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {ITEM_LORE_NATIVE,nativeItemDescription,auditItemLore} from './locale-item-lore-v247.js';
import {ITEM_DISPLAY_EN,displayItem} from './locale-items-v246.js';
import {ITEMS,createState} from './rules.js';
const twelve=SUPPORTED_LOCALES.filter(x=>!['tr','en'].includes(x));
test('all nineteen item explanations have native translations in twelve additional languages',()=>{
 assert.deepEqual(Object.keys(ITEM_LORE_NATIVE).sort(),[...twelve].sort());
 assert.deepEqual(auditItemLore(),[]);
 for(const lang of twelve){
  assert.deepEqual(Object.keys(ITEM_LORE_NATIVE[lang]).sort(),ITEMS.map(x=>x.id).sort(),lang);
  for(const [id,description] of Object.entries(ITEM_LORE_NATIVE[lang])){
   assert.ok(typeof description==='string'&&description.length>15,lang+': '+id);
   assert.doesNotMatch(description,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('inventory and crafting display native item descriptions but keep 19 item identities, stats and costs',()=>{
 const game=createState(Date.UTC(2026,10,3,9)),baseline=JSON.stringify(game);
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   assert.equal(getLocale(),locale);
   for(const item of ITEMS){
    const display=displayItem(item);
    assert.equal(display.id,item.id);
    assert.equal(display.cost,item.cost);
    assert.equal(display.stats,item.stats);
    assert.equal(display.slot,item.slot);
    assert.equal(display.rarity,item.rarity);
    assert.equal(display.forge,item.forge);
    assert.equal(display.description,locale==='tr'?item.description:locale==='en'?ITEM_DISPLAY_EN[item.id].description:nativeItemDescription(item.id));
   }
   assert.equal(JSON.stringify(game),baseline,locale);
  }
 }finally{setLocale('tr');}
});
test('native lore files are presentation-only and cannot award currencies',()=>{
 for(const file of ['locale-item-lore-eu-v247.js','locale-item-lore-asia-v247.js','locale-item-lore-v247.js']){
  const src=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.doesNotMatch(src,/supabase|localStorage\.setItem|fetch\(|\.res\s*=|\.inventory\s*=/);
 }
});
