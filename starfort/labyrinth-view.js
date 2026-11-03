import {labyrinthStatus,MAZE_FLOORS} from './labyrinth.js';
import {textKey as tx,longText as lt} from './locale-sections-v247.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={entrance:'⌂',exit:'✧',guardian:'⚔',treasure:'▣',fountain:'✦',trap:'⚡',passage:'·'};
const labels=()=>({entrance:lt('Giriş','Entrance'),exit:tx('exit'),guardian:tx('guardian'),treasure:lt('Ganimet sandığı','Treasure chest'),fountain:lt('Yıldız pınarı','Star spring'),trap:lt('Kadim tuzak','Ancient trap'),passage:lt('Koridor','Corridor')});
const ZONE_EN={'Kül Merdivenleri':['Ash Stairs','Forgotten ash furnaces beneath Starfall Valley'],'Kayıp Kökler':['Lost Roots','Dark galleries connected to the Blackwood roots'],'Ayaz Taşlığı':['Froststone Caverns','Frozen seals and guardians of the north'],'Yıldızın Kalbi':['Heart of the Star','Final crypts guarding the broken core']};
export const translatedMazeZone=zone=>!zone?zone:({name:lt(zone.name,ZONE_EN[zone.name]?.[0]||zone.name),hint:lt(zone.hint,ZONE_EN[zone.name]?.[1]||zone.hint)});
function cellMarkup(cell){
  const visual=cell.current?'♜':cell.visited ? cell.type==='guardian'&&cell.claimed?'◇':cell.claimed?'✓':icons[cell.type] : cell.visible?'?':'';
  const known=cell.visited || cell.current;
  const name=known?labels()[cell.type]:cell.visible?lt('Keşfedilmemiş oda','Unexplored room'):lt('Sis perdesi','Fog of war');
  const routes=['n','e','s','w'].filter((side)=>{
    const neighbor=cell.id+({n:-5,e:1,s:5,w:-1}[side]);
    return cell.links.includes(neighbor);
  }).map(side=>`<i class="maze-passage maze-${side}"></i>`).join('');
  return `<button class="maze-tile ${cell.current?'is-current':''} ${cell.visited?'is-visited':''} ${cell.reachable?'is-reachable':''} ${cell.visible?'is-visible':'is-hidden'} maze-type-${cell.type}"
    ${cell.reachable?`data-labyrinth-move="${cell.id}"`:'disabled'} title="${esc(name)}" aria-label="${esc(name)}${cell.reachable?lt(' – geçilebilir',' – accessible'):''}">
    ${cell.visible?routes:''}<span class="maze-glyph">${visual}</span>${cell.current?'<small>'+lt('SEN','YOU')+'</small>':''}
    </button>`;
}
export function labyrinthMarkup(state){
  const m=labyrinthStatus(state),battleActive=state.battle?.status==='active',zone=translatedMazeZone(m.zone);
  const percent=Math.round(100*m.cleared/MAZE_FLOORS);
  return `<header class="maze-heading"><div><span class="eyebrow">${tx('labSubtitle')} · ${lt('TEK OYUNCU','SINGLE PLAYER')}</span><h2>${tx('labTitle')}</h2><p>${lt('Köyün altında uzanan katları keşfet. Koridorları bul, muhafızı yen, geçidi aç.','Explore the floors beneath your village. Find the corridors, defeat the guardian and unlock the gate.')}</p></div><button class="secondary" data-view="expedition">${lt('Seferlere dön','Return to expeditions')}</button></header>
    <div class="maze-overview"><div><span>${lt('YER ALTI KATI','UNDERGROUND FLOOR')}</span><strong>${String(m.floor).padStart(2,'0')} <small>/ ${MAZE_FLOORS}</small></strong><p>${esc(zone.name)}</p></div><div class="maze-overview-right"><span>${tx('labSubtitle')} · ${tx('progress')}</span><strong>${m.cleared} / ${MAZE_FLOORS} ${tx('complete')}</strong><div class="maze-progress"><i style="width:${percent}%"></i></div><p>${lt('Kayıt otomatik yapılır · günlük giriş sınırı yok','Progress saves automatically · No daily login limit')}</p></div></div>
    <section class="maze-shell">
      <div class="maze-left"><div class="maze-map-head"><span>✦ ${tx('labMap')}</span><small>${m.available?lt('Parlayan odaya dokunarak bir koridor ilerle.','Tap a glowing room to move one corridor.'):lt('Mühür henüz çözülemedi.','The seal is not yet broken.')}</small></div>
        <div class="maze-board" role="group" aria-label="${tx('floor')} ${m.floor} ${lt('labirent haritası','labyrinth map')}">${m.cells.map(cellMarkup).join('')}</div>
        <p class="maze-map-legend"><span><b>♜</b> ${lt('Konumun','Your position')}</span><span><b>?</b> ${lt('Keşfedilecek oda','Room to explore')}</span><span><b>⚔</b> ${tx('guardian')}</span><span><b>✧</b> ${tx('exit')}</span></p>
      </div>
      <aside class="maze-side">
        <span class="eyebrow">${tx('floor')} ${m.floor} · ${esc(zone.name)}</span>
        <h3>${m.completed?lt('Yıldızın Yeminini Tamamladın','You fulfilled the Star Oath'):!m.available?tx('labGate'):m.guardianDefeated?lt('Kapı Muhafızı Düştü','Gate guardian defeated'):tx('labExplore')}</h3>
        <p>${m.completed?lt('Labirentin 16 katını da tamamladın. Kalenin altında saklanan yolu geri aldın.','All 16 floors cleared. You reclaimed the hidden path beneath the keep.'):!m.available?lt(`Bu katta ilerlemek için önce ${m.requiredChapters} ana hikâye bölümünü bitir.`,`Complete ${m.requiredChapters} main story chapters to unlock this floor.`):esc(zone.hint)}</p>
        <div class="maze-mission"><span>${tx('labMission')}</span><b>${m.guardianDefeated?lt('Muhafızı yendin · çıkışa ulaş','Guardian defeated · reach the exit'):lt('Kat muhafızını bul ve yen','Find and defeat the floor guardian')}</b><small>${m.guardianDefeated?lt('Çıkış odasına giderek kat ödülünü al.','Reach the exit to claim the floor reward.'):lt('Sandıkları ve yıldız pınarlarını arayabilirsin. Her ödül yalnızca bir kez alınır.','Search for chests and star springs. Each reward can be claimed only once.')}</small></div>
        ${m.canFight?`<button class="primary maze-primary" data-labyrinth-fight ${battleActive?'disabled':''}>⚔ ${tx('labFight')}</button>`:''}
        ${m.canFinish?`<button class="primary maze-primary" data-labyrinth-complete>✦ ${m.floor===MAZE_FLOORS?lt('Son mühürü tamamla','Complete the final seal'):tx('labNext')}</button>`:''}
        ${battleActive&&state.battle?.labyrinthFloor?`<button class="secondary maze-primary" data-action="resume-battle">▶ ${lt('Muhafız savaşına dön','Return to guardian battle')}</button>`:''}
        ${m.available&&!m.canFight&&!m.canFinish&&!m.completed?`<small class="maze-hint">${lt('Sadece mevcut odana bağlı parlayan taşlara ilerleyebilirsin. Tuzaklar biraz altın eksiltebilir, diğer odalar ganimet sağlar.','Only move to glowing tiles connected to your current room. Traps may consume some gold; other rooms contain loot.')}</small>`:''}
        ${m.completed?`<p class="maze-complete">✦ ${tx('labSubtitle')} · ${tx('complete')} · 16/16</p>`:''}
        <div class="maze-floor-list">${Array.from({length:MAZE_FLOORS},(_,i)=>`<span class="${i<m.cleared?'is-done':i===m.floor-1?'is-now':''}" title="${tx('floor')} ${i+1}">${i<m.cleared?'✓':i+1}</span>`).join('')}</div>
        <small class="maze-terms">${lt('Labirent kaynakları yerel hikâyeye eklenir. PvP derecesi, klan ödülleri ve sefer yıldızları etkilenmez.','Labyrinth rewards affect only local story progress, not PvP ratings, clan rewards or campaign stars.')}</small>
      </aside>
    </section>`;
}
