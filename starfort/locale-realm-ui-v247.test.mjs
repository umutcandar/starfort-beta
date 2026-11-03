import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {REALM_UI_KEYS,REALM_UI,realmText,auditRealmUI} from './locale-realm-ui-v247.js';
import {REALMS,realmMapModel,realmMapMarkup} from './realm-map.js';
const acc=()=>({cleared:[1],campaignStars:{1:3,2:1},veteranMedals:{1:2},mission:null});
test('all 14 languages use native world-map descriptions and preserve eight canonical regions',()=>{
 assert.equal(REALM_UI_KEYS.length,13);
 assert.deepEqual(Object.keys(REALM_UI).sort(),SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en').sort());
 assert.deepEqual(auditRealmUI(),[]);
 assert.equal(REALMS.length,8);
 const account=acc(),state=JSON.stringify(account),model=JSON.stringify(realmMapModel(account));
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  const html=realmMapMarkup(account);
  assert.ok(html.includes(realmText('Yıldız Yolu · Kuzey Kıtası','Star Road · Northern Continent')),lang);
  assert.equal((html.match(/data-realm-select=/g)||[]).length,8);
  assert.match(html,/data-realm-mission=\"2\"/);
  const cleared=realmMapMarkup(account,{selected:1});
  assert.match(cleared,/data-account-veteran=\"1:3\"/);
  assert.match(cleared,/★{3}/);
  assert.equal(JSON.stringify(account),state);
  assert.equal(JSON.stringify(realmMapModel(account)),model);
 }}finally{setLocale('tr');}
});
test('translated map copy is complete and only contains passive text',()=>{
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en')){
  assert.deepEqual(Object.keys(REALM_UI[lang]).sort(),[...REALM_UI_KEYS].sort());
  for(const v of Object.values(REALM_UI[lang]))assert.ok(v.trim()&&!/<script|javascript:|onerror\s*=/i.test(v));
 }
});
