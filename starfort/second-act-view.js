import {SECOND_ACT,secondActReadiness} from './second-act.js';
import {displaySecondAct,secondActGateMessage} from './locale-act-two-v245.js';
import {local} from './locale-game-content-v245.js';
import {officialServerTeamPower} from './official-server-team-power.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function secondActMarkup(game,account,mission){
 if(!account)return '';
 const completed=Array.isArray(account.act2Cleared)?account.act2Cleared:[];
 const stars=account.act2Stars||{};
 const power=officialServerTeamPower(game,account);
 const ready=account.cleared.length===8;
 const rows=SECOND_ACT.map(region=>{
  const display=displaySecondAct(region);
  const done=completed.includes(region.id),next=region.id===completed.length+1,open=ready&&(done||next);
  const gate=secondActReadiness(account,power,region.id);
  const active=mission?.mode==='act2'&&mission.stage===region.id;
  const reached=done?3:active?Math.max(0,Math.min(2,(mission.wave||1)-1)):0;
  const starCount=stars[region.id]||0;
  return `<article class="second-act-card ${done?'complete':''} ${open?'available':'locked'}">
   <div class="second-act-meta"><span>II · ${String(region.id).padStart(2,'0')} / 08</span><span>${done?local('✓ TAMAMLANDI','✓ COMPLETED'):next&&ready?local('YENİ BÖLGE','NEW REGION'):local('KİLİTLİ','LOCKED')}</span></div>
   <h4>${esc(display.name)}</h4><p>${esc(display.lore)}</p><small>${local('Patron','Boss')}: ${esc(display.boss)} · ${local('Önerilen güç','Recommended power')} ${region.recommendedPower}</small>
   <div class="second-act-stars" aria-label="${starCount} / 3 ${local('yıldız','stars')}">${'★'.repeat(starCount)}${'☆'.repeat(3-starCount)}</div>
   <ol class="second-act-steps">${display.operations.map((op,i)=>`<li class="${i<reached?'complete':i===reached&&open?'current':''}"><b>${i<reached?'✓':i+1}</b><div><strong>${esc(op.name)}</strong><small>${esc(op.objective)}</small></div></li>`).join('')}</ol>
   ${open&&!gate.ok?`<small class="official-stage-gate">${esc(secondActGateMessage(gate.reason))}</small>`:''}
   <button class="${done?'secondary':'primary'}" data-realm-mission="act2:${region.id}" ${!gate.ok||mission?'disabled':''}>${mission?local('Savaş sürüyor','Battle in progress'):done?local('Yeniden keşfet','Explore again'):local('Yeni seferi başlat','Start new expedition')}</button>
  </article>`;
 }).join('');
 return `<section class="second-act" aria-label="${local('İkinci perde: Şafağın Ötesi','Act II: Beyond Dawn')}">
  <header class="second-act-heading"><span class="eyebrow">${local('YENİ HİKÂYE · PERDE II','NEW STORY · ACT II')}</span><h3>${local('Şafağın Ötesi · 8 Yeni Bölge','Beyond Dawn · 8 New Regions')}</h3>
  <p>${local('Ana hikâyeyi tamamlayınca açılan yeni bir sefer yolu: sekiz bölge, yirmi dört görev, artan güçlük ve kalıcı yıldız dereceleri. Ödül yalnızca son dalga kazanıldığında verilir.','Unlock a new campaign after the main story: eight regions, 24 operations, rising difficulty and permanent star ratings. Rewards are granted only after the final wave.')}</p>
  <span class="second-act-counter">${completed.length}/8 ${local('BÖLGE','REGIONS')} · ${Object.values(stars).reduce((a,b)=>a+b,0)}/24 ${local('YILDIZ','STARS')}</span></header>
  <div class="second-act-grid">${rows}</div></section>`;
}
