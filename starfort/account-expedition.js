import {STAGES,ITEMS,HEROES,teamPower} from './rules.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>new Intl.NumberFormat('tr-TR').format(v);
const names={win:'Sefer zaferi',hero:'Kahraman eğitimi',forge:'Ekipman üretimi',maze:'Labirent katı'};
function progressBadges(account){
 const pieces=[['win','Sefer'],['hero','Kahraman'],['forge','Demirhane'],['maze','Labirent'],['rift','Yarık'],['veteran','Usta']];
 return pieces.map(([k,label])=>`<span><b>${n(account.counters[k]||0)}</b><small>${label}</small></span>`).join('');
}
export function accountExpeditionMarkup(game,account,now=Date.now()){
 if(!account)return `<section class="guild-panel server-expedition"><h2>Sunucu seferleri</h2><p>Hesap ilerlemesi doğrulanıyor. Yerel kayıtlar buraya aktarılmaz.</p><button class="secondary" data-village-refresh>Yeniden bağlan</button></section>`;
 const cleared=new Set(account.cleared),mission=account.mission,report=account.lastReport;
 const next=Math.min(8,cleared.size+1);
 const rows=STAGES.map(stage=>{
  const done=cleared.has(stage.id),stars=account.campaignStars[stage.id]||0,open=stage.id<=next;
  return `<article class="server-stage-card ${done?'complete':''}"><div><small>BÖLGE ${stage.id.toString().padStart(2,'0')} · ${done?'TEMİZLENDİ':open?'AÇIK':'KİLİTLİ'}</small><h3>${esc(stage.name)}</h3><span aria-label="${stars} yıldız" class="server-star-row">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span><p>${esc(stage.description)}</p><small>Önerilen takım gücü: ${n(stage.recommendedPower)}</small></div>
  <button class="${done?'secondary':'primary'}" data-account-stage="${stage.id}" ${!open||mission?'disabled':''}>${mission?'Savaş sürüyor':done?'Yeniden sefer':'⚔ Sunucu seferine gir'}</button></article>`;
 }).join('');
 const wait=mission?Math.max(0,3000-(now-mission.lastTurnAt)):0;
 const campaignHeader=`<header class="server-progress-header"><div><span class="eyebrow">KOMUTAN HESABI · DOĞRULANMIŞ SEFERLER</span><h2>Kuzey Seferleri</h2><p>Gerçek kaynaklar, savaş sonucu ve ganimet sunucuda hesaplanır. Yerel kayıt veya değiştirilmiş savaş ekranı ödül kazandıramaz.</p></div><button class="secondary" data-close-view>Köye dön</button></header>`;
 const missionUi=mission?`<article class="server-mission" aria-label="Devam eden sunucu savaşı"><div class="server-mission-header"><span class="eyebrow">⚔ CANLI SUNUCU MUHAREBESİ</span><h3>${esc(STAGES[mission.stage-1]?.name||'Yıldız Seferi')} · TUR ${mission.turn+1}</h3><p>${mission.mode==='maze'?'Labirent katı '+mission.floor:mission.mode==='rift'?'Haftalık Yarık':mission.mode==='veteran'?'Usta seferi '+mission.tier:'Hikâye seferi'} · Takımın her hamlesi sunucuda sonuçlandırılır.</p></div>
 <div class="server-health"><div><strong>Takımın</strong><span>${n(mission.playerHp)} / ${n(mission.playerMaxHp)}</span><progress max="${mission.playerMaxHp}" value="${mission.playerHp}"></progress></div><div><strong>${esc(STAGES[mission.stage-1]?.enemyName||'Muhafız')}</strong><span>${n(mission.enemyHp)} / ${n(mission.enemyMaxHp)}</span><progress max="${mission.enemyMaxHp}" value="${mission.enemyHp}"></progress></div></div>
 <p class="server-combat-hint">Son hamle: ${esc(mission.lastAction)} · Rakibin saldırısı ve hasar hesabı sunucuda. ${wait?'Yaklaşık '+Math.ceil(wait/1000)+' sn bekle.':'Komut verebilirsin.'}</p>
 <div class="server-moves"><button class="primary" data-account-turn="strike" ${wait?'disabled':''}>⚔ Saldır</button><button class="secondary" data-account-turn="guard" ${wait?'disabled':''}>🛡 Savun</button><button class="secondary" data-account-turn="skill" ${wait?'disabled':''}>✦ Yetenek</button><button class="text-button" data-account-abandon>Çekil</button></div></article>`:'';
 const resultUi=!mission&&report?`<article class="server-mission-result ${report.won?'win':'loss'}"><strong>${report.won?'★ SUNUCU ZAFERİ':'SEFER TAMAMLANAMADI'} ${report.stars?' · '+'★'.repeat(report.stars):''}</strong><p>${report.won?esc(STAGES[report.stage-1]?.name||'Sefer')+' · '+report.turns+' turda kazanıldı. Kaynaklar sunucu kasasına işlendi.':report.abandoned?'Komutan geri çekildi. Yeni bir sefer başlatabilirsin.':'Savaş kaybedildi. Takımını geliştirerek yeniden dene.'}</p>${report.won?`<small>${Object.entries(report.reward||{}).map(([id,value])=>n(value)+' '+esc(id)).join(' · ')}</small>`:''}</article>`:'';
 const rankTitles=[['Sınır Nöbetçisi',5],['Yıldız Ustası',20],['Kuzey Muhafızı',40]];
 const count=Object.values(account.counters).reduce((a,b)=>a+b,0);
 return `<section class="server-expedition">${campaignHeader}
  <div class="server-summary"><div><b>${cleared.size} / 8</b><small>Hikâye bölgesi</small></div><div><b>${Object.values(account.campaignStars).reduce((a,b)=>a+b,0)} / 24</b><small>Sefer yıldızı</small></div><div><b>${n(teamPower(game))}</b><small>Sunucu takım gücü</small></div><div><b>${n(account.mazeFloor)} / 16</b><small>Labirent</small></div></div>
  ${missionUi}${resultUi}
  <section class="server-chapters"><h3>Yıldız Yolu · 8 Hikâye Bölgesi</h3><div class="server-stage-grid">${rows}</div></section>
  <section class="server-modes"><article><h3>✦ Usta Seferleri</h3><p>Eski bölümleri artan güçlükte yeniden tamamla; mühürler kalıcıdır.</p><div class="server-mode-actions">${STAGES.filter(x=>cleared.has(x.id)).map(x=>`<button class="secondary" data-account-veteran="${x.id}:${Math.min(3,(account.veteranMedals[x.id]||0)+1)}" ${mission?'disabled':''}>${esc(x.name)} · Kademe ${Math.min(3,(account.veteranMedals[x.id]||0)+1)}</button>`).join('')||'<small>İlk hikâye zaferinden sonra açılır.</small>'}</div></article>
  <article><h3>✧ 16 Kat Labirent</h3><p>Sunucu tarafından doğrulanmış kat savaşı. Tamamlanan katlar kaybolmaz.</p><button class="primary" data-account-maze ${mission||account.mazeFloor>=16||cleared.size<Math.ceil((account.mazeFloor+1)/2)?'disabled':''}>Kat ${Math.min(16,account.mazeFloor+1)} · Muhafızla savaş</button></article>
  <article><h3>☼ Haftalık Yıldız Yarığı</h3><p>Hikâye tamamlanınca her hafta tek resmî ödül.</p><button class="secondary" data-account-rift ${mission||cleared.size<8?'disabled':''}>Haftanın sınavı</button></article></section>
  <section class="server-contracts"><h3>Sunucu Komutan Görevleri</h3><p>Ödüller yalnızca doğrulanmış hamle ve ilerlemelerden oluşur.</p><div class="server-progress-counters">${progressBadges(account)}</div><div class="server-mode-actions">${Object.keys(names).map(id=>`<button class="secondary" data-account-contract="${id}">${names[id]} görev ödülü</button>`).join('')}</div></section>
  <section class="server-titles"><h3>Kalıcı Komutan Unvanları</h3><div class="server-mode-actions">${rankTitles.map(([title,need])=>`<button class="secondary" data-account-title="${esc(title)}" ${count<need||account.titles.includes(title)?'disabled':''}>${account.titles.includes(title)?'✓ ':''}${esc(title)} · ${count}/${need}</button>`).join('')}</div></section>
  <p class="server-expedition-note">Bütün sunucu ödülleri tek hesabın kasasına işlenir. Hesapsız deneme savaşları, yerel sözleşmeler ve bot antrenmanları sunucu kaynaklarını artırmaz.</p></section>`;
}
