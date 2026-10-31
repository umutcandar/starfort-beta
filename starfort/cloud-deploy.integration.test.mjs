import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const timeout=(ms,p)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Cloud test server timeout')),ms))]);
test('cloud beta accepts invite code, rejects outsiders, serves game and supports bot queue', async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'starfort-cloud-test-'));
 const secret='SadeceTestIcinRastgeleGucluKod!!';
 const child=spawn(process.execPath,['guild-server.mjs'],{
  cwd:process.cwd(),env:{...process.env,STARFORT_TEST_CODE:secret,STARFORT_DATA_DIR:dir,STARFORT_HOST:'0.0.0.0',PORT:'0'},
  stdio:['ignore','pipe','pipe']});
 let output='';
 try{
  const base=await timeout(8000,new Promise((resolve,reject)=>{
    const receive=(data)=>{output+=data.toString();const m=output.match(/https?:\/\/0\.0\.0\.0:(\d+)\/starfort\//);if(m)resolve(`http://127.0.0.1:${m[1]}`)};
    child.stdout.on('data',receive);child.stderr.on('data',d=>{output+=d.toString()});child.once('exit',code=>reject(new Error('server exited '+code+' '+output)));
  }));
  const status=await fetch(`${base}/api/status`);assert.equal(status.status,200);
  const info=await status.json();assert.equal(info.inviteOnly,true);
  const page=await fetch(`${base}/starfort/`);assert.equal(page.status,200);assert.match(await page.text(),/STARFORT/i);
  const reject=await fetch(`${base}/api/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TesterOne'})});
  assert.equal(reject.status,403);assert.equal((await reject.json()).code,'INVITE_REQUIRED');
  const wrong=await fetch(`${base}/api/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TesterOne',testCode:'bad'})});
  assert.equal(wrong.status,403);
  const register=await fetch(`${base}/api/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'TesterOne',testCode:secret})});
  assert.equal(register.status,201);const account=await register.json();assert.match(account.token,/^[a-f0-9]{64}$/);
  const auth={'Content-Type':'application/json','Authorization':`Bearer ${account.token}`};
  const arena=await fetch(`${base}/api/arena/bot`,{method:'POST',headers:auth,body:JSON.stringify({difficulty:'normal'})});
  assert.equal(arena.status,200);assert.ok((await arena.json()).status!==undefined);
 }finally{
  child.kill('SIGTERM');await new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else child.once('exit',resolve)});
  await rm(dir,{force:true,recursive:true});
 }
});
