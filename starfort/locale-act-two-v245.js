/** v2.45 Second Act language-independent IDs, English fallback presentation. */
import {getLocale} from './locale-v243.js';
import {nativeSecondRegion,nativeSecondOperation,nativeSecondGate} from './locale-act2-v247.js';
export const SECOND_ACT_DISPLAY_EN=Object.freeze({
 "1": {
  "name": "Crimson Horizon",
  "zone": "Crimson Coast",
  "lore": "A scarlet tide rises behind a fading kingdom.",
  "boss": "Crimson Watcher",
  "operations": [
   {
    "id": "1-1",
    "name": "Coastal Beacons",
    "objective": "Stop raiders extinguishing the beacons."
   },
   {
    "id": "1-2",
    "name": "Blood Pier",
    "objective": "Push back the shadow troops landing from the sea."
   },
   {
    "id": "1-3",
    "name": "Crimson Banner",
    "objective": "Defeat the banner captain and open the coast gate."
   }
  ]
 },
 "2": {
  "name": "Glass Desert",
  "zone": "Mirror Dunes",
  "lore": "An ancient army hides beneath shattered glass.",
  "boss": "Glass Oracle",
  "operations": [
   {
    "id": "2-1",
    "name": "Lost Tracks",
    "objective": "Clear the hidden trackers in the desert."
   },
   {
    "id": "2-2",
    "name": "Sandstorm",
    "objective": "Break through the glass-sand defenses."
   },
   {
    "id": "2-3",
    "name": "Prophecy Mirror",
    "objective": "Interrupt the oracle's life-draining ritual."
   }
  ]
 },
 "3": {
  "name": "Meteor Valley",
  "zone": "Meteor Crater",
  "lore": "Star stones have summoned giant sentinels.",
  "boss": "Meteor Giant",
  "operations": [
   {
    "id": "3-1",
    "name": "Cracking Earth",
    "objective": "Breach the crater's outer defenses."
   },
   {
    "id": "3-2",
    "name": "Stone Watch",
    "objective": "Stop the growing stone guardians."
   },
   {
    "id": "3-3",
    "name": "Heart of the Crater",
    "objective": "Defeat the meteor giant in its final stand."
   }
  ]
 },
 "4": {
  "name": "Crown of Thorns",
  "zone": "Demon Thicket",
  "lore": "A circle of judgment lies hidden among the thorns.",
  "boss": "Thorn Queen",
  "operations": [
   {
    "id": "4-1",
    "name": "Black Roots",
    "objective": "Drive thorn hunters from the forest."
   },
   {
    "id": "4-2",
    "name": "Bloody Wreath",
    "objective": "Scatter the queen's encircling troops."
   },
   {
    "id": "4-3",
    "name": "Thorn Throne",
    "objective": "Break the queen's shield and win the final battle."
   }
  ]
 },
 "5": {
  "name": "Blue Ash Mountain",
  "zone": "Ashen Summit",
  "lore": "An ancient forge burns deep inside the mountain.",
  "boss": "Ash Warden",
  "operations": [
   {
    "id": "5-1",
    "name": "Burnt Pass",
    "objective": "Break the fire watch at the mountain pass."
   },
   {
    "id": "5-2",
    "name": "Ember Forge",
    "objective": "Stop the ash mages' ember ritual."
   },
   {
    "id": "5-3",
    "name": "Heart of Ash",
    "objective": "Survive the ancient warden's burning assault."
   }
  ]
 },
 "6": {
  "name": "Endless Night",
  "zone": "Night City",
  "lore": "A walled city has not seen a sunrise for centuries.",
  "boss": "Night High Priest",
  "operations": [
   {
    "id": "6-1",
    "name": "Dark Street",
    "objective": "Stop street hunters and assassins."
   },
   {
    "id": "6-2",
    "name": "Lost Temple",
    "objective": "Reach the temple defended by the high priest."
   },
   {
    "id": "6-3",
    "name": "Final Bell",
    "objective": "Interrupt the night ritual and awaken the city's bell."
   }
  ]
 },
 "7": {
  "name": "Storm Ridge",
  "zone": "Thunder Pass",
  "lore": "One last oathbound tower stands above the clouds.",
  "boss": "Storm Marshal",
  "operations": [
   {
    "id": "7-1",
    "name": "Broken Bridge",
    "objective": "Defend the outpost beneath the storm."
   },
   {
    "id": "7-2",
    "name": "Thunder",
    "objective": "Defeat the marshal's assault forces."
   },
   {
    "id": "7-3",
    "name": "Storm Crown",
    "objective": "Break the lightning marshal's final defenses."
   }
  ]
 },
 "8": {
  "name": "Dawn Abyss",
  "zone": "Star Rift",
  "lore": "Light and void clash again at the end of the second act.",
  "boss": "Void Heir",
  "operations": [
   {
    "id": "8-1",
    "name": "Final Path",
    "objective": "Scatter the abyss's last guardians."
   },
   {
    "id": "8-2",
    "name": "Silent Oath",
    "objective": "Tear away the heir's shadow shield."
   },
   {
    "id": "8-3",
    "name": "New Dawn",
    "objective": "Defeat the Void Heir and protect the star's legacy."
   }
  ]
 }
});
export function displaySecondAct(region){
 if(!region||getLocale()==='tr')return region;
 const localized=SECOND_ACT_DISPLAY_EN[region.id];
 if(!localized)return region;
 const native=nativeSecondRegion(region.id);
 return {...region,...localized,...(native?{name:native.name,zone:native.zone,lore:native.lore,boss:native.boss}:{}),operations:region.operations?.map((op,i)=>({...op,...localized.operations[i],...(native?.operations[op.id]||{})}))||[]};
}
export function displaySecondActOperation(operation){
 if(!operation||getLocale()==='tr')return operation;
 const [region,index]=String(operation.id||'').split('-').map(Number);
 const localized=SECOND_ACT_DISPLAY_EN[region]?.operations[index-1];
 return localized?{...operation,...localized,...(nativeSecondOperation(operation.id)||{})}:operation;
}
export function secondActGateMessage(reason){
 if(getLocale()==='tr')return reason;
 if(reason==='Bilinmeyen ikinci perde bölgesi.')return nativeSecondGate('unknown');
 if(reason==='Önce sekiz ana hikâye bölgesini tamamla.')return nativeSecondGate('mainStory');
 if(reason==='Önce ikinci perdenin önceki bölgesini bitir.')return nativeSecondGate('priorRegion');
 const power=/^Gerekli güç (\d+)\. Kahraman ve ekipmanı geliştir\.$/.exec(reason||'');
 return power?nativeSecondGate('power',{power:power[1]}):reason;
}
