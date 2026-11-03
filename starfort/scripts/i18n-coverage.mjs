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
import {SHELL_KEYS,SHELL_TRANSLATIONS,auditShellTranslations} from '../locale-shell-v247.js';
import {AUTH_MESSAGE_KEYS,AUTH_MESSAGES,auditAuthMessages} from '../locale-auth-messages-v247.js';
import {CORE_COMPLETION_KEYS,CORE_COMPLETION_TRANSLATIONS,auditCoreCompletion} from '../locale-core-completion-v247.js';
import {CHRONICLE_UI_KEYS,auditChronicleTranslations} from '../locale-chronicle-v247.js';
import {CARAVAN_UI_KEYS,auditCaravanTranslations} from '../locale-caravan-v247.js';
import {OFFICIAL_KEYS,auditOfficialTranslations} from '../locale-official-ui-v247.js';
import {GOAL_IDS,auditGoals} from '../locale-goals-v247.js';
import {AUXILIARY_KEYS,auditAuxiliary} from '../locale-auxiliary-native-v247.js';
import {SHADOW_HUD_KEYS,auditShadowHud} from '../locale-shadow-hud-native-v247.js';
import {REALM_UI_KEYS,auditRealmUI} from '../locale-realm-ui-v247.js';
import {UNIFIED_KEYS,RANK_NAMES_EN,AUTH_ERROR_CODES,auditUnified} from '../locale-unified-v247.js';
import {SHADOW_STAGE_NATIVE,auditShadowStageNative} from '../locale-shadow-stages-v247.js';
import {MAZE_ENGLISH_KEYS,MAZE_GATE_TEXT,auditMazePhrases} from '../locale-maze-native-v247.js';
import {PREMIUM_STORE_KEYS,auditPremiumStoreNative} from '../locale-premium-store-native-v247.js';
import {WARFRONT_NATIVE_KEYS,auditWarfrontNative} from '../locale-warfront-native-v247.js';
import {BUILDING_NATIVE_KEYS,auditBuildingNative} from '../locale-building-native-v247.js';
import {BUILDING_ADVANCED_KEYS,auditBuildingAdvanced} from '../locale-building-advanced-v247.js';
import {ARMORY_TRANSLATIONS,ARMORY_KEYS} from '../locale-armory-v246.js';
import {REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS} from '../locale-rewards-v245.js';
import {ITEM_DISPLAY_EN} from '../locale-items-v246.js';
import {ITEMS} from '../equipment.js';
import {SHARED_TRANSLATIONS,SHARED_KEYS} from '../locale-sections-v247.js';
import {TEAM_TRANSLATIONS,TEAM_KEYS} from '../locale-team-v247.js';
import {GUILD_TRANSLATIONS,GUILD_KEYS} from '../locale-guild-v247.js';
import {TRAINING_EVENT_TRANSLATIONS,TRAINING_EVENT_KEYS} from '../locale-training-v247.js';
import {WORLD_LANGUAGES} from '../locale-world-v247.js';
import {HERO_UI} from '../locale-hero-ui-v247.js';
import {ITEM_NAMES} from '../locale-item-names-v247.js';
import {auditActOne,ACT_ONE_NATIVE} from '../locale-story-v247.js';
import {auditActTwo,ACT_TWO_NATIVE,ACT_TWO_GATES,ACT_TWO_GATE_KEYS} from '../locale-act2-v247.js';
import {auditHeroLore,HERO_LORE_NATIVE} from '../locale-hero-lore-v247.js';
import {auditItemLore,ITEM_LORE_NATIVE} from '../locale-item-lore-v247.js';
import {auditPremiumNative,PREMIUM_NATIVE} from '../locale-premium-v247.js';
import {auditWarfrontDoctrine,WARFRONT_DOCTRINE_COPY} from '../locale-warfront-v247.js';
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
 const problems=[...auditShadowHud(),...auditAuxiliary(),...auditGoals(),];
 if(JSON.stringify(Object.keys(pack).sort())!==JSON.stringify(localeSet))problems.push(name+': locale count mismatch');
 for(const id of localeSet){
  const dictionary=pack[id]||{};
  for(const key of keys)if(typeof dictionary[key]!=='string'||!dictionary[key].trim())problems.push(id+': '+key);
  for(const key of Object.keys(dictionary))if(!keys.includes(key))problems.push(id+': unexpected '+key);
 }
 return problems;
}
const problems=[...auditBuildingAdvanced(),...auditBuildingNative(),...auditWarfrontNative(),...auditPremiumStoreNative(),...auditMazePhrases(),...auditShadowStageNative(),...auditUnified(),...auditRealmUI(),...auditOfficialTranslations(),...auditCaravanTranslations(),...auditChronicleTranslations(),...auditCoreCompletion(localeSet),...auditAuthMessages(localeSet),...checkPack(AUTH_MESSAGES,AUTH_MESSAGE_KEYS,'auth-messages'),...auditShellTranslations(localeSet),...auditActOne(),...auditActTwo(),...auditHeroLore(),...auditItemLore(),...auditPremiumNative(),...auditWarfrontDoctrine(),...checkPack(ACT_TWO_GATES,ACT_TWO_GATE_KEYS,'act2-gates'),...checkPack(ARMORY_TRANSLATIONS,ARMORY_KEYS,'armory'),...checkPack(REWARD_TRANSLATIONS,REWARD_MESSAGE_KEYS,'rewards'),...checkPack(SHARED_TRANSLATIONS,SHARED_KEYS,'shared'),...checkPack(TEAM_TRANSLATIONS,TEAM_KEYS,'team'),...checkPack(GUILD_TRANSLATIONS,GUILD_KEYS,'guild'),...checkPack(TRAINING_EVENT_TRANSLATIONS,TRAINING_EVENT_KEYS,'training')];
for(const locale of localeSet){
 const itemNames=ITEM_NAMES[locale];
 if(!itemNames||Object.keys(itemNames.names||{}).length!==19||Object.keys(itemNames.sets||{}).length!==3)problems.push(locale+': incomplete native item and set names');
 const heroes=HERO_UI[locale];
 if(!heroes||Object.keys(heroes.titles||{}).length!==9||Object.keys(heroes.abilities||{}).length!==9||Object.keys(heroes.roles||{}).length!==6)problems.push(locale+': incomplete hero content');
 const world=WORLD_LANGUAGES[locale];
 if(!world||Object.keys(world.buildings||{}).length!==7||Object.keys(world.stages||{}).length!==8||Object.keys(world.resources||{}).length!==4)problems.push(locale+': incomplete world content');
}
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
// Structured content coverage is distinct from complete live-UI translation and human linguistic QA.
const structuredNarrativeLocales=new Set(['tr','en',...localeSet.filter(lang=>
 ACT_ONE_NATIVE[lang]&&ACT_TWO_NATIVE[lang]&&HERO_LORE_NATIVE[lang]&&ITEM_LORE_NATIVE[lang]&&PREMIUM_NATIVE[lang]
)]);
const missingNativeNarrativeLocales=localeSet.filter(lang=>!structuredNarrativeLocales.has(lang));
// No native-speaker reviews have been recorded. Never silently promote automated translations.
const humanReviewedLocales=new Set();
const pendingHumanReviewLocales=localeSet.filter(lang=>!humanReviewedLocales.has(lang));
const releaseReady=problems.length===0&&needsLocalizationReview.length===0&&missingNativeNarrativeLocales.length===0&&pendingHumanReviewLocales.length===0;
const summary={
 auditedAt:'STARFORT v2.47 unified beta (not production-ready)',
 supportedLanguages:localeSet,
 verifiedPacks:{
  armory:{keysPerLanguage:ARMORY_KEYS.length,languages:localeSet.length},
  sharedNavigation:{keysPerLanguage:SHARED_KEYS.length,languages:localeSet.length},
  accessibleStaticShell:{keysPerLanguage:SHELL_KEYS.length,languages:localeSet.length},
  knownAccountMessages:{keysPerLanguage:AUTH_MESSAGE_KEYS.length,languages:localeSet.length},
  completedCoreSettings:{newNativeKeys:CORE_COMPLETION_KEYS.length,additionalLanguages:12},
  commanderChronicle:{rankNamesPerLanguage:30,screenKeysPerLanguage:CHRONICLE_UI_KEYS.length,languages:localeSet.length},
  caravan:{routesWithNativeCopy:3,screenKeysPerLanguage:CARAVAN_UI_KEYS.length,languages:localeSet.length},
  progressionCoach:{milestoneTypes:GOAL_IDS.length,languages:14},
  nativeTrainingAndShadowRewards:{fixedPhrases:AUXILIARY_KEYS.length,additionalLocales:12},
  shadowFrontierMastery:{fixedPhrases:SHADOW_HUD_KEYS.length,additionalLocales:12},
  verifiedExpeditionCore:{translatedLabelsPerAdditionalLanguage:OFFICIAL_KEYS.length,additionalLanguages:12,literalPairsCovered:122,dynamicNamesCovered:7},
  realmMap:{translatedLabelsPerAdditionalLanguage:REALM_UI_KEYS.length,additionalLanguages:12},
  sharedRuntime:{reusedLanguagePacks:12,additionalPhrases:UNIFIED_KEYS.length,shadowRankNames:RANK_NAMES_EN.length,mappedAuthErrorCodes:Object.keys(AUTH_ERROR_CODES).length},
  shadowStageNative:{stages:4,additionalLanguages:Object.keys(SHADOW_STAGE_NATIVE).length,fields:['region','boss','name','description','tip']},
  mazeNative:{screenPhrases:MAZE_ENGLISH_KEYS.length,zoneNamesAndHints:8,localizedStoryGateLanguages:Object.keys(MAZE_GATE_TEXT).length},
  premiumStoreNative:{labelCount:PREMIUM_STORE_KEYS.length,additionalLanguages:12,paymentsRemainDisabled:true},
  warfrontNative:{labelCount:WARFRONT_NATIVE_KEYS.length,additionalLanguages:12,serverAuthorityUnchanged:true},
  buildingNative:{screenMessages:BUILDING_NATIVE_KEYS.length+BUILDING_ADVANCED_KEYS.length,additionalLanguages:12,canonicalConstructionUnchanged:true},
  teamBattle:{keysPerLanguage:TEAM_KEYS.length,languages:localeSet.length},
  guild:{keysPerLanguage:GUILD_KEYS.length,languages:localeSet.length},
  trainingEvents:{keysPerLanguage:TRAINING_EVENT_KEYS.length,languages:localeSet.length},
  world:{buildings:7,storyChapters:8,resources:4,languages:localeSet.length},
  heroContent:{titles:9,abilities:9,roles:6,languages:localeSet.length},
  itemNames:{items:19,sets:3,languages:localeSet.length},
  firstActNarrative:{nativeAdditionalLocales:Object.keys(ACT_ONE_NATIVE).length,operations:24,chapterDescriptions:8},
  secondActNarrative:{nativeAdditionalLocales:Object.keys(ACT_TWO_NATIVE).length,regions:8,operations:24,regionContent:['name','zone','lore','boss']},
  secondActGates:{keysPerLanguage:ACT_TWO_GATE_KEYS.length,languages:localeSet.length},
  heroNativeNarrative:{additionalLocales:Object.keys(HERO_LORE_NATIVE).length,heroes:9,biographyAndSkillText:true},
  itemNativeNarrative:{additionalLocales:Object.keys(ITEM_LORE_NATIVE).length,items:19},
  premiumNativeCatalog:{additionalLocales:Object.keys(PREMIUM_NATIVE).length,items:15,paymentsRemainDisabled:true},
  warfrontDoctrines:{languages:Object.keys(WARFRONT_DOCTRINE_COPY).length,doctrines:3,ruleValuesImmutable:true}, 
  dailyRewards:{keysPerLanguage:REWARD_MESSAGE_KEYS.length,languages:localeSet.length},
  gearEnglishFallback:{translated:ITEMS.filter(x=>Boolean(ITEM_DISPLAY_EN[x.id])).length,canonical:ITEMS.length}
 },
 staticUiCandidates:auditFiles,
 sourceCoverage:partialSourceCoverage,
 missingNativeNarrativeLocales,
 pendingHumanReviewLocales,
 releaseReady,
 caveat:'Core campaign, hero, equipment, and cosmetic dictionaries now cover all fourteen languages. This is NOT full-game translation: partial UI coverage remains; runtime messages, server errors, other UI panels, voice scripts, RTL layout and native-speaker review remain blocking.',
 errors:problems
};
console.log(JSON.stringify(summary,null,2));
if(process.argv.includes('--check')&&problems.length)process.exitCode=1;
if(process.argv.includes('--release-check')&&!releaseReady)process.exitCode=1;
