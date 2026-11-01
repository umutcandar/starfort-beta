import {seasonEvent} from './season-campaign.js';
export const SLOTS = { weapon: 'Silah', armor: 'Zırh', relic: 'Tılsım' };
export const RARITIES = { common: 'Nadir', epic: 'Destansı', legendary: 'Efsanevi' };
export const ITEMS = [
  { id:'iron_sword', name:'Yemin Kılıcı', slot:'weapon', rarity:'common', forge:1, stats:{attack:4}, cost:{gold:90,wood:25}, description:'Hisarın ilk muhafızlarına verilen dengeli çelik kılıç.' },
  { id:'ward_mail', name:'Muhafız Zırhı', slot:'armor', rarity:'common', forge:1, stats:{hp:30,armor:3}, cost:{gold:110,stone:35}, description:'Hafif levhaları darbeleri karşılar; taşıyanı savaşta tutar.' },
  { id:'lunar_charm', set:'moon', name:'Ay Mührü', slot:'relic', rarity:'common', forge:1, stats:{healing:6,hp:8}, cost:{gold:100,aether:15}, description:'İyileştirme yeteneği olan kahramanların verdiği şifayı güçlendirir.' },
  { id:'ember_blade', set:'ember', name:'Kor Kılıcı', slot:'weapon', rarity:'epic', forge:2, stats:{attack:10}, cost:{gold:260,aether:30}, description:'Demirhanenin yıldız ateşinde dövülmüş keskin bir silah.' },
  { id:'warden_plate', name:'Hisar Levhası', slot:'armor', rarity:'epic', forge:2, stats:{hp:65,armor:7}, cost:{gold:280,stone:100}, description:'Ön saftaki muhafızlar için ağır ve dayanıklı koruma.' },
  { id:'star_lens', name:'Yıldız Merceği', slot:'relic', rarity:'epic', forge:2, stats:{attack:5,healing:8}, cost:{gold:230,aether:45}, description:'Yıldız ışığını hem saldırıya hem iyileştirmeye yönlendirir.' },
  { id:'royal_blade', set:'dawn', name:'Şafak Yaran', slot:'weapon', rarity:'legendary', forge:4, stats:{attack:17}, cost:{gold:650,aether:80}, description:'Krallığın kayıp ustalarının imzasını taşıyan bir şaheser.' },
  { id:'aegis', name:'Son Siper', slot:'armor', rarity:'legendary', forge:4, stats:{hp:110,armor:12}, cost:{gold:700,stone:220}, description:'Hisarın en güçlü savunma zırhı; gelen hasarı azaltır.' },
  { id:'moonheart', name:'Ayın Kalbi', slot:'relic', rarity:'legendary', forge:4, stats:{healing:14,hp:35}, cost:{gold:650,aether:100}, description:'Şifacıların taşıdığı kadim kristal, can ve iyileştirme sağlar.' },
  // Additional story drops unlock at chapters five and seven. Cannot be forged.
  { id:'grave_seal', exclusive:true, name:'Mahzen Ruh Mührü', slot:'relic', rarity:'epic', forge:0, stats:{hp:26,healing:8}, cost:{}, description:'Sessiz Mahzen katından çıkan koruyucu ruh mührü.' },
  { id:'eclipse_edge', exclusive:true, name:'Tutulma Kılıcı', slot:'weapon', rarity:'legendary', forge:0, stats:{attack:15}, cost:{}, description:'Tutulma Kulesi muhafızlarından kalan mühürlü kılıç.' },
  // Unique PvE achievements: first five DIFFERENT 3-star chapter wins.
  { id:'moon_watch', set:'moon', exclusive:true, name:'Ay Siperi', slot:'armor', rarity:'epic', forge:0, stats:{hp:45,armor:6}, cost:{}, description:'İlk kusursuz sefer mührünün kalıcı ödülü. Ay Siperleri setinin parçası.' },
  { id:'ember_guard', set:'ember', exclusive:true, name:'Kor Lejyonu Zırhı', slot:'armor', rarity:'epic', forge:0, stats:{hp:50,armor:5}, cost:{}, description:'İkinci üç yıldız zaferine özel muhafız zırhı.' },
  { id:'dawn_relic', set:'dawn', exclusive:true, name:'Şafak Yemini', slot:'relic', rarity:'legendary', forge:0, stats:{hp:20,healing:7}, cost:{}, description:'Üçüncü üç yıldız zaferine özel şafak tılsımı.' },
  { id:'star_spear', set:'moon', exclusive:true, name:'Ayışığı Mızrağı', slot:'weapon', rarity:'legendary', forge:0, stats:{attack:11}, cost:{}, description:'Dördüncü üç yıldız zaferine özel ay silahı.' },
  { id:'dawn_guard', set:'dawn', exclusive:true, name:'Şafak Muhafızı Levhası', slot:'armor', rarity:'legendary', forge:0, stats:{hp:70,armor:6}, cost:{}, description:'Beşinci üç yıldız zaferine özel kraliyet zırhı.' },
];
// Visual-reference signature equipment: real forgeable gear, using the existing combat stats.
const REFERENCE_ITEMS = [
  {id:'starbreaker',name:'Yıldızkıran Kılıç',slot:'weapon',rarity:'legendary',set:'dawn',forge:6,
    stats:{attack:28},cost:{gold:1450,aether:220},description:'Yıldız Muhafızı ustalarının ışıkla işlediği kılıç.'},
  {id:'ashes_plate',name:'Küllerin Zırhı',slot:'armor',rarity:'legendary',set:'ember',forge:5,
    stats:{hp:150,armor:14},cost:{gold:1250,stone:390},description:'Alevin sınavından geçmiş mavi çelik zırh.'},
  {id:'guardian_seal',name:'Koruyucu Mühür',slot:'relic',rarity:'legendary',set:'dawn',forge:5,
    stats:{healing:17,hp:35},cost:{gold:1100,aether:185},description:'Kadim yıldızın nöbet yeminiyle güçlenen tılsım.'},
];
// Keep old item IDs and the starting inventory intact so historic saves load.
ITEMS.push(...REFERENCE_ITEMS);
export const FIRST_CLEAR_LOOT = { 1:'lunar_charm', 2:'ember_blade', 3:'warden_plate', 4:'star_lens',5:'grave_seal', 6:'royal_blade',7:'eclipse_edge', 8:'moonheart' };
const fail=error=>({ok:false,error});
export const itemById=id=>ITEMS.find(item=>item.id===id);
export function createGearState() { return {inventory:{iron_sword:1,ward_mail:1},loadouts:{}}; }
export function restoreGear(state,saved) {
  if(saved.inventory && typeof saved.inventory==='object' && !Array.isArray(saved.inventory)) {
    state.inventory={};
    for(const item of ITEMS) { const count=saved.inventory[item.id]; if(Number.isInteger(count)&&count>0) state.inventory[item.id]=Math.min(20,count); }
  } else {
    // Older saves already earned these chapter rewards before equipment existed.
    for(const stageId of state.cleared) awardFirstClearItem(state,stageId);
  }
  state.loadouts={};
  const used={};
  for(const heroId of Object.keys(state.heroes)) for(const slot of Object.keys(SLOTS)) {
    const id=saved.loadouts?.[heroId]?.[slot], item=itemById(id);
    if(!item || item.slot!==slot || (used[id]||0)>=(state.inventory[id]||0)) continue;
    (state.loadouts[heroId] ||= {})[slot]=id; used[id]=(used[id]||0)+1;
  }
}
export function equipmentStats(state,heroId) {
  const stats={attack:0,hp:0,armor:0,healing:0}, sets={};
  for(const id of Object.values(state.loadouts?.[heroId]||{})) {
    const item=itemById(id);
    if(item){
      for(const [key,value] of Object.entries(item.stats)) stats[key]+=value;
      if(item.set)sets[item.set]=(sets[item.set]||0)+1;
    }
  }
  // At least two pieces from the same set must be worn by ONE hero.
  if(sets.moon>=2){stats.hp+=25;stats.armor+=2;}
  if(sets.ember>=2){stats.attack+=4;stats.armor+=2;}
  if(sets.dawn>=2){stats.attack+=3;stats.healing+=3;}
  stats.armor=Math.min(35,stats.armor); return stats;
}
export function forgeItem(state,id) {
  const item=itemById(id);
  if(!item) return fail('Bilinmeyen ekipman.');
  if(item.exclusive) return fail('Bu ekipman yalnızca sefer ganimetidir, üretilemez.');
  if(state.battle?.status==='active') return fail('Önce devam eden savaşı tamamla.');
  if(state.buildings.forge<item.forge) return fail(`Demirhane seviyesi ${item.forge} gerekli.`);
  if((state.inventory[id]||0)>=20) return fail('Bu ekipmandan en fazla 20 adet tutulabilir.');
  if(Object.entries(item.cost).some(([key,value])=>state.res[key]<value)) return fail('Yeterli kaynak yok.');
  for(const [key,value] of Object.entries(item.cost)) state.res[key]-=value;
  state.inventory[id]=(state.inventory[id]||0)+1;
  return {ok:true};
}
export function equipItem(state,heroId,id) {
  const item=itemById(id);
  if(!item || !state.heroes[heroId]) return fail('Kahraman veya ekipman bulunamadı.');
  if(state.battle?.status==='active') return fail('Savaş sırasında ekipman değiştirilemez.');
  if(state.loadouts[heroId]?.[item.slot]===id) return {ok:true};
  const used=Object.entries(state.loadouts).filter(([hero,slots])=>hero!==heroId && slots[item.slot]===id).length;
  if(used>=(state.inventory[id]||0)) return fail('Boşta ekipman yok. Diğer kahramandan çıkarabilir veya bir tane üretebilirsin.');
  (state.loadouts[heroId] ||= {})[item.slot]=id;
  return {ok:true};
}
export function unequipItem(state,heroId,slot) {
  if(!state.heroes[heroId] || !SLOTS[slot]) return fail('Geçersiz ekipman konumu.');
  if(state.battle?.status==='active') return fail('Savaş sırasında ekipman değiştirilemez.');
  if(state.loadouts[heroId]) delete state.loadouts[heroId][slot];
  return {ok:true};
}
// Evaluate every available weapon/armor/relic combination, including the exact two-piece
// set bonuses. Only spare copies or this hero's own gear are eligible.
const ROLE_GEAR_WEIGHTS=Object.freeze({
  tank:{attack:1.3,hp:.16,armor:5,healing:.3},
  healer:{attack:1,hp:.12,armor:2,healing:4.5},
  mage:{attack:3,hp:.09,armor:2,healing:1.1},
  ranger:{attack:3.1,hp:.1,armor:2,healing:.3},
  fighter:{attack:2.7,hp:.15,armor:2.8,healing:.4},
  assassin:{attack:3.3,hp:.08,armor:1.8,healing:.2},
});
export function optimizeHeroEquipment(state,heroId,role) {
  if(!state.heroes?.[heroId] || !ROLE_GEAR_WEIGHTS[role]) return fail('Kahraman veya rol bulunamadı.');
  if(state.battle?.status==='active') return fail('Savaş sırasında ekipman değiştirilemez.');
  const occupied={};
  for(const [wearer,slots] of Object.entries(state.loadouts||{})) {
    if(wearer===heroId)continue;
    for(const id of Object.values(slots||{}))occupied[id]=(occupied[id]||0)+1;
  }
  const options=Object.keys(SLOTS).map(slot=>[
    null,...ITEMS.filter(item=>item.slot===slot && (state.inventory?.[item.id]||0)>(occupied[item.id]||0))
  ]);
  const current={...(state.loadouts?.[heroId]||{})};
  const score=loadout=>{
    const stats=equipmentStats({loadouts:{[heroId]:loadout}},heroId);
    return Object.entries(ROLE_GEAR_WEIGHTS[role]).reduce((total,[stat,weight])=>total+stats[stat]*weight,0);
  };
  let best=current,bestScore=score(current);
  for(const weapon of options[0])for(const armor of options[1])for(const relic of options[2]){
    const candidate={};
    if(weapon)candidate.weapon=weapon.id;
    if(armor)candidate.armor=armor.id;
    if(relic)candidate.relic=relic.id;
    const value=score(candidate);
    // Existing equipment wins ties, so clicking twice never reorders equivalent items.
    if(value>bestScore+1e-6){best=candidate;bestScore=value;}
  }
  const changed=Object.keys(SLOTS).some(slot=>(current[slot]||null)!==(best[slot]||null));
  if(changed)state.loadouts[heroId]=best;
  return {ok:true,changed,loadout:{...best}};
}

export function awardFirstClearItem(state,stageId) {
  const id=FIRST_CLEAR_LOOT[stageId];
  if(!id || (state.inventory[id]||0)>=20) return null;
  state.inventory[id]=(state.inventory[id]||0)+1;
  return itemById(id);
}
