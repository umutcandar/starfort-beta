import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ART_ASSETS,loadBattleArt} from './team-renderer.js';
test('cinematic battle illustration assets are bundled locally and have valid image headers',async()=>{
 assert.equal(ART_ASSETS.length,7);
 for(const filename of ART_ASSETS){
  const bytes=await readFile(new URL(filename,import.meta.url));
  assert.ok(bytes.length>10000,filename);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',filename);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',filename);
 }
 assert.equal(loadBattleArt(null).length,7);
});
