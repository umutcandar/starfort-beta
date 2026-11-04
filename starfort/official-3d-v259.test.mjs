import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {officialBattleRoom,officialMissionIdentity} from './official-battle-bridge.js';
import {OFFICIAL_CLASH_MS,acceptedOfficialTurn,officialStrikeWindow,officialBattleFormation,officialClashEffects} from './official-3d-choreography-v259.js';
import {CAMERA_DEFAULT,orbitCamera,zoomCamera} from './official-3d-camera-v259.js';
import {drawOfficial3DBattlefield,officialBattlefieldProfile} from './graphics-3d-battlefield-v259.js';
import {rigPose} from './graphics-3d-rig.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const now=Date.UTC(2026,10,4,16,0,0);
const mission=(delta={})=>({mode:'story',stage:1,startedAt:now-60_000,lastTurnAt:now,turn:2,wave:1,waves:3,
 power:350,playerHp:230,playerMaxHp:290,enemyHp:135,enemyMaxHp:180,enemyIntent:'strike',
 lastAction:'strike',cooldowns:{},...delta});
const previous=()=>mission({turn:1,playerHp:244,enemyHp:190,lastTurnAt:now-3400});

test('only an accepted same-mission, consecutive server turn can move the 3D figures',()=>{
 const m=mission(),prev=previous();
 assert.equal(acceptedOfficialTurn(prev,m),true);
 assert.equal(acceptedOfficialTurn(null,m),false);
 assert.equal(acceptedOfficialTurn(m,m),false);
 assert.equal(acceptedOfficialTurn({...prev,startedAt:1},m),false);
 assert.equal(acceptedOfficialTurn({...prev,stage:2},m),false);
 assert.equal(acceptedOfficialTurn({...prev,mode:'act2'},m),false);
 assert.equal(acceptedOfficialTurn({...prev,turn:0},m),false);
 assert.equal(officialStrikeWindow(prev,m,now+100)?.enemyHit,55);
 assert.equal(officialStrikeWindow(prev,m,now+100)?.playerHit,14);
 assert.equal(officialStrikeWindow(prev,m,now+OFFICIAL_CLASH_MS+1),null);
 assert.equal(officialStrikeWindow(prev,m,now-1),null);
 assert.equal(officialStrikeWindow(prev,m,Infinity),null);
});
test('heroes truly approach, shield up, flank and cast; those are harmless 3D coordinates',()=>{
 const ids=['aldren','lyra','rovan'],foes=['raider','boss','caster'];
 const attack=officialStrikeWindow(previous(),mission(),now+700);
 const form=officialBattleFormation(ids,foes,attack);
 const still=officialBattleFormation(ids,foes);
 assert.ok(form.actors[0].x>still.actors[0].x+5,'frontline soldier advances for a verified strike');
 assert.ok(form.foes[1].x<still.foes[1].x,'enemy approaches for a verified response');
 assert.equal(form.actors[0].action,'attack');
 assert.equal(form.actors[1].role,'mage');
 const shield=officialBattleFormation(ids,foes,{...attack,action:'guard'});
 assert.equal(shield.actors[0].action,'guard');
 assert.ok(shield.actors[0].x < form.actors[0].x);
 const flank=officialBattleFormation(ids,foes,{...attack,action:'feint'});
 assert.notEqual(flank.actors[0].y,still.actors[0].y);
 const lyra=officialBattleFormation(ids,foes,{...attack,action:'skill:lyra',heroId:'lyra'});
 assert.equal(lyra.actors[1].action,'cast');
 assert.ok(lyra.actors[1].x>still.actors[1].x);
 const combo=officialBattleFormation(ids,foes,{...attack,action:'reinforce'});
 assert.equal(combo.active,false);
 assert.ok(form.actors.every(x=>x.team===0&&Number.isFinite(x.x)&&Number.isFinite(x.y)));
});
test('3D projectile impacts require actual server HP deltas, never idle or mock clicks',()=>{
 const m=mission(),prev=previous();
 const room=officialBattleRoom(['aldren','lyra','rovan'],m,{previous:prev,now:now+600});
 assert.equal(room.source,'authenticated-postgres');
 assert.equal(room.variant,'official');
 assert.equal(room.squads.length,3);
 assert.equal(room.players.length,3);
 assert.equal(room.fx.length,2,'verified enemy and ally HP changes');
 assert.equal(room.fx[0].type,'slash');
 assert.equal(room.fx[1].type,'impact');
 assert.deepEqual(officialClashEffects(null),[]);
 assert.equal(officialBattleRoom(['aldren','lyra'],m,{now:now+600}).fx.length,0);
 assert.equal(officialBattleRoom(['aldren','lyra'],m,{previous:prev,now:now+2200}).fx.length,0);
 const damageOnly=officialBattleRoom(['aldren'],mission({playerHp:244}),{previous:prev,now:now+500});
 assert.equal(damageOnly.fx.length,1);
 const noDamage=officialBattleRoom(['aldren'],mission({playerHp:244,enemyHp:190}),{previous:prev,now:now+500});
 assert.equal(noDamage.fx.length,0);
 const wave=officialStrikeWindow(previous(),mission({wave:2,lastAction:'Dalga 2 başladı',enemyHp:220}),now+500);
 assert.equal(wave.action,'reinforce');
 assert.equal(officialClashEffects(wave).length,0,'a new wave never plays an invented killing blow');
});
test('camera follows bounded player rotation and pinch/wheel zoom without changing battle RPCs',()=>{
 assert.deepEqual(CAMERA_DEFAULT,{yaw:0,distance:69});
 assert.equal(orbitCamera(CAMERA_DEFAULT,9999).yaw,.85);
 assert.equal(orbitCamera(CAMERA_DEFAULT,-9999).yaw,-.85);
 assert.equal(zoomCamera(CAMERA_DEFAULT,-9999).distance,50);
 assert.equal(zoomCamera(CAMERA_DEFAULT,9999).distance,94.5);
 assert.equal(zoomCamera({yaw:.4,distance:95},200).distance,95);
 assert.equal(orbitCamera(CAMERA_DEFAULT,NaN).yaw,0);
 assert.ok(zoomCamera(CAMERA_DEFAULT,Infinity).distance>=50);
});
test('all eight campaign regions have actual repeatable 3D environmental geometry',()=>{
 const counts=[];
 const mesh=()=>({shapes:0,box(){this.shapes++},ground(){this.shapes++},prism(){this.shapes++},pyramid(){this.shapes++}});
 for(let stage=1;stage<=8;stage++){
  const m=mesh();
  const profile=drawOfficial3DBattlefield(m,stage,'balanced');
  assert.ok(profile.stone.length===3);
  assert.ok(m.shapes>40,'each battlefield contains floor geometry, vegetation or ruins');
  counts.push(m.shapes);
  assert.equal(officialBattlefieldProfile(stage).mood,profile.mood);
 }
 assert.equal(new Set(Array.from({length:8},(_,i)=>officialBattlefieldProfile(i+1).mood)).size,8);
 const perf=mesh(),ultra=mesh();
 drawOfficial3DBattlefield(perf,3,'performance');
 drawOfficial3DBattlefield(ultra,3,'ultra');
 assert.ok(perf.shapes<ultra.shapes,'mobile gets fewer GPU draw primitives');
});
test('procedural rig supports real raised shield, attack, cast and hit poses',()=>{
 assert.equal(rigPose({action:'guard'},1).state,'guard');
 assert.equal(rigPose({action:'attack',attackPhase:.5},1).state,'attack');
 assert.ok(rigPose({action:'attack',attackPhase:.5},1).swordSwing>.9);
 assert.equal(rigPose({action:'cast',castPhase:.5},1).state,'cast');
 assert.equal(rigPose({hit:1},1).state,'hit');
});
test('release uses real 3D renderer, no reward or combat calculation in cinematic code',()=>{
 const bridge=source('./official-battle-bridge.js'),director=source('./official-3d-director.js');
 const renderer=source('./graphics-3d.js'),css=source('./official-3d-v259.css');
 const index=source('./index.html'),pkg=JSON.parse(source('./package.json'));
 assert.match(bridge,/officialStrikeWindow\(previous,mission,now\)/);
 assert.match(bridge,/variant:'official'/);
 assert.match(director,/cameraMode:'cinematic'/);
 assert.match(director,/pointermove/);
 assert.match(renderer,/drawOfficial3DBattlefield\(scenery,room\.stage\|\|1,next\)/);
 assert.match(renderer,/role==='ranger'/);
 assert.match(renderer,/role==='tank'/);
 assert.match(renderer,/cameraYaw/);
 assert.match(css,/touch-action:pan-y/);
 assert.match(css,/max-width:420px/);
 assert.match(index,/official-3d-v259\.css/);
 assert.match(pkg.version,/^2\.(?:47|48|49|50)\.0-beta\.(?:1[3-9]|[2-9]\d+)$/,'beta.13 graphics must remain supported by later releases');
 for(const file of ['./official-3d-choreography-v259.js','./official-3d-camera-v259.js','./graphics-3d-battlefield-v259.js']){
  assert.doesNotMatch(source(file),/fetch\(|supabase|auth\.uid|localStorage|reward\(|accountProgressRequest|service_role/i);
 }
});
