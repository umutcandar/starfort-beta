import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {GOAL_IDS,GOAL_COPY,goalNative,goalChrome,auditGoals} from './locale-goals-v247.js';
import {officialNextGoal,officialNextGoalMarkup,officialStoryReadiness} from './official-progress-coach.js';
import {createState} from './rules.js';
const NOW=Date.UTC(2026,10,3,10);
const profile=()=>({cleared:[],campaignStars:{},mazeFloor:0,mission:null,inventory:{iron_sword:1},loadouts:{},act2Cleared:[],counters:{win:0},veteranMedals:{}});
test('all eighteen verified progression goals use complete native copy and consistent parameters',()=>{
 assert.equal(GOAL_IDS.length,18);assert.deepEqual(auditGoals(),[]);
 const en=GOAL_COPY.en;
 for(const language of SUPPORTED_LOCALES.filter(l=>l!=='tr')){
  for(const id of GOAL_IDS){const row=GOAL_COPY[language][id];assert.ok(row,language+':'+id);
   for(const type of ['title','detail','label']){
    const expected=[...en[id][type].matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
    const actual=[...row[type].matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
    assert.deepEqual(actual,expected,language+':'+id+'.'+type);
    assert.doesNotMatch(row[type],/<script|javascript:|onerror\\s*=/i);
   }
  }
 }
});
test('verified progression goals show all 14 languages while respecting canonical actions and state',()=>{
 const base=createState(NOW),account=profile();const game=JSON.stringify(base),saved=JSON.stringify(account);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const goal=officialNextGoal(base,account,NOW);
  assert.equal(goal.id,'equip');assert.equal(goal.action,'armory');
  assert.equal(goal.title,lang==='tr'?'İlk kahramanını donat':goalNative('equip').title);
  const html=officialNextGoalMarkup(goal);
  assert.ok(html.includes(goalChrome('aria')));
  assert.ok(html.includes('data-view="armory"'));
  assert.equal(JSON.stringify(base),game);assert.equal(JSON.stringify(account),saved);
  const fight=officialNextGoal(base,{...account,mission:{mode:'story',stage:1}},NOW);
  assert.equal(fight.id,'mission');assert.equal(fight.action,'campaign');
  assert.ok(fight.detail.trim());
 }}finally{setLocale('tr');}
});
test('dynamic sealed story gates keep real required amounts while names are translated',()=>{
 const s=createState(NOW),p=profile();p.inventory={};p.cleared=[1,2];s.buildings.forge=1;
 const base=JSON.stringify(s),canonical=JSON.stringify(p);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const goal=officialNextGoal(s,p,NOW);
  assert.equal(goal.id,'gate-forge');assert.equal(goal.action,'keep');
  assert.match(goal.detail,/1\/2/);
  assert.equal(JSON.stringify(s),base);assert.equal(JSON.stringify(p),canonical);
 }}finally{setLocale('tr');}
});
