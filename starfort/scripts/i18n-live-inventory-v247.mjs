/* v2.47 one-pass audit of real client renderers. Reports exact bilingual literals still falling back to English. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SUPPORTED_LOCALES,setLocale} from '../locale-v243.js';
import {bilingual} from '../locale-unified-v247.js';
const dir=fileURLToPath(new URL('../',import.meta.url));
const files=['app.js','account-expedition.js','realm-map.js','arena-view.js','team-view.js','shadow-frontier-v238.js','shadow-mastery-v241.js','shadow-rewards-v239.js','labyrinth-view.js','building-workshop.js','warfront-v237.js','kingdom-caravan.js','premium-store.js','premium-catalog.js','guild-client.js','tactics-view.js','official-progress-coach.js'];
const re=/\b(?:local|lt|l)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
const clean=s=>s.replace(/\\(['"\\])/g,'$1');
const results=[];
try{for(const name of files){
 const source=readFileSync(path.join(dir,name),'utf8');
 const entries=[...source.matchAll(re)].map(match=>({english:clean(match[3]??match[4]),line:source.slice(0,match.index).split('\n').length}));
 const unique=[...new Map(entries.map(x=>[x.english,x])).values()];
 const missing={};
 for(const locale of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  setLocale(locale);
  missing[locale]=unique.filter(x=>bilingual('',x.english)===x.english);
 }
 const untranslated=unique.filter(x=>Object.values(missing).some(arr=>arr.some(y=>y.english===x.english)));
 results.push({file:name,literalPairs:entries.length,uniqueEnglishStrings:unique.length,missingInSomeLanguages:untranslated.length,
  sample:untranslated.slice(0,20),perLanguage:Object.fromEntries(Object.entries(missing).map(([k,v])=>[k,v.length]))});
}}finally{setLocale('tr');}
const report={auditedAt:'v2.47 candidate',supportedLanguages:SUPPORTED_LOCALES,
 scannedModules:files.length,bilingualLiterals:results.reduce((n,x)=>n+x.literalPairs,0),
 uniquePerModule:results.reduce((n,x)=>n+x.uniqueEnglishStrings,0),
 untranslatedPerModule:results.reduce((n,x)=>n+x.missingInSomeLanguages,0),
 entries:results,notes:'This is an exact-literal bilingual scan. Template strings, RPC-provided text, sound scripts and unpaired Turkish markup need independent review.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--release-check')&&report.untranslatedPerModule>0)process.exitCode=1;
