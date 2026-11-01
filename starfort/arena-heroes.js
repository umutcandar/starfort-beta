// Equal base HP, server-controlled distinct playstyles. Only canonical IDs accepted.
// No purchased stats, castle levels, client-supplied damage or arbitrary multipliers.
export const ARENA_HERO_STYLES=Object.freeze({
  aldren:{name:'Aldren',title:'Kül Muhafızı',speed:1,range:1,damage:1,burst:0.9,burstRange:1,heal:8},
  lyra:{name:'Lyra',title:'Gölge Okçusu',speed:1,range:1.20,damage:0.87,burst:1,burstRange:1.20,heal:0},
  rovan:{name:'Rovan',title:'Öncü Savaşçı',speed:1.14,range:0.9,damage:1,burst:1.14,burstRange:0.9,heal:0},
  mira:{name:'Mira',title:'Yıldız Şifacısı',speed:1,range:1,damage:0.91,burst:0.78,burstRange:1,heal:12},
});
const BASE=Object.freeze({name:'Komutan',title:'Dengeli',speed:1,range:1,damage:1,burst:1,burstRange:1,heal:0});
export const validArenaHero=id=>typeof id==='string' && Object.hasOwn(ARENA_HERO_STYLES,id)?id:null;
export const arenaHeroStyle=id=>ARENA_HERO_STYLES[validArenaHero(id)]||BASE;
export function balanceBudget(id){
 const s=arenaHeroStyle(id);
 return Math.round((s.speed+s.range+s.damage+s.burst+s.burstRange)*100)/100;
}
