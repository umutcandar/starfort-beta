import * as R from './rules.js';
import {armoryArt} from './armory-art.js';
import {formatNumber} from './locale-v243.js';
import {armoryText as a} from './locale-armory-v246.js';
import {displayItem,displayMaterial,displaySetName} from './locale-items-v246.js';
import {displayHero} from './locale-heroes-v245.js';
import {local,displayResource} from './locale-game-content-v245.js';
const slotName=slot=>a(slot);
const rarityName=rarity=>a(({common:'rarityCommon',epic:'rarityEpic',legendary:'rarityLegendary'})[rarity]||rarity);

/** Pure, data-driven inventory view: previewing gear never mutates the player's save. */
const SET_NAMES={moon:'Ay Siperleri',ember:'Kor Lejyonu',dawn:'Şafak Muhafızları'};
const FILTERS=[['all','Tümü'],['weapon','Silah'],['armor','Zırh'],['relic','Tılsım'],['set','Set'],['forge','Üretim'],['materials','Malzeme'],['owned','Sahip olduklarım']];
const STAT_NAMES={attack:'Saldırı',hp:'Can',armor:'Zırh',healing:'Şifa'};
const MATERIALS=[
  {id:'aether',name:'Yıldız Özü',glyph:'✧',description:'Büyülü ekipmanlar ve özel geliştirmeler için kullanılan kaynak.'},
  {id:'stone',name:'Taş',glyph:'⬟',description:'Kale güçlendirmelerinde ve zırh üretiminde kullanılır.'},
  {id:'wood',name:'Kereste',glyph:'▤',description:'Köy inşaatında ve demirhane gereçlerinde kullanılır.'},
  {id:'gold',name:'Altın',glyph:'✪',description:'Kahramanları ve kaleyi geliştirmek için kullanılan temel para.'},
];
const fmt=n=>formatNumber(Number(n));
const itemImage=item=>armoryArt(item);
const slotItem=(state,heroId,slot)=>R.itemById(state.loadouts?.[heroId]?.[slot]);
const itemCount=(state,item)=>state.inventory?.[item.id]||0;
const usedCount=(state,item)=>Object.values(state.loadouts||{}).filter(slots=>slots?.[item.slot]===item.id).length;
const visibleItems=(state,filter)=>R.ITEMS.filter(item=>{
  if(filter==='materials')return false;
  if(filter==='owned')return itemCount(state,item)>0;
  if(filter==='forge')return !item.exclusive;
  if(filter==='set')return Boolean(item.set);
  if(['weapon','armor','relic'].includes(filter))return item.slot===filter;
  return true;
});
export function previewGearDifference(state,heroId,itemId){
  const item=R.itemById(itemId);
  if(!item||!state.heroes?.[heroId])return null;
  const before=R.equipmentStats(state,heroId);
  const fake={...state,loadouts:{...state.loadouts,[heroId]:{...(state.loadouts?.[heroId]||{}),[item.slot]:item.id}}};
  const after=R.equipmentStats(fake,heroId);
  return Object.fromEntries(Object.keys(STAT_NAMES).map(key=>[key,after[key]-before[key]]));
}

