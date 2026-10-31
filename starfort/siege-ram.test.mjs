import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeamRoom,stepTeamRoom} from './team-arena.js';
import {SIEGE,damageSiegeRam,stepSiegeRam} from './siege-rules.js';
import {createBattleMotion} from './battle-motion.js';
const users=Array.from({length:10},(_,i)=>({id:(1000+i).toString(16).padStart(24,'0'),name:`Ram Soldier ${i}`}));
const room=()=>{const r=createTeamRoom(users,5,Date.now(),'siege');
 for(const p of r.players){p.x=p.team?95:4;p.y=p.team?55:5;p.input={x:0,y:0,attack:false};p.burst=false;}
 for(const s of r.squads)s.hp=0;
 return r;
};
test('siege ram starts in attacking territory and never crosses an intact fortress gate',()=>{
 const r=room();assert.equal(r.siege.ram.x,SIEGE.ramStartX);
 assert.equal(r.siege.ram.hp,SIEGE.ramMaxHp);
 for(let i=0;i<200;i++)stepTeamRoom(r,.1);
 assert.equal(r.siege.ram.x,SIEGE.ramStartX);
 assert.equal(r.siege.ram.phase,'waiting');assert.equal(r.siege.gate.hp,SIEGE.maxGateHp);
});
test('ram needs an actual escort and knocks gate with a server cooldown',()=>{
 const r=room();const escort=r.players.find(p=>p.team===0);escort.x=33;escort.y=30;
 for(let i=0;i<45;i++)stepTeamRoom(r,.1);
 assert.equal(r.siege.ram.x,SIEGE.ramStopX);
 assert.equal(r.siege.ram.phase,'ramming');
 assert.equal(r.siege.gate.hp,SIEGE.maxGateHp-SIEGE.ramDamage);
 assert.ok(r.fx.some(e=>e.type==='ram-strike'));
 const hp=r.siege.gate.hp;
 stepTeamRoom(r,.1);assert.equal(r.siege.gate.hp,hp,'no early double attack');
 escort.x=4;escort.y=5;
 for(let i=0;i<35;i++)stepTeamRoom(r,.1);
 assert.equal(r.siege.gate.hp,hp,'ram must stop if abandoned');
});
test('defenders can destroy the escorted ram; attackers cannot sabotage it',()=>{
 const r=room(),attacker=r.players.find(p=>p.team===0),defender=r.players.find(p=>p.team===1);
 const ram=r.siege.ram;
 defender.x=53;defender.y=30;ram.x=43;
 assert.equal(damageSiegeRam(r,attacker,500,100),false);
 assert.equal(damageSiegeRam(r,defender,-5,100),false);
 assert.equal(damageSiegeRam(r,defender,20,4),false);
 assert.equal(damageSiegeRam(r,defender,40,11),true);
 assert.equal(ram.hp,SIEGE.ramMaxHp-40);
 assert.equal(damageSiegeRam(r,defender,500,11),true);
 assert.equal(ram.hp,0);assert.equal(ram.phase,'destroyed');
 assert.ok(ram.respawnAt>=SIEGE.ramRespawn);
 assert.ok(r.fx.some(e=>e.type==='ram-down'));
 assert.equal(damageSiegeRam(r,defender,40,11),false);
});
test('destroyed ram respawns only on server timer, at full HP, not beside gate',()=>{
 const r=room(),ram=r.siege.ram,defender=r.players.find(p=>p.team===1);
 defender.x=53;defender.y=30;ram.x=43;
 damageSiegeRam(r,defender,ram.hp,15);
 defender.x=95;defender.y=55;
 for(let i=0;i<180;i++)stepTeamRoom(r,.1);
 assert.equal(ram.hp,0,'still destroyed until cooldown');
 for(let i=0;i<12;i++)stepTeamRoom(r,.1);
 assert.equal(ram.hp,ram.maxHp);assert.equal(ram.x,SIEGE.ramStartX);
 assert.equal(ram.phase,'waiting');
});
test('after the gate breaks, ram stops ramming and never damages the protected core',()=>{
 const r=room(),ram=r.siege.ram;
 r.siege.gate.hp=0;ram.x=43;const core=r.siege.core.hp;
 for(let i=0;i<55;i++)stepTeamRoom(r,.1);
 assert.equal(ram.phase,'breached');assert.equal(r.siege.core.hp,core);
});
test('ram demolitions trigger cosmetic camera impulse exactly once per event',()=>{
 const r=room(),motion=createBattleMotion();let f=motion.sample(r,10);
 assert.equal(f.shake.x,0);
 r.fx.push({type:'ram-strike',x:50,y:30,team:0,t:1});
 f=motion.sample(r,10.016);assert.deepEqual(f.impactPosition,{x:500,y:300});
 const keep=motion.sample(r,10.34);assert.equal(keep.shake.x,0);
 assert.deepEqual(keep.impactPosition,{x:500,y:300});
});
test('defender hero damages ram through the normal authoritative combat loop',()=>{
 const r=room(),ram=r.siege.ram,defender=r.players.find(p=>p.team===1);
 ram.x=43;defender.x=53;defender.y=30;defender.input.attack=true;
 for(let i=0;i<6;i++)stepTeamRoom(r,.1);
 assert.equal(ram.hp,SIEGE.ramMaxHp-12);
 assert.ok(r.fx.some(e=>e.type==='ram-hit'));
});
test('forged ram damage is not taken from player input, and regular capture matches still work',()=>{
 const r=room();const initial=r.siege.ram.hp;
 const p=r.players.find(p=>p.team===0);
 // Normal players can only submit motion/ability flags, not objective state.
 p.input={x:0,y:0,attack:false,ramDamage:9000};
 stepTeamRoom(r,.1);
 assert.equal(r.siege.ram.hp,initial);
 const flags=createTeamRoom(users.slice(0,4),2,Date.now(),'flags');
 assert.equal(flags.siege,null);
 for(let i=0;i<30;i++)stepTeamRoom(flags,.1);
 assert.equal(flags.variant,'flags');assert.equal(flags.status,'active');
});
