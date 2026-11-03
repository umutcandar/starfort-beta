/**
 * STARFORT internationalization QA: validates translated dictionaries and
 * reports visibly hardcoded Turkish DOM fragments, without modifying saves.
 *
 * Run: node scripts/i18n-coverage.mjs --check
 * A zero "visible inline Turkish" count is NOT full translation coverage.
 * Dynamic runtime strings, RPC errors and narrative data still need review.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SUPPORTED_LOCALES} from '../locale-v243.js';
import {ARMORY_TRANSLATIONS,ARMORY_KEYS} from '../locale-armory-v246.js';
import {REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS} from '../locale-rewards-v245.js';
import {ITEM_DISPLAY_EN} from '../locale-items-v246.js';
import {ITEMS} from '../equipment.js';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const watch=[
 {file:'armory-v212.js',strict:true},
 {file:'reward-calendar.js',strict:true},
 {file:'arena-view.js'},
 {file:'app.js'},
 {file:'warfront-v237.js'},
 {file:'premium-store.js'},
 {file:'commander-chronicle.js'},
 {file:'official-progress-coach.js'}
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
const problems=[...checkPack(ARMORY_TRANSLATIONS,ARMORY_KEYS,'armory'),...checkPack(REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS,'rewards')];
for(const item of ITEMS)if(!ITEM_DISPLAY_EN[item.id]?.name?.trim()||!ITEM_DISPLAY_EN[item.id]?.description?.trim())problems.push('Missing English item: '+item.id);
for(const key of Object.keys(ITEM_DISPLAY_EN))if(!ITEMS.some(item=>item.id===key))problems.push('Orphaned English item: '+key);
for(const f of auditFiles)if(f.strict&&f.candidateVisibleTurkishFragments>0)problems.push(f.file+': visible untranslated Turkish fragments');
const summary={
 auditedAt:'STARFORT v2.46',
 supportedLanguages:localeSet,
 verifiedPacks:{
  armory:{keysPerLanguage:ARMORY_KEYS.length,languages:localeSet.length},
  dailyRewards:{keysPerLanguage:REWARD_MESSAGE_KEYS.length,languages:localeSet.length},
  gearEnglishFallback:{translated:ITEMS.filter(x=>Boolean(ITEM_DISPLAY_EN[x.id])).length,canonical:ITEMS.length}
 },
 staticUiCandidates:auditFiles,
 caveat:'Regex only detects raw inline Turkish DOM strings. Coverage is partial; dynamic UI, guild, arena, shop and server errors need further localization.',
 errors:problems
};
console.log(JSON.stringify(summary,null,2));
if(process.argv.includes('--check')&&problems.length)process.exitCode=1;
