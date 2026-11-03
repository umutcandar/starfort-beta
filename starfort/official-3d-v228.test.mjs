import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {officialBattleRoom,officialMissionIdentity,officialBattleDelta,officialBattleOutcome} from './official-battle-bridge.js';
import {officialGraphicsPreference,createOfficialBattleDirector} from './official-3d-director.js';
import {officialCombatScene} from './official-combat-scene.js';
import {accountExpeditionMarkup} from './account-expedition.js';
import * as R from './rules.js';
const time=Date.UTC(2026,10,2,10), team=['aldren','lyra','rovan'];
const mission=(t=0)=>({mode:'story',stage:2,turn:t,startedAt:time,lastTurnAt:time+(t*3100),lastAction:t===0?'Başladı':'skill:lyra',
  power:390,enemyHp:200-t*35,enemyMaxHp:200,playerHp:300-t*24,playerMaxHp:300,cooldowns:{lyra:4},enemyIntent:'crush',tier:0,floor:0});
test('the authenticated 3D bridge maps the exact server mission to the real arena engine room contract',()=>{
 const m=mission(1),before=mission(0),copy=structuredClone(m);
 const room=officialBattleRoom(team,m,{now:m.lastTurnAt+200,previous:before});
 assert.equal(room.id,officialMissionIdentity(m));
 assert.equal(room.source,'authenticated-postgres');
 assert.equal(room.result,'server-only');
 assert.equal(room.players.length,3);assert.equal(room.squads.length,3);
 assert.equal(room.players[1].heroId,'lyra');assert.equal(room.players[1].team,0);
 assert.equal(room.squads[0].team,1);assert.ok(room.players.every(x=>x.hp>0&&x.hp<=x.maxHp));
 assert.equal(room.players[1].action,'cast');
 assert.equal(room.fx.filter(x=>x.team===0).length,1);
 assert.equal(room.fx.filter(x=>x.team===1).length,1);
 assert.deepEqual(m,copy,'graphics cannot mutate the source of truth');
 assert.ok(!('res' in room));assert.ok(!('inventory' in room));assert.ok(!('reward' in room));
 assert.equal(room.turn,1);
});
test('battle graphics retain stable identity across server refresh and stop at mission end',()=>{
 const m=mission(1),again=mission(1),next=mission(2);
 assert.equal(officialMissionIdentity(m),officialMissionIdentity(again));
 assert.equal(officialMissionIdentity(m),officialMissionIdentity(next));
 assert.ok(officialBattleRoom(team,again,{now:again.lastTurnAt+1500}).players.every(p=>p.action==='idle'));
 assert.equal(officialBattleRoom(team,null),null);
 assert.equal(officialBattleDelta(m,again),null);
 assert.equal(officialBattleDelta(m,next).turn,2);
 assert.equal(officialBattleDelta(m,next).damage,35);
 assert.equal(officialBattleDelta(m,next).received,24);
 assert.equal(officialBattleDelta(null,next).initial,true);
 assert.equal(officialBattleOutcome(m,{won:true,stage:2,stars:3,reward:{gold:100}}).source,'server');
 assert.equal(officialBattleOutcome(m,{won:true,stage:3,stars:3}),null,'cannot claim a stage that was not fought');
 assert.deepEqual(officialBattleOutcome(m,{won:false,stage:2,stars:0}).reward,{});
});
test('all official fight types enter the same GPU scene without changing reward rules',()=>{
 for(const mode of ['story','maze','veteran','rift','boss']){
  const x={...mission(),mode},out=officialBattleRoom(team,x,{now:time});
  assert.equal(out.players.length,3);assert.equal(out.squads.length,3);assert.ok(out.id.startsWith('pve:'+mode));
  const markup=officialCombatScene(R.createState(time),x);
  assert.match(markup,/data-official-3d-view/);
  assert.match(markup,/data-official-render-toggle/);
  assert.match(markup,/data-official-render-state/);
  assert.doesNotMatch(markup,/data-claim-reward|data-apply-damage|data-local-win/);
 }
});
test('3D preference is opt-in to local fallback and cannot change server win or currency',()=>{
 const store={v:null,getItem(){return this.v},setItem(_,value){this.v=value}};
 assert.equal(officialGraphicsPreference(store),'3d');
 store.v='2d';assert.equal(officialGraphicsPreference(store),'2d');
 store.v='malformed';assert.equal(officialGraphicsPreference(store),'3d');
 const client=createOfficialBattleDirector({store});
 assert.equal(client.mode(),'sprites');
 assert.equal(client.stats().mode,'sprites');
 client.sync(null);
 client.destroy();
});
test('verified turn damage HUD never displays invented combat numbers from unverified client clicks',()=>{
 const game=R.createState(time);
 const account={
  ...game,heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1,ward_mail:1},
  loadouts:{},team,cleared:[],campaignStars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,mission:mission(1),
  lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},contractClaims:{},titles:[],worldBoss:null,itemUpgrades:{}
 };
 const delta=officialBattleDelta(mission(0),mission(1));
 const html=accountExpeditionMarkup(game,account,time+3300,null,delta);
 assert.match(html,/Sunucu hasarı:/);assert.match(html,/35/);
 assert.match(html,/Alınan hasar:/);assert.match(html,/24/);
 const absent=accountExpeditionMarkup(game,account,time+3300,null,null);
 assert.doesNotMatch(absent,/Sunucu hasarı:/);
});
test('production wires the exact WebGL renderer already used by arena and team matches',()=>{
 const director=readFileSync(new URL('./official-3d-director.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const gl=readFileSync(new URL('./graphics-3d.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 assert.match(director,/import \{createBattleRenderer\} from '\.\/battle-render-adapter\.js'/);
 assert.match(director,/renderMode:'3d'/);
 assert.match(director,/candidate\.mode!=='webgl3d'/);
 assert.match(director,/spot\.append\(canvas\)/,'canvas survives innerHTML updates');
 assert.match(director,/requestAnimationFrame\(frame\)/);
 assert.match(director,/cancelAnimationFrame\(frameId\)/);
 assert.match(gl,/gl\.DEPTH_TEST/);
 assert.match(gl,/rigPose/);
 assert.match(app,/official3D\.sync\(workspaceEl/);
 assert.match(app,/official3D\.toggle\(workspaceEl/);
 assert.match(app,/official3D\.pause\(\)/);
 assert.match(app,/official3D\.destroy\(\)/);
 assert.match(index,/official-3d-v228\.css/);
 assert.match(index,/v2\.38\.0/);
});
