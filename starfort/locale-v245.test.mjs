import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {REWARD_MESSAGE_KEYS,REWARD_TRANSLATIONS,rewardText,rewardMilestoneLabel,rewardItemLabel} from './locale-rewards-v245.js';
import {rewardCalendarMarkup,normalizeCalendar,rewardForDay,REWARD_ITEMS} from './reward-calendar.js';
import {BUILDINGS,STAGES,createState} from './rules.js';
import {BUILDING_DISPLAY_EN,STAGE_DISPLAY_EN,OPERATION_DISPLAY_EN,REALM_DISPLAY_EN,local,displayBuilding,displayStage,displayOperation,displayRealm,displayBuildingUnit} from './locale-game-content-v245.js';
import {SECOND_ACT} from './second-act.js';
import {SECOND_ACT_DISPLAY_EN,displaySecondAct,displaySecondActOperation,secondActGateMessage} from './locale-act-two-v245.js';
import {STORY_OPERATIONS} from './story-operations.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
const clock=Date.UTC(2026,10,3,10);
const calendar=normalizeCalendar({claimCount:6,streak:6,lastClaimDay:null,serverNow:clock});
test('all 14 locales have complete 39-key daily chest translations and valid interpolation',()=>{
 assert.deepEqual(Object.keys(REWARD_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.equal(REWARD_MESSAGE_KEYS.length,39);
 for(const [lang,dict] of Object.entries(REWARD_TRANSLATIONS)){
  assert.deepEqual(Object.keys(dict).sort(),[...REWARD_MESSAGE_KEYS].sort(),lang+' missing calendar keys');
  for(const [key,value] of Object.entries(dict)){
   assert.ok(value.length>0,lang+': '+key);
   assert.doesNotMatch(value,/<script|javascript:|onerror=/i,lang+': '+key);
  }
  assert.match(dict.day,/\{day\}/);
  assert.match(dict.next,/\{day\}/);
  assert.match(dict.cycle,/\{cycle\}/);
 }
});
test('all 14 language variants render 28 real reward day cards, actual server amounts and claim button',()=>{
 try{
  const reward=rewardForDay(7);
  for(const language of SUPPORTED_LOCALES){
   setLocale(language);
   const html=rewardCalendarMarkup(calendar,{online:true});
   assert.equal(getLocale(),language);
   assert.ok(html.includes(REWARD_TRANSLATIONS[language].heading),language);
   assert.ok(html.includes(REWARD_TRANSLATIONS[language].openChest),language);
   assert.ok(html.includes(rewardMilestoneLabel(7)),language);
   assert.ok(html.includes(rewardItemLabel('lunar_charm')),language);
   assert.equal((html.match(/class="reward-day /g)||[]).length,28,language);
   assert.ok(html.includes('data-reward-claim'),language);
   assert.ok(html.includes('data-reward-close'),language);
   assert.ok(html.includes('aria-valuemax="28"'),language);
   assert.equal(calendar.claimCount,6,'translations must not mutate the canonical server calendar');
   assert.equal(rewardForDay(7).gold,reward.gold,'locale must not change rewards');
   assert.equal(rewardForDay(7).aether,reward.aether);
  }
 }finally{setLocale('tr');}
});
test('claimed calendars never grant a second reward from display, and login streak logic remains UTC',()=>{
 try{
  setLocale('ar');
  const today=normalizeCalendar({claimCount:7,streak:7,lastClaimDay:'2026-11-03',serverNow:clock});
  assert.equal(today.available,false);
  const html=rewardCalendarMarkup(today,{online:true});
  assert.match(html,/data-reward-claim disabled/);
  assert.ok(html.includes(rewardText('claimedToday')));
  assert.ok(html.includes(rewardText('claimed')));
  assert.ok(html.includes('00:00 UTC'));
  assert.equal(today.nextDay,8);
  assert.equal(rewardForDay(7).item,'lunar_charm');
  assert.equal(REWARD_ITEMS.lunar_charm,'Ay Tılsımı','canonical server item must remain unchanged');
 }finally{setLocale('tr');}
});
test('seven buildings, eight story chapters, 24 operations, eight map regions have stable localized presentation IDs',()=>{
 assert.equal(Object.keys(BUILDING_DISPLAY_EN).length,7);
 assert.equal(Object.keys(STAGE_DISPLAY_EN).length,8);
 assert.equal(Object.keys(OPERATION_DISPLAY_EN).length,24);
 assert.equal(Object.keys(REALM_DISPLAY_EN).length,8);
 try{
  setLocale('en');
  for(const b of BUILDINGS){
   const display=displayBuilding(b);
   assert.equal(display.id,b.id);
   assert.equal(display.maxLevel,b.maxLevel);
   assert.equal(display.name,BUILDING_DISPLAY_EN[b.id].name);
   assert.notEqual(display.name,b.name);
  }
  for(const stage of STAGES){
   assert.equal(displayStage(stage).name,STAGE_DISPLAY_EN[stage.id].name);
   for(const op of STORY_OPERATIONS[stage.id]){
    const translated=displayOperation(op);
    assert.equal(translated.id,op.id);
    assert.equal(translated.title,OPERATION_DISPLAY_EN[op.id].title);
   }
  }
  assert.equal(displayBuildingUnit('Altın / dk'),'Gold / min');
  assert.equal(displayBuildingUnit('% takım saldırısı'),'% party attack');
  assert.equal(local('Kilitli','Locked'),'Locked');
  setLocale('tr');
  assert.equal(displayBuilding(BUILDINGS[0]),BUILDINGS[0]);
  assert.equal(displayStage(STAGES[0]),STAGES[0]);
 }finally{setLocale('tr');}
});
test('Second Act English content covers all eight regions and 24 operations without altering campaign thresholds',()=>{
 assert.equal(Object.keys(SECOND_ACT_DISPLAY_EN).length,8);
 try{
  setLocale('fr'); // untranslated narrative uses English instead of Turkish
  let operations=0;
  for(const stage of SECOND_ACT){
   const tr=stage,translated=displaySecondAct(stage);
   assert.equal(translated.id,tr.id);
   assert.equal(translated.recommendedPower,tr.recommendedPower);
   assert.notEqual(translated.name,tr.name);
   assert.equal(translated.operations.length,3);
   for(const op of tr.operations){
    const en=displaySecondActOperation(op);
    assert.equal(en.id,op.id);
    assert.notEqual(en.name,op.name);
    operations++;
   }
  }
  assert.equal(operations,24);
  assert.equal(secondActGateMessage('Önce sekiz ana hikâye bölgesini tamamla.'),"Terminez d'abord les huit régions de l'histoire principale.", 'French second-act gate now uses native French instead of English fallback');
 }finally{setLocale('tr');}
});
test('unverified account loading screen follows international fallback without bypassing auth',()=>{
 try{
  setLocale('ja');
  const html=accountExpeditionMarkup(null,null);
  assert.match(html,/Server expeditions/);
  assert.match(html,/data-village-refresh/);
  assert.doesNotMatch(html,/data-account-stage/);
  setLocale('tr');assert.match(accountExpeditionMarkup(null,null),/Sunucu seferleri/);
 }finally{setLocale('tr');}
});
test('building workshop for a real state preserves server action IDs with English UI',()=>{
 const state=createState(clock);
 try{
  setLocale('en');
  const html=buildingWorkshopMarkup(state,'keep',{icon:()=>'<i></i>',now:clock});
  assert.match(html,/Village Upgrade Center/);
  assert.match(html,/Star Keep/);
  assert.match(html,/SERVER ECONOMY|LOCAL TRIAL/);
  assert.match(html,/data-close-building/);
  assert.match(html,/data-plan-building="keep"/);
  assert.doesNotMatch(html,/Köy Geliştirme Merkezi/);
  setLocale('tr');
  assert.match(buildingWorkshopMarkup(state,'keep',{icon:()=>'<i></i>',now:clock}),/Köy Geliştirme Merkezi/);
 }finally{setLocale('tr');}
});
test('source audit: presentation dictionaries may not modify server SQL or RPC authority',()=>{
 for(const path of ['./reward-calendar.js','./account-expedition.js','./building-workshop.js']){
  const contents=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(contents,/localStorage\.setItem\(/);
 }
 const rewards=readFileSync(new URL('./reward-calendar.js',import.meta.url),'utf8');
 assert.match(rewards,/rpc\/sfb_daily_calendar/);
 assert.match(rewards,/p_action:action/);
 assert.match(rewards,/calendarFromServer\(data\)/);
});
