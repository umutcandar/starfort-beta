import {SECOND_ACT,secondActReadiness} from './second-act.js';
import {officialServerTeamPower} from './official-server-team-power.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function secondActMarkup(game,account,mission){
 if(!account)return '';
 const completed=Array.isArray(account.act2Cleared)?account.act2Cleared:[];
 const stars=account.act2Stars||{};
 const power=officialServerTeamPower(game,account);
 const ready=account.cleared.length===8;
 const rows=SECOND_ACT.map(region=>{
  const done=completed.includes(region.id),next=region.id===completed.length+1,open=ready&&(done||next);
  const gate=secondActReadiness(account,power,region.id);
  const active=mission?.mode==='act2'&&mission.stage===region.id;
  const reached=done?3:active?Math.max(0,Math.min(2,(mission.wave||1)-1)):0;
  const starCount=stars[region.id]||0;
  return `<article class="second-act-card ${done?'complete':''} ${open?'available':'locked'}">
   <div class="second-act-meta"><span>II · ${String(region.id).padStart(2,'0')} / 08</span><span>${done?'✓ TAMAMLANDI':next&&ready?'YENİ BÖLGE':'KİLİTLİ'}</span></div>
   <h4>${esc(region.name)}</h4><p>${esc(region.lore)}</p><small>Patron: ${esc(region.boss)} · Önerilen güç ${region.recommendedPower}</small>
   <div class="second-act-stars" aria-label="${starCount} / 3 yıldız">${'★'.repeat(starCount)}${'☆'.repeat(3-starCount)}</div>
   <ol class="second-act-steps">${region.operations.map((op,i)=>`<li class="${i<reached?'complete':i===reached&&open?'current':''}"><b>${i<reached?'✓':i+1}</b><div><strong>${esc(op.name)}</strong><small>${esc(op.objective)}</small></div></li>`).join('')}</ol>
   ${open&&!gate.ok?`<small class="official-stage-gate">${esc(gate.reason)}</small>`:''}
   <button class="${done?'secondary':'primary'}" data-realm-mission="act2:${region.id}" ${!gate.ok||mission?'disabled':''}>${mission?'Savaş sürüyor':done?'Yeniden keşfet':'Yeni seferi başlat'}</button>
  </article>`;
 }).join('');
 return `<section class="second-act" aria-label="İkinci perde: Şafağın Ötesi">
  <header class="second-act-heading"><span class="eyebrow">YENİ HİKÂYE · PERDE II</span><h3>Şafağın Ötesi · 8 Yeni Bölge</h3>
  <p>Ana hikâyeyi tamamlayınca açılan yeni bir sefer yolu: sekiz bölge, yirmi dört görev, artan güçlük ve kalıcı yıldız dereceleri. Ödül yalnızca son dalga kazanıldığında verilir.</p>
  <span class="second-act-counter">${completed.length}/8 BÖLGE · ${Object.values(stars).reduce((a,b)=>a+b,0)}/24 YILDIZ</span></header>
  <div class="second-act-grid">${rows}</div></section>`;
}
