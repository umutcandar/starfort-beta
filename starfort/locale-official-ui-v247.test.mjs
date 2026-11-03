import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {OFFICIAL_KEYS,OFFICIAL_TRANSLATIONS,officialText,auditOfficialTranslations} from './locale-official-ui-v247.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import * as R from './rules.js';
test('46 verified account and combat labels have all twelve additional language translations',()=>{
 assert.equal(OFFICIAL_KEYS.length,129);
 assert.equal(new Set(OFFICIAL_KEYS).size,129);
 assert.deepEqual(Object.keys(OFFICIAL_TRANSLATIONS).sort(),SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en').sort());
 assert.deepEqual(auditOfficialTranslations(),[]);
 for(const [lang,values] of Object.entries(OFFICIAL_TRANSLATIONS)){
  assert.deepEqual(Object.keys(values).sort(),[...OFFICIAL_KEYS].sort(),lang);
  for(const text of Object.values(values))assert.ok(text.trim()&&!/<script|javascript:|onerror\s*=/i.test(text));
 }
});
test('verified expedition loading and account-only labyrinth labels follow all 14 locale preferences',()=>{
 const now=Date.UTC(2026,10,3,10),game=R.createState(now);
 const account={...game,cleared:[],campaignStars:{},mazeFloor:0,mission:null,lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[],worldBoss:null,veteranMedals:{},itemUpgrades:{}};
 const original=JSON.stringify(account),play=JSON.stringify(game);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const unverified=accountExpeditionMarkup(null,null,now);
  assert.ok(unverified.includes(officialText('Sunucu seferleri','Server expeditions')),lang+' loading');
  const html=accountExpeditionMarkup(game,account,now);
  assert.ok(html.includes(officialText('Kuzey Seferleri','Northern Expeditions')),lang+' campaign');
  assert.ok(html.includes(officialText('16 Kat Labirent','16-Floor Labyrinth')),lang+' maze');
  assert.ok(html.includes(officialText('Muhafızla savaş','Fight guardian')),lang+' guardian');
  assert.match(html,/data-account-maze/);assert.match(html,/data-account-rift/);
  assert.match(html,/data-account-stage="1"/);
  assert.equal(getLocale(),lang);
  assert.equal(JSON.stringify(account),original,'display must not mutate account');
  assert.equal(JSON.stringify(game),play,'display must not mutate game');
 }}finally{setLocale('tr');}
});
test('known and unknown translation lookups preserve canonical source and safe English fallback',()=>{
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  assert.equal(officialText('Bilinmeyen','Unknown text'),lang==='tr'?'Bilinmeyen':'Unknown text');
  assert.equal(officialText('Saldır','Attack'),lang==='tr'?'Saldır':lang==='en'?'Attack':OFFICIAL_TRANSLATIONS[lang].Attack);
 }}finally{setLocale('tr');}
});

test('live combat intent hints, three-star estimate and battle outcome messages exist in every global language',()=>{
 const checked=['Heavy strike','Use Guard to significantly reduce the heavy hit.','◈ Feint: break the shield. Normal attacks are weaker here.','Estimated rating from current health and turns','Finish quickly with enough health for three stars. The server decides the final score.',' turns. Resources credited to the server wallet.'];
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  for(const key of checked){const translated=officialText('Görünen savaş metni',key);
   assert.ok(translated.trim(),lang+':'+key);
   if(lang!=='tr'&&lang!=='en')assert.equal(translated,OFFICIAL_TRANSLATIONS[lang][key]);
  }
 }}finally{setLocale('tr');}
});

test('all 122 direct bilingual server expedition phrases have native mappings in 12 extra languages',async()=>{
 const {readFileSync}=await import('node:fs');
 const exp=readFileSync(new URL('./account-expedition.js',import.meta.url),'utf8');
 const regex=/\blocal\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 const direct=[...new Set([...exp.matchAll(regex)].map(m=>(m[3]??m[4]).replace(/\\(['"\\])/g,'$1')))];
 assert.equal(direct.length,122);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en')){
  for(const word of direct)assert.ok(OFFICIAL_TRANSLATIONS[lang][word]?.trim(),lang+': '+word);
 }
 for(const key of ['Expedition victory','Hero training','Equipment crafted','Labyrinth floor','Frontier Watcher','Star Master','Northern Warden'])assert.ok(OFFICIAL_KEYS.includes(key));
});
