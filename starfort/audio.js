// Original synthesised STARFORT cues. No third-party recordings or copyrighted songs.
// Starts muted; AudioContext is created only after an explicit player gesture.
export const AUDIO_KEY='starfort:audio-enabled';
export function createGameAudio({storage=globalThis.localStorage,Audio=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
 let enabled=false,context=null,master=null,scene='village',interval=null,beat=0;
 try{enabled=storage?.getItem(AUDIO_KEY)==='1';}catch{}
 function start(){
   if(!Audio || !enabled)return false;
   if(!context){
     context=new Audio(); master=context.createGain(); master.gain.value=.10;
     master.connect(context.destination);
   }
   context.resume?.();
   if(!interval && typeof setInterval==='function')interval=setInterval(ambient,5000);
   return true;
 }
 function tone(freq=440,length=.13,{type='sine',volume=.22,delay=0}={}){
   if(!enabled||!start())return;
   const oscillator=context.createOscillator(),gain=context.createGain(),t=context.currentTime+delay;
   oscillator.type=type;oscillator.frequency.setValueAtTime(freq,t);
   gain.gain.setValueAtTime(.001,t);
   gain.gain.exponentialRampToValueAtTime(Math.max(.002,volume),t+.02);
   gain.gain.exponentialRampToValueAtTime(.001,t+length);
   oscillator.connect(gain);gain.connect(master);
   oscillator.start(t);oscillator.stop(t+length+.03);
 }
 // Procedural original sword/shield/spell timbres. Generated only when opt-in audio is enabled.
 function noiseBurst(length=.16,{volume=.12,center=1200,delay=0}={}){
   if(!enabled||!start()||typeof context.createBuffer!=='function')return;
   const count=Math.max(1,Math.ceil(context.sampleRate*length));
   const buffer=context.createBuffer(1,count,context.sampleRate),out=buffer.getChannelData(0);
   let seed=(Math.floor(context.currentTime*100000)+32719)>>>0;
   for(let i=0;i<count;i++){
     seed=(Math.imul(seed,1664525)+1013904223)>>>0;
     const p=i/count;out[i]=(seed/2147483648-1)*Math.pow(1-p,2.3);
   }
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   const t=context.currentTime+delay;
   source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(center,t);
   filter.Q.value=.8;gain.gain.setValueAtTime(.001,t);
   gain.gain.exponentialRampToValueAtTime(Math.max(.002,volume),t+.012);
   gain.gain.exponentialRampToValueAtTime(.001,t+length);
   source.connect(filter);filter.connect(gain);gain.connect(master);
   source.start(t);source.stop(t+length+.015);
 }
 function battleCue(name){
   if(!enabled)return;
   if(name==='sword'){noiseBurst(.21,{center:1600,volume:.20});tone(205,.095,{type:'triangle',volume:.10,delay:.05});}
   if(name==='bow'){noiseBurst(.12,{center:2400,volume:.09});tone(570,.12,{type:'triangle',volume:.12});}
   if(name==='spell'){tone(296,.30,{volume:.11});tone(587,.38,{delay:.08,type:'sine',volume:.18});noiseBurst(.20,{center:2900,volume:.12,delay:.06});}
   if(name==='shield'){noiseBurst(.24,{center:840,volume:.15});tone(160,.18,{type:'triangle',volume:.21});}
   if(name==='heavy'){noiseBurst(.31,{center:410,volume:.19});tone(105,.26,{type:'sawtooth',volume:.14});}
 }
 function ambient(){
   if(!enabled || !context || context.state==='suspended')return;
   // A sparse original 4-note motif, softer in the village than in combat.
   const village=[196,246.94,293.66,392],combat=[146.83,174.61,220,293.66];
   const notes=scene==='combat'?combat:village;
   tone(notes[beat++%notes.length],scene==='combat'?.42:.65,{volume:scene==='combat'?.09:.055,type:'sine'});
 }
 function cue(name){
   if(!enabled)return;
   if(['sword','bow','spell','shield','heavy'].includes(name))battleCue(name);
   if(name==='click')tone(540,.08,{volume:.12});
   if(name==='equip'){tone(392,.1,{volume:.20});tone(587.33,.18,{delay:.1,volume:.16});}
   if(name==='hit')tone(130,.13,{type:'triangle',volume:.18});
   if(name==='victory'){[392,493.88,587.33,783.99].forEach((n,i)=>tone(n,.35,{delay:i*.13,volume:.19}));}
   if(name==='warning'){tone(220,.2,{type:'triangle',volume:.13});tone(164.81,.3,{delay:.17,volume:.1});}
 }
 return {
   get enabled(){return enabled;},
   setScene(next){scene=next==='combat'?'combat':'village';},
   toggle(){
     enabled=!enabled;
     try{storage?.setItem(AUDIO_KEY,enabled?'1':'0');}catch{}
     if(enabled){start();cue('equip');}
     else {if(interval){clearInterval(interval);interval=null;}context?.suspend?.();}
     return enabled;
   },
   cue,
   suspend(){context?.suspend?.();},
   resume(){if(enabled)start();},
   dispose(){if(interval)clearInterval(interval);interval=null;context?.close?.();context=null;}
 };
}
