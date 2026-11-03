import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale} from './locale-v243.js';
import {SHADOW_VOICE_NATIVE,SHADOW_PHASE_NATIVE,shadowSpeechLanguage,auditShadowVoiceNative,shadowArtLabel} from './locale-shadow-voice-v247.js';
import {shadowVoiceLines} from './shadow-battle-director-v240.js';
import {shadowBossPhase,shadowBossArtwork} from './shadow-boss-art-v239.js';
test('four boss identities have original lines in every supported language and browser TTS uses matching language tags',()=>{
 assert.deepEqual(auditShadowVoiceNative(),[]);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  assert.ok(shadowSpeechLanguage().startsWith(lang.slice(0,2)),lang);
  for(let stage=1;stage<=4;stage++){
   const voice=shadowVoiceLines(stage);assert.deepEqual(Object.keys(voice).sort(),['defeat','enter','phase','special']);
   assert.ok(Object.values(voice).every(line=>line.length>8),lang+' stage '+stage);
   if(lang!=='tr'&&lang!=='en')assert.deepEqual(voice,SHADOW_VOICE_NATIVE[lang][stage-1]);
  }
  const art=shadowBossArtwork(1);
  assert.ok(art.includes(shadowArtLabel()),lang+' native art description');
 }}finally{setLocale('tr');}
});
test('phase IDs, thresholds and combat danger stay identical across all fourteen translations',()=>{
 const base=[shadowBossPhase(1,2,100,100),shadowBossPhase(2,3,120,200),shadowBossPhase(4,3,50,100),shadowBossPhase(4,3,20,100)];
 const ids=base.map(x=>[x.id,x.danger]);
 try{for(const lang of SUPPORTED_LOCALES){setLocale(lang);
  assert.deepEqual([shadowBossPhase(1,2,100,100),shadowBossPhase(2,3,120,200),shadowBossPhase(4,3,50,100),shadowBossPhase(4,3,20,100)].map(x=>[x.id,x.danger]),ids);
  const p=shadowBossPhase(4,3,20,100);
  assert.ok(p.title.trim()&&p.hint.trim());
  if(lang!=='tr'){
   assert.equal(p.title,SHADOW_PHASE_NATIVE[lang].titles[12]);
   assert.equal(shadowBossPhase(1,1,100,100).title,SHADOW_PHASE_NATIVE[lang].titles[0]);
   assert.equal(shadowBossPhase(2,3,100,200).hint,SHADOW_PHASE_NATIVE[lang].hints[1]);
  }
 }}finally{setLocale('tr');}
});
