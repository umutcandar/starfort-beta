import test from 'node:test';import assert from 'node:assert/strict';
import {legacy3DTargetCoordinates} from './battle-render-adapter.js';
import {pickGround,server3} from './graphics-3d-math.js';
test('5v5 yatay dokunmatik hedef koordinatı eski 10000x6000 ölçeğinden 3B ekrana çevrilir',()=>{
 const p=legacy3DTargetCoordinates(5000,3000);assert.deepEqual(p,{x:500,y:300});
 const ray=pickGround(p.x/1000,p.y/600);assert.ok(ray);assert.deepEqual(server3(ray.x,ray.z),{x:50,y:30});
});
test('3B dokunmatik merkez farklı telefon yatay ekranlarında aynı server noktasına denk gelir',()=>{
 for(const [width,height] of [[667,375],[844,390],[932,430]]){
  const p=legacy3DTargetCoordinates((width/2)/width*10000,(height/2)/height*6000);
  assert.deepEqual(p,{x:500,y:300});
 }
});

import {normalizeBattlePick} from './battle-render-adapter.js';
import {cameraFor,screenToWorld,worldToScreen} from './graphics-core-v2.js';
test('2.5B camera tracking target pick round-trips screen, world and server coordinates',()=>{
  const camera=cameraFor({x:64,y:41},'ultra',false);
  for(const position of [{x:280,y:220},{x:615,y:420},{x:500,y:300}]){
    const screen=worldToScreen(position.x,position.y,camera);
    const normalized=normalizeBattlePick(screen.x*10,screen.y*10);
    const world=screenToWorld(normalized.x,normalized.y,camera);
    assert.ok(Math.abs(world.x/10-position.x/10)<1e-9);
    assert.ok(Math.abs(world.y/10-position.y/10)<1e-9);
  }
});
