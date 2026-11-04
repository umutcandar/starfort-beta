/** Real Chrome on the deployed Render application, with a throwaway real Supabase email account.
 * Credentials remain only in runner memory. No page screenshots or tokens are uploaded.
 */
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {launchChrome} from './chrome-devtools-launch.mjs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
export async function testDeployedLogin(email,password){
 const profile=await mkdtemp(path.join(tmpdir(),'starfort-real-auth-'));
 let chrome=null,ws=null,seq=0;
 const pend=new Map();
 try{
  const running=await launchChrome({
   profileRoot:profile,attempts:3,perAttemptMs:18000,
   onRetry:({attempt,reason})=>console.warn('[STARFORT REAL QA] Browser startup retry '+attempt+': '+reason)
  });
  chrome=running.chrome;
  const tab=running.tab;
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
   ws.addEventListener('open',resolve,{once:true});
   ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',e=>{
   const m=JSON.parse(String(e.data)),p=pend.get(m.id);
   if(!p)return;
   pend.delete(m.id);
   m.error?p.reject(Error(m.error.message)):p.resolve(m.result);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++seq;pend.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expr=>{
   const result=await cdp('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
   if(result.exceptionDetails)throw Error('Browser JS error: '+(result.exceptionDetails.text||'unknown'));
   return result.result.value;
  };
  await cdp('Page.enable');await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1365,height:850,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:'https://starfort-online-beta.onrender.com/starfort/'});
  for(let i=0;i<140;i++){
   if(await evaluate("!!document.querySelector('#starfort-gate-form')&&document.readyState==='complete'"))break;
   await sleep(500);
  }
  assert.equal(await evaluate("document.body.classList.contains('account-locked')"),true,
    'Real production opens unlocked without authentication');
  const credentials=JSON.stringify({email,password});
  const script=`(()=>{
   const {email,password}=${credentials};
   const f=document.querySelector('#starfort-gate-form');
   if(!f)return false;
   f.querySelector('[name=email]').value=email;
   f.querySelector('[name=password]').value=password;
   f.requestSubmit(f.querySelector('button[value=login]'));
   return true;
  })()`;
  assert.equal(await evaluate(script),true,'Real login form not found');
  let result=null;
  for(let i=0;i<120;i++){
   result=await evaluate(`(()=>{
    const form=document.querySelector('#starfort-gate-form'),app=document.querySelector('.app');
    const gate=document.querySelector('#account-gate-status');
    return {ready:!!app&&!app.inert&&!document.body.classList.contains('account-locked'),
      gate:gate?.textContent.slice(0,200)||'',error:gate?.dataset.error||'',
      app:!!app,loginVisible:!!form&&!form.hidden};
   })()`);
   if(result.ready)break;
   await sleep(500);
  }
  assert.ok(result?.ready,'Account login did not unlock real world: '+JSON.stringify(result));
  const visible=await evaluate("document.body.innerText.includes('Sunucu')||document.body.innerText.includes('Komutan')");
  assert.equal(visible,true,'Authenticated online UI not rendered');
  console.log('[STARFORT REAL QA] PASS Real desktop Chromium login and authenticated game unlock.');
  // Confirm the account stays visible after a fresh real browser navigation and server reload.
  await cdp('Page.navigate',{url:'https://starfort-online-beta.onrender.com/starfort/'});
  let unlocked=false;
  for(let i=0;i<90;i++){
   if(await evaluate("!!document.querySelector('.app')&&!document.querySelector('.app').inert")){
    unlocked=true;break;
   }
   await sleep(500);
  }
  assert.equal(unlocked,true,'Reload failed to restore authenticated server-backed world');
  console.log('[STARFORT REAL QA] PASS Authenticated browser refresh and server-owned state restore.');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await sleep(150);
  const mobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,appInert:document.querySelector('.app')?.inert})");
  assert.equal(mobile.appInert,false,'Mobile authenticated world is locked');
  assert.ok(mobile.scroll<=mobile.width+6,'Mobile app horizontal overflow: '+JSON.stringify(mobile));
  console.log('[STARFORT REAL QA] PASS Live mobile authenticated layout 390px.');
 }finally{
  try{if(ws?.readyState===1)ws.close()}catch{}
  chrome?.kill('SIGTERM');
  await rm(profile,{recursive:true,force:true,maxRetries:2}).catch(()=>{});
 }
}
