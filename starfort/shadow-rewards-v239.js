/** v2.39: transparent server-only victory ledger, loot preview and reward replay presentation. */
import {ITEMS} from './rules.js';
import {shadowBossArtwork,shadowLootSummary} from './shadow-boss-art-v239.js';
const ITEMS_BY_ID=new Map(ITEMS.map(x=>[x.id,x]));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label={gold:'Altın',wood:'Kereste',stone:'Taş',aether:'Yıldız Özü'};
const rarity={common:'Yaygın',epic:'Destansı',legendary:'Efsanevi'};
const n=x=>Number(x).toLocaleString('tr-TR');
export function shadowVictoryMarkup(report,regions=[]){
 if(!report||typeof report!=='object')return '';
 const won=report.won===true;
 const stage=Number.isSafeInteger(report.stage)&&report.stage>=1&&report.stage<=4?report.stage:1;
 const region=regions.find(x=>x.id===report.stage)?.region||'Gölge Sınırı';
 const stars=won&&Number.isSafeInteger(report.stars)?Math.max(0,Math.min(3,report.stars)):0;
 const item=won&&typeof report.item==='string'?ITEMS_BY_ID.get(report.item):null;
 const loot=shadowLootSummary(report);
 return `<article class="shadow-last-report ${won?'win':'loss'}" role="status" aria-label="${won?'Sınır zaferi':'Sefer sonucu'}">
  <div class="shadow-result-layout">
    <div class="shadow-result-art">${shadowBossArtwork(stage,{variant:'reward',wave:3})}
      ${won?'<span class="shadow-result-seal" aria-hidden="true">✦</span>':''}</div>
    <div class="shadow-result-content"><span class="eyebrow">${won?'DOĞRULANMIŞ SUNUCU ZAFERİ':'SUNUCU SAVAŞ RAPORU'}</span>
      <h3>${esc(won?'Gölge Sınırı Zaferi':report.abandoned?'Seferden Çekildin':'Sınır Direndi')}</h3>
      <div class="shadow-result-stars" aria-label="${stars} yıldız kazanıldı">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <p>${esc(region)}${Number.isSafeInteger(report.turns)?' · '+n(report.turns)+' tur':''} · ${won?'Ödüller gerçek oyuncu hesabına işlendi.':'Kahramanlarını ve eşyalarını geliştirip tekrar dene.'}</p>
      ${won?`<div class="shadow-reward-ledger" aria-label="Kazanılan kaynaklar">
        ${loot.map(x=>`<span class="shadow-reward-resource" data-resource="${x.id}"><b>+${n(x.value)}</b><small>${label[x.id]}</small></span>`).join('')}
      </div>
      ${item?`<div class="shadow-rare-loot" data-loot-id="${esc(item.id)}">
        <span class="shadow-loot-symbol" aria-hidden="true">✧</span>
        <span><small>İLK ZAFER GANİMETİ · ${rarity[item.rarity]||'Özel'}</small><strong>${esc(item.name)}</strong>
          <small>${esc(item.description)}</small></span>
        <button class="secondary" data-shadow-open-armory>Çantada incele</button>
      </div>`:'<p class="shadow-repeat-note">Kaynaklar sunucuda hesaplandı. Bu sefer için ilk-zafer ekipmanı verilmedi.</p>'}`:''}
      <button class="secondary" data-shadow-dismiss-result>Sonucu kapat</button>
    </div></div></article>`;
}
