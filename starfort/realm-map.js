import {STAGES} from './rules.js';
import {local,displayRealm,displayStage} from './locale-game-content-v245.js';
export const REALMS=Object.freeze([
 {chapter:1,zone:'Kül Sınırı',biome:'ashen',x:9,y:76,icon:'⚔',lore:'Kül akıncılarının geçitleri'},
 {chapter:2,zone:'Kırık İnanç',biome:'ruins',x:26,y:59,icon:'✟',lore:'Unutulmuş şapel harabeleri'},
 {chapter:3,zone:'Karaorman',biome:'forest',x:42,y:72,icon:'♠',lore:'Gölgenin sakladığı yollar'},
 {chapter:4,zone:'Demir Hudut',biome:'iron',x:58,y:48,icon:'⚒',lore:'Kapanmış kuzey kapıları'},
 {chapter:5,zone:'Mahzenler',biome:'crypt',x:43,y:24,icon:'◇',lore:'Kayıp ruhların uykusu'},
 {chapter:6,zone:'Ayaz Surları',biome:'frost',x:66,y:16,icon:'❄',lore:'Kuzeyin ebedî kışı'},
 {chapter:7,zone:'Tutulma',biome:'eclipse',x:81,y:38,icon:'☾',lore:'Parçalanmış yıldız kulesi'},
 {chapter:8,zone:'Yıldızsız Taht',biome:'void',x:92,y:12,icon:'✦',lore:'Son yemin, son savaş'},
].map(x=>Object.freeze(x)));
export function realmMapModel(account){
 const cleared=new Set(account?.cleared||[]);
 const current=Math.min(8,cleared.size+1);
 return REALMS.map(r=>{
  const stage=STAGES[r.chapter-1],stars=account?.campaignStars?.[r.chapter]||0;
  return {...r,name:stage.name,unlocked:r.chapter<=current,cleared:cleared.has(r.chapter),stars,
   medal:account?.veteranMedals?.[r.chapter]||0,masteryRemaining:3-stars};
 });
}
export function routeToNextRealm(account){
 const nodes=realmMapModel(account);
 return nodes.find(n=>n.unlocked&&!n.cleared)||nodes.at(-1);
}
export function realmMapMarkup(account,options={}){
 const nodes=realmMapModel(account);
 const active=account?.mission||null;
 const selected=Number.isInteger(options.selected)?options.selected:routeToNextRealm(account).chapter;
 const focus=nodes.find(n=>n.chapter===selected)||nodes[0];
 const escaped=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const edges=nodes.slice(1).map((n,i)=>{const a=nodes[i];return `<line x1="${a.x}" y1="${a.y}" x2="${n.x}" y2="${n.y}" class="${a.cleared?'completed':''}" />`}).join('');
 return `<div class="official-realm-map" aria-label="${local('Sekiz bölgeli Yıldız Yolu dünya haritası','Eight-region Star Road world map')}">
   <div class="realm-map-heading"><span class="eyebrow">${local('8 BÖLGE · 24 SEFER YILDIZI · 24 USTA KADEMESİ','8 REGIONS · 24 STARS · 24 VETERAN TIERS')}</span><h3>${local('Yıldız Yolu · Kuzey Kıtası','Star Road · Northern Continent')}</h3><p>${local('Her kalenin kapısı bir önceki bölgenin zaferiyle açılır. Ustalık dereceleri aynı haritada kalıcıdır.','Each new region unlocks after victory in the previous one. Veteran seals stay visible on this map.')}</p></div>
   <div class="realm-map-canvas"><div class="realm-ridge" aria-hidden="true"></div><svg class="realm-map-trails" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
    ${nodes.map(n=>`<button class="realm-map-pin ${n.cleared?'cleared':''} ${n.unlocked?'available':'locked'} ${n.chapter===focus.chapter?'active':''} realm-${n.biome}" style="--px:${n.x}%;--py:${n.y}%" data-realm-select="${n.chapter}" aria-label="${escaped(displayStage(STAGES[n.chapter-1]).name)}; ${n.unlocked?local('açık','available'):local('kilitli','locked')}, ${n.stars} ${local('yıldız','stars')}" aria-pressed="${n.chapter===focus.chapter}"><span class="realm-pin-icon">${n.icon}</span><span class="realm-pin-number">${String(n.chapter).padStart(2,'0')}</span>${n.cleared?'<span class="realm-check">✓</span>':''}</button>`).join('')}
   </div>
   <div class="realm-map-details"><div><span class="eyebrow">${local('BÖLGE','REGION')} ${String(focus.chapter).padStart(2,'0')} · ${escaped(displayRealm(focus).zone)}</span><strong>${escaped(displayStage(STAGES[focus.chapter-1]).name)}</strong><small>${escaped(displayRealm(focus).lore)}</small></div>
   <div class="realm-map-rating"><span class="server-star-row">${'★'.repeat(focus.stars)}${'☆'.repeat(3-focus.stars)}</span><small>${local('Usta mührü','Veteran seals')}: ${focus.medal}/3</small></div>
   <div class="realm-map-actions"><button class="primary" data-realm-mission="${focus.chapter}" ${!focus.unlocked||active?'disabled':''}>${focus.cleared?local('Yeniden savaş','Battle again'):local('Bölgeye saldır','Attack region')}</button>${focus.cleared?`<button class="secondary" data-account-veteran="${focus.chapter}:${Math.min(3,focus.medal+1)}" ${active?'disabled':''}>${local('Usta','Veteran')} ${Math.min(3,focus.medal+1)} ${local('savaşı','battle')}</button>`:''}</div>
   </div>
  </div>`;
}
