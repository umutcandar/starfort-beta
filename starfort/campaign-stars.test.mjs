import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {gradeCampaignBattle,restoreCampaignStars,THREE_STAR_LOOT} from './campaign-stars.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const old=()=>R.createState(Date.UTC(2026,9,31,12));
const cleanWin=(state,stageId=1)=>{
  R.startBattle(state,stageId);
  state.battle.enemies.forEach(enemy=>enemy.hp=0);
  R.battleTurn(state,'strike'); // finishBattle runs only after a valid active action
};
test('grading handles perfect, damaged and near-defeat teams',()=>{
 const b={allies:[{hp:100,maxHp:100},{hp:100,maxHp:100},{hp:100,maxHp:100}]};
 assert.equal(gradeCampaignBattle(b),3);
 b.allies[0].hp=30;b.allies[1].hp=70;b.allies[2].hp=75;
 assert.equal(gradeCampaignBattle(b),2);
 b.allies[1].hp=0;assert.equal(gradeCampaignBattle(b),1);
});
test('old saves restore a minimum one star and reject injected grades',()=>{
 assert.deepEqual(restoreCampaignStars({'1':9,'2':3,'8':3},[1,2]),{'1':1,'2':3});
 const save=old();save.cleared=[1,2];delete save.campaignStars;
 assert.deepEqual(R.restoreState(save).campaignStars,{'1':1,'2':1});
});
test('first clear grants stars; replay never duplicates exclusive loot',()=>{
 let s=old();
 cleanWin(s);
 assert.equal(s.battle.status,'won');
 assert.equal(s.battle.stars,3);
 assert.equal(s.campaignStars[1],3);
 assert.equal(s.inventory[THREE_STAR_LOOT[0]],1);
 assert.equal(s.battle.starLoot,THREE_STAR_LOOT[0]);
 s=R.restoreState(copy(s));
 assert.deepEqual(R.restoreState(copy(s)),s);
 cleanWin(s);
 assert.equal(s.inventory[THREE_STAR_LOOT[0]],1);
 assert.equal(s.battle.starLoot,null);
});
test('five unique three-star chapters unlock five different non-forgeable items',()=>{
 const s=old();
 for(let id=1;id<=5;id++){
   cleanWin(s,id);
   assert.equal(s.battle.stars,3);
   assert.equal(s.inventory[THREE_STAR_LOOT[id-1]],1);
 }
 assert.equal(R.campaignStarStatus(s).total,15);
 const before=copy(s);
 assert.equal(R.forgeItem(s,THREE_STAR_LOOT[0]).ok,false);
 assert.deepEqual(s,before);
});
test('set bonuses activate on the same hero and disappear on unequip',()=>{
 const s=old();
 s.inventory.moon_watch=1;
 s.inventory.lunar_charm=1;
 const base=R.equipmentStats(s,'aldren');
 R.equipItem(s,'aldren','moon_watch');
 const single=R.equipmentStats(s,'aldren');
 R.equipItem(s,'aldren','lunar_charm');
 const paired=R.equipmentStats(s,'aldren');
 assert.equal(paired.hp-single.hp,8+25);
 assert.equal(paired.armor-single.armor,2);
 R.unequipItem(s,'aldren','relic');
 assert.deepEqual(R.equipmentStats(s,'aldren'),single);
 assert.deepEqual(base,{attack:0,hp:0,armor:0,healing:0});
});
test('veteran mode cannot farm chapter star ratings or special loot',()=>{
 const s=old();
 cleanWin(s);
 const items=copy(s.inventory);
 const stars=copy(s.campaignStars);
 R.startVeteranBattle(s,1,1);
 s.battle.enemies.forEach(e=>e.hp=0);
 R.battleTurn(s,'strike');
 assert.deepEqual(s.campaignStars,stars);
 assert.deepEqual(s.inventory,items);
 assert.equal(s.battle.stars,0);
});
