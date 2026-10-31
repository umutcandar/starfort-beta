import test from 'node:test';
import assert from 'node:assert/strict';
import {RIG_STATES,rigFrame,rigUV,motionSprite,motionAssetFilename} from './graphics-rig-v4.js';
test('atlas UV cells stay separated and within bounds',()=>{
  for(const s of RIG_STATES)for(let f=0;f<6;f++){
    const [u,v,u2,v2]=rigUV(s,f);
    assert.ok([u,v,u2,v2].every(n=>n>=0&&n<=1));
    assert.ok(u2>u&&v2>v);
  }
});
test('time-based frames change for motion states',()=>{
  assert.notEqual(rigFrame('run',0,0),rigFrame('run',.7,1));
  assert.notEqual(rigFrame('attack',0),rigFrame('attack',.2));
  assert.equal(rigFrame('run',20,20,1,true),0);
});
test('fallback and orientation preserve server-side positions',()=>{
  const pose={state:'run',face:-1};
  const fallback=motionSprite(1,pose,.3,1,false,false);
  assert.equal(fallback.id,'art-1');
  const sprite=motionSprite(1,pose,.3,1,false,true);
  assert.equal(sprite.id,'rig-1');
  assert.ok(sprite.uv[0]>sprite.uv[2]);
  assert.equal(motionAssetFilename(6),'assets/rigs/unit-dusk-3-motion.webp');
  assert.equal(motionAssetFilename(0),null);
});
