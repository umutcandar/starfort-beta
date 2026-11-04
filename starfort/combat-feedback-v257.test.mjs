import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {officialCombatImpact,officialCombatScene} from './official-combat-scene.js';
import {officialBattleDelta} from './official-battle-bridge.js';
import {createState} from './rules.js';
import {setLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {labeledBattleAction} from './first-minutes-v255.js';
import {sceneText} from './locale-official-scene-v247.js';
import {STARTUP_FLAGS,chromeArguments,launchChrome} from './scripts/chrome-devtools-launch.mjs';
const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const now=Date.UTC(2026,10,4,9);
const battle=(extra={})=>({
 mode:'story',stage:1,wave:2,waves:3,turn:3,power:267,
 playerHp:231,playerMaxHp:290,enemyHp:65,enemyMaxHp:144,
 startedAt:now-40_000,lastTurnAt:now-3300,enemyIntent:'shield',
 lastAction:'feint',lastRallyTurn:0,balanceVersion:6,cooldowns:{},...extra
});
test('official 2D stage shows only verified same-turn nonzero battle data',()=>{
 const b=battle();
 assert.equal(officialCombatImpact(b,{turn:3,initial:true,damage:50,received:25}),null);
 assert.equal(officialCombatImpact(b,{turn:2,initial:false,damage:50,received:25}),null);
 assert.equal(officialCombatImpact(b,{turn:3,initial:false,damage:0,received:0}),null);
 assert.equal(officialCombatImpact(b,{turn:3,initial:false,damage:-10,received:Infinity}),null);
 assert.equal(officialCombatImpact(b,{turn:3,initial:false,damage:NaN,received:0}),null);
 assert.deepEqual(officialCombatImpact(b,{turn:3,initial:false,damage:47,received:21}),{
  damage:47,received:21,healed:0
 });
});
test('all figures are valid, read-only values; reject injected or implausible HTML',()=>{
 const b=battle();
 const malicious={turn:3,initial:false,damage:'<img src=x onerror=alert(1)>',received:1e12,healed:0,waveAdvanced:true};
 assert.equal(officialCombatImpact(b,malicious),null);
 const hit=officialCombatImpact(b,{turn:3,initial:false,damage:110,received:0,healed:17,waveAdvanced:true});
 assert.deepEqual(hit,{damage:110,received:0,healed:17});
 assert.ok(Object.isFrozen(hit));
 const html=officialCombatScene(createState(now),b,{turn:3,initial:false,damage:47,received:21});
 assert.match(html,/class="official-combat-scene[^"]*has-verified-impact/);
 assert.match(html,/data-verified-turn="3"/);
 assert.match(html,/official-hit-floater foe">−47/);
 assert.match(html,/official-hit-floater ally">−21/);
 assert.doesNotMatch(html,/onerror=|<script|alert\(1\)/);
 assert.doesNotMatch(officialCombatScene(createState(now),b,{turn:2,initial:false,damage:47,received:21}),/official-hit-floater/);
 assert.doesNotMatch(officialCombatScene(createState(now),b,null),/official-hit-floater/);
});
test('real wave transitions show a NET heal, not imaginary incoming damage',()=>{
 const previous=battle({wave:1,turn:2,enemyHp:25,playerHp:211});
 const after=battle({wave:2,turn:3,enemyHp:150,playerHp:239,lastAction:'strike'});
 const delta=officialBattleDelta(previous,after);
 assert.equal(delta.waveAdvanced,true);
 assert.equal(delta.damage,25,'finished wave remaining enemy HP is resolved');
 assert.equal(delta.received,0,'recovered net health is not damage taken');
 assert.equal(delta.healed,28,'net player HP recovery comes from signed server snapshots');
 assert.match(officialCombatScene(createState(now),after,delta),/official-hit-floater healed">\+28/);
 assert.doesNotMatch(officialCombatScene(createState(now),after,delta),/official-hit-floater ally/);
});
test('no new attack or item bonus, game results or server RPC action is introduced',()=>{
 const scene=source('./official-combat-scene.js');
 const css=source('./account-expedition.css');
 const markup=source('./account-expedition.js');
 assert.match(scene,/export function officialCombatImpact/);
 assert.match(markup,/officialCombatScene\(game,mission,combatDelta\)/);
 assert.match(scene,/delta.turn!==mission.turn/);
 assert.match(scene,/aria-hidden="true"/);
 assert.match(css,/\.official-hit-floater\.foe/);
 assert.match(css,/\.official-hit-floater\.ally/);
 assert.match(css,/\.official-hit-floater\.healed/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(scene,/fetch\(|post\(|supabase|accountProgressRequest|service_role/i);
});
test('all 14 languages show translated Feint/Rally/hero skill in the actual fighting arena',()=>{
 const state=createState(now);
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   for(const action of ['feint','rally','strike','guard','skill:lyra']){
    const text=labeledBattleAction(action);
    assert.ok(text&&text!==action,lang+' '+action);
    const html=officialCombatScene(state,battle({lastAction:action}));
    const caption=action.startsWith('skill:')?sceneText('actorSkill',{hero:'Lyra'}):
      ['strike','guard'].includes(action)?sceneText(action):text;
    const rendered=html.match(/<div class="official-action-caption" role="status">([^<]*)<\/div>/)?.[1]
      ?.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&')??'';
    assert.ok(rendered.includes(caption),lang+' battle caption '+action+': '+rendered);
    if(lang!=='en'){
      assert.doesNotMatch(rendered,/^feint$/i);
      assert.doesNotMatch(rendered,/^rally$/i);
    }
   }
  }
 }finally{setLocale('tr')}
});
test('Chrome startup makes at most 3 isolated attempts; no gameplay retried',()=>{
 const args=chromeArguments('/tmp/unique-qa-profile-123');
 assert.ok(args.includes('--user-data-dir=/tmp/unique-qa-profile-123'));
 assert.ok(args.includes('--remote-debugging-port=0'));
 assert.ok(args.includes('--no-zygote'));
 assert.ok(args.includes('--disable-background-networking'));
 assert.ok(args.includes('--headless=new'));
 assert.equal(STARTUP_FLAGS.includes('--remote-allow-origins=*'),false);
 assert.throws(()=>chromeArguments(''),/profile/);
 assert.equal(typeof launchChrome,'function');
 const a=source('./scripts/four-player-agents.mjs');
 const b=source('./scripts/authenticated-browser-smoke.mjs');
 for(const src of [a,b]){
  assert.match(src,/launchChrome\(\{/);
  assert.match(src,/attempts:3,perAttemptMs:18000/);
  assert.match(src,/chrome\?\.kill\('SIGTERM'\)/);
 }
 const launcher=source('./scripts/chrome-devtools-launch.mjs');
 assert.match(launcher,/DBUS_SESSION_BUS_ADDRESS:''/);
 assert.match(launcher,/DBUS_SYSTEM_BUS_ADDRESS:''/);
 assert.match(launcher,/child\.kill\('SIGTERM'\)/);
 assert.match(launcher,/child\.kill\('SIGKILL'\)/);
 assert.match(launcher,/for\(let attempt=1;attempt<=attempts;attempt\+\+\)/);
});

test('broken Chrome executable retries only launch, then fails closed with clean profiles',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'starfort-chrome-launch-test-'));
 const attempts=[];
 try{
  await assert.rejects(
   launchChrome({profileRoot:root,chromeBin:'/definitely-missing-starfort-chromium',
    attempts:2,perAttemptMs:300,onRetry:info=>attempts.push(info)}),
   /Browser launch failed across 2 isolated attempts/
  );
  assert.equal(attempts.length,1,'Only one retry notification for two startup attempts');
  assert.equal(attempts[0].attempt,1);
 }finally{
  await rm(root,{recursive:true,force:true});
 }
});
