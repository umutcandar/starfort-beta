/** v2.44 multilingual: translations are beta, server state must remain untouched. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGE_META,EXTRA_TRANSLATIONS,EXTRA_TRANSLATION_KEYS} from './locale-global-v244.js';
import {CORE_COMPLETION_TRANSLATIONS} from './locale-core-completion-v247.js';
import {LOCALE_KEY,SUPPORTED_LOCALES,resolveLocale,normalizeLocale,setLocale,getLocale,t,formatNumber,getLocaleDirection,applyLocaleUI,languagePickerMarkup} from './locale-v243.js';
import {shadowVoiceLines,shadowVoiceStatus} from './shadow-battle-director-v240.js';
import {shadowFrontierMarkup} from './shadow-frontier-v238.js';
import {SHADOW_STAGE_NATIVE} from './locale-shadow-stages-v247.js';
import {bilingual} from './locale-unified-v247.js';
import {shadowMasteryMarkup} from './shadow-mastery-v241.js';
import {shadowVictoryMarkup} from './shadow-rewards-v239.js';
const FRONT={heroPaths:{},cleared:[],stars:{},battle:null,lastReport:null,revision:1,masteryXp:0,masteryRank:0,masteryClaimed:0,weeklyRenown:0,weeklyWins:0,weeklyLimit:100,week:'2026-45'};
const ACCOUNT={heroes:{aldren:10,lyra:10,rovan:10},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6,7,8],mission:null};

test('all fourteen supported languages have unique canonical metadata and twelve complete core beta dictionaries',()=>{
 assert.equal(LANGUAGE_META.length,14);
 assert.equal(SUPPORTED_LOCALES.length,14);
 assert.equal(new Set(LANGUAGE_META.map(x=>x.id)).size,14);
 assert.deepEqual(SUPPORTED_LOCALES,LANGUAGE_META.map(x=>x.id));
 assert.equal(LANGUAGE_META.find(x=>x.id==='ar').dir,'rtl');
 assert.equal(LANGUAGE_META.filter(x=>x.dir==='rtl').length,1);
 assert.equal(EXTRA_TRANSLATION_KEYS.length,41);
 assert.equal(new Set(EXTRA_TRANSLATION_KEYS).size,41);
 assert.equal(Object.keys(EXTRA_TRANSLATIONS).length,12);
 for(const [lang,dict] of Object.entries(EXTRA_TRANSLATIONS)){
  assert.ok(SUPPORTED_LOCALES.includes(lang));
  assert.deepEqual(Object.keys(dict).sort(),[...EXTRA_TRANSLATION_KEYS].sort(),lang+' has incomplete core messages');
  for(const [key,value] of Object.entries(dict)){
   assert.equal(typeof value,'string',lang+': '+key);
   assert.ok(value.trim().length>0,lang+': empty '+key);
   assert.doesNotMatch(value,/<script|onerror=|javascript:/i,lang+': executable translation');
  }
 }
});
test('BCP-47 browser languages, explicit saved choices and unsupported fallback are deterministic',()=>{
 assert.equal(resolveLocale(null,['es-MX','en-US']),'es');
 assert.equal(resolveLocale(null,['pt-PT']),'pt-BR');
 assert.equal(resolveLocale(null,['zh-Hans-CN']),'zh-CN');
 assert.equal(resolveLocale(null,['zh-TW']),'en','never claim traditional Chinese translation');
 assert.equal(resolveLocale(null,['ar-EG']),'ar');
 assert.equal(resolveLocale(null,['ja-JP']),'ja');
 assert.equal(resolveLocale(null,['ko-KR']),'ko');
 assert.equal(resolveLocale(null,['id-ID']),'id');
 assert.equal(resolveLocale(null,['de-DE','fr-FR']),'de');
 assert.equal(resolveLocale('tr',['ru-RU']),'tr');
 assert.equal(resolveLocale('ru',['tr-TR']),'ru');
 assert.equal(resolveLocale('not-supported',['xx-XX','fr-FR']),'fr');
 assert.equal(resolveLocale(null,['zz-ZZ']),'en');
 assert.equal(normalizeLocale('pt_BR'),'pt-BR');
 assert.equal(normalizeLocale('__invalid_'),null);
});
test('every extra language translates account controls and menu, falls back to English for unfinished screens',()=>{
 try{
  for(const locale of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
   setLocale(locale);
   assert.equal(getLocale(),locale);
   assert.equal(t('gate.login'),EXTRA_TRANSLATIONS[locale]['gate.login']);
   assert.equal(t('gate.title'),EXTRA_TRANSLATIONS[locale]['gate.title']);
   assert.equal(t('nav.expedition'),EXTRA_TRANSLATIONS[locale]['nav.expedition']);
   assert.equal(t('settings.language'),EXTRA_TRANSLATIONS[locale]['settings.language']);
   assert.equal(t('settings.controls'),CORE_COMPLETION_TRANSLATIONS[locale]['settings.controls'],'settings controls now have native translations');
   assert.equal(t('auth.locked'),EXTRA_TRANSLATIONS[locale]['auth.locked']);
   assert.ok(formatNumber(1250).length>0);
   const front=shadowFrontierMarkup(FRONT,ACCOUNT);
   assert.ok(front.includes(bilingual('Gölge Sınırı','Shadow Frontier')));
   assert.ok(front.includes(SHADOW_STAGE_NATIVE[locale][0].boss));
   assert.doesNotMatch(front,/Gölge Sınırı/);
   const mastery=shadowMasteryMarkup({...FRONT,masteryXp:19,masteryRank:1,weeklyRenown:19,weeklyWins:1});
   assert.ok(mastery.includes(bilingual('Sınır Ustalığı','Frontier Mastery')));
   const report=shadowVictoryMarkup({won:true,stage:1,stars:3,turns:8,renown:10,reward:{gold:420}},[]);
   assert.match(report,/Shadow Frontier Victory/);
   assert.match(report,/Gold/);
   assert.match(shadowVoiceLines(1).enter,/roots/,'unsupported voice tracks fall back to English');
   assert.equal(shadowVoiceStatus().caption,CORE_COMPLETION_TRANSLATIONS[locale]['audio.voiceNote']);
  }
 }finally{setLocale('tr');}
});
test('locale preference persists without touching the account session, credentials or progress',()=>{
 const old=globalThis.localStorage;
 const store=new Map([['starfort:account-session','DO_NOT_TOUCH'],['starfort:v1','DO_NOT_TOUCH']]);
 globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 try{
  setLocale('ar');
  assert.equal(getLocale(),'ar');
  assert.equal(store.get(LOCALE_KEY),'ar');
  assert.equal(store.get('starfort:account-session'),'DO_NOT_TOUCH');
  assert.equal(store.get('starfort:v1'),'DO_NOT_TOUCH');
  setLocale('ja');
  assert.equal(store.get(LOCALE_KEY),'ja');
  setLocale('unknown');
  assert.equal(getLocale(),'ja');
  assert.equal(store.size,3);
 }finally{
  if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;
  setLocale('tr');
 }
});
test('Arabic sets actual RTL and all language controls track current selected locale',()=>{
 try{
  setLocale('ar');
  const gate={dataset:{i18n:'gate.title'},textContent:''};
  const picker={value:''};
  const tr={dataset:{language:'tr'},setAttribute(k,v){this[k]=v;}};
  const en={dataset:{language:'en'},setAttribute(k,v){this[k]=v;}};
  const doc={documentElement:{},title:'',querySelectorAll(s){
   return {'[data-i18n]':[gate],'[data-i18n-placeholder]':[],
    '[data-i18n-aria-label]':[],'[data-language]':[tr,en],
    '[data-language-picker]':[picker]}[s]||[];
  }};
  applyLocaleUI(doc);
  assert.equal(doc.documentElement.lang,'ar');
  assert.equal(doc.documentElement.dir,'rtl');
  assert.equal(getLocaleDirection(),'rtl');
  assert.equal(gate.textContent,EXTRA_TRANSLATIONS.ar['gate.title']);
  assert.equal(picker.value,'ar');
  assert.equal(tr['aria-pressed'],'false');
  assert.equal(en['aria-pressed'],'false');
  assert.equal((languagePickerMarkup().match(/<option /g)||[]).length,14);
  assert.match(languagePickerMarkup(),/value="ar" selected/);
  setLocale('de');applyLocaleUI(doc);
  assert.equal(doc.documentElement.dir,'ltr');
  assert.equal(picker.value,'de');
 }finally{setLocale('tr');}
});
test('account-required page offers all 14 languages before login, with localized settings chooser',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 assert.match(html,/data-language-picker/);
 assert.equal((html.match(/<option value="/g)||[]).length,14);
 assert.match(html,/v2\.\d+\.\d+/);
 assert.match(app,/languagePickerMarkup\(\)/);
 assert.ok(app.includes("picker?.matches?.('[data-language-picker]')"));
 assert.match(app,/setLocale\(picker\.value\)/);
 assert.match(app,/if\(!accountReady\(\)\)/);
 assert.doesNotMatch(html,/data-welcome="guest"/);
});
