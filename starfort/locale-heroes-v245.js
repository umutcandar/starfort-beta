/** v2.45 hero localization, preserving server IDs and gameplay stats. */
import {getLocale} from './locale-v243.js';
export const HERO_DISPLAY_EN=Object.freeze({
 "aldren": {
  "title": "Ash Warden",
  "lore": "A sworn guardian who kept the last watch as the kingdom fell.",
  "ability": "Oath Shield",
  "abilityDescription": "Grants the party a shield for 6 seconds equal to 22% of health plus 40% of attack."
 },
 "lyra": {
  "title": "Starweaver",
  "lore": "A mage who remembers the language of the fading stars.",
  "ability": "Star Storm",
  "abilityDescription": "Deals 160% damage to all enemies and interrupts prepared spells."
 },
 "rovan": {
  "title": "Shadow Scout",
  "lore": "A ranger who knows every hidden trail in Blackwood.",
  "ability": "Marked Hunt",
  "abilityDescription": "Deals 280% damage to the target, which takes 25% more damage for 6 seconds."
 },
 "mira": {
  "title": "Moon Priestess",
  "lore": "She carries a healing prayer into the darkest battle.",
  "ability": "Moon's Grace",
  "abilityDescription": "Heals the party for 125% of attack plus healing, shielding the weakest ally for 5 seconds."
 },
 "doran": {
  "title": "Iron Oath",
  "lore": "An exiled warrior whose oath now belongs to the keep.",
  "ability": "Shattering Blow",
  "abilityDescription": "Deals 320% damage and stuns the target for 1.8 seconds."
 },
 "vesper": {
  "title": "Shadow Duelist",
  "lore": "The silent blade of the Blackwood paths.",
  "ability": "Night Execution",
  "abilityDescription": "Deals 240% damage; increases to 400% against targets below 40% health."
 },
 "eira": {
  "title": "Frost Oracle",
  "lore": "She hears the song of the stars beneath northern ice.",
  "ability": "Frost Halo",
  "abilityDescription": "Deals 125% damage to all enemies, interrupts casts and freezes them for 1.5 seconds."
 },
 "aurelion": {
  "title": "Dawn Marshal",
  "lore": "The royal guardian bound by a vow to the dawn.",
  "ability": "Dawn Oath",
  "abilityDescription": "Deals 300% damage to a target and 80% to others; gives a 10% party shield for 5 seconds."
 },
 "nyxara": {
  "title": "Eclipse Oracle",
  "lore": "She sees both faces of the eclipse.",
  "ability": "Total Eclipse",
  "abilityDescription": "Deals 160% damage to all enemies and heals herself for 20% of damage dealt."
 }
});
export function displayHero(hero){
 if(!hero||getLocale()==='tr')return hero;
 const content=HERO_DISPLAY_EN[hero.id]||{};
 return {...hero,title:content.title||hero.title,description:content.lore||hero.description};
}
export function displayHeroLore(heroId,original){
 return getLocale()==='tr'?original:HERO_DISPLAY_EN[heroId]?.lore||original;
}
export function displayHeroAbility(heroId,original){
 if(!original||getLocale()==='tr')return original;
 const content=HERO_DISPLAY_EN[heroId];
 return content?{...original,name:content.ability,description:content.abilityDescription}:original;
}
export const displayHeroRole=role=>getLocale()==='tr'?({tank:'Koruyucu',mage:'Büyücü',ranger:'Okçu',healer:'Şifacı',fighter:'Savaşçı',assassin:'Suikastçı'})[role]||role:({tank:'Guardian',mage:'Mage',ranger:'Ranger',healer:'Healer',fighter:'Fighter',assassin:'Assassin'})[role]||role;
