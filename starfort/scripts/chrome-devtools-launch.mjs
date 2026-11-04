/**
 * Launch CDP Chrome on ephemeral per-attempt profiles.
 * A few GitHub-hosted Ubuntu runners intermittently fail at DevToolsActivePort
 * after D-Bus/zygote startup errors. Retry only browser startup, never gameplay.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';

export const STARTUP_FLAGS=Object.freeze([
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--disable-extensions',
 '--no-default-browser-check','--no-first-run','--no-zygote',
 '--disable-features=MediaRouter,TranslateUI','--remote-debugging-port=0'
]);
export const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function chromeArguments(profile){
 if(typeof profile!=='string'||!profile.trim())throw Error('Missing isolated Chrome profile');
 return [...STARTUP_FLAGS,'--user-data-dir='+profile,'about:blank'];
}
const safeError=s=>String(s||'').replace(/(password|token|apikey|authorization)=\S+/gi,'$1=[redacted]').slice(-450);
async function readPort(profile){
 try{
  const s=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');
  const p=Number(s.split('\n')[0]);
  return Number.isInteger(p)&&p>0&&p<=65535?p:null;
 }catch{return null}
}
export async function launchChrome({
 profileRoot,chromeBin=process.env.CHROME_BIN||'google-chrome',attempts=3,
 perAttemptMs=18000,onRetry=()=>{}
}={}){
 if(!profileRoot||typeof profileRoot!=='string')throw Error('Isolated Chrome profile root required');
 if(!Number.isInteger(attempts)||attempts<1||attempts>5)throw Error('Invalid launch attempts');
 let lastProblem='';
 for(let attempt=1;attempt<=attempts;attempt++){
  const profile=path.join(profileRoot,'attempt-'+attempt);
  await mkdir(profile,{recursive:true});
  const child=spawn(chromeBin,chromeArguments(profile),{
   stdio:['ignore','ignore','pipe'],
   env:{...process.env,DBUS_SESSION_BUS_ADDRESS:'',DBUS_SYSTEM_BUS_ADDRESS:''}
  });
  let stderr='',spawnError='';
  child.on('error',e=>{spawnError=e.message});
  child.stderr.on('data',b=>{stderr=(stderr+String(b)).slice(-900)});
  const end=Date.now()+perAttemptMs;
  while(Date.now()<end){
   const port=await readPort(profile);
   if(port){
    try{
     const response=await fetch('http://127.0.0.1:'+port+'/json/list',{
      signal:AbortSignal.timeout(1600)
     });
     if(response.ok){
      const tabs=await response.json();
      const tab=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
      if(tab)return {chrome:child,tab,port,attempt};
      lastProblem='Chromium opened but no page/CDP target found';
     }
    }catch(e){lastProblem=safeError(e.message)}
   }
   if(spawnError||child.exitCode!==null||child.signalCode!==null){
    lastProblem='Browser exited before DevTools opened: '+safeError(spawnError||stderr);
    break;
   }
   await delay(120);
  }
  if(!lastProblem)lastProblem='No Chrome DevTools port after '+perAttemptMs+' ms; '+safeError(stderr);
  child.kill('SIGTERM');
  // Failed attempts must never run untracked Chromium workers.
  await delay(140);
  if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
  await rm(profile,{recursive:true,force:true,maxRetries:2}).catch(()=>{});
  if(attempt<attempts)onRetry({attempt,reason:lastProblem});
 }
 throw Error('Browser launch failed across '+attempts+' isolated attempts. '+lastProblem);
}
