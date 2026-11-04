import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES} from './locale-v243.js';
import {createState,HEROES} from './rules.js';
import {officialCombatScene} from './official-combat-scene.js';
import {officialBattleRoom} from './official-battle-bridge.js';
import {cinematicText,CINEMATIC_KEYS,CINEMATIC_LANGS,officialSkillSpotlight,cinematicCombatMarkup} from './official-cinematic-v260.js';
import {cinematicCameraShot} from './official-3d-camera-shots-v260.js';
import {officialStrikeWindow,officialClashEffects} from './official-3d-choreography-v259.js';
import {officialFxAge,drawOfficialFantasyEffects,FX_LIFETIME} from './graphics-3d-fantasy-v260.js';
import {characterMaterial,drawCharacterDetail} from './graphics-3d-characters-v260.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.UTC(2026,10,4,18,5);
const previous=()=>({mode:'story',stage:4,startedAt:now-30_000,lastTurnAt:now-3200,turn:4,wave:1,waves:3,
 playerHp:250,playerMaxHp:300,enemyHp:245,enemyMaxHp:350,enemyIntent:'crush',lastAction:'strike',power:460,cooldowns:{}});
const after=(extra={})=>({...previous(),turn:5,lastTurnAt:now,playerHp:232,enemyHp:160,
 lastAction:'skill:lyra',enemyIntent:'shield',...extra});
