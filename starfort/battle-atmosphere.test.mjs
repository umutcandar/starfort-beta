import test from 'node:test';
import assert from 'node:assert/strict';
import {chapterAtmosphere,CHAPTER_ATMOSPHERES} from './battle-atmosphere.js';
test('each campaign chapter has a different themed environment and readable name',()=>{
 assert.equal(CHAPTER_ATMOSPHERES.length,8);
 assert.equal(new Set(CHAPTER_ATMOSPHERES.map(c=>c.id)).size,8);
 for(let stage=1;stage<=8;stage++){
  const mood=chapterAtmosphere(stage);
  assert.ok(mood.name.length>3 && mood.mood.length>3);
 }
});
test('invalid chapter IDs use safe first-stage atmosphere',()=>{
 assert.equal(chapterAtmosphere(0).id,'ash');
 assert.equal(chapterAtmosphere(9).id,'ash');
 assert.equal(chapterAtmosphere('6').id,'ash');
});
