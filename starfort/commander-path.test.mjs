import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {commanderPath,COMMANDER_STEPS} from './commander-path.js';
const t=Date.UTC(2026,9,31,10);
test('new players get a meaningful first objective with no payment pressure',()=>{
  const s=R.createState(t),path=commanderPath(s);
  assert.equal(path.next.id,'first-victory');
  assert.equal(path.total,7);
  assert.equal(path.completed,0);
  assert.ok(path.steps.every(step=>!/(satın al|ödeme|reklam)/i.test(step.detail)));
});
test('the path adapts to player choices without demanding a fixed sequence',()=>{
  const s=R.createState(t);
  s.buildings.keep=2;
  s.cleared=[1,2];
  s.heroes.mira={level:1};
  assert.equal(commanderPath(s).next.id,'equip-hero');
  assert.equal(commanderPath(s).completed,3);
  s.loadouts.aldren={weapon:'iron_sword'};
  assert.equal(commanderPath(s).next.id,'finish-campaign');
});
test('endgame journey goals are bounded and derive from actual saved achievements',()=>{
  const s=R.createState(t);
  s.cleared=[1,2,3,4,5,6,7,8];s.buildings.keep=8;
  s.loadouts.aldren={weapon:'iron_sword'};
  s.veteranMedals={1:1};s.riftRecords=[{week:3000,stageId:8,modifier:'sorcery'}];
  const path=commanderPath(s);
  assert.equal(path.completed,COMMANDER_STEPS.length);
  assert.equal(path.next,null);
  assert.equal(path.allDone,true);
});
test('malformed optional state does not crash the path, and the original save remains unchanged',()=>{
  const s={cleared:null,buildings:null,loadouts:{x:null},veteranMedals:{a:'wrong'},riftRecords:false};
  const original=JSON.stringify(s);
  assert.equal(commanderPath(s).next.id,'first-victory');
  assert.equal(JSON.stringify(s),original);
});
