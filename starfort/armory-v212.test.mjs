import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {armoryMarkup,previewGearDifference} from './armory-v212.js';

test('armory exposes every owned item in a selectable, accessible RPG grid',()=>{
 const state=R.createState();
 const html=armoryMarkup(state,'aldren','owned','iron_sword');
 assert.match(html,/Çanta ve Donanım/);
 assert.match(html,/class="armory-v212"/);
 assert.match(html,/data-bag-slot="owned"/);
 assert.match(html,/data-bag-item="iron_sword"/);
 assert.match(html,/data-bag-item="ward_mail"/);
 assert.match(html,/data-equip="iron_sword"/);
 assert.match(html,/data-forge="iron_sword"/);
 assert.match(html,/data-armory-hero="aldren"/);
 assert.match(html,/data-close-view/);
 assert.match(html,/aria-pressed="true"/);
 assert.doesNotMatch(html,/data-bag-item="moonheart"/);
});
test('empty set filter is a safe UI state; all filter includes all gear',()=>{
 const state=R.createState();
 assert.match(armoryMarkup(state,'aldren','set'),/data-bag-item="moon_watch"/);
 assert.match(armoryMarkup(state,'aldren','all'),/data-bag-item="moonheart"/);
 assert.match(armoryMarkup(state,'aldren','all'),/disabled/);
});
test('equipment preview includes actual set effects and does not mutate any save',()=>{
 const state=R.createState();
 const before=JSON.stringify(state);
 assert.equal(previewGearDifference(state,'aldren','iron_sword').attack,4);
 assert.equal(JSON.stringify(state),before);
 state.inventory.moon_watch=1;state.inventory.lunar_charm=1;
 assert.equal(R.equipItem(state,'aldren','moon_watch').ok,true);
 const preview=previewGearDifference(state,'aldren','lunar_charm');
 assert.equal(preview.hp,33);
 assert.equal(preview.armor,2);
 assert.equal(preview.healing,6);
 assert.equal(previewGearDifference(state,'unknown','iron_sword'),null);
});
test('combat locks item edits but still permits reading the bag',()=>{
 const state=R.createState();
 assert.equal(R.startBattle(state,1).ok,true);
 const html=armoryMarkup(state,'aldren','owned','iron_sword');
 assert.match(html,/data-equip="iron_sword" disabled/);
 assert.match(html,/Savaş sürerken ekipman değiştirilemez/);
});
