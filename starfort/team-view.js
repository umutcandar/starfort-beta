/** Starfort v1.4 team arena. The browser renders state; all combat rules live on server. */
import {guildRequest,GUILD_TOKEN_KEY,guildMatchHistory} from './guild-client.js';
import {createMatchContinuity} from './match-continuity.js';
import {createMatchReceiptRecovery} from './match-receipts.js';
import {accountSession} from './account-auth.js';
import {ARENA_HERO_STYLES} from './arena-heroes.js';
import * as R from './rules.js';
import {trainingDifficulty,trainingLabel} from './training-difficulty.js';
import {createBattleRenderer} from './battle-render-adapter.js';
import {getPreferredBattleMode,savePreferredBattleMode} from './battle-render-preference.js';
import {battleExperience} from './battle-experience.js';
import {createBattleMotion,graphicsPreset} from './battle-motion.js';
import {setCanvasQuality,nextQuality,QUALITY_LABELS} from './graphics-display.js';
import {mountJoystick,combineMovement,battlePoint} from './mobile-controls.js';
import {drawBattleMinimap} from './battle-minimap.js';
import {battleObjective} from './battle-director.js';
import {rewardMode} from './battle-assist.js';
import {textKey as tx,longText as lt} from './locale-sections-v247.js';
import {teamText as tt} from './locale-team-v247.js';
import {displayHero} from './locale-heroes-v245.js';
import {getLocale} from './locale-v243.js';
const clean=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const orders={follow:'Beni takip et',push:'İlerleyin',hold:'Mevzileri koru',focus:'Hedefe odaklan'};
export function mountTeamArena(root){
  const token=accountSession()?.access_token||localStorage.getItem(GUILD_TOKEN_KEY)||'';
  const saved=R.restoreState(localStorage.getItem(R.STORAGE_KEY));
  const heroes=Object.entries(ARENA_HERO_STYLES).filter(([id])=>saved.heroes[id]);
  let heroId=heroes.some(([id])=>id===localStorage.getItem('starfort:arena-hero'))?localStorage.getItem('starfort:arena-hero'):heroes[0]?.[0]||'aldren';
  const policy=battleExperience(window.location,getPreferredBattleMode(localStorage),window.matchMedia?.('(pointer:coarse)').matches||false);
  let graphics=graphicsPreset(localStorage.getItem('starfort:graphics')||policy.defaultQuality);
  let renderMode=policy.renderMode;
  let selectedSquad='all';
  let botDifficulty=trainingDifficulty(localStorage.getItem('starfort:bot-difficulty'))||'normal';
  let minimapVisible=localStorage.getItem('starfort:minimap-visible')!=='false';
  const matchContinuity=createMatchContinuity(sessionStorage,'starfort:team-last-active');
  const receiptRecovery=createMatchReceiptRecovery({storage:localStorage,userId:accountSession()?.user?.id});
  const acceptMatch=next=>{
    if(receiptRecovery.remember(next)&&receiptRecovery.pending)void receiptRecovery.flush();
    return matchContinuity.accept(next);
  };
  let snapshot={status:'idle'},error='',seq=0,busy=false,disposed=false,raf=0,sending=0,checking=0,pendingBurst=false,pendingDash=false,pendingOrder=null,pendingFocus=null,pendingSquad='all',pendingAttack=false;
  const keys=new Set(),touch=new Set();
  const api=(endpoint,data=null)=>guildRequest('team/'+endpoint,token,data);
  root.innerHTML=`<header class="training-title"><div><span class="eyebrow">${lt('YILDIZ KALESİ · SANCAK MEYDANI','STAR KEEP · BANNER FIELDS')}</span><h2>${tt('title')}</h2><p>${lt('Kahramanını ve askerlerini yönet: sancakları ele geçir veya rakip klanın kalesini kuşat.','Command your hero and troops: capture both banners or lay siege to the enemy clan keep.')}</p></div><button class="secondary" data-close-view >${tt('backVillage')}</button></header><section class="match-history-panel"><button class="secondary" data-match-history aria-expanded="false">⚔ ${tt('matchHistory')}</button><div class="match-history-content" hidden aria-live="polite"></div></section>
  <div class="sf-portrait-hint" role="note">↻ <strong>${lt('Yatay oyun önerilir.','Landscape mode recommended.')}</strong> ${lt('Telefonu yana çvir; savaşta soldaki joystick ve sağdaki yetenek tuşlarını kullan.','Rotate your phone and use the joystick and skill buttons during combat.')}</div>
  <label class="sf-hero-choice">${tt('arenaHero')} <select id="starfort-hero-choice" aria-label="${tt('arenaHero')}">${heroes.map(([id,h])=>`<option value="${id}" ${heroId===id?'selected':''}>${h.name} · ${displayHero({...h,id}).title}</option>`).join('')}</select></label><div class="battle-graphics-control"><span>${tt('battleView')}</span><select id="team-render-mode" aria-label="${tt('battleView')}">${policy.graphicsLab?'<option value="3d">3B geliştirme laboratuvarı</option>':''}<option value="2d">${lt('Sinematik 2.5B · asıl oyun','Cinematic 2.5D · main game')}</option></select><small id="team-render-status">${lt('STARFORT sinematik savaş görünümü etkin','STARFORT cinematic battle mode enabled')}</small><span>${tt('graphicsQuality')}</span><select id="team-graphics" aria-label="${tt('graphicsQuality')}"><option value="ultra">Ultra</option><option value="balanced" >${lt('Dengeli','Balanced')}</option><option value="performance" >${lt('Performans','Performance')}</option></select>${policy.graphicsLab?`<a class="sf-3d-lab-link" href="./graphics-3d-preview.html" target="_blank" rel="noopener noreferrer">${lt('3B geliştirme sahnesi','3D development preview')}</a>`:''}</div>
  <p class="mode-lore">✦ <b>${lt('Kuzey Kapısı','Northern Gate')}:</b> ${lt('Şafak Muhafızları ve Gece Lejyonu sancakların kontrolü için savaşıyor. Kuşatmada koçbaşını koru, surları aş ve yıldız çekirdeğine ulaş.','Dawn Wardens and the Night Legion contest the banners. Escort the battering ram, breach the walls and reach the star core.')}</p>
  <section class="team-queue"><div><span class="online-dot"></span> <strong id="team-status" >${lt('Bağlanıyor…','Connecting…')}</strong><small id="team-detail">${policy.liveMatchmaking?lt('Canlı maç veya bot antrenmanı','Live match or bot training'):lt('Bu sürümde bot antrenmanları oynanabilir; canlı eşleşme özel sunucuda','Bot training is available; live matchmaking requires a dedicated server')}</small></div><button class="secondary" data-team-leave >${lt('Çık / Vazgeç','Exit / Cancel')}</button></section>
  <div class="mode-group-board" aria-label="${lt('Savaş türü seçimi','Choose a battle mode')}">
    <section class="mode-card" aria-label="${lt('Tek oyunculu savaşlar','Solo battles')}"><header><h3 >✦ ${tt('botTitle')}</h3><p>${lt('Yalnız başına bot birliklere karşı savaş. Sancak kap veya kaleyi kuşat. Derecesiz ve bağımsız eğitim.','Fight bot troops solo. Capture banners or siege a keep in independent unranked training.')}</p></header><label class="sf-difficulty-picker" for="team-bot-difficulty">${tt('botDifficulty')} <select id="team-bot-difficulty" aria-label="${tt('botDifficulty')}"><option value="easy" >${tt('easy')}</option><option value="normal" >${tt('normal')}</option><option value="hard" >${tt('hard')}</option></select></label><div class="mode-actions"><button class="secondary" data-team-bot="2">⚔ 2v2 ${tt('flags')}</button><button class="secondary" data-team-bot="5">⚔ 5v5 ${tt('flags')}</button><button class="primary" data-team-bot="5" data-team-variant="siege">🏰 ${tt('siege')}</button></div><small class="mode-note">${lt('Bot tatbikatı sınırlı kaynak ödülü verebilir; canlı PvP derecesi kazandırmaz.','Bot practice may grant limited local resources, but never a live PvP rank.')}</small></section>
    <section class="mode-card ${policy.liveMatchmaking?'':'is-unavailable'}" aria-label="${lt('Gerçek oyuncularla maç','Matches with real players')}"><header><h3 >⚑ ${tt('allianceFront')}</h3><p>${policy.liveMatchmaking?lt('Gerçek komutanlarla derecesiz sancak veya kale kuşatması eşleşmesine gir.','Play unranked banners or castle siege with real commanders.'):lt('GitHub Pages betasında gerçek oyunculu maç sunucusu aktif değil. Buradan bot tatbikatı oynayabilirsin.','Live matches are not available on this GitHub Pages beta. You can still train with bots.')}</p></header><div class="mode-actions"><button class="secondary" data-team-mode="2" ${policy.liveMatchmaking?'':'disabled'} >2v2 ${lt('Eşleşme','Matchmaking')}</button><button class="secondary" data-team-mode="5" ${policy.liveMatchmaking?'':'disabled'} >5v5 ${lt('Eşleşme','Matchmaking')}</button><button class="secondary" data-team-mode="5" data-team-variant="siege" ${policy.liveMatchmaking?'':'disabled'} >5v5 ${tt('siege')}</button><button class="secondary" data-team-party="2" disabled >${tt('party')} 2v2</button><button class="secondary" data-team-party="5" disabled >${tt('party')} 5v5</button><button class="secondary" data-team-party="5" data-team-variant="siege" disabled >${tt('party')} ${tt('siege')}</button></div><small class="mode-note">${policy.liveMatchmaking?lt('Bireysel gerçek eşleşmeler açık. Klan kadrosuyla eşleşme güvenli hesap geçişi sonrası açılacak.','Individual live matchmaking is available. Clan matchmaking is disabled until secure roster verification is complete.'):lt('Gerçek eşleşme ancak canlı Node oyun sunucusuna bağlanıldığında açılır.','Live matchmaking requires an active Node game server.')}</small></section>
  </div>
  <section class="team-match-hud"><div><b class="team-blue" >${tt('dawn').toLocaleUpperCase(getLocale())}</b><strong id="team-score-0">0</strong></div><span id="team-clock">03:00</span><div><strong id="team-score-1">0</strong><b class="team-red" >${tt('dusk').toLocaleUpperCase(getLocale())}</b></div></section>
  <div id="siege-status" class="siege-status" hidden></div>
  <div class="team-field"><div id="sf-objective-card" class="sf-objective-card" hidden><span id="sf-objective-title" >${lt('TAKTİK HEDEF','TACTICAL OBJECTIVE')}</span><p id="sf-objective-detail"></p><div class="sf-objective-track"><i id="sf-objective-progress"></i></div></div><canvas id="sf-tactical-map" width="180" height="112" aria-label="${lt('Canlı savaş mini haritası','Live battle minimap')}"></canvas><canvas width="1000" height="600" id="team-canvas" aria-label="${lt('Takım savaş alanı: WASD yön, J saldırı, Q yıldız darbesi, Space atılma, 1/2/3/4 asker komutları','Team battlefield: WASD movement, J attack, Q star strike, Space dash and 1/2/3/4 troop commands')}"></canvas><div class="sf-battle-bar"><button class="sf-back" data-close-view aria-label="${tt('backVillage')}">‹ ${lt('Köy','Village')}</button><span><strong>STARFORT</strong><small>${lt('Takım Muharebesi','Team Battle')}</small></span>${policy.graphicsLab?'<button data-sf-render aria-label="Deneysel 3B ve sinematik görünüm değiştir">✦ SİNEMATİK</button>':''}<button data-team-map aria-label="${lt('Mini haritayı gizle','Hide minimap')}" aria-pressed="true">▦ ${tt('map')}</button><button data-sf-graphics aria-label="${lt('Grafik kalitesini değiştir','Change graphics quality')}">✦ Ultra</button><button data-sf-fullscreen aria-label="${lt('Tam ekran yap','Enter fullscreen')}">⛶</button></div><div class="sf-joystick" aria-label="${lt('Kahraman hareket joysticki','Hero movement joystick')}" role="group"><div class="sf-joystick-rim"></div><div class="sf-joystick-thumb"></div><small >${tt('move').toLocaleUpperCase(getLocale())}</small></div><div class="sf-rotation-tip">↻ ${lt('En iyi deneyim için telefonu yatay çevir','Rotate your phone for the best experience')}</div><div id="team-overlay" class="arena-center-message cinematic-intro"><b >${tt('title').toLocaleUpperCase(getLocale())}</b><p>${lt('Klan maçı için İttifak → Savaş Odası bölümünde herkes hazır olmalı; lider eşleşmeyi başlatır.','For clan matches, every member must be ready in Alliance → War Room. The leader starts matchmaking.')}</p></div></div>
  <div class="sf-squad-command" role="group" aria-label="${lt('Hangi birlikler emir alacak','Choose which troops receive orders')}"><span >${lt('EMİR VERİLECEK BİRLİK','COMMAND GROUP')}</span><button type="button" data-squad-select="all" aria-pressed="true">⚔ ${tt('all')} <small>5</small></button><button type="button" data-squad-select="guard" aria-pressed="false">⛨ ${tt('vanguard')} <small>6</small></button><button type="button" data-squad-select="archer" aria-pressed="false">➹ ${tt('archers')} <small>7</small></button><output id="sf-squad-feedback" aria-live="polite" >${lt('Tüm birlikler seçili','All squads selected')}</output></div>
  <div class="team-combat"><div class="team-controls" aria-label="${lt('Kahraman yetenekleri','Hero skills')}"><button data-team-attack >${tx('attack')} <small>J</small></button><button data-team-burst>✦ ${tt('starStrike')} <small>Q</small></button><button data-team-dash>➤ ${tt('dash')} <small>Space</small></button></div><div class="team-controls team-orders" aria-label="${lt('Birlik komutları','Troop commands')}"><button data-team-order="follow">⚑ ${tt('follow')} <small>1</small></button><button data-team-order="push">⚔ ${tt('advance')} <small>2</small></button><button data-team-order="hold">⛨ ${tt('hold')} <small>3</small></button><button data-team-order="focus">◎ ${tt('focus')} <small>4</small></button></div></div>
  <div class="arena-touch team-touch" aria-label="${lt('Mobil yön tuşları','Mobile directional buttons')}"><button data-team-move="up">▲</button><div><button data-team-move="left">◀</button><button data-team-move="down">▼</button><button data-team-move="right">▶</button></div></div>
  <p class="arena-hint"><b>${lt('Kontroller','Controls')}:</b> ${lt('WASD / oklar hareket, J saldırı, Q büyü, Space kaçınma, M mini harita, 1–4 emirler, 5/6/7 tüm birlikler/öncü/okçular.','WASD / arrows to move, J attack, Q ability, Space dash, M minimap, 1–4 orders and 5/6/7 for all/vanguard/archers.')} ${lt('Düşmana dokunarak odak hedefi seçebilirsin. Sancak modunda iki bayrağı ele geçir. Kuşatmada saldıranlar koçbaşını koruyarak kapıya götürür, ardından yıldız çekirdeğini yıkar; savunanlar koçbaşını yok ederek saldırıyı geciktirir ve 3 dakika dayanır.','Tap enemies to focus fire. Capture both banners in flag mode. In siege, attackers escort the ram, breach the gate and destroy the star core. Defenders stop the ram and hold for three minutes.')} <b>${lt('Klan takımı','Clan team')}:</b> ${lt('İttifak/Savaş Odası bölümünden hazır ol, ardından lider Klan 2v2 veya Klan 5v5 ile eşleşmeyi başlatsın.','Mark yourself ready in Alliance/War Room and have the leader start clan 2v2 or 5v5 matchmaking.')} <b>${lt('Canlı oyuncu maçları derecesizdir. Bot antrenmanlarında sınırlı yerel kaynak ödülü alınabilir; PvP sıralaması etkilenmez.','Real-player matches are unranked. Bot practice may grant limited local resources; PvP ranking is unaffected.')}</b></p>`;
  const $=s=>root.querySelector(s);let canvas=$('#team-canvas');
  $('#team-bot-difficulty').value=botDifficulty;
  $('#starfort-hero-choice').addEventListener('change',e=>{const chosen=e.target.value;if(Object.hasOwn(ARENA_HERO_STYLES,chosen)){heroId=chosen;localStorage.setItem('starfort:arena-hero',chosen);}});
  $('#team-bot-difficulty').addEventListener('change',event=>{botDifficulty=trainingDifficulty(event.target.value)||'normal';localStorage.setItem('starfort:bot-difficulty',botDifficulty);});
  let selectedTarget=null;
  const motion=createBattleMotion();
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let renderer=createBattleRenderer(canvas,{quality:graphics,reducedMotion,renderMode});canvas=renderer.canvas;canvas.dataset.graphicsEngine=renderer.mode;
  function switchRenderMode(next){
    renderMode=savePreferredBattleMode(localStorage,policy.graphicsLab?next:'2d');
    if('team'==='team')canvas.removeEventListener('click',selectEnemy);
    renderer.dispose();const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;
    renderer=createBattleRenderer(canvas,{quality:graphics,reducedMotion,renderMode});canvas=renderer.canvas;canvas.dataset.graphicsEngine=renderer.mode;
    root.querySelector('#team-render-mode').value=renderMode;const toggle=root.querySelector('[data-sf-render]');if(toggle)toggle.textContent=renderMode==='3d'?'◈ 3B LAB':'✦ SİNEMATİK';
    const el=root.querySelector('#team-render-status');el.textContent=renderMode==='3d'&&renderer.mode!=='webgl3d'?'3B desteklenmedi, 2.5B yedek kullanılıyor':renderer.mode==='webgl3d'?'Deneysel geometri: düşük detaylı':'Sinematik 2.5B etkin';
    if('team'==='team')canvas.addEventListener('click',selectEnemy);resizeCanvas();
  }
  function resizeCanvas(){renderer.resize(graphics)}
  function updateGraphics(value){graphics=graphicsPreset(value);localStorage.setItem('starfort:graphics',graphics);$('#team-graphics').value=graphics;$('[data-sf-graphics]').textContent='✦ '+QUALITY_LABELS[graphics];resizeCanvas();}
  const joystick=mountJoystick($('.sf-joystick'));
  let rewarded=null;
  $('#team-render-mode').value=renderMode;$('#team-render-mode').addEventListener('change',e=>switchRenderMode(e.target.value));
  $('#team-render-status').textContent=renderMode==='3d'&&renderer.mode!=='webgl3d'?'3B desteklenmedi; 2.5B yedek kullanılıyor':renderer.mode==='webgl3d'?'Deneysel geometri: düşük detaylı':'Sinematik 2.5B etkin';
  $("#team-graphics").value=graphics;
  $("#team-graphics").addEventListener("change",e=>updateGraphics(e.target.value));
  const tacticalMap=$('#sf-tactical-map'),minimapContext=tacticalMap?.getContext('2d');let lastMiniPaint=-100;
  function updateMinimap(){root.classList.toggle('sf-minimap-hidden',!minimapVisible);const b=$('[data-team-map]');b.setAttribute('aria-pressed',String(minimapVisible));b.setAttribute('aria-label',minimapVisible?'Mini haritayı gizle':'Mini haritayı göster');b.textContent=minimapVisible?'▦ Harita':'▤ Harita';}
  updateMinimap();
  function draw(time=0){
    if(minimapVisible&&time-lastMiniPaint>=100){lastMiniPaint=time;drawBattleMinimap(minimapContext,snapshot.room,snapshot.you);}
    renderer.render(snapshot.room,snapshot.you,time/1000,{quality:graphics,motion,reducedMotion,selectedTarget,selectedSquad});
    raf=requestAnimationFrame(draw);
  }
  function status(){const state=snapshot.status,room=snapshot.room;
    const wasLive=root.classList.contains('sf-battle-live');root.classList.toggle('sf-battle-live',state==='active');document.body.classList.toggle('sf-combat-running',state==='active');if(wasLive!==(state==='active'))requestAnimationFrame(resizeCanvas);
    let headline='',detail='';if(error){headline=lt('BAĞLANTI HATASI','CONNECTION ERROR');detail=error;}else if(state==='interrupted'){headline=lt('MAÇ OTURUMU İPTAL','MATCH INTERRUPTED');detail=snapshot.message||lt('Sunucu yeniden başladı. Yenilgi yazılmadı; yeniden eşleşebilirsin.','The server restarted. No defeat was recorded; you can match again.');}else if(state==='idle'){headline=lt('SAVAŞI DENE','TRY A BATTLE');detail=lt('Botla hemen 2v2 veya kuşatma başlat; gerçek takım için diğer eşleşme düğmelerini kullan.','Start bot 2v2 or siege immediately. Use live matchmaking for a real team battle.');}else if(state==='waiting'){headline=`${snapshot.mode} · ${tt('waiting').toLocaleUpperCase(getLocale())}`;detail=snapshot.party?lt(`${snapshot.waiting}/${snapshot.required} oyuncu · Klan takımı sırada. Tüm üyeler bu ekranı açık tutmalı. Rakip klan da aynı formatı seçmeli.`,`${snapshot.waiting}/${snapshot.required} players · Clan team is queued. All members must keep this screen open; opponents must choose the same format.`):lt(`${snapshot.waiting}/${snapshot.required} oyuncu hazır. Diğer oyuncular farklı tarayıcı profillerinden aynı modu seçmeli.`,`${snapshot.waiting}/${snapshot.required} players ready. Other players need separate browser profiles and the same mode.`);}else if(state==='ended'){headline=room.winner===null?lt('BERABERE','DRAW'):room.players.find(p=>p.id===snapshot.you)?.team===room.winner?tx('victory'):lt('MAĞLUBİYET','DEFEAT');detail=room.reason==='disconnect'?lt('Bağlantı kesilmesi nedeniyle maç sona erdi.','Match ended due to disconnection.'):room.reason==='siege-victory'?lt('Kuşatanlar yıldız çekirdeğini ele geçirdi.','Attackers captured the star core.'):room.reason==='siege-defense'?lt('Savunmacılar 3 dakika boyunca kaleyi korudu.','Defenders held the castle for three minutes.'):lt('Yeni maça girmek için Çık ardından eşleşme seç.','Exit and select matchmaking to play again.');}
    if(state==='ended'&&room&&rewarded!==room.id){rewarded=room.id;const meEnd=room.players.find(p=>p.id===snapshot.you);if(room.isPractice)window.dispatchEvent(new CustomEvent('starfort:practice-result',{detail:{won:room.winner!==null&&meEnd?.team===room.winner,mode:rewardMode(room),matchId:room.id,difficulty:room.botDifficulty||botDifficulty}}));}
    if(state==='ended'&&!room?.isPractice&&receiptRecovery.pending)detail+=' · '+lt('Maç kaydı sunucuya yeniden gönderiliyor.','Resending match receipt to the server.');
    $('#team-overlay').hidden=state==='active'&&!error;$('#team-overlay').innerHTML=headline?`<b>${clean(headline)}</b><p>${clean(detail)}</p>`:'';
    $('#team-status').textContent=error?lt('Sunucuya bağlanılamıyor','Cannot connect to server'):({idle:tt('teamStatus'),interrupted:lt('Maç iptal edildi','Match cancelled'),waiting:tt('waiting'),active:lt('CANLI MUHAREBE','LIVE BATTLE'),ended:lt('Maç tamamlandı','Match complete')})[state]||lt('Hazırlanıyor','Preparing');
    $('#team-detail').textContent=room?`${room.guilds?room.guilds.join(' ⚔ '):clean(room.mode)} · ${room.players.map(p=>p.name).join(' · ')}` :lt('Sunucu doğrulamalı hareket, hasar ve birlik emirleri','Server-verified movement, damage and troop orders');
    $('#team-score-0').textContent=room?.score?.[0]??0;$('#team-score-1').textContent=room?.score?.[1]??0;
    const siege=room?.variant==='siege';
    $('.team-match-hud .team-blue').textContent=siege?tt('attackers').toLocaleUpperCase(getLocale()):tt('dawn').toLocaleUpperCase(getLocale());
    $('.team-match-hud .team-red').textContent=siege?tt('defenders').toLocaleUpperCase(getLocale()):tt('dusk').toLocaleUpperCase(getLocale());
    const directive=battleObjective(room,snapshot.you);const card=$('#sf-objective-card');card.hidden=state!=='active';
    card.classList.toggle('is-urgent',directive.urgent);$('#sf-objective-title').textContent=directive.title;$('#sf-objective-detail').textContent=directive.detail;$('#sf-objective-progress').style.width=directive.progress+'%';
    const goal=$('#siege-status');goal.hidden=!siege;
    if(siege){const r=room.siege.ram;const ramState=!r?'—':r.hp<=0?`${lt('Yıkıldı','Destroyed')} · ${Math.max(0,Math.ceil(r.respawnAt-room.elapsed))} ${lt('sn','sec')}`:`${r.hp}/${r.maxHp} · ${r.phase==='ramming'?lt('Kapıyı dövüyor','Ramming gate'):r.phase==='advancing'?lt('İlerliyor','Advancing'):lt('Muhafız bekliyor','Waiting for escort')}`;goal.textContent=`⚔ ${tt('siege')} · ${lt('Kapı','Gate')} ${room.siege.gate.hp}/${room.siege.gate.maxHp} · ${lt('Koçbaşı','Ram')} ${ramState} · ${lt('Kristal','Crystal')} ${room.siege.core.hp}/${room.siege.core.maxHp} · ${lt('Saldıranlar koçbaşına eskort olmalı; savunanlar koçbaşını vurabilir.','Attackers must escort the ram; defenders can destroy it.')}`;}
    const seconds=Math.max(0,180-(room?.elapsed||0));$('#team-clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
    root.querySelectorAll('[data-team-mode]').forEach(b=>b.disabled=!policy.liveMatchmaking||!token||!['idle','interrupted'].includes(state)||busy);
    root.querySelectorAll('[data-team-party]').forEach(b=>b.disabled=true);
    $('[data-team-leave]').disabled=!token||state==='idle'||busy;
    root.querySelectorAll('[data-team-bot]').forEach(b=>b.disabled=!token||state==='active'||busy);const me=room?.players.find(p=>p.id===snapshot.you);$('#team-detail').title=room?.isPractice?`${tt('botDifficulty')}: ${tt(room.botDifficulty)||trainingLabel(room.botDifficulty)} · ${lt('Derecesiz ve ödülsüz','Unranked and no rewards')}` :lt('Gerçek oyunculu takım maçı','Real-player team battle');
    $('[data-team-burst] small').textContent=me?.burstReady>0?me.burstReady.toFixed(1)+' '+lt('sn','sec'):'Q';$('[data-team-dash] small').textContent=me?.dashReady>0?me.dashReady.toFixed(1)+' '+lt('sn','sec'):'Space';
    const groups=room?.squads.filter(s=>s.ownerId===snapshot.you&&(selectedSquad==='all'||s.type===selectedSquad))||[];
    root.querySelectorAll('[data-team-order]').forEach(b=>b.classList.toggle('selected',groups.length>0&&groups.every(s=>s.order===b.dataset.teamOrder)));
    root.querySelectorAll('[data-squad-select]').forEach(b=>{const isSelected=b.dataset.squadSelect===selectedSquad;b.classList.toggle('selected',isSelected);b.setAttribute('aria-pressed',String(isSelected));});
    const ownSquads=room?.squads.filter(s=>s.ownerId===snapshot.you)||[];
    for(const b of root.querySelectorAll('[data-squad-select]')){
      const filtered=ownSquads.filter(s=>b.dataset.squadSelect==='all'||s.type===b.dataset.squadSelect);
      const hp=filtered.reduce((acc,s)=>acc+s.hp,0),maxHp=filtered.reduce((acc,s)=>acc+s.maxHp,0);
      b.title=maxHp?`${lt('Can','Health')} ${Math.ceil(hp)}/${maxHp}`:lt('Birlikler henüz savaş alanında değil','Troops are not on the battlefield yet');
    }
  }
  async function refresh(){if(disposed||busy||!token)return;try{snapshot=acceptMatch(await api('state'));if(Number.isSafeInteger(snapshot.inputSeq))seq=Math.max(seq,snapshot.inputSeq);error='';}catch(e){error=e.message;}if(!disposed)status();}
  async function start(size,variant='flags'){if(disposed||busy||!token||!policy.liveMatchmaking)return;busy=true;try{const data=await api('queue',{size,variant,heroId});snapshot=acceptMatch(data);error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function startBot(size,variant='flags'){if(disposed||busy||!token)return;busy=true;try{snapshot=acceptMatch(await api('bot',{size,variant,difficulty:botDifficulty,heroId}));error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function startParty(size,variant='flags'){if(disposed||busy||!token||!policy.liveMatchmaking)return;busy=true;try{snapshot=await api('party/queue',{size,variant});error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function leave(){if(disposed||busy||!token)return;busy=true;try{snapshot=await api('leave',{});error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function send(){if(disposed||busy||snapshot.status!=='active')return;
    const x=Number(keys.has('d')||keys.has('arrowright')||touch.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||touch.has('left'));
    const y=Number(keys.has('s')||keys.has('arrowdown')||touch.has('down'))-Number(keys.has('w')||keys.has('arrowup')||touch.has('up'));
    const axis=combineMovement(x,y,joystick.read());
    const data={seq:++seq,x:axis.x,y:axis.y,attack:keys.has('j')||touch.has('attack')||pendingAttack,burst:pendingBurst,dash:pendingDash};
    if(pendingOrder){data.order=pendingOrder;data.focus=pendingFocus;data.squad=pendingSquad;}
    pendingAttack=false;pendingBurst=false;pendingDash=false;pendingOrder=null;pendingFocus=null;pendingSquad='all';busy=true;
    try{snapshot=acceptMatch(await api('input',data));error='';}catch(e){error=e.message;if(data.order){pendingOrder=data.order;pendingFocus=data.focus;pendingSquad=data.squad;}if(data.burst)pendingBurst=true;if(data.dash)pendingDash=true;if(data.attack)pendingAttack=true;}
    finally{busy=false;if(!disposed)status();}
  }
  function selectSquad(value){if(!['all','guard','archer'].includes(value))return;selectedSquad=value;
    root.querySelectorAll('[data-squad-select]').forEach(b=>{const active=b.dataset.squadSelect===value;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
    $('#sf-squad-feedback').textContent=({all:tt('all'),guard:tt('vanguard'),archer:tt('archers')})[value]+' '+lt('seçildi','selected');
  }
  function order(value){pendingOrder=value;pendingFocus=value==='focus'?selectedTarget:null;pendingSquad=selectedSquad;
    $('#sf-squad-feedback').textContent=({all:tt('all'),guard:tt('vanguard'),archer:tt('archers')})[selectedSquad]+' · '+tt(({push:'advance',hold:'hold',focus:'focus',follow:'follow'})[value]||value);
  }
  function keyDown(event){if(!root.isConnected||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.ctrlKey||event.metaKey)return;const k=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','q',' ','1','2','3','4','5','6','7','m'].includes(k))event.preventDefault();keys.add(k);if(!event.repeat){if(k==='q')pendingBurst=true;if(k===' ')pendingDash=true;if('1234'.includes(k)&&k.length===1)order(['follow','push','hold','focus'][Number(k)-1]);if('567'.includes(k)&&k.length===1)selectSquad(['all','guard','archer'][Number(k)-5]);if(k==='m')toggleMinimap();}}
  function toggleMinimap(){minimapVisible=!minimapVisible;localStorage.setItem('starfort:minimap-visible',String(minimapVisible));updateMinimap();}
  function keyUp(e){keys.delete(e.key.toLowerCase());}
  async function toggleMatchHistory(){
    const panel=root.querySelector('.match-history-content'),button=root.querySelector('[data-match-history]');
    if(!panel.hidden){panel.hidden=true;button.setAttribute('aria-expanded','false');return;}
    panel.hidden=false;button.setAttribute('aria-expanded','true');panel.textContent=lt('Maç geçmişin yükleniyor…','Loading match history…');
    try{
      const rows=await guildMatchHistory(10);
      if(disposed)return;
      panel.innerHTML=rows.length?'<ul>'+rows.map(r=>
        '<li><b>'+clean(({win:tx('victory'),loss:lt('Yenilgi','Defeat'),draw:lt('Berabere','Draw'),cancel:tx('cancel')})[r.outcome]||tx('battle'))+
        '</b> · '+clean(r.mode||'')+' · '+clean(r.hero_id||'')+
        ' <small>'+clean(new Date(r.ended_at).toLocaleString(getLocale()))+'</small></li>'
      ).join('')+'</ul>' :`<p>${lt('Henüz kayıtlı gerçek oyuncu maçın yok.','No recorded real-player matches yet.')}</p>`;
    }catch(error){panel.textContent=lt('Maç geçmişine ulaşılamadı: ','Unable to load match history: ')+error.message;}
  }
  function click(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.hasAttribute('data-match-history')){void toggleMatchHistory();return;}if(b.dataset.squadSelect){selectSquad(b.dataset.squadSelect);return;}if(b.dataset.teamBot){startBot(Number(b.dataset.teamBot),b.dataset.teamVariant||'flags');return;}if(b.dataset.teamMode){start(Number(b.dataset.teamMode),b.dataset.teamVariant||'flags');return;}if(b.dataset.teamParty){startParty(Number(b.dataset.teamParty),b.dataset.teamVariant||'flags');return;}if(b.hasAttribute('data-team-leave')){leave();return;}if(b.hasAttribute('data-sf-render')){if(policy.graphicsLab)switchRenderMode(renderMode==='3d'?'2d':'3d');return;}if(b.hasAttribute('data-sf-graphics')){updateGraphics(nextQuality(graphics));return;}if(b.hasAttribute('data-team-map')){toggleMinimap();return;}if(b.hasAttribute('data-sf-fullscreen')){if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else root.requestFullscreen?.().catch(()=>{});return;}if(b.hasAttribute('data-team-attack'))pendingAttack=true;if(b.hasAttribute('data-team-burst'))pendingBurst=true;if(b.hasAttribute('data-team-dash'))pendingDash=true;if(b.dataset.teamOrder)order(b.dataset.teamOrder);}
  function selectEnemy(e){const room=snapshot.room,me=room?.players.find(p=>p.id===snapshot.you);if(!me)return;const rect=canvas.getBoundingClientRect();const point=renderer.mode==='webgl3d'?{x:(e.clientX-rect.left)/rect.width*1000,y:(e.clientY-rect.top)/rect.height*600}:battlePoint(e.clientX,e.clientY,rect,1000,600,getComputedStyle(canvas).objectFit);if(!point)return;const {x:pixelX,y:pixelY}=point;const {x:worldX,y:worldY}=renderer.toWorld(pixelX*10,pixelY*10);const x=worldX/10,y=worldY/10;let best=null,bestDist=4;for(const p of room.players){if(p.team===me.team||p.hp<=0)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bestDist){best=p;bestDist=d;}}if(best){selectedTarget=best.id;order('focus');}}
  function pointerDown(e){const b=e.target.closest('[data-team-move],[data-team-attack]');if(!b)return;e.preventDefault();touch.add(b.dataset.teamMove||'attack');try{b.setPointerCapture?.(e.pointerId)}catch{}}
  function pointerUp(e){const b=e.target.closest('[data-team-move],[data-team-attack]');if(b)touch.delete(b.dataset.teamMove||'attack');}
  function blur(){keys.clear();touch.clear();joystick.reset();}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);root.addEventListener('click',click);root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointerup',pointerUp);root.addEventListener('pointercancel',pointerUp);canvas.addEventListener('click',selectEnemy);
  window.addEventListener('resize',resizeCanvas);updateGraphics(graphics);
  if(!token)error='Önce İttifak sekmesinden yerel komutan hesabı oluştur.';else refresh();status();raf=requestAnimationFrame(draw);sending=setInterval(send,135);checking=setInterval(()=>{if(!busy)refresh();if(receiptRecovery.pending)void receiptRecovery.flush()},1100);
  return ()=>{disposed=true;joystick.dispose();root.classList.remove('sf-battle-live');document.body.classList.remove('sf-combat-running');clearInterval(sending);clearInterval(checking);cancelAnimationFrame(raf);window.removeEventListener('resize',resizeCanvas);motion.reset();renderer.dispose();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);root.removeEventListener('click',click);root.removeEventListener('pointerdown',pointerDown);root.removeEventListener('pointerup',pointerUp);root.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('click',selectEnemy);if(snapshot.status==='active'||snapshot.status==='waiting')api('leave',{}).catch(()=>{});};
}
