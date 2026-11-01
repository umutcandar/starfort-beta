// Planned premium PvE pieces are visual concepts ONLY. Never grant or charge on client.
export const PREMIUM_PVE_CONCEPTS=Object.freeze([
 {id:'mythic_sword',name:'Kozmik Hükümdar',slot:'weapon',kind:'Silah',detail:'Yıldız çağından kalan kutsal kılıç. Planlanan PvE bonusu: +24 saldırı.',stats:'+24 saldırı'},
 {id:'mythic_armor',name:'Sonsuz Hisar Zırhı',slot:'armor',kind:'Zırh',detail:'Mavi yemin aleviyle mühürlü zırh. Planlanan PvE bonusu: +150 can, %15 zırh.',stats:'+150 can · %15 zırh'},
 {id:'mythic_relic',name:'Ebedî Yıldız Mührü',slot:'relic',kind:'Tılsım',detail:'Nadir bir gök taşı kristali. Planlanan PvE bonusu: +14 şifa, +7 saldırı.',stats:'+14 şifa · +7 saldırı'}
]);
export function premiumCatalogMarkup(){
 const glyph={weapon:'⚔',armor:'⛨',relic:'✧'};
 return `<section class="premium-gear-section"><span class="eyebrow">YILDIZ PAZARI · EFSANEVİ TEÇHİZAT TASARIMLARI</span><h3>Göksel Koleksiyon</h3><p>Gelecekte ücretli sunulabilecek güçlü PvE ekipmanları. Bu sürümde örnek tasarım ve istatistiklerdir; eşya verilmez, para çekilmez.</p><div class="premium-gear-grid">${PREMIUM_PVE_CONCEPTS.map(item=>`<article class="premium-gear-card"><span class="premium-gear-symbol" aria-hidden="true" style="font:58px Georgia,serif;color:#e8c485">${glyph[item.slot]}</span><h4>${item.name}</h4><strong>${item.stats}</strong><p>${item.detail}</p><button class="secondary" disabled>Satın alma henüz açık değil</button></article>`).join('')}</div><p class="premium-terms">Gerçek para satışından önce sunucu doğrulamalı ödeme, satın alma kaydı ve iade akışı gereklidir. PvP eşleştirmesinde ücretli güç avantajı kullanılmaz. Şu an fiyat ve ödeme işlemi yoktur.</p></section>`;
}
