import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS} from './equipment.js';
import {ITEM_GLYPHS,armoryArt} from './armory-art.js';
test('all real weapons, armour and relics have distinct bespoke icons',()=>{
 assert.equal(ITEMS.length,14);
 assert.deepEqual(Object.keys(ITEM_GLYPHS).sort(),ITEMS.map(i=>i.id).sort());
 assert.equal(new Set(Object.values(ITEM_GLYPHS)).size,ITEMS.length);
 for(const item of ITEMS){
  const svg=armoryArt(item);
  assert.match(svg,/^<svg/);
  assert.match(svg,/<\/svg>$/);
  assert.doesNotMatch(svg,/undefined|<script/);
 }
});
test('unknown equipment displays a safe generic illustration',()=>{
 assert.match(armoryArt({id:'strange',rarity:'unknown'}),/<svg/);
});
