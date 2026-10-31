import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickVector,combineMovement,mountJoystick,battlePoint} from './mobile-controls.js';
test('joystick dead-zone prevents idle drift',()=>{assert.deepEqual(joystickVector(3,4),{x:0,y:0});assert.deepEqual(joystickVector(NaN,2),{x:0,y:0});});
test('analog stick supports proportional speed, diagonals, hard limit',()=>{
 assert.equal(joystickVector(54,0).x,1);assert.equal(joystickVector(0,-54).y,-1);
 const v=joystickVector(40,40);assert.ok(v.x>.5 && v.x<.8);assert.equal(v.x,v.y);
 assert.deepEqual(joystickVector(-999,0),{x:-1,y:0});
});
test('keyboard priority and diagonal magnitude clamp',()=>{
 const v=combineMovement(1,1);assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-9);
 assert.equal(combineMovement(1,0,{x:-1,y:0}).x,1);
 assert.deepEqual(combineMovement(0,0,{x:.3,y:-.8}),{x:.3,y:-.8});
});
test('missing joystick gracefully returns neutral input',()=>{
 const joystick=mountJoystick(null);assert.deepEqual(joystick.read(),{x:0,y:0});joystick.reset();joystick.dispose();
});
test('letterboxed landscape canvas maps taps precisely and rejects margins',async()=>{
 const {battlePoint}=await import('./mobile-controls.js');
 const rect={left:0,top:0,width:844,height:390};
 assert.equal(battlePoint(10,100,rect),null);
 const center=battlePoint(422,195,rect);
 assert.ok(Math.abs(center.x-50)<1e-8);assert.ok(Math.abs(center.y-30)<1e-8);
 assert.equal(battlePoint(100,300,{left:0,top:0,width:0,height:0}),null);
});
test('proportional analog input is accepted by the authoritative team server',async()=>{
 const {sanitizeTeamInput}=await import('./team-arena.js');
 const axis=combineMovement(0,0,joystickVector(22,-28));
 const packet=sanitizeTeamInput({seq:12,...axis,attack:false,burst:false,dash:false});
 assert.ok(packet);assert.ok(packet.x>0&&packet.y<0);
 assert.ok(Math.hypot(packet.x,packet.y)<=1);
});

test('mobile cover-fit tap mapping keeps touch coordinates accurate',()=>{
 const rect={left:0,top:0,width:844,height:390};
 const center=battlePoint(422,195,rect,1000,600,'cover');
 assert.ok(center);assert.ok(Math.abs(center.x-50)<.001);assert.ok(Math.abs(center.y-30)<.001);
 const top=battlePoint(422,0,rect,1000,600,'cover');
 assert.ok(top.y>0&&top.y<30);
});
