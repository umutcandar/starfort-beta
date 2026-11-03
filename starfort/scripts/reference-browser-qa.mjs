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
 // A first-time international player may auto-select English; ensure switching works
 // before authentication and retain Turkish for legacy visual regression assertions.
 await evaluate("document.querySelector('[data-language=en]').click()");
 assert.equal(await evaluate("document.documentElement.lang==='en'&&document.querySelector('#gate-title').textContent==='Build your kingdom'"),true,'English account gate missing');
 assert.equal(await evaluate("document.querySelector('[data-language=en]').getAttribute('aria-pressed')"),'true');
 const chooseLanguage=code=>evaluate(`(()=>{const p=document.querySelector('[data-language-picker]');p.value='${code}';p.dispatchEvent(new Event('change',{bubbles:true}));return document.documentElement.lang;})()`);
 assert.equal(await evaluate("document.querySelectorAll('#account-gate option').length"),14,'Global language menu must have 14 choices');
 assert.equal(await chooseLanguage('es'),'es');
 assert.equal(await evaluate("document.querySelector('#gate-title').textContent==='Construye tu reino'&&document.body.classList.contains('account-locked')"),true);
 assert.equal(await chooseLanguage('ar'),'ar');
 assert.equal(await evaluate("document.documentElement.dir==='rtl'&&document.querySelector('#gate-title').textContent==='ابنِ مملكتك'"),true);
 assert.equal(await chooseLanguage('ja'),'ja');
 assert.equal(await evaluate("document.querySelector('#gate-title').textContent==='自分の王国を築こう'"),true);
 // International mobile regression: inspect every supported language, RTL and
 // script shaping before login; this cannot bypass the authenticated gate.
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 for(const lang of ['tr','en','es','pt-BR','fr','de','it','ru','ar','hi','id','ja','ko','zh-CN']){
  assert.equal(await chooseLanguage(lang),lang);
  const layout=await evaluate(`(()=>{const gate=document.querySelector('.account-gate-panel'),rect=gate.getBoundingClientRect(),title=document.querySelector('#gate-title');
   return {language:document.documentElement.lang,direction:document.documentElement.dir,scroll:document.documentElement.scrollWidth,
    width:innerWidth,left:rect.left,right:rect.right,title:title.textContent.trim(),
    inputs:document.querySelectorAll('#starfort-gate-form input').length,
    locked:document.body.classList.contains('account-locked'),inert:document.querySelector('.app').inert};})()`);
  assert.equal(layout.language,lang,'mobile language switch: '+lang);
  assert.equal(layout.direction,lang==='ar'?'rtl':'ltr','mobile direction: '+lang);
  assert.ok(layout.locked&&layout.inert&&layout.inputs===2,'no guest or account bypass: '+lang);
  assert.ok(layout.title.length>0,'missing native login heading: '+lang);
  assert.ok(layout.left>=-2&&layout.right<=layout.width+2,'account gate clipped: '+lang+' '+JSON.stringify(layout));
  assert.ok(layout.scroll<=layout.width+2,'horizontal page overflow: '+lang+' '+JSON.stringify(layout));
  if(lang==='ar')await shot('starfort-390x844-arabic-rtl.png');
  if(lang==='ja')await shot('starfort-390x844-japanese.png');
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:1536,height:864,deviceScaleFactor:1,mobile:false});
 await evaluate("document.querySelector('[data-language=tr]').click()");
 assert.equal(await evaluate("document.documentElement.lang==='tr'&&document.querySelector('#gate-title').textContent==='Kendi krallığını kur'"),true,'Turkish fallback missing');
 assert.equal(await evaluate("localStorage.getItem('starfort:language-v243')"),'tr');
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
 await evaluate(`(()=>{
  const f=document.querySelector('#starfort-gate-form');
  f.querySelector('[name=email]').value='qa@starfort.test';
  f.querySelector('[name=password]').value='StarfortTest!528468';
  f.requestSubmit(f.querySelector('[value=login]'));
 })()`);
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
  if(await evaluate("document.readyState==='complete'&&!document.body.classList.contains('account-locked')&&!!document.querySelector('[data-view=shop]')&&!document.querySelector('.app').inert")){persists=true;break;}
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
 await evaluate(`(()=>{
  const f=document.querySelector('#starfort-gate-form');
  f.querySelector('[name=email]').value='qa@starfort.test';
  f.querySelector('[name=password]').value='StarfortTest!528468';
  f.requestSubmit(f.querySelector('[value=signup]'));
 })()`);
 let signupPending=false;
 for(let i=0;i<100;i++){
  signupPending=await evaluate("!document.querySelector('[data-gate-resend]').hidden");
  if(signupPending)break;
  await sleep(100);
 }
 assert.ok(signupPending,'Synthetic signup did not render email-confirmation step');
 assert.equal(await evaluate("document.querySelector('.app').inert"),true,'Signup without confirmation unlocked game');
 await cdp('Page.navigate',{url:origin+'#access_token=qa.synthetic.jwt&refresh_token=qa.synthetic.refresh&expires_in=3600&type=signup'});
 // The same-document hash update is asynchronous in Chrome DevTools: wait before forcing reload.
 let emailHashReady=false;
 for(let i=0;i<80;i++){
  emailHashReady=await evaluate("location.hash.includes('access_token=qa.synthetic.jwt')");
  if(emailHashReady)break;await sleep(50);
 }
 assert.ok(emailHashReady,'Simulated email link did not update current browser address');
 // Real confirmation opens a new document; execute the actual startup auth parser.
 await cdp('Page.reload',{ignoreCache:true});
 let confirmed=false;
 for(let i=0;i<100;i++){
  if(await evaluate("document.readyState==='complete'&&!document.body.classList.contains('account-locked')&&!!document.querySelector('[data-view=shop]')&&!document.querySelector('.app').inert&&location.hash===''")){confirmed=true;break;}
  await sleep(100);
 }
 if(!confirmed){
  const snapshot=await evaluate("({mock:window.__starfortQaMock===true,ready:document.readyState,hasHash:location.hash.length>0,appInert:document.querySelector('.app')?.inert,locked:document.body.classList.contains('account-locked'),session:!!sessionStorage.getItem('starfort:account-session'),status:document.querySelector('#account-gate-status')?.textContent.slice(0,200),toast:document.querySelector('#toast')?.textContent.slice(0,200)})");
  throw Error('Simulated email confirmation failed: '+JSON.stringify(snapshot));
 }
 assert.equal(await evaluate("location.hash"),'','Signup confirmation URL tokens remained visible');
 console.log('PASS synthetic provider: signup locked until confirmation, email callback verified, session unlocked');

 // Exercise real store rendering and free season claims with a synthetic server.
 // The mock does NOT accept a real charge or credit any crystals.
 let navReady=false;
 for(let i=0;i<100;i++){
  navReady=await evaluate("document.readyState==='complete'&&!!document.querySelector('[data-view=shop]')");
  if(navReady)break;await sleep(100);
 }
 if(!navReady){
  const d=await evaluate("({ready:document.readyState,nav:document.querySelector('#nav')?.innerHTML?.length||0,views:[...document.querySelectorAll('[data-view]')].slice(0,8).map(x=>x.dataset.view),app:document.querySelector('.app')?.inert,gate:document.body.classList.contains('account-locked'),hash:!!location.hash})");
  throw Error('Shop navigation missing: '+JSON.stringify(d));
 }
 await evaluate("document.querySelector('[data-view=shop]').click()");
 let premiumReady=false;
 for(let i=0;i<80;i++){
  premiumReady=await evaluate("!!document.querySelector('.premium-live-item')&&!!document.querySelector('.premium-season-tier')");
  if(premiumReady)break;await sleep(100);
 }
 assert.ok(premiumReady,'Account shop not displaying server premium catalog');
 assert.equal(await evaluate("document.querySelector('.premium-wallet')?.textContent.includes('0 ✦')"),true,'Zero uncredited crystals not shown');
 assert.equal(await evaluate("[...document.querySelectorAll('.premium-packages button')].every(x=>x.disabled)"),true,'An unverified payment button was enabled');
 // Simulate verified wins inside the isolated browser network stub, not real game state.
 await evaluate(`(()=>{
  const d=JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot'));
  d.counters.win=2;
  sessionStorage.setItem('__starfort_qa_snapshot',JSON.stringify(d));
  document.querySelector('[data-premium-refresh]').click();
 })()`);
 let seasonReady=false;
 for(let i=0;i<70;i++){
  seasonReady=await evaluate("!!document.querySelector('[data-premium-action=claim][data-premium-item=\"1\"]:not([disabled])')");
  if(seasonReady)break;await sleep(100);
 }
 assert.ok(seasonReady,'Verified synthetic wins did not unlock free season claim');
 await evaluate("document.querySelector('[data-premium-action=claim][data-premium-item=\"1\"]').click()");
 let claimed=false;
 for(let i=0;i<70;i++){
  claimed=await evaluate("!!document.querySelector('[data-premium-action=equip][data-premium-item=banner-trailblazer]')");
  if(claimed)break;await sleep(100);
 }
 assert.ok(claimed,'Free season reward not in account inventory');
 await evaluate("document.querySelector('[data-premium-action=equip][data-premium-item=banner-trailblazer]').click()");
 let banner=false;
 for(let i=0;i<70;i++){
  banner=await evaluate("document.body.dataset.premiumBanner==='banner-trailblazer'");
  if(banner)break;await sleep(100);
 }
 assert.ok(banner,'Purchased/earned cosmetics are not applied to village appearance');
 const premiumMobile=await evaluate("({w:innerWidth,scroll:document.documentElement.scrollWidth,crystals:document.querySelector('.premium-wallet')?.textContent})");
 assert.ok(premiumMobile.scroll<=premiumMobile.w+6,'Mobile premium shop horizontal overflow '+JSON.stringify(premiumMobile));
 console.log('PASS v2.36: zero-charge payment lock, authenticated shop, verified free season reward, cosmetic equip and mobile layout');

 // Real Chromium: warfront renders, resource-paid doctrine is queued/refunded,
 // replayable bounty is claimable only with verified synthetic victory counters.
 await evaluate("document.querySelector('[data-view=expedition]').click()");
 let frontReady=false;
 for(let i=0;i<100;i++){
  frontReady=await evaluate("!!document.querySelector('.warfront-options')&&!!document.querySelector('[data-warfront-target=assault]')");
  if(frontReady)break;await sleep(100);
 }
 assert.ok(frontReady,'Authenticated warfront command center did not mount');
 const before=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold");
 await evaluate("document.querySelector('[data-warfront-target=assault]').click()");
 let prepared=false;
 for(let i=0;i<80;i++){
  prepared=await evaluate("document.querySelector('.warfront-pending')?.textContent.includes('Hücum Taburu')===true");
  if(prepared)break;await sleep(100);
 }
 assert.ok(prepared,'Verified assault logistics were not queued');
 const after=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold");
 assert.equal(before-after,70,'Assault doctrine did not debit exactly 70 gold');
 await evaluate("document.querySelector('[data-warfront-action=cancel]').click()");
 let refunded=false;
 for(let i=0;i<80;i++){
  refunded=await evaluate("!!document.querySelector('.warfront-options')&&!document.querySelector('.warfront-pending')");
  if(refunded)break;await sleep(100);
 }
 assert.ok(refunded,'Queued supplies were not canceled');
 assert.equal(await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold"),before,'Canceled supplies were not refunded');
 await evaluate("document.querySelector('[data-warfront-refresh]').click()");
 let dailyBounty=false;
 for(let i=0;i<80;i++){
  dailyBounty=await evaluate("!!document.querySelector('[data-warfront-action=claim_daily]:not([disabled])')");
  if(dailyBounty)break;await sleep(100);
 }
 assert.ok(dailyBounty,'Two verified mock wins did not unlock the daily bounty');
 await evaluate("document.querySelector('[data-warfront-action=claim_daily]').click()");
 let claimedBounty=false;
 for(let i=0;i<80;i++){
  claimedBounty=await evaluate("!!document.querySelector('[data-warfront-action=claim_daily][disabled]')&&document.querySelector('.warfront-bounties')?.textContent.includes('Bu dönem alındı')");
  if(claimedBounty)break;await sleep(100);
 }
 assert.ok(claimedBounty,'Daily bounty claimed twice or failed to update status');
 const mobileFront=await evaluate("({w:innerWidth,scroll:document.documentElement.scrollWidth,tactical:document.querySelectorAll('.warfront-option').length})");
 assert.equal(mobileFront.tactical,3,'Warfront tactical choices are missing in real Chromium');
 assert.ok(mobileFront.scroll<=mobileFront.w+6,'Mobile warfront overflow '+JSON.stringify(mobileFront));
 console.log('PASS v2.37: authenticated warfront, supply debit/refund, true server-bounty UX and mobile 390px layout');

 // Active combat stays above logistics: five commands and selected server doctrine.
 await evaluate("document.querySelector('[data-warfront-target=bulwark]').click()");
 let bulwarkReady=false;
 for(let i=0;i<70;i++){
  bulwarkReady=await evaluate("document.querySelector('.warfront-pending')?.textContent.includes('Siper Garnizonu')===true");
  if(bulwarkReady)break;await sleep(100);
 }
 assert.ok(bulwarkReady,'Defensive doctrine could not be prepared');
 await evaluate("document.querySelector('[data-account-stage=\"1\"]').click()");
 let battleReady=false;
 for(let i=0;i<85;i++){
  battleReady=await evaluate("!!document.querySelector('.server-mission')&&!!document.querySelector('[data-account-turn=feint]')&&!!document.querySelector('[data-account-turn=rally]')");
  if(battleReady)break;await sleep(100);
 }
 assert.ok(battleReady,'A tactical mission did not open after selecting a supply doctrine');
 assert.equal(await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).mission.doctrine"),'bulwark','Prepared server doctrine was not consumed by mission');
 assert.equal(await evaluate("document.querySelector('.server-mission').compareDocumentPosition(document.querySelector('.warfront-shell'))&4"),4,'Mission commands must be before logistics panel');
 const mobileBattle=await evaluate("({w:innerWidth,scroll:document.documentElement.scrollWidth,buttons:document.querySelectorAll('[data-account-turn]').length})");
 assert.ok(mobileBattle.buttons>=5,'Tactical battle does not have all action controls');
 assert.ok(mobileBattle.scroll<=mobileBattle.w+6,'Mobile tactical battle overflow '+JSON.stringify(mobileBattle));
 await evaluate("document.querySelector('[data-account-turn=feint]').click()");
 let feintWorked=false;
 for(let i=0;i<75;i++){
  feintWorked=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).mission?.turn===1");
  if(feintWorked)break;await sleep(100);
 }
 assert.ok(feintWorked,'New feint turn not sent to authoritative combat RPC');
 console.log('PASS v2.37 combat: warfront bulwark consumed, new feint/rally controls, battle prioritization and mobile 390px');

 // Account-bound Shadow Frontier: simulate an advanced player only in isolated browser memory.
 // No production users, achievements or Supabase rows are touched by this fixture.
 await evaluate(`(()=>{
  const d=JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot'));
  d.mission=null;d.cleared=[1,2,3,4,5,6,7,8];d.act2Cleared=[1,2];
  d.heroes={aldren:15,lyra:15,rovan:15};
  d.res={gold:15000,wood:12000,stone:12000,aether:5000};
  sessionStorage.setItem('__starfort_qa_snapshot',JSON.stringify(d));
 })()`);
 await cdp('Page.reload',{ignoreCache:true});
 let advancedReady=false;
 for(let i=0;i<120;i++){
  advancedReady=await evaluate("document.readyState==='complete'&&!document.body.classList.contains('account-locked')&&!!document.querySelector('[data-view=heroes]')");
  if(advancedReady)break;await sleep(100);
 }
 assert.ok(advancedReady,'Advanced synthetic account did not restore');
 await evaluate("document.querySelector('[data-view=heroes]').click()");
 let heroTree=false;
 for(let i=0;i<100;i++){
  heroTree=await evaluate("!!document.querySelector('.shadow-disciplines')&&!!document.querySelector('[data-shadow-train=aldren][data-shadow-path=assault]')");
  if(heroTree)break;await sleep(100);
 }
 assert.ok(heroTree,'Authenticated hero mastery tree did not mount');
 const goldBefore=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold");
 await evaluate("document.querySelector('[data-shadow-train=aldren][data-shadow-path=assault]').click()");
 let mastered=false;
 for(let i=0;i<100;i++){
  mastered=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_shadow')||'{}').heroPaths?.aldren?.rank===1");
  if(mastered)break;await sleep(100);
 }
 assert.ok(mastered,'Server-backed hero discipline was not granted');
 assert.equal(goldBefore-(await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold")),250,
  'Hero discipline did not spend 250 gold in synthetic RPC');
 await evaluate("document.querySelector('[data-view=expedition]').click()");
 let regionsReady=false;
 for(let i=0;i<100;i++){
  regionsReady=await evaluate("!!document.querySelector('.shadow-stage-grid')&&document.querySelectorAll('.shadow-stage').length===4");
  if(regionsReady)break;await sleep(100);
 }
 assert.ok(regionsReady,'Four post-Act-II shadow regions were not rendered');
 assert.equal(await evaluate("document.querySelectorAll('[data-shadow-start]')[0]?.disabled"),false,
  'First frontier stage still locked for qualifying account');
 assert.equal(await evaluate("document.querySelectorAll('[data-shadow-start]')[1]?.disabled"),true,
  'Second frontier stage bypassed its Act II gate');
 await evaluate("document.querySelectorAll('[data-shadow-start]')[0].click()");
 let shadowBattle=false;
 for(let i=0;i<100;i++){
  shadowBattle=await evaluate("!!document.querySelector('.shadow-active-battle')&&!!document.querySelector('[data-shadow-move=feint]')&&!!document.querySelector('[data-shadow-move=rally]')");
  if(shadowBattle)break;await sleep(100);
 }
 assert.ok(shadowBattle,'New shadow battle was not playable');
 const shadowMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,regions:document.querySelectorAll('.shadow-stage').length})");
 assert.ok(shadowMobile.scroll<=shadowMobile.width+6,'Mobile Shadow Frontier horizontal overflow '+JSON.stringify(shadowMobile));
 await evaluate("document.querySelector('[data-shadow-move=feint]').click()");
 let turn=0;
 for(let i=0;i<100;i++){
  turn=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_shadow')||'{}').battle?.turn||0");
  if(turn===1)break;await sleep(100);
 }
 assert.equal(turn,1,'Shadow Frontier feint was not sent to its trusted RPC');
 console.log('PASS v2.38: advanced account hero path debit/lock, 4 frontier cards, new battle, feint RPC and 390px layout');

 // v2.39 full visual & reward acceptance: animated, distinct native SVG scenes,
 // three synthetic battle turns and an account-backed loot reveal. Real live battle
 // and account rewards are tested separately via transactional Supabase SQL.
 assert.equal(await evaluate("document.querySelectorAll('.shadow-stage-symbol svg').length"),4,
   'One or more stage boss illustrations missing');
 assert.equal(await evaluate("!!document.querySelector('.shadow-battle-visual svg[role=img]')"),true,
   'Live boss artwork not mounted');
 assert.equal(await evaluate("document.querySelector('.shadow-boss-phase')?.textContent.length>20"),true,
   'Live battle phase advice missing');
 // v2.40: full 3D scene exists with fallback, 13 biome motes,
 // audible controls start muted and voice is enabled only through a real click.
 const cinematic=await evaluate("({canvas:!!document.querySelector('[data-shadow-3d-canvas]'),svg:!!document.querySelector('.shadow-svg-backdrop svg'),motes:document.querySelectorAll('.shadow-ambient-motes i').length,controls:document.querySelectorAll('.shadow-av-controls button').length,voice:document.querySelector('[data-shadow-voice-toggle]')?.getAttribute('aria-pressed')})");
 assert.ok(cinematic.canvas&&cinematic.svg,'3D and illustrated fallback must both be present');
 assert.equal(cinematic.motes,13,'Boss biome does not have its own depth particles');
 assert.equal(cinematic.controls,3,'3D, SFX and TTS control surfaces are missing');
 assert.equal(cinematic.voice,'false','Boss voice should be opt-in on clean browser');
 await evaluate("document.querySelector('[data-shadow-render-toggle]').click()");
 assert.equal(await evaluate("document.querySelector('[data-shadow-render-toggle]').getAttribute('aria-pressed')"),'false',
  'User cannot opt for lightweight illustrated mode');
 await evaluate("document.querySelector('[data-shadow-render-toggle]').click()");
 assert.equal(await evaluate("document.querySelector('[data-shadow-render-toggle]').getAttribute('aria-pressed')"),'true',
  'User cannot return to genuine 3D model mode');
 await evaluate("document.querySelector('[data-shadow-audio-toggle]').click()");
 let audioReady=false;
 for(let i=0;i<45;i++){
  audioReady=await evaluate("document.querySelector('[data-shadow-audio-toggle]')?.getAttribute('aria-pressed')==='true'");
  if(audioReady)break;await sleep(60);
 }
 assert.ok(audioReady,'Player-initiated SFX toggle not honored');
 await evaluate("document.querySelector('[data-shadow-voice-toggle]').click()");
 let speechReady=false;
 for(let i=0;i<45;i++){
  speechReady=await evaluate("document.querySelector('[data-shadow-voice-toggle]')?.getAttribute('aria-pressed')==='true'");
  if(speechReady)break;await sleep(60);
 }
 assert.ok(speechReady,'Opt-in Turkish boss voice control not connected');
 assert.equal(await evaluate("document.querySelector('[data-shadow-caption]')?.textContent.includes('Köklerim')"),true,
  'Boss voice subtitle missing after activation');
 const cinematicMobile=await evaluate("({w:innerWidth,scroll:document.documentElement.scrollWidth,scene:document.querySelector('.shadow-battle-illustration')?.getBoundingClientRect().width})");
 assert.ok(cinematicMobile.scroll<=cinematicMobile.w+6,'Mobile 3D boss art overflow '+JSON.stringify(cinematicMobile));
 console.log('PASS v2.40: WebGL+SVG fallback, biome FX, opt-in SFX/Turkish TTS, 3D quality toggle and mobile viewport');
 await shot('shadow-frontier-v239-mobile-fight.png');
 await evaluate("document.querySelector('[data-shadow-move=strike]').click()");
 let shadowWave3=false;
 for(let i=0;i<100;i++){
  shadowWave3=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_shadow')||'{}').battle?.wave===3");
  if(shadowWave3)break;await sleep(100);
 }
 assert.ok(shadowWave3,'Synthetic three-wave boss did not progress to last phase');
 await evaluate("document.querySelector('[data-shadow-move=strike]').click()");
 let victoryReady=false;
 for(let i=0;i<110;i++){
  victoryReady=await evaluate("!!document.querySelector('.shadow-last-report.win .shadow-reward-ledger')&&!!document.querySelector('[data-loot-id=grave_seal]')");
  if(victoryReady)break;await sleep(100);
 }
 assert.ok(victoryReady,'Battle victory did not display real earned equipment and resource report');
 assert.equal(await evaluate("document.querySelector('.shadow-reward-resource[data-resource=gold]')?.textContent.includes('420')"),true,
  'Gold reward not shown using server values');
 assert.equal(await evaluate("document.querySelector('.shadow-result-stars')?.textContent.trim()"),'★★★','Win stars do not match verified report');
 const mobileVictory=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,loot:!!document.querySelector('.shadow-rare-loot')})");
 assert.ok(mobileVictory.scroll<=mobileVictory.width+6,'Mobile victory scene overflow '+JSON.stringify(mobileVictory));
 await shot('shadow-frontier-v239-victory.png');

 // v2.41: the account now earned 19 authentic renown from its first three-wave boss.
 // A one-time milestone claim must credit the village and become unavailable.
 assert.equal(await evaluate("document.querySelector('.shadow-mastery .mastery-rank-stamp b')?.textContent.includes('1')"),true,
  'Verified first Shadow Frontier victory did not reach mastery rank 1');
 assert.equal(await evaluate("document.querySelector('.shadow-result-renown')?.textContent.includes('+19')"),true,
  'Victory did not display the verified first-clear renown grant');
 assert.equal(await evaluate("document.querySelector('[data-shadow-action=claim_mastery]')?.disabled"),false,
  'Reached rank one milestone is not claimable');
 const masteryGoldBefore=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold");
 await evaluate("document.querySelector('[data-shadow-action=claim_mastery]').click()");
 let masteryClaimed=false;
 for(let i=0;i<100;i++){
  masteryClaimed=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_shadow')||'{}').masteryClaimed===1&&document.querySelector('[data-shadow-action=claim_mastery]')?.disabled===true");
  if(masteryClaimed)break;await sleep(100);
 }
 assert.ok(masteryClaimed,'One-time authenticated mastery milestone did not update and lock');
 const masteryGoldAfter=await evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot')).res.gold");
 assert.equal(masteryGoldAfter-masteryGoldBefore,140,'Mastery milestone did not grant exactly 140 gold');
 const masteryMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,ranks:document.querySelectorAll('.mastery-rank-list li').length})");
 assert.equal(masteryMobile.ranks,12,'Long-game roadmap does not show all twelve ranks');
 assert.ok(masteryMobile.scroll<=masteryMobile.width+6,
  'Mobile shadow mastery roadmap overflow '+JSON.stringify(masteryMobile));
 console.log('PASS v2.41: server win renown, 12 mastery ranks, one-time rank1 payout, weekly cap UI and mobile 390px');

 await evaluate("document.querySelector('[data-shadow-open-armory]').click()");
 let bagOpen=false;
 for(let i=0;i<80;i++){
  bagOpen=await evaluate("document.querySelector('#workspace')?.dataset.view==='armory'");
  if(bagOpen)break;await sleep(100);
 }
 assert.ok(bagOpen,'Victory loot inspect button did not open the actual bag view');
 console.log('PASS v2.39: 4 SVG boss art scenes, phase warnings, 3-wave loot, first-clear gear, mobile victory and bag navigation');






}finally{
 if(ws&&ws.readyState===1)ws.close();
 chrome.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true,maxRetries:2});
}
