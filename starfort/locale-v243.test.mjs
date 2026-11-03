import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveLocale,getLocale,setLocale,t,formatNumber,applyLocaleUI} from './locale-v243.js';
import {shadowVoiceLines,shadowVoiceStatus} from './shadow-battle-director-v240.js';
import {shadowFrontierMarkup} from './shadow-frontier-v238.js';
import {shadowMasteryMarkup} from './shadow-mastery-v241.js';
import {shadowVictoryMarkup} from './shadow-rewards-v239.js';
const blank=()=>({heroPaths:{},cleared:[],stars:{},battle:null,lastReport:null,revision:1,
 masteryXp:0,masteryRank:0,masteryClaimed:0,weeklyRenown:0,weeklyWins:0,weeklyLimit:100,week:'2026-45'});
const account=()=>({heroes:{aldren:10,lyra:10,rovan:10},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6,7,8],
 act2Cleared:[1,2,3,4,5,6,7,8],mission:null});

test('browser language detection defaults to English internationally and keeps Turkish users in Turkish',()=>{
 assert.equal(resolveLocale(null,['en-US','tr-TR']),'en');
 assert.equal(resolveLocale(null,['tr-TR','en-US']),'tr');
 assert.equal(resolveLocale(null,['fr-FR']),'en');
 assert.equal(resolveLocale('tr',['en-US']),'tr');
 assert.equal(resolveLocale('en',['tr-TR']),'en');
 assert.equal(resolveLocale('zz',['tr-TR']),'tr');
});
test('language switch changes only display state, preserves IDs and server-authoritative RPCs',()=>{
 const storage=globalThis.localStorage;
 const values=new Map();
 globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 try{
  assert.equal(setLocale('en'),'en');
  assert.equal(getLocale(),'en');
  assert.equal(values.get('starfort:language-v243'),'en');
  assert.equal(t('gate.title'),'Build your kingdom');
  assert.equal(t('nav.expedition'),'Expeditions');
  assert.equal(t('resource.aether'),'Star essence');
  assert.equal(formatNumber(12345),'12,345');
  assert.equal(setLocale('ru'),'en','unsupported locales must not be stored');
  assert.equal(setLocale('tr'),'tr');
  assert.equal(formatNumber(12345),'12.345');
  assert.equal(t('gate.title'),'Kendi krallığını kur');
 }finally{
  if(storage===undefined)delete globalThis.localStorage;else globalThis.localStorage=storage;
  setLocale('tr');
 }
});
test('document tags and accessible switch states match language without HTML injection',()=>{
 setLocale('en');
 const title={dataset:{i18n:'gate.title'},textContent:''};
 const placeholder={getAttribute:()=> 'gate.passwordPlaceholder',setAttribute(k,v){this[k]=v;}};
 const tr={dataset:{language:'tr'},setAttribute(k,v){this[k]=v;}};
 const en={dataset:{language:'en'},setAttribute(k,v){this[k]=v;}};
 const doc={documentElement:{},title:'',querySelectorAll(selector){
  return {'[data-i18n]':[title],'[data-i18n-placeholder]':[placeholder],
   '[data-i18n-aria-label]':[],'[data-language]':[tr,en]}[selector]||[];
 }};
 applyLocaleUI(doc);
 assert.equal(doc.documentElement.lang,'en');assert.equal(doc.documentElement.dir,'ltr');
 assert.equal(title.textContent,'Build your kingdom');
 assert.equal(placeholder.placeholder,'At least 8 characters');
 assert.equal(tr['aria-pressed'],'false');assert.equal(en['aria-pressed'],'true');
 setLocale('tr');
});
test('English boss names, voice synthesis, masteries, verified battle receipts render without client rewards',()=>{
 try{
  setLocale('en');
  const front=shadowFrontierMarkup(blank(),account());
  assert.match(front,/Shadow Frontier/);
  assert.match(front,/Thorn Sentinel/);
  assert.match(front,/Eclipse Sovereign/);
  assert.match(front,/Start expedition/);
  assert.doesNotMatch(front,/YENİ PERDE/);
  assert.match(shadowVoiceLines(1).enter,/roots/);
  assert.match(shadowVoiceLines(4).defeat,/sun/);
  assert.match(shadowVoiceStatus().caption,/browser/);
  const mastery=shadowMasteryMarkup({...blank(),masteryXp:19,masteryRank:1,weeklyRenown:19,weeklyWins:1});
  assert.match(mastery,/Frontier Mastery/);assert.match(mastery,/Apprentice Watcher/);
  assert.match(mastery,/renown/);
  const receipt=shadowVictoryMarkup({won:true,stage:1,stars:3,turns:9,renown:19,
   reward:{gold:420,wood:50,stone:30,aether:14}},[]);
  assert.match(receipt,/Shadow Frontier Victory/);
  assert.match(receipt,/420/);assert.match(receipt,/Gold/);
  assert.match(receipt,/Close result/);
 }finally{setLocale('tr');}
});
test('account gate has two selectable languages and no guest path',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(html,/data-language="tr"/);
 assert.match(html,/data-language="en"/);
 assert.match(html,/data-i18n="gate.title"/);
 assert.match(html,/locale-v243.css/);
 assert.match(app,/if\(button\.dataset\.language\)/);
 assert.match(app,/applyLocaleUI\(document\)/);
 assert.match(app,/getLocale\(\)/);
 assert.doesNotMatch(html,/data-welcome="guest"/);
});
