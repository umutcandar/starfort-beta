import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {HERO_LORE_NATIVE,nativeHeroLore,nativeHeroAbilityDescription,auditHeroLore} from './locale-hero-lore-v247.js';
import {HERO_DISPLAY_EN,displayHero,displayHeroAbility,displayHeroLore} from './locale-heroes-v245.js';
import {ALL_HEROES,createState} from './rules.js';
const ids=['aldren','lyra','rovan','mira','doran','vesper','eira','aurelion','nyxara'];
const percentages={aldren:[22,40],lyra:[160],rovan:[280,25],mira:[125],doran:[320],vesper:[240,400,40],eira:[125],aurelion:[300,80,10],nyxara:[160,20]};
test('all nine native hero biographies and nine skill descriptions cover twelve additional languages',()=>{
 const other=SUPPORTED_LOCALES.filter(x=>!['tr','en'].includes(x));
 assert.equal(other.length,12);
 assert.deepEqual(Object.keys(HERO_LORE_NATIVE).sort(),[...other].sort());
 assert.deepEqual(auditHeroLore(),[]);
 for(const lang of other){
  assert.deepEqual(Object.keys(HERO_LORE_NATIVE[lang]).sort(),[...ids].sort(),lang);
  for(const id of ids){
   const data=HERO_LORE_NATIVE[lang][id];
   assert.ok(data.lore?.trim()&&data.abilityDescription?.trim(),lang+':'+id);
   assert.doesNotMatch(data.lore+data.abilityDescription,/<script|javascript:|onerror\s*=/i);
   for(const n of percentages[id])assert.match(data.abilityDescription,new RegExp(n+'\\s*-?\\s*%'),lang+':'+id+' missing '+n+'%');
  }
 }
});
test('all fourteen locales render hero stories and correct combat tooltips without modifying any hero data',()=>{
 const state=createState(Date.UTC(2026,10,3,10)),baseline=JSON.stringify(state);
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   assert.equal(getLocale(),locale);
   for(const hero of ALL_HEROES){
    const copy=displayHero(hero),id=hero.id;
    assert.equal(copy.id,id);
    assert.equal(copy.attack,hero.attack);
    assert.equal(copy.hp,hero.hp);
    const description=locale==='tr'?hero.description:locale==='en'?HERO_DISPLAY_EN[id].lore:nativeHeroLore(id);
    assert.equal(copy.description,description);
    assert.equal(displayHeroLore(id,hero.description),locale==='tr'?hero.description:description);
    const skill={name:'Canonical Skill',description:'Canonical text',cooldown:10,power:1.4};
    const output=displayHeroAbility(id,skill);
    assert.equal(output.cooldown,10);
    assert.equal(output.power,1.4);
    assert.equal(output.description,locale==='tr'?skill.description:locale==='en'?HERO_DISPLAY_EN[id].abilityDescription:nativeHeroAbilityDescription(id));
   }
   assert.equal(JSON.stringify(state),baseline,locale);
  }
 }finally{setLocale('tr');}
});
test('hero descriptions remain presentation-only',()=>{
 for(const path of ['locale-hero-lore-eu-v247.js','locale-hero-lore-asia-v247.js','locale-hero-lore-v247.js']){
  const file=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotMatch(file,/supabase|localStorage\.setItem|fetch\(|damageMultiplier\s*=|\.stats\s*=/);
 }
});
