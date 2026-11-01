/** Building upgrade command center: authored from the existing game state. */
import {buildingUpgradePlan,buildingRoadmap,villageResourceNames} from './building-planner.js';
import {ART_EVOLUTION} from './city-art-layout.js';
const nice=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(v);
const resourceIcons={gold:'coin',wood:'wood',stone:'stone',aether:'star'};
const statusLabel={ready:'Geliştirmeye hazır',collect:'Üretim hazır',short:'Kaynak bekleniyor',locked:'Kale seviyesi gerekli',maxed:'Tamamlandı',battle:'Savaş devam ediyor'};
const timeLabel=minutes=>minutes===null?'Üretim tek başına yetmiyor; seferlerden de kaynak kazan.':minutes<60?'Yaklaşık '+minutes+' dk sonra':minutes<1440?'Yaklaşık '+Math.ceil(minutes/60)+' saat sonra':'Yaklaşık 1 gün sonra';
export function buildingWorkshopMarkup(state,selectedId,{icon,number=nice,now=Date.now()}={}){
 const roadmap=buildingRoadmap(state,now),plan=buildingUpgradePlan(state,selectedId,now);
 if(!plan)return '';
 const {building,level,nextLevel,status,cost,progress,missing,available,current,next,etaMinutes}=plan;
 const isAvailable=status==='ready'||status==='collect';
 const missingItems=Object.entries(missing).filter(([,value])=>value>0);
 const total=roadmap.plans.reduce((a,p)=>a+p.level,0);
 const maxLevels=roadmap.plans.reduce((a,p)=>a+p.building.maxLevel,0);
 const numberLabel=n=>number(Number(n.toFixed?.(2)??n));
 const resources=Object.entries(cost).map(([id,required])=>{
   const held=state.res[id],usable=available[id],short=missing[id],fraction=Math.min(100,Math.round(usable/required*100));
   return `<div class="ws-resource ${short?'short':'enough'}"><div class="ws-resource-icon">${icon(resourceIcons[id])}</div><div class="ws-resource-info"><div class="ws-resource-line"><b>${villageResourceNames[id]}</b><strong>${number(usable)} <small>/ ${number(required)}</small></strong></div><div class="ws-bar"><i style="width:${fraction}%"></i></div><small>${short?'Eksik '+number(short):usable>held?'Bekleyen üretim dahil hazır':'Yeterli kaynak var'}</small></div></div>`;
 }).join('');
 const actions=status==='ready'?`<button class="primary ws-upgrade-button" data-upgrade-building="${building.id}">✦ Şimdi geliştir · Seviye ${nextLevel}</button>`:
   status==='collect'?`<button class="primary ws-upgrade-button" data-collect-upgrade="${building.id}">✦ Üretimi topla ve geliştir</button>`:
   status==='locked'?`<button class="secondary ws-upgrade-button" data-workshop-keep>♜ Kaleyi geliştirmeye git</button>`:
   `<button class="secondary ws-upgrade-button" disabled>${status==='maxed'?'✓ En yüksek seviye':status==='battle'?'Savaşta geliştirilemez':'Kaynaklar eksik'}</button>`;
 const guidance=status==='ready'?'Bütün kaynaklar hazır. Geliştirme hemen tamamlanır.':
   status==='collect'?'Köyde bekleyen üretim maliyeti karşılıyor. Tek dokunuşla toplanıp geliştirme yapılabilir.':
   status==='locked'?`Bu bina seviye ${nextLevel} için önce Yıldız Kalesi’nin seviye ${state.buildings.keep+1} olmasını istiyor.`:
   status==='short'?(`${missingItems.map(([id,n])=>number(n)+' '+villageResourceNames[id]).join(' · ')} eksik. `+timeLabel(etaMinutes)):
   status==='battle'?'Geliştirme için önce aktif savaşı bitir.':
   'Bu yapı en yüksek seviyeye ulaştı. Diğer yapıları güçlendirebilirsin.';
 const buildingMenu=roadmap.plans.map(p=>`<button class="ws-building-tab ${p.id===building.id?'selected':''} ${p.status}" data-plan-building="${p.id}" aria-current="${p.id===building.id?'true':'false'}" aria-label="${p.building.name} · seviye ${p.level}"><span class="ws-building-tab-icon">${icon(p.id)}</span><span class="ws-building-tab-info"><b>${p.building.name}</b><small>Sv. ${p.level} / ${p.building.maxLevel}</small></span><span class="ws-building-tab-state" aria-hidden="true">${p.status==='maxed'?'✓':p.status==='ready'||p.status==='collect'?'✦':p.status==='locked'?'🔒':'·'}</span></button>`).join('');
 return `<section class="ws-shell">
   <header class="ws-header">
     <div><span class="eyebrow">STARFORT · KRALLIK MİMARISI</span><h2 id="building-title">Köy Geliştirme Merkezi</h2><p>Yapılarını planla, güçlenmeni gör, doğru yatırımı yap.</p></div>
     <div class="ws-header-summary"><b>${total} <small>/ ${maxLevels}</small></b><span>Toplam yapı seviyesi</span><em>${roadmap.ready} hazır · ${roadmap.completed} tamamlandı</em></div>
     <button class="icon-button ws-close" data-close-building aria-label="Geliştirme penceresini kapat">×</button>
   </header>
   <div class="ws-layout">
     <aside class="ws-navigation" aria-label="Bina seçimi"><div class="ws-nav-title">BİNALAR <small>${roadmap.plans.length} yapı</small></div><nav class="ws-building-list" aria-label="Geliştirme binaları">${buildingMenu}</nav>
       <div class="ws-coach"><span>✧ KRALLIK PLANI</span><p>${roadmap.next?roadmap.next.id===building.id?'Öncelikli geliştirme için bu bina uygun.':roadmap.next.building.name+' bir sonraki öncelikli yatırım olabilir.':'Bütün yapılar tamamlandı veya şu an savaş nedeniyle kilitli.'}</p>${roadmap.next&&roadmap.next.id!==building.id?`<button class="secondary" data-plan-building="${roadmap.next.id}">Önerilen binaya git →</button>`:''}</div>
     </aside>
     <main class="ws-center">
       <div class="ws-building-heading"><div><span class="eyebrow">${plan.kind.toUpperCase()} · SEVİYE ${level} / ${building.maxLevel}</span><h3>${building.name}</h3><p>${building.description}</p></div><span class="ws-status-chip ${status}">${statusLabel[status]}</span></div>
       <div class="building-art-comparison ws-art" aria-label="Mevcut ve sonraki bina görünümleri"><figure><canvas data-building-preview="${level}" role="img" aria-label="${building.name} mevcut seviye ${level}"></canvas><figcaption>ŞİMDİ · SV. ${level}</figcaption></figure>${plan.maxed?'':`<figure class="next"><canvas data-building-preview="${nextLevel}" role="img" aria-label="${building.name} sonraki seviye ${nextLevel}"></canvas><figcaption>GELİŞİNCE · SV. ${nextLevel}</figcaption></figure>`}</div>
       <div class="ws-effect-box"><div class="ws-effect-title"><span>YÜKSELTME ETKİSİ</span><b>${plan.maxed?'TAMAMLANDI':'+'+numberLabel(plan.effectIncrease)+' kazanım'}</b></div><div class="ws-effect-values"><div><small>Şimdiki güç</small><strong>${numberLabel(current.value)}</strong><span>${current.unit}</span></div><span class="ws-effect-arrow">→</span><div class="ws-after"><small>${plan.maxed?'Son seviye':'Sonraki seviye'}</small><strong>${numberLabel(next.value)}</strong><span>${next.unit}</span></div></div></div>
       <div class="ws-levels-header"><b>Mimari ilerleme</b><span>${level} / ${building.maxLevel} seviye</span></div>
       <div class="building-levels ws-levels" aria-label="${building.name} seviye ${level}">${Array.from({length:building.maxLevel},(_,i)=>`<span class="${i<level?'built':''} ${i===level?'upcoming':''}" title="Seviye ${i+1}">${i+1}</span>`).join('')}</div>
       <div class="ws-next-evolution"><span>✦ SIRADAKİ MİMARİ DETAY</span><strong>${ART_EVOLUTION[building.id][Math.min(plan.maxed?level-1:level,building.maxLevel-1)]}</strong><small>${plan.maxed?'Bütün mimari eklentiler açıldı.':'Yükseltince bu görsel eklenti köye eklenir.'}</small></div>
     </main>
     <aside class="ws-investment"><div class="ws-invest-head"><span class="eyebrow">YATIRIM PLANI</span><h3>${plan.maxed?'Bina tamamlandı':'Seviye '+nextLevel+' maliyeti'}</h3><p>${plan.maxed?'Bu bina için yeni maliyet yok.':'Toplanabilecek üretim de hesaplandı.'}</p></div>
       ${plan.maxed?'':`<div class="ws-resource-list">${resources}</div><div class="ws-funding"><div><b>Hazırlık durumu</b><strong>%${progress}</strong></div><div class="ws-bar"><i style="width:${progress}%"></i></div></div>`}
       <p class="ws-guidance" role="status">${guidance}</p>
       <div class="ws-actions">${actions}${!plan.maxed&&Object.values(plan.pending).some(n=>n>0)&&status!=='collect'?'<button class="secondary ws-collect-button" data-collect>✧ Biriken kaynakları topla</button>':''}</div>
       <small class="ws-fair-note">Yükseltmeler anında tamamlanır. Kaynak tüketimi oyun kaydına işlenir; yeni premium para birimi veya bekleme süresi yok.</small>
     </aside>
   </div>
 </section>`;
}
