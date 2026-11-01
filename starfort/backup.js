import {restoreState,STORAGE_KEY,BUILDINGS,RESOURCES} from './rules.js';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=()=>{throw new Error('Yedek dosyası hasarlı veya tutarsız. Mevcut köy korunuyor.');};
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
function validateSavedState(saved){
  if(!object(saved)||saved.version!==1||!object(saved.res)||!object(saved.buildings)||!object(saved.heroes)
    ||!Array.isArray(saved.team)||saved.team.length!==3||new Set(saved.team).size!==3)fail();
  for(const id of Object.keys(RESOURCES))
    if(typeof saved.res[id]!=='number'||!Number.isFinite(saved.res[id])||saved.res[id]<0||saved.res[id]>1e9)fail();
  for(const b of BUILDINGS)if(!integer(saved.buildings[b.id],1,b.maxLevel))fail();
  if(!Array.isArray(saved.cleared)||saved.cleared.some((x,i)=>x!==i+1)||saved.cleared.length>8)fail();
  if(saved.team.some(id=>typeof id!=='string'||!object(saved.heroes[id])))fail();
  for(const hero of Object.values(saved.heroes))
    if(!object(hero)||!integer(hero.level,1,20))fail();
  for(const field of ['campaignStars','contracts','season','inventory','loadouts','labyrinth','veteranMedals'])
    if(saved[field]!==undefined&&!object(saved[field]))fail();
  if(saved.season!==undefined){
    const season=saved.season;
    if(!integer(season.id,1,1000000)||!object(season.progress)
      ||!Array.isArray(season.claimed)||!Array.isArray(season.legacy)
      ||season.claimed.some(x=>typeof x!=='string')||season.legacy.some(x=>typeof x!=='string'))fail();
    for(const count of Object.values(season.progress))if(!integer(count,0,10000))fail();
  }
  if(saved.contracts!==undefined){
    const c=saved.contracts;
    if(typeof c.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(c.day)
      ||!object(c.progress)||!object(c.claimed)||!integer(c.totalClaims,0,100000))fail();
  }
  if(saved.battle!==undefined&&saved.battle!==null){
    if(!object(saved.battle)||!integer(saved.battle.stageId,1,8)
      ||!['active','won','lost'].includes(saved.battle.status)
      ||!Array.isArray(saved.battle.allies)||!Array.isArray(saved.battle.enemies))fail();
  }
  if(saved.labyrinth!==undefined){
    const m=saved.labyrinth;
    if(!integer(m.floor,1,16)||!integer(m.cleared,0,16)
      ||!Array.isArray(m.visited)||!Array.isArray(m.claimed))fail();
  }
}
export function exportSave(state,now=new Date()){
  return JSON.stringify({format:'starfort-save',exportedAt:now.toISOString(),key:STORAGE_KEY,state},null,2);
}
export function importSave(content){
  if(typeof content!=='string'||content.length>2_000_000)throw new Error('Kayıt dosyası boyutu geçersiz.');
  let data;try{data=JSON.parse(content)}catch{throw new Error('Kayıt dosyası JSON değil.')}
  if(data?.format!=='starfort-save'||data.key!==STORAGE_KEY||data.state?.version!==1)
    throw new Error('Bu dosya Starfort kayıt yedeği değil.');
  validateSavedState(data.state);
  const restored=restoreState(data.state);
  // restoreState deliberately defaults malformed older autosaves. A manually
  // imported backup MUST fail instead of silently replacing a built-up village.
  if(!restored||!Array.isArray(restored.team)||restored.team.join('|')!==data.state.team.join('|')
    ||restored.cleared.join('|')!==data.state.cleared.join('|'))fail();
  for(const id of Object.keys(RESOURCES))if(restored.res[id]!==data.state.res[id])fail();
  for(const b of BUILDINGS)if(restored.buildings[b.id]!==data.state.buildings[b.id])fail();
  if(data.state.battle?.status==='active' && (!restored.battle || restored.battle.stageId!==data.state.battle.stageId || restored.battle.status!=='active'))fail();
  for(const [id,hero] of Object.entries(data.state.heroes))
    if(restored.heroes[id] && restored.heroes[id].level!==hero.level)fail();
  return restored;
}
