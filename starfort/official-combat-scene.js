import {HEROES,STAGES} from './rules.js';
import {chapterAtmosphere} from './battle-atmosphere.js';
const rects={aldren:[1,0,560],lyra:[1,560,525],rovan:[1,1085,451],mira:[2,0,575],doran:[2,575,565],vesper:[2,1140,396],eira:[3,0,505],raider:['enemies',0,512],caster:['enemies',512,528],boss:['enemies',1040,496]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function officialSpriteStyle(id){
 const [sheet,x,w]=rects[id]||rects.raider;
 return `--sheet:url('assets/battle-${sheet==='enemies'?'enemies':'heroes-'+sheet}.webp');--atlas-size:${1536/w*100}%;--atlas-x:${x/(1536-w)*100}%;--sprite-ratio:${w/1024}`;
}
const portrait=(unit,type,index,percent)=>`<div class="official-fighter ${type} fighter-${index}" style="${officialSpriteStyle(unit)}"><span class="fighter-ground"></span><span class="battle-sprite" aria-hidden="true"></span><div class="official-unit-label"><strong>${esc(type==='enemy'?({raider:'Kül Akıncısı',caster:'Gölge Büyücüsü',boss:'Kadim Hükümdar'}[unit]||unit):(HEROES.find(h=>h.id===unit)?.name||unit))}</strong><span class="official-mini-health"><i style="width:${Math.min(100,Math.max(0,percent))}%"></i></span></div></div>`;
export function officialCombatScene(game,mission,report=null){
 if(!mission)return '';
 const stage=STAGES[mission.stage-1]||STAGES[0],atmosphere=chapterAtmosphere(stage.id);
 const team=(game.team||[]).filter(id=>HEROES.some(h=>h.id===id)).slice(0,3);
 const ph=mission.playerMaxHp?mission.playerHp/mission.playerMaxHp*100:0;
 const eh=mission.enemyMaxHp?mission.enemyHp/mission.enemyMaxHp*100:0;
 const enemies=mission.mode==='boss'?['raider','boss','caster']:mission.stage>=7?['raider','caster','boss']:mission.stage>=4?['raider','caster','raider']:['raider','caster','raider'];
 return `<section class="official-combat-scene scene-${atmosphere.id}" role="region" aria-label="Sunucu tarafından yönetilen görsel savaş alanı">
  <div class="official-arena-light" aria-hidden="true"></div><div class="official-arena-vignette"></div>
  <div class="battle-biome"><strong>${esc(atmosphere.name)}</strong><small>${esc(atmosphere.mood)}</small></div>
  <div class="official-arena-top"><span class="official-arena-badge">BÖLGE ${String(stage.id).padStart(2,'0')} · ${mission.mode==='veteran'?'USTA '+mission.tier:mission.mode==='maze'?'KAT '+mission.floor:mission.mode==='rift'?'YARIK':mission.mode==='boss'?'DÜNYA PATRONU':'RESMÎ SEFER'}</span><span class="official-turn-counter">TUR ${mission.turn+1} · SUNUCU ONAYLI</span></div>
  <div class="official-stage-formation"><div class="official-side allies">${team.map((id,i)=>portrait(id,'ally',i,ph)).join('')}</div>
  <div class="official-clash-center" aria-hidden="true"><span>⚔</span></div>
  <div class="official-side hostiles">${enemies.map((id,i)=>portrait(id,'enemy',i,eh)).join('')}</div></div>
  <div class="official-weapon-flash" aria-hidden="true"></div><div class="official-action-caption" role="status">${esc(({strike:'Kılıçlar çarpıştı',guard:'Siperler kuruldu',skill:'Yıldız yeteneği',Başladı:'Muharebe başlıyor'})[mission.lastAction]||mission.lastAction||'Muharebe sürüyor')}</div>
  <div class="official-arena-foot"><span>${esc(stage.enemyName)}</span><span>Güç ${Number(mission.power||0).toLocaleString('tr-TR')} · ${mission.turn} hamle</span></div>
 </section>`;
}
