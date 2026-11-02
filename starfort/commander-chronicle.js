/** Komutan Kroniği — 30 long-horizon milestones based solely on trusted server victories.
 * The RPC verifies each reward; this view only describes remaining progress. */
const sigils=['Kor','Cam','Göktaşı','Diken','Kül','Gece','Fırtına','Şafak','Yıldız','Ebedî'];
const ranks=['Nöbetçisi','Muhafızı','Mareşali'];
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
 return `<section class="commander-chronicle" aria-label="Komutan Kroniği, kalıcı zafer rütbeleri">
  <header><div><span class="eyebrow">UZUN VADELİ HESAP GELİŞİMİ · SUNUCU DOĞRULAMALI</span><h3>✦ Komutan Kroniği</h3>
  <p>30 kalıcı rütbe, giderek büyüyen zafer hedefleri. Her rütbenin sandığı yalnızca bir kez açılır; bütün kaynaklar sunucu kasasına işlenir.</p></div>
  <strong class="chronicle-current-rank">${status.claimed}<small>/ 30 RÜTBE</small></strong></header>
  <div class="chronicle-journey"><span>Doğrulanmış zafer: <b>${status.wins.toLocaleString('tr-TR')}</b></span>
  <span>${next?'Sıradaki rütbe: '+esc(next.name):'Bütün rütbeler tamamlandı'}</span></div>
  <div class="chronicle-track" role="progressbar" aria-valuemin="0" aria-valuemax="${next?.wins||status.wins}" aria-valuenow="${Math.min(status.wins,next?.wins||status.wins)}" aria-label="Sonraki rütbeye zafer ilerlemesi"><i style="width:${pct}%"></i></div>
  <div class="chronicle-cards">${upcoming.map(m=>`<article class="chronicle-rank ${status.wins>=m.wins?'ready':''}">
   <span class="eyebrow">RÜTBE ${String(m.rank).padStart(2,'0')}</span><strong>${esc(m.name)}</strong>
   <small>${status.wins>=m.wins?'✓ Hedef tamamlandı':status.wins.toLocaleString('tr-TR')+' / '+m.wins.toLocaleString('tr-TR')+' zafer'}</small>
   <p>Sandık · ${m.gold.toLocaleString('tr-TR')} altın + ${m.aether} yıldız özü</p>
   <button class="${m.rank===status.claimed+1?'primary':'secondary'}" data-account-chronicle="${m.rank}"
   ${m.rank!==status.claimed+1||status.wins<m.wins?'disabled':''}>${m.rank===status.claimed+1&&status.wins>=m.wins?'Rütbe sandığını aç':'Henüz kilitli'}</button></article>`).join('')||
  '<p class="chronicle-complete">✦ Ebedî Mareşal rütbesine ulaştın. Tüm 30 unvan ve sandık açıldı.</p>'}</div>
 </section>`;
}
