/** STARFORT v2.45 display-only world glossary; canonical IDs and server data stay untouched.
 * Untranslated non-Turkish content deliberately falls back to English.
 */
import {getLocale} from './locale-v243.js';
export const BUILDING_DISPLAY_EN=Object.freeze({
 "keep": {
  "name": "Star Keep",
  "description": "Increases production and the maximum level of other buildings."
 },
 "farm": {
  "name": "Harvest Courtyard",
  "description": "Generates gold from the valley's harvest."
 },
 "lumber": {
  "name": "Blackwood Lumberyard",
  "description": "Produces timber for fortress construction."
 },
 "quarry": {
  "name": "Moonstone Quarry",
  "description": "Extracts stone for your stronghold."
 },
 "forge": {
  "name": "Ember Forge",
  "description": "Each upgrade increases party attack by 5%. New equipment unlocks at levels 2 and 4."
 },
 "tavern": {
  "name": "Oathbound Tavern",
  "description": "Each upgrade raises hero health by 4%."
 },
 "observatory": {
  "name": "Star Observatory",
  "description": "Collects Star essence from the night sky."
 }
});
export const STAGE_DISPLAY_EN=Object.freeze({
 "1": {
  "name": "Ashen Pass",
  "description": "Defend the fortress against the first raiders."
 },
 "2": {
  "name": "Broken Chapel",
  "description": "Rescue Mira from the shadow siege."
 },
 "3": {
  "name": "Blackwood Forest",
  "description": "Defeat the hunters blocking the starlit path."
 },
 "4": {
  "name": "Iron Gate",
  "description": "Reach Doran before his final stand."
 },
 "5": {
  "name": "Silent Crypt",
  "description": "Stop the march of the risen dead."
 },
 "6": {
  "name": "Frost Ramparts",
  "description": "Reach the frozen northern fortress."
 },
 "7": {
  "name": "Eclipse Tower",
  "description": "Defeat the guardians fueling the eclipse."
 },
 "8": {
  "name": "Starless Throne",
  "description": "Break the last oath at the heart of darkness."
 }
});
export const OPERATION_DISPLAY_EN=Object.freeze({
 "1-1": {
  "title": "Dimming Beacons",
  "objective": "Protect the beacons and stop the first raid."
 },
 "1-2": {
  "title": "Supply Road",
  "objective": "Lead the supply convoy out of the siege."
 },
 "1-3": {
  "title": "Ashen Commander",
  "objective": "Defeat the enemy commander at the final barricade."
 },
 "2-1": {
  "title": "Crypt Gate",
  "objective": "Defeat the shadow guards at the chapel entrance."
 },
 "2-2": {
  "title": "Hall of the Wounded",
  "objective": "Secure the corridor leading to Mira."
 },
 "2-3": {
  "title": "Broken Bell Ritual",
  "objective": "Disrupt the ritual and rescue Mira."
 },
 "3-1": {
  "title": "Thorn Path",
  "objective": "Open the border path held by trackers."
 },
 "3-2": {
  "title": "Lost Scouts",
  "objective": "Rescue the search party hunting for a star fragment."
 },
 "3-3": {
  "title": "Lord of Roots",
  "objective": "Hold the final position against the ancient forest warden."
 },
 "4-1": {
  "title": "Fallen Bastion",
  "objective": "Push back the enemies along Doran's ramparts."
 },
 "4-2": {
  "title": "Steel Bridge",
  "objective": "Cut off reinforcements from the iron legion."
 },
 "4-3": {
  "title": "Executioner's Anvil",
  "objective": "Break the Iron Executioner's three-phase siege."
 },
 "5-1": {
  "title": "Sealed Staircase",
  "objective": "Stop the sentries inside the crypt."
 },
 "5-2": {
  "title": "Awakening Tombs",
  "objective": "Clear the ranks before the dark ritual ends."
 },
 "5-3": {
  "title": "Core Watch",
  "objective": "Defeat the guardian protecting the star core."
 },
 "6-1": {
  "title": "Snow Pass",
  "objective": "Cross the frost legion's watch line."
 },
 "6-2": {
  "title": "Frozen Guards",
  "objective": "Stop the sentries at the icy wall."
 },
 "6-3": {
  "title": "Frost Commander",
  "objective": "Survive the commander's final stand."
 },
 "7-1": {
  "title": "Fading Mirrors",
  "objective": "Disable the eclipse energy mirrors."
 },
 "7-2": {
  "title": "Tower Stairs",
  "objective": "Clear the mages' final defenses."
 },
 "7-3": {
  "title": "Eclipse Core",
  "objective": "Defeat the tower core's guardians."
 },
 "8-1": {
  "title": "Starless Gate",
  "objective": "Defeat the guards at the final gate."
 },
 "8-2": {
  "title": "Silent Wardens",
  "objective": "Break the old oathkeepers' defenses."
 },
 "8-3": {
  "title": "Void Throne",
  "objective": "Stop the sovereign's three-phase last stand."
 }
});
export const REALM_DISPLAY_EN=Object.freeze({
 "1": {
  "zone": "Ash Border",
  "lore": "Passes of the ash raiders"
 },
 "2": {
  "zone": "Broken Faith",
  "lore": "Forgotten chapel ruins"
 },
 "3": {
  "zone": "Blackwood",
  "lore": "Paths hidden by shadow"
 },
 "4": {
  "zone": "Iron Frontier",
  "lore": "Sealed northern gates"
 },
 "5": {
  "zone": "Crypts",
  "lore": "Sleep of lost souls"
 },
 "6": {
  "zone": "Frost Ramparts",
  "lore": "The eternal northern winter"
 },
 "7": {
  "zone": "Eclipse",
  "lore": "The shattered star tower"
 },
 "8": {
  "zone": "Starless Throne",
  "lore": "The final oath, the final battle"
 }
});
const international=()=>getLocale()!=='tr';
export const local=(tr,en)=>international()?en:tr;
export function displayBuilding(building){
 if(!building||!international())return building;
 return {...building,...(BUILDING_DISPLAY_EN[building.id]||{})};
}
export function displayStage(stage){
 if(!stage||!international())return stage;
 return {...stage,...(STAGE_DISPLAY_EN[stage.id]||{})};
}
export function displayOperation(operation){
 if(!operation||!international())return operation;
 return {...operation,...(OPERATION_DISPLAY_EN[operation.id]||{})};
}
export function displayRealm(realm){
 if(!realm||!international())return realm;
 return {...realm,...(REALM_DISPLAY_EN[realm.chapter]||{})};
}
export const displayResource=id=>local(({gold:'Altın',wood:'Kereste',stone:'Taş',aether:'Yıldız özü'})[id]||id,({gold:'Gold',wood:'Timber',stone:'Stone',aether:'Star essence'})[id]||id);

/** Translate only presentation units, never their underlying economic values. */
export function displayBuildingUnit(unit){
 if(!international()||typeof unit!=='string')return unit;
 const fixed={'% köy üretim bonusu':'% village production bonus','% takım saldırısı':'% party attack','% takım canı':'% party health'};
 if(fixed[unit])return fixed[unit];
 const match=/^(Altın|Kereste|Taş|Yıldız özü) \/ dk$/.exec(unit);
 return match?displayResource(({Altın:'gold',Kereste:'wood',Taş:'stone','Yıldız özü':'aether'})[match[1]])+' / min':unit;
}
