import test from 'node:test';import assert from 'node:assert/strict';
import {getPreferredBattleMode,savePreferredBattleMode,VISUAL_MODE_KEY} from './battle-render-preference.js';
test('new clients and legacy 3D clients get cinematic as default',()=>{
 const db=new Map([['starfort:renderMode','3d']]);const store={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};
 assert.equal(getPreferredBattleMode(store),'2d');
 assert.equal(savePreferredBattleMode(store,'3d'),'3d');
 assert.equal(getPreferredBattleMode(store),'3d');
 assert.equal(savePreferredBattleMode(store,'garbage'),'2d');
 assert.equal(db.get(VISUAL_MODE_KEY),'2d');
});
