import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDedicatedQaCredentials,chooseProductionTactic,summarizeProductionFight} from './scripts/production-live-qa-core.mjs';
const source=readFileSync(new URL('./scripts/real-account-production-qa.mjs',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/real-account-production-qa.yml',import.meta.url),'utf8');
const good={
 STARFORT_QA_EMAIL:'starfort-qa@example.com',
 STARFORT_QA_PASSWORD:'throwaway-only-strong-qa-password',
 STARFORT_QA_USER_ID:'9be8d491-151a-486e-8ed9-ace830cb6679'
};
test('production QA requires a separately identifiable QA mailbox, long password and pinned UUID',()=>{
 const q=validateDedicatedQaCredentials(good);
 assert.equal(q.userId,good.STARFORT_QA_USER_ID);
 assert.equal(q.email,good.STARFORT_QA_EMAIL);
 assert.ok(Object.isFrozen(q));
 for(const [field,value] of [
  ['STARFORT_QA_EMAIL','owner@example.com'],
  ['STARFORT_QA_EMAIL',''],
  ['STARFORT_QA_EMAIL','example.com'],
  ['STARFORT_QA_PASSWORD','short'],
  ['STARFORT_QA_USER_ID',''],
  ['STARFORT_QA_USER_ID','not-uuid']
 ])assert.throws(()=>validateDedicatedQaCredentials({...good,[field]:value}),undefined,field);
});
test('production QA tactical decisions respond to server-declared intent, not fake browser enemy data',()=>{
 const base={playerMaxHp:290,playerHp:210,turn:6,lastRallyTurn:1};
 assert.equal(chooseProductionTactic({...base,enemyIntent:'crush'}),'guard');
 assert.equal(chooseProductionTactic({...base,enemyIntent:'eclipse'}),'guard');
 assert.equal(chooseProductionTactic({...base,enemyIntent:'sunder'}),'guard');
 assert.equal(chooseProductionTactic({...base,enemyIntent:'shield'}),'feint');
 assert.equal(chooseProductionTactic({...base,enemyIntent:'drain'}),'strike');
 assert.equal(chooseProductionTactic({...base,playerHp:80,enemyIntent:'strike'}),'rally');
 assert.equal(chooseProductionTactic({...base,playerHp:80,turn:4,lastRallyTurn:2}),'strike');
});
test('production QA compares loss/win and actual HP/rounds without inventing victory',()=>{
 const turns=[
  {turn:1,wave:1,hp:260,enemyHp:70},
  {turn:2,wave:1,hp:205,enemyHp:20},
  {turn:3,wave:2,hp:238,enemyHp:155},
  {turn:4,wave:2,hp:0,enemyHp:94}
 ];
 const summary=summarizeProductionFight('attack-only',1,267,290,{won:false,stars:0,turns:4},turns);
 assert.equal(summary.won,false);
 assert.equal(summary.stars,0);
 assert.equal(summary.lowestLiveHp,205);
 assert.deepEqual(summary.waveTransitions,[{wave:2,hp:238}]);
 assert.equal(summary.balanceVersion,6);
});
test('real account workflow is explicit opt-in and guarded by three GitHub secrets',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/schedule:|pull_request:|push:/);
 for(const key of ['STARFORT_QA_EMAIL','STARFORT_QA_PASSWORD','STARFORT_QA_USER_ID'])
  assert.match(workflow,new RegExp('secrets\\.'+key));
 assert.match(workflow,/concurrency:/);
 assert.match(workflow,/cancel-in-progress: false/);
 assert.match(workflow,/timeout-minutes: 12/);
});
test('real playbook does not create emails, use a service role or touch someone else’s logged-in session',()=>{
 assert.doesNotMatch(source,/\/auth\/v1\/signup|@gmail\.com|randomBytes|service_role|auth\.users|createUser/i);
 assert.match(source,/validateDedicatedQaCredentials\(process\.env\)/);
 assert.match(source,/assert\.equal\(auth\.user\.id,credentials\.userId/);
 assert.match(source,/balanceVersion===6/);
 assert.match(source,/await accountProgressRequest\('mission_turn'/);
 assert.match(source,/await sleep\(Math\.max\(3200/);
 assert.match(source,/await guildRequest\('me'\)/);
 assert.match(source,/await testDeployedLogin\(credentials\.email,credentials\.password\)/);
 assert.match(source,/assert\.equal\(reread\.account\.lastReport\?\.won,completed\.report\.won/);
 assert.match(source,/await accountSignOut\(\)/);
});
