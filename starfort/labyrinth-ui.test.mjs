import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {PREMIUM_PVE_CONCEPTS,premiumCatalogMarkup} from './premium-catalog.js';
const file=name=>readFileSync(new URL(name,import.meta.url),'utf8');
test('all eight campaign chapters grow in recommended power and grant first-clear hero gear',()=>{
 const powers=R.STAGES.map(s=>s.recommendedPower);
 assert.deepEqual(powers,[...powers].sort((a,b)=>a-b));
 for(let id=1;id<=8;id++){
  assert.ok(R.FIRST_CLEAR_LOOT[id],'missing first-clear item on '+id);
  assert.ok(R.itemById(R.FIRST_CLEAR_LOOT[id]),'missing gear definition on '+id);
 }
 const s=R.createState(Date.UTC(2026,9,30,12));
 for(let id=1;id<=8;id++){
  R.startBattle(s,id);
  s.battle.enemies.forEach(e=>e.hp=0);
  R.battleTurn(s,'strike');
  assert.equal(s.battle.status,'won');
  assert.equal(s.inventory[R.FIRST_CLEAR_LOOT[id]],1);
 }
});
test('navigation links story, maze, bag and disabled premium catalog',()=>{
 const app=file('./app.js'),html=file('./index.html'),bag=file('./bag.css'),armory=file('./armory-v212.js');
 assert.match(app,/data-labyrinth-open/);
 assert.match(app,/data-labyrinth-complete/);
 assert.match(app,/labyrinthMarkup\(state\)/);
 assert.match(armory,/Çanta ve Donanım/);
 assert.match(app,/selectedBagSlot = 'all'/);
 assert.match(armory,/data-bag-slot/);
 assert.match(app,/premiumCatalogMarkup\(\)/);
 assert.match(bag,/\.bag-hero-display/);
 for(const css of ['labyrinth.css','bag.css','v212-visuals.css'])assert.ok(html.includes('href="'+css+'"'));
});
test('premium items are visible concepts only, no payment or client-side grant',()=>{
 assert.equal(PREMIUM_PVE_CONCEPTS.length,3);
 const html=premiumCatalogMarkup();
 assert.equal((html.match(/disabled>Satın alma henüz açık değil/g)||[]).length,3);
 for(const item of PREMIUM_PVE_CONCEPTS){
  assert.ok(html.includes(item.name));
  assert.ok(html.includes(item.stats));
  assert.equal(R.itemById(item.id),undefined);
 }
 assert.match(html,/para çekilmez/);
 assert.doesNotMatch(html,/(checkout|credit-card|data-buy|payment-url)/i);
});
