/** STARFORT v2.49 — presentation-only hero identity and camera framing.
 * No RPC, health, loot, cooldown or battle authority lives in this module.
 * The rig itself remains the independently licensed CC0 Gobkit humanoid GLB.
 */
const HERO_STYLE=Object.freeze({
 aldren:{accent:0xecc27b,steel:0x9eacb8,tint:0x293d59,build:1.07,head:0.91,metal:0.28},
 lyra:{accent:0x8ed9fa,steel:0x8390b3,tint:0x4d497a,build:0.94,head:0.90,metal:0.06},
 rovan:{accent:0xb3dd86,steel:0x716d61,tint:0x345547,build:0.97,head:0.91,metal:0.09},
 mira:{accent:0xffd8a5,steel:0xac916e,tint:0xb9a182,build:0.93,head:0.90,metal:0.07},
 doran:{accent:0xe6a071,steel:0x646c75,tint:0x563833,build:1.12,head:0.90,metal:0.34},
 vesper:{accent:0xc4a0f9,steel:0x4f5968,tint:0x493955,build:0.94,head:0.88,metal:0.12},
 eira:{accent:0xb1eeff,steel:0x99b2a5,tint:0x36617b,build:0.96,head:0.90,metal:0.08}
});
const ENEMY_STYLE=Object.freeze({
 raider:{accent:0xec816c,steel:0x6f554e,tint:0xe1b9af,build:1.0,head:0.90,metal:0.17},
 caster:{accent:0xc895ea,steel:0x73618b,tint:0xc9b8d5,build:0.95,head:0.90,metal:0.08},
 boss:{accent:0xff754e,steel:0x493d43,tint:0xc6a5a0,build:1.19,head:0.93,metal:0.37},
 archer:{accent:0xec816c,steel:0x6f554e,tint:0xe1b9af,build:0.97,head:0.90,metal:0.13}
});
export function combatAppearance(unit){
 const style=unit?.team===0?HERO_STYLE[unit?.heroId]:ENEMY_STYLE[unit?.type];
 return Object.freeze(style||ENEMY_STYLE.raider);
}
/** World-size multiplier uses camera's existing validated distance parameter. */
export function combatCameraFrame(requestedDistance=51,aspect=16/9,quality='balanced'){
 const d=Number.isFinite(Number(requestedDistance))?Number(requestedDistance):51;
 const a=Number.isFinite(Number(aspect))?Number(aspect):16/9;
 const zoom=a<1.1?0.34:a<1.55?0.27:0.201;
 return Object.freeze({distance:Math.max(8.6,Math.min(20.5,d*zoom)),fov:a<1.1?53:a<1.55?44:38,
  y:a<1.1?6.6:5.3,focusY:1.35,far:quality==='performance'?65:95});
}
/** Reproducible decor: no Math.random calls during 3D rendering. */
export function battlefieldScatter(stage,index){
 let state=(((Number(stage)||1)*194953+index*1013904223)>>>0);
 const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 return Object.freeze({x:(next()-.5)*38,z:(next()-.5)*25,size:.32+next()*1.1,
  turn:next()*Math.PI*2,variation:next()});
}
