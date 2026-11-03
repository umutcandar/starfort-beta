import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shadow3DParts,shadow3DSceneSignature,createShadow3D} from './shadow-boss-3d-v240.js';
import {shadowCombatEffects,shadowVoiceLines,shadowAtmosphereParticles,shadowVoiceStatus,
 createShadowBattleDirector} from './shadow-battle-director-v240.js';
import {shadowFrontierMarkup,validateShadowSnapshot} from './shadow-frontier-v238.js';
const empty=()=>({ok:true,source:'server-shadow',heroPaths:{},cleared:[],stars:{},battle:null,
 lastReport:null,revision:1});
const b=({stage=1,wave=1,turn=0,enemyHp=320,enemyMaxHp=320,playerHp=350,lastAction='Başladı',enemyIntent='strike'}={})=>({
 mode:'shadow',stage,wave,waves:3,turn,waveTurn:turn,power:840,playerHp,playerMaxHp:350,
 enemyHp,enemyMaxHp,enemyIntent,attackRanks:0,wardRanks:0,lastRallyTurn:0,lastTurnAt:Date.now()-3500,
 cooldowns:{},lastAction
});
const account=()=>({heroes:{aldren:15,lyra:15,rovan:15},team:['aldren','lyra','rovan'],
 cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2],mission:null});
