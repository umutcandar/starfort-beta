import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleMotion,graphicsPreset,resolutionScale} from './battle-motion.js';
import {nextQuality,QUALITY_LABELS} from './graphics-display.js';
const makeRoom=(id='room-1',x=12,hp=140)=>({id,players:[{id:'hero',x,y:22,hp,team:0}],squads:[{id:'squad',x:18,y:27,hp:80,team:0}]});
test('old cinematic save is migrated to Ultra without losing lower graphics choices',()=>{
 assert.equal(graphicsPreset('cinematic'),'ultra');assert.equal(graphicsPreset('ultra'),'ultra');
 assert.equal(graphicsPreset('performance'),'performance');assert.equal(graphicsPreset('invalid'),'balanced');
 assert.deepEqual(Object.keys(QUALITY_LABELS),['ultra','balanced','performance']);
 assert.equal(nextQuality('ultra'),'balanced');assert.equal(nextQuality('balanced'),'performance');assert.equal(nextQuality('performance'),'ultra');
});
test('Ultra resolution cap is sharper than Performance with bounded device pixel ratio',()=>{
 assert.equal(resolutionScale(1000,600,2,'ultra'),2);
 assert.equal(resolutionScale(1000,600,2,'balanced'),1.4);
 assert.equal(resolutionScale(1000,600,2,'performance'),1);
 assert.equal(resolutionScale(1000,600,0,'ultra'),1);
 assert.equal(resolutionScale(Infinity,600,2,'ultra'),1);
 assert.ok(resolutionScale(844,390,2,'ultra')>=1);
});
test('presentation interpolates instead of teleporting, and never mutates server snapshots',()=>{
 const motion=createBattleMotion(),base=makeRoom();
 const old=JSON.stringify(base);let frame=motion.sample(base,1);assert.equal(frame.actors.get('hero').x,120);
 const changed=makeRoom('room-1',20);frame=motion.sample(changed,1.016);
 assert.ok(frame.actors.get('hero').x>120);assert.ok(frame.actors.get('hero').x<200);
 assert.equal(JSON.stringify(base),old);assert.equal(changed.players[0].x,20);
 frame=motion.sample(changed,1.032);assert.equal(frame.actors.get('hero').face,1);
 assert.ok(frame.actors.get('hero').walk>0);
});
test('health loss triggers brief cosmetic hit, and room changes remove stale poses',()=>{
 const motion=createBattleMotion();motion.sample(makeRoom('a'),2);
 let frame=motion.sample(makeRoom('a',12,108),2.016);
 assert.equal(frame.actors.get('hero').hit,1);assert.ok(Math.abs(frame.shake.x)<=2.5);
 frame=motion.sample(makeRoom('a',12,108),2.35);
 assert.ok(Math.abs(frame.shake.x)===0);
 frame=motion.sample(makeRoom('b',30,140),3);
 assert.equal(frame.actors.get('hero').x,300);assert.equal(frame.actors.get('hero').hit,0);
 motion.reset();assert.equal(motion.count(),0);
});
test('motion handles removed fighters, zero time delta and missing room safely',()=>{
 const motion=createBattleMotion();motion.sample(makeRoom(),0);
 const bare={id:'room-1',players:[],squads:[]};motion.sample(bare,0);
 assert.equal(motion.count(),0);
 assert.equal(motion.sample(null,1).actors.size,0);
});
