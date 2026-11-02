/** Exact online combat-power projection for the authenticated Postgres mission_start RPC.
 * Never awards currency or validates a battle; used for honest unlock labels. */
import {HEROES} from './rules.js';
const powerByItem=Object.freeze({
 iron_sword:8,ward_mail:15,lunar_charm:12,ember_blade:20,warden_plate:33,star_lens:18,
 royal_blade:34,aegis:50,moonheart:30,starbreaker:56,ashes_plate:67,guardian_seal:38,
 grave_seal:18,eclipse_edge:30,moon_watch:23,ember_guard:25,dawn_relic:15,star_spear:22,dawn_guard:34
});
const sets=Object.freeze([
 {pieces:['lunar_charm','moon_watch','star_spear'],power:18},
 {pieces:['ember_blade','ember_guard','ashes_plate'],power:18},
 {pieces:['royal_blade','dawn_relic','dawn_guard','starbreaker','guardian_seal'],power:16}
]);
export function officialServerTeamPower(view,account){
 if(!view||!account||!Array.isArray(account.team)||account.team.length!==3)return 0;
 const forge=Number(view.buildings?.forge),tavern=Number(view.buildings?.tavern);
 if(!Number.isInteger(forge)||forge<1||!Number.isInteger(tavern)||tavern<1)return 0;
 let power=0;
 for(const id of account.team){
  const hero=HEROES.find(h=>h.id===id),level=Number(account.heroes?.[id]);
  if(!hero||!Number.isInteger(level)||level<1||level>20)return 0;
  power+=2*Math.round(hero.attack*(1+(level-1)*.15)*(1+(forge-1)*.05));
  power+=.35*Math.round(hero.hp*(1+(level-1)*.12)*(1+(tavern-1)*.04));
  const gear=account.loadouts?.[id]||{},pieces=['weapon','armor','relic'].map(slot=>gear[slot]).filter(Boolean);
  for(const item of pieces){
   power+=(powerByItem[item]||0)+Number(account.itemUpgrades?.[item]||0)*9;
  }
  for(const set of sets)if(pieces.filter(id=>set.pieces.includes(id)).length>=2)power+=set.power;
 }
 return Math.round(power*100)/100;
}
