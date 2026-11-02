import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_ONLY,isLegacyOnlyAction,normalizeOnlineView} from './account-only.js';
const mock=(data={},attrs=[])=>({dataset:data,hasAttribute:key=>attrs.includes(key)});
test('account-only release disables every guest start, local reward and backup action',()=>{
 assert.equal(ACCOUNT_ONLY,true);
 for(const d of ['welcome','quickBot','trial','retryStage','recoveryKey','cloudAction','accountTransfer','labyrinthMove','seasonTitle','claimContract','battleStance','ability','target'])assert.equal(isLegacyOnlyAction(mock({[d]:'1'})),true,d);
 for(const x of ['data-export-save','data-import-save','data-labyrinth-complete','data-training-open'])assert.equal(isLegacyOnlyAction(mock({},[x])),true,x);
 for(const d of ['realmMission','accountStage','accountTurn','accountContract','accountTitle','forge','equip','upgradeBuilding','dailyReward'])assert.equal(isLegacyOnlyAction(mock({[d]:'1'})),false,d);
});
test('old local pages redirect to official online campaign',()=>{
 for(const v of ['expedition','labyrinth','training'])assert.equal(normalizeOnlineView(v),'campaign');
 for(const v of ['heroes','keep','settings','arena','team','armory','guild'])assert.equal(normalizeOnlineView(v),v);
});
