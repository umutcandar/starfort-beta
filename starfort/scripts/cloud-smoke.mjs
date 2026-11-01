// Cloud smoke check, with a throwaway database and no real player accounts.
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const scratch=await mkdtemp(path.join(tmpdir(),'starfort-smoke-'));
process.env.STARFORT_DATA_DIR=scratch;
process.env.STARFORT_TEST_CODE='ci-test-code-not-for-production';
const {createGuildServer}=await import('../guild-server.mjs');
let server;
try{
  server=await createGuildServer({host:'127.0.0.1',port:0});
  const url='http://127.0.0.1:'+server.address().port;
  async function check(endpoint,status,opts){
    const response=await fetch(url+endpoint,opts);
    assert.equal(response.status,status,endpoint);
    return response;
  }
  const health=await (await check('/api/status',200)).json();
  assert.equal(health.ok,true);
  assert.equal(health.inviteOnly,true);
  const homepage=await (await check('/starfort/',200)).text();
  assert.match(homepage,/Starfort v2\.8\.1/i);
  const pathCode=await (await check('/starfort/commander-path.js',200)).text();
  assert.match(pathCode,/commanderPath/);
  await check('/starfort/.local-data/guilds.json',403);
  const post=body=>({method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  await check('/api/register',403,post({name:'Duman Testi',testCode:'wrong'}));
  const account=await (await check('/api/register',201,post({name:'Duman Testi',testCode:'ci-test-code-not-for-production'}))).json();
  assert.equal(typeof account.token,'string');
  assert.equal(account.token.length,64);
  console.log('PASS: health, homepage, new game assets, path security, invitation gate, registration');
} finally {
  if(server)await new Promise(resolve=>server.close(resolve));
  await rm(scratch,{recursive:true,force:true});
}
