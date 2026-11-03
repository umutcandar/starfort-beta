/** Building upgrade command center: authored from the existing game state. */
import {buildingUpgradePlan,buildingRoadmap} from './building-planner.js';
import {getLocale} from './locale-v243.js';
import {local,displayBuilding,displayBuildingUnit,displayResource} from './locale-game-content-v245.js';
import {caravanMarkup} from './kingdom-caravan.js';
import {ART_EVOLUTION} from './city-art-layout.js';
import {MASTERY_START_LEVEL,MASTERY_ARCHITECTURE} from './mastery-architecture.js';
const nice=v=>new Intl.NumberFormat(getLocale(),{maximumFractionDigits:2}).format(v);
const resourceIcons={gold:'coin',wood:'wood',stone:'stone',aether:'star'};
const statusLabel={ready:'Geliştirmeye hazır',collect:'Üretim hazır',short:'Kaynak bekleniyor',locked:'Kale seviyesi gerekli',maxed:'Tamamlandı',battle:'Savaş devam ediyor',building:'İnşaat sürüyor',claim:'İnşaat tamamlandı','builder-busy':'Usta başka binada',mastery:'Ustalık gereklidir',offline:'Sunucu köyü bekleniyor'};
const statusEn={ready:'Ready to upgrade',collect:'Production ready',short:'Waiting for resources',locked:'Keep level required',maxed:'Completed',battle:'Battle in progress',building:'Under construction',claim:'Construction finished','builder-busy':'Builder is busy',mastery:'Mastery required',offline:'Waiting for server village'};
const timeLabel=minutes=>minutes===null?local('Üretim tek başına yetmiyor; seferlerden de kaynak kazan.','Production alone is not enough; earn resources through expeditions.'):minutes<60?local('Yaklaşık ','About ')+minutes+local(' dk sonra',' min until ready'):minutes<1440?local('Yaklaşık ','About ')+Math.ceil(minutes/60)+local(' saat sonra',' hours until ready'):local('Yaklaşık 1 gün sonra','About 1 day until ready');
const durationLabel=ms=>{const minutes=Math.ceil(ms/60000);return minutes>=1440?Math.ceil(minutes/1440)+local(' gün',' days'):minutes>=60?Math.ceil(minutes/60)+local(' saat',' hours'):Math.max(1,minutes)+local(' dk',' min');};
export function buildingWorkshopMarkup(state,selectedId,{icon,number=nice,now=Date.now()}={}){
 const roadmap=buildingRoadmap(state,now),plan=buildingUpgradePlan(state,selectedId,now);
 if(!plan)return '';
 const {building:rawBuilding,level,nextLevel,status,cost,progress,missing,available,current,next,etaMinutes,construction,durationMs,mastery}=plan;
 const building=displayBuilding(rawBuilding);
 const job=construction,buildingNow=status==='building'||status==='claim';
 const isAvailable=status==='ready'||status==='collect';
 const missingItems=Object.entries(missing).filter(([,value])=>value>0);
 const total=roadmap.plans.reduce((a,p)=>a+p.level,0);
 const maxLevels=roadmap.plans.reduce((a,p)=>a+p.building.maxLevel,0);
 const numberLabel=n=>number(Number(n.toFixed?.(2)??n));
 const resources=Object.entries(cost).map(([id,required])=>{
   const held=state.res[id],usable=available[id],short=missing[id],fraction=Math.min(100,Math.round(usable/required*100));
   return `<div class="ws-resource ${short?'short':'enough'}"><div class="ws-resource-icon">${icon(resourceIcons[id])}</div><div class="ws-resource-info"><div class="ws-resource-line"><b>${displayResource(id)}</b><strong>${number(usable)} <small>/ ${number(required)}</small></strong></div><div class="ws-bar"><i style="width:${fraction}%"></i></div><small>${short?local('Eksik ','Missing ')+number(short):usable>held?local('Bekleyen üretim dahil hazır','Ready including pending production'):local('Yeterli kaynak var','Enough resources')}</small></div></div>`;
 }).join('');
 const actions=status==='claim'? `<button class="primary ws-upgrade-button" data-finish-building>✓ ${local('İnşaatı tamamla','Finish construction')} · ${local('Seviye','Level')} ${nextLevel}</button>`:
   status==='offline'? `<button class="secondary ws-upgrade-button" disabled>${local('Sunucu köyüne bağlanılıyor','Connecting to server village')}</button>`:
   status==='building'? `<button class="secondary ws-upgrade-button" disabled>⌛ ${local('Kalan','Remaining')}: ${durationLabel(job.remainingMs)}</button>`:
   status==='ready'? `<button class="primary ws-upgrade-button" data-upgrade-building="${building.id}">${durationMs?local('⚒ İnşaatı başlat · ','⚒ Start construction · ')+durationLabel(durationMs):local('✦ Şimdi geliştir · Seviye ','✦ Upgrade now · Level ')+nextLevel}</button>`:
   status==='collect'? `<button class="primary ws-upgrade-button" data-collect-upgrade="${building.id}">${durationMs?local('⚒ Üretimi topla ve inşaatı başlat','⚒ Collect and start construction'):local('✦ Üretimi topla ve geliştir','✦ Collect and upgrade')}</button>`:
   status==='locked'? `<button class="secondary ws-upgrade-button" data-workshop-keep>♜ ${local('Kaleyi geliştirmeye git','Go upgrade the keep')}</button>`:
   status==='mastery'? `<button class="secondary ws-upgrade-button" data-workshop-expedition>✦ ${local('Seferlerde yıldız kazan','Earn stars in expeditions')} · ${mastery.total}/${mastery.required}</button>`:
   status==='builder-busy'? `<button class="secondary ws-upgrade-button" data-plan-building="${job.id}">⛏ ${local('Devam eden inşaata git','Go to active construction')}</button>`:
   `<button class="secondary ws-upgrade-button" disabled>${status==='maxed'?local('✓ En yüksek seviye','✓ Maximum level'):status==='battle'?local('Savaşta geliştirilemez','Cannot upgrade during battle'):local('Kaynaklar eksik','Missing resources')}</button>`;
 const guidance=status==='offline'?'Sunucu envanteri doğrulanmadan hiçbir inşaat başlatılamaz; bağlantı kurulunca tekrar dene.':status==='building'?`Tek inşaat ustası burada çalışıyor. Kalan süre: ${durationLabel(job.remainingMs)}. Oyun kapalıyken de süre ilerler.`:
   status==='claim'?'İnşaat tamamlandı! Seviyeyi aktifleştirmek için tamamla düğmesine bas.':
   status==='builder-busy'?`${roadmap.plans.find(p=>p.id===job.id)?.building.name||'Başka bir bina'} üzerinde çalışan tek inşaat ustası boşalana kadar yeni inşaat başlayamaz.`:
   status==='ready'?(durationMs?`Kaynaklar hazır. İnşaat ${durationLabel(durationMs)} sürecek; sıraya aynı anda tek yapı alınabilir.`:'Kaynaklar hazır. İlk yükseltme anında tamamlanır.'):
   status==='collect'?(durationMs?'Bekleyen üretim maliyeti karşılıyor. Topla ve zamanlı inşaatı başlat.':'Üretim maliyeti karşılıyor. Tek dokunuşla topla ve geliştir.'):
   status==='locked'?`Bu bina seviye ${nextLevel} için önce Yıldız Kalesi’nin seviye ${state.buildings.keep+1} olmasını istiyor.`:
   status==='mastery'?(state.serverVillage?`Sunucu ustalığı ${mastery.total}/${mastery.required}. Her gün doğrulanmış günlük sandık +1, kaydedilmiş çevrim içi zafer +3 ustalık verir. Yerel sefer yıldızları aktarılamaz.`:`Mimarların yeni planlar için en az ${mastery.required} sefer yıldızı görmesi gerekiyor. Şimdi ${mastery.total}/24 yıldızın var. Eski bölümleri tekrar oynayarak 1–3 yıldızı artırabilirsin.`):
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
       <div class="building-art-comparison ws-art" aria-label="Bina mimarisi"><figure><canvas data-building-preview="${level}" role="img" aria-label="${building.name} mevcut mimari seviye ${level}"></canvas><figcaption>ŞİMDİ · SV. ${level}</figcaption></figure>${plan.maxed?'':`<figure class="next"><canvas data-building-preview="${nextLevel}" role="img" aria-label="${building.name} sonraki seviye ${nextLevel}"></canvas><figcaption>SONRA · SV. ${nextLevel}</figcaption></figure>`}</div>
       <div class="ws-effect-box"><div class="ws-effect-title"><span>YÜKSELTME ETKİSİ</span><b>${plan.maxed?'TAMAMLANDI':'+'+numberLabel(plan.effectIncrease)+' kazanım'}</b></div><div class="ws-effect-values"><div><small>Şimdiki güç</small><strong>${numberLabel(current.value)}</strong><span>${current.unit}</span></div><span class="ws-effect-arrow">→</span><div class="ws-after"><small>${plan.maxed?'Son seviye':'Sonraki seviye'}</small><strong>${numberLabel(next.value)}</strong><span>${next.unit}</span></div></div></div>
       <div class="ws-levels-header"><b>Köy gelişimi</b><span>${level} / ${building.maxLevel} seviye</span></div>
       <div class="building-levels ws-levels" aria-label="${building.name} seviye ${level}">${Array.from({length:building.maxLevel},(_,i)=>`<span class="${i<level?'built':''} ${i===level?'upcoming':''}" title="Seviye ${i+1}">${i+1}</span>`).join('')}</div>
       ${caravanMarkup(state,now,{missing})}
       <div class="ws-next-evolution"><span>✦ ${nextLevel>=MASTERY_START_LEVEL?'USTALIK MİMARİSİ':level>=8?'MİMARİ HAZIRLIĞI':'SIRADAKİ MİMARİ DETAY'}</span><strong>${plan.maxed?'Ebedî yıldız anıtı':nextLevel>=MASTERY_START_LEVEL?MASTERY_ARCHITECTURE[nextLevel-MASTERY_START_LEVEL].name:level===8?'Ustalık temeli — seviye 10’da yeni mimari':ART_EVOLUTION[building.id][level]}</strong><small>${plan.maxed?'Tüm 11 ustalık mimari eklentisi açıldı.':nextLevel===9?'9. seviyede mevcut görünüm korunur. Yeni mimari parçalar 10. seviyede başlar.':nextLevel>=MASTERY_START_LEVEL?'Yeni çizilen mimari parça köyde kalıcı olarak görünür.':'Yükseltince mimari parçalar köy manzarasına eklenir.'}</small></div>
     </main>
     <aside class="ws-investment"><div class="ws-invest-head"><span class="eyebrow">${state.serverVillage?'SUNUCU EKONOMİSİ':'YEREL DENEME'} · YATIRIM PLANI</span><h3>${plan.maxed?'Bina tamamlandı':'Seviye '+nextLevel+' maliyeti'}</h3><p>${plan.maxed?'Bu bina için yeni maliyet yok.':'Toplanabilecek üretim de hesaplandı.'}</p></div>
       ${plan.maxed?'':`<div class="ws-resource-list">${resources}</div><div class="ws-funding"><div><b>Hazırlık durumu</b><strong>%${progress}</strong></div><div class="ws-bar"><i style="width:${progress}%"></i></div></div>`}
       <p class="ws-guidance" role="status">${guidance}</p>
       ${job? `<div class="ws-queue"><b>⚒ Tek inşaat ustası</b><span>${roadmap.plans.find(p=>p.id===job.id)?.building.name||'Yapı'} · ${job.ready?'Tamamlanmaya hazır':durationLabel(job.remainingMs)+' kaldı'}</span></div>`:''}
       <div class="ws-actions">${actions}${state.serverVillage?'<button class="secondary ws-expedition-earn" data-warfront-open>⚔ Cephe Karargâhı · Sefer, sandık ve ikmal ödülleri</button>':''}${!plan.maxed&&Object.values(plan.pending).some(n=>n>0)&&status!=='collect'?'<button class="secondary ws-collect-button" data-collect>✧ Biriken kaynakları topla</button>':''}</div>
       <small class="ws-fair-note">${state.serverVillage?'Bütün köy kaynakları, ustalık ve inşaat sunucudadır; yerel savaş/çanta ödülleri buna eklenmez.':'Hesapsız köy yerel denemedir; buluttaki ekonomiye aktarılmaz.'} İlk yükseltme anında tamamlanır. 3–20. seviyeler tek ustayla, dakikalardan günlere uzayan gerçek inşaatlardır. 1–3 yıldızlı sefer başarıları ileri aşamaları açar. Para ile hızlandırma yok.</small>
     </aside>
   </div>
 </section>`;
}
