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
 function ambient(){
   if(!enabled || !context || context.state==='suspended')return;
   // A sparse original 4-note motif, softer in the village than in combat.
   const village=[196,246.94,293.66,392],combat=[146.83,174.61,220,293.66];
   const notes=scene==='combat'?combat:village;
   tone(notes[beat++%notes.length],scene==='combat'?.42:.65,{volume:scene==='combat'?.09:.055,type:'sine'});
 }
 function cue(name){
   if(!enabled)return;
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
