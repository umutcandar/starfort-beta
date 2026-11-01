/** Starfort v1.4 team arena. The browser renders state; all combat rules live on server. */
import {guildRequest,GUILD_TOKEN_KEY} from './guild-client.js';
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
const clean=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const orders={follow:'Beni takip et',push:'İlerleyin',hold:'Mevzileri koru',focus:'Hedefe odaklan'};
export function mountTeamArena(root){
  const token=localStorage.getItem(GUILD_TOKEN_KEY)||'';
  const policy=battleExperience(window.location,getPreferredBattleMode(localStorage),window.matchMedia?.('(pointer:coarse)').matches||false);
  let graphics=graphicsPreset(localStorage.getItem('starfort:graphics')||policy.defaultQuality);
  let renderMode=policy.renderMode;
  let selectedSquad='all';
  let botDifficulty=trainingDifficulty(localStorage.getItem('starfort:bot-difficulty'))||'normal';
  let minimapVisible=localStorage.getItem('starfort:minimap-visible')!=='false';
  let snapshot={status:'idle'},error='',seq=0,busy=false,disposed=false,raf=0,sending=0,checking=0,pendingBurst=false,pendingDash=false,pendingOrder=null,pendingFocus=null,pendingSquad='all',pendingAttack=false;
  const keys=new Set(),touch=new Set();
  const api=(endpoint,data=null)=>guildRequest('team/'+endpoint,token,data);
  root.innerHTML=`<header class="training-title"><div><span class="eyebrow">YILDIZ KALESİ · SANCAK MEYDANI</span><h2>İki Sancak ve Kale Kuşatması</h2><p>Kahramanını ve askerlerini yönet: sancakları ele geçir veya rakip klanın kalesini kuşat.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
  <div class="sf-portrait-hint" role="note">↻ <strong>Yatay oyun önerilir.</strong> Telefonu yana çevir; savaşta soldaki joystick ve sağdaki yetenek tuşlarını kullan.</div>
  <div class="battle-graphics-control"><span>SAVAŞ GÖRÜNÜMÜ</span><select id="team-render-mode" aria-label="Savaş görünümü">${policy.graphicsLab?'<option value="3d">3B geliştirme laboratuvarı</option>':''}<option value="2d">Sinematik 2.5B · asıl oyun</option></select><small id="team-render-status">STARFORT sinematik savaş görünümü etkin</small><span>GÖRÜNTÜ KALİTESİ</span><select id="team-graphics" aria-label="Grafik kalitesi"><option value="ultra">Ultra</option><option value="balanced">Dengeli</option><option value="performance">Performans</option></select>${policy.graphicsLab?'<a class="sf-3d-lab-link" href="./graphics-3d-preview.html" target="_blank" rel="noopener noreferrer">3B geliştirme sahnesi</a>':''}</div>
  <p class="mode-lore">✦ <b>Kuzey Kapısı:</b> Şafak Muhafızları ve Gece Lejyonu sancakların kontrolü için savaşıyor. Kuşatmada koçbaşını koru, surları aş ve yıldız çekirdeğine ulaş.</p>
  <section class="team-queue"><div><span class="online-dot"></span> <strong id="team-status">Bağlanıyor…</strong><small id="team-detail">${policy.liveMatchmaking?'Canlı maç veya bot antrenmanı':'Bu sürümde bot antrenmanları oynanabilir; canlı eşleşme özel sunucuda'}</small></div><button class="secondary" data-team-leave>Çık / Vazgeç</button></section>
  <div class="mode-group-board" aria-label="Savaş türü seçimi">
    <section class="mode-card" aria-label="Tek oyunculu savaşlar"><header><h3>✦ Sefer Tatbikatı</h3><p>Yalnız başına bot birliklere karşı savaş. Sancak kap veya kaleyi kuşat. Derecesiz ve bağımsız eğitim.</p></header><label class="sf-difficulty-picker" for="team-bot-difficulty">Bot seviyesi <select id="team-bot-difficulty" aria-label="Bot seviyesi"><option value="easy">Kolay</option><option value="normal">Normal</option><option value="hard">Zor</option></select></label><div class="mode-actions"><button class="secondary" data-team-bot="2">⚔ 2v2 Sancak</button><button class="secondary" data-team-bot="5">⚔ 5v5 Sancak</button><button class="primary" data-team-bot="5" data-team-variant="siege">🏰 Kale Kuşatması</button></div><small class="mode-note">Bot tatbikatı sınırlı kaynak ödülü verebilir; canlı PvP derecesi kazandırmaz.</small></section>
    <section class="mode-card ${policy.liveMatchmaking?'':'is-unavailable'}" aria-label="Gerçek oyuncularla maç"><header><h3>⚑ İttifak Cephesi</h3><p>${policy.liveMatchmaking?'Gerçek komutanlarla derecesiz sancak veya kale kuşatması eşleşmesine gir.':'GitHub Pages betasında gerçek oyunculu maç sunucusu aktif değil. Buradan bot tatbikatı oynayabilirsin.'}</p></header><div class="mode-actions"><button class="secondary" data-team-mode="2" ${policy.liveMatchmaking?'':'disabled'}>2v2 Eşleşme</button><button class="secondary" data-team-mode="5" ${policy.liveMatchmaking?'':'disabled'}>5v5 Eşleşme</button><button class="secondary" data-team-mode="5" data-team-variant="siege" ${policy.liveMatchmaking?'':'disabled'}>5v5 Kuşatma</button><button class="secondary" data-team-party="2" ${policy.liveMatchmaking?'':'disabled'}>Klan 2v2</button><button class="secondary" data-team-party="5" ${policy.liveMatchmaking?'':'disabled'}>Klan 5v5</button><button class="secondary" data-team-party="5" data-team-variant="siege" ${policy.liveMatchmaking?'':'disabled'}>Klan Kuşatması</button></div><small class="mode-note">${policy.liveMatchmaking?'Klan savaşı için İttifak → Savaş Odası bölümünde oyuncular hazır olmalı.':'Gerçek eşleşme ancak canlı Node oyun sunucusuna bağlanıldığında açılır.'}</small></section>
  </div>
  <section class="team-match-hud"><div><b class="team-blue">ŞAFAK MUHAFIZLARI</b><strong id="team-score-0">0</strong></div><span id="team-clock">03:00</span><div><strong id="team-score-1">0</strong><b class="team-red">GECE LEJYONU</b></div></section>
  <div id="siege-status" class="siege-status" hidden></div>
  <div class="team-field"><div id="sf-objective-card" class="sf-objective-card" hidden><span id="sf-objective-title">TAKTİK HEDEF</span><p id="sf-objective-detail"></p><div class="sf-objective-track"><i id="sf-objective-progress"></i></div></div><canvas id="sf-tactical-map" width="180" height="112" aria-label="Canlı savaş mini haritası"></canvas><canvas width="1000" height="600" id="team-canvas" aria-label="Takım savaş alanı: WASD yön, J saldırı, Q yıldız darbesi, Space atılma, 1/2/3/4 asker komutları"></canvas><div class="sf-battle-bar"><button class="sf-back" data-close-view aria-label="Köye dön">‹ Köy</button><span><strong>STARFORT</strong><small>Takım Muharebesi</small></span>${policy.graphicsLab?'<button data-sf-render aria-label="Deneysel 3B ve sinematik görünüm değiştir">✦ SİNEMATİK</button>':''}<button data-team-map aria-label="Mini haritayı gizle" aria-pressed="true">▦ Harita</button><button data-sf-graphics aria-label="Grafik kalitesini değiştir">✦ Ultra</button><button data-sf-fullscreen aria-label="Tam ekran yap">⛶</button></div><div class="sf-joystick" aria-label="Kahraman hareket joysticki" role="group"><div class="sf-joystick-rim"></div><div class="sf-joystick-thumb"></div><small>HAREKET</small></div><div class="sf-rotation-tip">↻ En iyi deneyim için telefonu yatay çevir</div><div id="team-overlay" class="arena-center-message cinematic-intro"><b>İKİ SANCAK MUHAREBESİ</b><p>Klan maçı için İttifak → Savaş Odası bölümünde herkes hazır olmalı; lider eşleşmeyi başlatır.</p></div></div>
  <div class="sf-squad-command" role="group" aria-label="Hangi birlikler emir alacak"><span>EMİR VERİLECEK BİRLİK</span><button type="button" data-squad-select="all" aria-pressed="true">⚔ Tümü <small>5</small></button><button type="button" data-squad-select="guard" aria-pressed="false">⛨ Öncü <small>6</small></button><button type="button" data-squad-select="archer" aria-pressed="false">➹ Okçular <small>7</small></button><output id="sf-squad-feedback" aria-live="polite">Tüm birlikler seçili</output></div>
  <div class="team-combat"><div class="team-controls" aria-label="Kahraman yetenekleri"><button data-team-attack>Saldır <small>J</small></button><button data-team-burst>✦ Yıldız Darbesi <small>Q</small></button><button data-team-dash>➤ Atılma <small>Space</small></button></div><div class="team-controls team-orders" aria-label="Birlik komutları"><button data-team-order="follow">⚑ Takip <small>1</small></button><button data-team-order="push">⚔ İlerle <small>2</small></button><button data-team-order="hold">⛨ Savun <small>3</small></button><button data-team-order="focus">◎ Odaklan <small>4</small></button></div></div>
  <div class="arena-touch team-touch" aria-label="Mobil yön tuşları"><button data-team-move="up">▲</button><div><button data-team-move="left">◀</button><button data-team-move="down">▼</button><button data-team-move="right">▶</button></div></div>
  <p class="arena-hint"><b>Kontroller:</b> WASD / oklar hareket, J saldırı, Q büyü, Space kaçınma, M mini harita, 1–4 emirler, 5/6/7 tüm birlikler/öncü/okçular. Düşmana dokunarak odak hedefi seçebilirsin. Sancak modunda iki bayrağı ele geçir. Kuşatmada saldıranlar koçbaşını koruyarak kapıya götürür, ardından yıldız çekirdeğini yıkar; savunanlar koçbaşını yok ederek saldırıyı geciktirir ve 3 dakika dayanır. <b>Klan takımı:</b> İttifak/Savaş Odası bölümünden hazır ol, ardından lider Klan 2v2 veya Klan 5v5 ile eşleşmeyi başlatsın. <b>Canlı oyuncu maçları derecesizdir. Bot antrenmanlarında sınırlı yerel kaynak ödülü alınabilir; PvP sıralaması etkilenmez.</b></p>`;
  const $=s=>root.querySelector(s);let canvas=$('#team-canvas');
  $('#team-bot-difficulty').value=botDifficulty;
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
    let headline='',detail='';if(error){headline='BAĞLANTI HATASI';detail=error;}else if(state==='idle'){headline='SAVAŞI DENE';detail='Botla hemen 2v2 veya kuşatma başlat; gerçek takım için diğer eşleşme düğmelerini kullan.';}else if(state==='waiting'){headline=`${snapshot.mode} İÇİN OYUNCULAR BEKLENİYOR`;detail=snapshot.party?`${snapshot.waiting}/${snapshot.required} oyuncu · Klan takımı sırada. Tüm üyeler bu ekranı açık tutmalı. Rakip klan da aynı formatı seçmeli.`:`${snapshot.waiting}/${snapshot.required} oyuncu hazır. Diğer oyuncular farklı tarayıcı profillerinden aynı modu seçmeli.`;}else if(state==='ended'){headline=room.winner===null?'BERABERE':room.players.find(p=>p.id===snapshot.you)?.team===room.winner?'ZAFER':'MAĞLUBİYET';detail=room.reason==='disconnect'?'Bağlantı kesilmesi nedeniyle maç sona erdi.':room.reason==='siege-victory'?'Kuşatanlar yıldız çekirdeğini ele geçirdi.':room.reason==='siege-defense'?'Savunmacılar 3 dakika boyunca kaleyi korudu.':'Yeni maça girmek için Çık ardından eşleşme seç.';}
    if(state==='ended'&&room&&rewarded!==room.id){rewarded=room.id;const meEnd=room.players.find(p=>p.id===snapshot.you);if(room.isPractice)window.dispatchEvent(new CustomEvent('starfort:practice-result',{detail:{won:room.winner!==null&&meEnd?.team===room.winner,mode:rewardMode(room),matchId:room.id,difficulty:room.botDifficulty||botDifficulty}}));}
    $('#team-overlay').hidden=state==='active'&&!error;$('#team-overlay').innerHTML=headline?`<b>${clean(headline)}</b><p>${clean(detail)}</p>`:'';
    $('#team-status').textContent=error?'Sunucuya bağlanılamıyor':({idle:'Takım arenası hazır',waiting:'Eşleşme bekleniyor',active:'CANLI MUHAREBE',ended:'Maç tamamlandı'})[state]||'Hazırlanıyor';
    $('#team-detail').textContent=room?`${room.guilds?room.guilds.join(' ⚔ '):clean(room.mode)} · ${room.players.map(p=>p.name).join(' · ')}`:'Sunucu doğrulamalı hareket, hasar ve birlik emirleri';
    $('#team-score-0').textContent=room?.score?.[0]??0;$('#team-score-1').textContent=room?.score?.[1]??0;
    const siege=room?.variant==='siege';
    $('.team-match-hud .team-blue').textContent=siege?'KUŞATANLAR':'ŞAFAK MUHAFIZLARI';
    $('.team-match-hud .team-red').textContent=siege?'SAVUNMACILAR':'GECE LEJYONU';
    const directive=battleObjective(room,snapshot.you);const card=$('#sf-objective-card');card.hidden=state!=='active';
    card.classList.toggle('is-urgent',directive.urgent);$('#sf-objective-title').textContent=directive.title;$('#sf-objective-detail').textContent=directive.detail;$('#sf-objective-progress').style.width=directive.progress+'%';
    const goal=$('#siege-status');goal.hidden=!siege;
    if(siege){const r=room.siege.ram;const ramState=!r?'—':r.hp<=0?`Yıkıldı · ${Math.max(0,Math.ceil(r.respawnAt-room.elapsed))} sn`:`${r.hp}/${r.maxHp} · ${r.phase==='ramming'?'Kapıyı dövüyor':r.phase==='advancing'?'İlerliyor':'Muhafız bekliyor'}`;goal.textContent=`⚔ KUŞATMA · Kapı ${room.siege.gate.hp}/${room.siege.gate.maxHp} · Koçbaşı ${ramState} · Kristal ${room.siege.core.hp}/${room.siege.core.maxHp} · Saldıranlar koçbaşına eskort olmalı; savunanlar koçbaşını vurabilir.`;}
    const seconds=Math.max(0,180-(room?.elapsed||0));$('#team-clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
    root.querySelectorAll('[data-team-mode],[data-team-party]').forEach(b=>b.disabled=!policy.liveMatchmaking||!token||state!=='idle'||busy);
    $('[data-team-leave]').disabled=!token||state==='idle'||busy;
    root.querySelectorAll('[data-team-bot]').forEach(b=>b.disabled=!token||state==='active'||busy);const me=room?.players.find(p=>p.id===snapshot.you);$('#team-detail').title=room?.isPractice?`Bot zorluğu: ${trainingLabel(room.botDifficulty)} · Derecesiz ve ödülsüz`:'Gerçek oyunculu takım maçı';
    $('[data-team-burst] small').textContent=me?.burstReady>0?me.burstReady.toFixed(1)+' sn':'Q';$('[data-team-dash] small').textContent=me?.dashReady>0?me.dashReady.toFixed(1)+' sn':'Space';
    const groups=room?.squads.filter(s=>s.ownerId===snapshot.you&&(selectedSquad==='all'||s.type===selectedSquad))||[];
    root.querySelectorAll('[data-team-order]').forEach(b=>b.classList.toggle('selected',groups.length>0&&groups.every(s=>s.order===b.dataset.teamOrder)));
    root.querySelectorAll('[data-squad-select]').forEach(b=>{const isSelected=b.dataset.squadSelect===selectedSquad;b.classList.toggle('selected',isSelected);b.setAttribute('aria-pressed',String(isSelected));});
    const ownSquads=room?.squads.filter(s=>s.ownerId===snapshot.you)||[];
    for(const b of root.querySelectorAll('[data-squad-select]')){
      const filtered=ownSquads.filter(s=>b.dataset.squadSelect==='all'||s.type===b.dataset.squadSelect);
      const hp=filtered.reduce((acc,s)=>acc+s.hp,0),maxHp=filtered.reduce((acc,s)=>acc+s.maxHp,0);
      b.title=maxHp?`Can ${Math.ceil(hp)}/${maxHp}`:'Birlikler henüz savaş alanında değil';
    }
  }
  async function refresh(){if(disposed||busy||!token)return;try{snapshot=await api('state');error='';}catch(e){error=e.message;}if(!disposed)status();}
  async function start(size,variant='flags'){if(disposed||busy||!token||!policy.liveMatchmaking)return;busy=true;try{const data=await api('queue',{size,variant});snapshot=data;error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function startBot(size,variant='flags'){if(disposed||busy||!token)return;busy=true;try{snapshot=await api('bot',{size,variant,difficulty:botDifficulty});error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function startParty(size,variant='flags'){if(disposed||busy||!token||!policy.liveMatchmaking)return;busy=true;try{snapshot=await api('party/queue',{size,variant});error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function leave(){if(disposed||busy||!token)return;busy=true;try{snapshot=await api('leave',{});error='';}catch(e){error=e.message;}finally{busy=false;if(!disposed)status();}}
  async function send(){if(disposed||busy||snapshot.status!=='active')return;
    const x=Number(keys.has('d')||keys.has('arrowright')||touch.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||touch.has('left'));
    const y=Number(keys.has('s')||keys.has('arrowdown')||touch.has('down'))-Number(keys.has('w')||keys.has('arrowup')||touch.has('up'));
    const axis=combineMovement(x,y,joystick.read());
    const data={seq:++seq,x:axis.x,y:axis.y,attack:keys.has('j')||touch.has('attack')||pendingAttack,burst:pendingBurst,dash:pendingDash};
    if(pendingOrder){data.order=pendingOrder;data.focus=pendingFocus;data.squad=pendingSquad;}
    pendingAttack=false;pendingBurst=false;pendingDash=false;pendingOrder=null;pendingFocus=null;pendingSquad='all';busy=true;
    try{snapshot=await api('input',data);error='';}catch(e){error=e.message;if(data.order){pendingOrder=data.order;pendingFocus=data.focus;pendingSquad=data.squad;}if(data.burst)pendingBurst=true;if(data.dash)pendingDash=true;if(data.attack)pendingAttack=true;}
    finally{busy=false;if(!disposed)status();}
  }
  function selectSquad(value){if(!['all','guard','archer'].includes(value))return;selectedSquad=value;
    root.querySelectorAll('[data-squad-select]').forEach(b=>{const active=b.dataset.squadSelect===value;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
    $('#sf-squad-feedback').textContent=({all:'Tüm birlikler',guard:'Öncüler',archer:'Okçular'})[value]+' seçildi';
  }
  function order(value){pendingOrder=value;pendingFocus=value==='focus'?selectedTarget:null;pendingSquad=selectedSquad;
    $('#sf-squad-feedback').textContent=({all:'Tüm birliklere',guard:'Öncülere',archer:'Okçulara'})[selectedSquad]+' '+orders[value].toLocaleLowerCase('tr')+' emri';
  }
  function keyDown(event){if(!root.isConnected||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.ctrlKey||event.metaKey)return;const k=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','q',' ','1','2','3','4','5','6','7','m'].includes(k))event.preventDefault();keys.add(k);if(!event.repeat){if(k==='q')pendingBurst=true;if(k===' ')pendingDash=true;if('1234'.includes(k)&&k.length===1)order(['follow','push','hold','focus'][Number(k)-1]);if('567'.includes(k)&&k.length===1)selectSquad(['all','guard','archer'][Number(k)-5]);if(k==='m')toggleMinimap();}}
  function toggleMinimap(){minimapVisible=!minimapVisible;localStorage.setItem('starfort:minimap-visible',String(minimapVisible));updateMinimap();}
  function keyUp(e){keys.delete(e.key.toLowerCase());}
  function click(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.dataset.squadSelect){selectSquad(b.dataset.squadSelect);return;}if(b.dataset.teamBot){startBot(Number(b.dataset.teamBot),b.dataset.teamVariant||'flags');return;}if(b.dataset.teamMode){start(Number(b.dataset.teamMode),b.dataset.teamVariant||'flags');return;}if(b.dataset.teamParty){startParty(Number(b.dataset.teamParty),b.dataset.teamVariant||'flags');return;}if(b.hasAttribute('data-team-leave')){leave();return;}if(b.hasAttribute('data-sf-render')){if(policy.graphicsLab)switchRenderMode(renderMode==='3d'?'2d':'3d');return;}if(b.hasAttribute('data-sf-graphics')){updateGraphics(nextQuality(graphics));return;}if(b.hasAttribute('data-team-map')){toggleMinimap();return;}if(b.hasAttribute('data-sf-fullscreen')){if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else root.requestFullscreen?.().catch(()=>{});return;}if(b.hasAttribute('data-team-attack'))pendingAttack=true;if(b.hasAttribute('data-team-burst'))pendingBurst=true;if(b.hasAttribute('data-team-dash'))pendingDash=true;if(b.dataset.teamOrder)order(b.dataset.teamOrder);}
  function selectEnemy(e){const room=snapshot.room,me=room?.players.find(p=>p.id===snapshot.you);if(!me)return;const rect=canvas.getBoundingClientRect();const point=renderer.mode==='webgl3d'?{x:(e.clientX-rect.left)/rect.width*1000,y:(e.clientY-rect.top)/rect.height*600}:battlePoint(e.clientX,e.clientY,rect,1000,600,getComputedStyle(canvas).objectFit);if(!point)return;const {x:pixelX,y:pixelY}=point;const {x:worldX,y:worldY}=renderer.toWorld(pixelX*10,pixelY*10);const x=worldX/10,y=worldY/10;let best=null,bestDist=4;for(const p of room.players){if(p.team===me.team||p.hp<=0)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<bestDist){best=p;bestDist=d;}}if(best){selectedTarget=best.id;order('focus');}}
  function pointerDown(e){const b=e.target.closest('[data-team-move],[data-team-attack]');if(!b)return;e.preventDefault();touch.add(b.dataset.teamMove||'attack');try{b.setPointerCapture?.(e.pointerId)}catch{}}
  function pointerUp(e){const b=e.target.closest('[data-team-move],[data-team-attack]');if(b)touch.delete(b.dataset.teamMove||'attack');}
  function blur(){keys.clear();touch.clear();joystick.reset();}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);root.addEventListener('click',click);root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointerup',pointerUp);root.addEventListener('pointercancel',pointerUp);canvas.addEventListener('click',selectEnemy);
  window.addEventListener('resize',resizeCanvas);updateGraphics(graphics);
  if(!token)error='Önce İttifak sekmesinden yerel komutan hesabı oluştur.';else refresh();status();raf=requestAnimationFrame(draw);sending=setInterval(send,135);checking=setInterval(()=>{if(!busy&&snapshot.status!=='active')refresh()},1000);
  return ()=>{disposed=true;joystick.dispose();root.classList.remove('sf-battle-live');document.body.classList.remove('sf-combat-running');clearInterval(sending);clearInterval(checking);cancelAnimationFrame(raf);window.removeEventListener('resize',resizeCanvas);motion.reset();renderer.dispose();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);root.removeEventListener('click',click);root.removeEventListener('pointerdown',pointerDown);root.removeEventListener('pointerup',pointerUp);root.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('click',selectEnemy);if(snapshot.status==='active'||snapshot.status==='waiting')api('leave',{}).catch(()=>{});};
}
