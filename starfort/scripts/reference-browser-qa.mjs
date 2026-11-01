// Real Chromium DOM and screenshot smoke test: no external test dependencies.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGuildServer} from '../guild-server.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const profile=await mkdtemp(path.join(tmpdir(),'starfort-ref-ui-'));
const server=await createGuildServer({host:'127.0.0.1',port:0});
const origin=`http://127.0.0.1:${server.address().port}/starfort/`;
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeError='';
chrome.stderr.on('data',chunk=>{chromeError+=String(chunk).slice(0,1000)});
chrome.on('error',error=>{chromeError=error.message});
let ws,closed=false,sequence=0;
const pending=new Map();
try{
  let port;
  for(let retry=0;retry<100;retry++){
    try{
      const content=await readFile(path.join(profile,'DevToolsActivePort'),'utf8');
      port=Number(content.split('\n')[0]);if(port)break;
    }catch{}
    if(chrome.exitCode!==null || chromeError.includes('ENOENT'))throw new Error('Chromium açılmadı: '+chromeError.slice(0,500));
    await sleep(100);
  }
  assert.ok(port,'Chromium devtools bağlantısı açılmadı: '+chromeError.slice(0,500));
  let page;
  for(let retry=0;retry<30;retry++){
    const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
    page=targets.find(t=>t.type==='page');if(page)break;await sleep(100);
  }
  assert.ok(page,'Chromium sayfa hedefi bulunamadı.');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',e=>{
    const msg=JSON.parse(String(e.data));if(!msg.id)return;
    const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);
    msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result);
  });
  function cdp(method,params={}){
    return new Promise((resolve,reject)=>{
      const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
    });
  }
  async function evaluate(js){
    const r=await cdp('Runtime.evaluate',{expression:js,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error('Tarayıcı JS hatası: '+r.exceptionDetails.text);
    return r.result.value;
  }
  async function ready(){
    for(let i=0;i<70;i++){
      const r=await evaluate("document.readyState==='complete' && !!document.querySelector('.nav-item[data-view=armory]')");
      if(r)return;await sleep(100);
    }
    throw new Error('Oyun arayüzü yüklenmedi');
  }
  function layoutExpression(){
    return `(()=>{const box=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};return {viewport:{w:innerWidth,h:innerHeight},nav:box('.rail'),quest:box('.next-quest'),brand:box('.brand'),roster:box('.bag-v212-roster'),hero:box('.bag-v212-character'),inventory:box('.bag-v212-right'),detail:box('.armory-v212>.bag-v212-detail'),workspace:box('#workspace'),workScroll:document.querySelector('#workspace')?.scrollWidth,workWidth:document.querySelector('#workspace')?.clientWidth,questButton:!!document.querySelector('.quest-actions [data-stage],.quest-actions [data-action="resume-battle"]'),bagItems:document.querySelectorAll('.bag-v212-item').length,hasDetailAction:!!document.querySelector('.bag-v212-detail-actions [data-equip],.bag-v212-detail-actions [data-unequip]')}})()`;
  }
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1536,height:864,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:origin});
  await ready();
  await evaluate("document.querySelector('.nav-item[data-view=expedition]').click()");
  let scenic=await evaluate(layoutExpression());
  assert.equal(scenic.questButton,true,'Sefer kartından savaş başlatılabilmeli');
  assert.ok(scenic.quest.x>scenic.viewport.w/2,'Sefer kartı sağda olmalı');
  assert.ok(scenic.quest.bottom<scenic.nav.y+3,'Sefer kartı alt menünün üstünde kalmalı');
  await evaluate("document.querySelector('.nav-item[data-view=armory]').click()");
  await sleep(400);
  let bag=await evaluate(layoutExpression());
  assert.ok(bag.roster&&bag.hero&&bag.inventory&&bag.detail,'Çanta dört ana sütunu göstermeli');
  assert.ok(bag.roster.x<bag.hero.x && bag.hero.x<bag.inventory.x && bag.inventory.x<bag.detail.x,'Geniş ekranda dört sütun sıralı olmalı');
  assert.ok(bag.detail.right<=bag.viewport.w+2,'Eşya paneli yatay ekrandan taşmamalı');
  assert.ok(bag.nav.y>bag.detail.y,'Alt menü ekrandaki içerikten sonra olmalı');
  assert.ok(bag.bagItems>=19,'Ekipman ve malzeme ızgarası doldurulmalı');
  assert.ok(bag.hasDetailAction,'Eşya panelinde işlevsel işlem olmalı');
  await mkdir('qa-artifacts',{recursive:true});
  const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('qa-artifacts/starfort-1536x864-bag.png',Buffer.from(shot.data,'base64'));
  await evaluate("document.querySelector('.nav-item[data-view=expedition]').click()");
  await sleep(200);
  const sceneShot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('qa-artifacts/starfort-1536x864-village.png',Buffer.from(sceneShot.data,'base64'));
  await cdp('Emulation.setDeviceMetricsOverride',{width:667,height:375,deviceScaleFactor:1,mobile:false});
  await sleep(200);
  scenic=await evaluate(layoutExpression());
  assert.equal(scenic.questButton,true,'Telefon yatay sefer kartı oynanabilir kalmalı');
  assert.ok(scenic.quest.bottom<=scenic.nav.y+3,'Telefon sefer kartı menüyü örtmemeli');
  await evaluate("document.querySelector('.nav-item[data-view=armory]').click()");
  await sleep(220);
  bag=await evaluate(layoutExpression());
  assert.ok(bag.roster&&bag.hero&&bag.inventory&&bag.detail,'Dar ekranda tüm çanta parçaları korunmalı');
  assert.ok(bag.workScroll<=bag.workWidth+4,`Telefon çantasında yatay taşma: ${bag.workScroll}/${bag.workWidth}`);
  assert.ok(bag.nav.y>=300,'Telefon yatay menü görünür kalmalı');
  const mobile=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('qa-artifacts/starfort-667x375-bag.png',Buffer.from(mobile.data,'base64'));
  console.log('STARFORT gerçek Chromium görsel/etkileşim kontrolleri BAŞARILI');
  console.log(JSON.stringify({wide:{scenic,bag},mobile:{bag}},null,2));
} finally{
  if(ws && ws.readyState===1)ws.close();
  if(!closed){chrome.kill('SIGTERM');closed=true;}
  await new Promise(resolve=>server.close(resolve));
  await rm(profile,{recursive:true,force:true,maxRetries:2});
}
