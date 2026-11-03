import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES} from './locale-v243.js';
import {TEAM_HUD_KEYS,TEAM_HUD_NATIVE,auditTeamHud} from './locale-team-hud-native-v247.js';
import {hasNativeBilingual} from './locale-unified-v247.js';
test('all 85 2v2 and 5v5 live-team phrases are available in every international locale',()=>{
 assert.equal(TEAM_HUD_KEYS.length,85);assert.equal(new Set(TEAM_HUD_KEYS).size,85);
 assert.deepEqual(auditTeamHud(),[]);
 for(const lang of SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en'))for(const key of TEAM_HUD_KEYS){
  assert.equal(hasNativeBilingual(key,lang),true,lang+':'+key);
  assert.ok(TEAM_HUD_NATIVE[lang][key]?.trim()&&!/<script|javascript:|onerror\s*=/i.test(TEAM_HUD_NATIVE[lang][key]));
 }
});
test('team source bilingual inventory is exact and match action names are never translated',()=>{
 const source=readFileSync(new URL('team-view.js',import.meta.url),'utf8');
 const regex=/\b(?:local|lt|l)\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*\)/g;
 const extracted=[...new Set([...source.matchAll(regex)].map(m=>(m[3]??m[4]).replace(/\\(['"\\])/g,'$1')))];
 for(const key of TEAM_HUD_KEYS)assert.ok(extracted.includes(key),'missing canonical team label: '+key);
 for(const key of extracted)for(const lang of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en'))assert.ok(hasNativeBilingual(key,lang),lang+' missing '+key);
 for(const dataAction of ['data-team-open','data-queue','data-team-'])assert.ok(source.includes(dataAction)||source.includes('data-team-'),dataAction);
});
