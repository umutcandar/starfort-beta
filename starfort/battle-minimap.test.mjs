import test from 'node:test';import assert from 'node:assert/strict';
import {minimapMarkers} from './battle-minimap.js';
const room={variant:'siege',siege:{gate:{x:50,y:30,hp:900},core:{x:78,y:30,hp:1000},ram:{x:31,y:30,hp:300}},players:[{id:'a',team:0,x:12,y:11,hp:100},{id:'b',team:1,x:90,y:30,hp:100}],squads:[{id:'one',team:0,x:17,y:9,hp:35}]};
test('Server-sourced minimap shows self, enemy, troops and live siege objectives',()=>{
 const markers=minimapMarkers(room,'a');
 assert.equal(markers.filter(m=>m.type==='you').length,1);
 for(const type of ['enemy','squad','ram','gate','core'])assert.ok(markers.some(m=>m.type===type),type);
});
test('Dead entities and breached gate vanish; coordinates are bounded',()=>{
 const copy=structuredClone(room);copy.siege.gate.hp=0;copy.siege.ram.hp=0;copy.players[1].hp=0;copy.players[0].x=400;
 const markers=minimapMarkers(copy,'a');
 assert.equal(markers.some(m=>m.type==='gate'||m.type==='ram'||m.type==='enemy'),false);
 assert.equal(markers.find(m=>m.type==='you').x,100);
 assert.deepEqual(minimapMarkers(null,'a'),[]);
});
test('Flags use live capture ownership and dead squads are excluded',()=>{
 const flags={variant:'flags',players:room.players,capture:[0,1],squads:[{id:'dead',hp:0,x:10,y:10}]};
 assert.deepEqual(minimapMarkers(flags,'a').filter(m=>m.type==='flag').map(m=>m.side),[0,1]);
 assert.equal(minimapMarkers(flags,'a').some(m=>m.type==='squad'),false);
});
