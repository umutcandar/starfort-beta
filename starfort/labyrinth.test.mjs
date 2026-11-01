import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';
import {labyrinthLayout,labyrinthStatus,createLabyrinth,restoreLabyrinth,MAZE_FLOORS,requiredStoryChapters} from './labyrinth.js';
const T=Date.UTC(2026,9,31,12);
const clone=x=>JSON.parse(JSON.stringify(x));
function fresh(chapters=1){const s=R.createState(T);s.cleared=Array.from({length:chapters},(_,i)=>i+1);return R.restoreState(s,T);}
function travel(s,target){
 const view=R.labyrinthLayout(s.labyrinth.floor);
 let route=[target];
 const parent=new Map([[s.labyrinth.cell,null]]),q=[s.labyrinth.cell];
 for(let i=0;i<q.length;i++)for(const id of view.cells[q[i]].links)if(!parent.has(id)){parent.set(id,q[i]);q.push(id);}
 if(!parent.has(target))throw Error('disconnected graph');
 while(route[0]!==s.labyrinth.cell)route.unshift(parent.get(route[0]));
 for(const cell of route.slice(1))assert.equal(R.moveLabyrinth(s,cell).ok,true);
}
function winGuardian(s){
 assert.equal(R.startLabyrinthBattle(s).ok,true);
 const stage=s.battle.stageId;
 const items=clone(s.inventory),cleared=clone(s.cleared),stars=clone(s.campaignStars);
 s.battle.enemies.forEach(e=>e.hp=0);s.battle.live=null;
 assert.equal(R.battleTurn(s,'strike').ok,true);
 assert.equal(s.battle.status,'won');
 assert.deepEqual(s.cleared,cleared);
 assert.deepEqual(s.campaignStars,stars);
 assert.deepEqual(s.inventory,items);
 assert.equal(s.battle.labyrinthFloor,s.labyrinth.floor);
 assert.equal(s.battle.stageId,stage);
 return s;
}
test('16 seeded floors always form a valid connected tree with a guardian before exit',()=>{
 assert.equal(MAZE_FLOORS,16);
 for(let floor=1;floor<=16;floor++){
  const m=labyrinthLayout(floor),n=labyrinthLayout(floor);
  assert.deepEqual(m,n);
  assert.equal(m.cells.length,25);
  assert.equal(m.path[0],0);assert.equal(m.path.at(-1),24);
  assert.equal(m.path.at(-2),m.guard);
  assert.equal(m.cells[m.guard].type,'guardian');
  assert.equal(m.cells[24].type,'exit');
  assert.equal(m.cells.reduce((sum,c)=>sum+c.links.length,0),48);
  for(const c of m.cells)for(const link of c.links){
   assert.ok(m.cells[link].links.includes(c.id));
   assert.equal(Math.abs(c.x-m.cells[link].x)+Math.abs(c.y-m.cells[link].y),1);
  }
  assert.equal(requiredStoryChapters(floor),Math.ceil(floor/2));
 }
});
test('story gate, fog and adjacent-only movement prevent skipping',()=>{
 const s=R.createState(T),a=clone(s);
 assert.equal(R.moveLabyrinth(s,24).ok,false);
 assert.deepEqual(s,a);
 s.cleared=[1];
 assert.equal(labyrinthStatus(s).available,true);
 assert.equal(R.moveLabyrinth(s,24).ok,false);
 const before=labyrinthStatus(s),neighbor=before.cells.find(c=>c.reachable);
 assert.equal(R.moveLabyrinth(s,neighbor.id).ok,true);
 assert.equal(s.labyrinth.visited.length,2);
 assert.equal(R.restoreState(clone(s),T).labyrinth.visited.length,2);
});
test('one-time chest and trap rewards cannot be collected by walking back and forth',()=>{
 const s=fresh(1),layout=labyrinthLayout(1);
 const room=layout.cells.find(c=>c.type==='treasure');
 travel(s,room.id);
 const after=clone(s.res),claimed=clone(s.labyrinth.claimed);
 const next=layout.cells[room.id].links[0];
 R.moveLabyrinth(s,next);R.moveLabyrinth(s,room.id);
 assert.deepEqual(s.res,after);
 assert.deepEqual(s.labyrinth.claimed,claimed);
});
test('guardian requires a connected route, survives save/load and does not grant stars',()=>{
 let s=fresh(1);
 const guard=labyrinthLayout(1).guard;
 travel(s,guard);
 assert.equal(labyrinthStatus(s).canFight,true);
 assert.equal(R.startLabyrinthBattle(s).ok,true);
 const enemyHp=s.battle.enemies.map(e=>e.maxHp);
 let loaded=R.restoreState(clone(s),T);
 assert.deepEqual(loaded.battle.enemies.map(e=>e.maxHp),enemyHp);
 loaded.battle.enemies.forEach(e=>e.hp=0);loaded.battle.live=null;
 assert.equal(R.battleTurn(loaded,'strike').ok,true);
 assert.equal(loaded.labyrinth.guardianDefeated,true);
 assert.equal(loaded.battle.rewardApplied,true);
 assert.equal(loaded.battle.stars,0);
 assert.deepEqual(loaded.cleared,[1]);
 assert.deepEqual(loaded.campaignStars,{'1':1});
 assert.equal(R.startLabyrinthBattle(loaded).ok,false);
 travel(loaded,24);
 const gain=clone(loaded.res);
 const done=R.completeLabyrinthFloor(loaded);
 assert.equal(done.ok,true);
 assert.equal(done.floor,1);
 assert.ok(loaded.res.gold>gain.gold);
 assert.equal(loaded.labyrinth.floor,2);
 assert.equal(R.completeLabyrinthFloor(loaded).ok,false);
 assert.deepEqual(R.restoreState(clone(loaded),T),loaded);
});
test('all sixteen floors gradually unlock, milestone item rewards happen once',()=>{
 const s=fresh(8);
 for(let floor=1;floor<=16;floor++){
  assert.equal(s.labyrinth.floor,floor);
  travel(s,labyrinthLayout(floor).guard);
  winGuardian(s);travel(s,24);
  const before=clone(s.inventory);
  const won=R.completeLabyrinthFloor(s);
  assert.equal(won.ok,true);assert.equal(s.labyrinth.cleared,floor);
  if(floor%4===0)assert.ok((s.inventory[won.loot]||0)>(before[won.loot]||0));
  assert.equal(R.completeLabyrinthFloor(s).ok,false);
 }
 assert.equal(s.labyrinth.completed,true);
 assert.equal(R.moveLabyrinth(s,0).ok,false);
 const restored=R.restoreState(clone(s),T);
 assert.equal(restored.labyrinth.completed,true);
});
test('invalid labyrinth saves cannot inject invalid cells or impossible progress',()=>{
 const old=fresh(3);delete old.labyrinth;
 assert.deepEqual(R.restoreState(clone(old),T).labyrinth,createLabyrinth());
 assert.deepEqual(restoreLabyrinth({floor:100,cleared:1}),createLabyrinth());
 assert.deepEqual(restoreLabyrinth({floor:1,cleared:0,cell:24,visited:[0,-5,500],claimed:[-1,500]}),createLabyrinth());
});
