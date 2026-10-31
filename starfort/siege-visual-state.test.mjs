import test from 'node:test';
import assert from 'node:assert/strict';
import {siegeVisualState} from './siege-visual-state.js';
const stage=(hp,ramPhase='advancing')=>({variant:'siege',siege:{gate:{hp,maxHp:900},core:{hp:1000,maxHp:1000},ram:{x:32,y:30,hp:360,maxHp:360,phase:ramPhase}}});
test('Siege stage reflects server owned HP including complete demolition',()=>{
  for(const [hp,expected] of [[900,0],[585,1],[270,2],[0,3]]){
    const scene=siegeVisualState(stage(hp));assert.equal(scene.gateStage,expected);
    assert.equal(scene.objective,hp===0?'core':'gate');
    assert.equal(scene.ramVisible,true,'ram is a live independent prop');
  }
});
test('Ram remains visible when the background illustration is ready',()=>{
  const room=stage(400,'ramming');
  const s=siegeVisualState(room);assert.equal(s.ramActive,true);assert.equal(s.ramPhase,'ramming');
  assert.equal(s.status,'Koçbaşı kapıya saldırıyor');
  room.siege.ram.hp=0;room.siege.ram.phase='destroyed';
  assert.equal(siegeVisualState(room).ramActive,false);
});
test('Invalid inputs are safely bounded, no visual stage outside 0..3',()=>{
  assert.equal(siegeVisualState(null),null);
  const r=stage(Infinity);const s=siegeVisualState(r);
  assert.equal(s.gateFraction,0);assert.equal(s.gateStage,3);
  assert.equal(s.coreFraction,1);
});
