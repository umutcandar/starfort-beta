import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ART_PLOTS,architectureForLevel} from './city-art-layout.js';
import {MASTERY_START_LEVEL,MASTERY_ARCHITECTURE,MASTERY_PALETTE,masteryArchitectureForLevel} from './mastery-architecture.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
import * as R from './rules.js';
const NOW=Date.UTC(2026,10,2,12);
const render=(s,id)=>buildingWorkshopMarkup(s,id,{icon:()=>'<svg></svg>',number:String,now:NOW});
test('new architectural era starts at 10 not 9 for every building',()=>{
 assert.equal(MASTERY_START_LEVEL,10);
 assert.equal(MASTERY_ARCHITECTURE.length,11);
 assert.deepEqual(MASTERY_ARCHITECTURE.map(x=>x.level),Array.from({length:11},(_,i)=>i+10));
 for(const id of R.BUILDINGS.map(x=>x.id)){
  assert.deepEqual(masteryArchitectureForLevel(id,8),[]);
  assert.deepEqual(masteryArchitectureForLevel(id,9),[]);
  assert.deepEqual(architectureForLevel(id,9),architectureForLevel(id,8),'level nine retains the original facade');
  assert.equal(masteryArchitectureForLevel(id,10).length,1);
  assert.equal(masteryArchitectureForLevel(id,20).length,11);
  const full=masteryArchitectureForLevel(id,20);
  for(let level=10;level<=20;level++){
   const steps=masteryArchitectureForLevel(id,level);
   assert.deepEqual(steps,full.slice(0,level-9),'previous architecture remains intact');
   assert.equal(steps.at(-1).level,level);
  }
  assert.ok(MASTERY_PALETTE[id]);
 }
});
test('all mastery ornaments stay within the village drawing bounds, have unique shapes and stable metadata',()=>{
 const shapes=new Set(MASTERY_ARCHITECTURE.map(x=>x.shape));
 assert.equal(shapes.size,11,'each level is a distinct architectural component');
 for(const id of Object.keys(ART_PLOTS)){
  const [x,y,w,h]=ART_PLOTS[id].bounds;
  const ornaments=masteryArchitectureForLevel(id,20);
  for(const o of ornaments){
   assert.ok(o.x>=x&&o.x<=x+w,id+' x out of bounds');
   assert.ok(o.y>=y&&o.y<=y+h,id+' y out of bounds');
   assert.ok(o.y-o.height*1.5>=0,id+' ornament may not leave world');
   assert.ok(o.accent.startsWith('#')&&o.highlight.startsWith('#')&&o.base.startsWith('#'));
  }
  const baseline=masteryArchitectureForLevel(id,20);
  ornaments[0].x=-900;
  assert.deepEqual(masteryArchitectureForLevel(id,20),baseline,'ornament records must not share mutable refs');
 }
 assert.deepEqual(masteryArchitectureForLevel('missing',20),[]);
 assert.deepEqual(masteryArchitectureForLevel('__proto__',20),[]);
 for(const invalid of [null,undefined,NaN,Infinity,-1,0])assert.deepEqual(masteryArchitectureForLevel('keep',invalid),[]);
});
test('building UI previews levels 9 and 10 side by side without falsely claiming changes at nine',()=>{
 const state=R.createState(NOW);
 state.buildings.keep=9;
 const html=render(state,'keep');
 assert.match(html,/data-building-preview="9"/);
 assert.match(html,/data-building-preview="10"/);
 assert.match(html,/Ustalık sancağı/);
 assert.match(html,/Yeni çizilen mimari parça/);
 state.buildings.keep=8;
 const eight=render(state,'keep');
 assert.match(eight,/data-building-preview="8"/);
 assert.match(eight,/data-building-preview="9"/);
 assert.match(eight,/9\. seviyede mevcut görünüm korunur/);
 state.buildings.keep=20;
 const twenty=render(state,'keep');
 assert.match(twenty,/data-building-preview="20"/);
 assert.doesNotMatch(twenty,/data-building-preview="21"/);
 assert.match(twenty,/Tüm 11 ustalık mimari eklentisi açıldı/);
});
test('real map and popup share the same architectural renderer, no fake stage or unsupported asset',()=>{
 const script=readFileSync(new URL('./illustrated-scene.js',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('./mastery-art-renderer.js',import.meta.url),'utf8');
 assert.match(script,/paintMasteryArchitecture\(context,levels\)/);
 assert.match(script,/paintArchitecture\(ctx,assets,\{\[id\]:level\}\)/);
 assert.match(script,/masteryArchitectureForLevel\(upgrade.id/);
 for(const shape of MASTERY_ARCHITECTURE.map(x=>x.shape))assert.match(renderer,new RegExp("case '"+shape+"'"));
 assert.doesNotMatch(renderer,/document\.|window\.|fetch\(/);
});
