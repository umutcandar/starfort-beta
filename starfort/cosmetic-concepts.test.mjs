import test from 'node:test';import assert from 'node:assert/strict';
import * as R from './rules.js';
import {restoreWishlist} from './cosmetic-concepts.js';
const time=Date.UTC(2026,9,31,12);
test('cosmetic votes are purely local, bounded, reversible and save-compatible',()=>{
  const s=R.createState(time),before={...s.res};
  assert.equal(R.toggleWishlist(s,'castle-night').ok,true);
  assert.deepEqual(s.cosmeticWishlist,['castle-night']);
  assert.deepEqual(s.res,before);
  assert.deepEqual(R.restoreState(JSON.stringify(s),time).cosmeticWishlist,['castle-night']);
  assert.equal(R.toggleWishlist(s,'castle-night').selected,false);
  assert.equal(R.toggleWishlist(s,'not-real').ok,false);
  assert.deepEqual(restoreWishlist(['castle-night','castle-night',1,'not-real']),['castle-night']);
});
