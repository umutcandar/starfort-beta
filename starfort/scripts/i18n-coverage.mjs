/**
 * STARFORT internationalization QA: validates translated dictionaries and
 * reports visibly hardcoded Turkish DOM fragments, without modifying saves.
 *
 * Run: node scripts/i18n-coverage.mjs --check
 * A zero "visible inline Turkish" count is NOT full translation coverage.
 * Dynamic runtime strings, RPC errors and narrative data still need review.
 */
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SUPPORTED_LOCALES} from '../locale-v243.js';
import {ARMORY_TRANSLATIONS,ARMORY_KEYS} from '../locale-armory-v246.js';
import {REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS} from '../locale-rewards-v245.js';
import {ITEM_DISPLAY_EN} from '../locale-items-v246.js';
import {ITEMS} from '../equipment.js';
import {SHARED_TRANSLATIONS,SHARED_KEYS} from '../locale-sections-v247.js';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const watch=[
 {file:'armory-v212.js',strict:true},
 {file:'reward-calendar.js',strict:true},
 {file:'arena-view.js'},
 {file:'app.js'},
 {file:'warfront-v237.js'},
 {file:'premium-store.js'},
 {file:'commander-chronicle.js'},
 {file:'official-progress-coach.js'},
 {file:'labyrinth-view.js'},
 {file:'kingdom-caravan.js'},
 {file:'premium-catalog.js'},
 {file:'team-view.js'},
 {file:'tactics-view.js'},
 {file:'guild-client.js'}
];
const pattern=/>[^<>{}\n]*[ğüşöçıİĞÜŞÖÇ][^<>{}\n]*</gu;
const auditFiles=watch.map(({file,strict=false})=>{
 const code=readFileSync(resolve(root,file),'utf8');
 const candidates=[...code.matchAll(pattern)].map(m=>({
  line:code.slice(0,m.index).split('\n').length,
  fragment:m[0].slice(0,120)
 }));
 return {file,strict,candidateVisibleTurkishFragments:candidates.length,
  examples:candidates.slice(0,4)};
});
const localeSet=[...SUPPORTED_LOCALES].sort();
function checkPack(pack,keys,name){
 const problems=[];
 if(JSON.stringify(Object.keys(pack).sort())!==JSON.stringify(localeSet))problems.push(name+': locale count mismatch');
 for(const id of localeSet){
  const dictionary=pack[id]||{};
  for(const key of keys)if(typeof dictionary[key]!=='string'||!dictionary[key].trim())problems.push(id+': '+key);
  for(const key of Object.keys(dictionary))if(!keys.includes(key))problems.push(id+': unexpected '+key);
 }
 return problems;
}
const problems=[...checkPack(ARMORY_TRANSLATIONS,ARMORY_KEYS,'armory'),...checkPack(REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS,'rewards'),...checkPack(SHARED_TRANSLATIONS,SHARED_KEYS,'shared')];
for(const item of ITEMS)if(!ITEM_DISPLAY_EN[item.id]?.name?.trim()||!ITEM_DISPLAY_EN[item.id]?.description?.trim())problems.push('Missing English item: '+item.id);
for(const key of Object.keys(ITEM_DISPLAY_EN))if(!ITEMS.some(item=>item.id===key))problems.push('Orphaned English item: '+key);
for(const f of auditFiles)if(f.strict&&f.candidateVisibleTurkishFragments>0)problems.push(f.file+': visible untranslated Turkish fragments');
// This is a conservative inventory of modules containing user-facing HTML.
// It does not confuse an English fallback with a fully translated native-language string.
const modules=readdirSync(root).filter(file=>file.endsWith('.js'));
const userFacingModules=modules.filter(file=>{
 const content=readFileSync(resolve(root,file),'utf8');
 return /(?:innerHTML|return\s*`<(?:section|header|div|article|button)|aria-label=|role=\"status\")/.test(content);
}).map(file=>{
 const code=readFileSync(resolve(root,file),'utf8');
 const localized=/locale-|\bt\('.*?'\)/.test(code);
 const rawTurkish=[...code.matchAll(pattern)].length;
 return {file,localized,rawTurkishCandidates:rawTurkish};
});
const needsLocalizationReview=userFacingModules.filter(m=>!m.localized||m.rawTurkishCandidates>0);
const partialSourceCoverage={totalUserFacingModules:userFacingModules.length,needsLocalizationReview:needsLocalizationReview.length,
 examples:needsLocalizationReview.slice(0,30),fullyTranslatedInto14Languages:false};
const reviewedNarrativeLocales=new Set(['tr','en']); // Existing canonical Turkish + verified English fallback only.
const missingNativeNarrativeLocales=localeSet.filter(lang=>!reviewedNarrativeLocales.has(lang));
const releaseReady=problems.length===0&&needsLocalizationReview.length===0&&missingNativeNarrativeLocales.length===0;
const summary={
 auditedAt:'STARFORT v2.47 unified beta (not production-ready)',
 supportedLanguages:localeSet,
 verifiedPacks:{
  armory:{keysPerLanguage:ARMORY_KEYS.length,languages:localeSet.length},
  sharedNavigation:{keysPerLanguage:SHARED_KEYS.length,languages:localeSet.length}, 
  dailyRewards:{keysPerLanguage:REWARD_MESSAGE_KEYS.length,languages:localeSet.length},
  gearEnglishFallback:{translated:ITEMS.filter(x=>Boolean(ITEM_DISPLAY_EN[x.id])).length,canonical:ITEMS.length}
 },
 staticUiCandidates:auditFiles,
 sourceCoverage:partialSourceCoverage,
 missingNativeNarrativeLocales,
 releaseReady,
 caveat:'Source scanning is advisory and partial. 14-language shared controls DO NOT mean full 14-language narrative. Runtime messages, server errors, guild and native-speaker review remain blocking.',
 errors:problems
};
console.log(JSON.stringify(summary,null,2));
if(process.argv.includes('--check')&&problems.length)process.exitCode=1;
if(process.argv.includes('--release-check')&&!releaseReady)process.exitCode=1;
