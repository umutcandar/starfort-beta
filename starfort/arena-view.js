/** 1v1 online duel UX. The server is authoritative; the canvas only renders snapshots. */
import {guildRequest,GUILD_TOKEN_KEY} from './guild-client.js';
import {createMatchContinuity} from './match-continuity.js';
import {accountSession} from './account-auth.js';
import {ARENA_HERO_STYLES} from './arena-heroes.js';
import * as R from './rules.js';
import {trainingDifficulty,trainingLabel} from './training-difficulty.js';
import {createBattleRenderer} from './battle-render-adapter.js';
import {getPreferredBattleMode,savePreferredBattleMode} from './battle-render-preference.js';
import {battleExperience} from './battle-experience.js';
import {createBattleMotion,graphicsPreset} from './battle-motion.js';
import {setCanvasQuality,nextQuality,QUALITY_LABELS} from './graphics-display.js';
import {mountJoystick,combineMovement} from './mobile-controls.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function mountArena(root){
  const token=accountSession()?.access_token||localStorage.getItem(GUILD_TOKEN_KEY)||'';
  const saved=R.restoreState(localStorage.getItem(R.STORAGE_KEY));
  const heroes=Object.entries(ARENA_HERO_STYLES).filter(([id])=>saved.heroes[id]);
  let heroId=heroes.some(([id])=>id===localStorage.getItem('starfort:arena-hero'))?localStorage.getItem('starfort:arena-hero'):heroes[0]?.[0]||'aldren';
  const policy=battleExperience(window.location,getPreferredBattleMode(localStorage),window.matchMedia?.('(pointer:coarse)').matches||false);
  let graphics=graphicsPreset(localStorage.getItem('starfort:graphics')||policy.defaultQuality);
  let renderMode=policy.renderMode;
  let botDifficulty=trainingDifficulty(localStorage.getItem('starfort:bot-difficulty'))||'normal';
  const matchContinuity=createMatchContinuity(sessionStorage,'starfort:arena-last-active');
  let snapshot={status:'idle'},destroyed=false,raf=0,gameTimer=0,queueTimer=0,busy=false,seq=0;
  const keys=new Set(),touch=new Set();let pendingBurst=false,pendingDash=false,pendingAttack=false,uiTime=0,lastStateTime=0;
  const api=(route,data=null)=>guildRequest(`arena/${route}`,token,data);
  root.innerHTML=`<header class="training-title"><div><span class="eyebrow">YILDIZ KALESİ · ŞAFAK DÜELLOSU</span><h2>Yıldız Düellosu</h2><p>Tek başına yapay rakibe karşı antrenman yap veya gerçek oyuncuyla 1v1 düelloya gir.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="sf-portrait-hint" role="note">↻ <strong>Yatay oyun önerilir.</strong> Telefonu yana çevir; savaşta soldaki joystick ve sağdaki yetenek tuşlarını kullan.</div>
  <label class="sf-hero-choice">ARENADAKİ KAHRAMAN <select id="starfort-hero-choice" aria-label="Arena kahramanı">${heroes.map(([id,h])=>`<option value="${id}" ${heroId===id?'selected':''}>${h.name} · ${h.title}</option>`).join('')}</select></label><div class="battle-graphics-control"><span>SAVAŞ GÖRÜNÜMÜ</span><select id="arena-render-mode" aria-label="Savaş görünümü">${policy.graphicsLab?'<option value="3d">3B geliştirme laboratuvarı</option>':''}<option value="2d">Sinematik 2.5B · asıl oyun</option></select><small id="arena-render-status">STARFORT sinematik savaş görünümü etkin</small><span>GÖRÜNTÜ KALİTESİ</span><select id="arena-graphics" aria-label="Grafik kalitesi"><option value="ultra">Ultra</option><option value="balanced">Dengeli</option><option value="performance">Performans</option></select>${policy.graphicsLab?'<a class="sf-3d-lab-link" href="./graphics-3d-preview.html" target="_blank" rel="noopener noreferrer">3B geliştirme sahnesi</a>':''}</div>
    <div class="arena-head"><div><span class="online-dot"></span><b id="arena-connection">Bağlantı hazırlanıyor</b><small id="arena-match">${policy.liveMatchmaking?'Gerçek oyuncu veya bot antrenmanı · derecesiz':'Kendi kahramanınla bot antrenmanı · canlı eşleşme bu sunucuda kapalı'}</small></div><label class="sf-difficulty-picker" for="arena-bot-difficulty">Bot seviyesi <select id="arena-bot-difficulty" aria-label="Bot seviyesi"><option value="easy">Kolay</option><option value="normal">Normal</option><option value="hard">Zor</option></select></label><button class="primary" data-arena-bot>⚔ Botla Savaş (Tek Başına)</button><button class="secondary" data-arena-queue ${policy.liveMatchmaking?'':'disabled title="Gerçek oyuncu eşleşmesi özel oyun sunucusunda açılır"'}>Gerçek Rakip Ara</button><button class="secondary" data-arena-leave>Çık / Vazgeç</button></div>
    <div class="arena-field"><div class="sf-arena-live-hud" id="arena-live-hud" hidden aria-live="off"><div class="sf-life-card sf-life-ally"><small id="arena-me-name">SEN</small><div class="sf-life-track"><i id="arena-me-life"></i></div><b id="arena-me-hp">—</b></div><div class="sf-combat-timer" id="arena-timer">02:00</div><div class="sf-life-card sf-life-enemy"><small id="arena-enemy-name">RAKİP</small><div class="sf-life-track"><i id="arena-enemy-life"></i></div><b id="arena-enemy-hp">—</b></div></div><canvas id="arena-canvas" width="1000" height="600" aria-label="Düello arenası; klavyede WASD yön, J saldırı, Q büyü, Space atılma"></canvas><div class="sf-battle-bar"><button class="sf-back" data-close-view aria-label="Köye dön">‹ Köy</button><span><strong>STARFORT</strong><small>Yıldız Düellosu</small></span>${policy.graphicsLab?'<button data-sf-render aria-label="Deneysel 3B ve sinematik görünüm değiştir">✦ SİNEMATİK</button>':''}<button data-sf-graphics aria-label="Grafik kalitesini değiştir">✦ Ultra</button><button data-sf-fullscreen aria-label="Tam ekran yap">⛶</button></div><div class="sf-joystick" aria-label="Kahraman hareket joysticki" role="group"><div class="sf-joystick-rim"></div><div class="sf-joystick-thumb"></div><small>HAREKET</small></div><div class="sf-rotation-tip">↻ En iyi deneyim için telefonu yatay çevir</div><div class="arena-center-message cinematic-intro" id="arena-message"><b>YILDIZ DÜELLOSU</b><p>⚔ Botla Savaş düğmesiyle hemen tek başına dene. Gerçek oyuncu için Rakip Ara'yı kullan.</p></div></div>
    <div class="arena-actions"><button data-arena-attack>Saldır <small>J / dokun</small></button><button data-arena-burst>✦ Yıldız Darbesi <small>Q · 8 sn</small></button><button data-arena-dash>➤ Atılma <small>Space · 5 sn</small></button></div>
    <div class="arena-touch" aria-label="Mobil yön kontrolü"><button data-arena-move="up">▲</button><div><button data-arena-move="left">◀</button><button data-arena-move="down">▼</button><button data-arena-move="right">▶</button></div></div>
    <p class="arena-hint">WASD / ok tuşları: hareket · J: normal saldırı · Q: alan büyüsü · Space: atılma. Bot maçı yalnızca antrenmandır, gerçek oyuncu değildir; <b>klan savaşı değildir</b>. Sunucu kapanınca maç sıfırlanır; ödül ve sıralama yoktur.</p>`;
  const $=q=>root.querySelector(q);let canvas=$('canvas');
  let error='';
  $('#arena-graphics').value=graphics;
  $('#arena-bot-difficulty').value=botDifficulty;
  $('#starfort-hero-choice').addEventListener('change',e=>{const chosen=e.target.value;if(Object.hasOwn(ARENA_HERO_STYLES,chosen)){heroId=chosen;localStorage.setItem('starfort:arena-hero',chosen);}});
  $('#arena-bot-difficulty').addEventListener('change',event=>{botDifficulty=trainingDifficulty(event.target.value)||'normal';localStorage.setItem('starfort:bot-difficulty',botDifficulty);});
  $('#arena-graphics').addEventListener('change',e=>updateGraphics(e.target.value));
  const motion=createBattleMotion();
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let renderer=createBattleRenderer(canvas,{quality:graphics,reducedMotion,renderMode});canvas=renderer.canvas;canvas.dataset.graphicsEngine=renderer.mode;
  function switchRenderMode(next){
    renderMode=savePreferredBattleMode(localStorage,policy.graphicsLab?next:'2d');
    if('arena'==='team')canvas.removeEventListener('click',selectEnemy);
    renderer.dispose();const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;
    renderer=createBattleRenderer(canvas,{quality:graphics,reducedMotion,renderMode});canvas=renderer.canvas;canvas.dataset.graphicsEngine=renderer.mode;
    root.querySelector('#arena-render-mode').value=renderMode;const toggle=root.querySelector('[data-sf-render]');if(toggle)toggle.textContent=renderMode==='3d'?'◈ 3B LAB':'✦ SİNEMATİK';
    const el=root.querySelector('#arena-render-status');el.textContent=renderMode==='3d'&&renderer.mode!=='webgl3d'?'3B desteklenmedi, 2.5B yedek kullanılıyor':renderer.mode==='webgl3d'?'Deneysel geometri: düşük detaylı':'Sinematik 2.5B etkin';
    if('arena'==='team')canvas.addEventListener('click',selectEnemy);resizeCanvas();
  }
  $('#arena-render-mode').value=renderMode;
  $('#arena-render-mode').addEventListener('change',e=>switchRenderMode(e.target.value));
  $('#arena-render-status').textContent=renderMode==='3d'&&renderer.mode!=='webgl3d'?'3B desteklenmedi; 2.5B yedek kullanılıyor':renderer.mode==='webgl3d'?'Deneysel geometri: düşük detaylı':'Sinematik 2.5B etkin';
  function resizeCanvas(){renderer.resize(graphics)}
  function updateGraphics(value){graphics=graphicsPreset(value);localStorage.setItem('starfort:graphics',graphics);$('#arena-graphics').value=graphics;$('[data-sf-graphics]').textContent='✦ '+QUALITY_LABELS[graphics];resizeCanvas();}
  const joystick=mountJoystick($('.sf-joystick'));
  let rewarded=null;
  function paint(time=0){
    const room=snapshot.room;
    const visual=room?{
      ...room,
      capture:[null,null],
      players:room.players.map(p=>({...p,team:p.side})),
      fx:room.fx.map(f=>({...f,team:f.side}))
    }:null;
    renderer.render(visual,snapshot.you,time/1000,{duel:true,quality:graphics,motion,reducedMotion});
  }
  function message(){
    const status=snapshot.status,room=snapshot.room;
    const wasLive=root.classList.contains('sf-battle-live');root.classList.toggle('sf-battle-live',status==='active');document.body.classList.toggle('sf-combat-running',status==='active');if(wasLive!==(status==='active'))requestAnimationFrame(resizeCanvas);let title='',detail='';
    if(error){title='BAĞLANTI HATASI';detail=error;}
    else if(status==='interrupted'){title='MAÇ OTURUMU İPTAL';detail=snapshot.message||'Sunucu yeniden başladı. Yenilgi veya ödül yazılmadı; yeni maça girebilirsin.';}
    else if(status==='idle'){title='ARENA HAZIR';detail='Hemen denemek için Botla Savaş (Tek Başına) düğmesine bas. Gerçek oyuncuyla oynamak için Rakip Ara.';}
    else if(status==='waiting'){title='RAKİP BEKLENİYOR';detail='Gerçek oyuncu bekleniyor. Tek başına denemek istersen Botla Savaş düğmesine bas; bekleme kuyruğundan çıkıp botla hemen eşleşirsin.';}
    else if(status==='ended'){
      title=room?.winner===null?'BERABERE':room?.winner===snapshot.you?'ZAFER':'MAĞLUBİYET';
      detail=room?.reason==='disconnect'?'Rakip bağlantıyı kaybetti.':room?.reason==='forfeit'?'Bir oyuncu düellodan ayrıldı.':'Yeni maç için Botla Savaş düğmesine basabilir veya Çık ile gerçek oyuncu arayabilirsin.';
    }
    const el=$('#arena-message');el.hidden=status==='active'&&!error;
    el.innerHTML=title?`<b>${esc(title)}</b><p>${esc(detail)}</p>`:'';
    $('#arena-connection').textContent=error?'Bağlantı kesildi':({idle:'Arena hazır',interrupted:'Maç oturumu iptal',waiting:'Eşleşme bekleniyor',active:'Canlı düello sürüyor',ended:'Maç tamamlandı'})[status]||'Hazırlanıyor';
    $('#arena-match').textContent=room?`${room.isPractice?'BOT ('+trainingLabel(room.botDifficulty)+') · ':''}${room.players.map(p=>p.name).join(' ⚔ ')} · ${Math.max(0,Math.ceil(120-room.elapsed))} sn kaldı`:'Sunuculu 1v1 · bot antrenmanı veya gerçek oyuncu';
    const you=room?.players.find(p=>p.id===snapshot.you),enemy=room?.players.find(p=>p.id!==snapshot.you);
    const hud=$('#arena-live-hud');hud.hidden=!(room&&(status==='active'||status==='ended'));
    if(you&&enemy){
      $('#arena-me-name').textContent=you.name;$('#arena-enemy-name').textContent=enemy.name;
      $('#arena-me-hp').textContent=`${you.hp}/${you.maxHp}`;$('#arena-enemy-hp').textContent=`${enemy.hp}/${enemy.maxHp}`;
      $('#arena-me-life').style.width=`${clamp(100*you.hp/Math.max(1,you.maxHp),0,100)}%`;
      $('#arena-enemy-life').style.width=`${clamp(100*enemy.hp/Math.max(1,enemy.maxHp),0,100)}%`;
      const left=Math.max(0,120-room.elapsed);$('#arena-timer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(Math.floor(left%60)).padStart(2,'0')}`;
    }
    $('[data-arena-queue]').disabled=!policy.liveMatchmaking||!token||status==='active'||status==='waiting'||busy;
    $('[data-arena-bot]').disabled=!token||status==='active'||busy;
    $('[data-arena-leave]').disabled=!token||(status==='idle'&& !error)||busy;
    const me=room?.players.find(p=>p.id===snapshot.you);
    if(status==='ended'&&room&&rewarded!==room.id){rewarded=room.id;if(room.isPractice)window.dispatchEvent(new CustomEvent('starfort:practice-result',{detail:{won:room.winner===snapshot.you,mode:'duel',matchId:room.id,difficulty:room.botDifficulty||botDifficulty}}));}
    $('[data-arena-burst] small').textContent=me&&me.burstReady>0?`${me.burstReady.toFixed(1)} sn`: 'Q · 8 sn';
    $('[data-arena-dash] small').textContent=me&&me.dashReady>0?`${me.dashReady.toFixed(1)} sn`: 'Space · 5 sn';
  }
  function draw(time){paint(time);raf=requestAnimationFrame(draw);}
  let epoch=0;
  async function poll(){if(destroyed||busy||!token)return;const my=epoch;try{const next=await api('state');if(my!==epoch)return;snapshot=matchContinuity.accept(next);if(Number.isSafeInteger(next.inputSeq))seq=Math.max(seq,next.inputSeq);error='';}catch(e){error=e.message;}if(!destroyed)message();if(!destroyed&&sessionStorage.getItem('starfort:autostart-duel')&&snapshot.status!=='active'&&snapshot.status!=='waiting'){sessionStorage.removeItem('starfort:autostart-duel');playBot();}}
  async function queue(){if(busy||!token||!policy.liveMatchmaking)return;busy=true;epoch++;try{snapshot=matchContinuity.accept(await api('queue',{heroId}));error='';}catch(e){error=e.message;}finally{busy=false;if(!destroyed)message();}}
  async function playBot(){if(busy||!token)return;busy=true;epoch++;try{snapshot=await api('bot',{difficulty:botDifficulty,heroId});error='';}catch(e){error=e.message;}finally{busy=false;if(!destroyed)message();}}
  async function leave(){if(busy||!token)return;busy=true;epoch++;try{snapshot=await api('leave',{});error='';}catch(e){error=e.message;}finally{busy=false;if(!destroyed)message();}}
  async function send(){if(destroyed||busy||snapshot.status!=='active')return;
    const x=(keys.has('d')||keys.has('arrowright')||touch.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||touch.has('left')?1:0);
    const y=(keys.has('s')||keys.has('arrowdown')||touch.has('down')?1:0)-(keys.has('w')||keys.has('arrowup')||touch.has('up')?1:0);
    const axis=combineMovement(x,y,joystick.read());
    const body={seq:++seq,x:axis.x,y:axis.y,attack:keys.has('j')||touch.has('attack')||pendingAttack,burst:pendingBurst,dash:pendingDash};
    pendingBurst=false;pendingDash=false;pendingAttack=false;busy=true;
    try{snapshot=await api('input',body);error='';}catch(e){error=e.message;if(body.burst)pendingBurst=true;if(body.dash)pendingDash=true;if(body.attack)pendingAttack=true;}
    finally{busy=false;if(!destroyed)message();}
  }
  function keydown(e){if(!root.isConnected||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.ctrlKey||e.metaKey)return;
    const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','j','q',' '].includes(k))e.preventDefault();
    keys.add(k);if(!e.repeat){if(k==='q')pendingBurst=true;if(k===' ')pendingDash=true;}
  }
  function keyup(e){keys.delete(e.key.toLowerCase());}
  function buttonClick(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;if(b.hasAttribute('data-arena-queue')){queue();return;}if(b.hasAttribute('data-arena-bot')){playBot();return;}if(b.hasAttribute('data-arena-leave')){leave();return;}if(b.hasAttribute('data-sf-render')){if(policy.graphicsLab)switchRenderMode(renderMode==='3d'?'2d':'3d');return;}if(b.hasAttribute('data-sf-graphics')){updateGraphics(nextQuality(graphics));return;}if(b.hasAttribute('data-sf-fullscreen')){if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else root.requestFullscreen?.().catch(()=>{});return;}if(b.hasAttribute('data-arena-attack'))pendingAttack=true;if(b.hasAttribute('data-arena-burst'))pendingBurst=true;if(b.hasAttribute('data-arena-dash'))pendingDash=true;}
  function pointerdown(e){const b=e.target.closest('[data-arena-move], [data-arena-attack]');if(!b)return;e.preventDefault();touch.add(b.dataset.arenaMove||'attack');if(b.setPointerCapture)try{b.setPointerCapture(e.pointerId)}catch{}}
  function pointerup(e){const b=e.target.closest('[data-arena-move], [data-arena-attack]');if(b)touch.delete(b.dataset.arenaMove||'attack');}
  function blur(){keys.clear();touch.clear();joystick.reset();}
  window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
  root.addEventListener('click',buttonClick);root.addEventListener('pointerdown',pointerdown);root.addEventListener('pointerup',pointerup);root.addEventListener('pointercancel',pointerup);
  window.addEventListener('resize',resizeCanvas);updateGraphics(graphics);
  if(!token){error='Önce İttifak sekmesinden yerel komutan hesabı oluştur.';message();}else poll();
  raf=requestAnimationFrame(draw);gameTimer=setInterval(send,120);queueTimer=setInterval(()=>{if(snapshot.status!=='active' || !busy)poll()},900);
  return ()=>{destroyed=true;joystick.dispose();root.classList.remove('sf-battle-live');document.body.classList.remove('sf-combat-running');clearInterval(gameTimer);clearInterval(queueTimer);cancelAnimationFrame(raf);window.removeEventListener('resize',resizeCanvas);motion.reset();renderer.dispose();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);root.removeEventListener('click',buttonClick);root.removeEventListener('pointerdown',pointerdown);root.removeEventListener('pointerup',pointerup);root.removeEventListener('pointercancel',pointerup);if(snapshot.status==='waiting'||snapshot.status==='active')api('leave',{}).catch(()=>{});};
}
