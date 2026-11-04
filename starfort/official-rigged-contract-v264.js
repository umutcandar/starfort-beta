/** STARFORT Beta.15: actual licensed, textured, SKINNED glTF characters.
 * CC0 Gobkit Free Character Pack Vol.3 (human003).
 * All eight GLBs have their own named Idle/Walk/Run/Hit/Death/Attack/Special clips.
 * Licences: https://gobkit.com/freebies and https://creativecommons.org/publicdomain/zero/1.0/
 * The command/turn/HP/reward authority remains entirely on the game server.
 */
export const RIGGED_ASSETS=Object.freeze({
 Archer:'https://gobkit.com/freebies/human003/Archer.glb',
 Footman:'https://gobkit.com/freebies/human003/Footman.glb',
 HeavyWarrior:'https://gobkit.com/freebies/human003/HeavyWarrior.glb',
 King:'https://gobkit.com/freebies/human003/King.glb',
 KnightCaptain:'https://gobkit.com/freebies/human003/KnightCaptain.glb',
 PeasantMilitia:'https://gobkit.com/freebies/human003/PeasantMilitia.glb',
 Priestess:'https://gobkit.com/freebies/human003/Priestess.glb',
 Scout:'https://gobkit.com/freebies/human003/Scout.glb'
});
export const RIGGED_HERO_MAP=Object.freeze({
 aldren:'KnightCaptain',lyra:'Priestess',rovan:'Archer',
 mira:'Priestess',doran:'HeavyWarrior',vesper:'Scout',eira:'Priestess'
});
export const RIGGED_ENEMY_MAP=Object.freeze({raider:'Footman',caster:'Priestess',boss:'King',archer:'Archer'});
export const RIGGED_CLIPS=Object.freeze(['Idle','Walk','Run','Hit','Death','Attack','Special']);
export const RIGGED_LICENSE='CC0 1.0 Universal — Gobkit Free Character Pack Vol.3';
export const RIGGED_LOCAL_DIR='assets/rigged';
export const RIGGED_BUNDLE='assets/rigged/engine-v264.js';
export function riggedModelForUnit(unit){
 if(unit?.team===0)return RIGGED_HERO_MAP[unit.heroId]||'KnightCaptain';
 return RIGGED_ENEMY_MAP[unit?.type]||'Footman';
}
export function riggedAnimationForUnit(unit,moving=false){
 if(!unit||Number(unit.hp)<=0)return 'Death';
 if(unit.action==='hit')return 'Hit';
 if(unit.action==='cast')return 'Special';
 if(unit.action==='attack')return 'Attack';
 if(unit.action==='guard')return 'Special';
 if(moving)return 'Run';
 return 'Idle';
}
export function officialRiggedWorldPosition(unit){
 // Shared authenticated 0..100 x / 0..60 y geometry, independent of game rules.
 const x=Number(unit?.x),y=Number(unit?.y);
 if(!Number.isFinite(x)||!Number.isFinite(y))return null;
 return Object.freeze({x:Math.max(-12,Math.min(12,(x-50)*.235)),z:Math.max(-7,Math.min(7,(y-30)*.17))});
}
