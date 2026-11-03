import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {HERO_UI,heroTitle,heroAbilityName,heroRole} from './locale-hero-ui-v247.js';
import {displayHero,displayHeroRole,displayHeroAbility,HERO_DISPLAY_EN} from './locale-heroes-v245.js';
import {ALL_HEROES,createState} from './rules.js';
const ids=['aldren','lyra','rovan','mira','doran','vesper','eira','aurelion','nyxara'];
const roles=['tank','mage','ranger','healer','fighter','assassin'];
test('nine hero titles, nine skill names and six class names cover fourteen locales',()=>{
 assert.deepEqual(Object.keys(HERO_UI).sort(),[...SUPPORTED_LOCALES].sort());
 for(const code of SUPPORTED_LOCALES){
  const pack=HERO_UI[code];
  assert.deepEqual(Object.keys(pack.titles).sort(),[...ids].sort(),code+' titles');
  assert.deepEqual(Object.keys(pack.abilities).sort(),[...ids].sort(),code+' abilities');
  assert.deepEqual(Object.keys(pack.roles).sort(),[...roles].sort(),code+' roles');
  for(const title of [...Object.values(pack.titles),...Object.values(pack.abilities),...Object.values(pack.roles)]){
   assert.ok(title.trim(),code);
   assert.doesNotMatch(title,/<script|onerror\s*=|javascript:/i);
  }
 }
});
test('hero presentation switches to native names and keeps HP/attack, IDs and currency unchanged',()=>{
 const save=createState(Date.UTC(2026,10,3,11)),before=JSON.stringify(save);
 try{
  for(const locale of SUPPORTED_LOCALES){
   setLocale(locale);
   assert.equal(getLocale(),locale);
   for(const hero of ALL_HEROES){
    const out=displayHero(hero);
    assert.equal(out.id,hero.id);
    assert.equal(out.hp,hero.hp);
    assert.equal(out.attack,hero.attack);
    assert.equal(out.title,locale==='tr'?hero.title:heroTitle(hero.id));
    const skill={name:'kanonik-yetenek',description:'kanonik-açıklama',cooldown:9,mana:3};
    const translated=displayHeroAbility(hero.id,skill);
    assert.equal(translated.cooldown,9);
    assert.equal(translated.mana,3);
    assert.equal(translated.name,locale==='tr'?skill.name:heroAbilityName(hero.id));
   }
   for(const role of roles)assert.equal(displayHeroRole(role),heroRole(role));
   assert.equal(JSON.stringify(save),before,locale);
  }
  setLocale('en');
  for(const hero of ALL_HEROES){
   assert.equal(displayHero(hero).title,HERO_DISPLAY_EN[hero.id].title);
   assert.equal(displayHeroAbility(hero.id,{name:'x',description:'x'}).name,HERO_DISPLAY_EN[hero.id].ability);
  }
 }finally{setLocale('tr');}
});
