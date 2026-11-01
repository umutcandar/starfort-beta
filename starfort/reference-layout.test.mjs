import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {armoryMarkup} from './armory-v212.js';

const css=readFileSync(new URL('./reference-layout.css',import.meta.url),'utf8');
const page=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');

test('reference navigation retains six real selectable game sections',()=>{
 for(const token of ["['keep', 'keep', 'Köy']","['expedition', 'expedition', 'Seferler']",
  "['heroes', 'heroes', 'Kahramanlar']","['armory', 'armor', 'Çanta']",
  "['guild', 'guild', 'İttifak']","['shop', 'shop', 'Mağaza']"])
  assert.ok(app.includes(token),token);
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(page,/reference-layout\.css/);
});
test('village next-sefer panel stays data-driven with live battle actions',()=>{
 for(const term of ['quest-crown','quest-layout','quest-illustration',
  'quest-rewards','quest-reward-token','quest-power','data-action="open-expedition"'])
  assert.ok(app.includes(term),term);
 assert.ok(app.includes('R.teamPower(state)'));
 assert.ok(app.includes('Object.entries(stage.reward)'));
 assert.ok(app.includes("data-stage="));
 assert.match(css,/\.next-quest\s*\{/);
});
test('quest card starts closed and can be explicitly opened and dismissed',()=>{
  assert.match(page,/id="quest-mini" data-quest-toggle/);
  assert.match(page,/id="next-quest"[^>]*hidden/);
  assert.match(css,/#next-quest\[hidden\],#quest-mini\[hidden\]/);
  assert.match(app,/let questPanelExpanded=false/);
  assert.match(app,/questEl\.hidden=!expanded/);
  assert.match(app,/data-quest-close/);
  assert.match(app,/data-quest-toggle/);
  assert.match(app,/questPanelExpanded=button\.dataset\.view==='expedition'/);
});
test('bag renders all four screenshot columns with a real detail panel',()=>{
 const state=R.createState(Date.UTC(2026,10,1));
 const html=armoryMarkup(state,'aldren','all','iron_sword');
 assert.match(html,/class="armory-v212"/);
 for(const cls of ['bag-v212-roster','bag-v212-character','bag-v212-right','bag-v212-detail'])
  assert.ok(html.includes(cls),cls);
 assert.ok(html.indexOf('bag-v212-roster')<html.indexOf('bag-v212-character'));
 assert.ok(html.indexOf('bag-v212-character')<html.indexOf('bag-v212-right'));
 assert.ok(html.lastIndexOf('bag-v212-detail')>html.indexOf('bag-v212-right'));
 assert.match(html,/data-bag-slot="all" aria-pressed="true"/);
 for(const slot of ['Silah','Zırh','Tılsım']) assert.ok(html.includes(slot));
 for(const item of ['starbreaker','ashes_plate','guardian_seal'])
  assert.ok(html.includes('data-bag-item="'+item+'"'),item);
});
test('screenshot-inspired gear is real, forgeable and combat-ready',()=>{
 const state=R.createState(Date.UTC(2026,10,1));
 const original=R.heroStats(state,'aldren');
 for(const name of ['Yıldızkıran Kılıç','Küllerin Zırhı','Koruyucu Mühür'])
  assert.ok(R.ITEMS.some(x=>x.name===name),name);
 state.buildings.forge=6;state.buildings.keep=6;
 for(const k of Object.keys(state.res))state.res[k]=10000;
 for(const id of ['starbreaker','ashes_plate','guardian_seal']){
  assert.equal(R.forgeItem(state,id).ok,true,id);
  assert.equal(R.equipItem(state,'aldren',id).ok,true,id);
 }
 assert.equal(state.loadouts.aldren.weapon,'starbreaker');
 assert.equal(state.loadouts.aldren.armor,'ashes_plate');
 assert.equal(state.loadouts.aldren.relic,'guardian_seal');
 assert.ok(R.heroStats(state,'aldren').attack>original.attack);
 const after=R.restoreState(JSON.stringify(state));
 assert.deepEqual(after.loadouts.aldren,state.loadouts.aldren);
});
test('bag materials reflect real saved resource totals and selectable details',()=>{
 const state=R.createState(Date.UTC(2026,10,1));
 state.res.aether=7360;state.res.stone=96200;
 const all=armoryMarkup(state,'aldren','all','material:aether');
 assert.match(all,/data-bag-item="material:aether"/);
 assert.match(all,/data-bag-item="material:wood"/);
 assert.match(all,/7\.360/);
 assert.match(all,/Mevcut miktar/);
 assert.doesNotMatch(all,/data-equip="material:/);
 const materials=armoryMarkup(state,'aldren','materials');
 assert.match(materials,/Yıldız Özü/);
 assert.doesNotMatch(materials,/data-bag-item="iron_sword"/);
});
test('reference CSS keeps narrow and short landscape layouts usable',()=>{
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(orientation:landscape\) and \(max-height:600px\)/);
 assert.match(css,/overflow-y:auto/);
 assert.match(css,/prefers-reduced-motion/);
});
