import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ART_SIZE, ART_PLOTS, ART_UPGRADES, ART_EVOLUTION, ATLAS_SIZE, ATLAS_RECTS,
  architectureForLevel, viewportTransform, worldToScreen, screenToWorld,
  insidePolygon, pickBuilding,
} from './city-art-layout.js';
import { placeCityLabels } from './city-layout.js';
import * as R from './rules.js';

const ids = R.BUILDINGS.map(building => building.id);
const sizes = [[320,479], [390,692], [667,271], [667,375], [844,286], [844,390], [932,430], [1440,900]];
const levelsAt = level => Object.fromEntries(ids.map(id => [id,level]));
const close = (actual, expected, label) => assert.ok(Math.abs(actual-expected)<1e-8, `${label}: ${actual} ≠ ${expected}`);
const deepFreeze = value => {
  for (const child of Object.values(value)) if (child && typeof child==='object') deepFreeze(child);
  return Object.freeze(value);
};

test('illustrated buildings retain every saved ID and valid authored picking regions', () => {
  for (const catalogue of [ART_PLOTS,ART_UPGRADES,ART_EVOLUTION]) assert.deepEqual(Object.keys(catalogue).sort(), [...ids].sort());
  for (const [id,plot] of Object.entries(ART_PLOTS)) {
    assert.ok(insidePolygon(plot.center,plot.polygon), `${id}: visible building center is selectable`);
    assert.ok(plot.polygon.length>=3);
    for (const [x,y] of [...plot.polygon,plot.anchor,plot.center]) {
      assert.ok(Number.isFinite(x)&&Number.isFinite(y));
      assert.ok(x>=0&&x<=ART_SIZE.width&&y>=0&&y<=ART_SIZE.height, `${id}: authored point stays in panorama`);
    }
  }
  for (const [x,y,width,height] of ATLAS_RECTS) {
    assert.ok([x,y,width,height].every(Number.isFinite));
    assert.ok(x>=0&&y>=0&&width>0&&height>0);
    assert.ok(x+width<=ATLAS_SIZE&&y+height<=ATLAS_SIZE, 'sprite crop remains inside source atlas');
  }
});

test('zoom and extreme dragging never expose space outside the panorama', () => {
  for (const [width,height] of sizes) for (const zoom of [.2,1,1.7,2.8,20]) {
    for (const pan of [{x:0,y:0},{x:1e6,y:1e6},{x:-1e6,y:-1e6},{x:317,y:-249}]) {
      const original={...pan},view=viewportTransform(width,height,zoom,Object.freeze(pan));
      assert.ok(Object.values(view).every(Number.isFinite));
      assert.ok(view.scale>0);
      const first=worldToScreen([0,0],view),last=worldToScreen([ART_SIZE.width,ART_SIZE.height],view);
      assert.ok(first.x<=1e-8&&first.y<=1e-8, 'top and left remain covered');
      assert.ok(last.x>=width-1e-8&&last.y>=height-1e-8, 'bottom and right remain covered');
      for (const corner of [{x:0,y:0},{x:width,y:height}]) {
        const [x,y]=screenToWorld(corner,view);
        assert.ok(x>=-1e-8&&x<=ART_SIZE.width+1e-8&&y>=-1e-8&&y<=ART_SIZE.height+1e-8);
      }
      assert.deepEqual(pan,original, 'camera inputs are not mutated');
    }
    close(viewportTransform(width,height,.2).scale,viewportTransform(width,height,1).scale,'minimum zoom');
    close(viewportTransform(width,height,20).scale,viewportTransform(width,height,2.8).scale,'maximum zoom');
  }
  const collapsed=viewportTransform(0,0);
  assert.ok(Object.values(collapsed).every(Number.isFinite), 'initial zero-sized canvas has a usable transform');
});

test('taps retain the intended building after phone and desktop pan/zoom transforms', () => {
  for (const [width,height] of sizes) for (const zoom of [1,1.65,2.8]) {
    for (let level=1;level<=8;level++) {
      const levels=Object.freeze(levelsAt(level));
      for (const [id,plot] of Object.entries(ART_PLOTS)) {
        const baseline=viewportTransform(width,height,zoom);
        // Centre this building where possible, like focusing after a label tap.
        const pan={x:width/2-plot.center[0]*baseline.scale-baseline.x,y:height/2-plot.center[1]*baseline.scale-baseline.y};
        const view=Object.freeze(viewportTransform(width,height,zoom,pan));
        const screen=Object.freeze(worldToScreen(Object.freeze([...plot.center]),view));
        assert.ok(screen.x>=0&&screen.x<=width&&screen.y>=0&&screen.y<=height, `${id}: focus exposes its tap target`);
        const world=screenToWorld(screen,view);
        close(world[0],plot.center[0],`${id}: inverse x`);
        close(world[1],plot.center[1],`${id}: inverse y`);
        assert.equal(pickBuilding(world,levels),id, `${width}×${height}, zoom ${zoom}, level ${level}: ${id}`);
      }
    }
  }
});

