/** Item appearance only. IDs, upgrade costs, combat stats and ownership remain authoritative. */
import {getLocale} from './locale-v243.js';
import {localizedItemName,localizedSetName} from './locale-item-names-v247.js';
import {nativeItemDescription} from './locale-item-lore-v247.js';
import {worldResource} from './locale-world-v247.js';
export const ITEM_DISPLAY_EN=Object.freeze({
 "iron_sword": {
  "name": "Oath Sword",
  "description": "A balanced steel sword given to the stronghold's first guardians."
 },
 "ward_mail": {
  "name": "Warden Mail",
  "description": "Light plates absorb blows and keep the wearer standing."
 },
 "lunar_charm": {
  "name": "Moon Seal",
  "description": "Strengthens the healing granted by heroes with restorative abilities."
 },
 "ember_blade": {
  "name": "Ember Blade",
  "description": "A keen weapon forged in the starfire of the smithy."
 },
 "warden_plate": {
  "name": "Fortress Plate",
  "description": "Heavy, reliable protection for frontline guardians."
 },
 "star_lens": {
  "name": "Star Lens",
  "description": "Focuses starlight toward both attack and healing."
 },
 "royal_blade": {
  "name": "Dawnbreaker",
  "description": "A masterpiece bearing the mark of the kingdom's lost artisans."
 },
 "aegis": {
  "name": "Last Bastion",
  "description": "The fortress's finest defensive armor, reducing incoming damage."
 },
 "moonheart": {
  "name": "Heart of the Moon",
  "description": "An ancient crystal that strengthens a healer's life and healing."
 },
 "grave_seal": {
  "name": "Crypt Spirit Seal",
  "description": "A protective spirit seal recovered from the Silent Crypt."
 },
 "eclipse_edge": {
  "name": "Eclipse Sword",
  "description": "A sealed sword left by the guardians of the Eclipse Tower."
 },
 "moon_watch": {
  "name": "Moon Ward",
  "description": "A permanent reward from the first flawless expedition; part of the Moon Ward set."
 },
 "ember_guard": {
  "name": "Ember Legion Armor",
  "description": "Guardian armor awarded for the second three-star victory."
 },
 "dawn_relic": {
  "name": "Dawn Oath",
  "description": "A dawn talisman awarded for the third three-star victory."
 },
 "star_spear": {
  "name": "Moonlight Spear",
  "description": "A moonlit weapon awarded for the fourth three-star victory."
 },
 "dawn_guard": {
  "name": "Dawn Warden Plate",
  "description": "Royal armor awarded for the fifth three-star victory."
 },
 "starbreaker": {
  "name": "Starbreaker Sword",
  "description": "A blade wrought with light by the masters of the Star Wardens."
 },
 "ashes_plate": {
  "name": "Armor of Ashes",
  "description": "Blue steel armor tempered through trials of flame."
 },
 "guardian_seal": {
  "name": "Guardian Seal",
  "description": "A talisman strengthened by the ancient star's oath of vigilance."
 }
});
export const SET_DISPLAY_EN=Object.freeze({moon:'Moon Wardens',ember:'Ember Legion',dawn:'Dawn Guardians'});
export const MATERIAL_DISPLAY_EN=Object.freeze({
 aether:{name:'Star essence',description:'A resource used to craft magical equipment and special upgrades.'},
 stone:{name:'Stone',description:'Used to strengthen the keep and craft armor.'},
 wood:{name:'Timber',description:'Used for village buildings and forge supplies.'},
 gold:{name:'Gold',description:'The primary currency for training heroes and upgrading buildings.'}
});
export function displayItem(item){
 if(!item||getLocale()==='tr')return item;
 const translated=ITEM_DISPLAY_EN[item.id];
 return translated?{...item,...translated,name:localizedItemName(item.id)||translated.name,description:nativeItemDescription(item.id)||translated.description}:item;
}
export function displayMaterial(item){
 if(!item||getLocale()==='tr')return item;
 const translated=MATERIAL_DISPLAY_EN[item.id];
 return translated?{...item,...translated,name:worldResource(item.id)||translated.name}:item;
}
export const displaySetName=(id,tr)=>getLocale()==='tr'?tr:localizedSetName(id)||SET_DISPLAY_EN[id]||tr;
