/** Native item descriptions for twelve extra locales; Turkish canonical and English v2.46 remain unchanged. */
import {getLocale,SUPPORTED_LOCALES} from './locale-v243.js';
import {ITEM_LORE_EU} from './locale-item-lore-eu-v247.js';
import {ITEM_LORE_ASIA} from './locale-item-lore-asia-v247.js';
export const ITEM_LORE_NATIVE=Object.freeze({...ITEM_LORE_EU,...ITEM_LORE_ASIA});
export const nativeItemDescription=id=>ITEM_LORE_NATIVE[getLocale()]?.[id]||null;
export const auditItemLore=()=>{
 const ids=['iron_sword','ward_mail','lunar_charm','ember_blade','warden_plate','star_lens','royal_blade','aegis','moonheart','grave_seal','eclipse_edge','moon_watch','ember_guard','dawn_relic','star_spear','dawn_guard','starbreaker','ashes_plate','guardian_seal'];
 return SUPPORTED_LOCALES.filter(x=>x!=='tr'&&x!=='en').flatMap(locale=>ids.filter(id=>!ITEM_LORE_NATIVE[locale]?.[id]?.trim()).map(id=>locale+': '+id));
};
