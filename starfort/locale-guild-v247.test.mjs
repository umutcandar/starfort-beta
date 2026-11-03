import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,getLocale} from './locale-v243.js';
import {GUILD_KEYS,GUILD_TRANSLATIONS,guildText} from './locale-guild-v247.js';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
test('clan, raid and chat actions use thirty-three actual translations in all fourteen locales',()=>{
 assert.equal(GUILD_KEYS.length,33);
 assert.deepEqual(Object.keys(GUILD_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 try{
  for(const locale of SUPPORTED_LOCALES){
   const pack=GUILD_TRANSLATIONS[locale];
   assert.deepEqual(Object.keys(pack).sort(),[...GUILD_KEYS].sort(),locale);
   setLocale(locale);
   assert.equal(getLocale(),locale);
   for(const key of GUILD_KEYS){
    assert.equal(typeof pack[key],'string',locale+': '+key);
    assert.ok(pack[key].trim(),locale+': '+key);
    assert.equal(guildText(key),pack[key]);
    assert.doesNotMatch(pack[key],/<script|onerror\s*=|javascript:/i);
   }
  }
 }finally{setLocale('tr');}
});
test('localized clan UI preserves action routes and data bindings for authenticated guild access',()=>{
 const app=read('app.js'),guild=app.slice(app.indexOf('function renderGuild(){'),app.indexOf('async function refreshGuild(){'));
 assert.match(app,/import \{guildText as gt\} from '\.\/locale-guild-v247\.js'/);
 for(const action of ['register','create','join','message','leave','raid','warplan','warprepare']){
  assert.ok(guild.includes('data-guild-action="'+action+'"'),action);
 }
 for(const k of ['new-guild','join-guild','guild-message','war-objective','war-role','war-brief']){
  assert.ok(guild.includes('id="'+k+'"'),k);
 }
 assert.match(guild,/gt\('hall'\)/);
 assert.match(guild,/gt\('raid'\)/);
 assert.match(guild,/gt\('chat'\)/);
 assert.match(guild,/gt\('inviteCode'\)/);
 assert.match(guild,/getLocale\(\)/);
 assert.ok(!guild.includes('data-login-guest'));
 for(const route of ["'guild/create'","'guild/join'","'guild/message'","'guild/raid'","'guild/war/prepare'","'guild/war/plan'"])
  assert.ok(app.includes(route),route);
});
