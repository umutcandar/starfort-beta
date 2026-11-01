import {labyrinthStatus,MAZE_FLOORS} from './labyrinth.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={entrance:'⌂',exit:'✧',guardian:'⚔',treasure:'▣',fountain:'✦',trap:'⚡',passage:'·'};
const labels={entrance:'Giriş',exit:'Mühürlü geçit',guardian:'Kat muhafızı',treasure:'Ganimet sandığı',fountain:'Yıldız pınarı',trap:'Kadim tuzak',passage:'Koridor'};
function cellMarkup(cell){
  const visual=cell.current?'♜':cell.visited ? cell.type==='guardian'&&cell.claimed?'◇':cell.claimed?'✓':icons[cell.type] : cell.visible?'?':'';
  const known=cell.visited || cell.current;
  const name=known?labels[cell.type]:cell.visible?'Keşfedilmemiş oda':'Sis perdesi';
  const routes=['n','e','s','w'].filter((side)=>{
    const neighbor=cell.id+({n:-5,e:1,s:5,w:-1}[side]);
    return cell.links.includes(neighbor);
  }).map(side=>`<i class="maze-passage maze-${side}"></i>`).join('');
  return `<button class="maze-tile ${cell.current?'is-current':''} ${cell.visited?'is-visited':''} ${cell.reachable?'is-reachable':''} ${cell.visible?'is-visible':'is-hidden'} maze-type-${cell.type}"
    ${cell.reachable?`data-labyrinth-move="${cell.id}"`:'disabled'} title="${esc(name)}" aria-label="${esc(name)}${cell.reachable?' – geçilebilir':''}">
    ${cell.visible?routes:''}<span class="maze-glyph">${visual}</span>${cell.current?'<small>SEN</small>':''}
    </button>`;
}
export function labyrinthMarkup(state){
  const m=labyrinthStatus(state),battleActive=state.battle?.status==='active';
  const percent=Math.round(100*m.cleared/MAZE_FLOORS);
  return `<header class="maze-heading"><div><span class="eyebrow">YILDIZALTI LABİRENTİ · TEK OYUNCU</span><h2>Unutulmuş Yıldız Kapıları</h2><p>Köyün altında uzanan katları keşfet. Koridorları bul, muhafızı yen, geçidi aç.</p></div><button class="secondary" data-view="expedition">Seferlere dön</button></header>
    <div class="maze-overview"><div><span>YER ALTI KATI</span><strong>${String(m.floor).padStart(2,'0')} <small>/ ${MAZE_FLOORS}</small></strong><p>${esc(m.zone.name)}</p></div><div class="maze-overview-right"><span>KAT İLERLEMESİ</span><strong>${m.cleared} / ${MAZE_FLOORS} tamamlandı</strong><div class="maze-progress"><i style="width:${percent}%"></i></div><p>Kayıt otomatik yapılır · günlük giriş sınırı yok</p></div></div>
    <section class="maze-shell">
      <div class="maze-left"><div class="maze-map-head"><span>✦ Kayıp Geçit Haritası</span><small>${m.available?'Parlayan odaya dokunarak bir koridor ilerle.':'Mühür henüz çözülemedi.'}</small></div>
        <div class="maze-board" role="group" aria-label="${m.floor}. kat labirent haritası">${m.cells.map(cellMarkup).join('')}</div>
        <p class="maze-map-legend"><span><b>♜</b> Konumun</span><span><b>?</b> Keşfedilecek oda</span><span><b>⚔</b> Muhafız</span><span><b>✧</b> Çıkış</span></p>
      </div>
      <aside class="maze-side">
        <span class="eyebrow">KAT ${m.floor} · ${esc(m.zone.name)}</span>
        <h3>${m.completed?'Yıldızın Yeminini Tamamladın':!m.available?'Mühürlü Kapı':m.guardianDefeated?'Kapı Muhafızı Düştü':'Koridorları Keşfet'}</h3>
        <p>${m.completed?'Labirentin 12 katını da tamamladın. Kalenin altında saklanan yolu geri aldın.':!m.available?`Bu katta ilerlemek için önce ${m.requiredChapters} ana hikâye bölümünü bitir.`:esc(m.zone.hint)}</p>
        <div class="maze-mission"><span>GÖREV</span><b>${m.guardianDefeated?'Muhafızı yendin · çıkışa ulaş':'Kat muhafızını bul ve yen'}</b><small>${m.guardianDefeated?'Çıkış odasına giderek kat ödülünü al.':'Sandıkları ve yıldız pınarlarını arayabilirsin. Her ödül yalnızca bir kez alınır.'}</small></div>
        ${m.canFight?`<button class="primary maze-primary" data-labyrinth-fight ${battleActive?'disabled':''}>⚔ Muhafızla savaş</button>`:''}
        ${m.canFinish?`<button class="primary maze-primary" data-labyrinth-complete>✦ ${m.floor===MAZE_FLOORS?'Son mühürü tamamla':'Portaldan sonraki kata geç'}</button>`:''}
        ${battleActive&&state.battle?.labyrinthFloor?`<button class="secondary maze-primary" data-action="resume-battle">▶ Muhafız savaşına dön</button>`:''}
        ${m.available&&!m.canFight&&!m.canFinish&&!m.completed?`<small class="maze-hint">Sadece mevcut odana bağlı parlayan taşlara ilerleyebilirsin. Tuzaklar biraz altın eksiltebilir, diğer odalar ganimet sağlar.</small>`:''}
        ${m.completed?'<p class="maze-complete">✦ LABİRENT TAMAMLANDI · 12/12</p>':''}
        <div class="maze-floor-list">${Array.from({length:MAZE_FLOORS},(_,i)=>`<span class="${i<m.cleared?'is-done':i===m.floor-1?'is-now':''}" title="Kat ${i+1}">${i<m.cleared?'✓':i+1}</span>`).join('')}</div>
        <small class="maze-terms">Labirent kaynakları yerel hikâyeye eklenir. PvP derecesi, klan ödülleri ve sefer yıldızları etkilenmez.</small>
      </aside>
    </section>`;
}
