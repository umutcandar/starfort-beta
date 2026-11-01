import {seasonEvent} from './season-campaign.js';
/** STARFORT original single-player maze. Separate from campaign stars, PvP and currency server. */
export const MAZE_FLOORS=16;
export const MAZE_WIDTH=5;
const MAX_RESOURCE=1e9;
const MILESTONE_GEAR=Object.freeze({4:'ward_mail',8:'star_lens',12:'royal_blade',16:'moonheart'});
const validCell=id=>Number.isInteger(id)&&id>=0&&id<25;
const validFloor=floor=>Number.isInteger(floor)&&floor>=1&&floor<=MAZE_FLOORS;
const clampResources=(state,reward)=>{
  for(const [key,amount] of Object.entries(reward)){
    state.res[key]=Math.min(MAX_RESOURCE,Math.max(0,(state.res[key]||0)+amount));
  }
};
const fail=error=>({ok:false,error});
const ZONES=Object.freeze([
  {name:'Kül Merdivenleri',hint:'Yıldız Vadisi altındaki unutulmuş kül ocakları'},
  {name:'Kayıp Kökler',hint:'Karaorman köklerine bağlanan karanlık galeriler'},
  {name:'Ayaz Taşlığı',hint:'Donmuş mühürler ve kuzey muhafızları'},
  {name:'Yıldızın Kalbi',hint:'Kırık çekirdeğin saklandığı son mahzenler'},
]);
export function createLabyrinth(){
  return {floor:1,cleared:0,cell:0,visited:[0],claimed:[],guardianDefeated:false,completed:false};
}
export function requiredStoryChapters(floor){
  return validFloor(floor)?Math.ceil(floor/2):Infinity;
}
export function restoreLabyrinth(saved){
  const state=createLabyrinth();
  if(!saved||typeof saved!=='object')return state;
  const cleared=Number.isInteger(saved.cleared)&&saved.cleared>=0&&saved.cleared<=MAZE_FLOORS?saved.cleared:0;
  const floor=Math.min(MAZE_FLOORS,cleared+1);
  if(saved.floor!==floor)return state;
  state.cleared=cleared;state.floor=floor;
  state.completed=cleared===MAZE_FLOORS;
  const layout=labyrinthLayout(floor);
  const visited=Array.isArray(saved.visited)?saved.visited.filter(validCell):[];
  state.visited=[...new Set([0,...visited])].slice(0,25);
  const cell=validCell(saved.cell)?saved.cell:0;
  state.cell=state.visited.includes(cell)?cell:0;
  state.claimed=Array.isArray(saved.claimed)?
    [...new Set(saved.claimed.filter(validCell).filter(id=>['treasure','fountain','trap'].includes(layout.cells[id].type)))].slice(0,25):[];
  state.guardianDefeated=saved.guardianDefeated===true && state.visited.includes(layout.guard);
  return state;
}
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function neighbors(id){
  const x=id%5,y=Math.floor(id/5),a=[];
  if(x>0)a.push(id-1);if(x<4)a.push(id+1);
  if(y>0)a.push(id-5);if(y<4)a.push(id+5);
  return a;
}
/** Seeded depth-first spanning tree: there is exactly one route to the exit. */
export function labyrinthLayout(floor){
  if(!validFloor(floor))throw new Error('Geçersiz labirent katı.');
  const random=rng(0x51af21 ^ Math.imul(floor,7771));
  const links=Array.from({length:25},()=>[]);
  const seen=new Set([0]),stack=[0];
  while(stack.length){
    const current=stack.at(-1),options=neighbors(current).filter(x=>!seen.has(x));
    if(!options.length){stack.pop();continue;}
    const next=options[Math.floor(random()*options.length)];
    links[current].push(next);links[next].push(current);seen.add(next);stack.push(next);
  }
  // Route from entrance to the far southeast exit through the spanning tree.
  const parent=new Map([[0,-1]]),queue=[0];
  for(let i=0;i<queue.length;i++){
    for(const next of links[queue[i]])if(!parent.has(next)){parent.set(next,queue[i]);queue.push(next);}
  }
  const path=[24];while(path[0]!==0)path.unshift(parent.get(path[0]));
  const guard=path[path.length-2];
  const candidates=Array.from({length:25},(_,i)=>i).filter(id=>id!==0&&id!==24&&id!==guard);
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  const chests=new Set(candidates.slice(0,3)),springs=new Set(candidates.slice(3,5)),traps=new Set(candidates.slice(5,7));
  const cells=links.map((adj,id)=>({
    id,x:id%5,y:Math.floor(id/5),links:[...adj].sort((a,b)=>a-b),
    type:id===0?'entrance':id===24?'exit':id===guard?'guardian':
      chests.has(id)?'treasure':springs.has(id)?'fountain':traps.has(id)?'trap':'passage',
  }));
  return {floor,guard,path,cells,zone:ZONES[Math.floor((floor-1)/4)]};
}
export function labyrinthStatus(state){
  const maze=state.labyrinth||createLabyrinth(),layout=labyrinthLayout(maze.floor);
  const available=(state.cleared?.length||0)>=requiredStoryChapters(maze.floor);
  const current=layout.cells[maze.cell];
  const visible=new Set(maze.visited);
  for(const id of current.links)visible.add(id);
  return {...layout,available,completed:maze.completed,cleared:maze.cleared,position:maze.cell,
    requiredChapters:requiredStoryChapters(maze.floor),guardianDefeated:maze.guardianDefeated,
    canFight:available&&!maze.completed&&maze.cell===layout.guard&&!maze.guardianDefeated,
    canFinish:available&&!maze.completed&&maze.cell===24&&maze.guardianDefeated,
    cells:layout.cells.map(c=>({...c,visited:maze.visited.includes(c.id),visible:visible.has(c.id),
      claimed:maze.claimed.includes(c.id),current:c.id===maze.cell,
      reachable:available&&!maze.completed&&current.links.includes(c.id)&&! (state.battle?.status==='active')})),
  };
}
export function moveLabyrinth(state,id){
  const maze=state.labyrinth,view=labyrinthStatus(state);
  if(!maze||!view.available)return fail(`Labirentin bu katı için ${view.requiredChapters} hikâye bölümü tamamla.`);
  if(maze.completed)return fail('Yıldızaltı Labirenti tamamlandı.');
  if(state.battle?.status==='active')return fail('Önce devam eden savaşı bitir.');
  if(!validCell(id)||!view.cells[id].reachable)return fail('Yalnızca bağlı koridorlardan ilerleyebilirsin.');
  maze.cell=id;
  if(!maze.visited.includes(id))maze.visited.push(id);
  const room=view.cells[id];
  let event='';
  if(!maze.claimed.includes(id)){
    if(room.type==='treasure'){
      const reward={gold:45+maze.floor*17,wood:18+maze.floor*6};
      clampResources(state,reward);maze.claimed.push(id);event='Gölgeli sandık bulundu! Altın ve kereste kazanıldı.';
    } else if(room.type==='fountain'){
      const reward={aether:4+Math.floor(maze.floor/2),stone:12+maze.floor*5};
      clampResources(state,reward);maze.claimed.push(id);event='Yıldız pınarı keşfedildi! Yıldız özü ve taş kazanıldı.';
    } else if(room.type==='trap'){
      const loss=Math.min(state.res.gold||0,Math.round(14+maze.floor*4));
      state.res.gold-=loss;maze.claimed.push(id);event=`Kadim tuzak tetiklendi: ${loss} altın kaybedildi.`;
    }
  }
  if(room.type==='guardian'&&!maze.guardianDefeated)event='Kat muhafızı yolu kapatıyor. Savaşmadan portala geçemezsin.';
  if(room.type==='exit'&&!maze.guardianDefeated)event='Portal mühürlü. Önce kat muhafızını yen.';
  if(room.type==='exit'&&maze.guardianDefeated)event='Yıldız kapısı açıldı. Sonraki kata geçebilirsin.';
  return {ok:true,event};
}
export function finishLabyrinthGuardian(state,floor){
  const maze=state.labyrinth,layout=maze&&validFloor(maze.floor)?labyrinthLayout(maze.floor):null;
  if(!layout||floor!==maze.floor||maze.cell!==layout.guard||maze.guardianDefeated)return false;
  maze.guardianDefeated=true;
  return true;
}
export function completeLabyrinthFloor(state){
  const view=labyrinthStatus(state),maze=state.labyrinth;
  if(state.battle?.status==='active')return fail('Önce savaşı bitir.');
  if(!view.canFinish)return fail('Önce çıkışa ulaş ve kat muhafızını yen.');
  if(maze.cleared>=maze.floor)return fail('Bu katın ödülü daha önce alındı.');
  const floor=maze.floor;
  const reward={gold:85+floor*32,stone:28+floor*10,aether:7+floor*3};
  clampResources(state,reward);
  const loot=MILESTONE_GEAR[floor]||null;
  if(loot && (state.inventory[loot]||0)<20) state.inventory[loot]=(state.inventory[loot]||0)+1;
  maze.cleared=floor;
  maze.completed=floor===MAZE_FLOORS;
  if(!maze.completed){
    maze.floor=floor+1;maze.cell=0;maze.visited=[0];maze.claimed=[];maze.guardianDefeated=false;
  }
  if(state.battle?.labyrinthFloor===floor)state.battle=null;
  return {ok:true,reward,loot,finished:maze.completed,floor};
}
