/** Shadow Frontier v2.38: account-bound advanced PvE and permanent hero disciplines. */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {HEROES,ITEMS} from './rules.js';
import {shadowBossArtwork,shadowBossPhase} from './shadow-boss-art-v239.js';
import {shadowVictoryMarkup} from './shadow-rewards-v239.js';
import {shadowAtmosphereParticles,shadowVoiceStatus} from './shadow-battle-director-v240.js';
import {shadowMasterySnapshot,shadowMasteryMarkup} from './shadow-mastery-v241.js';
export const SHADOW_STAGES=Object.freeze([
 Object.freeze({id:1,name:'Diken Nöbetçisi',region:'Karanlık Geçit',boss:'Diken Nöbetçisi',
  unlock:2,description:'Yaşayan surların bekçisi. Son dalgada kalkanı sürekli onarır.',
  tip:'Aldat ve özel kahraman yetenekleri kalkanı kırar.',firstItem:'grave_seal',icon:'🌲'}),
 Object.freeze({id:2,name:'Oyuk Siren',region:'Fısıltı Kıyıları',boss:'Oyuk Siren',
  unlock:4,description:'Can emerek kendini iyileştiren lanetli deniz muhafızı.',
  tip:'İyileşme aralıklarında güçlü darbeler kullan.',firstItem:'eclipse_edge',icon:'🌊'}),
 Object.freeze({id:3,name:'Kül Fırtınası',region:'Yanık Uçurum',boss:'Kül Fırtınası',
  unlock:6,description:'Arka arkaya ağır darbelerle komutan hattını dağıtır.',
  tip:'Ağır darbede Savun kullan, Toparlan ile toparlan.',firstItem:'guardian_seal',icon:'🔥'}),
 Object.freeze({id:4,name:'Tutulma Hükümdarı',region:'Karanlık Taht',boss:'Tutulma Hükümdarı',
  unlock:8,description:'Üç safhalı tutulma, kritik canın altında öfkeli saldırılar.',
  tip:'Son safhada en güçlü kahraman yeteneğini sakla.',firstItem:'starbreaker',icon:'🌘'})
]);
export const HERO_DISCIPLINES=Object.freeze([
 Object.freeze({id:'assault',name:'Hücum Disiplini',icon:'⚔',description:'Her rütbe takıma +18 sefer gücü sağlar.'}),
 Object.freeze({id:'warden',name:'Muhafız Disiplini',icon:'🛡',description:'Her rütbe +20 başlangıç canı ve %3 daha az hasar sağlar.'})
]);
export const HERO_TRAINING=Object.freeze([
 Object.freeze({rank:1,level:3,story:2,act2:0,gold:250,aether:45,stone:25}),
 Object.freeze({rank:2,level:6,story:6,act2:0,gold:1000,aether:180,stone:50}),
 Object.freeze({rank:3,level:10,story:8,act2:2,gold:2250,aether:405,stone:75})
]);
const stageMap=new Map(SHADOW_STAGES.map(x=>[x.id,x]));
const heroMap=new Map(HEROES.map(x=>[x.id,x]));
const itemMap=new Map(ITEMS.map(x=>[x.id,x]));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n).toLocaleString('tr-TR');
const safe=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function validateShadowSnapshot(data){
 if(data?.ok!==true||data.source!=='server-shadow')throw Error('Gölge Sınırı sunucu hesabı doğrulanamadı.');
 if(!object(data.heroPaths)||Object.keys(data.heroPaths).length>HEROES.length||
    !Object.entries(data.heroPaths).every(([id,x])=>heroMap.has(id)&&object(x)&&
      ['assault','warden'].includes(x.path)&&safe(x.rank,1,3)))
  throw Error('Kahraman uzmanlık kaydı geçersiz.');
 if(!Array.isArray(data.cleared)||data.cleared.length>4||
    !data.cleared.every((n,i)=>n===i+1)||!object(data.stars)||
    !Object.entries(data.stars).every(([id,n])=>safe(Number(id),1,4)&&data.cleared.includes(Number(id))&&safe(n,1,3)))
  throw Error('Gölge Sınırı bölüm kaydı bozuk.');
 const b=data.battle;
 if(b!==null&&(!object(b)||b.mode!=='shadow'||!safe(b.stage,1,4)||!safe(b.wave,1,3)||
   !safe(b.turn,0,36)||!safe(b.enemyHp,0,100000)||!safe(b.enemyMaxHp,1,100000)||
   b.enemyHp>b.enemyMaxHp||!safe(b.playerHp,0,100000)||!safe(b.playerMaxHp,1,100000)||
   b.playerHp>b.playerMaxHp||!safe(b.power,0,100000)||!safe(b.attackRanks,0,9)||
   !safe(b.wardRanks,0,9)||!safe(b.lastRallyTurn,0,36)||
   !safe(b.lastTurnAt,1e12,2e13)||!['strike','crush','shield','drain'].includes(b.enemyIntent)||
   !object(b.cooldowns)||!Object.entries(b.cooldowns).every(([hero,turn])=>heroMap.has(hero)&&safe(turn,1,40))))
  throw Error('Gölge Sınırı savaş kaydı geçersiz.');
 const mastery=shadowMasterySnapshot(data);
 if(!safe(data.revision,1,1e12)||data.lastReport!==null&&!object(data.lastReport))
  throw Error('Sınır raporu bozuk.');
 return {heroPaths:structuredClone(data.heroPaths),cleared:[...data.cleared],stars:{...data.stars},
  battle:b?structuredClone(b):null,lastReport:data.lastReport?structuredClone(data.lastReport):null,revision:data.revision,
  masteryXp:mastery.xp,masteryRank:mastery.rank,masteryClaimed:mastery.claimed,
  weeklyRenown:mastery.weekly,weeklyWins:mastery.wins,weeklyLimit:mastery.limit,week:mastery.week};
}
export async function shadowRequest(action,{target=null,aux=null,requestId=null,fetcher=fetch}={}){
 if(!['get','train','start','turn','abandon','claim_mastery'].includes(action))throw Error('Bilinmeyen Gölge Sınırı eylemi.');
 if(action==='train'&&(!heroMap.has(target)||!['assault','warden'].includes(aux)))
  throw Error('Uzmanlık seçimi geçersiz.');
 if(action==='start'&&!stageMap.has(Number(target)))throw Error('Sınır seferi geçersiz.');
 if(action==='turn'&&(!['strike','guard','feint','rally'].includes(aux)&&
  !(typeof aux==='string'&&/^skill:(aldren|lyra|rovan|mira|doran|vesper|eira)$/.test(aux))))
  throw Error('Savaş hamlesi geçersiz.');
 const session=await freshAccountSession(fetcher);
 if(!session?.access_token||!session.user?.id)throw Error('Sınır seferi için hesabına giriş yap.');
 let response,payload;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_shadow_api',{
   method:'POST',signal:AbortSignal.timeout(20000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_target:action==='train'||action==='start'?String(target):null,
    p_aux:action==='train'||action==='turn'?aux:null,
    p_request_id:action==='get'?null:(requestId??crypto.randomUUID())})
  });
  payload=await response.json();
 }catch{throw Error('Gölge Sınırı sunucusuna ulaşılamadı. Kayıtları yeniden kontrol et.');}
 if(!response.ok)throw Error(payload?.message||'Sunucu seferi reddetti.');
 return {identity:session.user.id,snapshot:validateShadowSnapshot(payload)};
}
export function heroDisciplinesMarkup(front,account,resources={},busy=false){
 if(!front||!account)return '<section class="shadow-discipline"><h3>Kahraman Uzmanlığı</h3><p>Sunucu uzmanlık kaydı yükleniyor.</p></section>';
 const paths=front.heroPaths||{},war=!!front.battle||!!account.mission;
 return `<section class="shadow-discipline" aria-label="Kahraman uzmanlık ağacı">
  <div class="shadow-section-head"><span class="eyebrow">KALICI UZMANLIK · 3 RÜTBE</span>
   <h3>Kahraman Disiplinleri</h3><p>Kahramanların Hücum veya Muhafız yolunu seçer. Yön değiştirmek mümkün değil; iki yol da yalnızca resmî Gölge Sınırı seferlerinde etkilidir.</p></div>
  <div class="shadow-disciplines">${HEROES.filter(h=>(account.heroes||{})[h.id]).map(h=>{
    const path=paths[h.id],rank=path?.rank||0,next=HERO_TRAINING[rank];
    const affordable=next&&resources.gold>=next.gold&&resources.aether>=next.aether&&resources.stone>=next.stone;
    const unlocked=next&&(account.heroes[h.id]||0)>=next.level&&account.cleared.length>=next.story&&account.act2Cleared.length>=next.act2;
    const choices=path?HERO_DISCIPLINES.filter(x=>x.id===path.path):HERO_DISCIPLINES;
    return `<article class="shadow-hero">
      <div class="shadow-hero-title"><img src="assets/${h.id}.webp" alt=""><strong>${esc(h.name)}</strong><small>Seviye ${account.heroes[h.id]} · Rütbe ${rank}/3</small></div>
      ${choices.map(d=>`<div class="shadow-discipline-branch"><b>${d.icon} ${esc(d.name)}</b><small>${esc(d.description)}</small>
       <button class="${rank?'secondary':'primary'}" data-shadow-train="${h.id}" data-shadow-path="${d.id}"
        ${!next||!unlocked||!affordable||war||busy?'disabled':''}>${rank>=3?'En yüksek rütbe':!unlocked?'Seviye / bölge kilitli':!affordable?'Kaynak eksik':rank?'Rütbe '+(rank+1)+' eğit':'Yolu seç'}
       </button></div>`).join('')}
      ${next?`<small class="shadow-training-cost">Sonraki rütbe: ${num(next.gold)} altın · ${num(next.aether)} yıldız özü · ${num(next.stone)} taş · Kahraman SV ${next.level}</small>`:'<small class="shadow-training-cost">✦ Uzmanlık tamamlandı</small>'}
     </article>`;
   }).join('')}</div></section>`;
}
export function shadowFrontierMarkup(front,account,now=Date.now(),busy=false,{hiddenReportAt=null,audioEnabled=false,voiceEnabled=false,render3D=true}={}){
 if(!front||!account)return '<section class="shadow-frontier"><h3>🌘 Gölge Sınırı</h3><p>Yeni sefer ve kahraman uzmanlıkları sunucuda doğrulanıyor.</p><button class="secondary" data-shadow-refresh>Yenile</button></section>';
 const b=front.battle,report=front.lastReport;
 const intentHelp={
  strike:'Normal hücum: güçlü saldırı yapabilir veya toparlanabilirsin.',
  crush:'☄ Ağır darbe geliyor: Savun komutu hasarı çok azaltır.',
  shield:'🛡 Kalkan kalktı: Aldat veya kahraman yeteneği kullan.',
  drain:'☾ Can emme geliyor: hasarı hızlı yükselt.'};
 const waiting=b?Math.max(0,3000-(now-b.lastTurnAt)):0;
 const phase=b?shadowBossPhase(b.stage,b.wave,b.enemyHp,b.enemyMaxHp):null;
 const enraged=phase?.id==='eclipse-rage';
 const sound=shadowVoiceStatus({audio:audioEnabled,voice:voiceEnabled});
 const skills=b?(account.team||[]).map(id=>{
   const h=heroMap.get(id);if(!h)return '';
   const cooldown=Math.max(0,(b.cooldowns?.[id]||0)-(b.turn+1));
   return `<button class="secondary" data-shadow-move="skill:${id}" ${waiting||cooldown||busy?'disabled':''}>${esc(h.name)} · ${cooldown?'Yenileniyor '+cooldown+' tur':'Özel yetenek'}</button>`;
 }).join(''):'';
 const status=b?`<article class="shadow-active-battle" aria-label="Gölge Sınırı aktif savaşı">
   <span class="eyebrow">⚔ GERÇEK SUNUCU SAVAŞI · DALGA ${b.wave} / 3 · TUR ${b.turn+1}</span>
   <div class="shadow-battle-visual" data-boss-region="${b.stage}" data-boss-wave="${b.wave}" data-boss-intent="${b.enemyIntent}" data-boss-enraged="${enraged?'true':'false'}">
     <div class="shadow-battle-illustration" data-shadow-scene="${b.stage}">
        <div class="shadow-svg-backdrop">${shadowBossArtwork(b.stage,{variant:'battle',wave:b.wave,intent:b.enemyIntent,enraged})}</div>
        <canvas data-shadow-3d-canvas class="shadow-boss-webgl" width="420" height="300" aria-hidden="true"></canvas>
        <div class="shadow-ambient-motes" aria-hidden="true">
          ${shadowAtmosphereParticles(b.stage).map((p,i)=>`<i style="--mote-x:${p.x}%;--mote-y:${p.y}%;--mote-delay:${p.delay}s;--mote-duration:${p.duration}s;--mote-size:${p.size}px" data-particle="${i}"></i>`).join('')}
        </div>
        <span class="shadow-visual-flash" aria-hidden="true"></span></div>
     <div class="shadow-battle-story">
       <span class="eyebrow">BÖLGE ${b.stage} · DALGA ${b.wave}/3</span>
       <h3>${esc(stageMap.get(b.stage)?.boss)}</h3>
       <div class="shadow-boss-phase" role="status"><strong>${esc(phase.title)}</strong><small>${esc(phase.hint)}</small></div>
       <p>${esc(intentHelp[b.enemyIntent]||'Düşmanın hamlesini izle.')}</p>
       <small>Patron canı: %${Math.round(b.enemyHp/b.enemyMaxHp*100)} · ${b.enemyIntent==='crush'?'Ağır Darbe':b.enemyIntent==='shield'?'Kalkan':b.enemyIntent==='drain'?'Can Emme':'Saldırı'}</small>
       <div class="shadow-av-controls" aria-label="Patron savaş ses ayarları">
         <button class="secondary" data-shadow-render-toggle aria-pressed="${render3D}" title="Gerçek 3D model veya hafif 2D çizim kullan">${render3D?'🧊 3D model':'▤ 2D çizim'}</button>
         <button class="secondary" data-shadow-audio-toggle aria-pressed="${sound.audio}">${sound.audio?'🔊 Ses açık':'🔈 Sesi aç'}</button>
         <button class="secondary" data-shadow-voice-toggle aria-pressed="${sound.voice}" ${!sound.audio?'disabled':''} title="${esc(sound.caption)}">${sound.voice?'🎙 Seslendirme açık':'🎙 Seslendirmeyi aç'}</button>
       </div>
       <p class="shadow-caption" data-shadow-caption aria-live="polite" aria-atomic="true">Seslendirme isteğe bağlıdır. ${esc(sound.caption)}</p>
     </div>
   </div>
   <div class="shadow-health"><div><strong>Takım ${num(b.playerHp)} / ${num(b.playerMaxHp)}</strong><progress max="${b.playerMaxHp}" value="${b.playerHp}"></progress></div>
   <div><strong>Patron ${num(b.enemyHp)} / ${num(b.enemyMaxHp)}</strong><progress max="${b.enemyMaxHp}" value="${b.enemyHp}"></progress></div></div>
   <small>Takım gücü ${num(b.power)} · Hücum rütbesi ${b.attackRanks} · Muhafız rütbesi ${b.wardRanks}
    ${waiting?' · Sonraki hamle için '+Math.ceil(waiting/1000)+' sn':''}</small>
   <div class="shadow-moves">
    <button class="primary" data-shadow-move="strike" ${waiting||busy?'disabled':''}>⚔ Saldır</button>
    <button class="secondary" data-shadow-move="guard" ${waiting||busy?'disabled':''}>🛡 Savun</button>
    <button class="secondary" data-shadow-move="feint" ${waiting||busy?'disabled':''}>◈ Aldat</button>
    <button class="secondary" data-shadow-move="rally" ${waiting||busy||b.lastRallyTurn>0&&b.turn+1-b.lastRallyTurn<4?'disabled':''}>♡ Toparlan</button>
    ${skills}
    <button class="text-button" data-shadow-action="abandon" ${busy?'disabled':''}>Seferden çekil</button>
   </div></article>`:'';
 const last=report&&!b&&report.at!==hiddenReportAt?shadowVictoryMarkup(report,SHADOW_STAGES):'';
 const cards=SHADOW_STAGES.map(stage=>{
  const completed=front.cleared.includes(stage.id),star=front.stars[stage.id]||0,
   act2Ready=account.act2Cleared.length>=stage.unlock,
   orderReady=stage.id<=front.cleared.length+1,available=act2Ready&&orderReady&&!b&&!account.mission;
  return `<article class="shadow-stage ${completed?'complete':''}">
    <div class="shadow-stage-symbol">${shadowBossArtwork(stage.id,{variant:'card',wave:3})}</div><span class="eyebrow">BÖLGE ${stage.id} / 4 · ${completed?'TEMİZLENDİ':act2Ready?'AÇIK':'KİLİTLİ'}</span>
    <h4>${esc(stage.region)}</h4><strong>${esc(stage.boss)}</strong>
    <p>${esc(stage.description)}</p><small>${esc(stage.tip)}</small>
    <span class="shadow-stars" aria-label="${star} yıldız">${'★'.repeat(star)}${'☆'.repeat(3-star)}</span>
    <small>İkinci Perde gereksinimi: ${stage.unlock} / 8</small>
    <small>İlk zaferde: ${esc(itemMap.get(stage.firstItem)?.name||stage.firstItem)}</small>
    <button class="${available?'primary':'secondary'}" data-shadow-start="${stage.id}" ${!available||busy?'disabled':''}>${b?'Savaş sürüyor':!act2Ready?'İkinci Perde gerekli':!orderReady?'Önceki bölge gerekli':completed?'Yeniden sefer':'⚔ Sefere başla'}</button>
   </article>`;
 }).join('');
 return `<section class="shadow-frontier" id="shadow-frontier" aria-label="Dört yeni Gölge Sınırı sefer bölgesi">
   <header class="shadow-section-head"><span class="eyebrow">YENİ PERDE · 4 BÖLGE · 12 OPERASYON</span>
     <h3>🌘 Gölge Sınırı</h3><p>İkinci Perde boyunca açılan dört ayrı patron. Her savaş üç dalgalı, her ilk zaferde özel ekipman ve 1–3 yıldız; eski bölümleri tekrar oynayabilirsin.</p>
     <strong>${front.cleared.length} / 4 TEMİZLENDİ</strong>
     <div class="shadow-progress-ribbon" aria-label="Dört bölgenin tamamlanma durumu">
      ${SHADOW_STAGES.map(stage=>`<span class="${front.cleared.includes(stage.id)?'is-cleared':''}" aria-label="Bölge ${stage.id}: ${front.cleared.includes(stage.id)?'Temizlendi':'Bekliyor'}">${front.cleared.includes(stage.id)?'✓':stage.id}</span>`).join('')}
     </div></header>
   ${status}${last}
   ${shadowMasteryMarkup(front,{busy,inBattle:!!b||!!account?.mission})}
   <div class="shadow-stage-grid">${cards}</div>
   <small class="shadow-footer">Bu bölgelerdeki galibiyetler sunucu zafer sayacına işlenir ve tekrar oynanabilir günlük/haftalık hedefleri ilerletir. İlk zafer ekipmanı tekrarlanmaz.</small>
   <button class="secondary" data-shadow-refresh ${busy?'disabled':''}>↻ Sınır hesabını yenile</button>
  </section>`;
}
