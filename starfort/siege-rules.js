/** Server-owned 5v5 siege objectives and escorted ram. Visuals never award damage. */
export const SIEGE=Object.freeze({
  gateX:50,gateY:30,coreX:78,coreY:30,maxGateHp:900,maxCoreHp:1000,
  heroRange:12,archerRange:18,guardRange:7,duration:180,
  ramStartX:22,ramStopX:43,ramY:30,ramMaxHp:360,ramEscortRange:19,
  ramSpeed:5.5,ramDamage:36,ramCooldown:2.4,ramRespawn:19
});
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createSiege(){return {
  gate:{x:SIEGE.gateX,y:SIEGE.gateY,hp:SIEGE.maxGateHp,maxHp:SIEGE.maxGateHp},
  core:{x:SIEGE.coreX,y:SIEGE.coreY,hp:SIEGE.maxCoreHp,maxHp:SIEGE.maxCoreHp},
  ram:{id:'siege-ram',team:0,x:SIEGE.ramStartX,y:SIEGE.ramY,hp:SIEGE.ramMaxHp,maxHp:SIEGE.ramMaxHp,attackAt:0,respawnAt:0,phase:'waiting'}
};}
export function siegeWall(room,unit){
  if(room.variant!=='siege'||room.siege.gate.hp<=0)return;
  if(unit.team===0)unit.x=Math.min(unit.x,SIEGE.gateX-3);
  else unit.x=Math.max(unit.x,SIEGE.gateX+3);
}
export function siegeAttack(room,unit,damage,range){
  if(room.variant!=='siege'||room.status!=='active'||unit.team!==0||unit.hp<=0)return false;
  const object=room.siege.gate.hp>0?room.siege.gate:room.siege.core;
  if(d(unit,object)>range)return false;
  object.hp=Math.max(0,object.hp-damage);
  room.fx.push({type:object===room.siege.gate?'gate-hit':'core-hit',x:object.x,y:object.y,team:0,t:room.elapsed});
  if(object.hp===0)room.fx.push({type:object===room.siege.gate?'gate-down':'core-down',x:object.x,y:object.y,team:0,t:room.elapsed});
  return true;
}
/** Defenders can counter the ram. The attacker cannot destroy their own ram. */
export function damageSiegeRam(room,unit,damage,range){
  if(room.variant!=='siege'||room.status!=='active'||unit.team!==1||unit.hp<=0||room.siege.gate.hp<=0)return false;
  const ram=room.siege.ram;
  if(!ram||ram.hp<=0||!Number.isFinite(damage)||damage<=0||d(unit,ram)>range)return false;
  ram.hp=Math.max(0,ram.hp-damage);
  room.fx.push({type:'ram-hit',x:ram.x,y:ram.y,team:1,t:room.elapsed});
  if(ram.hp===0){ram.phase='destroyed';ram.respawnAt=room.elapsed+SIEGE.ramRespawn;
    room.fx.push({type:'ram-down',x:ram.x,y:ram.y,team:1,t:room.elapsed});}
  return true;
}
/** One server tick, called only by the authoritative room simulation. */
export function stepSiegeRam(room,dt){
  if(room.variant!=='siege'||room.status!=='active')return;
  const {gate,ram}=room.siege;
  if(gate.hp<=0){ram.phase='breached';return;}
  if(ram.hp<=0){
    if(room.elapsed<ram.respawnAt)return;
    Object.assign(ram,{x:SIEGE.ramStartX,y:SIEGE.ramY,hp:SIEGE.ramMaxHp,attackAt:room.elapsed+1.5,phase:'waiting'});
    room.fx.push({type:'ram-return',x:ram.x,y:ram.y,team:0,t:room.elapsed});
  }
  // The ram only moves / attacks while a living attacking hero escorts it.
  const escorted=room.players.some(p=>p.team===0&&p.hp>0&&d(p,ram)<=SIEGE.ramEscortRange);
  if(!escorted){ram.phase='waiting';return;}
  if(ram.x<SIEGE.ramStopX){ram.x=Math.min(SIEGE.ramStopX,ram.x+Math.max(0,Math.min(.1,dt))*SIEGE.ramSpeed);ram.phase='advancing';return;}
  ram.phase='ramming';
  if(room.elapsed>=ram.attackAt){
    ram.attackAt=room.elapsed+SIEGE.ramCooldown;
    if(siegeAttack(room,ram,SIEGE.ramDamage,9))room.fx.push({type:'ram-strike',x:gate.x,y:gate.y,team:0,t:room.elapsed});
  }
}
export function siegeOutcome(room){
  if(room.variant!=='siege')return;
  const s=room.siege;
  const score=Math.round(45*(1-s.gate.hp/s.gate.maxHp)+55*(1-s.core.hp/s.core.maxHp));
  room.score=[score,100-score];
  if(s.core.hp<=0){room.status='ended';room.winner=0;room.reason='siege-victory';}
  else if(room.elapsed>=SIEGE.duration){room.status='ended';room.winner=1;room.reason='siege-defense';}
}
