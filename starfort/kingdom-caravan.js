/** STARFORT Kervan Pazarı — published trade terms match the trusted SQL.
 * These are illustrative offers only. Resource mutation lives in sfb_village_api. */
export const CARAVAN_ROUTES=Object.freeze([
 Object.freeze({id:'wood',name:'Karaorman Kereste Kervanı',icon:'🪵',unlock:2,
  cost:Object.freeze({gold:180,stone:35}),reward:Object.freeze({wood:220}),
  description:'Altın ve taş karşılığında surlar için kereste taşı.'}),
 Object.freeze({id:'stone',name:'Aytaşı Taşçı Birliği',icon:'⬟',unlock:3,
  cost:Object.freeze({gold:200,wood:90}),reward:Object.freeze({stone:175}),
  description:'Taş ustalarını gönder, kalenin duvarlarını hızlandır.'}),
 Object.freeze({id:'aether',name:'Yıldız Gözcüleri Seferi',icon:'✧',unlock:4,
  cost:Object.freeze({gold:260,wood:140,stone:120}),reward:Object.freeze({aether:28}),
  description:'Nadir yıldız özü elde etmek için diğer kaynakları feda et.'})
]);
export const CARAVAN_DAILY_LIMIT=2;
export function caravanStatus(village,now=Date.now()){
 const day=new Date(now).toISOString().slice(0,10),claimed=village?.tradeDay===day?village.tradeRoutes||[]:[];
 const balance=village?.res||{},castle=village?.buildings?.keep||1;
 const busy=!!village?.serverVillage&&!village?.serverVillageReady;
 return Object.freeze({day,used:claimed.length,limit:CARAVAN_DAILY_LIMIT,remaining:Math.max(0,CARAVAN_DAILY_LIMIT-claimed.length),
  offers:CARAVAN_ROUTES.map(o=>Object.freeze({...o,
    claimed:claimed.includes(o.id),
    unlocked:castle>=o.unlock,
    affordable:Object.entries(o.cost).every(([name,value])=>(balance[name]||0)>=value),
    capped:Object.entries(o.reward).some(([name,value])=>(balance[name]||0)+value>1e9),
    available:!busy&&castle>=o.unlock&&!claimed.includes(o.id)&&claimed.length<CARAVAN_DAILY_LIMIT&&Object.entries(o.cost).every(([name,value])=>(balance[name]||0)>=value)&&Object.entries(o.reward).every(([name,value])=>(balance[name]||0)+value<=1e9)
  }))});
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function caravanMarkup(village,now=Date.now()){
 if(!village?.serverVillage)return '';
 const status=caravanStatus(village,now);
 const labels={gold:'altın',wood:'kereste',stone:'taş',aether:'yıldız özü'};
 const fmt=o=>Object.entries(o).map(([id,n])=>n.toLocaleString('tr-TR')+' '+labels[id]).join(' · ');
 return `<section class="caravan-market" aria-label="Kervan pazarı ve günlük kaynak takası">
 <div class="caravan-head"><div><span class="eyebrow">✦ KRALLIK LOJİSTİĞİ · SUNUCU TAKASI</span><h3>Kervan Pazarı</h3><p>Hangi malzemenin eksik olduğuna sen karar ver. Günlük en fazla iki ayrı ticaret tamamlanır. Teklifler ücretsiz kaynak üretmez.</p></div>
 <strong class="caravan-quota">${status.remaining}<small>/ ${status.limit} HAK</small></strong></div>
 <div class="caravan-routes">${status.offers.map(o=>`<article class="caravan-route ${o.available?'ready':''}">
  <div class="caravan-symbol" aria-hidden="true">${o.icon}</div><strong>${esc(o.name)}</strong><p>${esc(o.description)}</p>
  <div class="caravan-exchange"><small>VERİLECEK</small><span>${fmt(o.cost)}</span><small>ALINACAK</small><b>${fmt(o.reward)}</b></div>
  <button class="${o.available?'primary':'secondary'}" data-caravan-trade="${o.id}" ${o.available?'':'disabled'}>${o.claimed?'Bugün yapıldı':!o.unlocked?'Kale seviye '+o.unlock+' gerekli':status.remaining===0?'Günlük hak bitti':o.capped?'Depo dolu':!o.affordable?'Kaynak yetersiz':'Kervanı gönder'}</button>
  </article>`).join('')}</div>
 <small class="caravan-note">Takaslar sunucuda kaynak ve günlük sınır doğrulanarak işlenir. Aynı ticaret aynı gün ikinci kez yapılamaz. Haklar UTC gün değişiminde yenilenir.</small>
 </section>`;
}
