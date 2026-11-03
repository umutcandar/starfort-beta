import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale,formatNumber} from './locale-v243.js';
import {WARFRONT_DOCTRINE_COPY,nativeWarfrontDoctrine,auditWarfrontDoctrine} from './locale-warfront-v247.js';
import {WARFRONT_DOCTRINES,WARFRONT_DAILY_REWARD,displayWarfrontDoctrine,warfrontMarkup} from './warfront-v237.js';
import {displayResource} from './locale-game-content-v245.js';
import {createState} from './rules.js';
const htmlEscape=x=>String(x).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const snapshot={pending:null,revision:1,wins:0,dailyWins:0,weeklyWins:0,day:'2026-11-03',week:'2026-45',dailyClaimed:false,weeklyClaimed:false,chestsClaimed:0,nextChestWins:3,lastLoot:null};
test('all fourteen languages fully localize names, percentage rules and intended use for all three battle doctrines',()=>{
 assert.deepEqual(Object.keys(WARFRONT_DOCTRINE_COPY).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditWarfrontDoctrine(),[]);
 for(const code of SUPPORTED_LOCALES){
  assert.equal(Object.keys(WARFRONT_DOCTRINE_COPY[code]).length,3);
  for(const id of ['assault','bulwark','recon']){
   const copy=WARFRONT_DOCTRINE_COPY[code][id];
   assert.ok(copy.name.trim()&&copy.summary.trim()&&copy.focus.trim(),code+': '+id);
   assert.doesNotMatch(copy.name+copy.summary+copy.focus,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('warfront live panel uses native locale labels and currencies while 14-language switches never affect doctrine costs',()=>{
 const game=createState(Date.UTC(2026,10,3,12)),baseline=JSON.stringify(game),doc=JSON.stringify(WARFRONT_DOCTRINES),daily=JSON.stringify(WARFRONT_DAILY_REWARD);
 try{
  for(const code of SUPPORTED_LOCALES){
   setLocale(code);
   for(const doctrine of WARFRONT_DOCTRINES){
    const view=displayWarfrontDoctrine(doctrine);
    const translated=nativeWarfrontDoctrine(doctrine.id);
    assert.equal(view.name,translated.name);
    assert.equal(view.summary,translated.summary);
    assert.equal(view.focus,translated.focus);
    assert.equal(view.id,doctrine.id);
    assert.equal(view.cost,doctrine.cost);
   }
   const html=warfrontMarkup(snapshot,game,null);
   assert.ok(html.includes(htmlEscape(nativeWarfrontDoctrine('assault').name)),code);
   assert.ok(html.includes(htmlEscape(nativeWarfrontDoctrine('recon').focus)),code);
   assert.ok(html.includes(formatNumber(70)+' '+displayResource('gold')),code+': dynamic resource label');
   assert.ok(html.includes('data-warfront-action="prepare"'));
   assert.equal(JSON.stringify(WARFRONT_DOCTRINES),doc);
   assert.equal(JSON.stringify(WARFRONT_DAILY_REWARD),daily);
   assert.equal(JSON.stringify(game),baseline);
  }
 }finally{setLocale('tr');}
});
test('native logistics text and number formatting never run currency or combat mutations',()=>{
 const src=readFileSync(new URL('locale-warfront-v247.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/fetch\(|supabase|localStorage\.setItem|\.cost\s*=|damageMultiplier\s*=/);
});
