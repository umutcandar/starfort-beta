import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {SHADOW_STAGE_NATIVE,localizedShadowStage,auditShadowStageNative} from './locale-shadow-stages-v247.js';
import {SHADOW_STAGES,shadowFrontierMarkup} from './shadow-frontier-v238.js';
const base={heroPaths:{},cleared:[],stars:{},battle:null,lastReport:null,revision:1,masteryXp:0,masteryRank:0,masteryClaimed:0,weeklyRenown:0,weeklyWins:0,weeklyLimit:100,week:'2026-45'};
const acc={heroes:{aldren:10,lyra:10,rovan:10},team:['aldren','lyra','rovan'],cleared:[1,2,3,4,5,6,7,8],act2Cleared:[1,2,3,4,5,6,7,8],mission:null};
test('four boss region lore records are present in twelve native languages',()=>{
 assert.equal(Object.keys(SHADOW_STAGE_NATIVE).length,12);assert.deepEqual(auditShadowStageNative(),[]);
 for(const [lang,stages] of Object.entries(SHADOW_STAGE_NATIVE)){assert.equal(stages.length,4);
  for(const stage of stages){for(const key of ['region','name','boss','description','tip'])assert.ok(stage[key].trim(),lang+':'+key);}
 }
});
test('live Shadow Frontier cards show correct non-English bosses but keep canonical combat IDs',()=>{
 const state=JSON.stringify(base),account=JSON.stringify(acc),canonical=JSON.stringify(SHADOW_STAGES);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=shadowFrontierMarkup(base,acc);
  for(let i=0;i<4;i++){const stage=localizedShadowStage(i,{region:'Fallback region',boss:'Fallback boss',name:'Fallback boss'});
   if(lang==='tr')assert.ok(html.includes(SHADOW_STAGES[i].boss));
   else if(lang==='en')assert.ok(html.includes('Thorn Sentinel')||html.includes('Eclipse Sovereign'));
   else {assert.ok(html.includes(stage.boss),lang+':'+i);assert.ok(html.includes(stage.region),lang+':'+i);}
  }
  assert.equal(JSON.stringify(base),state);assert.equal(JSON.stringify(acc),account);
 }}finally{setLocale('tr');}
 assert.equal(JSON.stringify(SHADOW_STAGES),canonical);
});
