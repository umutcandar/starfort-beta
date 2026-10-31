import test from 'node:test';import assert from 'node:assert/strict';
import {createTeamRoom,stepTeamRoom} from './team-arena.js';
test('long-running 5v5 with 20 squads remains bounded and finishes',()=>{
 const room=createTeamRoom(Array.from({length:10},(_,i)=>({id:(i+1).toString(16).padStart(24,'0'),name:'Stress '+i})),5,0);
 for(let tick=0;tick<4000&&room.status==='active';tick++){
  for(const [i,p] of room.players.entries()){p.input={x:tick%40<20?(p.team===0?1:-1):0,y:Math.sin(tick*.06+i),attack:true};if(tick%90===0){p.burst=true;p.dash=true;}p.order=['follow','push','hold','focus'][Math.floor(tick/75+i)%4];}
  stepTeamRoom(room,.05);
  assert.ok(room.fx.length<=36);assert.ok(room.squads.length===20);
  assert.ok(room.score.every(Number.isFinite));assert.ok(room.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.hp)));
 }
 assert.equal(room.status,'ended');assert.ok(room.elapsed<=180.1);assert.ok(['time','objectives'].includes(room.reason));
});
