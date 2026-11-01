import test from 'node:test';import assert from 'node:assert/strict';
import {advanceOnboarding,normalizeStep} from './onboarding.js';
test('onboarding goes fight → upgrade → done and ignores out-of-order events',()=>{
  assert.equal(normalizeStep(null),'fight');
  assert.equal(advanceOnboarding('fight','upgraded'),'fight');
  assert.equal(advanceOnboarding('fight','practice-result'),'upgrade');
  assert.equal(advanceOnboarding('upgrade','practice-result'),'upgrade');
  assert.equal(advanceOnboarding('upgrade','upgraded'),'done');
  assert.equal(advanceOnboarding('fight','skip'),'done');
  assert.equal(advanceOnboarding('done','practice-result'),'done');
});
