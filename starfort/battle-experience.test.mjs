import test from 'node:test';
import assert from 'node:assert/strict';
import {battleExperience} from './battle-experience.js';
test('public GitHub beta offers AI practice but no misleading real-player queues',()=>{
  const mode=battleExperience({hostname:'umutcandar.github.io',search:''},'3d',true);
  assert.equal(mode.hosted,true);
  assert.equal(mode.liveMatchmaking,false);
  assert.equal(mode.renderMode,'2d');
  assert.equal(mode.defaultQuality,'balanced');
});
test('Render dedicated server retains real matchmaking and cinematic default',()=>{
  const mode=battleExperience({hostname:'starfort.onrender.com'},'3d',false);
  assert.equal(mode.liveMatchmaking,true);
  assert.equal(mode.renderMode,'2d');
  assert.equal(mode.defaultQuality,'ultra');
});
test('experimental low-poly 3D only opens via explicit graphics lab',()=>{
  assert.equal(battleExperience({search:'?graphicslab=1'},'3d').renderMode,'3d');
  assert.equal(battleExperience({search:'?graphicslab=1'},'2d').renderMode,'2d');
  assert.equal(battleExperience({hostname:'localhost',search:'?hosted=1'},null).hosted,true);
  assert.equal(battleExperience({search:'?graphicslab=0'},'3d').graphicsLab,false);
});