const team=['aldren','lyra','rovan'];
const delta=(extra={})=>({turn:5,initial:false,damage:85,received:18,healed:0,action:'skill:lyra',...extra});
function fakeMesh(){
 return {count:0,box(...args){this.count++;assert.ok(args.slice(0,6).every(Number.isFinite));},
 segment(a,b,width,depth){this.count++;assert.ok([...a,...b,width,depth].every(Number.isFinite));},
 prism(x,y,z,r,h){this.count++;assert.ok([x,y,z,r,h].every(Number.isFinite));},
 pyramid(x,y,z,r,h){this.count++;assert.ok([x,y,z,r,h].every(Number.isFinite));},
 ground(){this.count++}};
}
test('all 14 languages contain complete original 3D HUD labels',()=>{
 assert.deepEqual(new Set(CINEMATIC_LANGS),new Set(SUPPORTED_LOCALES));
 for(const locale of SUPPORTED_LOCALES){
  for(const key of CINEMATIC_KEYS){
   const val=cinematicText(key,locale);
   assert.ok(val?.trim(),locale+' '+key);
  }
 }
});
test('verified hero cut-ins only occur on a valid signed server turn',()=>{
 assert.equal(officialSkillSpotlight(after(),null,team),null);
 assert.equal(officialSkillSpotlight(after(),delta({turn:4}),team),null);
 assert.equal(officialSkillSpotlight(after(),delta({initial:true}),team),null);
 assert.equal(officialSkillSpotlight(after(),delta({damage:'999'}),team),null);
 assert.equal(officialSkillSpotlight(after(),delta({damage:0,received:0,healed:0}),team),null);
 const moment=officialSkillSpotlight(after(),delta(),team);
 assert.equal(moment.heroId,'lyra');assert.equal(moment.kind,'skill');
 assert.equal(moment.damage,85);assert.equal(moment.received,18);
 assert.ok(moment.label.includes('Lyra'));
 assert.equal(officialSkillSpotlight(after(),delta({action:'skill:fake'}),team).heroId,null);
 const shield=officialSkillSpotlight(after(),delta({action:'guard'}),team);
 assert.equal(shield.kind,'guard');
 const heal=officialSkillSpotlight(after(),delta({action:'rally',damage:12,received:0,healed:35}),team);
 assert.equal(heal.kind,'rally');assert.equal(heal.healed,35);
});
test('3D overlay honestly renders one shared health pool for each side and 3 real portraits',()=>{
 const html=cinematicCombatMarkup(after(),team,delta(),'tr');
 assert.match(html,/sf-cinematic-hud/);
 assert.match(html,/232 \/ 300/);
 assert.match(html,/160 \/ 350/);
 assert.match(html,/sf-cinematic-moment kind-skill hero-lyra/);
 assert.match(html,/⚔ −85/);
 assert.match(html,/☄ −18/);
 assert.equal((html.match(/class="sf-cinematic-hero"/g)||[]).length,3);
 assert.equal((html.match(/class="sf-cinematic-meter"/g)||[]).length,2,'No invented per-hero HP');
 assert.doesNotMatch(cinematicCombatMarkup(after(),team,null),/sf-cinematic-moment/);
 assert.doesNotMatch(cinematicCombatMarkup(after(),['unknown','lyra']),/assets\/unknown/);
 assert.match(officialCombatScene({...createState(now),team},after(),delta()),/sf-cinematic-hud/);
});
test('director camera cuts in only following verified consecutive turns, respects reduced motion',()=>{
 const shot=cinematicCameraShot(previous(),after(),now+550);
 assert.ok(shot.distance<69);assert.ok(shot.focus);
 assert.ok(shot.impact>0);
 assert.equal(cinematicCameraShot(null,after(),now+550).distance,69);
 assert.equal(cinematicCameraShot(previous(),after({turn:7}),now+550).distance,69);
 const reduce=cinematicCameraShot(previous(),after(),now+550,{yaw:.3,distance:84},{reducedMotion:true});
 assert.deepEqual(reduce,{yaw:.3,distance:84,impact:0,focus:false});
 assert.equal(cinematicCameraShot(previous(),after(),now+2000).impact,0);
 const flank=cinematicCameraShot(previous(),after({lastAction:'feint'}),now+550);
 assert.ok(flank.yaw>0);
});
test('verified impacts are anchored to the original server turn time, never reset on each frame',()=>{
 const w=officialStrikeWindow(previous(),after(),now+600);
 const effects=officialClashEffects(w,now+600);
 assert.equal(effects.length,2);
 assert.ok(Math.abs(effects[0].t-now/1000)<.0001);
 assert.ok(Math.abs(effects[1].t-now/1000)<.0001);
 const m=fakeMesh(),first=drawOfficialFantasyEffects(m,effects,now/1000+.7,'balanced');
 assert.equal(first,2);assert.ok(m.count>4);
 const end=fakeMesh();
 assert.equal(drawOfficialFantasyEffects(end,effects,now/1000+FX_LIFETIME+.1,'balanced'),0);
 assert.equal(end.count,0);
 assert.equal(officialFxAge(effects[0],NaN),null);
 assert.equal(officialFxAge({t:now/1000},now/1000-.1),null);
});
test('hero spells, guard wards and heals are distinct and never minted by idle',()=>{
 const strike=officialBattleRoom(team,after(),{previous:previous(),now:now+400});
 assert.ok(strike.fx.some(f=>f.type==='spell'&&f.heroId==='lyra'));
 const guard=officialBattleRoom(team,after({lastAction:'guard'}),{previous:previous(),now:now+400});
 assert.ok(guard.fx.some(f=>f.type==='ward'));
 const rally=officialBattleRoom(team,after({lastAction:'rally',playerHp:280}),{previous:previous(),now:now+400});
 assert.ok(rally.fx.some(f=>f.type==='heal'));
 assert.equal(officialBattleRoom(team,after(),{now:now+400}).fx.length,0);
 const types=['spell','ward','heal','flank','slash','impact'];
 for(const type of types){
  const f={x:50,y:30,t:now/1000,team:0,heroId:'eira',type};
  const mesh=fakeMesh();
  assert.equal(drawOfficialFantasyEffects(mesh,[f],now/1000+.6,'balanced'),1,type);
  assert.ok(mesh.count>0);
 }
 const perf=fakeMesh(),high=fakeMesh(),fx=[{x:50,y:30,t:now/1000,team:0,heroId:'lyra',type:'spell'}];
 drawOfficialFantasyEffects(perf,fx,now/1000+.4,'performance');
 drawOfficialFantasyEffects(high,fx,now/1000+.4,'balanced');
 assert.ok(high.count>perf.count,'Mobile uses fewer mesh effects');
});
test('original 3D hero and boss silhouettes are distinctly modeled and quality-scaled',()=>{
 assert.notDeepEqual(characterMaterial('lyra',0),characterMaterial('aldren',0));
 const m=fakeMesh(),p={state:'cast'};
 const h=drawCharacterDetail(m,{heroId:'lyra',team:0,role:'mage'},{x:0,z:0,scale:1.48,shoulder:4,hip:2,time:1,quality:'balanced',poseState:p});
 assert.ok(h>8);
 const b=fakeMesh();
 const boss=drawCharacterDetail(b,{type:'boss',team:1,role:'boss'},{x:0,z:0,scale:2.1,shoulder:5,hip:2,time:1,quality:'balanced',poseState:{}});
 assert.ok(boss>h,'The boss has a crown, wing planes and special silhouette');
 for(const role of ['tank','fighter','ranger','healer','assassin']){
  const mesh=fakeMesh(),pieces=drawCharacterDetail(mesh,{heroId:'aldren',role},{x:0,z:0,scale:1.5,shoulder:4,hip:2,quality:'performance',poseState:{}});
  assert.ok(pieces>2,role);
 }
});
test('asset, quality, controls and canonical backend invariants remain intact',()=>{
 const html=source('./index.html'),css=source('./official-cinematic-v260.css');
 const director=source('./official-3d-director.js'),gl=source('./graphics-3d.js');
 const stage=source('./official-combat-scene.js'),bridge=source('./official-battle-bridge.js');
 const pkg=JSON.parse(source('./package.json'));
 assert.match(pkg.version,/beta\.14$/);
 assert.match(html,/official-cinematic-v260\.css/);
 assert.match(stage,/cinematicCombatMarkup\(mission,team,combatDelta\)/);
 assert.match(director,/cinematicCameraShot\(previous,active,now,camera/);
 assert.match(gl,/drawOfficialFantasyEffects\(mesh,room\?\.fx,time,next\)/);
 assert.match(gl,/drawCharacterDetail\(mesh,item/);
 assert.match(bridge,/officialStrikeWindow\(previous,mission,now\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/@media\(max-width:370px\)/);
 for(const file of ['./official-cinematic-v260.js','./official-3d-camera-shots-v260.js','./graphics-3d-fantasy-v260.js','./graphics-3d-characters-v260.js'])
  assert.doesNotMatch(source(file),/fetch\(|accountProgressRequest|supabase|service_role|localStorage\.setItem|\.rpc\(/i);
});
