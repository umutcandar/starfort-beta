/** STARFORT v2.51: anatomical human battle model contract (MakeHuman CC0).
 * Only the generated .glb is downloaded, not the GPL authoring application.
 * Source and output license: https://github.com/kblood/CharacterCreator/blob/main/LICENSE-NOTES.md
 * The source commit is pinned: no floating third-party assets at runtime.
 * All combat, HP and rewards remain authoritative server-only data.
 */
export const ANATOMICAL_MODEL=Object.freeze({
 name:'RealHuman',
 source:'https://github.com/kblood/CharacterCreator',
 license:'CC0-1.0 (generated MakeHuman/MPFB core assets)',
 commit:'852e48f316b90a0937234886630e4fb4cdfd1f78',
 url:'https://raw.githubusercontent.com/kblood/CharacterCreator/852e48f316b90a0937234886630e4fb4cdfd1f78/output/base_body_anim.glb',
 file:'assets/rigged/RealHuman.glb',
 minBytes:1000000,
 maxBytes:15000000,
 requiredBones:Object.freeze(['Root','pelvis','spine_01','spine_03','head',
   'upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','hand_l','hand_r',
   'thigh_l','thigh_r','calf_l','calf_r']),
 requiredAnimations:Object.freeze(['idle','walk','run'])
});
export const ANATOMICAL_HERO_PRESETS=Object.freeze({
 aldren:{sex:'male',build:0.28,age:0,height:0.08},
 lyra:{sex:'female',build:-0.10,age:0,height:0.02},
 rovan:{sex:'male',build:-0.12,age:0,height:0.04},
 mira:{sex:'female',build:-0.07,age:0,height:0.01},
 doran:{sex:'male',build:0.48,age:0,height:0.13},
 vesper:{sex:'female',build:-0.16,age:0,height:-0.04},
 eira:{sex:'female',build:-0.08,age:0.14,height:0.03}
});
export function anatomicalPreset(unit){
 if(unit?.team===0)return ANATOMICAL_HERO_PRESETS[unit?.heroId]||ANATOMICAL_HERO_PRESETS.aldren;
 if(unit?.type==='boss')return Object.freeze({sex:'male',build:0.65,age:0.35,height:.12});
 if(unit?.type==='caster')return ANATOMICAL_HERO_PRESETS.eira;
 return ANATOMICAL_HERO_PRESETS.rovan;
}
