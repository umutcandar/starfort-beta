import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shadow3DParts,shadowBossExpression,createShadow3D} from './shadow-boss-3d-v240.js';
import {createShadowBattleDirector} from './shadow-battle-director-v240.js';

test('four 3D bosses have uniquely placed facial geometry',()=>{
 const models=[1,2,3,4].map(shadow3DParts);
 assert.ok(models.every(parts=>parts.filter(p=>p.kind==='mouth').length===1));
 assert.equal(new Set(models.map(parts=>parts.find(p=>p.kind==='mouth').offset.join(','))).size,4);
 assert.ok(models.every(parts=>parts.find(p=>p.kind==='mouth').size.every(n=>n>0)));
});
test('expressions follow only presentation state, intent and reduced motion',()=>{
 for(const stage of [1,2,3,4]){
  const idle=shadowBossExpression(stage,{time:.3});
  assert.deepEqual([idle.mouth,idle.charge,idle.shield,idle.drain],[0,0,0,0]);
  assert.ok(shadowBossExpression(stage,{speaking:true,time:.5,wave:3}).mouth>0);
  for(const [intent,prop] of [['crush','charge'],['shield','shield'],['drain','drain']]){
   const e=shadowBossExpression(stage,{intent,time:.7});
   assert.ok(e[prop]>0);
   assert.equal(Object.entries(e).filter(([k,v])=>['charge','shield','drain'].includes(k)&&v>0).length,1);
   const reduced=shadowBossExpression(stage,{intent,speaking:true,reduceMotion:true,time:.7});
   assert.deepEqual([reduced.mouth,reduced.charge,reduced.shield,reduced.drain],[0,0,0,0]);
  }
 }
 assert.equal(shadowBossExpression(-100).stage,1);
 assert.equal(shadowBossExpression(100,{wave:10}).wave,3);
});
test('real Turkish TTS lifecycle cannot leave stale mouth animation after cancellation',()=>{
 const oldSpeech=globalThis.speechSynthesis,oldUtterance=globalThis.SpeechSynthesisUtterance;
 const spoken=[];
 globalThis.speechSynthesis={speak:u=>spoken.push(u),cancel:()=>{},getVoices:()=>[{lang:'tr-TR'}]};
 globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
 try{
  const store=new Map([['starfort:shadow-voice-v240','1']]);
  const director=createShadowBattleDirector({storage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},audioActive:()=>true});
  assert.equal(director.speaking,false);
  director.play([{type:'enter'}]);assert.equal(spoken.length,1);
  spoken[0].onstart();assert.equal(director.speaking,true);
  director.play([{type:'phase'}]);assert.equal(director.speaking,false);
  spoken[1].onstart();assert.equal(director.speaking,true);
  spoken[0].onend();assert.equal(director.speaking,true);
  spoken[1].onerror();assert.equal(director.speaking,false);
  director.play([{type:'crush'}]);spoken[2].onstart();
  director.toggleVoice();assert.equal(director.speaking,false);
  director.destroy();assert.equal(director.speaking,false);
 }finally{
  if(oldSpeech===undefined)delete globalThis.speechSynthesis;else globalThis.speechSynthesis=oldSpeech;
  if(oldUtterance===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=oldUtterance;
 }
});
test('disposable WebGL model retains SVG fallback and accessibility controls',()=>{
 const missing=createShadow3D({getContext:()=>null});
 assert.equal(missing.ok,false);missing.destroy();
 const director=readFileSync(new URL('./shadow-battle-director-v240.js',import.meta.url),'utf8');
 const model=readFileSync(new URL('./shadow-boss-3d-v240.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('./shadow-cinematic-v240.css',import.meta.url),'utf8');
 assert.match(director,/utterance\.onstart/);
 assert.match(director,/utterance\.onerror=finish/);
 assert.match(director,/model\?\.speak\?\./);
 assert.match(model,/speak\(active\)/);
 assert.match(model,/gl\.enable\(gl\.DEPTH_TEST\)/);
 assert.match(css,/data-shadow-speaking/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
