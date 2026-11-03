import {longText as lt} from './locale-sections-v247.js';
import {displayItem} from './locale-items-v246.js';
// Planned premium PvE pieces are visual concepts ONLY. Never grant or charge on client.
export const PREMIUM_PVE_CONCEPTS=Object.freeze([
 {id:'mythic_sword',name:'Kozmik Hükümdar',slot:'weapon',kind:'Silah',detail:'Yıldız çağından kalan kutsal kılıç. Planlanan PvE bonusu: +24 saldırı.',stats:'+24 saldırı'},
 {id:'mythic_armor',name:'Sonsuz Hisar Zırhı',slot:'armor',kind:'Zırh',detail:'Mavi yemin aleviyle mühürlü zırh. Planlanan PvE bonusu: +150 can, %15 zırh.',stats:'+150 can · %15 zırh'},
 {id:'mythic_relic',name:'Ebedî Yıldız Mührü',slot:'relic',kind:'Tılsım',detail:'Nadir bir gök taşı kristali. Planlanan PvE bonusu: +14 şifa, +7 saldırı.',stats:'+14 şifa · +7 saldırı'}
]);
const CATALOG_EN={
 mythic_sword:['Cosmic Sovereign','Sacred blade of the star age. Planned PvE bonus: +24 attack.','+24 attack'],
 mythic_armor:['Eternal Fortress Armor','Armor sealed in blue oath-fire. Planned PvE bonus: +150 health, 15% armor.','+150 health · 15% armor'],
 mythic_relic:['Eternal Star Seal','Rare meteor crystal. Planned PvE bonus: +14 healing, +7 attack.','+14 healing · +7 attack']
};
export const displayPremiumConcept=item=>!item?item:({...item,name:lt(item.name,CATALOG_EN[item.id]?.[0]||item.name),detail:lt(item.detail,CATALOG_EN[item.id]?.[1]||item.detail),stats:lt(item.stats,CATALOG_EN[item.id]?.[2]||item.stats)});
export function premiumCatalogMarkup(){
 const glyph={
  weapon:'<path d="M42 6 55 20 44 53 36 53 23 20Z" fill="#e6c07d"/><path d="M39 17 48 22 41 45 36 45 32 22Z" fill="#fff4c1"/><path d="M20 57H62M35 60V83" fill="none" stroke="#d69d56" stroke-width="6"/><path d="M36 8 44 21 34 42" fill="none" stroke="#92e0f0" stroke-width="3"/>',
  armor:'<path d="M48 8 77 22 73 62 48 86 23 62 19 22Z" fill="#b89c68"/><path d="M48 15 68 26 65 58 48 76 31 58 28 26Z" fill="#2c5d7c"/><path d="M48 18V74M31 39 48 46 65 39" stroke="#f6ddaa" stroke-width="4" fill="none"/><path d="M35 17 48 6 61 17" stroke="#d1eff8" stroke-width="4" fill="none"/>',
  relic:'<circle cx="48" cy="48" r="30" fill="#264d70" stroke="#eccb87" stroke-width="6"/><path d="M48 5 57 35 89 48 57 58 48 90 38 58 8 48 38 35Z" fill="#d1e6ed"/><path d="M48 26 58 48 48 69 37 48Z" fill="#eac879"/><circle cx="48" cy="48" r="7" fill="#fff7d1"/>'
 };
 return `<section class="premium-gear-section"><span class="eyebrow">${lt('YILDIZ PAZARI · EFSANEVİ TEÇHİZAT TASARIMLARI','STAR MARKET · LEGENDARY EQUIPMENT CONCEPTS')}</span><h3>${lt('Göksel Koleksiyon','Celestial Collection')}</h3><p>${lt('Gelecekte ücretli sunulabilecek güçlü PvE ekipmanları. Bu sürümde örnek tasarım ve istatistiklerdir; eşya verilmez, para çekilmez.','These are concept designs for possible future PvE gear. They grant no items and charge no money in this version.')}</p><div class="premium-gear-grid">${PREMIUM_PVE_CONCEPTS.map(item=>`<article class="premium-gear-card"><svg class="item-art" viewBox="0 0 96 96" aria-hidden="true" role="img">${glyph[item.slot]}</svg><h4>${displayPremiumConcept(item).name}</h4><strong>${displayPremiumConcept(item).stats}</strong><p>${displayPremiumConcept(item).detail}</p><button class="secondary" disabled >${lt('Satın alma henüz açık değil','Purchases not yet available')}</button></article>`).join('')}</div><p class="premium-terms">${lt('Gerçek para satışından önce sunucu doğrulamalı ödeme, satın alma kaydı ve iade akışı gereklidir. PvP eşleştirmesinde ücretli güç avantajı kullanılmaz. Şu an fiyat ve ödeme işlemi yoktur.','Before real purchases, verified payments, receipts and refund support are required. Paid gear will not grant PvP power. Prices and checkout are unavailable.')}</p></section>`;
}
