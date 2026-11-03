import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {TEAM_KEYS,TEAM_TRANSLATIONS,teamText} from './locale-team-v247.js';
import {SHARED_KEYS,SHARED_TRANSLATIONS} from './locale-sections-v247.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
test('team battles expose 33 translated labels in all 14 supported languages',()=>{
 assert.equal(TEAM_KEYS.length,33);
 assert.deepEqual(Object.keys(TEAM_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 for(const locale of SUPPORTED_LOCALES){
  const pack=TEAM_TRANSLATIONS[locale];
  assert.deepEqual(Object.keys(pack).sort(),[...TEAM_KEYS].sort(),locale);
  for(const key of TEAM_KEYS){
   assert.equal(typeof pack[key],'string',locale+':'+key);
   assert.ok(pack[key].trim(),locale+':'+key);
   assert.doesNotMatch(pack[key],/<script|javascript:|onerror\s*=/i);
  }
  for(const key of Object.keys(pack))assert.ok(TEAM_KEYS.includes(key));
 }
});
test('team and shared controls switch correctly without mutating session or command identifiers',()=>{
 const teamSource=read('team-view.js');
 const sourceNames=['data-team-bot="2"','data-team-bot="5"','data-team-mode="2"','data-team-mode="5"',
  'data-team-party="2"','data-team-party="5"','data-team-variant="siege"','data-squad-select="all"',
  'data-squad-select="guard"','data-squad-select="archer"','data-team-order="follow"',
  'data-team-order="push"','data-team-order="hold"','data-team-order="focus"'];
 for(const attr of sourceNames)assert.ok(teamSource.includes(attr),attr);
 assert.match(teamSource,/import \{teamText as tt\}/);
 assert.match(teamSource,/tt\('teamStatus'\)/);
 assert.match(teamSource,/tt\('flags'\)/);
 assert.match(teamSource,/tt\('warRole'\)|tt\('arenaHero'\)/);
 assert.doesNotMatch(teamSource,/data-guest-login|guestSignin/);
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   assert.equal(getLocale(),locale);
   assert.equal(teamText('siege'),TEAM_TRANSLATIONS[locale].siege);
   assert.equal(teamText('title'),TEAM_TRANSLATIONS[locale].title);
   assert.equal(teamText('ready'),TEAM_TRANSLATIONS.en.ready??'ready');
  }
 }finally{setLocale('tr');}
});
