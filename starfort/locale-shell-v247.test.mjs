import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,getLocaleDirection,setLocale,t,applyLocaleUI} from './locale-v243.js';
import {SHELL_KEYS,SHELL_TRANSLATIONS,auditShellTranslations} from './locale-shell-v247.js';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
test('23 static shell labels have values in all 14 locales',()=>{
 assert.equal(SHELL_KEYS.length,23);
 assert.deepEqual(Object.keys(SHELL_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditShellTranslations(SUPPORTED_LOCALES),[]);
 for(const language of SUPPORTED_LOCALES){
  assert.equal(Object.keys(SHELL_TRANSLATIONS[language]).length,SHELL_KEYS.length);
  for(const key of SHELL_KEYS){const label=SHELL_TRANSLATIONS[language]['shell.'+key];assert.ok(label?.trim(),language+':'+key);assert.doesNotMatch(label,/<script|javascript:|onerror\s*=/i);}
 }
});
test('static shell markers resolve without changing action attributes',()=>{
 const markers=[...html.matchAll(/data-i18n-(?:aria-label|title)=\"([^\"]+)\"/g)].map(x=>x[1]);
 for(const key of SHELL_KEYS)assert.ok(markers.includes('shell.'+key),'unused shell label: '+key);
 assert.ok(markers.length>=28);
 assert.match(html,/data-view=\"heroes\"/);assert.match(html,/data-city-zoom=\"1.2\"/);assert.match(html,/data-daily-reward/);
 assert.doesNotMatch(html,/data-guest-login/);
});
test('language changes update document title attributes, ARIA and RTL',()=>{
 const aria={getAttribute:()=> 'shell.canvas',setAttribute(k,v){this[k]=v;}};
 const title={getAttribute:()=> 'shell.dailyCalendar',setAttribute(k,v){this[k]=v;}};
 const doc={documentElement:{},title:'',querySelectorAll(selector){return {'[data-i18n]':[],'[data-i18n-placeholder]':[],'[data-i18n-aria-label]':[aria],'[data-i18n-title]':[title]}[selector]||[];}};
 try{for(const language of SUPPORTED_LOCALES){setLocale(language);applyLocaleUI(doc);assert.equal(doc.documentElement.lang,language);assert.equal(doc.documentElement.dir,getLocaleDirection(language));assert.equal(aria['aria-label'],t('shell.canvas'));assert.equal(title.title,t('shell.dailyCalendar'));}assert.equal(getLocaleDirection('ar'),'rtl');}
 finally{setLocale('tr');}
});
