import test from 'node:test';import assert from 'node:assert/strict';
import {battleObjective} from './battle-director.js';
const room={status:'active',variant:'siege',elapsed:20,players:[{id:'me',team:0,hp:100},{id:'enemy',team:1,hp:100}],
 siege:{gate:{hp:900,maxHp:900},core:{hp:1000,maxHp:1000},ram:{hp:300,maxHp:360,phase:'waiting'}},score:[0,100]};
test('Guidance is meaningful for attacker, defender and ram phases',()=>{
 assert.equal(battleObjective(room,'me').key,'rally');
 assert.equal(battleObjective(room,'enemy').key,'stop-ram');
 const advancing=structuredClone(room);advancing.siege.ram.phase='advancing';
 assert.equal(battleObjective(advancing,'me').key,'escort');
 const ramming=structuredClone(room);ramming.siege.ram.phase='ramming';ramming.siege.gate.hp=450;
 assert.equal(battleObjective(ramming,'me').progress,50);
 assert.equal(battleObjective(ramming,'me').key,'break-gate');
 const down=structuredClone(room);down.siege.ram.hp=0;assert.equal(battleObjective(down,'me').key,'ram-down');
 const breached=structuredClone(room);breached.siege.gate.hp=0;breached.siege.core.hp=750;
 assert.equal(battleObjective(breached,'me').key,'breach');
 assert.equal(battleObjective(breached,'me').progress,25);
 assert.equal(battleObjective(breached,'enemy').key,'defend-core');
});
test('Guidance handles flags, respawn and end of match without mutation',()=>{
 const flags={status:'active',variant:'flags',players:room.players,score:[55,33],capture:[0,1]};
 const original=structuredClone(flags);
 assert.equal(battleObjective(flags,'me').key,'second-flag');
 flags.capture=[0,0];assert.equal(battleObjective(flags,'me').key,'hold-flags');
 flags.capture=[null,null];assert.equal(battleObjective(flags,'me').key,'capture');
 flags.players=flags.players.map(p=>({...p}));flags.players[0].hp=0;flags.players[0].respawnAt=35;flags.elapsed=30;
 assert.equal(battleObjective(flags,'me').detail,'5 saniye sonra yeniden savaşa katılacaksın.');
 flags.status='ended';flags.winner=1;assert.equal(battleObjective(flags,'me').title,'MAĞLUBİYET');
 assert.equal(battleObjective(null,'me').key,'waiting');
 assert.equal(battleObjective(original,'me').progress,55);
});
test('Malformed snapshot health cannot produce invalid progress',()=>{
 const s=structuredClone(room);s.siege.gate.maxHp=0;s.siege.gate.hp=Infinity;
 assert.equal(battleObjective(s,'enemy').progress,0);
});
