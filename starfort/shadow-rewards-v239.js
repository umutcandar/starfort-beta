/** v2.39: transparent server-only victory ledger, loot preview and reward replay presentation. */
import {ITEMS} from './rules.js';
import {getLocale,formatNumber} from './locale-v243.js';
import {shadowBossArtwork,shadowLootSummary} from './shadow-boss-art-v239.js';
const ITEMS_BY_ID=new Map(ITEMS.map(x=>[x.id,x]));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label={gold:['Altın','Gold'],wood:['Kereste','Timber'],stone:['Taş','Stone'],aether:['Yıldız Özü','Star essence']};
const regionsEn=['Dark Pass','Whispering Shores','Burnt Cliffs','Dark Throne'];
const l=(tr,en)=>getLocale()==='en'?en:tr;
const rarity={common:['Yaygın','Common'],epic:['Destansı','Epic'],legendary:['Efsanevi','Legendary']};
const n=x=>formatNumber(Number(x));
export function shadowVictoryMarkup(report,regions=[]){
 if(!report||typeof report!=='object')return '';
 const won=report.won===true;
 const stage=Number.isSafeInteger(report.stage)&&report.stage>=1&&report.stage<=4?report.stage:1;
 const region=getLocale()==='en'?regionsEn[stage-1]:(regions.find(x=>x.id===report.stage)?.region||'Gölge Sınırı');
 const stars=won&&Number.isSafeInteger(report.stars)?Math.max(0,Math.min(3,report.stars)):0;
 const item=won&&typeof report.item==='string'?ITEMS_BY_ID.get(report.item):null;
 const loot=shadowLootSummary(report);
 return `<article class="shadow-last-report ${won?'win':'loss'}" role="status" aria-label="${won?l('Sınır zaferi','Frontier victory'):l('Sefer sonucu','Expedition result')}">
  <div class="shadow-result-layout">
    <div class="shadow-result-art">${shadowBossArtwork(stage,{variant:'reward',wave:3})}
      ${won?'<span class="shadow-result-seal" aria-hidden="true">✦</span>':''}</div>
    <div class="shadow-result-content"><span class="eyebrow">${won?l('DOĞRULANMIŞ SUNUCU ZAFERİ','VERIFIED SERVER VICTORY'):l('SUNUCU SAVAŞ RAPORU','SERVER BATTLE REPORT')}</span>
      <h3>${esc(won?l('Gölge Sınırı Zaferi','Shadow Frontier Victory'):report.abandoned?l('Seferden Çekildin','You retreated'):l('Sınır Direndi','Frontier held firm'))}</h3>
      <div class="shadow-result-stars" aria-label="${stars} ${l('yıldız kazanıldı','stars earned')}">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <p>${esc(region)}${Number.isSafeInteger(report.turns)?' · '+n(report.turns)+' '+l('tur','turns'):''} · ${won?l('Ödüller gerçek oyuncu hesabına işlendi.','Rewards were recorded on your verified account.'):l('Kahramanlarını ve eşyalarını geliştirip tekrar dene.','Upgrade your heroes and equipment, then try again.')}</p>
      ${won&&Number.isSafeInteger(report.renown)&&report.renown>=0?
        `<div class="shadow-result-renown" aria-label="${l('Sunucu Sınır Ustalığı itibarı','Verified frontier renown')}">✦ +${n(report.renown)} ${l('itibar','renown')}
         ${report.renown===0?'· ${l('Bu haftanın 100 itibar sınırına ulaştın','Weekly 100-renown cap reached')}':''}</div>`:''}
      ${won?`<div class="shadow-reward-ledger" aria-label="${l('Kazanılan kaynaklar','Earned resources')}">
        ${loot.map(x=>`<span class="shadow-reward-resource" data-resource="${x.id}"><b>+${n(x.value)}</b><small>${label[x.id][getLocale()==='en'?1:0]}</small></span>`).join('')}
      </div>
      ${item?`<div class="shadow-rare-loot" data-loot-id="${esc(item.id)}">
        <span class="shadow-loot-symbol" aria-hidden="true">✧</span>
        <span><small>${l('İLK ZAFER GANİMETİ','FIRST-CLEAR LOOT')} · ${(rarity[item.rarity]||['Özel','Special'])[getLocale()==='en'?1:0]}</small><strong>${esc(item.name)}</strong>
          <small>${esc(item.description)}</small></span>
        <button class="secondary" data-shadow-open-armory>${l('Çantada incele','View in inventory')}</button>
      </div>`:'<p class="shadow-repeat-note">${report.converted===true?l("Ekipman için 20 adet çanta sınırına ulaşıldı; ödül 36 Yıldız Özü’ne dönüştürüldü.","Inventory is at the 20-item cap. The item reward was converted to 36 Star essence."):l("Kaynaklar sunucuda hesaplandı. Bu sefer için ilk-zafer ekipmanı verilmedi.","Resources were calculated on the server. No first-clear equipment was granted for this replay.")}</p>'}`:''}
      <button class="secondary" data-shadow-dismiss-result>${l('Sonucu kapat','Close result')}</button>
    </div></div></article>`;
}