test('four stage WebGL boss rigs are uniquely built from actual 3D geometric primitives',()=>{
 const s=[1,2,3,4].map(x=>shadow3DSceneSignature(x,3,'crush'));
 assert.deepEqual(s.map(x=>x.stage),[1,2,3,4]);
 assert.ok(s.every(x=>x.pieces>=15&&x.wave===3));
 assert.equal(new Set(s.map(x=>x.pieces)).size>=3,true);
 for(const id of [1,2,3,4]){
  const parts=shadow3DParts(id);
  assert.ok(parts.some(x=>x.mesh==='cone'));
  assert.ok(parts.some(x=>x.mesh==='orb'));
  assert.ok(parts.every(x=>x.offset.length===3&&x.size.length===3&&x.color.length===3));
  assert.ok(parts.every(x=>['cone','orb','ring','cube'].includes(x.mesh)));
  assert.ok(parts.every(x=>x.color.every(n=>n>=0&&n<=1)));
 }
 assert.equal(shadow3DSceneSignature(0).stage,1);
 assert.equal(shadow3DSceneSignature(90).stage,4);
});
test('old hardware returns SVG fallback safely without WebGL or any server mutation',()=>{
 const none=createShadow3D(null);
 assert.equal(none.ok,false);none.sync({wave:3});none.destroy();
 const noGL=createShadow3D({getContext:()=>null});
 assert.equal(noGL.ok,false);noGL.destroy();
});
test('v2.40 verified hit reactions never invent damage across a new wave',()=>{
 const start=shadowCombatEffects(empty(),{...empty(),battle:b()},'start');
 assert.deepEqual(start.map(x=>x.type),['enter','phase']);
 const prev=b({wave:1,turn:2,enemyHp:150,enemyMaxHp:320,enemyIntent:'shield'});
 const next=b({wave:1,turn:3,enemyHp:95,enemyMaxHp:320,playerHp:335,lastAction:'feint'});
 const events=shadowCombatEffects({...empty(),battle:prev},{...empty(),battle:next},'turn');
 assert.deepEqual(events.map(x=>x.type),['feint','impact','crush','shield-break']);
 assert.equal(events.find(x=>x.type==='impact').amount,55);
 assert.equal(events.find(x=>x.type==='crush').amount,15);
 const waveNext=b({wave:2,turn:4,enemyHp:400,enemyMaxHp:400,lastAction:'strike'});
 const transition=shadowCombatEffects({...empty(),battle:prev},{...empty(),battle:waveNext},'turn');
 assert.ok(transition.some(x=>x.type==='phase'));
 assert.ok(!transition.some(x=>x.type==='impact'));
 const won={...empty(),battle:null,lastReport:{won:true,stage:1,stars:3,reward:{gold:420}}};
 assert.ok(shadowCombatEffects({...empty(),battle:prev},won,'turn').some(x=>x.type==='victory'));
 const abandoned=shadowCombatEffects({...empty(),battle:prev},empty(),'abandon');
 assert.deepEqual(abandoned.map(x=>x.type),['abandon']);
});
test('Turkish boss lines are original, stage-specific and remain opt-in',()=>{
 const stages=[1,2,3,4].map(shadowVoiceLines);
 assert.equal(new Set(stages.map(x=>x.enter)).size,4);
 assert.ok(stages.every(x=>Object.values(x).every(s=>s.length>=10&&s.length<=120)));
 assert.equal(shadowVoiceStatus({audio:false,voice:true}).voice,false);
 assert.equal(shadowVoiceStatus({audio:true,voice:true}).voice,true);
 assert.match(shadowVoiceStatus().caption,/profesyonel kayıt değildir/);
 const particles=[1,2,3,4].map(shadowAtmosphereParticles);
 assert.ok(particles.every(x=>x.length===13&&x.every(p=>p.x>=0&&p.x<=100&&p.duration>=4)));
 assert.notDeepEqual(particles[0],particles[1]);
});
test('audio/voice/3D preferences are local, safe on unsupported browsers and allow returning to 2D',()=>{
 const state=new Map();
 const storage={getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)};
 const c=createShadowBattleDirector({storage,audioActive:()=>false,reduceMotion:()=>true});
 assert.equal(c.quality3D,true);
 assert.equal(c.voiceEnabled,false);
 assert.equal(c.mount(null,null),false);
 assert.deepEqual(c.play([{type:'attack'},{type:'bogus'}]),['attack']);
 assert.equal(c.toggleQuality(),false);
 assert.equal(state.get('starfort:shadow-render-v240'),'2d');
 assert.equal(c.toggleQuality(),true);
 assert.equal(c.toggleVoice(),true);
 assert.equal(state.get('starfort:shadow-voice-v240'),'1');
 assert.equal(c.toggleVoice(),false);
 c.dispose();c.destroy();
});
test('authenticated Gölge Sınırı renders real canvas, fallback art, biome particles and explicit controls',()=>{
 const front=validateShadowSnapshot({...empty(),battle:b({wave:3,stage:4,enemyHp:79,enemyMaxHp:300,enemyIntent:'crush'})});
 const html=shadowFrontierMarkup(front,account(),Date.now(),false,
  {audioEnabled:true,voiceEnabled:true,render3D:true});
 assert.match(html,/data-shadow-3d-canvas/);
 assert.match(html,/class="shadow-svg-backdrop"/);
 assert.match(html,/class="shadow-ambient-motes"/);
 assert.equal((html.match(/data-particle="/g)||[]).length,13);
 assert.match(html,/data-shadow-render-toggle aria-pressed="true"/);
 assert.match(html,/data-shadow-audio-toggle aria-pressed="true"/);
 assert.match(html,/data-shadow-voice-toggle aria-pressed="true"/);
 assert.match(html,/data-shadow-caption/);
 assert.match(html,/data-boss-enraged="true"/);
 const lite=shadowFrontierMarkup(front,account(),Date.now(),false,
  {audioEnabled:false,voiceEnabled:true,render3D:false});
 assert.match(lite,/data-shadow-render-toggle aria-pressed="false"/);
 assert.match(lite,/data-shadow-voice-toggle aria-pressed="false" disabled/);
});
test('renderer and client hooks respect reduced motion, verified RPC and real user gestures',()=>{
 const css=readFileSync(new URL('./shadow-cinematic-v240.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.has-real-webgl \.shadow-boss-webgl/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/\.shadow-vfx-impact/);
 const src=readFileSync(new URL('./shadow-boss-3d-v240.js',import.meta.url),'utf8');
 assert.match(src,/getContext\('webgl2'/);
 assert.match(src,/gl\.enable\(gl\.DEPTH_TEST\)/);
 assert.match(src,/requestAnimationFrame\(frame\)/);
 assert.match(src,/gl\.deleteBuffer/);
 assert.match(src,/shadow-battle-illustration'\)\?\.classList\.remove\('has-real-webgl'/);
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(app,/shadowCombatEffects\(previous,response\.snapshot,action\)/);
 assert.match(app,/shadowDirector\.play\(serverFx\)/);
 assert.match(app,/shadowDirector\.unlock\(\)/);
 assert.match(app,/shadowDirector\.mount\(/);
 assert.match(app,/data-shadow-audio-toggle/);
 assert.match(app,/data-shadow-voice-toggle/);
 assert.match(app,/data-shadow-render-toggle/);
});
