import * as R from './rules.js';
import {createGameAudio} from './audio.js';
import {loadAccountSession,accountSession,accountSignIn,accountSignUp,accountSignOut,accountBackup,accountRequestPasswordReset,accountAcceptAuthHash,accountResendConfirmation,accountUpdatePassword} from './account-auth.js';
import {createAccountSync} from './account-sync.js';
import {makeRecoveryPoint,recoveryPoints,loadRecoveryPoint} from './recovery-points.js';
import {progressionSummary} from './save-summary.js';
import { createScene, paintBuildingPreview } from './illustrated-scene.js';
import { placeCityLabels } from './city-layout.js';
import { ROLES, HERO_LORE, CHAPTERS } from './content.js';
import { ART_EVOLUTION as BUILDING_EVOLUTION } from './city-art-layout.js';
import { battleMarkup } from './battle-view.js';
import { createBattleRunner } from './battle-runner.js';
import {exportSave,importSave} from './backup.js';
import {createSaveGuard} from './save-guard.js';
import {guildRequest,guildOnline,GUILD_TOKEN_KEY} from './guild-client.js';
import {mountTraining} from './tactics-view.js';
import {mountArena} from './arena-view.js';
import {practiceReward} from './battle-assist.js';
import {mountTeamArena} from './team-view.js';
import {ensureTestCommander} from './quick-play.js';
import {commanderPath} from './commander-path.js';
import {battleExperience} from './battle-experience.js';
import {armoryArt} from './armory-art.js';
import {armoryMarkup} from './armory-v212.js';
import {createMatchReceiptRecovery} from './match-receipts.js';
import {buildingWorkshopMarkup} from './building-workshop.js';
import {labyrinthMarkup} from './labyrinth-view.js';
import {premiumCatalogMarkup} from './premium-catalog.js';
import {cloudSaveRequest,cloudBackupSummary} from './cloud-save.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const number = value => new Intl.NumberFormat('tr-TR', { notation: value >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
const iconPaths = {
  keep: '<path d="M4 20V8l4 2V7l4 2V4h4v7l4-2v11z"/><path d="M9 20v-5h6v5M12 4V2"/>',
  farm: '<path d="M4 20V10l8-6 8 6v10M8 20v-5h8v5M12 4V2M3 7l2 1M21 7l-2 1"/>',
  lumber: '<path d="M4 20 19 5M7 17l-3-3M10 14l-3-3M13 11l-3-3M16 8l-3-3M19 5l2-2"/>',
  quarry: '<path d="m3 19 5-8 3 4 4-9 6 13zM7 19h10"/>',
  forge: '<path d="M4 20h16M7 17l2-5h6l2 5M12 12V4M9 7l3-3 3 3"/>',
  tavern: '<path d="M5 21V5h14v16M8 5V3h8v2M9 9h6M9 13h6M9 17h6"/>',
  observatory: '<circle cx="12" cy="12" r="3"/><path d="m3 16 5-5 4 4 8-9M16 6h4v4"/>',
  heroes: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.4-4.2 3.2-6.5 8-6.5s7.6 2.3 8 6.5M12 2v2M8 8h.1M16 8h.1"/>',
  expedition: '<path d="m3 20 7-17 4 10 7-3-9 13-3-10z"/>',
  keepMenu: '<path d="M3 20V8l4 2V7l5 2V4h4v7l5-2v11z"/>',
  journal: '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
  star: '<path d="m12 2 2.4 6.8L21 11l-6.6 2.3L12 20l-2.4-6.7L3 11l6.6-2.2z"/>',
  shop: '<path d="M3 8h18l-2-5H5zM5 8v13h14V8M9 21v-7h6v7"/><path d="M3 8c0 5 6 5 6 0 0 5 6 5 6 0 0 5 6 5 6 0"/>',
  guild: '<path d="M12 3l7 4v5c0 5-4 8-7 9-3-1-7-4-7-9V7zM9 10h6M12 7v8"/>',
  armor: '<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5zM12 5v14M7 8h10"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M15 8.5c-.7-.7-1.5-1-2.7-1-1.5 0-2.5.8-2.5 2s.9 1.8 2.5 2.1 2.5.8 2.5 2-.9 2.2-2.7 2.2c-1.1 0-2.1-.4-2.9-1.2M12 6v12"/>',
  wood: '<path d="m5 4 14 16M8 7l3-3M11 10l4-4M14 13l3-3M17 16l3-3"/>',
  stone: '<path d="m12 3 8 4v10l-8 4-8-4V7zM4 7l8 5 8-5M12 12v9"/>',
};
const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.star}</svg>`;
const resourceIcon = { gold: 'coin', wood: 'wood', stone: 'stone', aether: 'star' };
const battlePolicy=battleExperience(window.location);
const resourceName = { gold: 'Altın', wood: 'Kereste', stone: 'Taş', aether: 'Yıldız özü' };
const navItems = [ ['keep', 'keep', 'Köy'], ['expedition', 'expedition', 'Seferler'], ['heroes', 'heroes', 'Kahramanlar'], ['armory', 'armor', 'Çanta'], ['guild', 'guild', 'İttifak'], ['shop', 'shop', 'Mağaza'] ];
let state, saveInitialRaw=null;
try {saveInitialRaw=localStorage.getItem(R.STORAGE_KEY);state=R.restoreState(saveInitialRaw);}
catch {state=R.createState();}
const saveGuard=createSaveGuard(localStorage,R.STORAGE_KEY,saveInitialRaw);

let battleSpeed=1, battleFxExpires=0;
let guildSnapshot=null,guildError='',guildBusy=false,guildAvailable=null;
let cloudSaveInfo=null,cloudSaveBusy=false;
let accountBackupInfo=null,accountBusy=false,accountSyncInfo={status:'disconnected'},accountRecovering=false;
let syncConflictDetails=null,confirmationEmail='',signupPending=false;
const authRedirect=()=>location.protocol==='https:'?location.origin+location.pathname:'https://umutcandar.github.io/starfort-beta/starfort/';
const accountSync=createAccountSync({
 fetchRemote:()=>accountBackup('get'),saveRemote:(saved,revision)=>accountBackup('save',{state:saved,revision}),
 readLocal:()=>state,validateLocal:saved=>importSave(exportSave(saved)),
 onStatus:info=>{accountSyncInfo=info;if(info.status==='synced')syncConflictDetails=null;if(activeView==='settings')renderSettings();},
 onConflict:details=>{
   syncConflictDetails=details;
   notify('Bu cihaz ile bulut kaydı farklı. Hiçbiri silinmedi; Ayarlar bölümünden seçim yap.');
   if(!$('#battle-dialog').open){activeView='settings';render();}
 }
});
loadAccountSession();
const pendingMatchRecovery=createMatchReceiptRecovery({storage:localStorage,userId:accountSession()?.user?.id});
if(pendingMatchRecovery.pending){
  void pendingMatchRecovery.flush();
  window.addEventListener('online',()=>void pendingMatchRecovery.flush());
}
const gameAudio=createGameAudio();
let guildToken='';try{guildToken=localStorage.getItem(GUILD_TOKEN_KEY)||''}catch{}
let trainingCleanup = null;
let questPanelExpanded=false;
let activeView = 'keep', selectedBuilding = 'keep', toastTimer, scene, selectedSlot = 0, selectedArmoryHero = 'aldren', selectedBagSlot = 'all', selectedBagItem='starbreaker', trialState = null;
const cityLabelNodes = new Map();
const resourcesEl = $('#resources'), navEl = $('#navigation'), inspectorEl = $('#inspector'), workspaceEl = $('#workspace'), questEl = $('#next-quest');
const combatRunner=createBattleRunner({
  advance:tickCombat,
  canRun:()=>$('#battle-dialog').open&&!document.hidden&&(trialState||state).battle?.status==='active',
  onPause:()=>{if(!trialState)persist(); if($('#battle-dialog').open)renderBattle();},
});

function grantReward(r,won,source){
  state.res.gold=(state.res.gold||0)+r.gold;state.res.aether=(state.res.aether||0)+r.aether;
  persist();try{renderResources();}catch{}
  notify(`${won?'Zafer':'Savaş bitti'}: +${r.gold} ◈${r.aether?` +${r.aether} ✦`:''}${r.bonus?' · Günün ilk zaferi x2!':''}${source}`);
}
window.addEventListener('starfort:practice-result',async e=>{
  const {won,difficulty,mode='duel',matchId}=e.detail||{};
  const token=guildToken||localStorage.getItem(GUILD_TOKEN_KEY);
  const id=String(matchId||'').replace(/[^a-f0-9]/gi,'').slice(0,32);
  if(token&&id.length>=8){
    try{const r=await guildRequest('reward/claim',token,{mode,difficulty,won:!!won,matchId:id});grantReward(r,won,'');return;}
    catch(error){if(!/ulaşılamadı|bulunamadı|404|fetch|timeout|abort/i.test(error.message||'')){notify('Ödül verilmedi: '+error.message);return;}}
  }
  const day=new Date().toISOString().slice(0,10);
  const first=won&&localStorage.getItem('starfort:practice-win-day')!==day;if(first)localStorage.setItem('starfort:practice-win-day',day);
  grantReward(practiceReward(difficulty,won,first,mode),won,' (çevrimdışı, yerel kayıt)');
});
function persist() {
  try {
    if(!saveGuard.write(state)){
      $('#save-status').textContent='Başka sekme ilerledi · Yenile';
      $('#save-status').title='Bu sekme eski kayıtla açıldı. Yeni ilerlemeyi korumak için oyunu yenile.';
      combatRunner.pause();
      return false;
    }
    $('#save-status').textContent='Yerel kayıt hazır';accountSync.noteSaved();return true;
  }catch{$('#save-status').textContent='Kayıt başarısız';return false;}
}
window.addEventListener('storage',event=>{
  if(event.key!==R.STORAGE_KEY)return;
  if(!saveGuard.observe(event.newValue)){
    combatRunner.pause();
    $('#save-status').textContent='Diğer sekme kaydetti · Yenile';
    notify('Başka sekmedeki yeni ilerleme korunuyor. Bu sekmeyi yenileyerek güncel oyuna dön.');
  }
});

function notify(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}
function result(action, success) { if (!action.ok) { notify(action.error); return false; } if (success) notify(success); persist(); render(); return true; }
function renderResources() {
  $('#commander-power').textContent=number(R.teamPower(state)); $('#village-level').textContent=state.buildings.keep;
  resourcesEl.innerHTML = Object.entries(R.RESOURCES).map(([id, item]) => `<div class="resource" data-res="${id}">${svg(resourceIcon[id])}<span><b>${number(state.res[id])}</b><small>${item.name}</small></span></div>`).join('');
}
function renderNav() {
  navEl.innerHTML = navItems.map(([id, icon, label]) => `<button class="nav-item ${(activeView === id || (activeView === 'campaign' && id === 'expedition')) ? 'active' : ''}" data-view="${id}" aria-label="${label}" aria-current="${(activeView === id || (activeView === 'campaign' && id === 'expedition')) ? 'page' : 'false'}">${svg(icon)}<span>${label}</span></button>`).join('') + '<div class="rail-foot">✦ &nbsp; BETA · UZUN OYUN TESTİ</div>';
}
function renderPicker() {
  $('#building-picker').innerHTML = R.BUILDINGS.map(building => `<button class="building-choice ${selectedBuilding === building.id ? 'active' : ''}" data-building="${building.id}" aria-label="${building.name}, seviye ${state.buildings[building.id]}">${svg(building.id)}<span>${building.name.replace('Karaorman ', '').replace('Yıldız ', '').replace('Kor ', '').replace('Aytaşı ', '')}</span></button>`).join('');
  $('#keep-caption').textContent = `Kale seviyesi ${state.buildings.keep}`;
  for (const building of R.BUILDINGS) {
    let label = cityLabelNodes.get(building.id);
    if (!label) {
      label = document.createElement('button'); label.className = 'city-label'; label.dataset.building = building.id;
      label.innerHTML = `<span class="city-label-level"></span><span class="city-label-name"></span>`;
      $('#city-labels').append(label); cityLabelNodes.set(building.id, label);
    }
    label.querySelector('.city-label-level').textContent = state.buildings[building.id];
    label.querySelector('.city-label-name').textContent = building.name.replace('Karaorman ', '').replace('Yıldız Rasathanesi', 'Rasathane').replace('Kor ', '').replace('Keresteliği','Kerestelik').replace('Demirhanesi','Demirhane');
    label.classList.toggle('selected', selectedBuilding === building.id);
    label.setAttribute('aria-label', `${building.name}, seviye ${state.buildings[building.id]}, geliştirmeyi aç`);
  }
  renderCityProduction();
  const daily=R.dailyRewardState(state);$('#daily-status').textContent=daily.available?'Sandığı aç':'Yarın tekrar gel';
  $('#daily-reward').classList.toggle('ready',daily.available);$('#daily-reward').disabled=!daily.available||state.battle?.status==='active';
}
function renderCityProduction() {
  const gain = R.production(state);
  const total = Object.values(gain).reduce((sum, n) => sum+n, 0);
  $('#city-production').textContent = total ? Object.entries(gain).filter(([,n])=>n).map(([id,n])=>`${number(n)} ${resourceName[id]}`).join(' · ') : 'Kaynaklar birikiyor';
  $('.city-collect').classList.toggle('ready', total > 0);
}
function costHtml(cost, reward = false) {
  return Object.entries(cost || {}).map(([id, amount]) => `<span class="cost ${!reward && state.res[id] < amount ? 'short' : ''}" title="${resourceName[id]}">${svg(resourceIcon[id])}${reward ? '+' : ''}${number(amount)}</span>`).join('');
}

function buildingProduction() {
  return `<div class="production-box"><div class="production-top"><strong>Köyün üretimi</strong><small>24 saate kadar</small></div><div class="cost-list" id="production-gain">${costHtml(R.production(state), true)}</div><button class="secondary wide" data-collect>Biriken kaynakları topla</button></div>`;
}

function heroCard(hero) {
  const unlocked = !!state.heroes[hero.id], inTeam = state.team.includes(hero.id), level = state.heroes[hero.id]?.level || 1;
  const cost = R.heroCost(state, hero.id), canUpgrade = unlocked && level < 20 && state.battle?.status !== 'active' && Object.entries(cost).every(([id, amount]) => state.res[id] >= amount);
  const attack = unlocked ? R.heroStats(state,hero.id).attack : hero.attack;
  const hp = unlocked ? R.heroStats(state,hero.id).maxHp : hero.hp;
  return `<article class="hero-card ${inTeam ? 'selected' : ''} ${unlocked ? '' : 'locked'}" style="--hero:${hero.color}">
    <div class="hero-portrait">${heroPortrait(hero)}<span class="role-tag">${ROLES[hero.role]}</span><span class="hero-level">${unlocked ? 'SEV. '+level : 'KİLİTLİ'}</span><div class="portrait-title"><small>${hero.title}</small><h3>${hero.name}</h3></div></div>
    <div class="hero-card-content"><p>${HERO_LORE[hero.id]}</p><div class="hero-stats"><span>⚔ ${attack} saldırı</span><span>♡ ${hp} can</span></div><div class="skill">${R.HERO_ABILITIES[hero.id].name}: ${R.HERO_ABILITIES[hero.id].description}</div>
    ${unlocked ? `<button class="${inTeam ? 'secondary' : 'primary'}" data-team="${hero.id}" ${state.battle?.status === 'active' ? 'disabled' : ''}>${state.team[selectedSlot] === hero.id ? 'Bu konumda' : `${selectedSlot + 1}. konuma ${inTeam ? 'taşı' : 'al'}`}</button><div class="cost-list">${costHtml(cost)}</div><button class="secondary" data-upgrade-hero="${hero.id}" ${canUpgrade ? '' : 'disabled'}>${level >= 20 ? 'En yüksek seviye' : 'Kahramanı geliştir'}</button><button class="text-button wide" data-armory-hero="${hero.id}">Ekipmanlarını düzenle</button>` : `<div class="unlock-note">${svg('expedition')} ${R.STAGES[hero.unlockStage - 1].name} zaferiyle katılır</div>`}</div></article>`;
}

function heroPortrait(hero) {
  return `<img class="character-art" src="assets/${hero.id}.webp" alt="${hero.name}, ${hero.title}" width="1024" height="1536" decoding="async">`;
}

function renderBuildingDialog() {
  const dialog=$('#building-dialog'), previousScroll=dialog.scrollTop;
  const building=R.BUILDINGS.find(item=>item.id===selectedBuilding);
  if(!building)return;
  $('#building-content').innerHTML=buildingWorkshopMarkup(state,selectedBuilding,{icon:svg,number,now:Date.now()});
  dialog.scrollTop=previousScroll;
  for(const canvas of $('#building-content').querySelectorAll('[data-building-preview]')){
    paintBuildingPreview(canvas,building.id,Number(canvas.dataset.buildingPreview)).catch(()=>{
      if(canvas.isConnected)canvas.replaceWith(document.createTextNode('Görünüm yüklenemedi.'));
    });
  }
}
function openBuilding(id) {
  if (!R.BUILDINGS.some(building => building.id === id)) return;
  $('#building-picker').hidden=true; $('[data-city-buildings]').setAttribute('aria-expanded','false');
  selectedBuilding = id; activeView = 'keep'; render(); scene?.focus(id);
  renderBuildingDialog();
  if (!$('#building-dialog').open) $('#building-dialog').showModal();
}

function renderInspector() {
  const building = R.BUILDINGS.find(item => item.id === selectedBuilding) || R.BUILDINGS[0], level = state.buildings[building.id], cost = R.upgradeCost(state, building.id);
  const blocked = level >= building.maxLevel || (building.id !== 'keep' && level >= state.buildings.keep + 1) || Object.entries(cost).some(([id, amount]) => state.res[id] < amount) || state.battle?.status === 'active';
  const team = state.team.map(id => R.HEROES.find(hero => hero.id === id));
  inspectorEl.innerHTML = `<div class="building-details"><div class="section-head"><small>KÖY YÖNETİMİ</small><span class="level-badge">SEVİYE ${level}</span></div><div class="building-portrait">${svg(building.id)}</div><h2>${building.name}</h2><p class="building-description">${building.description}</p><div class="stat-line"><span>Gelişim</span><b>${level} / ${building.maxLevel}</b></div>${building.production ? `<div class="stat-line"><span>Üretim hızı</span><b>${number(building.production.perMinute * level * (1 + (state.buildings.keep - 1) * .05))} ${resourceName[building.production.resource]} / dk</b></div>` : `<div class="stat-line"><span>Köy etkisi</span><b>${building.id === 'keep' ? '+%5 üretim / seviye' : building.id === 'forge' ? '+%5 saldırı / seviye' : '+%4 can / seviye'}</b></div>`}<div class="cost-list">${costHtml(cost)}</div><button class="primary wide" data-upgrade-building="${building.id}" ${blocked ? 'disabled' : ''}>${level >= building.maxLevel ? 'En yüksek seviye' : `Yapıyı geliştir · ${number(cost.gold || 0)} altın`}</button>${buildingProduction(building)}</div><div class="squad-block"><div class="squad-heading"><h3>Kahramanlar</h3><button class="text-button" data-view="heroes">Dizilimi düzenle</button></div><div class="squad">${team.map(hero => `<div class="squad-member">${heroPortrait(hero)}<span>${hero.name}</span><small>Lv.${state.heroes[hero.id].level}</small></div>`).join('')}</div><div class="team-power"><span>Dizilim gücü</span><strong>${number(R.teamPower(state))} ✦</strong></div></div><p class="inspector-note">Yapılar yükseldikçe görünüşleri değişir. Üretim 24 saate kadar birikir; ilk 4 saat tam hızda, sonrası yavaş üretir.</p>`;
}
function renderQuest() {
  // A compact Sefer shortcut keeps the village panorama unobstructed.
  const expanded=activeView==='expedition' && questPanelExpanded;
  questEl.hidden=!expanded;
  const mini=$('#quest-mini');
  mini.hidden=expanded || !['keep','expedition'].includes(activeView);
  mini.setAttribute('aria-expanded',String(expanded));
  const active=state.battle?.status==='active';
  const stage=active?R.STAGES[state.battle.stageId-1]:R.STAGES[state.cleared.length];
  if(!stage){
    questEl.innerHTML=`<button class="quest-dismiss" type="button" data-quest-close aria-label="Sefer kartını kapat" title="Kapat">×</button><div class="quest-crown"><span aria-hidden="true">✦</span>Sıradaki Sefer</div>
      <div class="quest-layout"><div class="quest-illustration" aria-hidden="true"></div><div class="quest-body"><small>KUZEY SINIRI · ZAFER</small>
      <h3>Hikâye tamamlandı!</h3><p>Sekiz sefer tamamlandı. Yıldız derecelerini geliştirmeye ve yeni mücadelelere devam et.</p>
      <div class="quest-actions"><button class="primary" data-action="open-expedition">Seferlere dön ❯</button></div></div></div>`;
    return;
  }
  const chapter=CHAPTERS[stage.id-1];
  const power=R.teamPower(state),gear=R.itemById(R.FIRST_CLEAR_LOOT[stage.id]),gate=R.stageRequirements(state,stage,power);
  const rewards=Object.entries(stage.reward).map(([id,amount])=>`<span class="quest-reward-token" title="${resourceName[id]}">${svg(resourceIcon[id])}<b>${number(amount)}</b></span>`).join('');
  questEl.innerHTML=`<button class="quest-dismiss" type="button" data-quest-close aria-label="Sefer kartını kapat" title="Kapat">×</button><div class="quest-crown"><span aria-hidden="true">✦</span>Sıradaki Sefer</div>
    <div class="quest-layout">
      <div class="quest-illustration" aria-hidden="true"><span>✧</span></div>
      <div class="quest-body">
        <small>Bölüm ${stage.id} / 8 · ${esc(chapter.name)}</small>
        <h3>${stage.name}</h3>
        <div class="quest-power ${power<stage.recommendedPower?'underpowered':''}">
          <span>⚔ Önerilen Güç <strong>${number(stage.recommendedPower)}</strong></span>
          <small>Takımın: ${number(power)}</small>
        </div>
        <div class="quest-reward-title">Ödüller:${gear&&!state.cleared.includes(stage.id)?` <small>+ ${esc(gear.name)}</small>`:''}</div>
        <div class="quest-rewards">${rewards}</div>
        <div class="quest-actions">
          <button class="primary" ${active?'data-action="resume-battle"':gate.available?`data-stage="${stage.id}"`:'data-action="open-expedition"'}>${active?'⚔ Savaşa Dön':gate.available?'⚔ Savaşa Başla':'⚑ Önce Sefer Şartları'} <span aria-hidden="true">❯</span></button>
          <button class="text-button" data-action="open-expedition">Tüm seferler</button>
        </div>
      </div>
    </div>`;
}

function renderHeroes() {
  const chosen = state.team.map(id => R.HEROES.find(hero => hero.id === id));
  workspaceEl.innerHTML = `<header><div><span class="eyebrow">KÜL GECESİNDEN SAĞ KALANLAR</span><h2>Kahramanlar</h2><p>Bir kalkan. Bir kıvılcım. Birlikte tutulan bir yemin.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="team-editor"><div><span class="eyebrow">SAVAŞ DİZİLİMİ</span><p>Konumu seç, ardından kahramanı yerleştir.</p></div><strong>${number(R.teamPower(state))}<small>TAKIM GÜCÜ</small></strong></div>
    <div class="formation">${chosen.map((hero, index) => `<button class="formation-slot ${selectedSlot === index ? 'active' : ''}" data-select-slot="${index}" aria-pressed="${selectedSlot === index}">${heroPortrait(hero)}<span><small>${String(index+1).padStart(2,'0')} · ${ROLES[hero.role]}</small><b>${hero.name}</b></span><span class="slot-marker">${selectedSlot === index ? '✦' : '+'}</span></button>`).join('')}</div>
    ${state.battle?.status === 'active' ? '<p class="inline-note">Dizilimi değiştirmek için devam eden savaşı tamamla.</p>' : ''}<div class="hero-grid">${R.HEROES.map(heroCard).join('')}</div>`;
}

function renderCommanderPath(){
  const route=commanderPath(state);
  const next=route.next;
  return `<section class="commander-path" aria-label="Komutan Yolu"><div class="commander-path-header"><div><span class="eyebrow">OYUNCU GELİŞİM HARİTASI · İSTEĞE BAĞLI</span><h3>Komutan Yolu</h3><p>Bir sonraki anlamlı hedefini gösterir; kaçırılan ödül, giriş serisi veya ödeme koşulu yoktur.</p></div><strong class="commander-path-count">${route.completed} / ${route.total} adım</strong></div><div class="commander-path-track" role="progressbar" aria-valuemin="0" aria-valuemax="${route.total}" aria-valuenow="${route.completed}" aria-label="Komutan Yolu ilerlemesi"><span style="width:${route.completed/route.total*100}%"></span></div><div class="commander-path-next"><div><b>${next?esc(next.title):'Kuzeyin usta komutanısın'}</b><small>${next?esc(next.detail):'Bütün gelişim hedeflerini tamamladın. Klan arkadaşlarınla yeni savaşlar deneyebilirsin.'}</small></div>${next?`<button class="secondary" data-view="${next.action}">${esc(next.cta)}</button>`:'<button class="secondary" data-view="guild">İttifaklara git</button>'}</div><div class="commander-path-stages">${route.steps.map(step=>`<span class="${step.completed?'complete':''}" title="${esc(step.detail)}">${step.completed?'✓':'○'} ${esc(step.title)}</span>`).join('')}</div></section>`;
}
function renderWeeklyRift(){
  const r=R.weeklyRiftStatus(state);
  return `<section class="weekly-rift"><div><span class="eyebrow">HAFTALIK DÖNÜŞEN MÜCADELE · YARIŞMASIZ</span><h3>Yıldız Yarığı · ${r.modifier.name}</h3><p>${r.modifier.detail}</p><p>${r.unlocked?`${R.STAGES[r.stageId-1].name} · ${r.total} farklı haftalık mühür kazanıldı. ${r.done?'Bu haftanın kozmetik mührünü aldın; istersen yeniden oynayabilirsin.':'Bu haftanın kozmetik mührü seni bekliyor.'}`:'Sekiz hikâye bölümünü temizlediğinde açılacak.'}</p></div><button class="${r.unlocked?'primary':'secondary'}" data-start-rift ${!r.unlocked||state.battle?.status==='active'?'disabled':''}>${r.unlocked?'Haftanın sınavına gir':'Hikâyeyi tamamla'}</button></section>`;
}
function renderContractCards() {
  const status=R.contractsStatus(state),next=status.upcoming;
  return `<section class="campaign-contracts" aria-label="Günlük komutan görevleri"><div class="contract-heading"><div><span class="eyebrow">GÜNLÜK KOMUTAN GÖREVLERİ · İSTEĞE BAĞLI</span><h3>Bugün kalende iz bırak</h3><p>Her gün yeni küçük hedefler. Seri kaybı veya ödeme zorunluluğu yok; ödüller yalnızca hikâye ilerlemesini destekler.</p></div><div class="banner-track"><b>✦ ${status.totalClaims} mühür</b><small>${next ? `Sonraki kozmetik unvan: ${next.name} (${next.count} mühür)` : 'Tüm unvanlar açıldı'}</small></div></div><div class="contract-grid">${status.contracts.map(c=>`<article class="contract-card"><span class="eyebrow">${c.progress} / ${c.target}</span><h4>${c.title}</h4><p>${c.detail}</p><div class="contract-progress"><i style="width:${c.progress/c.target*100}%"></i></div><small>Ödül: ${Object.entries(c.reward).map(([id,n])=>`${number(n)} ${resourceName[id]}`).join(' · ')}</small><button class="${c.progress>=c.target&&!c.claimed?'primary':'secondary'}" data-claim-contract="${c.id}" ${c.claimed||c.progress<c.target?'disabled':''}>${c.claimed?'Alındı':c.progress>=c.target?'Ödülü al':'Devam ediyor'}</button></article>`).join('')}</div><p class="contract-cosmetic">${status.earned.length?'Açılan kozmetik unvanlar: '+status.earned.join(' · '):'İlk unvan için 3 görev mühürü topla.'} · Unvanlar kozmetiktir, savaş gücünü artırmaz.</p></section>`;
}
function renderExpedition() {
  const starStatus=R.campaignStarStatus(state),season=R.seasonStatus(state);
  const completed=state.cleared.length===R.STAGES.length;
  const next = Math.min(state.cleared.length + 1, R.STAGES.length), currentStage = R.STAGES[next-1], chapter = CHAPTERS[next-1];
  workspaceEl.innerHTML = `<header><div><span class="eyebrow">KUZEY SINIRI · ${completed?'HİKÂYE TAMAMLANDI':`SEFER ${String(next).padStart(2,'0')} / 08`}</span><h2>${completed?'Kuzeyin Işığı Yeniden Doğdu':'Kuzeyin Sefer Günlüğü'}</h2><p>${completed?'Sekiz sefer tamamlandı. Yıldızlarını geliştir, usta sınavlarına gir.':'Köyün ışığını karanlığın unuttuğu topraklara taşı. Önce hikâyeni ilerlet.'}</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="campaign-hero"><div><span class="eyebrow">${String(next).padStart(2,'0')} / 08 · ${chapter.name}</span><h3>${currentStage.name}</h3><p>${chapter.brief}</p><span class="tactic">${chapter.tactic}</span></div></div>
    <article class="labyrinth-teaser"><div><span class="eyebrow">YILDIZALTI LABİRENTİ · YENİ MACERA</span><h3>Yıldızaltı Labirenti · 16 Kat</h3><p>Her hikâye bölümü iki kat açar. Sandıkları keşfet, kat muhafızlarını yen, Yıldız Kapısı'nı bul.</p><small>${state.labyrinth.cleared}/16 kat tamamlandı · ${state.cleared.length}/8 hikâye bölümü</small></div><button class="primary" data-labyrinth-open>✦ Labirente gir</button></article>
    <div class="campaign-priority"><strong>✦ ANA HİKÂYE · ${state.cleared.length}/8 BÖLGE</strong><small>Seferi seç, kahramanlarını donat, yıldızlarını tamamla.</small></div>
    <div class="progress-banner"><span>${state.cleared.length} / 8 bölge temizlendi</span><div class="progress-track"><span style="width:${state.cleared.length / 8 * 100}%"></span></div><span>Takım gücü ${number(R.teamPower(state))}</span></div>
    <section class="star-track" aria-label="Sefer yıldız yolu"><strong>★ Yıldız Yolu · ${starStatus.total}/24</strong><small>Her normal sefer 1–3 yıldız kazandırır. Takımın ne kadar sağlıklı bitirirse o kadar fazla yıldız alırsın. İlk beş farklı 3 yıldız zaferi özel ekipman açar. PvP sonuçları bu sayacı etkilemez.</small><div class="star-milestones">${starStatus.milestones.map(m=>`<span class="${m.unlocked?'unlocked':''}">${m.unlocked?'✓':'☆'} ${m.total}: ${esc(m.title)}</span>`).join('')}</div></section>
    <section class="season-quest" aria-label="Sezon görevleri"><span class="eyebrow">28 GÜNLÜK ÜCRETSİZ SEZON · PvE</span><h3>Yıldız Sezonu ${season.id} · ${season.points}/29</h3><p>Sefer kazan, kahraman geliştir, eşya üret ve labirenti keşfet. Unvanlar kalıcıdır ve PvP gücü vermez.</p><div class="season-goals">${season.progress.map(g=>`<span>${esc(g.name)} <b>${g.count}/${g.target}</b></span>`).join('')}</div><div class="season-titles">${season.titles.map(t=>`<button class="secondary" data-season-title="${esc(t.name)}" ${!t.ready||t.claimed?'disabled':''}>${t.claimed?'✓ ':''}${esc(t.name)} · ${t.target} puan</button>`).join('')}</div>${season.legacy.length?`<small>Kalıcı geçmiş unvanlar: ${season.legacy.map(esc).join(' · ')}</small>`:''}</section>
    <div class="veteran-intro"><b>Usta Seferleri</b><p>Temizlediğin bölgelere üç farklı güçlükte geri dön. Her yeni seviyede daha güçlü düşmanlar ve kozmetik ustalık mühürleri kazan. Ödüller hikâye kaynaklarıdır; çevrim içi PvP gücünü artırmaz.</p></div>
    <div class="stage-list">${R.STAGES.map(stage => {
      const done=state.cleared.includes(stage.id),gate=R.stageRequirements(state,stage,R.teamPower(state)),locked=stage.id>next||!gate.available,resume=state.battle?.status==='active'&&state.battle.stageId===stage.id;
      const medal=state.veteranMedals?.[stage.id]||0, veteranTier=Math.min(3,medal+1);
      return `<article class="stage-card ${done ? 'done' : stage.id === next ? 'current' : 'locked'}"><div class="stage-number">${done ? '✓' : String(stage.id).padStart(2, '0')}</div><div><span class="eyebrow">${CHAPTERS[stage.id-1].name} · ${stage.id<=2?'KOLAY':stage.id<=4?'NORMAL':stage.id<=6?'ZOR':'EFSANEVİ'}</span><h3>${stage.name}</h3><span class="stage-stars" aria-label="${state.campaignStars?.[stage.id]||0} / 3 yıldız">${'★'.repeat(state.campaignStars?.[stage.id]||0)}${'☆'.repeat(3-(state.campaignStars?.[stage.id]||0))}</span><p>${stage.description} · ${stage.enemyCount} düşman · Önerilen güç ${stage.recommendedPower}</p><div class="cost-list">${costHtml(done?R.replayReward(stage.id):stage.reward, true)}</div>${!done&&stage.id<=next&&gate.requirements.length?`<div class="stage-prerequisites">${gate.requirements.map(r=>`<small class="${r.met?'met':'unmet'}">${r.met?'✓':'◻'} ${esc(r.label)} (${r.value}/${r.target})</small>`).join('')}</div>`:''}${done?'<small class="replay-reward-note">↻ Tekrar zaferi: normal kaynak ödülünün %40\'ı. Yıldız derecesini artırabilirsin.</small>':''}${R.FIRST_CLEAR_LOOT[stage.id]?`<p class="loot-preview">${svg('forge')} İlk zafer: ${R.itemById(R.FIRST_CLEAR_LOOT[stage.id]).name}${done?' · Alındı':''}</p>`:''}</div><button class="${done ? 'secondary' : 'primary'}" ${resume ? 'data-action="resume-battle"' : `data-stage="${stage.id}"`} ${locked || (state.battle?.status === 'active' && !resume) ? 'disabled' : ''}>${resume ? 'Savaşa dön' : done ? 'Yeniden oyna' : locked ? 'Kilitli' : 'Savaşa gir'}</button>${done?`<button class="secondary veteran-start" data-veteran-stage="${stage.id}" data-veteran-tier="${veteranTier}" ${state.battle?.status==='active'?'disabled':''}>✦ Usta Seferi ${veteranTier} ${medal?`· ${medal}/3 mühür`: '· İlk sınav'}</button>`:''}</article>`;
    }).join('')}</div>
    ${renderCommanderPath()}
    ${renderContractCards()}
    ${renderWeeklyRift()}
    <details class="mode-hub"><summary>Savaş salonu ve antrenmanlar<small>Hikâyeden ayrı, isteğe bağlı düello, takım savaşı ve tatbikat modları</small></summary><div class="mode-hub-grid">
    <article class="arena-invitation quick-bot-invitation"><div><span class="eyebrow">TEK OYUNCU · HIZLI EĞİTİM</span><h3>Hemen savaş dene</h3><p>İlk kez giriyorsan otomatik bir deneme komutanı oluşturulur. Başka oyuncu gerekmiyor. Bot antrenmanında sınırlı yerel kaynak ödülü kazanılabilir; rekabetçi sıralama etkilenmez.</p></div><button class="primary" data-quick-bot="duel">⚔ Botla 1v1</button><button class="secondary" data-quick-bot="siege">🏰 Botlarla 5v5 Kuşatma</button></article>
    <article class="arena-invitation"><div><span class="eyebrow">${battlePolicy.liveMatchmaking?'CANLI 1v1':'BOT DÜELLOSU · CANLI PvP ÖZEL SUNUCUDA'}</span><h3>Yıldız Düellosu</h3><p>${battlePolicy.liveMatchmaking?'Gerçek rakibe meydan oku veya botla antrenman yap. Önce İttifak bölümünde hesap oluştur.':'Düello salonunda botla savaş. Gerçek oyuncu eşleşmesi bu GitHub Pages betasında henüz açık değil.'}</p></div><button class="primary" data-arena-open>Düello salonuna git</button></article>
    <article class="arena-invitation team-invitation"><div><span class="eyebrow">${battlePolicy.liveMatchmaking?'2v2 / 5v5 · KLAN TAKIMI':'2v2 / 5v5 BOT TATBİKATI'}</span><h3>İki Sancak Muharebesi</h3><p>${battlePolicy.liveMatchmaking?'Klan arkadaşlarınla savaş, askerlerine emir ver, sancakları ele geçir. Derecesiz test modu.':'Bot birliklere emir ver, sancakları ele geçir veya kale kuşat. Canlı eşleşme özel sunucuda kullanılabilir.'}</p></div><button class="primary" data-team-open>Sancak meydanına git</button></article>
    <article class="training-invitation"><div><span class="eyebrow">KOMUTAN AKADEMİSİ</span><h3>Kahramanı yönet, orduna emir ver</h3><p>WASD ile hareket et, üç birliğini seç, kale kapısını yıkıp hakimiyet kur. Eğitim ödül veya çevrim içi rekabet sunmaz.</p></div><button class="primary" data-training-open>Kuşatma tatbikatına gir →</button></article>
    </div></details>
