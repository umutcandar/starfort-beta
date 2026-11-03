/** STARFORT v2.40 — audiovisual combat director.
 * Effects and dialog are triggered ONLY after authenticated shadow RPC responses.
 * No new win, loot, currency, damage or stats may originate here.
 */
import {createShadow3D} from './shadow-boss-3d-v240.js';
import {getLocale,t} from './locale-v243.js';
const STAGE_NAMES=['Diken Nöbetçisi','Oyuk Siren','Kül Fırtınası','Tutulma Hükümdarı'];
const LINES=Object.freeze([
 Object.freeze({enter:'Köklerim bu geçidi sonsuza dek koruyacak.',phase:'Orman uyanıyor. Kaçamayacaksınız.',special:'Dikenlerimi aşamayacaksınız!',defeat:'Köklerim... bir gün yeniden uzanacak.'}),
 Object.freeze({enter:'Kıyıların sessizliğini bozmayın.',phase:'Sesim ruhunuzu derinliklere çekecek.',special:'Nefesinizi bana verin.',defeat:'Dalgalar... unutmaz.'}),
 Object.freeze({enter:'Külün içinden doğdum. Kül olacaksınız.',phase:'Fırtına güçleniyor!',special:'Gökyüzü şimdi yanacak!',defeat:'Ateş... yeniden tutuşacak.'}),
 Object.freeze({enter:'Tutulma başladı. Işık size yardım etmeyecek.',phase:'Karanlık tahta boyun eğin!',special:'Son ışığınızı söndüreceğim.',defeat:'Güneş... tekrar mı doğuyor?'})
]);
const ENGLISH_LINES=Object.freeze([
 Object.freeze({enter:'My roots will guard this pass forever.',phase:'The forest awakens. You cannot escape.',special:'You will never break my thorns!',defeat:'My roots will rise again.'}),
 Object.freeze({enter:'Do not disturb the silence of these shores.',phase:'My song will drag your souls into the deep.',special:'Give me your last breath.',defeat:'The tides... remember.'}),
 Object.freeze({enter:'I was born from ash. To ash you shall return.',phase:'The storm is growing stronger!',special:'The sky will burn!',defeat:'The fire... will rise again.'}),
 Object.freeze({enter:'The eclipse begins. Light cannot save you.',phase:'Bow before the throne of darkness!',special:'I will extinguish your last light.',defeat:'Is the sun... rising again?'})
]);
const VALID_EVENTS=['enter','attack','guard','feint','heal','skill','impact','shield-break','drain','crush','phase','enrage','victory','defeat','abandon'];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const safe=(v,min=0,max=1000000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const stageOk=n=>safe(n,1,4);
const describe=(type,amount)=>({type,amount:safe(amount)?amount:null});
export function shadowVoiceLines(stage,locale=getLocale()){return (locale!=='tr'?ENGLISH_LINES:LINES)[stageOk(stage)?stage-1:0];}
export function shadowCombatEffects(previous,next,action='get'){
 const old=previous?.battle||null,now=next?.battle||null,events=[];
 if(action==='start'&&now){events.push(describe('enter'),describe('phase'));return events;}
 if(action==='abandon'&&old&&!now)return [describe('abandon')];
 if(action!=='turn'||!old)return events;
 const move=now?.lastAction||'';
 if(move==='guard')events.push(describe('guard'));
 else if(move==='feint')events.push(describe('feint'));
 else if(move==='rally')events.push(describe('heal'));
 else if(move.startsWith('skill:'))events.push(describe('skill'));
 else events.push(describe('attack'));
 if(now){
  if(now.wave===old.wave){
   const damage=Math.max(0,old.enemyHp-now.enemyHp);
   if(damage>0)events.push(describe('impact',damage));
   if(now.playerHp<old.playerHp)events.push(describe('crush',old.playerHp-now.playerHp));
  }else if(now.wave>old.wave){
   events.push(describe('phase'));
  }
  if(old.enemyIntent==='shield'&&(move==='feint'||move.startsWith('skill:')))events.push(describe('shield-break'));
  if(old.enemyIntent==='drain')events.push(describe('drain'));
  if(old.stage===4&&old.wave===3&&old.enemyHp>old.enemyMaxHp*.35&&now.enemyHp<=now.enemyMaxHp*.35){
   events.push(describe('enrage'));
  }
 }else if(next?.lastReport?.won===true){events.push(describe('victory'));}
 else events.push(describe('defeat'));
 return events;
}
export function shadowAtmosphereParticles(stage){
 const id=stageOk(stage)?stage:1;
 const labels=['Süzülen yaprak','Soğuk gelgit','Kızıl kül','Tutulma kıvılcımı'];
 return Array.from({length:13},(_,i)=>({
  x:7+(i*29+id*11)%88,y:10+(i*47+id*5)%83,delay:(i*.41+id*.23)%6,
  duration:4+(i*7)%5,size:2+(i*11)%5,label:labels[id-1]
 }));
}
export function shadowVoiceStatus({audio=false,voice=false}={}){
 return {audio:Boolean(audio),voice:Boolean(voice&&audio),caption:t('audio.voiceNote')};
}
function createVoice(storage,onSpeechState=()=>{}){
 const key='starfort:shadow-voice-v240';
 let enabled=false,current=null;
 try{enabled=storage?.getItem(key)==='1';}catch{}
 const canSpeak=()=>typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined';
 const cancel=()=>{current=null;onSpeechState(false);if(canSpeak())try{speechSynthesis.cancel();}catch{}};
 const speak=(stage,key,active)=>{
  if(!enabled||!active||!canSpeak())return false;
  const text=shadowVoiceLines(stage)[key];
  if(!text)return false;
  try{
   cancel();
   const utterance=new SpeechSynthesisUtterance(text);
   const speechLang=getLocale()!=='tr'?'en-US':'tr-TR';
   utterance.lang=speechLang;utterance.rate=[.73,.82,.87,.72][stage-1]||.8;
   utterance.pitch=[.55,.9,.65,.45][stage-1]||.7;utterance.volume=.7;
   const matching=speechSynthesis.getVoices().find(x=>x.lang?.toLowerCase().startsWith(speechLang.slice(0,2).toLowerCase()));
   if(matching)utterance.voice=matching;
   current=utterance;
   utterance.onstart=()=>{if(current===utterance)onSpeechState(true);};
   const finish=()=>{if(current===utterance){current=null;onSpeechState(false);}};
   utterance.onend=finish;utterance.onerror=finish;
   speechSynthesis.speak(utterance);
   return true;
  }catch{cancel();return false;}
 };
 return {get enabled(){return enabled},get available(){return canSpeak()},
  set(value){enabled=Boolean(value);try{storage?.setItem(key,enabled?'1':'0')}catch{}
   if(!enabled)cancel();return enabled;},
  speak,cancel};
}
function synthSound(audioActive){
 let ctx=null,out=null,disposed=false,ambientTimer=null,ambientStage=0,ambientBeat=0;
 function unlock(){
  if(disposed||!audioActive()||typeof window==='undefined')return false;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  try{if(!ctx){ctx=new C();out=ctx.createGain();out.gain.value=.11;out.connect(ctx.destination)}
   ctx.resume?.();return true;
  }catch{return false;}
 }
 function ping(freq,duration=.16,{wave='triangle',level=.14,slide=1,delay=0}={}){
  if(!unlock())return false;
  try{const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(freq,t);
   osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq*slide),t+duration);
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.exponentialRampToValueAtTime(Math.min(.4,level),t+.015);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain);gain.connect(out);osc.start(t);osc.stop(t+duration+.01);return true;
  }catch{return false;}
 }
 function cue(type,stage=1){
  if(!audioActive())return;
  const f=[168,220,123,196][clamp(stage-1,0,3)];
  if(type==='enter'){ping(f,.75,{wave:'sine',level:.12,slide:.75});ping(f*1.5,.8,{level:.08,delay:.17});}
  else if(type==='attack'){ping(f*1.4,.11,{level:.22,slide:.34});}
  else if(type==='impact'||type==='crush'){ping(type==='crush'?68:99,.23,{wave:'sawtooth',level:.18,slide:.3});}
  else if(type==='guard'){ping(f*2,.22,{wave:'triangle',slide:1.45});}
  else if(type==='shield-break'){ping(750,.26,{wave:'square',level:.07,slide:.21});}
  else if(type==='feint'){ping(340,.18,{wave:'triangle',slide:1.8});}
  else if(type==='heal'){ping(294,.39,{wave:'sine',slide:1.44});ping(440,.3,{wave:'sine',delay:.2});}
  else if(type==='skill'){ping(490,.28,{slide:1.8});}
  else if(type==='drain'){ping(164,.37,{wave:'sine',slide:.43});}
  else if(type==='phase'||type==='enrage'){[.5,1,1.5].forEach((n,i)=>ping(f*n,.5,{wave:'sine',level:.12,delay:i*.19}));}
  else if(type==='victory'){[261,330,392,523].forEach((n,i)=>ping(n,.38,{wave:'triangle',delay:i*.12,level:.13}));}
  else if(type==='defeat'){ping(180,.8,{wave:'triangle',level:.11,slide:.40});}
 }
 const AMBIENT=[
  [110,146.83,164.81,220],
  [130.81,174.61,196,261.63],
  [98,123.47,146.83,196],
  [82.41,110,138.59,164.81]
 ];
 function stopAmbient(){
  if(ambientTimer!==null){clearInterval(ambientTimer);ambientTimer=null}
  ambientStage=0;
 }
 function startAmbient(stage){
  if(ambientStage===stage&&ambientTimer!==null)return;
  stopAmbient();
  if(!audioActive()||typeof setInterval!=='function')return;
  ambientStage=stage;ambientBeat=0;
  // A sparse original boss-specific drone, not an imported copyrighted track.
  ambientTimer=setInterval(()=>{
   if(disposed||!audioActive()||globalThis.document?.hidden)return;
   const notes=AMBIENT[clamp(ambientStage-1,0,3)],idx=ambientBeat++%notes.length;
   ping(notes[idx],1.25,{wave:'sine',level:.035,delay:0});
   ping(notes[(idx+2)%4]*.5,1.8,{wave:'triangle',level:.020,delay:.16});
  },4400);
 }
 return {unlock,cue,startAmbient,stopAmbient,destroy(){disposed=true;stopAmbient();ctx?.close?.();ctx=null;out=null;}};
}
function renderFx(root,event,reduced){
 if(!root||!event||!VALID_EVENTS.includes(event.type))return;
 const scene=root.querySelector('.shadow-battle-illustration');
 if(!scene)return;
 const el=document.createElement('span');el.className='shadow-vfx shadow-vfx-'+event.type;
 el.setAttribute('aria-hidden','true');
 const symbols={attack:'╱',guard:'⬡',feint:'✧',heal:'✦',skill:'✶',impact:'✹','shield-break':'◈',drain:'☾',crush:'☄',phase:'✦',enrage:'☄',victory:'★',defeat:'×',enter:'✧'};
 el.textContent=event.amount?('-'+event.amount):symbols[event.type]||'✦';
 if(reduced)el.classList.add('shadow-vfx-still');
 scene.appendChild(el);
 if(typeof setTimeout==='function')setTimeout(()=>el.remove(),reduced?1300:850);
}
export function createShadowBattleDirector({
 storage=globalThis.localStorage,
 audioActive=()=>false,
 reduceMotion=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true
}={}){
 let stage=1,root=null,model=null,lastLine=null,disposed=false,quality3D=true,speaking=false;
 const voice=createVoice(storage,active=>{
  speaking=Boolean(active);model?.speak?.(speaking);
  const scene=root?.querySelector('.shadow-battle-illustration');
  if(scene)scene.dataset.shadowSpeaking=String(speaking);
 }),synth=synthSound(audioActive);
 try{quality3D=storage?.getItem('starfort:shadow-render-v240')!=='2d'}catch{}
 function stopModel(){model?.destroy();model=null;root=null;}
 function mount(container,battle){
  voice.cancel();stopModel();if(disposed||!container||!battle){synth.stopAmbient();return false;}
  root=container;stage=stageOk(battle.stage)?battle.stage:1;
  synth.startAmbient(stage);
  const canvas=root.querySelector('[data-shadow-3d-canvas]');
  if(!canvas||!quality3D)return false;
  model=createShadow3D(canvas,{stage,reduceMotion:reduceMotion()});
  if(model.ok){
   canvas.closest('.shadow-battle-illustration')?.classList.add('has-real-webgl');
   model.sync({wave:battle.wave,intent:battle.enemyIntent,
    enraged:stage===4&&battle.wave===3&&battle.enemyHp<=battle.enemyMaxHp*.35});
  }
  return model.ok;
 }
 function play(events,{allowVoice=true}={}){
  if(disposed)return [];
  const list=Array.isArray(events)?events.filter(x=>x&&VALID_EVENTS.includes(x.type)):[];
  for(const event of list){
   if(event.type==='impact'||event.type==='crush'||event.type==='phase')model?.hit?.();
   if(root)renderFx(root,event,reduceMotion());
   synth.cue(event.type,stage);
  }
  const spoken=allowVoice?(list.find(x=>x.type==='victory')?'defeat':
    list.find(x=>x.type==='enter')?'enter':
    list.find(x=>x.type==='phase'||x.type==='enrage')?'phase':
    list.find(x=>x.type==='crush'||x.type==='drain')?'special':null):null;
  if(spoken){
   const phrase=shadowVoiceLines(stage)[spoken];lastLine=phrase;
   const caption=root?.querySelector('[data-shadow-caption]');
   if(caption)caption.textContent='“'+phrase+'”';
   voice.speak(stage,spoken,audioActive());
  }
  return list.map(x=>x.type);
 }
 return {mount,play,unlock(){return synth.unlock()},get speaking(){return speaking},get quality3D(){return quality3D},
  toggleQuality(){quality3D=!quality3D;
   try{storage?.setItem('starfort:shadow-render-v240',quality3D?'3d':'2d')}catch{}
   return quality3D;},get voiceEnabled(){return voice.enabled},
  get voiceAvailable(){return voice.available},get lastLine(){return lastLine},
  toggleVoice(){return voice.set(!voice.enabled)},cancelVoice(){voice.cancel();},
  dispose(){stopModel();voice.cancel();synth.stopAmbient();},destroy(){disposed=true;stopModel();voice.cancel();synth.destroy();}};
}
