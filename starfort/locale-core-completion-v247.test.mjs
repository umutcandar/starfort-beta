import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,t} from './locale-v243.js';
import {EXTRA_TRANSLATION_KEYS} from './locale-global-v244.js';
import {CORE_COMPLETION_KEYS,CORE_COMPLETION_TRANSLATIONS,auditCoreCompletion} from './locale-core-completion-v247.js';
import {AUTH_MESSAGE_KEYS} from './locale-auth-messages-v247.js';
test('every v2.43 core interface key is covered across all 14 locales',()=>{
 const src=readFileSync(new URL('./locale-v243.js',import.meta.url),'utf8');
 const core=[...src.matchAll(/^\s*'([^']+)':\[/gm)].map(x=>x[1]);
 assert.equal(core.length,71);
 assert.equal(CORE_COMPLETION_KEYS.length,20);
 assert.deepEqual(core.filter(key=>![...EXTRA_TRANSLATION_KEYS,...AUTH_MESSAGE_KEYS,...CORE_COMPLETION_KEYS].includes(key)),[]);
 assert.deepEqual(Object.keys(CORE_COMPLETION_TRANSLATIONS).sort(),SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en').sort());
 assert.deepEqual(auditCoreCompletion(SUPPORTED_LOCALES),[]);
 for(const language of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  assert.deepEqual(Object.keys(CORE_COMPLETION_TRANSLATIONS[language]).sort(),[...CORE_COMPLETION_KEYS].sort());
 }
});
test('12 global locales use native map, settings and audio warning text, not English fallback',()=>{
 try{for(const language of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  setLocale(language);
  for(const key of CORE_COMPLETION_KEYS){const value=CORE_COMPLETION_TRANSLATIONS[language][key];assert.equal(t(key),value);assert.ok(value.trim());assert.doesNotMatch(value,/<script|javascript:|onerror\s*=/i);}
  assert.notEqual(t('settings.controls'),'Controls');
 }}finally{setLocale('tr');}
});
