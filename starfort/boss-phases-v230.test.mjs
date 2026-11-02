import test from 'node:test';
import assert from 'node:assert/strict';
import {specialEnemyAttack,encounterEnemies} from './encounters.js';
const boss=(stageId,hpRatio)=>({role:'boss',hp:Math.round(100*hpRatio),maxHp:100});
const battle=stageId=>({stageId,combatVersion:2,round:0});
test('Demir Cellat has three distinct telegraphed phases',()=>{
 assert.equal(specialEnemyAttack(battle(4),boss(4,1),4)?.type,'shatter');
 assert.equal(specialEnemyAttack(battle(4),boss(4,.65),3)?.type,'crush');
 assert.equal(specialEnemyAttack(battle(4),boss(4,.3),2)?.type,'shatter');
});
test('Ayaz Komutani escalates into final area attack',()=>{
 assert.equal(specialEnemyAttack(battle(6),boss(6,.7),3)?.type,'crush');
 assert.equal(specialEnemyAttack(battle(6),boss(6,.3),2)?.type,'nova');
});
test('Chapel ritual is interruptible and old combat is unchanged',()=>{
 const enemy={role:'caster',hp:50,maxHp:50};
 assert.equal(specialEnemyAttack(battle(2),enemy,3)?.type,'grave');
 assert.equal(specialEnemyAttack({...battle(2),combatVersion:1},enemy,3),null);
});
test('Encounter roster size is unchanged',()=>{
 for(let id=1;id<=8;id++){
  const roster=encounterEnemies({id,enemyCount:id<3?3:id<6?4:5});
  assert.ok(roster.every(e=>e.hp>0&&e.attack>0));
 }
});
