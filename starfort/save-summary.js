// Comparable, non-sensitive progression overview shown before replacing a save.
const safeNumber=(v)=>Number.isFinite(v)&&v>=0?Math.floor(v):0;
export function progressionSummary(s){
 const state=typeof s==='string'?JSON.parse(s):s;
 if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Kayıt özeti okunamadı.');
 return {
   keep:safeNumber(state.buildings?.keep),
   chapters:Array.isArray(state.cleared)?state.cleared.length:0,
   heroes:state.heroes&&typeof state.heroes==='object'?Object.keys(state.heroes).length:0,
   gold:safeNumber(state.res?.gold)
 };
}
