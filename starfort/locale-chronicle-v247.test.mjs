import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {CHRONICLE_UI_KEYS,CHRONICLE_TRANSLATIONS,auditChronicleTranslations} from './locale-chronicle-v247.js';
import {CHRONICLE_MILESTONES,displayChronicleRank,chronicleMarkup,chronicleState} from './commander-chronicle.js';
test('14 locale packs provide 30 distinct readable ranks and 11 chronicle captions',()=>{
 assert.equal(CHRONICLE_UI_KEYS.length,11);
 assert.deepEqual(Object.keys(CHRONICLE_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditChronicleTranslations(),[]);
 assert.equal(CHRONICLE_MILESTONES.length,30);
 try{for(const locale of SUPPORTED_LOCALES){setLocale(locale);
  const pack=CHRONICLE_TRANSLATIONS[locale];
  assert.equal(pack.sigils.length,10);assert.equal(pack.ranks.length,3);
  assert.deepEqual(Object.keys(pack.ui).sort(),[...CHRONICLE_UI_KEYS].sort());
  const names=CHRONICLE_MILESTONES.map(displayChronicleRank);
  assert.equal(new Set(names).size,30,locale+' unique 30 ranks');
  assert.ok(names.every(x=>typeof x==='string'&&x.trim()));
  assert.ok(Object.values(pack.ui).every(x=>typeof x==='string'&&x.trim()&&!/<script|javascript:/i.test(x)));
  const panel=chronicleMarkup({counters:{win:1},contractClaims:{}});
  assert.ok(panel.includes(pack.ui.intro),locale+' intro');
  assert.ok(panel.includes(pack.ui.verified),locale+' victory label');
  assert.ok(panel.includes(pack.ui.nextProgress),locale+' progress accessibility');
  assert.ok(panel.includes('data-account-chronicle=\"1\"'),locale+' claim action');
  assert.ok(panel.includes(names[0]),locale+' first rank display');
 }}finally{setLocale('tr');}
});
test('rank thresholds, server claims, resources and user data remain canonical across languages',()=>{
 const state={counters:{win:17},contractClaims:{}};
 const snapshot=JSON.stringify(state);
 const original=CHRONICLE_MILESTONES.map(m=>({rank:m.rank,wins:m.wins,gold:m.gold,aether:m.aether,name:m.name}));
 try{for(const locale of SUPPORTED_LOCALES){setLocale(locale);
  for(const m of CHRONICLE_MILESTONES){assert.equal(m.wins,m.rank*m.rank*2);assert.equal(m.gold,100+m.rank*60);assert.equal(m.aether,5+m.rank*3);}
  assert.equal(chronicleState(state).eligible,true);
  assert.equal(chronicleState(state).next.rank,1);
  const markup=chronicleMarkup(state);
  assert.match(markup,/data-account-chronicle=\"1\"/);
  assert.equal(JSON.stringify(state),snapshot);
  assert.deepEqual(CHRONICLE_MILESTONES.map(m=>({rank:m.rank,wins:m.wins,gold:m.gold,aether:m.aether,name:m.name})),original);
 }}finally{setLocale('tr');}
});
