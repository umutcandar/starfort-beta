import test from 'node:test';import assert from 'node:assert/strict';import {create3DResolutionManager} from './graphics-3d-performance.js';
test('yavaş mobil kare zamanında çözünürlük düşer, üst sınır korunur',()=>{
 const m=create3DResolutionManager('balanced');for(let i=0;i<60;i++)m.observe(40);
 assert.ok(m.getScale()<1);for(let i=0;i<500;i++)m.observe(40);assert.ok(m.getScale()>=.7);
});
test('hızlı karelerde kalite yavaşça geri gelir ve belirsiz FPS gözlemleri yok sayılır',()=>{
 const m=create3DResolutionManager('ultra');for(let i=0;i<200;i++)m.observe(40);const low=m.getScale();
 for(let i=0;i<600;i++)m.observe(8);assert.ok(m.getScale()>low);assert.ok(m.getScale()<=1);
 const before=m.getScale();m.observe(NaN);m.observe(-1);assert.equal(m.getScale(),before);
 m.setQuality('performance');assert.ok(m.getScale()>=.8);
});
