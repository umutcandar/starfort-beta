/** Building upgrade command center: authored from the existing game state. */
import {buildingUpgradePlan,buildingRoadmap,villageResourceNames} from './building-planner.js';
import {ART_EVOLUTION} from './city-art-layout.js';
const nice=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(v);
const resourceIcons={gold:'coin',wood:'wood',stone:'stone',aether:'star'};
const statusLabel={ready:'Geliştirmeye hazır',collect:'Üretim hazır',short:'Kaynak bekleniyor',locked:'Kale seviyesi gerekli',maxed:'Tamamlandı',battle:'Savaş devam ediyor',building:'İnşaat sürüyor',claim:'İnşaat tamamlandı','builder-busy':'Usta başka binada',mastery:'Sefer yıldızları gerekli'};
const timeLabel=minutes=>minutes===null?'Üretim tek başına yetmiyor; seferlerden de kaynak kazan.':minutes<60?'Yaklaşık '+minutes+' dk sonra':minutes<1440?'Yaklaşık '+Math.ceil(minutes/60)+' saat sonra':'Yaklaşık 1 gün sonra';
const durationLabel=ms=>{const minutes=Math.ceil(ms/60000);return minutes>=1440?Math.ceil(minutes/1440)+' gün':minutes>=60?Math.ceil(minutes/60)+' saat':Math.max(1,minutes)+' dk';};
export function buildingWorkshopMarkup(state,selectedId,{icon,number=nice,now=Date.now()}={}){
 const roadmap=buildingRoadmap(state,now),plan=buildingUpgradePlan(state,selectedId,now);
 if(!plan)return '';
 const {building,level,nextLevel,status,cost,progress,missing,available,current,next,etaMinutes,construction,durationMs,mastery}=plan;
 const job=construction,buildingNow=status==='building'||status==='claim';
 const isAvailable=status==='ready'||status==='collect';
 const missingItems=Object.entries(missing).filter(([,value])=>value>0);
 const total=roadmap.plans.reduce((a,p)=>a+p.level,0);
 const maxLevels=roadmap.plans.reduce((a,p)=>a+p.building.maxLevel,0);
 const numberLabel=n=>number(Number(n.toFixed?.(2)??n));
 const resources=Object.entries(cost).map(([id,required])=>{
   const held=state.res[id],usable=available[id],short=missing[id],fraction=Math.min(100,Math.round(usable/required*100));
   return `<div class="ws-resource ${short?'short':'enough'}"><div class="ws-resource-icon">${icon(resourceIcons[id])}</div><div class="ws-resource-info"><div class="ws-resource-line"><b>${villageResourceNames[id]}</b><strong>${number(usable)} <small>/ ${number(required)}</small></strong></div><div class="ws-bar"><i style="width:${fraction}%"></i></div><small>${short?'Eksik '+number(short):usable>held?'Bekleyen üretim dahil hazır':'Yeterli kaynak var'}</small></div></div>`;
 }).join('');
 const actions=status==='claim'? `<button class="primary ws-upgrade-button" data-finish-building>✓ İnşaatı tamamla · Seviye ${nextLevel}</button>`:
   status==='building'? `<button class="secondary ws-upgrade-button" disabled>⌛ Kalan: ${durationLabel(job.remainingMs)}</button>`:
   status==='ready'? `<button class="primary ws-upgrade-button" data-upgrade-building="${building.id}">${durationMs?'⚒ İnşaatı başlat · '+durationLabel(durationMs):'✦ Şimdi geliştir · Seviye '+nextLevel}</button>`:
   status==='collect'? `<button class="primary ws-upgrade-button" data-collect-upgrade="${building.id}">${durationMs?'⚒ Üretimi topla ve inşaatı başlat':'✦ Üretimi topla ve geliştir'}</button>`:
   status==='locked'? `<button class="secondary ws-upgrade-button" data-workshop-keep>♜ Kaleyi geliştirmeye git</button>`:
   status==='mastery'? `<button class="secondary ws-upgrade-button" data-workshop-expedition>✦ Seferlerde yıldız kazan · ${mastery.total}/${mastery.required}</button>`:
   status==='builder-busy'? `<button class="secondary ws-upgrade-button" data-plan-building="${job.id}">⛏ Devam eden inşaata git</button>`:
   `<button class="secondary ws-upgrade-button" disabled>${status==='maxed'?'✓ En yüksek seviye':status==='battle'?'Savaşta geliştirilemez':'Kaynaklar eksik'}</button>`;
 const guidance=status==='building'?`Tek inşaat ustası burada çalışıyor. Kalan süre: ${durationLabel(job.remainingMs)}. Oyun kapalıyken de süre ilerler.`:
   status==='claim'?'İnşaat tamamlandı! Seviyeyi aktifleştirmek için tamamla düğmesine bas.':
   status==='builder-busy'?`${roadmap.plans.find(p=>p.id===job.id)?.building.name||'Başka bir bina'} üzerinde çalışan tek inşaat ustası boşalana kadar yeni inşaat başlayamaz.`:
   status==='ready'?(durationMs?`Kaynaklar hazır. İnşaat ${durationLabel(durationMs)} sürecek; sıraya aynı anda tek yapı alınabilir.`:'Kaynaklar hazır. İlk yükseltme anında tamamlanır.'):
   status==='collect'?(durationMs?'Bekleyen üretim maliyeti karşılıyor. Topla ve zamanlı inşaatı başlat.':'Üretim maliyeti karşılıyor. Tek dokunuşla topla ve geliştir.'):
   status==='locked'?`Bu bina seviye ${nextLevel} için önce Yıldız Kalesi’nin seviye ${state.buildings.keep+1} olmasını istiyor.`:
   status==='mastery'?`Mimarların yeni planlar için en az ${mastery.required} sefer yıldızı görmesi gerekiyor. Şimdi ${mastery.total}/24 yıldızın var. Eski bölümleri tekrar oynayarak 1–3 yıldızı artırabilirsin.`:
   status==='short'?(`${missingItems.map(([id,n])=>number(n)+' '+villageResourceNames[id]).join(' · ')} eksik. `+timeLabel(etaMinutes)):
   status==='battle'?'Geliştirme için önce aktif savaşı bitir.':
   'Bu yapı tüm 20 seviyeyi tamamladı. Krallığın en yüksek yapı rütbesine ulaştı.';
 const buildingMenu=roadmap.plans.map(p=>`<button class="ws-building-tab ${p.id===building.id?'selected':''} ${p.status}" data-plan-building="${p.id}" aria-current="${p.id===building.id?'true':'false'}" aria-label="${p.building.name} · seviye ${p.level}"><span class="ws-building-tab-icon">${icon(p.id)}</span><span class="ws-building-tab-info"><b>${p.building.name}</b><small>Sv. ${p.level} / ${p.building.maxLevel}</small></span><span class="ws-building-tab-state" aria-hidden="true">${p.status==='maxed'?'✓':p.status==='claim'?'✓':p.status==='building'?'⌛':p.status==='ready'||p.status==='collect'?'✦':p.status==='locked'||p.status==='mastery'?'🔒':'·'}</span></button>`).join('');
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
       <div class="building-art-comparison ws-art" aria-label="Bina mimarisi"><figure><canvas data-building-preview="${Math.min(level,8)}" role="img" aria-label="${building.name} mevcut mimari"></canvas><figcaption>${level>8?'USTALIK ÇAĞI · SV. '+level:'ŞİMDİ · SV. '+level}</figcaption></figure>${plan.maxed||level>=8?'':`<figure class="next"><canvas data-building-preview="${nextLevel}" role="img" aria-label="${building.name} sonraki seviye ${nextLevel}"></canvas><figcaption>GELİŞİNCE · SV. ${nextLevel}</figcaption></figure>`}</div>
       <div class="ws-effect-box"><div class="ws-effect-title"><span>YÜKSELTME ETKİSİ</span><b>${plan.maxed?'TAMAMLANDI':'+'+numberLabel(plan.effectIncrease)+' kazanım'}</b></div><div class="ws-effect-values"><div><small>Şimdiki güç</small><strong>${numberLabel(current.value)}</strong><span>${current.unit}</span></div><span class="ws-effect-arrow">→</span><div class="ws-after"><small>${plan.maxed?'Son seviye':'Sonraki seviye'}</small><strong>${numberLabel(next.value)}</strong><span>${next.unit}</span></div></div></div>
       <div class="ws-levels-header"><b>Köy gelişimi</b><span>${level} / ${building.maxLevel} seviye</span></div>
       <div class="building-levels ws-levels" aria-label="${building.name} seviye ${level}">${Array.from({length:building.maxLevel},(_,i)=>`<span class="${i<level?'built':''} ${i===level?'upcoming':''}" title="Seviye ${i+1}">${i+1}</span>`).join('')}</div>
       <div class="ws-next-evolution"><span>✦ ${level>=8?'YAPI USTALIĞI':'SIRADAKİ MİMARİ DETAY'}</span><strong>${level>=8?'Ustalık Çağı · '+(level<=12?'I. Kademe':level<=16?'II. Kademe':'III. Kademe'):ART_EVOLUTION[building.id][level]}</strong><small>${level>=8?'İlk sekiz mimari görünüme 9–20. seviyelerde kalıcı üretim ve savunma uzmanlığı eklenir. Görsel mimarinin yeni kademeleri sonraki sanat çalışmasında eklenecek.': 'Yükseltince bu görsel eklenti köye eklenir.'}</small></div>
     </main>
     <aside class="ws-investment"><div class="ws-invest-head"><span class="eyebrow">YATIRIM PLANI</span><h3>${plan.maxed?'Bina tamamlandı':'Seviye '+nextLevel+' maliyeti'}</h3><p>${plan.maxed?'Bu bina için yeni maliyet yok.':'Toplanabilecek üretim de hesaplandı.'}</p></div>
       ${plan.maxed?'':`<div class="ws-resource-list">${resources}</div><div class="ws-funding"><div><b>Hazırlık durumu</b><strong>%${progress}</strong></div><div class="ws-bar"><i style="width:${progress}%"></i></div></div>`}
       <p class="ws-guidance" role="status">${guidance}</p>
       ${job? `<div class="ws-queue"><b>⚒ Tek inşaat ustası</b><span>${roadmap.plans.find(p=>p.id===job.id)?.building.name||'Yapı'} · ${job.ready?'Tamamlanmaya hazır':durationLabel(job.remainingMs)+' kaldı'}</span></div>`:''}
       <div class="ws-actions">${actions}${!plan.maxed&&Object.values(plan.pending).some(n=>n>0)&&status!=='collect'?'<button class="secondary ws-collect-button" data-collect>✧ Biriken kaynakları topla</button>':''}</div>
       <small class="ws-fair-note">İlk yükseltme anında tamamlanır. 3–20. seviyeler tek ustayla, dakikalardan günlere uzayan gerçek inşaatlardır. 1–3 yıldızlı sefer başarıları ileri aşamaları açar. Para ile hızlandırma yok.</small>
     </aside>
   </div>
 </section>`;
}