test('phone landscape labels keep all seven buildings reachable around the live HUD', () => {
  const width=844,height=390,topHud=54;
  const view=viewportTransform(width,height-topHud);view.y+=topHud;view.height=height;
  const points=Object.entries(ART_PLOTS).map(([id,plot])=>({id,...worldToScreen(plot.anchor,view),width:130,height:28,visible:true}));
  // Bounds measured from the landscape-first HUD: top resources, bottom navigation,
  // heading, quest, resource collection and the right-hand map controls.
  const obstacles=[
    {x:422,y:27,width:844,height:54}, {x:422,y:365,width:844,height:50},
    {x:423,y:89,width:814,height:50}, {x:678,y:86,width:210,height:43},
    {x:99,y:304,width:170,height:50}, {x:812,y:195,width:36,height:170},
  ];
  const labels=placeCityLabels(points,width,height,obstacles);
  assert.equal(labels.length,7,'every saved building remains available without opening the list');
  const intersects=(a,b)=>a.x-a.width/2<b.x+b.width/2&&a.x+a.width/2>b.x-b.width/2&&a.y<b.y+b.height&&a.y+a.height>b.y;
  for(const label of labels) {
    assert.ok(label.y>=0&&label.y+label.height<=height, `${label.id}: stays on screen`);
    assert.ok(obstacles.every(obstacle=>!intersects(label,obstacle)),`${label.id}: stays clear of a HUD control`);
  }
});

test('every upgrade adds visible architecture cumulatively without clipping the source or world', () => {
  for (const id of ids) {
    let previous=[];
    const variants=new Set();
    for (let level=1;level<=8;level++) {
      const parts=architectureForLevel(id,level);
      assert.deepEqual(parts.slice(0,previous.length),previous, `${id} level ${level}: existing structures stay`);
      if (level>1) {
        assert.ok(parts.length>previous.length, `${id} level ${level}: new structure added`);
        assert.ok(parts.slice(previous.length).every(part=>part.level===level));
      }
      assert.equal(typeof ART_EVOLUTION[id][level-1],'string');
      assert.ok(ART_EVOLUTION[id][level-1].trim());
      for (const part of parts) {
        assert.equal(part.id,id);
        assert.ok(Number.isInteger(part.sprite)&&ATLAS_RECTS[part.sprite]);
        assert.ok([part.x,part.y,part.width].every(Number.isFinite)&&part.width>0);
        const crop=ATLAS_RECTS[part.sprite],height=part.width*crop[3]/crop[2];
        assert.ok(part.x-part.width/2>=0&&part.x+part.width/2<=ART_SIZE.width, `${id}: sprite stays horizontally in world`);
        assert.ok(part.y-height>=0&&part.y<=ART_SIZE.height, `${id}: sprite stays vertically in world`);
      }
      variants.add(JSON.stringify(parts));
      previous=parts;
    }
    assert.equal(variants.size,8, `${id}: all eight level appearances differ`);
  }
});

test('added structures are selectable, including extensions outside the original building footprint', () => {
  const levels=Object.freeze(levelsAt(8));
  let extensions=0;
  for (const id of ids) for (const part of architectureForLevel(id,8)) {
    const crop=ATLAS_RECTS[part.sprite],height=part.width*crop[3]/crop[2];
    const point=[part.x,part.y-height*.3];
    assert.equal(pickBuilding(point,levels),id, `${id} level ${part.level}: clicking the extension selects its owner`);
    if (pickBuilding(point)!==id) extensions++;
  }
  assert.ok(extensions>0, 'test includes structures extending beyond the original baked building');
  for (const point of [[0,0],[1918,0],[0,819],[1918,819],[-50,400],[2000,400]]) {
    assert.equal(pickBuilding(point,levels),null, 'empty terrain cannot open an unrelated building');
  }
});

test('invalid building IDs and levels do not create architecture or share mutable definitions', () => {
  for (const id of ['missing','__proto__','constructor',null,undefined]) assert.deepEqual(architectureForLevel(id,8),[]);
  for (const id of ids) {
    for (const level of [undefined,null,NaN,-5,0,1]) assert.deepEqual(architectureForLevel(id,level),[]);
    assert.deepEqual(architectureForLevel(id,100),architectureForLevel(id,8));
    const expected=architectureForLevel(id,8),mutated=architectureForLevel(id,8);
    mutated[0].x=-999; mutated.push({id:'foreign'});
    assert.deepEqual(architectureForLevel(id,8),expected, 'returned presentation data does not expose shared mutable records');
  }
});

test('reading illustrated city state preserves an existing save, including heroes, gear and battle', () => {
  const now=Date.UTC(2026,9,31,12),seed=R.createState(now);
  seed.res={gold:4800,wood:3900,stone:3300,aether:780};
  seed.buildings={...seed.buildings,keep:4,forge:3,tavern:2};
  seed.cleared=[1,2,3,4];seed.heroes.aldren.level=7;
  const state=R.restoreState(JSON.stringify(seed),now);
  assert.equal(R.equipItem(state,'aldren','iron_sword').ok,true);
  assert.equal(R.startLiveBattle(state,5).ok,true);
  const before=JSON.stringify(state),frozen=deepFreeze(state);
  for (const id of ids) {
    architectureForLevel(id,frozen.buildings[id]);
    pickBuilding(ART_PLOTS[id].center,frozen.buildings);
  }
  assert.equal(JSON.stringify(frozen),before);
  assert.deepEqual(R.restoreState(before,now),frozen, 'saved progression remains a valid rules state');
});