export function armoryMarkup(state,heroId='aldren',filter='all',selectedId=null){
  const hero=R.HEROES.find(h=>h.id===heroId&&state.heroes?.[h.id])||R.HEROES.find(h=>state.heroes?.[h.id]);
  if(!hero)return `<section class="bag-empty"><h2>${local('Henüz kahraman yok','No heroes yet')}</h2></section>`;
  const stats=R.heroStats(state,hero.id),gear=R.equipmentStats(state,hero.id);
  const items=visibleItems(state,filter);
  const material=(filter==='all'||filter==='materials'||filter==='owned')?(MATERIALS.find(m=>selectedId==='material:'+m.id)||(filter==='materials'?MATERIALS[0]:null)):null;
  const selected=material?null:(items.find(item=>item.id===selectedId)||items[0]||null);
  const busy=state.battle?.status==='active';
  const equippedItems=Object.entries(R.SLOTS).map(([slot,label])=>{
    const item=slotItem(state,hero.id,slot);
    const ghost=R.itemById(({weapon:'starbreaker',armor:'ashes_plate',relic:'guardian_seal'})[slot]);
    return `<div class="bag-v212-slot ${item?'filled':'empty'}">
      <small>${slotName(slot)}</small>
      <div class="bag-v212-slot-art">${item?itemImage(item):`<span class="bag-v213-ghost-art" title="${local('Örnek görünüm · kuşanılmadı','Preview · not equipped')}">${itemImage(ghost)}</span>`}</div>
      <strong>${item?displayItem(item).name:a('emptySlot')}</strong>
      ${item?`<button class="text-button" data-unequip="${slot}" ${busy?'disabled':''} >${a('unequip')}</button>`:'<span class="bag-v212-slot-hint">${a('selectItem')}</span>'}
    </div>`;
  }).join('');
  const roster=[...R.HEROES].sort((a,b)=>['aldren','mira','rovan','lyra','doran','vesper','eira'].indexOf(a.id)-['aldren','mira','rovan','lyra','doran','vesper','eira'].indexOf(b.id))
    .map(h=>`<button class="armory-hero ${hero.id===h.id?'active':''} ${state.heroes?.[h.id]?'':'bag-v213-locked'}" data-armory-hero="${h.id}" aria-pressed="${hero.id===h.id}" ${state.heroes?.[h.id]?'':'disabled'} title="${state.heroes?.[h.id]?displayHero(h).title:local('Sefer ilerlemesiyle açılır','Unlocks through expeditions')}">
    <img src="assets/${h.id}.webp" alt="" loading="lazy"><span><b>${h.name}</b><small>${state.heroes?.[h.id]?displayHero(h).title:local('Kilitli · Seferden açılır','Locked · Unlock via expeditions')}</small></span>
  </button>`).join('');
  const cards=items.map(item=>{
    const count=itemCount(state,item),equipped=slotItem(state,hero.id,item.slot)?.id===item.id;
    const mastery=state.itemUpgrades?.[item.id]||0;
    return `<button class="bag-v212-item ${item.rarity} ${count?'owned':'missing'} ${selected?.id===item.id?'selected':''}"
      data-bag-item="${item.id}" aria-label="${displayItem(item).name}, ${rarityName(item.rarity)}, ${count} ${a('unit')}" aria-pressed="${selected?.id===item.id}">
      <span class="bag-v212-item-art">${itemImage(item)}</span>
      <span class="bag-v212-item-name">${displayItem(item).name}</span>
      ${count?`<span class="bag-v212-count">×${count}</span>`:'<span class="bag-v213-lock" title="${local('Henüz kazanılmadı','Not obtained yet')}" aria-hidden="true">⌑</span>'}
      ${mastery?`<span class="bag-v226-mastery">+${mastery} ${a('mastery')}</span>`:''}${equipped?'<span class="bag-v212-worn">${local('Takılı','Equipped')}</span>':''}
    </button>`;
  }).join('');
  const materialCards=(filter==='all'||filter==='materials'||filter==='owned')?MATERIALS.map(item=>`<button class="bag-v212-item bag-v213-material ${material?.id===item.id?'selected':''}" data-bag-item="material:${item.id}" aria-pressed="${material?.id===item.id}" aria-label="${displayMaterial(item).name}, ${fmt(state.res[item.id]||0)} ${a('unit')}">
    <span class="bag-v213-material-glyph material-${item.id}" aria-hidden="true">${item.glyph}</span><span class="bag-v212-item-name">${displayMaterial(item).name}</span><span class="bag-v212-count">×${fmt(state.res[item.id]||0)}</span></button>`).join(''):'';
  let details=`<div class="bag-v212-empty">${a('noItems')} ${local('Diğer filtreleri deneyebilir veya seferden ganimet toplayabilirsin.','Try another filter or collect loot in an expedition.')}</div>`;
  if(selected){
    const count=itemCount(state,selected),free=count-usedCount(state,selected);
    const mastery=state.itemUpgrades?.[selected.id]||0,masteryCost=R.gearMasteryCost(selected,mastery),canMaster=!!(state.serverVillage&&count>0&&masteryCost&&!busy&&Object.entries(masteryCost).every(([k,v])=>(state.res[k]||0)>=v));
    const equipped=slotItem(state,hero.id,selected.slot)?.id===selected.id;
    const canForge=!selected.exclusive&&!busy&&state.buildings.forge>=selected.forge&&count<20&&Object.entries(selected.cost).every(([id,cost])=>(state.res[id]||0)>=cost);
    const difference=previewGearDifference(state,hero.id,selected.id);
    const setWorn=selected.set?Object.values(state.loadouts?.[hero.id]||{}).map(id=>R.itemById(id)).filter(i=>i?.set===selected.set).length:0;
    const costText=Object.entries(selected.cost).map(([id,amount])=>`${fmt(amount)} ${displayResource(id)}`).join(' · ');
    details=`<div class="bag-v212-detail-head">
      <span class="bag-v212-detail-art ${selected.rarity}">${itemImage(selected)}</span>
      <div><small>${rarityName(selected.rarity)} · ${slotName(selected.slot)}</small><h3>${displayItem(selected).name} ${mastery?`<span class="bag-v226-mastery">+${mastery}</span>`:''}</h3><p>${displayItem(selected).description}</p></div>
    </div>
    <div class="bag-v212-stat-grid">${Object.entries(STAT_NAMES).map(([id,label])=>{
      const value=selected.stats[id]||0,delta=difference[id];
      return `<div><span>${a(({attack:"attack",hp:"health",armor:"armor",healing:"healing"})[id])}</span><strong>${value?`+${value}`:'—'}</strong><small class="${delta>0?'positive':delta<0?'negative':''}">${delta>0?'+':''}${delta} ${local('değişim','change')}</small></div>`;
    }).join('')}</div>
    ${selected.set?`<div class="bag-v212-set">✦ ${displaySetName(selected.set,SET_NAMES[selected.set])} · ${setWorn}/2 ${local('parça kuşanıldı','pieces equipped')} <small>${local('İki parça aynı kahramana takıldığında set bonusu açılır.','Equip two pieces on the same hero to unlock a set bonus.')}</small></div>`:''}
    <div class="bag-v212-detail-actions">
      ${equipped?`<button class="primary" data-unequip="${selected.slot}" ${busy?'disabled':''} >${a('unequip')}</button>`:`<button class="primary" data-equip="${selected.id}" ${busy||free<=0?'disabled':''}>${free>0?a('equip'):local('Boşta eşya yok','No spare item available')}</button>`}
      ${!selected.exclusive?`<button class="secondary" data-forge="${selected.id}" ${canForge?'':'disabled'}>${state.buildings.forge<selected.forge?`${a("forge")} ${a("level")} ${selected.forge} ${local("gerekli","required")}`:a("craft")}</button>`:''}
      ${state.serverVillage&&count>0?`<button class="secondary" data-account-enhance="${selected.id}" ${canMaster?'':'disabled'}>${mastery>=5?local("✦ +5 Tamamlandı","✦ +5 Completed"):`✧ ${a("mastery")} +${mastery+1}`}</button>`:''}
    </div>
    ${state.serverVillage&&count>0?`<p class="bag-v226-upgrade-note">${local('Eşya ustalığı','Gear mastery')}: ${mastery}/5 · ${local('Bir eşya türünün tüm kopyalarını kalıcı güçlendirir.','Permanently strengthens all owned copies of this gear type.')} ${masteryCost?`${local('Sıradaki maliyet','Next cost')}: ${Object.entries(masteryCost).map(([k,v])=>fmt(v)+' '+displayResource(k)).join(' · ')}`:local('Maksimum ustalık.','Maximum mastery.')}</p>`:''}
    <p class="bag-v212-origin">${selected.exclusive?local('Özel sefer ganimeti. Demirhanede üretilemez.','Special expedition loot. Cannot be crafted.'):`${local('Üretim maliyeti','Crafting cost')}: ${costText}`} · ${local('Çantada','Owned')}: ${count} · ${local('Boşta','Spare')}: ${Math.max(0,free)}</p>`;
  }
  if(material)details=`<div class="bag-v212-detail-head"><span class="bag-v212-detail-art bag-v213-material-glyph material-${material.id}" aria-hidden="true">${material.glyph}</span><div><small>${local('KAYNAK · ÇANTA','RESOURCE · INVENTORY')}</small><h3>${displayMaterial(material).name}</h3><p>${displayMaterial(material).description}</p></div></div>
    <div class="bag-v213-material-total"><small>${local('Mevcut miktar','Available quantity')}</small><strong>${fmt(state.res[material.id]||0)}</strong></div>
    <p class="bag-v212-origin">${local('Bu kaynak köy üretimi, sefer zaferleri ve görev ödülleriyle kazanılır. Kaynakların mevcut oyun kayıtlarına bağlıdır.','Resources come from village production, expeditions and objectives, and always reflect your authoritative save.')}</p>`;
  return `<header class="bag-v212-header"><div><span class="eyebrow">${local('YILDIZ KALESİ · KAHRAMAN TEÇHİZATI','STAR KEEP · HERO EQUIPMENT')}</span><h2>${a('title')}</h2><p>${a('intro')}</p></div><button class="secondary" data-close-view >${a('back')}</button></header>
    <div class="armory-v212">
      <aside class="bag-v212-roster"><h3>${a('heroes')}</h3><div class="armory-heroes" aria-label="${local('Ekipman kahramanı','Equipment hero')}">${roster}</div></aside>
      <section class="bag-v212-character bag-hero-display">
        <div class="bag-v212-character-art"><img src="assets/${hero.id}.webp" alt="${hero.name}, ${displayHero(hero).title}"></div>
        <div class="bag-v212-character-name"><span class="eyebrow">${a('activeHero')}</span><h3>${hero.name}</h3><small>${displayHero(hero).title} · ${a('level')} ${state.heroes[hero.id].level}</small></div>
        <div class="bag-v212-character-stats">
          <div><span>⚔ ${a('attack')}</span><b>${fmt(stats.attack)}</b></div>
          <div><span>♡ ${a('health')}</span><b>${fmt(stats.maxHp)}</b></div>
          <div><span>⛨ ${a('armor')}</span><b>%${fmt(gear.armor)}</b></div>
          <div><span>✦ ${a('healing')}</span><b>+${fmt(gear.healing)}</b></div>
          <div class="bag-v213-power"><span>⚔ ${a('power')}</span><b>${fmt(Math.round(stats.attack*2+stats.maxHp*.35+gear.armor*2+gear.healing))}</b></div>
        </div>
      </section>
      <div class="bag-v212-right">
        <section class="bag-v212-equipped"><div class="bag-v212-section-heading"><span class="eyebrow">${local('AKTİF KAHRAMANIN DONANIMI','ACTIVE HERO EQUIPMENT')}</span><strong>${hero.name}</strong></div><div class="bag-v212-slots">${equippedItems}</div>
          <div class="bag-v212-detail-actions"><button class="secondary" data-auto-equip="${hero.id}" ${busy?'disabled':''} title="${local('Boştaki veya bu kahramana ait ekipmanlardan rolüne uygun en güçlü dizilimi seçer; diğer kahramanların ekipmanlarını değiştirmez.','Chooses the strongest role-appropriate free or currently worn equipment without affecting other heroes.')}">✦ ${a('autoEquip')}</button></div></section>
        <div class="bag-toolbar"><h3>${a('inventory')} <small>${R.ITEMS.filter(item=>itemCount(state,item)>0).length}/${R.ITEMS.length} ${local('ekipman türü','equipment types')}</small></h3><div class="bag-filters" aria-label="${local('Çanta filtreleri','Inventory filters')}">${FILTERS.map(([id,name])=>`<button data-bag-slot="${id}" aria-pressed="${filter===id}" class="${filter===id?'selected':''}">${a(({all:"all",weapon:"weapon",armor:"armor",relic:"relic",set:"set",forge:"forge",materials:"materials",owned:"owned"})[id])}</button>`).join('')}</div></div>
        <div class="item-grid bag-item-grid" aria-label="${local('Çanta eşyaları','Inventory items')}">${cards+materialCards||`<p class="bag-v212-empty">${a('noItems')}</p>`}</div>
        <p class="armory-tip">${busy?local('Savaş sürerken ekipman değiştirilemez. ','Equipment cannot be changed during battle. '):''}${local('Bir eşya iki kahramana takılamaz. Set bonusu ve seçili ekipman karşılaştırmaları sağ panelde görünür.','One copy cannot be equipped by two heroes. Set bonuses and comparison details appear in the side panel.')}</p>
      </div>
      <section class="bag-v212-detail" aria-label="${a('selectedDetails')}">${details}</section>
    </div>`;
}
