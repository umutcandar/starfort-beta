import {textKey as tx,longText as lt} from './locale-sections-v247.js';
import {formatNumber,getLocale} from './locale-v243.js';
import {CHRONICLE_TRANSLATIONS} from './locale-chronicle-v247.js';
const chronicleText=key=>CHRONICLE_TRANSLATIONS[getLocale()]?.ui[key]??CHRONICLE_TRANSLATIONS.en.ui[key];
const rankLabel=()=>tx('chronicleRank').toLocaleUpperCase(getLocale());
/** Komutan Kroniği — 30 long-horizon milestones based solely on trusted server victories.
 * The RPC verifies each reward; this view only describes remaining progress. */
const sigils=['Kor','Cam','Göktaşı','Diken','Kül','Gece','Fırtına','Şafak','Yıldız','Ebedî'];
const ranks=['Nöbetçisi','Muhafızı','Mareşali'];
const sigilsEn=['Ember','Glass','Meteor','Thorn','Ash','Night','Storm','Dawn','Star','Eternal'];
const ranksEn=['Watcher','Warden','Marshal'];
export function displayChronicleRank(m){
 if(!m)return '';
 const i=m.rank-1;
 if(getLocale()==='tr')return m.name;
 const copy=CHRONICLE_TRANSLATIONS[getLocale()]??CHRONICLE_TRANSLATIONS.en;
 return copy.sigils[i%10]+' '+copy.ranks[Math.floor(i/10)];
}
export const CHRONICLE_MILESTONES=Object.freeze(Array.from({length:30},(_,i)=>{
 const rank=i+1;
 return Object.freeze({rank,wins:rank*rank*2,name:sigils[i%10]+' '+ranks[Math.floor(i/10)],
  gold:100+rank*60,aether:5+rank*3});
}));
export function chronicleState(account){
 const wins=Number(account?.counters?.win||0);
 const raw=account?.contractClaims||{};
 const cleanClaims=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const claimed=CHRONICLE_MILESTONES.filter(m=>Object.hasOwn(cleanClaims,'chronicle:'+m.rank)).length;
 const next=CHRONICLE_MILESTONES[claimed]||null;
 return Object.freeze({wins,claimed,total:30,next,eligible:!!next&&wins>=next.wins,
  remaining:next?Math.max(0,next.wins-wins):0});
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function chronicleMarkup(account){
 if(!account)return '';
 const status=chronicleState(account),next=status.next;
 const upcoming=CHRONICLE_MILESTONES.slice(status.claimed,Math.min(status.claimed+3,30));
 const pct=next?Math.min(100,Math.floor(status.wins/next.wins*100)):100;
 return `<section class="commander-chronicle" aria-label="${chronicleText('aria')}">
  <header><div><span class="eyebrow">${chronicleText('eyebrow')}</span><h3>✦ ${tx('chronicleTitle')}</h3>
  <p>${chronicleText('intro')}</p></div>
  <strong class="chronicle-current-rank">${status.claimed}<small>/ 30 ${rankLabel()}</small></strong></header>
  <div class="chronicle-journey"><span>${chronicleText('verified')}: <b>${formatNumber(status.wins)}</b></span>
  <span>${next?tx('chronicleNext')+': '+esc(displayChronicleRank(next)):chronicleText('allComplete')}</span></div>
  <div class="chronicle-track" role="progressbar" aria-valuemin="0" aria-valuemax="${next?.wins||status.wins}" aria-valuenow="${Math.min(status.wins,next?.wins||status.wins)}" aria-label="${chronicleText('nextProgress')}"><i style="width:${pct}%"></i></div>
  <div class="chronicle-cards">${upcoming.map(m=>`<article class="chronicle-rank ${status.wins>=m.wins?'ready':''}">
   <span class="eyebrow">${rankLabel()} ${String(m.rank).padStart(2,'0')}</span><strong>${esc(displayChronicleRank(m))}</strong>
   <small>${status.wins>=m.wins?'✓ '+tx('complete'):formatNumber(status.wins)+' / '+formatNumber(m.wins)+' '+chronicleText('wins')}</small>
   <p>${tx('warChest')} · ${formatNumber(m.gold)} ${chronicleText('gold')} + ${m.aether} ${chronicleText('aether')}</p>
   <button class="${m.rank===status.claimed+1?'primary':'secondary'}" data-account-chronicle="${m.rank}"
   ${m.rank!==status.claimed+1||status.wins<m.wins?'disabled':''}>${m.rank===status.claimed+1&&status.wins>=m.wins?chronicleText('claim'):tx('locked')}</button></article>`).join('')||
  `<p class="chronicle-complete">✦ ${chronicleText('finished')}</p>`}</div>
 </section>`;
}
