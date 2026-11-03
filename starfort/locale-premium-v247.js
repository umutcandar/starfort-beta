/** v2.47 native cosmetic catalog. Server ownership, crystals and prices remain canonical. */
import {getLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {PREMIUM_NATIVE_EU} from './locale-premium-eu-v247.js';
import {PREMIUM_NATIVE_ASIA} from './locale-premium-asia-v247.js';
export const PREMIUM_NATIVE=Object.freeze({...PREMIUM_NATIVE_EU,...PREMIUM_NATIVE_ASIA});
export const nativePremiumItem=id=>PREMIUM_NATIVE[getLocale()]?.items?.[id]||null;
export function auditPremiumNative(){
 const ids=['castle-aurora','castle-ember','cape-starlight','cape-shadow','banner-royal','banner-astral','victory-gold','victory-sky','banner-trailblazer','cape-scout','castle-dawn','victory-constellation','crystals100','crystals500','crystals1200'];
 return SUPPORTED_LOCALES.filter(l=>l!=='tr'&&l!=='en').flatMap(locale=>ids.filter(id=>{
  const item=PREMIUM_NATIVE[locale]?.items?.[id];
  return !item?.name?.trim()||!item.detail?.trim();
 }).map(id=>locale+': '+id));
}
