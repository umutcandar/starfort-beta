import test from 'node:test';import assert from 'node:assert/strict';
import {createTraining,stepTraining,orderSquad,heroAbility} from './tactics.js';
test('150 simulated command battles finish or stay in valid state without runaway values',()=>{
 let battles=0;
 for(let seed=1;seed<=150;seed++){
   const g=createTraining(seed);
   for(let i=0;i<3300&&g.status==='active';i++){
     if(i%200===0)for(let k=0;k<3;k++)orderSquad(g,k,'advance',83+7*Math.cos(seed+k),30+10*Math.sin(seed+k));
     if(i%90===0)heroAbility(g,seed%2?'burst':'rally');
     const d=i%500<200?{x:1,y:0}:{x:0,y:0};
     stepTraining(g,.05,d);
     for(const u of [g.hero,...g.squads,...g.enemies,g.gate]){
       assert.ok(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp,`hp broken seed ${seed}`);
       assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.x<=100&&u.y>=0&&u.y<=60,`position broken seed ${seed}`);
     }
   }
   assert.ok(['won','lost'].includes(g.status));battles++;
 }
 assert.equal(battles,150);
});
