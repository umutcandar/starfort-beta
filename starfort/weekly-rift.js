// Optional endgame: rotating tactical scenario and weekly cosmetic record.
// No paid advantages, lootboxes, streak penalties, or competitive rewards.
const MILLIS_PER_WEEK=7*24*60*60*1000;
export const RIFT_MODIFIERS=Object.freeze([
  {id:'sorcery',name:'Gölge Yağmuru',detail:'Gölge büyücülerinin saldırıları güçlenir; kesme ve kalkan yetenekleri önemlidir.'},
  {id:'iron',name:'Demir Kuşatma',detail:'Ön cephe ve bölge efendisi güçlenir; hedef seçimi önemlidir.'},
  {id:'raid',name:'Gece Baskını',detail:'Akıncılar daha sert vurur; şifa ve siper zamanlaması önemlidir.'},
  {id:'eclipse',name:'Tutulma Nöbeti',detail:'Tüm düşmanlar güçlenir; doğru kahraman dizilimi önem kazanır.'},
]);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function weekIndex(now=Date.now()){
  return Math.floor(Math.max(0,Number.isFinite(now)?now:Date.now())/MILLIS_PER_WEEK);
}
export function riftSchedule(now=Date.now()){
  const week=weekIndex(now);
  return {week,modifier:RIFT_MODIFIERS[week%RIFT_MODIFIERS.length],stageId:[8,7,6,5][week%4]};
}
export function restoreRiftRecords(raw){
  if(!Array.isArray(raw))return [];
  const seen=new Set(),result=[];
  for(const entry of raw.slice(-52)){
    if(!entry||!integer(entry.week,0,99999)||!integer(entry.stageId,1,8)
      ||!RIFT_MODIFIERS.some(m=>m.id===entry.modifier)||seen.has(entry.week))continue;
    seen.add(entry.week);result.push({week:entry.week,stageId:entry.stageId,modifier:entry.modifier});
  }
  return result.slice(-52);
}
export function weeklyRiftStatus(state,now=Date.now()){
  const schedule=riftSchedule(now);
  return {...schedule,unlocked:state.cleared?.length===8,
    done:Boolean(state.riftRecords?.some(entry=>entry.week===schedule.week)),
    total:state.riftRecords?.length||0};
}
export function applyRiftModifier(battle,modifierId){
  if(!RIFT_MODIFIERS.some(m=>m.id===modifierId))return false;
  for(const enemy of battle.enemies){
    let hp=1,attack=1;
    if(modifierId==='sorcery'&&enemy.role==='caster')attack=1.55;
    if(modifierId==='iron')hp=enemy.role==='boss'?1.65:1.35;
    if(modifierId==='raid'&&enemy.role==='raider')attack=1.5;
    if(modifierId==='eclipse'){hp=1.18;attack=1.18;}
    enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*hp);
    enemy.attack=Math.round(enemy.attack*attack);
  }
  return true;
}
