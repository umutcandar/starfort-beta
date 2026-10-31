import test from 'node:test';import assert from 'node:assert/strict';
import {rigPose,rigBones,RIG_ACTIONS} from './graphics-3d-rig.js';
test('3D rig her temel animasyon klibini ayrı pozlar olarak üretir',()=>{
 const poses=['idle','run','attack','cast','hit','death'].map(action=>rigPose({action,speed:action==='run'?1:0,life:action==='death'?0:1,hit:action==='hit'?1:0,attackPhase:.5,castPhase:.5},1));
 assert.deepEqual(poses.map(p=>p.state),RIG_ACTIONS);
 assert.ok(poses[2].swordSwing>0.9);assert.ok(poses[3].glow>.9);assert.ok(poses[5].crouch>1);
});
test('3D rig kemik noktaları sonlu, kollarda eklem sürekliliği var',()=>{
 const pose=rigPose({speed:.9,walk:1});const b=rigBones(pose,1.2);
 assert.equal(b.arms.length,2);assert.equal(b.legs.length,2);
 for(const a of b.arms)for(const v of [a.shoulder,a.elbow,a.hand])assert.ok(v.every(Number.isFinite));
 for(const l of b.legs)for(const v of [l.hip,l.knee,l.boot])assert.ok(v.every(Number.isFinite));
 assert.ok(b.head>b.shoulder);
});
test('hareket azaltma ayarı yürüyüş salınımını durdurur, NaN üretmez',()=>{
 const p=rigPose({speed:1,walk:2,hit:NaN},1,{reducedMotion:true});
 assert.equal(p.stride,0);assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));
});
