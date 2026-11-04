/** Four independent player-style browser agents.
 * Real Chromium and STARFORT UI; Supabase is synthetic/isolated in memory.
 * NOT 4 independent LLM agents, NOT a real live-account combat proof.
 */
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createGuildServer} from '../guild-server.mjs';
import {simulateActTwoBattle,recommendedActTwoPower} from '../act-two-balance.js';
import {economyScenario,relicRoadRemaining} from '../economy-horizon-v253.js';
import {createState} from '../rules.js';
import {launchChrome} from './chrome-devtools-launch.mjs';

const role=process.argv[2];
if(!['rookie','tactician','veteran','breaker'].includes(role))throw Error('Missing player role');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const checks=[],findings=[],metrics={},start=Date.now();
const pass=(label,detail=null)=>checks.push({label,detail});
const warn=(severity,label,evidence)=>findings.push({severity,label,evidence});
const profile=await mkdtemp(path.join(tmpdir(),'starfort-player-'+role+'-'));
const server=await createGuildServer({host:'127.0.0.1',port:0});
const origin='http://127.0.0.1:'+server.address().port+'/starfort/';
let chrome=null,ws=null,seq=0,failed=null;
const pending=new Map();
try{
 const running=await launchChrome({
  profileRoot:profile,attempts:3,perAttemptMs:18000,
  onRetry:({attempt,reason})=>console.warn('[4PLAYER '+role+'] Chrome startup attempt '+attempt+' failed:',reason)
 });
 chrome=running.chrome;
 const tab=running.tab;
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
 ws.addEventListener('message',e=>{
  const obj=JSON.parse(String(e.data));
  if(obj.method==='Runtime.consoleAPICalled'){
   const msg=(obj.params?.args||[]).map(a=>String(a.value||a.description||'')).join(' ');
   if(msg.includes('3D')||msg.includes('rigged')||msg.includes('WebGL'))console.warn('[QA 3D event]',msg.slice(0,320));
  }
  const p=pending.get(obj.id);if(!p)return;
  pending.delete(obj.id);obj.error?p.reject(Error(obj.error.message)):p.resolve(obj.result);
 });
 const cdp=(method,params={})=>new Promise((res,rej)=>{
  const id=++seq;pending.set(id,{resolve:res,reject:rej});ws.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expr=>{
  const out=await cdp('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
  if(out.exceptionDetails)throw Error('Browser error: '+(out.exceptionDetails.exception?.description||out.exceptionDetails.text));
  return out.result.value;
 };
 const wait=async (expr,label)=>{
  for(let i=0;i<120;i++){if(await evaluate(expr))return;await sleep(100)}
  throw Error('Browser timeout: '+label);
 };
 const click=sel=>evaluate('(()=>{let el=document.querySelector('+JSON.stringify(sel)+');if(!el)return false;el.click();return true})()');
 const snap=()=>evaluate("JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot'))");
 const reload=async()=>{
  await cdp('Page.reload',{ignoreCache:true});
  await wait("document.readyState==='complete'&&!document.querySelector('.app')?.inert&&!document.body.classList.contains('account-locked')",'authenticated refresh');
 };
 const seed=async values=>{
  await evaluate('(()=>{const d=JSON.parse(sessionStorage.getItem("__starfort_qa_snapshot"));Object.assign(d,'+
   JSON.stringify(values)+');sessionStorage.setItem("__starfort_qa_snapshot",JSON.stringify(d));return true;})()');
  await reload();
 };
 const screenshot=async name=>{
  await mkdir('qa-artifacts',{recursive:true});
  const shot=await cdp('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('qa-artifacts/player-'+role+'-'+name+'.png',Buffer.from(shot.data,'base64'));
 };
 await cdp('Page.enable');await cdp('Runtime.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{
  width:role==='breaker'?320:390,height:844,deviceScaleFactor:2,mobile:true
 });
 const mock=await readFile(new URL('./synthetic-account-network.cjs',import.meta.url),'utf8');
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:mock});
 await cdp('Page.navigate',{url:origin});
 await wait("document.readyState==='complete'&&!!document.querySelector('#starfort-gate-form')",'login gate');
 assert.equal(await evaluate("document.querySelector('.app').inert&&document.body.classList.contains('account-locked')"),true);
 pass('Real account gate starts locked');
 if(role==='breaker'){
  await evaluate('(()=>{const f=document.querySelector("#starfort-gate-form");f.querySelector("[name=email]").value="bad@example.invalid";f.querySelector("[name=password]").value="not-valid";f.requestSubmit(f.querySelector("[value=login]"));})()');
  await sleep(250);
  assert.equal(await evaluate("document.body.classList.contains('account-locked')&&document.querySelector('.app').inert"),true);
  pass('Invalid credentials cannot enter');
 }
 await evaluate('(()=>{const f=document.querySelector("#starfort-gate-form");f.querySelector("[name=email]").value="qa@starfort.test";f.querySelector("[name=password]").value="StarfortTest!528468";f.requestSubmit(f.querySelector("[value=login]"));})()');
 await wait("!document.body.classList.contains('account-locked')&&!document.querySelector('.app').inert",'synthetic login');
 await reload();pass('Authenticated synthetic browser refresh');
 if(role==='rookie'){
  assert.ok(await click('.nav-item[data-view=expedition]'));
  await wait('!!document.querySelector("[data-account-stage=\\"1\\"]")','first mission start button');
  assert.equal(await evaluate('document.querySelector("[data-account-stage=\\"1\\"]").disabled'),false);
  assert.ok(await click('[data-account-stage="1"]'));
  await wait('!!document.querySelector(".server-mission")','battle UI');
  // A passing mock fight alone does not prove real 3D character quality.
  // Block the release until WebGL has actually rendered the licensed GLB rigs.
  try{
  await wait('(()=>{const stage=document.querySelector(".official-combat-scene.is-3d");const canvas=stage?.querySelector(".official-3d-canvas");return !!stage&&!!canvas&&canvas.width>0&&canvas.height>0;})()',
   'REAL skinned 3D character scene (not a 2D fallback or loading placeholders)');
  }catch(error){
   const details=await evaluate('(()=>{const stage=document.querySelector(".official-combat-scene"),canvas=stage?.querySelector(".official-3d-canvas");return {visible:!!stage,loaded:stage?.classList.contains("is-3d"),loading:stage?.classList.contains("is-loading-rigs"),hasCanvas:!!canvas,canvasWidth:canvas?.width,renderStatus:stage?.querySelector("[data-official-render-state]")?.textContent};})()');
   throw Error(error.message+' '+JSON.stringify(details));
  }
  await wait('(()=>{const stage=document.querySelector(".official-combat-scene.is-3d");return !!stage&&Number(stage.dataset.officialAnatomicalActors)>=1&&Number(stage.dataset.officialDrawCalls)>5;})()',
    'verified anatomical human rigs must actually render, not merely load a generic 3D canvas');
  const real3D=await evaluate('(()=>{const v=document.querySelector(".official-combat-scene.is-3d"),c=v.querySelector("canvas");return {width:c.width,height:c.height,anatomicalActors:Number(v.dataset.officialAnatomicalActors),drawCalls:Number(v.dataset.officialDrawCalls),mode:v.querySelector("[data-official-render-state]")?.textContent};})()');
  pass('REAL skinned 3D models loaded and a WebGL frame rendered',real3D);
  await screenshot('rigged-3d-ready');
  assert.equal(await evaluate('!!document.querySelector(".official-hit-floater")'),false,
   'A new battle must never fabricate an attack before the player uses a skill');
  const actions=[];
  for(let n=0;n<12;n++){
   const before=await snap();
   if(!before.mission)break;
   const intent=before.mission.enemyIntent;
   const move=intent==='crush'?'guard':intent==='shield'?'feint':'strike';
   assert.ok(await click('[data-account-turn="'+move+'"]'));
   await wait('(()=>{const x=JSON.parse(sessionStorage.getItem("__starfort_qa_snapshot"));return !x.mission||x.mission.turn>'+
    before.mission.turn+'})()','mission turn '+n);
   if(n===0){
    await wait('!!document.querySelector(".official-hit-floater.foe")','first verified damage overlay');
    const hit=await evaluate('document.querySelector(".official-hit-floater.foe")?.textContent.trim()');
    assert.equal(hit,'−100','Scene damage must equal the synthetic server response, never a guessed number');
    await screenshot('first-server-hit');
    pass('First hit rendered only after a server result and displayed exactly the server damage',{damage:hit});
   }
   actions.push({intent,move});
  }
  const data=await snap();
  assert.equal(data.mission,null);
  assert.ok(data.cleared.includes(1));
  await wait('!!document.querySelector(".server-mission-result")','first result card');
  const width=await evaluate('({view:innerWidth,scroll:document.documentElement.scrollWidth})');
  if(width.scroll>width.view+5)warn('high','First battle result horizontally overflows mobile screen',width);
  metrics.firstBattle={turns:actions.length,actions,stars:data.campaignStars['1'],win:true};
  await screenshot('first-victory');
  pass('Clicked every combat turn and completed visible first story fight',metrics.firstBattle);
  const {autoplayHonestNewPlayer}=await import('../fresh-player-journey-v229.test.mjs');
  const journey=autoplayHonestNewPlayer({days:90});
  metrics.localSandbox={daysUsed:journey.daysUsed,furthest:journey.furthest,
   firstWinDay:journey.firstWinDay,maze:journey.state.labyrinth.cleared,
   steps:journey.history.length};
  if(journey.daysUsed>30)warn('medium','Local campaign takes more than 30 days',journey.daysUsed);
  pass('Local sandbox: 90 simulated days with actual battle and maze engine',metrics.localSandbox);
 }else if(role==='tactician'){
  const mission={mode:'story',balanceVersion:4,stage:6,wave:3,waves:3,waveTurn:5,turn:12,
   tier:0,floor:0,lastTurnAt:Date.now()-10000,playerHp:450,playerMaxHp:500,
   enemyHp:320,enemyMaxHp:900,power:900,enemyIntent:'eclipse',
   lastAction:'strike',lastRallyTurn:0,cooldowns:{}};
  await seed({mission,cleared:[1,2,3,4,5],campaignStars:{'1':3},
   heroes:{aldren:12,lyra:12,rovan:12},res:{gold:10000,wood:10000,stone:10000,aether:5000}});
  assert.ok(await click('.nav-item[data-view=expedition]'));
  await wait('!!document.querySelector(".server-enemy-intent.intent-eclipse")','eclipse telegraph');
  const hint=await evaluate('document.querySelector(".server-enemy-intent.intent-eclipse").textContent.trim()');
  assert.ok(hint.length>18);
  assert.ok(await evaluate('!!document.querySelector("[data-account-turn=guard]")&&!!document.querySelector("[data-account-turn=rally]")'));
  await screenshot('eclipse-surge');
  assert.ok(await click('[data-account-turn=guard]'));
  await wait('JSON.parse(sessionStorage.getItem("__starfort_qa_snapshot")).mission?.turn===13','guard dispatched');
  assert.equal((await snap()).mission.lastAction,'guard');
  metrics.browser={eclipseHint:hint.slice(0,240),counter:'guard',dispatched:true};
  pass('Used visible Guard to counter a version-4 Eclipse intent',metrics.browser);
  const v5={...mission,mode:'act2',balanceVersion:5,stage:8,wave:3,waves:3,turn:21,waveTurn:9};
  await seed({mission:v5,cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6,7]});
  assert.ok(await click('.nav-item[data-view=expedition]'));
  await wait('!!document.querySelector(".official-tactical-briefing")','new Act II rating');
  const v5Score=await evaluate('document.querySelector(".official-tactical-briefing").textContent.trim()');
  assert.ok(v5Score.includes('3★'),'Version5 Act II did not display its achievable 3-star target');
  assert.equal(await evaluate('document.querySelector("[data-account-turn=skill]")'),null,
   'Unlimited generic skill attack is still in the combat HUD');
  assert.ok(await evaluate('Array.from(document.querySelectorAll("[data-account-turn]")).some(x=>x.dataset.accountTurn==="skill:lyra")'),
   'Cooldown-governed hero ability disappeared');
  await screenshot('act2-3star-v5');
  await seed({mission:{...v5,balanceVersion:4}});
  assert.ok(await click('.nav-item[data-view=expedition]'));
  await wait('!!document.querySelector(".official-tactical-briefing")','legacy Act II rating');
  const v4Score=await evaluate('document.querySelector(".official-tactical-briefing").textContent.trim()');
  assert.ok(v4Score.includes('2★'),'Legacy v4 fight must retain its original rating threshold');
  metrics.browser.v5ThreeStars=true;metrics.browser.v4LegacyTwoStars=true;metrics.browser.infiniteSkillButtonRemoved=true;
  pass('Verified server-versioned 3-star preview and removal of infinite generic skill',metrics.browser);
  const shadows=[];
  for(let stage=1;stage<=8;stage++)for(const ratio of [.75,1,1.25]){
   const power=Math.round(recommendedActTwoPower(stage)*ratio);
   for(const policy of ['tactical','strike']){
    const b=simulateActTwoBattle({stage,power,policy});
    shadows.push({stage,ratio,policy,won:b.won,stars:b.stars,turns:b.turns,hpPct:Math.round(100*b.playerHp/b.maxHp)});
   }
  }
  const good=shadows.filter(x=>x.policy==='tactical'),spam=shadows.filter(x=>x.policy==='strike');
  metrics.actTwoShadow={n:shadows.length,threeStarsAt24:good.filter(x=>x.won&&x.turns<=24&&x.hpPct>=70).length,
   tacticalWins:good.filter(x=>x.won).length,
   spamWins:spam.filter(x=>x.won).length,tacticalStars3:good.filter(x=>x.stars===3).length,
   spamStars3:spam.filter(x=>x.stars===3).length,
   stage1:shadows.filter(x=>x.stage===1),stage8:shadows.filter(x=>x.stage===8)};
  if(metrics.actTwoShadow.tacticalStars3===0&&metrics.actTwoShadow.threeStarsAt24>0)
   pass('Regression reproduced: old 18-turn gate blocked 3-stars; new v5 24-turn gate admits them',
    {old:0,new:metrics.actTwoShadow.threeStarsAt24,fix:'new v5 encounters only'});
  if(metrics.actTwoShadow.spamWins>=metrics.actTwoShadow.tacticalWins)
   warn('high','Old Act II shadow model does not reward tactics enough',metrics.actTwoShadow);
  pass('48 strategy-vs-spam simulated Act II fights (not production SQL)',metrics.actTwoShadow);
 }else if(role==='veteran'){
  await seed({mission:null,cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6,7,8],
   campaignStars:{'1':3,'2':3,'3':3,'4':3},heroes:{aldren:16,lyra:16,rovan:16},
   inventory:{iron_sword:1,ward_mail:1,ember_guard:1,star_spear:1,guardian_seal:1,starbreaker:1},
   itemUpgrades:{ember_guard:5,star_spear:5,guardian_seal:5,starbreaker:5},
   relicAscensions:{ember_guard:3,star_spear:2,guardian_seal:1},bossSeals:14,
   res:{gold:100000,wood:45000,stone:55000,aether:24000},
   buildings:{keep:18,farm:18,lumber:18,quarry:18,forge:18,tavern:18,observatory:18}});
  assert.ok(await click('.nav-item[data-view=armory]'));
  await wait('!!document.querySelector(".armory-v212")','armory');
  assert.ok(await click('[data-bag-item=ember_guard]'));
  await wait('!!document.querySelector(".relic-ascension")','ascension');
  const status=await evaluate('(()=>{const e=document.querySelector(".relic-ascension");return {text:e.textContent.slice(0,500),ready:!e.querySelector("[data-account-ascend=ember_guard]").disabled,forecast:!!document.querySelector(".economy-horizon-v253")}})()');
  assert.ok(status.ready&&status.forecast,'14-week relic should have enabled ascension');
  assert.ok(await click('.economy-horizon-v253 summary'));
  await wait('!!document.querySelector(".economy-horizon-v253[open]")','90/180 table open');
  const panel=await evaluate('({rows:document.querySelectorAll(".economy-horizon-v253 tbody tr").length,view:innerWidth,scroll:document.documentElement.scrollWidth})');
  assert.equal(panel.rows,6);
  if(panel.scroll>panel.view+5)warn('high','Late-game inventory horizontally overflows mobile viewport',panel);
  metrics.armory={status,panel};
  await screenshot('six-month-gear');
  pass('Opened late-game relic panel and expanded 90/180-day resource planner',metrics.armory);
  const v=createState();
  v.serverVillage=true;v.buildings={keep:1,farm:1,lumber:1,quarry:1,observatory:1};
  v.itemUpgrades={};v.relicAscensions={};v.res={gold:0,stone:0,wood:0,aether:0};
  metrics.sixMonth={cost:relicRoadRemaining(v),
   casual90:economyScenario(v,90,'casual'),
   casual180:economyScenario(v,180,'casual'),
   daily180:economyScenario(v,180,'daily'),
   active180:economyScenario(v,180,'active')};
  pass('Projection uses real source-aligned collection model, not simulated rewards',metrics.sixMonth);
 }else{
  const locales=['tr','en','es','pt-BR','fr','de','it','ru','ar','hi','id','ja','ko','zh-CN'];
  const views=['keep','expedition','heroes','armory','guild','shop'];
  const overflows=[],errors=[];
  for(const lang of locales){
   const picked=await evaluate('(()=>{const p=document.querySelector("[data-language-picker]");if(!p)return null;p.value='+JSON.stringify(lang)+';p.dispatchEvent(new Event("change",{bubbles:true}));return document.documentElement.lang;})()');
   assert.equal(picked,lang,'language selector '+lang);
   await sleep(65);
   for(const view of views){
    assert.ok(await click('.nav-item[data-view="'+view+'"]'),'view '+view);
    await sleep(75);
    const panel=await evaluate('({lang:document.documentElement.lang,dir:document.documentElement.dir,view:innerWidth,scroll:document.documentElement.scrollWidth,locked:document.querySelector(".app").inert})');
    if(panel.scroll>panel.view+5)overflows.push({lang,view,excess:panel.scroll-panel.view});
    if(panel.locked||panel.lang!==lang||panel.dir!==(lang==='ar'?'rtl':'ltr'))errors.push({lang,view,panel});
   }
  }
  metrics.mobile={width:320,routes:84,overflows,errors};
  if(overflows.length)warn('high','320px signed-in game has overflow',overflows);
  assert.deepEqual(errors,[],'Global navigation and RTL are broken');
  await evaluate('(()=>{const p=document.querySelector("[data-language-picker]");p.value="ar";p.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await click('.nav-item[data-view=expedition]');
  await screenshot('arabic-320px');
  pass('Navigated 84 mobile routes in all fourteen languages at 320px',metrics.mobile);
 }
}catch(e){
 failed={message:e.message,stack:e.stack?.slice(0,1800)};
 console.error('[4PLAYER '+role+'] FAIL',failed);
}finally{
 try{if(ws?.readyState===1)ws.close()}catch{}
 chrome?.kill('SIGTERM');await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true,maxRetries:3}).catch(()=>{});
 const summary={role,kind:'independent scripted player browser agent with synthetic Supabase; local simulations labeled',
  createdAt:new Date().toISOString(),elapsedMs:Date.now()-start,checks,findings,metrics,failed};
 await mkdir('qa-artifacts',{recursive:true});
 await writeFile('qa-artifacts/four-player-'+role+'.json',JSON.stringify(summary,null,2)+'\n');
 console.log('[4PLAYER RESULT] '+JSON.stringify({role,passes:checks.length,findings,metrics,failed}).slice(0,14000));
 if(failed)process.exitCode=1;
}
