/** v2.47 full native hero biographies and skill descriptions for 12 additional locales.
 * All combat ability IDs, damage multipliers and timings remain in server rules.
 */
import {getLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {HERO_LORE_EU} from './locale-hero-lore-eu-v247.js';
import {HERO_LORE_ASIA} from './locale-hero-lore-asia-v247.js';
export const HERO_LORE_NATIVE=Object.freeze({...HERO_LORE_EU,...HERO_LORE_ASIA});
export const nativeHeroLore=id=>HERO_LORE_NATIVE[getLocale()]?.[id]?.lore||null;
export const nativeHeroAbilityDescription=id=>HERO_LORE_NATIVE[getLocale()]?.[id]?.abilityDescription||null;
export function auditHeroLore(){
 const ids=['aldren','lyra','rovan','mira','doran','vesper','eira','aurelion','nyxara'];
 const errors=[];
 for(const lang of SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en')){
  for(const id of ids){
   const details=HERO_LORE_NATIVE[lang]?.[id];
   if(!details?.lore?.trim()||!details?.abilityDescription?.trim())errors.push(lang+': '+id);
  }
 }
 return errors;
}
