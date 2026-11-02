import {STAGES,ITEMS,HEROES,teamPower} from './rules.js';
import {officialCombatScene} from './official-combat-scene.js';
import {realmMapMarkup} from './realm-map.js';
import {officialNextGoal,officialNextGoalMarkup} from './official-progress-coach.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>new Intl.NumberFormat('tr-TR').format(v);
const names={win:'Sefer zaferi',hero:'Kahraman eğitimi',forge:'Ekipman üretimi',maze:'Labirent katı'};
function progressBadges(account){
 const pieces=[['win','Sefer'],['hero','Kahraman'],['forge','Demirhane'],['maze','Labirent'],['rift','Yarık'],['veteran','Usta']];
 return pieces.map(([k,label])=>`<span><b>${n(account.counters[k]||0)}</b><small>${label}</small></span>`).join('');
}
export function accountExpeditionMarkup(game,account,now=Date.now(),selectedRealm=null,combatDelta=null){
 if(!account)return `<section class="guild-panel server-expedition"><h2>Sunucu seferleri</h2><p>Hesap ilerlemesi doğrulanıyor. Yerel kayıtlar buraya aktarılmaz.</p><button class="secondary" data-village-refresh>Yeniden bağlan</button></section>`;
 const cleared=new Set(account.cleared),mission=account.mission,report=account.lastReport;
 const next=Math.min(8,cleared.size+1);
 const rows=STAGES.map(stage=>{
  const done=cleared.has(stage.id),stars=account.campaignStars[stage.id]||0,open=stage.id<=next;
  return `<article class="server-stage-card ${done?'complete':''}"><div><small>BÖLGE ${stage.id.toString().padStart(2,'0')} · ${done?'TEMİZLENDİ':open?'AÇIK':'KİLİTLİ'}</small><h3>${esc(stage.name)}</h3><span aria-label="${stars} yıldız" class="server-star-row">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span><p>${esc(stage.description)}</p><small>Önerilen takım gücü: ${n(stage.recommendedPower)}</small></div>
  <button class="${done?'secondary':'primary'}" data-account-stage="${stage.id}" ${!open||mission?'disabled':''}>${mission?'Savaş sürüyor':done?'Yeniden sefer':'⚔ Sunucu seferine gir'}</button></article>`;
 }).join('');
 const wait=mission?Math.max(0,3000-(now-mission.lastTurnAt)):0;
 const heroAbilities=mission?(game.team||[]).map(id=>HEROES.find(h=>h.id===id)).filter(Boolean).map(hero=>{
  const until=Math.max(0,(mission.cooldowns?.[hero.id]||0)-(mission.turn+1));
  return `<button class="official-hero-ability" data-account-turn="skill:${hero.id}" ${wait||until?'disabled':''} title="${esc(hero.skill)}"><img src="assets/${hero.id}.webp" alt=""><span><b>${esc(hero.name)}</b><small>${until?'Yenileniyor · '+until+' tur':esc(hero.role==='healer'?'Şifa':hero.role==='tank'?'Siper':'Özel saldırı')}</small></span></button>`;
 }).join(''):'';
 const campaignHeader=`<header class="server-progress-header"><div><span class="eyebrow">KOMUTAN HESABI · DOĞRULANMIŞ SEFERLER</span><h2>Kuzey Seferleri</h2><p>Gerçek kaynaklar, savaş sonucu ve ganimet sunucuda hesaplanır. Yerel kayıt veya değiştirilmiş savaş ekranı ödül kazandıramaz.</p></div><div class="official-server-actions"><button class="secondary" data-village-refresh aria-label="Sunucu savaşını yeniden doğrula">↻ Sunucuyu yenile</button><button class="secondary" data-close-view>Köye dön</button></div></header>`;
 const deltaUi=mission&&combatDelta&&!combatDelta.initial&&combatDelta.turn===mission.turn?
  `<div class="official-damage-summary" role="status"><span>⚔ Sunucu hasarı: <b>${n(combatDelta.damage)}</b></span><span>🛡 Alınan hasar: <b>${n(combatDelta.received)}</b></span><small>Doğrulanmış ${n(combatDelta.turn)}. tur</small></div>`:'';
 const intent=mission?.enemyIntent||'strike';
 const nextAttack={strike:{icon:'⚔',name:'Normal Saldırı',hint:'Normal hasar. İstersen saldırıya geç.'},crush:{icon:'☄',name:'Ağır Darbe',hint:'Siper komutunu kullan: ağır darbeyi büyük ölçüde engellersin.'},shield:{icon:'🛡',name:'Kalkan Savunması',hint:'Özel kahraman yetenekleri düşmanın kalkanını deler.'},drain:{icon:'☾',name:'Can Emme',hint:'Düşman hasar verdiğinde kendini iyileştirir. Güçlü saldırıya yönel.'}}[intent];
 const missionUi=mission?`<article class="server-mission" aria-label="Devam eden sunucu savaşı"><div class="server-mission-header"><span class="eyebrow">⚔ CANLI SUNUCU MUHAREBESİ</span><h3>${esc(mission.mode==='boss'?'Küllerin Kadim Hükümdarı':STAGES[mission.stage-1]?.name||'Yıldız Seferi')} · TUR ${mission.turn+1}</h3><p>${mission.mode==='boss'?'Haftalık ortak dünya patronu':mission.mode==='maze'?'Labirent katı '+mission.floor:mission.mode==='rift'?'Haftalık Yarık':mission.mode==='veteran'?'Usta seferi '+mission.tier:'Hikâye seferi'} · Takımın her hamlesi sunucuda sonuçlandırılır.</p></div>
 ${officialCombatScene(game,mission)}
 ${deltaUi}
 <aside class="server-enemy-intent intent-${intent}" aria-label="Düşmanın sıradaki hamlesi"><span class="intent-symbol">${nextAttack.icon}</span><div><strong>Sıradaki düşman hamlesi: ${nextAttack.name}</strong><small>${nextAttack.hint}</small></div></aside>
 <div class="server-health"><div><strong>Takımın</strong><span>${n(mission.playerHp)} / ${n(mission.playerMaxHp)}</span><progress max="${mission.playerMaxHp}" value="${mission.playerHp}"></progress></div><div><strong>${esc(mission.mode==='boss'?'Kadim Hükümdar':STAGES[mission.stage-1]?.enemyName||'Muhafız')}</strong><span>${n(mission.enemyHp)} / ${n(mission.enemyMaxHp)}</span><progress max="${mission.enemyMaxHp}" value="${mission.enemyHp}"></progress></div></div>
 <p class="server-combat-hint">Son hamle: ${esc(mission.lastAction)} · Rakibin saldırısı ve hasar hesabı sunucuda. <span data-server-wait>${wait?'Yaklaşık '+Math.ceil(wait/1000)+' sn bekle.':'Komut verebilirsin.'}</span></p>
 <div class="official-hero-ability-strip" aria-label="Sunucu doğrulamalı kahraman yetenekleri">${heroAbilities}</div>
 <div class="server-moves"><button class="primary" data-account-turn="strike" ${wait?'disabled':''}>⚔ Saldır</button><button class="secondary" data-account-turn="guard" ${wait?'disabled':''}>🛡 Savun</button><button class="secondary" data-account-turn="skill" ${wait?'disabled':''}>✦ Yetenek</button><button class="text-button" data-account-abandon>Çekil</button></div></article>`:'';
 const resultUi=!mission&&report?`<article class="server-mission-result ${report.won?'win':'loss'}"><strong>${report.won?'★ SUNUCU ZAFERİ':'SEFER TAMAMLANAMADI'} ${report.stars?' · '+'★'.repeat(report.stars):''}</strong><p>${report.won?esc(STAGES[report.stage-1]?.name||'Sefer')+' · '+report.turns+' turda kazanıldı. Kaynaklar sunucu kasasına işlendi.':report.abandoned?'Komutan geri çekildi. Yeni bir sefer başlatabilirsin.':'Savaş kaybedildi. Takımını geliştirerek yeniden dene.'}</p>${report.won?`<small>${Object.entries(report.reward||{}).map(([id,value])=>n(value)+' '+esc(id)).join(' · ')}</small>`:''}</article>`:'';
 const rankTitles=[['Sınır Nöbetçisi',5],['Yıldız Ustası',20],['Kuzey Muhafızı',40]];
 const count=Object.values(account.counters).reduce((a,b)=>a+b,0);
 return `<section class="server-expedition">${campaignHeader}
  ${officialNextGoalMarkup(officialNextGoal(game,account,now))}
  <div class="server-summary"><div><b>${cleared.size} / 8</b><small>Hikâye bölgesi</small></div><div><b>${Object.values(account.campaignStars).reduce((a,b)=>a+b,0)} / 24</b><small>Sefer yıldızı</small></div><div><b>${n(teamPower(game))}</b><small>Sunucu takım gücü</small></div><div><b>${n(account.mazeFloor)} / 16</b><small>Labirent</small></div></div>
  ${missionUi}${resultUi}
  ${realmMapMarkup(account,{selected:selectedRealm})}
  ${(() => {const b=account.worldBoss||{week:"",goal:4500,damage:0,victories:0,claimed:false};const ready=account.cleared.length>=4,complete=b.damage>=b.goal;return `<section class="official-world-boss" aria-label="Haftalık ortak dünya patronu"><div class="official-boss-emblem">☄</div><div class="official-boss-info"><span class="eyebrow">HAFTALIK ORTAK DÜNYA PATRONU · ${esc(b.week||"Yıldız Savaşı")}</span><h3>Küllerin Kadim Hükümdarı</h3><p>Her gerçek oyuncunun doğrulanmış zaferi dünya patronuna hasar verir. Ortak hedefe katkı yapanlar ödülü bir kez alabilir.</p><div class="boss-week-progress"><span style="width:${Math.round(Math.min(1,b.damage/b.goal)*100)}%"></span></div><small>${n(b.damage)} / ${n(b.goal)} ortak hasar · ${n(b.victories)} galibiyet · ${ready?"Sefer açık":"4 hikâye bölgesi gerekli"}</small></div><div class="official-boss-actions"><button class="primary" data-account-boss ${!ready||mission||account.bossWeek===b.week?"disabled":""}>${account.bossWeek===b.week?"Bu hafta tamamlandı":"Dünya patronuna saldır"}</button><button class="secondary" data-account-boss-claim ${!complete||b.claimed||account.bossWeek!==b.week?"disabled":""}>${b.claimed?"Ortak ödül alındı":"Ortak ödül sandığı"}</button></div></section>`})()}

  <section class="server-chapters"><h3>Bölge Listesi · 8 Hikâye Bölgesi</h3><div class="server-stage-grid">${rows}</div></section>
  <section class="server-modes"><article><h3>✦ Usta Seferleri</h3><p>Eski bölümleri artan güçlükte yeniden tamamla; mühürler kalıcıdır.</p><div class="server-mode-actions">${STAGES.filter(x=>cleared.has(x.id)).map(x=>`<button class="secondary" data-account-veteran="${x.id}:${Math.min(3,(account.veteranMedals[x.id]||0)+1)}" ${mission?'disabled':''}>${esc(x.name)} · Kademe ${Math.min(3,(account.veteranMedals[x.id]||0)+1)}</button>`).join('')||'<small>İlk hikâye zaferinden sonra açılır.</small>'}</div></article>
  <article><h3>✧ 16 Kat Labirent</h3><p>Sunucu tarafından doğrulanmış kat savaşı. Tamamlanan katlar kaybolmaz.</p><button class="primary" data-account-maze ${mission||account.mazeFloor>=16||cleared.size<Math.ceil((account.mazeFloor+1)/2)?'disabled':''}>Kat ${Math.min(16,account.mazeFloor+1)} · Muhafızla savaş</button></article>
  <article><h3>☼ Haftalık Yıldız Yarığı</h3><p>Hikâye tamamlanınca her hafta tek resmî ödül.</p><button class="secondary" data-account-rift ${mission||cleared.size<8?'disabled':''}>Haftanın sınavı</button></article></section>
  <section class="server-contracts"><h3>Sunucu Komutan Görevleri</h3><p>Ödüller yalnızca doğrulanmış hamle ve ilerlemelerden oluşur.</p><div class="server-progress-counters">${progressBadges(account)}</div><div class="server-mode-actions">${Object.keys(names).map(id=>`<button class="secondary" data-account-contract="${id}">${names[id]} görev ödülü</button>`).join('')}</div></section>
  <section class="server-titles"><h3>Kalıcı Komutan Unvanları</h3><div class="server-mode-actions">${rankTitles.map(([title,need])=>`<button class="secondary" data-account-title="${esc(title)}" ${count<need||account.titles.includes(title)?'disabled':''}>${account.titles.includes(title)?'✓ ':''}${esc(title)} · ${count}/${need}</button>`).join('')}</div></section>
  <p class="server-expedition-note">Sunucu hesaplarına gerçek zaferler ve paylaşımlı patron katkıları işlenir. Görsel savaş alanı aynı karakter çizimlerini kullanır; savaşın sonucunu, ganimeti ve ödül miktarını sunucu hesaplar. Bütün sunucu ödülleri tek hesabın kasasına işlenir. Hesapsız deneme savaşları, yerel sözleşmeler ve bot antrenmanları sunucu kaynaklarını artırmaz.</p></section>`;
}
