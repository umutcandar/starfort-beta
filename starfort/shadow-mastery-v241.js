/** STARFORT v2.41 — 12-rank seasonal independent, replay-safe Shadow Mastery.
 * UI previews are constant; award/XP/account ownership always come from Supabase.
 */
export const SHADOW_MASTERY_THRESHOLDS=Object.freeze([12,30,55,90,140,210,300,410,550,710,900,1120]);
export const SHADOW_MASTERY_TITLES=Object.freeze([
 'Çırak Gözcü','Sınır İzci','Diken Avcısı','Gece Kılavuzu',
 'Siren Kıran','Kül Muhafızı','Tutulma Avcısı','Yıldız Nöbetçisi',
 'Zirve Koruyucusu','Karanlık Yarıcı','Sınır Efsanesi','Şafak Öncüsü'
]);
export const SHADOW_MASTERY_WEEKLY_LIMIT=100;
const safe=(v,lo,hi)=>Number.isSafeInteger(v)&&v>=lo&&v<=hi;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>Number(n).toLocaleString('tr-TR');
export function shadowRankFromXp(xp){
 if(!safe(xp,0,1e9))return 0;
 return SHADOW_MASTERY_THRESHOLDS.filter(x=>xp>=x).length;
}
export function shadowRankReward(rank){
 if(!safe(rank,1,12))return null;
 return {gold:80+60*rank,wood:40+30*rank,stone:35+30*rank,aether:8+6*rank};
}
export function shadowMasterySnapshot(data){
 const xp=data?.masteryXp??0;
 const rank=data?.masteryRank??shadowRankFromXp(xp);
 const claimed=data?.masteryClaimed??0;
 const weekly=data?.weeklyRenown??0;
 const wins=data?.weeklyWins??0;
 const limit=data?.weeklyLimit??100;
 const week=data?.week??'—';
 if(!safe(xp,0,1e9)||!safe(rank,0,12)||rank!==shadowRankFromXp(xp)||
    !safe(claimed,0,12)||claimed>rank||
    !safe(weekly,0,100)||!safe(wins,0,100000)||limit!==100||
    (week!=='—'&&!/^20\d\d-\d\d$/.test(week)))
   throw Error('Sınır Ustalığı sunucu ilerleme kaydı geçersiz.');
 return {xp,rank,claimed,weekly,wins,limit,week};
}
export function shadowMasteryMarkup(front,{busy=false,inBattle=false}={}){
 if(!front)return '<section class="shadow-mastery"><h3>🌟 Sınır Ustalığı</h3><p>Sunucu ustalık kaydı yükleniyor.</p></section>';
 const data=shadowMasterySnapshot(front);
 const next=SHADOW_MASTERY_THRESHOLDS[data.rank]??SHADOW_MASTERY_THRESHOLDS[11];
 const previous=data.rank>0?SHADOW_MASTERY_THRESHOLDS[data.rank-1]:0;
 const current=data.rank===12?1:Math.min(1,(data.xp-previous)/Math.max(1,next-previous));
 const claimable=data.claimed<data.rank;
 const claim=shadowRankReward(data.claimed+1);
 const nextTitle=SHADOW_MASTERY_TITLES[data.rank]||SHADOW_MASTERY_TITLES[11];
 const rankCards=SHADOW_MASTERY_THRESHOLDS.map((value,i)=>{
  const n=i+1,earned=data.rank>=n,claimed=data.claimed>=n;
  return `<li class="${claimed?'claimed':earned?'earned':'locked'}">
    <span class="mastery-rank-index">${claimed?'✓':n}</span>
    <span><b>${esc(SHADOW_MASTERY_TITLES[i])}</b><small>${nf(value)} itibar · ${claimed?'Ödül alındı':earned?'Ödül hazır':'Hedef'}</small></span>
  </li>`;
 }).join('');
 return `<section class="shadow-mastery" aria-label="Sunucu Sınır Ustalığı">
  <header class="mastery-header"><span class="eyebrow">UZUN VADELİ OYUNCU İLERLEMESİ · HESAP SUNUCUSUNDA</span>
    <h3>✦ Sınır Ustalığı</h3><p>Patronlarla mücadele ederek 12 kalıcı rütbe kazan. Her rütbenin kaynağı bir kez verilir; hiçbiri ücretli değildir.</p>
  </header>
  <div class="mastery-overview">
   <div class="mastery-rank-stamp"><b>${data.rank}<small>/12</small></b><span>KALICI RÜTBE</span></div>
   <div class="mastery-bars">
    <div class="mastery-bar-title"><strong>${data.rank===12?'Son rütbeye ulaştın':'Sıradaki: '+esc(nextTitle)}</strong><span>${nf(data.xp)} / ${nf(next)} itibar</span></div>
    <div class="mastery-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(current*100)}" aria-label="Kalıcı Sınır Ustalığı ilerlemesi">
      <i style="width:${Math.round(current*100)}%"></i>
    </div>
    <div class="mastery-bar-title"><strong>Haftalık ilerleme · ${esc(data.week)}</strong><span>${data.weekly} / 100 itibar</span></div>
    <div class="mastery-meter week" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${data.weekly}" aria-label="Haftalık itibar ilerlemesi">
      <i style="width:${data.weekly}%"></i>
    </div>
    <small>${nf(data.wins)} doğrulanmış zafer bu hafta · her hafta en fazla 100 itibar · kesintisiz giriş şartı yok</small>
   </div>
  </div>
  <div class="mastery-claim">
   ${claimable?`<p><strong>🎁 ${data.claimed+1}. rütbe ödülün hazır</strong><small>${nf(claim.gold)} altın · ${nf(claim.wood)} kereste · ${nf(claim.stone)} taş · ${nf(claim.aether)} yıldız özü</small></p>`:
    '<p><strong>Bir sonraki ustalık ödülü için sefere çık</strong><small>Her zorlukta ilerleme kaydı yalnızca gerçek sefer zaferiyle artar.</small></p>'}
   <button class="${claimable?'primary':'secondary'}" data-shadow-action="claim_mastery" ${!claimable||busy||inBattle?'disabled':''}>${claimable?'✦ Rütbe ödülünü al':'Yeni rütbe bekleniyor'}</button>
  </div>
  <details class="mastery-roadmap"><summary>12 rütbelik ustalık yolunu görüntüle</summary>
    <ol class="mastery-rank-list">${rankCards}</ol>
  </details>
  <p class="mastery-economy-note">Ekonomi dengesi: haftanın ilk 6 zaferinden sonra tekrar bölge kaynakları azalır (%38 → %22 → %10). İlk zafer ekipmanı ve ilk zaferin tam ödülü korunur. Ustalık itibarı haftada 100 ile sınırlandırılır; sonrasındaki zaferler günlük/haftalık görevleri ilerletmeye devam eder.</p>
 </section>`;
}
