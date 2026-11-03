import {HEROES,STAGES} from './rules.js';
import {secondActMission} from './second-act.js';
import {actTwoEncounter} from './act-two-encounters.js';
import {actTwoBossAbility} from './act-two-abilities.js';
import {operationStatus} from './story-operations.js';
import {chapterAtmosphere} from './battle-atmosphere.js';
import {getLocale} from './locale-v243.js';
import {displayStage} from './locale-game-content-v245.js';
import {displaySecondAct} from './locale-act-two-v245.js';
import {sceneText,sceneMood,sceneBossAbility,sceneStageEnemy} from './locale-official-scene-v247.js';
const rects={aldren:[1,0,560],lyra:[1,560,525],rovan:[1,1085,451],mira:[2,0,575],doran:[2,575,565],vesper:[2,1140,396],eira:[3,0,505],raider:['enemies',0,512],caster:['enemies',512,528],boss:['enemies',1040,496]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function officialSpriteStyle(id){
 const [sheet,x,w]=rects[id]||rects.raider;
 return `--sheet:url('assets/battle-${sheet==='enemies'?'enemies':'heroes-'+sheet}.webp');--atlas-size:${1536/w*100}%;--atlas-x:${x/(1536-w)*100}%;--sprite-ratio:${w/1024}`;
}
const portrait=(unit,type,index,percent,bossName=null,customName=null)=>`<div class="official-fighter ${type} fighter-${index}" style="${officialSpriteStyle(unit)}"><span class="fighter-ground"></span><span class="battle-sprite" aria-hidden="true"></span><div class="official-unit-label"><strong>${esc(type==='enemy'?(customName||(unit==='boss'&&bossName?bossName:({raider:sceneText('enemyRaider'),caster:sceneText('enemyCaster'),boss:sceneText('enemyBoss')}[unit]||unit))):(HEROES.find(h=>h.id===unit)?.name||unit))}</strong><span class="official-mini-health"><i style="width:${Math.min(100,Math.max(0,percent))}%"></i></span></div></div>`;
export function officialCombatScene(game,mission,report=null){
 if(!mission)return '';
 const stage=STAGES[mission.stage-1]||STAGES[0],atmosphere=chapterAtmosphere(stage.id);
 const operation=operationStatus(mission),act2=secondActMission(mission),encounter=actTwoEncounter(mission),bossAbility=actTwoBossAbility(mission);
 const team=(game.team||[]).filter(id=>HEROES.some(h=>h.id===id)).slice(0,3);
 const actorId=String(mission.lastAction||'').startsWith('skill:')?String(mission.lastAction).slice(6):'';
 const actor=HEROES.find(h=>h.id===actorId);
 const lastLabel=actor?sceneText('actorSkill',{hero:actor.name}):(({strike:sceneText('strike'),guard:sceneText('guard'),skill:sceneText('skill'),Başladı:sceneText('started')})[mission.lastAction]||(getLocale()==='tr'?mission.lastAction:null)||sceneText('ongoing'));
 const ph=mission.playerMaxHp?mission.playerHp/mission.playerMaxHp*100:0;
 const eh=mission.enemyMaxHp?mission.enemyHp/mission.enemyMaxHp*100:0;
 const enemies=encounter?encounter.roster.map(x=>x.kind):mission.mode==='boss'?['raider','boss','caster']:mission.stage>=7?['raider','caster','boss']:mission.stage>=4?['raider','caster','raider']:['raider','caster','raider'];
 return `<section class="official-combat-scene scene-${atmosphere.id} ${act2?'act-two-scene theme-'+encounter?.theme:''} ${bossAbility?.active?'boss-ability-live ability-'+bossAbility.id:''} ${actor?'hero-skill-impact':'basic-combat-impact'}" role="region" aria-label="${esc(sceneText('arenaLabel'))}">
  <div class="official-arena-light" aria-hidden="true"></div><div class="official-arena-vignette"></div>
  ${encounter?`<div class="act2-environment" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`:''}
  ${bossAbility?`<div class="act2-ability-aura ${bossAbility.active?'active':''}" aria-hidden="true"><span>${bossAbility.icon}</span></div>`:''}
  <div class="official-3d-viewport" data-official-3d-view aria-hidden="true"></div>
  <button class="official-render-switch" type="button" data-official-render-toggle aria-pressed="false" title="${esc(sceneText('switchTitle'))}">${esc(sceneText('switchOn'))}</button>
  <div class="battle-biome"><strong>${esc(act2?displaySecondAct(act2.stage)?.zone:displayStage(stage)?.name||atmosphere.name)}</strong><small>${esc(act2?displaySecondAct(act2.stage)?.lore:sceneMood(stage.id)||atmosphere.mood)}</small></div>
  <div class="official-arena-top"><span class="official-arena-badge">${esc(sceneText('region'))} ${String(stage.id).padStart(2,'0')} · ${mission.mode==='act2'?sceneText('actTwo')+' · '+mission.stage:mission.mode==='veteran'?sceneText('veteran')+' '+mission.tier:mission.mode==='maze'?sceneText('floor')+' '+mission.floor:mission.mode==='rift'?sceneText('rift'):mission.mode==='boss'?sceneText('worldBoss'):sceneText('officialExpedition')}</span><span class="official-turn-counter">${operation?`${sceneText('operation')} ${operation.wave}/${operation.total} · `:''}${esc(sceneText('turn'))} ${mission.turn+1} · <span data-official-render-state>${esc(sceneText('twoDBattle'))}</span> · ${esc(sceneText('verifiedServer'))}</span></div>
  <div class="official-stage-formation"><div class="official-side allies">${team.map((id,i)=>portrait(id,'ally',i,ph)).join('')}</div>
  <div class="official-clash-center" aria-hidden="true"><span>⚔</span></div>
  <div class="official-side hostiles">${enemies.map((id,i)=>portrait(id,'enemy',i,eh,act2?displaySecondAct(act2.stage)?.boss:null,getLocale()==='tr'?encounter?.roster[i]?.name:encounter?`${displaySecondAct(act2.stage)?.operations?.[Math.max(0,mission.wave-1)]?.name||displaySecondAct(act2.stage)?.name} · ${sceneText(id==='boss'?'enemyBoss':id==='caster'?'enemyCaster':'enemyRaider')} ${i+1}`:null)).join('')}</div></div>
  <div class="official-weapon-flash" aria-hidden="true"></div><div class="official-impact-ring" aria-hidden="true"></div>
  ${bossAbility?.active?`<div class="act2-ability-banner" aria-label="${esc(sceneText('bossAbility'))}">${bossAbility.icon} ${esc(sceneBossAbility(bossAbility.stage))} · ${esc(sceneText(bossAbility.counter==='guard'?'shield':'specialAbility'))}</div>`:''}
  <div class="official-action-caption" role="status">${esc(lastLabel)}</div>
  <div class="official-arena-foot"><span>${esc(act2?displaySecondAct(act2.stage)?.boss:sceneStageEnemy(stage.id))}</span><span>${esc(sceneText('power'))} ${Number(mission.power||0).toLocaleString(getLocale())} · ${mission.turn} ${esc(sceneText('moves'))}</span></div>
 </section>`;
}