`;
}

function renderJournal() {
  workspaceEl.innerHTML = `<header><div><span class="eyebrow">KÖY ARŞİVİ</span><h2>Kül Gecesi kronikleri</h2><p>Kazandığın her sefer, kaybolmuş dünyanın bir parçasını geri getirir.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
  <div class="journal-prologue"><span class="eyebrow">BAŞLANGIÇ</span><h3>Gökyüzü kırıldığında</h3><p>Yıldızlar düştüğünde krallar surlarını yükseltti. Sabah olmadı. Şimdi vadinin ortasında tek bir köy parlıyor. İçindeki çekirdek, karanlığı uzakta tutuyor; her gece biraz daha zorlanarak.</p><p>Senin yeminin, bu ışığın sönmesine izin vermemek.</p></div>
  <div class="journal-grid">${CHAPTERS.map((chapter,index) => `<article class="journal-card ${state.cleared.includes(index+1) ? 'done' : ''}"><span class="eyebrow">${String(index+1).padStart(2,'0')} · ${R.STAGES[index].name}</span><h3>${chapter.name}</h3><p>${state.cleared.includes(index+1) ? chapter.victory : 'Bu kayıt, bölge kurtarıldığında günlüğe eklenecek.'}</p><span class="level-badge">${state.cleared.includes(index+1) ? 'KAYDA GEÇTİ' : 'KEŞFEDİLMEDİ'}</span></article>`).join('')}</div>`;
}

function itemStats(item) {
  return Object.entries(item.stats).map(([key,value])=>({attack:`+${value} saldırı`,hp:`+${value} can`,armor:`%${value} hasar azaltma`,healing:`+${value} şifa`})[key]).join(' · ');
}
function itemArt(item) { return armoryArt(item); }
function renderArmory() {
  if(!state.heroes[selectedArmoryHero]) selectedArmoryHero=state.team[0];
  workspaceEl.innerHTML=armoryMarkup(state,selectedArmoryHero,selectedBagSlot,selectedBagItem);
}

function renderShop() {
  workspaceEl.innerHTML=`<header><div><span class="eyebrow">YILDIZ PAZARI</span><h2>Efsanevi yeminler</h2><p>Özel kahramanların yeteneklerini eğitim savaşında keşfet.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="shop-status"><strong>Mağaza önizlemesi · ödeme kapalı</strong><span>Gerçek para satışı henüz açık değil. Eğitim denemeleri ücretsizdir. Özel PvE ekipmanları ayrıca tasarlanıyor; PvP'de ücretli güç avantajı planlanmıyor.${state.battle?.status==='active'?' Önce devam eden seferini tamamla.':''}</span></div>
    ${premiumCatalogMarkup()}
    <section class="cosmetic-concepts"><div><span class="eyebrow">KOZMETİK TASARIM ANKETİ · GERÇEK SATIŞ YOK</span><h3>Hangi görünümleri oyunda istersin?</h3><p>Beğendiklerini işaretle. Bu seçim yalnızca cihazındaki kayıt dosyasında tutulur; ödeme, satın alma veya sunucuya veri gönderme değildir.</p></div><div class="concept-grid">${R.COSMETIC_CONCEPTS.map(c=>`<article class="concept-card"><span class="eyebrow">${c.category}</span><h4>${c.name}</h4><p>${c.detail}</p><button class="${state.cosmeticWishlist.includes(c.id)?'primary':'secondary'}" data-cosmetic-interest="${c.id}" aria-pressed="${state.cosmeticWishlist.includes(c.id)}">${state.cosmeticWishlist.includes(c.id)?'✓ İstek listemde':'İsterim'}</button></article>`).join('')}</div><small>Bir tasarımı beğenmek, ona para ödeyeceğin anlamına gelmez. Gerçek oyuncu anketi ve ödeme altyapısı ayrıca geliştirilecek.</small></section>
    <div class="premium-grid">${R.SPECIAL_HEROES.map(hero=>`<article class="premium-card"><div class="premium-portrait">${heroPortrait(hero)}<span class="premium-seal">EFSANEVİ</span><div class="portrait-title"><small>${hero.title}</small><h3>${hero.name}</h3></div></div><div class="premium-copy"><span class="eyebrow">${ROLES[hero.role]} · ÖZEL KAHRAMAN</span><h3>${hero.name}</h3><p>${hero.description}</p><p class="skill">${R.HERO_ABILITIES[hero.id].name}: ${R.HERO_ABILITIES[hero.id].description}</p><div class="hero-stats"><span>Seviye 1 · ⚔ ${hero.attack} saldırı</span><span>♡ ${hero.hp} can</span></div><p class="trial-note">Denemede takımının ortalama seviyesine uyarlanır.</p><button class="primary wide" data-trial="${hero.id}" ${state.battle?.status==='active'?'disabled':''}>Eğitim savaşında dene</button><button class="secondary wide" disabled>Satış henüz açık değil</button></div></article>`).join('')}</div>
    <div class="shop-armory"><div><span class="eyebrow">KÖY USTALARININ ESERLERİ</span><h3>Gücünü çantanda biriktir</h3><p>${R.ITEMS.length} silah, zırh ve tılsım (5 özel üç yıldız ganimeti). Seferlerden kazan veya oyun içi kaynaklarla üret.</p></div><button class="secondary" data-view="armory">Çantaya git →</button></div>`;
}

function renderGuild(){
  const needsAccount=!accountSession();
  const header=`<header><div><span class="eyebrow">YILDIZ İTTİFAKLARI · GELİŞTİRME SUNUCUSU</span><h2>Klan salonu</h2><p>Arkadaşlarınla ortak klan kur, davet koduyla katıl, sohbet et ve ortak baskın etkinliğine katıl.</p></div><button class="secondary" data-close-view>Köye dön</button></header>`;
  if(!needsAccount && guildAvailable===false){workspaceEl.innerHTML=header+`<article class="guild-empty"><h3>Çevrim içi sunucu kapalı</h3><p>Bu klan bölümü gerçek oyuncularla veri paylaşır, ancak Node geliştirme sunucusu açık olmalıdır. Proje klasöründe <code>node guild-server.mjs</code> çalıştır, sonra buradan yeniden bağlan.</p><button class="primary" data-guild-action="refresh">Yeniden bağlan</button><p class="guild-disclaimer">1v1 ve 5v5 PvP test modunda var; 20v20 henüz yok. Klan baskını ortak ilerleme prototipidir.</p></article>`;return;}
  if(guildBusy&&!guildSnapshot){workspaceEl.innerHTML=header+'<p class="guild-loading">Klan sunucusuna bağlanılıyor…</p>';return;}
  if(!accountSession()){workspaceEl.innerHTML=header+`<article class="guild-empty"><h3>Önce hesabına giriş yap</h3><p>Artık ayrı lonca anahtarı yok. Supabase e-posta hesabın hem oyuncu hem lonca kimliğin olacak.</p><button class="primary" data-view="settings">Hesaba giriş yap</button></article>`;return;}
  if(!guildSnapshot&&!guildBusy&&!guildError){workspaceEl.innerHTML=header+`<article class="guild-empty"><h3>Komutan kaydını oluştur</h3><p>Bu cihaz için takma adla test komutanı oluştur. Çevrim içi beta sunucusunda davet kodu istenebilir. Oyuncu oturum anahtarı bu tarayıcıda tutulur.</p><div class="guild-form"><input id="guild-name" maxlength="24" placeholder="Komutan adın (3–24 karakter)" aria-label="Komutan adı"><button class="primary" data-guild-action="register">Oluştur</button></div></article>`;return;}
  if(!guildSnapshot){workspaceEl.innerHTML=header+`<article class="guild-empty"><p>${esc(guildError||'Klan sunucusuna bağlanılıyor…')}</p><button class="primary" data-guild-action="refresh">Tekrar dene</button></article>`;return;}
  const g=guildSnapshot.guild;
  const overview=`<div class="guild-server-status"><span class="online-dot"></span>${esc(guildSnapshot.player.name)} · Test sunucusunda bağlı <button class="text-button" data-guild-action="refresh">Yenile ↻</button></div>`;
  if(!g){workspaceEl.innerHTML=header+overview+`<div class="guild-columns"><article class="guild-panel"><span class="eyebrow">BİRLİK OL</span><h3>Kendi klanını kur</h3><p>25 üyeye kadar komutanı aynı çatıda topla.</p><div class="guild-form"><input id="new-guild" maxlength="32" placeholder="Klan adı" aria-label="Yeni klan adı"><button class="primary" data-guild-action="create">Klan kur</button></div></article><article class="guild-panel"><span class="eyebrow">DAVET KODU</span><h3>Bir klana katıl</h3><p>Arkadaşının 6 karakterli davet kodunu yaz.</p><div class="guild-form"><input id="join-guild" maxlength="6" placeholder="DAVET KODU" aria-label="Klan davet kodu"><button class="primary" data-guild-action="join">Katıl</button></div></article></div>${guildError?`<p class="guild-error">${esc(guildError)}</p>`:''}`;return;}
  const raid=g.raid,percent=Math.round((raid.maxHealth-raid.health)/raid.maxHealth*100);
  const raidTitle=raid.bossName||'Gölge Muhafızı';
  const nextRaid=Number.isFinite(raid.nextResetAt)?new Date(raid.nextResetAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long'}):'haftalık yenilemede';
  const war=g.warPlan||{objective:'gate',brief:'Önce kapıyı aş, sonra merkezi koru.'};
  const roleLabels={frontline:'Öncü',ranged:'Okçu',support:'Destek',siege:'Kuşatma'};
  const objectiveLabels={gate:'Ana kapıyı kır',north:'Kuzey hattını tut',south:'Güney hattını tut',crystal:'Kristali koru'};
  const ownRoster=g.warRoster?.find(p=>p.userId===guildSnapshot.player.id)||{role:'frontline',ready:false};
  const readyCount=(g.warRoster||[]).filter(p=>p.ready).length;
  const warRoom=`<section class="guild-panel guild-war-room"><div class="guild-war-top"><div><span class="eyebrow">KLAN KOMUTA MERKEZİ · PLANLAMA</span><h3>Kuşatma savaş odası</h3><p>Klan liderinin hedefi ve savaşa hazır üyeler bütün oyuncularda senkronize edilir. 5v5 klan eşleşmesi test modunda mevcut; 20v20 henüz yok.</p></div><strong>${readyCount}/${g.members.length}<small>HAZIR</small></strong></div>
    <div class="war-objective"><b>${objectiveLabels[war.objective]||'Ana kapıyı kır'}</b><span>${esc(war.brief)}</span></div>
    ${g.ownerId===guildSnapshot.player.id?`<div class="guild-form war-plan-form"><select id="war-objective" aria-label="Klan savaş hedefi">${Object.entries(objectiveLabels).map(([key,label])=>`<option value="${key}" ${war.objective===key?'selected':''}>${label}</option>`).join('')}</select><input id="war-brief" maxlength="160" aria-label="Klan savaş emri" value="${esc(war.brief)}"><button class="primary" data-guild-action="warplan">Planı yayınla</button></div>`:''}
    <div class="guild-war-roster"><div><label for="war-role">Savaş rolün</label><select id="war-role">${Object.entries(roleLabels).map(([key,label])=>`<option value="${key}" ${ownRoster.role===key?'selected':''}>${label}</option>`).join('')}</select><button class="${ownRoster.ready?'secondary':'primary'}" data-guild-action="warprepare">${ownRoster.ready?'Hazırlığı geri çek':'Hazırım'}</button></div><ul>${g.members.map(member=>{const prep=g.warRoster?.find(p=>p.userId===member.id)||{role:'frontline',ready:false};return `<li>${esc(member.name)} <span>${roleLabels[prep.role]||'Öncü'}</span><b class="${prep.ready?'war-ready':''}">${prep.ready?'HAZIR':'BEKLİYOR'}</b></li>`;}).join('')}</ul></div></section>`;
  workspaceEl.innerHTML=header+overview+`<div class="guild-banner"><div><span class="eyebrow">İTTİFAK SANCAĞI</span><h3>${esc(g.name)}</h3><p>Davet kodu <button class="guild-copy" data-copy="${esc(g.code)}" title="Davet kodunu kopyala">${esc(g.code)} ⧉</button> · ${g.members.length}/25 üye</p></div><button class="secondary" data-guild-action="leave">Klandan ayrıl</button></div>
    ${warRoom}<div class="guild-columns"><article class="guild-panel"><span class="eyebrow">ORTAK GÖREV · PROTOTİP</span><h3>${esc(raidTitle)} · Haftalık Klan Baskını</h3><p>Her hafta yeni boss! Her üye 60 saniyede bir saldırabilir. ${raid.completed?'Bu haftaki boss yenildi.':'Klanınla bossu birlikte yen.'} Sonraki yenileme: ${esc(nextRaid)}. Toplam klan zaferi: ${Number(g.raidWins)||0}. Ödüller prototip aşamasında.</p><div class="raid-progress"><i style="width:${percent}%"></i></div><div class="raid-stats"><b>${percent}% tamamlandı</b><span>${raid.health} / ${raid.maxHealth} boss canı</span></div><button class="primary wide" data-guild-action="raid" ${raid.completed?'disabled':''}>${raid.completed?'Kuşatma tamamlandı':'Ortak saldırıya katıl'}</button><div class="guild-raid-log">${raid.attacks.slice(-4).reverse().map(a=>`<p>${esc(a.name)} · ${a.damage} hasar</p>`).join('')||'<p>Henüz saldırı yapılmadı.</p>'}</div></article>
    <article class="guild-panel"><span class="eyebrow">BİRLİKLER</span><h3>Klan üyeleri</h3><ul class="guild-members">${g.members.map(u=>`<li><span class="online-dot"></span>${esc(u.name)}${u.id===g.ownerId?' <small>Kurucu</small>':''}</li>`).join('')}</ul></article></div>
    <article class="guild-panel guild-chat"><span class="eyebrow">ORTAK MESAJ PANOSU</span><h3>Klan sohbeti</h3><div class="guild-messages">${g.messages.map(m=>`<p><b>${esc(m.name)}</b> <small>${new Date(m.at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</small><span>${esc(m.text)}</span></p>`).join('')||'<p>İlk mesajı gönder.</p>'}</div><div class="guild-form"><input id="guild-message" maxlength="250" placeholder="Klanına mesaj gönder" aria-label="Klan mesajı"><button class="primary" data-guild-action="message">Gönder</button></div></article>${guildError?`<p class="guild-error">${esc(guildError)}</p>`:''}<p class="guild-disclaimer">Bu bölüm klan paylaşımı ve ortak görev için gerçek sunucu kullanır; rekabetçi PvP ve canlı klan savaşı sonraki altyapı aşamasıdır.</p>`;
}
async function refreshGuild(){
  guildBusy=true;guildError='';
  if(activeView==='guild')renderGuild();
  try{if(!accountSession()){guildAvailable=true;guildSnapshot=null;return;}
     await guildOnline();guildAvailable=true;guildSnapshot=await guildRequest('me',null);guildError='';}
  catch(error){
    if(/komutan adı|Önce bu e-posta/i.test(error.message||'')){
      guildSnapshot=null;guildAvailable=true;guildError='';
    }else if(/oturum yok|yetkisiz|unauthorized|401/i.test(error.message||'')){
      localStorage.removeItem(GUILD_TOKEN_KEY);guildToken='';guildAvailable=true;
      guildSnapshot=null;guildError='Eski oturum bulunamadı. Yeni komutan oluşturabilirsin.';
    }else{guildAvailable=false;guildSnapshot=null;guildError=error.message;}
  }
  finally{guildBusy=false;if(activeView==='guild')renderGuild();}
}
async function guildAction(name){
  if(guildBusy)return;
  if(name==='refresh')return refreshGuild();
  const read=id=>$(id)?.value.trim()||'';
  if(name==='leave'&&!confirm('Klandan ayrılmak istediğine emin misin?'))return;
  let route,data;
  if(name==='register'){route='register';data={name:read('#guild-name')};}
  else if(name==='create'){route='guild/create';data={name:read('#new-guild')};}
  else if(name==='join'){route='guild/join';data={code:read('#join-guild')};}
  else if(name==='message'){route='guild/message';data={message:read('#guild-message')};}
  else if(name==='leave'){route='guild/leave';data={};}
  else if(name==='raid'){route='guild/raid';data={};}
  else if(name==='warplan'){route='guild/war/plan';data={objective:read('#war-objective'),brief:read('#war-brief')};}
  else if(name==='warprepare'){const my=guildSnapshot?.guild?.warRoster?.find(p=>p.userId===guildSnapshot.player.id);route='guild/war/prepare';data={role:read('#war-role'),ready:!my?.ready};}
  else return;
  guildBusy=true;guildError='';
  try{const result=await guildRequest(route,name==='register'?null:guildToken,data);
    // Auth-linked guild returns no legacy bearer credential.
    guildSnapshot=result;guildAvailable=true;notify('Klan işlemi başarılı.');}
  catch(error){guildError=error.message;notify(error.message);}
  finally{guildBusy=false;if(activeView==='guild')renderGuild();}
}
function renderAccountExtras(){
  const local=progressionSummary(state);
  let remote=null;
  try{if(syncConflictDetails?.remote)remote=progressionSummary(syncConflictDetails.remote);}catch{}
  const label=p=>p?`Kale ${p.keep}, ${p.chapters} bölüm, ${p.heroes} kahraman, ${number(p.gold)} altın`:'Bulut bilgisi henüz alınamadı';
  const points=recoveryPoints(localStorage);
  return `<section class="account-extra-grid">
    ${accountSyncInfo.status==='conflict'?`<article class="guild-panel account-conflict"><h3>İki farklı köy kaydı bulundu</h3><p>İkisini karşılaştır. Seçim yapmadan ilerleme silinmez.</p>
    <div class="account-compare"><div><small>BU CİHAZ</small><p>${esc(label(local))}</p></div><div><small>BULUT</small><p>${esc(label(remote))}</p></div></div>
    <p>Önce kayıt dosyanı indir. Ardından hangi köyle devam edeceğini seç.</p></article>`:''}
    ${signupPending&&!accountSession()?`<article class="guild-panel account-pending"><h3>E-posta onayı bekleniyor</h3><p>${esc(confirmationEmail)} adresine gönderilen bağlantıyı açıp oyuna dön.</p>
    <button class="secondary wide" data-account-action="resend-confirmation">Onay e-postasını tekrar gönder</button></article>`:''}
    <article class="guild-panel account-recovery"><h3>Önceki köy kurtarma noktaları</h3><p>Bir yedeği geri yüklemeden önce önceki kaydın son üç kopyası saklanır.</p>
    ${points.length?points.map((p,i)=>`<button class="secondary wide" data-recovery-key="${esc(p.key)}">${i+1}. Kurtarma kaydı · ${esc(label(progressionSummary(p.state)))}</button>`).join(''):'<small>Henüz kurtarma kopyası yok.</small>'}</article></section>`;
}
function renderSettings(){
  const hosted=location.hostname.endsWith('github.io')||new URLSearchParams(location.search).get('hosted')==='1';
  const cloudReady=hosted&&!!guildToken,cloudLabel=!hosted?'Bulut yedeği GitHub Pages çevrim içi beta hesabında kullanılabilir.':!cloudReady?'Önce İttifak bölümünden bu cihazda komutan hesabı oluştur.':cloudSaveInfo?.exists?`Bulut yedeği: ${new Date(cloudSaveInfo.savedAt).toLocaleString('tr-TR')} · Rev. ${cloudSaveInfo.revision}`:cloudSaveInfo?'Henüz bulut yedeği yok.':'Bulut durumu henüz sorgulanmadı.';
  workspaceEl.innerHTML=`<header><div><span class="eyebrow">KOMUTA MERKEZİ</span><h2>Ayarlar ve kayıt güvenliği</h2><p>Köyün yerel kayıtla korunur; e-posta hesabındaysan bulut eşitlemesi de çalışır.</p></div><button class="secondary" data-close-view>Köye dön</button></header>
    <div class="settings-grid"><article class="guild-panel"><span class="eyebrow">OYUN İLERLEMESİ</span><h3>Kayıt yedeği</h3><p>Binan, kaynakların, kahramanların, ekipmanların ve savaş kaydın JSON dosyası olarak saklanır.</p><button class="primary wide" data-export-save>Kayıt dosyasını indir</button><button class="secondary wide" data-import-save>Yedeği geri yükle</button><small>İçe aktarma mevcut ilerlemenin üzerine yazar. Önce bir yedek al.</small></article><article class="guild-panel"><span class="eyebrow">OYUN DENEYİMİ</span><h3>Kontroller</h3><p>Köyü sürükle; +/− ile yakınlaştır. Savaşta hedef seç, 1 / 2 / 3 ile kahraman yeteneklerini kullan, Space ile taktik mola ver.</p><button class="secondary wide" data-fullscreen>Tam ekranı değiştir</button><button class="secondary wide" data-audio-toggle>Ses ve özgün müzik: ${gameAudio.enabled?'Açık · Kapat':'Kapalı · Aç'}</button><small>Sesler yalnızca sen açtığında başlar; köy melodisi ve savaş efektleri orijinaldir.</small><p class="guild-disclaimer">Klan oturumu, ana oyun kaydından ayrı bir geliştirme sunucusuna bağlıdır.</p></article>
    <article class="guild-panel"><span class="eyebrow">GÜVENLİ HESAP · SUPABASE AUTH</span><h3>E-posta hesabı ve özel yedek</h3>
      <p>Tek e-posta hesabıyla farklı cihazlarda oynayabilirsin. Kayıtlar otomatik eşitlenir; çakışmada hiçbir kayıt sessizce silinmez. PvP ekonomisi ayrı sunucu doğrulaması gerektirir.</p>
      ${accountSession()?`<strong>${esc(accountSession().user.email||'Doğrulanmış hesap')}</strong>
      <small aria-live="polite">Eşitleme: ${esc(({synced:'Güncel',checking:'Kontrol ediliyor',uploading:'Yükleniyor',conflict:'Kayıt çatışması',offline:'Çevrimdışı',disconnected:'Kapalı',error:'Kayıt hatası'})[accountSyncInfo.status]||accountSyncInfo.status)} · Bulut sürümü ${accountSync.revision??'—'}</small>
      ${accountSyncInfo.status==='conflict'?'<p class="guild-error">Diğer cihazın kaydı farklı. Birini seçmeden üstüne yazmayacağım.</p><button class="primary wide" data-account-action="use-local">Bu cihazın kaydını kullan</button><button class="secondary wide" data-account-action="restore">Bulut kaydını kullan</button>':''}
      <button class="secondary wide" data-account-action="sync" ${accountBusy?'disabled':''}>Şimdi eşitle</button>
      <button class="secondary wide" data-account-action="status" ${accountBusy?'disabled':''}>Hesap yedeğini kontrol et</button>
      <button class="primary wide" data-account-action="save" ${accountBusy?'disabled':''}>Bu cihazı hesabıma yedekle</button>
      <button class="secondary wide" data-account-action="restore" ${accountBusy?'disabled':''}>Hesap yedeğini geri yükle</button>
      <button class="secondary wide" data-account-action="logout" ${accountBusy?'disabled':''}>E-posta hesabından çıkış</button>`:
      `<form id="starfort-account-form" autocomplete="on">
        <label>E-posta <input required name="email" type="email" maxlength="180" autocomplete="username" placeholder="eposta@ornek.com"></label>
        <label>Şifre <input required name="password" type="password" minlength="8" maxlength="100" autocomplete="current-password"></label>
        <div class="season-titles"><button type="submit" class="primary" name="account-mode" value="login">Giriş yap</button>
        <button type="submit" class="secondary" name="account-mode" value="signup">Hesap oluştur</button></div></form><button class="text-button" data-account-action="reset-request">Şifremi unuttum</button>`}
      ${accountRecovering?'<div class="guild-form"><input id="account-new-password" type="password" minlength="8" maxlength="100" autocomplete="new-password" placeholder="Yeni şifren"><button class="primary" data-account-action="password-update">Şifremi güncelle</button></div>':''}
      <small>Otomatik eşitleme yalnızca hesaba giriş yapıldığında çalışır. Bulut çatışmalarını oyuncu çözer.</small>
    </article></div>`;
  workspaceEl.insertAdjacentHTML('beforeend',renderAccountExtras());
}

async function accountAction(action){
 if(accountBusy)return;
 accountBusy=true;if(activeView==='settings')renderSettings();
 try{
   if(action==='reset-request'){
     const email=$('#starfort-account-form [name=email]')?.value.trim();
     if(!email)throw Error('Önce e-posta adresini yaz.');
     await accountRequestPasswordReset(email,location.origin+location.pathname);
     notify('Hesap varsa kurtarma e-postası gönderildi.');return;
   }
   if(action==='password-update'){
     await accountUpdatePassword($('#account-new-password')?.value);
     accountRecovering=false;notify('Şifre güncellendi.');await accountSync.start();return;
   }
   if(action==='resend-confirmation'){
     if(!confirmationEmail)throw Error('Önce e-posta adresinle hesap oluştur.');
     await accountResendConfirmation(confirmationEmail,authRedirect());
     notify('Onay e-postası yeniden istendi. Gelen kutunu kontrol et.');return;
   }
   if(action==='logout'){
     accountSync.stop();await accountSignOut();accountBackupInfo=null;guildSnapshot=null;
     notify('E-posta hesabından çıkış yapıldı. Yerel oyun korundu.');return;
   }
   if(action==='sync'){await accountSync.refresh();return;}
   if(action==='use-local'){
     if(!confirm('Bu cihazdaki ilerleme bulut kaydının üzerine yazılacak. Diğer cihazdaki ilerlemeyi kaybedebilirsin. Emin misin?'))return;
     makeRecoveryPoint(localStorage,state);
     await accountSync.useLocal();notify('Bu cihazın kaydı buluta yüklendi.');return;
   }
   const remote=await accountBackup('get');accountBackupInfo=remote;
   if(action==='status'){notify(remote?'Bulut yedeği bulundu.':'Bulut yedeği henüz yok.');return;}
   if(action==='save'){
     if(remote&&!confirm('Bulut yedeğinin üzerine yazılacak. Devam edilsin mi?'))return;
     makeRecoveryPoint(localStorage,state);
     await accountSync.useLocal();notify('Buluta yedeklendi.');
   }else if(action==='restore'){
     if(!remote)throw Error('Bulut yedeği bulunamadı.');
     const candidate=importSave(JSON.stringify({format:'starfort-save',key:R.STORAGE_KEY,state:remote.state}));
     if(!confirm('Bulut ilerlemesi bu cihazın kaydını değiştirecek. Önce JSON yedeğini indirdin mi?'))return;
     makeRecoveryPoint(localStorage,state);
     accountSync.stop();combatRunner.pause();trialState=null;const old=state;state=candidate;
     if(!persist()){state=old;throw Error('Tarayıcı kaydı değiştirilemedi.');}
     location.reload();
   }
 }catch(error){notify('Hesap: '+error.message);}
 finally{accountBusy=false;if(activeView==='settings')renderSettings();}
}

document.addEventListener('submit',async event=>{
 if(event.target?.id!=='starfort-account-form')return;
 event.preventDefault();
 if(accountBusy)return;
 const fd=new FormData(event.target),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
 const mode=event.submitter?.value==='signup'?'signup':'login';
 if(!email.includes('@')||password.length<8)return notify('E-posta ve en az 8 karakterli şifre yaz.');
 accountBusy=true;
 try{
   if(mode==='signup'){
     const info=await accountSignUp(email,password,undefined,authRedirect());
     signupPending=info.needsConfirmation;confirmationEmail=email;
      notify(info.needsConfirmation?'Onay bağlantısı e-postana gönderildi. Onayla ve oyuna dön.':'E-posta hesabı oluşturuldu.');
     if(accountSession())await accountSync.start();
   }else{
     await accountSignIn(email,password);
     signupPending=false;confirmationEmail='';
     notify('E-posta hesabına giriş yapıldı.');
     await accountSync.start();if(activeView==='guild')void refreshGuild();
   }
 }catch(error){notify('Hesap: '+error.message);}
 finally{accountBusy=false;if(activeView==='settings')renderSettings();}
});

async function transferAccount(action){
  if(action==='copy'){
    if(!guildToken)return notify('Önce komutan hesabı oluştur.');
    if(!confirm('Hesap aktarım anahtarı hesabına tam erişim verir. Sadece kendine ait cihazda kullanacak şekilde kopyalamak istiyor musun?'))return;
    try{
      await navigator.clipboard.writeText(guildToken);
      notify('Hesap anahtarı panoya kopyalandı. Başkalarıyla paylaşma.');
    }catch{
      prompt('Gizli aktarım anahtarın (yalnızca kendi cihazına aktar):',guildToken);
    }
    return;
  }
  if(action!=='import')return;
  const candidate=(prompt('Diğer cihazdaki 64 karakterli STARFORT hesap aktarım anahtarını yapıştır:')||'').trim();
  if(!candidate)return;
  if(!/^[a-f0-9]{64}$/.test(candidate))return notify('Hesap anahtarı 64 karakter olmalı.');
  if(guildToken && candidate!==guildToken && !confirm('Bu cihazın bağlı beta hesabı değiştirilecek. Yerel oyun ilerlemesi değişmez. Devam edilsin mi?'))return;
  try{
    const account=await guildRequest('me',candidate);
    localStorage.setItem(GUILD_TOKEN_KEY,candidate);
    guildToken=candidate;guildSnapshot=account;guildAvailable=true;cloudSaveInfo=null;
    notify('Hesabın bağlandı. Ayarlardan bulut yedeğini geri yükleyebilirsin.');
    if(activeView==='settings')renderSettings();
  }catch(error){notify('Hesap bağlanamadı: '+error.message);}
}
async function cloudSaveAction(action){
  if(cloudSaveBusy || !['status','upload','download','delete'].includes(action))return;
  const token=guildToken;
  if(!token){notify('Önce İttifak bölümünden komutan hesabı oluştur.');return;}
  cloudSaveBusy=true;if(activeView==='settings')renderSettings();
  try{
    const remote=await cloudSaveRequest('save/get',token);
    cloudSaveInfo=cloudBackupSummary(remote);
    if(action==='upload'){
      if(remote.exists && !confirm('Mevcut bulut yedeğinin üzerine bu cihazın kaydı yazılacak. Devam edilsin mi?'))return;
      const clean=importSave(exportSave(state));
      const result=await cloudSaveRequest('save/put',token,{state:clean,expectedRev:cloudSaveInfo.revision});
      cloudSaveInfo={exists:true,revision:result.revision,savedAt:new Date().toISOString()};
      notify('Oyun ilerlemenin bulut yedeği oluşturuldu.');
    } else if(action==='download'){
      if(!remote.exists)throw new Error('Bu hesapta henüz bulut yedeği yok.');
      const candidate=importSave(JSON.stringify({format:'starfort-save',key:R.STORAGE_KEY,state:remote.state}));
      if(!confirm('Bulut kaydı bu cihazdaki mevcut ilerlemenin yerine geçecek. Önce yerel kayıt dosyasını indirdin mi?'))return;
      makeRecoveryPoint(localStorage,state);
      combatRunner.pause();trialState=null;
      const previous=state;state=candidate;
      if(!persist()){state=previous;throw new Error('Tarayıcı kaydı değiştirilemedi.');}
      location.reload();return;
    } else if(action==='delete'){
      if(!remote.exists)throw new Error('Silinecek bulut yedeği bulunamadı.');
      if(!confirm('Bulut yedeğini kalıcı olarak silmek istediğine emin misin? Cihazındaki yerel kayıt silinmeyecek.'))return;
      await cloudSaveRequest('save/delete',token,{expectedRev:cloudSaveInfo.revision});
      cloudSaveInfo={exists:false,revision:0,savedAt:null};
      notify('Bulut yedeğin silindi. Yerel kaydın korunuyor.');
    } else notify(remote.exists?'Bulut yedeği bulundu.':'Bu hesapta henüz bulut yedeği yok.');
  }catch(error){notify('Bulut kaydı: '+error.message);}
  finally{cloudSaveBusy=false;if(activeView==='settings')renderSettings();}
}
function renderWorkspace() {
  if(trainingCleanup){trainingCleanup();trainingCleanup=null;}
  const open = activeView !== 'keep' && activeView !== 'expedition'; workspaceEl.hidden = !open; inspectorEl.hidden = open; document.querySelector('.app').classList.toggle('panel-open', open); workspaceEl.dataset.view = activeView;
  if (activeView === 'heroes') renderHeroes(); else if (activeView === 'campaign') renderExpedition(); else if (activeView === 'journal') renderJournal(); else if (activeView === 'labyrinth') workspaceEl.innerHTML=labyrinthMarkup(state); else if (activeView === 'armory') renderArmory(); else if (activeView === 'shop') renderShop(); else if (activeView === 'guild') renderGuild(); else if (activeView === 'settings') renderSettings(); else if (activeView === 'training') trainingCleanup=mountTraining(workspaceEl); else if(activeView==='arena')trainingCleanup=mountArena(workspaceEl); else if(activeView==='team')trainingCleanup=mountTeamArena(workspaceEl);
}
function renderBattle(fx=null) {
  const dialog=$('#battle-dialog'), battle=(trialState||state).battle;
  if(!battle) return;
  const wasOpen=dialog.open, focused=document.activeElement;
  const focusSelector=focused?.dataset.ability?`[data-ability="${focused.dataset.ability}"]`:focused?.dataset.target?`[data-target="${focused.dataset.target}"]`:focused?.hasAttribute('data-combat-toggle')?'[data-combat-toggle]':focused?.hasAttribute('data-battle-speed')?'[data-battle-speed]':null;
  const markup=battleMarkup({battle,trial:Boolean(trialState),fx,speed:battleSpeed,running:combatRunner.running});
  const previous=$('.combat-shell',dialog);
  if(wasOpen&&previous&&battle.status==='active'&&!$('.combat-outcome',previous)) {
    // Keep interactive targets and skill buttons alive while combat updates around them.
    const template=document.createElement('template');template.innerHTML=markup;
    const next=template.content.firstElementChild;
    previous.className=next.className;
    $('.combat-arena',previous).className=$('.combat-arena',next).className;
    $('.round-pill',previous).innerHTML=$('.round-pill',next).innerHTML;
    for(const fresh of next.querySelectorAll('[data-fighter]')) {
      const actor=$(`[data-fighter="${fresh.dataset.fighter}"]`,previous); if(!actor)continue;
      actor.className=fresh.className;
      if(fresh.tagName==='BUTTON') {
        actor.disabled=fresh.disabled;
        actor.setAttribute('aria-pressed',fresh.getAttribute('aria-pressed'));
        actor.setAttribute('aria-label',fresh.getAttribute('aria-label'));
      }
      for(const selector of ['.enemy-intent','.combat-number','.combat-mark','.interrupted','.fighter-label','.target-caption']) {
        const current=$(selector,actor), replacement=$(selector,fresh);
        if(current&&replacement)current.replaceWith(replacement);
        else if(current)current.remove();
        else if(replacement)actor.append(replacement);
      }
    }
    const callout=$('.action-callout',previous), nextCallout=$('.action-callout',next);
    if(callout)callout.remove();
    if(nextCallout)$('.combat-arena',previous).append(nextCallout);
    $('.tactical-line',previous).replaceWith($('.tactical-line',next));
    $('.battle-orders',previous)?.replaceWith($('.battle-orders',next));
    $('.live-help',previous).innerHTML=$('.live-help',next).innerHTML;
    $('.combat-history>div',previous).innerHTML=$('.combat-history>div',next).innerHTML;
    for(const selector of ['[data-combat-toggle]','[data-battle-speed]']) {
      const button=$(selector,previous), replacement=$(selector,next);
      button.textContent=replacement.textContent;button.setAttribute('aria-label',replacement.getAttribute('aria-label'));
      if(replacement.hasAttribute('title'))button.title=replacement.title;
    }
  } else $('#battle-content').innerHTML=markup;
  if(!wasOpen) dialog.showModal();
  if(focusSelector) $(focusSelector,dialog)?.focus({preventScroll:true});
  updateLiveHud();
}
function closeBattle() {
  combatRunner.pause();
  if(!trialState)persist();
  $('#battle-dialog').close();
}
function presentBattleEvents(events) {
  const changes=new Map();
  for(const event of events) for(const change of event.changes) {
    const previous=changes.get(change.id)||{id:change.id,delta:0,shieldDelta:0};
    previous.delta+=change.delta; previous.shieldDelta+=change.shieldDelta||0;
    changes.set(change.id,previous);
  }
  const last=events.at(-1);
  battleFxExpires=performance.now()+520/battleSpeed;
  renderBattle({...last,actorIds:events.map(event=>event.actorId),changes:[...changes.values()]});
  setTimeout(updateLiveHud,540/battleSpeed);
}
function updateLiveHud() {
  const battle=(trialState||state).battle;
  if(!battle?.live||!$('#battle-dialog').open)return;
  const seconds=Math.floor(battle.live.elapsedMs/1000), clock=$('.battle-clock');
  if(clock) clock.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  for(const enemy of battle.enemies) {
    const el=$(`[data-intent="${enemy.id}"]`); if(!el)continue;
    const intent=R.liveEnemyIntent(battle,enemy);
    const marked=$(`[data-fighter="${enemy.id}"] .combat-mark`);
    if(marked)marked.hidden=battle.live.enemies[enemy.id].markedUntil<=battle.live.elapsedMs;
    el.firstChild.nodeValue=intent.label+(intent.remaining?` · ${(intent.remaining/1000).toFixed(1)}s`:'');
    const bar=$('i',el); if(bar){bar.style.width=`${Math.max(0,intent.progress||0)*100}%`;bar.hidden=!intent.danger;}
  }
  for(const hero of battle.allies) {
    const actor=$(`[data-fighter="${hero.id}"]`), shield=battle.live.allies[hero.id].shield;
    actor?.classList.toggle('shielded',shield>0);
    const shieldLabel=actor&&$('.fighter-label em',actor);
    if(shieldLabel){shieldLabel.textContent=`⬡ ${shield}`;shieldLabel.hidden=shield<=0;}
    const button=$(`[data-ability="${hero.id}"]`); if(!button)continue;
    const skill=R.abilityState(battle,hero.id);
    button.disabled=!skill.ready; button.classList.toggle('skill-ready',skill.ready);
    button.classList.toggle('skill-fallen',hero.hp<=0);
    $('.ability-energy i',button).style.width=`${skill.energy}%`;
    $('.ability-status',button).textContent=hero.hp<=0?'Savaş dışı':skill.cooldown>0?`${Math.ceil(skill.cooldown/1000)} sn yenileniyor`:skill.ready?'HAZIR · KULLAN':`Enerji %${Math.floor(skill.energy)}`;
  }
  if(battleFxExpires&&performance.now()>=battleFxExpires) {
    $('#battle-content').querySelectorAll('.acting,.struck,.healed').forEach(el=>el.classList.remove('acting','struck','healed'));
    $('#battle-content').querySelectorAll('.combat-number,.action-callout').forEach(el=>el.remove());
    $('.combat-shell')?.classList.remove('star-burst','guard-burst'); battleFxExpires=0;
  }
}
function tickCombat(deltaMs) {
  const combatState=trialState||state, result=R.advanceCombat(combatState,deltaMs,Date.now());
  if(!result.ok){combatRunner.pause();return;}
  if(result.events.length) {
    if(!trialState)persist();
    if(combatState.battle.status!=='active')render();
    presentBattleEvents(result.events);
    if(combatState.battle.status==='won')gameAudio.cue('victory');
    else if(result.events.some(e=>['crush','nova','frost','drain','strike'].includes(e.kind)))gameAudio.cue('hit');
  }
  updateLiveHud();
}
function castHeroSkill(heroId) {
  const used=R.useHeroAbility(trialState||state,heroId,Date.now());
  if(!used.ok)return notify(used.error);
  if(!trialState)persist();
  if((trialState||state).battle.status!=='active'){combatRunner.pause();render();}
  presentBattleEvents(used.events);
}

function render() {
  gameAudio.setScene($('#battle-dialog').open?'combat':'village');
  renderResources(); renderNav(); renderPicker(); renderInspector(); renderQuest(); renderWorkspace();
  scene?.update(state);
  if ($('#building-dialog').open) renderBuildingDialog();
}
function openBattle(stageId) {
  if (stageId !== undefined) {
    const started = R.startLiveBattle(state, Number(stageId),{enforceGates:true});
    if (!started.ok) return notify(started.error);
  }
  if(state.battle?.status==='active')R.prepareLiveBattle(state);
  persist(); render(); renderBattle();
  combatRunner.resume(); renderBattle();
}
async function toggleFullscreen() {
  try {
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    else notify('Bu tarayıcı tam ekranı desteklemiyor; telefonu yatay çevirebilirsin.');
  } catch { notify('Tam ekran açılamadı. Yatay görünümde oynamaya devam edebilirsin.'); }
}
let quickBotBusy=false;
async function quickPlayBot(mode) {
  if(quickBotBusy||!['duel','siege'].includes(mode))return;
  quickBotBusy=true;
  try {
    const token=await ensureTestCommander({storage:localStorage,request:guildRequest});
    guildToken=token;
    activeView=mode==='duel'?'arena':'team';
    if(mode==='duel')sessionStorage.setItem('starfort:autostart-duel','1');
    render();
    const control=workspaceEl.querySelector(mode==='duel'?'[data-arena-bot]':'[data-team-bot][data-team-variant="siege"]');
    if(!control)throw new Error('Bot savaşını başlatma düğmesi bulunamadı.');
    control.click();
  }catch(error){notify('Savaş başlatılamadı: '+error.message);}
  finally{quickBotBusy=false;}
}
function dispatch(action) {
  const button = action.target.closest('button'); if (!button) return;
  if(saveGuard.conflicted && (button.dataset.stage||button.dataset.retryStage||button.dataset.upgradeBuilding||button.dataset.collectUpgrade||button.hasAttribute('data-finish-building')||button.dataset.upgradeHero||button.dataset.claimContract||button.dataset.seasonTitle||button.hasAttribute('data-collect')||button.hasAttribute('data-daily-reward')||button.dataset.equip||button.dataset.unequip||button.dataset.forgeItem)){notify('Başka sekmede yeni ilerleme var. Kaydı korumak için bu sekmeyi yenile.');return;}
  if(button.hasAttribute('data-audio-toggle')){const enabled=gameAudio.toggle();notify(enabled?'Ses ve müzik açıldı.':'Ses ve müzik kapatıldı.');if(activeView==='settings')renderSettings();return;}
  gameAudio.cue('click');
  if(button.dataset.welcome){
    $('#account-welcome').close();
    localStorage.setItem('starfort:welcome-seen','1');
    if(button.dataset.welcome==='account'){activeView='settings';render();}
    return;
  }
  if(button.dataset.accountAction){accountAction(button.dataset.accountAction);return;}
  if(button.dataset.recoveryKey){
    try{
      const recovered=loadRecoveryPoint(localStorage,button.dataset.recoveryKey);
      if(!confirm('Bu kurtarma noktası mevcut köyün üzerine yazılacak. Devam edilsin mi?'))return;
      makeRecoveryPoint(localStorage,state);
      accountSync.stop();combatRunner.pause();trialState=null;
      const old=state;state=recovered;
      if(!persist()){state=old;throw Error('Bu sekme başka bir kayıtla çakıştı. Sayfayı yenile.');}
      location.reload();
    }catch(error){notify('Kurtarma başarısız: '+error.message);}
    return;
  }
  if(button.hasAttribute('data-fullscreen')) { toggleFullscreen(); return; }
  if(button.dataset.quickBot){quickPlayBot(button.dataset.quickBot);return;}
  if(button.hasAttribute('data-labyrinth-open')){activeView='labyrinth';render();return;}
  if(button.dataset.labyrinthMove!==undefined){const step=R.moveLabyrinth(state,Number(button.dataset.labyrinthMove));result(step,step.event||'Yeni koridor keşfedildi.');return;}
  if(button.hasAttribute('data-labyrinth-fight')){const step=R.startLabyrinthBattle(state);if(!step.ok)return notify(step.error);openBattle();return;}
  if(button.hasAttribute('data-labyrinth-complete')){const step=R.completeLabyrinthFloor(state);result(step,step.ok?`Kat ${step.floor} tamamlandı! +${step.reward.gold} altın, +${step.reward.aether} yıldız özü.`:null);return;}
  if(button.hasAttribute('data-training-open')){activeView='training';render();return;}
  if(button.hasAttribute('data-arena-open')){activeView='arena';render();return;}
  if(button.hasAttribute('data-team-open')){activeView='team';render();return;}
  if(button.hasAttribute('data-daily-reward')){result(R.claimDailyReward(state),'Günlük kaynak sandığın açıldı!');return;}
  if(button.dataset.cosmeticInterest){const vote=R.toggleWishlist(state,button.dataset.cosmeticInterest);result(vote,vote.selected?'Tasarım istek listene eklendi.':'Tasarım istek listenden çıkarıldı.');return;}
  if(button.dataset.seasonTitle){result(R.claimSeasonTitle(state,button.dataset.seasonTitle),'Yeni sezon unvanı koleksiyonuna eklendi.');return;}
  if(button.dataset.claimContract){result(R.claimCampaignContract(state,button.dataset.claimContract),'Görev ödülü alındı; kozmetik unvan ilerlemen güncellendi.');return;}
  if(button.hasAttribute('data-start-rift')){const outcome=R.startWeeklyRift(state);if(!outcome.ok)return notify(outcome.error);openBattle();return;}
  if(button.dataset.veteranStage){const outcome=R.startVeteranBattle(state,Number(button.dataset.veteranStage),Number(button.dataset.veteranTier));if(!outcome.ok)return notify(outcome.error);openBattle();return;}
  if(button.dataset.guildAction){guildAction(button.dataset.guildAction);return;}
  if(button.dataset.copy){navigator.clipboard?.writeText(button.dataset.copy).then(()=>notify('Davet kodu kopyalandı.')).catch(()=>notify('Kodu seçerek kopyalayabilirsin.'));return;}
  if(button.hasAttribute('data-export-save')){const file=new Blob([exportSave(state)],{type:'application/json'});const url=URL.createObjectURL(file);const link=document.createElement('a');link.href=url;link.download='starfort-kayit-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Kayıt yedeği hazırlandı.');return;}
  if(button.hasAttribute('data-import-save')){$('#import-save').click();return;}
  if(button.dataset.cloudAction){cloudSaveAction(button.dataset.cloudAction);return;}
  if(button.dataset.accountTransfer){transferAccount(button.dataset.accountTransfer);return;}
  if(button.dataset.battleStance){const changed=R.setBattleStance(trialState||state,button.dataset.battleStance);if(!changed.ok)return notify(changed.error);if(!trialState)persist();renderBattle();return;}
  if(button.hasAttribute('data-city-buildings')) { const open=$('#building-picker').hidden; $('#building-picker').hidden=!open; button.setAttribute('aria-expanded',String(open)); return; }
  if(button.dataset.cityZoom) { scene?.zoomBy(Number(button.dataset.cityZoom)); return; }
  if(button.hasAttribute('data-city-labels')) { const visible=button.getAttribute('aria-pressed')!=='true'; button.setAttribute('aria-pressed',String(visible)); $('#city-labels').classList.toggle('names-hidden',!visible); return; }
  if(button.hasAttribute('data-battle-speed')) { battleSpeed=battleSpeed===1?2:1; combatRunner.setSpeed(battleSpeed); renderBattle(); return; }
  if(button.hasAttribute('data-combat-toggle')) { if(combatRunner.running)combatRunner.pause();else combatRunner.resume(); renderBattle();return; }
  if(button.dataset.ability) { castHeroSkill(button.dataset.ability);return; }
  if(button.dataset.target) { const selected=R.selectTarget(trialState||state,button.dataset.target); if(selected.ok) { if(!trialState)persist(); renderBattle(); } return; }
  if(button.dataset.bagSlot){selectedBagSlot=button.dataset.bagSlot;renderArmory();return;}
  if(button.dataset.bagItem){selectedBagItem=button.dataset.bagItem;renderArmory();return;}
  if(button.dataset.armoryHero) { selectedArmoryHero=button.dataset.armoryHero; activeView='armory'; render(); return; }
  if(button.dataset.autoEquip) { const choice=R.autoEquipHero(state,button.dataset.autoEquip); result(choice,choice.changed?'Rolüne uygun en güçlü boşta ekipmanlar kuşanıldı.':'Kahramanın mevcut donanımı zaten uygun.'); return; }
  if(button.dataset.forge) { result(R.forgeItem(state,button.dataset.forge),'Ekipman üretildi; bir kahramana kuşandırabilirsin.'); return; }
  if(button.dataset.equip) { result(R.equipItem(state,selectedArmoryHero,button.dataset.equip),'Ekipman kuşanıldı. Savaş gücü güncellendi.'); return; }
  if(button.dataset.unequip) { result(R.unequipItem(state,selectedArmoryHero,button.dataset.unequip),'Ekipman çantaya alındı.'); return; }
  if(button.dataset.trial) { if(state.battle?.status==='active') return notify('Önce devam eden savaşı tamamla.'); trialState=R.createHeroTrial(state,button.dataset.trial); renderBattle(); combatRunner.resume(); renderBattle(); return; }
  if(button.hasAttribute('data-quest-toggle')) { activeView='expedition'; questPanelExpanded=true; render(); return; }
  if(button.hasAttribute('data-quest-close')) { questPanelExpanded=false; render(); return; }
  if (button.dataset.view) {
    questPanelExpanded=button.dataset.view==='expedition';
    activeView = button.dataset.view; render(); if(activeView==='guild')refreshGuild(); return;
  }
  if (button.dataset.building) { openBuilding(button.dataset.building); return; }
  if(button.hasAttribute('data-workshop-expedition')){
    $('#building-dialog').close();
    activeView='campaign';questPanelExpanded=true;render();
    return;
  }
  if(button.dataset.planBuilding||button.hasAttribute('data-workshop-keep')){
    const id=button.hasAttribute('data-workshop-keep')?'keep':button.dataset.planBuilding;
    if(R.BUILDINGS.some(b=>b.id===id)){
      selectedBuilding=id;renderPicker();renderBuildingDialog();scene?.focus(id);
    }
    return;
  }
  if (button.hasAttribute('data-close-building')) { $('#building-dialog').close(); return; }
  if (button.dataset.upgradeBuilding) {
    selectedBuilding = button.dataset.upgradeBuilding;
    const upgraded = R.upgradeBuilding(state, selectedBuilding, Date.now());
    // Keep the command center open so the next upgrade is visible immediately.
    const building = R.BUILDINGS.find(item => item.id === selectedBuilding);
    const message=upgraded.started?`${building.name} inşaatı başladı. Oyun kapalıyken de süre ilerliyor.`:
      `${building.name} · Seviye ${state.buildings[selectedBuilding]} tamamlandı.`;
    result(upgraded,message);
    return;
  }
  if(button.dataset.collectUpgrade){
    selectedBuilding=button.dataset.collectUpgrade;
    const upgraded=R.upgradeBuildingFromProduction(state,selectedBuilding,Date.now());
    const building=R.BUILDINGS.find(item=>item.id===selectedBuilding);
    result(upgraded,upgraded.started?building.name+' · Kaynaklar toplandı, inşaat başladı.':building.name+' · Üretim toplandı, seviye '+state.buildings[selectedBuilding]+' tamamlandı.');
    return;
  }
  if(button.hasAttribute('data-finish-building')){
    const outcome=R.completeConstruction(state,Date.now());
    result(outcome,outcome.ok?'İnşaat tamamlandı! '+R.BUILDINGS.find(b=>b.id===outcome.id).name+' seviye '+outcome.level+' oldu.':null);
    return;
  }
  if (button.dataset.upgradeHero) { result(R.upgradeHero(state, button.dataset.upgradeHero), 'Kahraman güçlendi.'); return; }
  if (button.dataset.selectSlot !== undefined) { selectedSlot = Number(button.dataset.selectSlot); renderHeroes(); return; }
  if (button.dataset.team) {
    const id = button.dataset.team, team = [...state.team], previousIndex = team.indexOf(id);
    if (previousIndex >= 0) [team[selectedSlot], team[previousIndex]] = [team[previousIndex], team[selectedSlot]];
    else team[selectedSlot] = id;
    result(R.setTeam(state, team), 'Savaş dizilimi güncellendi.'); return;
  }
  if (button.hasAttribute('data-collect')) { const collected = R.collect(state); result(collected, `Üretim toplandı: ${Object.entries(collected.gain).filter(([, n]) => n).map(([id, n]) => `+${number(n)} ${resourceName[id]}`).join(' · ') || 'Henüz biriken kaynak yok.'}`); return; }
  if (button.dataset.action === 'open-expedition') { activeView = 'campaign'; render(); return; }
  if (button.dataset.action === 'resume-battle') { openBattle(); return; }
  if (button.dataset.stage) { openBattle(button.dataset.stage); return; }
  if (button.dataset.closeView !== undefined) { activeView = 'keep'; render(); return; }
  if (button.dataset.closeBattle !== undefined) { closeBattle(); render(); return; }
  if (button.dataset.retryStage) {
    const stage=Number(button.dataset.retryStage),mode=button.dataset.retryMode;
    if(mode==='veteran'||mode==='rift'){
      const started=mode==='rift'?R.startWeeklyRift(state):R.startVeteranBattle(state,stage,Number(button.dataset.retryTier));
      if(!started.ok)return notify(started.error);
      openBattle();return;
    }
    openBattle(stage);return;
  }
}

document.addEventListener('click', dispatch);
$('#import-save').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  try{if(file.size>2_000_000)throw new Error('Kayıt dosyası 2 MB sınırını aşıyor.');
    const candidate=importSave(await file.text());
    if(!confirm('Mevcut köy ilerlemesi yedekteki kayıtla değiştirilecek. Devam edilsin mi?'))return;
    makeRecoveryPoint(localStorage,state);
    combatRunner.pause();trialState=null;const previous=state;state=candidate;
    if(!persist()){state=previous;throw new Error('Tarayıcı kayda izin vermiyor. Mevcut köy değişmedi.');}
    location.reload();
  }catch(error){notify('Kayıt alınamadı: '+error.message)}
});
document.addEventListener('keydown',event=>{
  const tag=document.activeElement?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag)||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
  if(!$('#battle-dialog').open||(trialState||state).battle?.status!=='active')return;
  if(event.code==='Space'){event.preventDefault();if(combatRunner.running)combatRunner.pause();else combatRunner.resume();renderBattle();}
  if(['Digit1','Digit2','Digit3'].includes(event.code)){const hero=(trialState||state).battle.allies[Number(event.code.slice(-1))-1];if(hero)castHeroSkill(hero.id);}
});
$('#recenter').innerHTML = svg('keepMenu');
let buildingBackdropDown = false;
// Update long-term construction countdowns and claim availability while the panel is open.
setInterval(()=>{if($('#building-dialog').open&&state.construction)renderBuildingDialog()},30000);
$('#building-dialog').addEventListener('pointerdown', event => { buildingBackdropDown = event.target === $('#building-dialog'); });
$('#building-dialog').addEventListener('click', event => { if (buildingBackdropDown && event.target === $('#building-dialog')) $('#building-dialog').close(); buildingBackdropDown = false; });
$('#battle-dialog').addEventListener('click', event => { if (event.target === $('#battle-dialog')) closeBattle(); });
$('#battle-dialog').addEventListener('cancel', () => { combatRunner.pause(); if(!trialState)persist(); });
$('#battle-dialog').addEventListener('close', () => { combatRunner.pause(); if(trialState) { trialState=null; activeView='shop'; render(); } else persist(); });
function cityFallback(error) {
  console.warn('Starfort city scene unavailable:', error);
  $('#world-fallback').hidden=false; $('#building-picker').hidden=false;
  $('[data-city-buildings]').setAttribute('aria-expanded','true');
}
try {
  scene = createScene($('#world-canvas'), { onSelect: openBuilding, onLoadError:cityFallback, onProject: (points,width,height) => {
    const origin=$('.city-viewport').getBoundingClientRect();
    const obstacles=['.topbar','.rail','#recenter','.city-collect','.next-quest','#daily-reward','.city-controls','.world-heading>div'].map(selector=>{
      const rect=$(selector).getBoundingClientRect();return {x:rect.x-origin.x+rect.width/2,y:rect.y-origin.y,width:rect.width,height:rect.height};
    });
    const placements=placeCityLabels(points.map(p=>({...p,width:cityLabelNodes.get(p.id)?.offsetWidth||120,height:cityLabelNodes.get(p.id)?.offsetHeight||28})),width,height,obstacles,questEl.hidden?Infinity:54);
    const visible=new Set(placements.map(p=>p.id));
    for(const [id,label] of cityLabelNodes)label.hidden=!visible.has(id);
    for(const p of placements) {
      const label=cityLabelNodes.get(p.id); if(!label)continue;
      const transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,0)`;
      if(label.style.transform!==transform)label.style.transform=transform;
      label.style.setProperty('--label-lift',`${Math.max(0,p.shift)}px`);
    }
  } });
} catch (error) {
  cityFallback(error);
}
$('#recenter').addEventListener('click', () => { activeView = 'keep'; questPanelExpanded=false; scene?.overview(); render(); });
if (state.battle?.status === 'active') { R.prepareLiveBattle(state); persist(); renderBattle(); }
render();
(async()=>{
 try{
   const callback=await accountAcceptAuthHash(location.hash,()=>history.replaceState(null,'',location.pathname+location.search));
     if(callback){
       accountRecovering=callback.type==='recovery';signupPending=false;confirmationEmail='';
       activeView='settings';render();
       if(accountRecovering){notify('Kurtarma bağlantısı onaylandı. Şimdi yeni şifreni yaz.');return;}
       notify('E-posta hesabın doğrulandı. Bulut ilerlemen kontrol ediliyor.');
     }
     if(accountSession())await accountSync.start();
     if(!accountSession()&&!localStorage.getItem('starfort:welcome-seen')&&!location.hash)$('#account-welcome')?.showModal();
 }catch(error){notify('Kurtarma: '+error.message);}
})();
setInterval(()=>{if(accountSession()&&!document.hidden)void accountSync.refresh();},45000);
setInterval(() => { const pending = $('#production-gain'); if (pending) pending.innerHTML = costHtml(R.production(state), true); renderCityProduction(); }, 3000);
setInterval(()=>{if(activeView==='guild'&&!guildBusy&&!document.hidden&&guildToken&&document.activeElement?.tagName!=='INPUT')refreshGuild();},7000);
document.addEventListener('visibilitychange', () => {
 if(document.hidden){gameAudio.suspend();combatRunner.pause();persist();void accountSync.flush();}
 else{gameAudio.resume();if(accountSession())void accountSync.refresh();}
});
window.addEventListener('pagehide', () => {combatRunner.pause();persist();});

document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement; $('[data-fullscreen]').setAttribute('aria-label',active?'Tam ekrandan çık':'Tam ekranı aç'); scene?.resize();});

