// The second architectural era starts at LEVEL 10 (level 9 intentionally shares
// the completed eight-level facade). Read-only, deterministic authored facade data.
import {ART_PLOTS} from './city-art-layout.js';
export const MASTERY_START_LEVEL=10;
export const MASTERY_ARCHITECTURE=Object.freeze([
 {name:'Ustalık sancağı',shape:'banner'},
 {name:'Yaldızlı gözetleme feneri',shape:'lantern'},
 {name:'Taş gözetleme burcu',shape:'turret'},
 {name:'Kraliyet arması',shape:'shield'},
 {name:'Işık kemeri',shape:'arch'},
 {name:'Yıldız kristal ocağı',shape:'crystal'},
 {name:'Çifte muhafız sancağı',shape:'twin-banner'},
 {name:'Koruyucu anıt',shape:'obelisk'},
 {name:'Ustalık tacı',shape:'crown'},
 {name:'Işık nöbetçileri',shape:'beacons'},
 {name:'Ebedî yıldız anıtı',shape:'monument'},
].map((x,i)=>Object.freeze({...x,level:MASTERY_START_LEVEL+i})));
const offsets=Object.freeze([-96,89,-68,68,-4,-110,109,-45,45,-80,78]);
const heights=Object.freeze([64,45,73,57,55,67,54,86,60,49,101]);
export const MASTERY_PALETTE=Object.freeze({
 keep:['#c7a666','#fff2be','#4f6f85'],
 farm:['#a8b970','#eddda2','#627e67'],
 lumber:['#ba965b','#ffe2a8','#506e72'],
 quarry:['#9fb9ca','#d5f1fb','#63768f'],
 forge:['#d28a5f','#ffe0a0','#6e5554'],
 tavern:['#c79b7b','#fff0ba','#695d84'],
 observatory:['#89c4d5','#e4faff','#626caa']
});
/** Returns fresh ornaments, one cumulative visible addition per level from 10 to 20. */
export function masteryArchitectureForLevel(id,level) {
 if(typeof id!=='string'||!Object.hasOwn(ART_PLOTS,id)||!Number.isFinite(level)||level<MASTERY_START_LEVEL)return [];
 const plot=ART_PLOTS[id];
 const count=Math.min(MASTERY_ARCHITECTURE.length,Math.floor(level)-MASTERY_START_LEVEL+1);
 const [accent,highlight,base]=MASTERY_PALETTE[id];
 return MASTERY_ARCHITECTURE.slice(0,count).map((stage,i)=>({
  id,level:stage.level,shape:stage.shape,name:stage.name,
  x:plot.anchor[0]+offsets[i],y:plot.anchor[1]-10-(i%3)*9,
  height:heights[i],accent,highlight,base
 }));
}
