import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as R from './rules.js';
import {buildingUpgradePlan,buildingRoadmap,upgradeEffect} from './building-planner.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
const NOW=Date.UTC(2026,10,2,12);
const clone=v=>JSON.parse(JSON.stringify(v));
const scene=()=>R.createState(NOW);
const render=(state,id,now=NOW)=>buildingWorkshopMarkup(state,id,{now,icon:x=>'<svg data-icon="'+x+'"></svg>',number:n=>String(n)});

test('all seven buildings have accurate level, current effect and next upgrade costs without mutating saves',()=>{
 const state=scene(),before=clone(state);
 const roadmap=buildingRoadmap(state,NOW);
 assert.equal(roadmap.plans.length,R.BUILDINGS.length);
 for(const p of roadmap.plans){
  assert.equal(p.level,1);assert.equal(p.nextLevel,2);
  assert.deepEqual(p.cost,R.upgradeCost(state,p.id));
  assert.deepEqual(p.current,upgradeEffect(state,p.building,p.level));
  assert.ok(p.progress>=0&&p.progress<=100);
  const html=render(state,p.id);
  assert.match(html,/ws-building-list/);assert.match(html,/building-art-comparison/);
  assert.match(html,/data-building-preview="1"/);
  assert.match(html,/data-building-preview="2"/);
  assert.match(html,/YATIRIM PLANI/);
  assert.ok(html.includes(p.building.name));
 }
 assert.deepEqual(state,before);
});

test('production-aware upgrade is atomic on shortage and blocked during battle or keep cap',()=>{
 const state=scene();state.res={gold:0,wood:0,stone:0,aether:0};
 const original=clone(state);
 assert.equal(R.upgradeBuildingFromProduction(state,'keep',NOW).ok,false);
 assert.deepEqual(state,original);
 assert.equal(R.upgradeBuildingFromProduction(state,'fake',NOW+1000).ok,false);
 assert.deepEqual(state,original);
 state.buildings.farm=2;state.buildings.keep=1;
 assert.equal(R.upgradeBuildingFromProduction(state,'farm',NOW+300000).ok,false);
 assert.deepEqual(state.buildings.farm,2);
 state.buildings.farm=1;
 state.battle={status:'active'};
 const active=clone(state);
 assert.equal(R.upgradeBuildingFromProduction(state,'farm',NOW+300000).ok,false);
 assert.deepEqual(state,active);
});

test('collect + upgrade accepts stored production and changes only the intended building',()=>{
 const state=scene();
 state.res={gold:5,wood:5,stone:0,aether:0};
 state.buildings.keep=2;
 const later=NOW+50*60000;
 const b=buildingUpgradePlan(state,'farm',later);
 assert.equal(b.status,'collect');
 assert.equal(b.level,1);
 assert.ok(b.available.gold>=b.cost.gold);
 const remaining=clone(state);
 const outcome=R.upgradeBuildingFromProduction(state,'farm',later);
 assert.equal(outcome.ok,true);
 assert.equal(state.buildings.farm,2);
 assert.equal(state.buildings.keep,remaining.buildings.keep);
 assert.equal(state.lastCollected,later);
 assert.ok(state.res.gold>=0&&state.res.wood>=0);
 assert.equal(buildingUpgradePlan(state,'farm',later).level,2);
});

test('workshop shows collect action or locks the level behind keep with explicit navigation',()=>{
 const s=scene();
 s.buildings.keep=1;s.buildings.farm=2;
 const b=buildingUpgradePlan(s,'farm',NOW);
 assert.equal(b.status,'locked');
 assert.match(render(s,'farm'),/data-workshop-keep/);
 s.buildings.keep=20;s.buildings.farm=20;
 assert.equal(buildingUpgradePlan(s,'farm',NOW).status,'maxed');
 assert.doesNotMatch(render(s,'farm'),/data-upgrade-building="farm"/);
 assert.equal(buildingUpgradePlan(s,'nonexistent',NOW),null);
 s.buildings.farm=1;
 s.res={gold:0,wood:0,stone:0,aether:0};
 assert.equal(buildingUpgradePlan(s,'farm',NOW).status,'short');
 const eta=buildingUpgradePlan(s,'farm',NOW).etaMinutes;
 assert.ok(eta===null||eta>=1);
});

test('source wires accessible village tabs, collect-and-build, preserves modal, CSS and scene previews',()=>{
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('./building-workshop.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(app,/import \{buildingWorkshopMarkup\}/);
 assert.match(app,/upgradeBuildingFromProduction\(state,id,now/);
 assert.match(app,/button\.dataset\.planBuilding/);
 assert.match(app,/button\.dataset\.collectUpgrade/);
 assert.doesNotMatch(app,/if \(upgraded\.ok\) \$\('#building-dialog'\)\.close/);
 assert.match(css,/@media\(max-width:730px\)/);
 assert.match(css,/@media\(orientation:landscape\)/);
 assert.match(html,/href="building-workshop\.css"/);
 assert.match(html,/v2\.24\.0/);
});
