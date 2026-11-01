import * as R from './rules.js';
import {armoryArt} from './armory-art.js';

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
const fmt=n=>new Intl.NumberFormat('tr-TR').format(n);
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
  if(!hero)return '<section class="bag-empty"><h2>Henüz kahraman yok</h2></section>';
  const stats=R.heroStats(state,hero.id),gear=R.equipmentStats(state,hero.id);
  const items=visibleItems(state,filter);
  const material=(filter==='all'||filter==='materials'||filter==='owned')?(MATERIALS.find(m=>selectedId==='material:'+m.id)||(filter==='materials'?MATERIALS[0]:null)):null;
  const selected=material?null:(items.find(item=>item.id===selectedId)||items[0]||null);
  const busy=state.battle?.status==='active';
  const equippedItems=Object.entries(R.SLOTS).map(([slot,label])=>{
    const item=slotItem(state,hero.id,slot);
    return `<div class="bag-v212-slot ${item?'filled':'empty'}">
      <small>${label}</small>
      <div class="bag-v212-slot-art">${item?itemImage(item):'<span class="bag-v212-empty-mark">＋</span>'}</div>
      <strong>${item?item.name:'Boş slot'}</strong>
      ${item?`<button class="text-button" data-unequip="${slot}" ${busy?'disabled':''}>Çıkar</button>`:'<span class="bag-v212-slot-hint">Eşya seç</span>'}
    </div>`;
  }).join('');
  const roster=[...R.HEROES].sort((a,b)=>['aldren','mira','rovan','lyra','doran','vesper','eira'].indexOf(a.id)-['aldren','mira','rovan','lyra','doran','vesper','eira'].indexOf(b.id))
    .map(h=>`<button class="armory-hero ${hero.id===h.id?'active':''} ${state.heroes?.[h.id]?'':'bag-v213-locked'}" data-armory-hero="${h.id}" aria-pressed="${hero.id===h.id}" ${state.heroes?.[h.id]?'':'disabled'} title="${state.heroes?.[h.id]?h.title:'Sefer ilerlemesiyle açılır'}">
    <img src="assets/${h.id}.webp" alt="" loading="lazy"><span><b>${h.name}</b><small>${state.heroes?.[h.id]?h.title:'Kilitli · Seferden açılır'}</small></span>
  </button>`).join('');
  const cards=items.map(item=>{
    const count=itemCount(state,item),equipped=slotItem(state,hero.id,item.slot)?.id===item.id;
    return `<button class="bag-v212-item ${item.rarity} ${count?'owned':'missing'} ${selected?.id===item.id?'selected':''}"
      data-bag-item="${item.id}" aria-label="${item.name}, ${R.RARITIES[item.rarity]}, ${count} adet" aria-pressed="${selected?.id===item.id}">
      <span class="bag-v212-item-art">${itemImage(item)}</span>
      <span class="bag-v212-item-name">${item.name}</span>
      ${count?`<span class="bag-v212-count">×${count}</span>`:'<span class="bag-v213-lock" title="Henüz kazanılmadı" aria-hidden="true">⌑</span>'}
      ${equipped?'<span class="bag-v212-worn">Takılı</span>':''}
    </button>`;
  }).join('');
  const materialCards=(filter==='all'||filter==='materials'||filter==='owned')?MATERIALS.map(item=>`<button class="bag-v212-item bag-v213-material ${material?.id===item.id?'selected':''}" data-bag-item="material:${item.id}" aria-pressed="${material?.id===item.id}" aria-label="${item.name}, ${fmt(state.res[item.id]||0)} adet">
    <span class="bag-v213-material-glyph material-${item.id}" aria-hidden="true">${item.glyph}</span><span class="bag-v212-item-name">${item.name}</span><span class="bag-v212-count">×${fmt(state.res[item.id]||0)}</span></button>`).join(''):'';
  let details='<div class="bag-v212-empty">Bu filtrede eşya bulunamadı. Diğer filtreleri deneyebilir veya seferden ganimet toplayabilirsin.</div>';
  if(selected){
    const count=itemCount(state,selected),free=count-usedCount(state,selected);
    const equipped=slotItem(state,hero.id,selected.slot)?.id===selected.id;
    const canForge=!selected.exclusive&&!busy&&state.buildings.forge>=selected.forge&&count<20&&Object.entries(selected.cost).every(([id,cost])=>(state.res[id]||0)>=cost);
    const difference=previewGearDifference(state,hero.id,selected.id);
    const setWorn=selected.set?Object.values(state.loadouts?.[hero.id]||{}).map(id=>R.itemById(id)).filter(i=>i?.set===selected.set).length:0;
    const costText=Object.entries(selected.cost).map(([id,amount])=>`${fmt(amount)} ${({gold:'Altın',wood:'Kereste',stone:'Taş',aether:'Yıldız özü'})[id]}`).join(' · ');
    details=`<div class="bag-v212-detail-head">
      <span class="bag-v212-detail-art ${selected.rarity}">${itemImage(selected)}</span>
      <div><small>${R.RARITIES[selected.rarity]} · ${R.SLOTS[selected.slot]}</small><h3>${selected.name}</h3><p>${selected.description}</p></div>
    </div>
    <div class="bag-v212-stat-grid">${Object.entries(STAT_NAMES).map(([id,label])=>{
      const value=selected.stats[id]||0,delta=difference[id];
      return `<div><span>${label}</span><strong>${value?`+${value}`:'—'}</strong><small class="${delta>0?'positive':delta<0?'negative':''}">${delta>0?'+':''}${delta} değişim</small></div>`;
    }).join('')}</div>
    ${selected.set?`<div class="bag-v212-set">✦ ${SET_NAMES[selected.set]} · ${setWorn}/2 parça kuşanıldı <small>İki parça aynı kahramana takıldığında set bonusu açılır.</small></div>`:''}
    <div class="bag-v212-detail-actions">
      ${equipped?`<button class="primary" data-unequip="${selected.slot}" ${busy?'disabled':''}>Çıkar</button>`:`<button class="primary" data-equip="${selected.id}" ${busy||free<=0?'disabled':''}>${free>0?'Kuşan':'Boşta eşya yok'}</button>`}
      ${!selected.exclusive?`<button class="secondary" data-forge="${selected.id}" ${canForge?'':'disabled'}>${state.buildings.forge<selected.forge?`Demirhane Sv. ${selected.forge} gerekli`:'Üret'}</button>`:''}
    </div>
    <p class="bag-v212-origin">${selected.exclusive?'Özel sefer ganimeti. Demirhanede üretilemez.':`Üretim maliyeti: ${costText}`} · Çantada: ${count} · Boşta: ${Math.max(0,free)}</p>`;
  }
  if(material)details=`<div class="bag-v212-detail-head"><span class="bag-v212-detail-art bag-v213-material-glyph material-${material.id}" aria-hidden="true">${material.glyph}</span><div><small>KAYNAK · ÇANTA</small><h3>${material.name}</h3><p>${material.description}</p></div></div>
    <div class="bag-v213-material-total"><small>Mevcut miktar</small><strong>${fmt(state.res[material.id]||0)}</strong></div>
    <p class="bag-v212-origin">Bu kaynak köy üretimi, sefer zaferleri ve görev ödülleriyle kazanılır. Kaynakların mevcut oyun kayıtlarına bağlıdır.</p>`;
  return `<header class="bag-v212-header"><div><span class="eyebrow">YILDIZ KALESİ · KAHRAMAN TEÇHİZATI</span><h2>Çanta ve Donanım</h2><p>Silahını kuşan, setlerini tamamla ve takımını bir sonraki sefere hazırla.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="armory-v212">
      <aside class="bag-v212-roster"><h3>Kahramanlar</h3><div class="armory-heroes" aria-label="Ekipman kahramanı">${roster}</div></aside>
      <section class="bag-v212-character bag-hero-display">
        <div class="bag-v212-character-art"><img src="assets/${hero.id}.webp" alt="${hero.name}, ${hero.title}"></div>
        <div class="bag-v212-character-name"><span class="eyebrow">AKTİF KAHRAMAN</span><h3>${hero.name}</h3><small>${hero.title} · Seviye ${state.heroes[hero.id].level}</small></div>
        <div class="bag-v212-character-stats">
          <div><span>⚔ Saldırı</span><b>${fmt(stats.attack)}</b></div>
          <div><span>♡ Can</span><b>${fmt(stats.maxHp)}</b></div>
          <div><span>⛨ Zırh</span><b>%${fmt(gear.armor)}</b></div>
          <div><span>✦ Şifa</span><b>+${fmt(gear.healing)}</b></div>
          <div class="bag-v213-power"><span>⚔ Donanım Gücü</span><b>${fmt(Math.round(stats.attack*2+stats.maxHp*.35+gear.armor*2+gear.healing))}</b></div>
        </div>
      </section>
      <div class="bag-v212-right">
        <section class="bag-v212-equipped"><div class="bag-v212-section-heading"><span class="eyebrow">AKTİF KAHRAMANIN DONANIMI</span><strong>${hero.name}</strong></div><div class="bag-v212-slots">${equippedItems}</div></section>
        <div class="bag-toolbar"><h3>Çantam <small>${R.ITEMS.filter(item=>itemCount(state,item)>0).length}/${R.ITEMS.length} ekipman türü</small></h3><div class="bag-filters" aria-label="Çanta filtreleri">${FILTERS.map(([id,name])=>`<button data-bag-slot="${id}" aria-pressed="${filter===id}" class="${filter===id?'selected':''}">${name}</button>`).join('')}</div></div>
        <div class="item-grid bag-item-grid" aria-label="Çanta eşyaları">${cards+materialCards||'<p class="bag-v212-empty">Bu filtrede eşya yok.</p>'}</div>
        <p class="armory-tip">${busy?'Savaş sürerken ekipman değiştirilemez. ':''}Bir eşya iki kahramana takılamaz. Set bonusu ve seçili ekipman karşılaştırmaları sağ panelde görünür.</p>
      </div>
      <section class="bag-v212-detail" aria-label="Seçili ekipman ayrıntıları">${details}</section>
    </div>`;
}
