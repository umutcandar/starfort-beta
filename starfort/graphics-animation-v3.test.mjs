import test from 'node:test';
import assert from 'node:assert/strict';
import {actorPose,ANIMATION_STATES,impactFrame,effectsBudget,easeOutCubic,groundY,inverseGroundY,depthScale} from './graphics-animation-v3.js';
test('Graphics v2.1: deterministic animation state selection',()=>{
 const p=actorPose({speed:1,walk:5,time:2});assert.equal(p.state,'run');
 assert.equal(actorPose({hit:.8,speed:1}).state,'hit');assert.equal(actorPose({attack:.8}).state,'attack');
 assert.equal(actorPose({cast:.6}).state,'cast');assert.equal(actorPose({hp:0}).state,'down');
 assert.ok(ANIMATION_STATES.includes(p.state));
});
test('Graphics v2.1: reduced-motion eliminates oscillating body motion',()=>{
 const p=actorPose({speed:1,walk:10,time:12,hit:.5,reducedMotion:true});
 assert.equal(p.bob,0);assert.equal(p.lean,0);assert.equal(p.trail,0);assert.equal(p.weaponAngle,0);
});
test('Graphics v2.1: impact effects expire; destruction has a longer tail',()=>{
 const fx={type:'gate-down',t:10};assert.ok(impactFrame(fx,11));assert.equal(impactFrame(fx,12),null);
 assert.equal(impactFrame(fx,9),null);assert.equal(impactFrame({type:'attack',t:10},11),null);
 assert.ok(impactFrame(fx,10.5).radius>impactFrame(fx,10.1).radius);
});
test('Graphics v2.1: bounded pose inputs and graphical particle budgets',()=>{
 const p=actorPose({speed:Infinity,walk:NaN,time:NaN,attack:2,hit:-100});
 for(const key of ['bob','lean','legSwing','weaponAngle','flash','trail','scale'])assert.ok(Number.isFinite(p[key]),key);
 assert.ok(effectsBudget('ultra').embers>effectsBudget('balanced').embers);
 assert.ok(effectsBudget('balanced').shards>effectsBudget('performance').shards);
 assert.equal(effectsBudget('ultra',true).embers,0);
 assert.ok(easeOutCubic(.5)>.5);
});

test('Graphics v2.1: perspective projection roundtrips for touch-targeting',()=>{for(const y of [0,140,300,600]){assert.ok(Math.abs(inverseGroundY(groundY(y))-y)<1e-7);assert.ok(depthScale(y)>.5&&depthScale(y)<=1);}});
