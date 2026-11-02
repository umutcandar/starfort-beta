// v2.32 real Chromium integration: all entry points require a verified server account.
// No guest flow, local rewards, or trusted gameplay exists behind the login screen.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGuildServer} from '../guild-server.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile=await mkdtemp(path.join(tmpdir(),'starfort-authonly-'));
const server=await createGuildServer({host:'127.0.0.1',port:0});
const origin='http://127.0.0.1:'+server.address().port+'/starfort/';
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeError='',ws=null,sequence=0;
const pending=new Map();
chrome.stderr.on('data',chunk=>{chromeError+=String(chunk).slice(0,1500)});
chrome.on('error',err=>{chromeError=err.message});
try{
 let port;
 for(let i=0;i<100;i++){
  try{const lines=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n');port=Number(lines[0]);if(port)break;}catch{}
  if(chrome.exitCode!==null||chromeError.includes('ENOENT'))throw Error('Chromium did not launch: '+chromeError.slice(0,500));
  await sleep(100);
 }
 assert.ok(port,'Chromium DevTools port unavailable');
 let page;
 for(let i=0;i<30;i++){
  const targets=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
  page=targets.find(t=>t.type==='page');if(page)break;await sleep(100);
 }
 assert.ok(page,'No Chromium tab');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data)),req=pending.get(m.id);if(!req)return;pending.delete(m.id);m.error?req.reject(Error(m.error.message)):req.resolve(m.result);});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{
  const data=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(data.exceptionDetails)throw Error('Browser JS: '+(data.exceptionDetails.exception?.description||data.exceptionDetails.text));
  return data.result.value;
 };
 const ready=async()=>{
  for(let i=0;i<100;i++){
   if(await evaluate("document.readyState==='complete'&&!!document.querySelector('#starfort-gate-form')&&document.body.classList.contains('account-locked')"))return;
   await sleep(100);
  }
  throw Error('Authenticated-only entry did not load');
 };
 const shot=async filename=>{const png=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await mkdir('qa-artifacts',{recursive:true});await writeFile('qa-artifacts/'+filename,Buffer.from(png.data,'base64'));};
 await cdp('Page.enable');await cdp('Runtime.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:1536,height:864,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:origin});
 await ready();await sleep(120);
 let state=await evaluate(`(()=>{
  const g=document.querySelector('#account-gate'),form=document.querySelector('#starfort-gate-form'),app=document.querySelector('.app'),r=g.getBoundingClientRect();
  return {locked:document.body.classList.contains('account-locked'),gateVisible:getComputedStyle(g).display!=='none',
   appHidden:getComputedStyle(app).visibility==='hidden',appInert:app.inert,formPresent:!!form,login:!!form.querySelector('[value=login]'),
   signup:!!form.querySelector('[value=signup]'),guestButton:!!document.querySelector('[data-welcome=guest]'),welcomeDialog:!!document.querySelector('#account-welcome'),
   gateWidth:r.width,viewport:innerWidth};
 })()`);
 assert.ok(state.locked&&state.gateVisible&&state.appHidden&&state.appInert&&state.login&&state.signup);
 assert.equal(state.guestButton,false);assert.equal(state.welcomeDialog,false);
 assert.ok(state.gateWidth<=state.viewport);
 await shot('starfort-1536x864-login-required.png');
 // Synthetic UI navigation cannot skip authentication or trigger a local reward.
 await evaluate("document.querySelector('#daily-reward')?.click()");
 assert.equal(await evaluate("document.body.classList.contains('account-locked')&&document.querySelector('.app').inert"),true);
 assert.equal(await evaluate("document.querySelector('#reward-dialog').open"),false);
 // Rejected sign-in may not accidentally fall back to guest state.
 await evaluate(`(()=>{
  window.fetch=async()=>({ok:false,status:401,json:async()=>({message:'invalid_credentials'})});
  const form=document.querySelector('#starfort-gate-form');
  form.querySelector('[name=email]').value='wrong@example.com';
  form.querySelector('[name=password]').value='wrong-password-123';
  form.querySelector('[value=login]').click();
 })()`);
 await sleep(300);
 assert.equal(await evaluate("document.body.classList.contains('account-locked')&&document.querySelector('.app').inert"),true);
 assert.ok(await evaluate("document.querySelector('#account-gate-status').textContent.length>15"));
 // Fake stored credentials are never enough to reveal real gameplay.
 await evaluate(`(()=>{
  sessionStorage.setItem('starfort:account-session',JSON.stringify({
   access_token:'fake.jwt.token',refresh_token:'fake-refresh',
   user:{id:'00000000-0000-4000-8000-000000000001',email:'forged@example.com'},
   expires_at:Math.floor(Date.now()/1000)+3600
  }));
 })()`);
 await cdp('Page.navigate',{url:origin});
 await ready(); // The gate remains locked even with a locally stored token.
 assert.equal(await evaluate("document.querySelector('.app').inert"),true);
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await sleep(120);
 state=await evaluate(`(()=>{
  const e=document.querySelector('#account-gate'),r=e.querySelector('.account-gate-panel').getBoundingClientRect();
  return {scroll:document.documentElement.scrollWidth,viewport:innerWidth,right:r.right,left:r.left,locked:document.body.classList.contains('account-locked'),appHidden:getComputedStyle(document.querySelector('.app')).visibility==='hidden'};
 })()`);
 assert.ok(state.locked&&state.appHidden);
 assert.ok(state.right<=state.viewport+2&&state.left>=-2&&state.scroll<=state.viewport+3,'Mobile login must not overflow screen');
 await shot('starfort-390x844-server-verification.png');
 console.log('PASS v2.32: desktop/mobile account-only gate, no guest access, rejected login, fake-session lock');

 // Real Chromium + synthetic email-provider responses: no live mail quota or player data.
 // This tests login UI, confirmed-link browser callback, reload, mobile and account gate.
 await evaluate("sessionStorage.clear()");
 const mock=await readFile(new URL('./synthetic-account-network.cjs',import.meta.url),'utf8');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:mock});
 await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:850,deviceScaleFactor:1,mobile:false});
 await cdp('Page.navigate',{url:origin});
 await ready();
 assert.equal(await evaluate("window.__starfortQaMock===true"),true,'Synthetic service mock did not load');
 assert.equal(await evaluate("document.querySelector('.app').inert"),true,'Unsigned mock browser unexpectedly unlocked');
 await evaluate(\`(()=>{
  const f=document.querySelector('#starfort-gate-form');
  f.querySelector('[name=email]').value='qa@starfort.test';
  f.querySelector('[name=password]').value='StarfortTest!528468';
  f.requestSubmit(f.querySelector('[value=login]'));
 })()\`);
 let accountUnlocked=false;
 for(let i=0;i<100;i++){
  if(await evaluate("!document.body.classList.contains('account-locked')&&!document.querySelector('.app').inert")){accountUnlocked=true;break;}
  await sleep(100);
 }
 assert.ok(accountUnlocked,'Synthetic signed-in account did not unlock the real UI');
 assert.equal(await evaluate("!!document.querySelector('.village, .server-expedition, .app')"),true);
 await cdp('Page.navigate',{url:origin});
 let persists=false;
 for(let i=0;i<100;i++){
  if(await evaluate("!!document.querySelector('.app')&&!document.querySelector('.app').inert")){persists=true;break;}
  await sleep(100);
 }
 assert.ok(persists,'Authenticated account session not restored after page reload');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await sleep(150);
 const mobileSignedIn=await evaluate("({viewport:innerWidth,scroll:document.documentElement.scrollWidth,locked:document.querySelector('.app').inert})");
 assert.equal(mobileSignedIn.locked,false,'Mobile authenticated app locked');
 assert.ok(mobileSignedIn.scroll<=mobileSignedIn.viewport+5,'Mobile authenticated app horizontal overflow: '+JSON.stringify(mobileSignedIn));
 console.log('PASS synthetic server responses: desktop login, persistent reload, 390px authenticated mobile game');
 // The actual callback parser must accept the token from a confirmed email link.
 await evaluate("sessionStorage.clear()");
 await cdp('Page.navigate',{url:origin});
 await ready();
 await evaluate(\`(()=>{
  const f=document.querySelector('#starfort-gate-form');
  f.querySelector('[name=email]').value='qa@starfort.test';
  f.querySelector('[name=password]').value='StarfortTest!528468';
  f.requestSubmit(f.querySelector('[value=signup]'));
 })()\`);
 let signupPending=false;
 for(let i=0;i<100;i++){
  signupPending=await evaluate("!document.querySelector('[data-gate-resend]').hidden");
  if(signupPending)break;
  await sleep(100);
 }
 assert.ok(signupPending,'Synthetic signup did not render email-confirmation step');
 assert.equal(await evaluate("document.querySelector('.app').inert"),true,'Signup without confirmation unlocked game');
 await cdp('Page.navigate',{url:origin+'#access_token=qa.synthetic.jwt&refresh_token=qa.synthetic.refresh&expires_in=3600&type=signup'});
 let confirmed=false;
 for(let i=0;i<100;i++){
  if(await evaluate("!!document.querySelector('.app')&&!document.querySelector('.app').inert")){confirmed=true;break;}
  await sleep(100);
 }
 assert.ok(confirmed,'Simulated confirmation link failed to authorize account browser');
 assert.equal(await evaluate("location.hash"),'','Signup confirmation URL tokens remained visible');
 console.log('PASS synthetic provider: signup locked until confirmation, email callback verified, session unlocked');

}finally{
 if(ws&&ws.readyState===1)ws.close();
 chrome.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true,maxRetries:2});
}
