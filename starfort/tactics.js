/** Standalone deterministic command-training arena. No rewards / no multiplayer claims. */
export const FIELD={width:100,height:60};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const towards=(actor,target,speed,dt)=>{
  const d=distance(actor,target);if(d<.01)return;
  const k=Math.min(1,speed*dt/d);actor.x+=k*(target.x-actor.x);actor.y+=k*(target.y-actor.y);
};
const ally=(id,name,x,y,type,hp,attack)=>({id,name,x,y,type,hp,maxHp:hp,attack,cooldown:0,order:'follow',point:{x,y},kills:0});
const foe=(id,name,x,y,hp,attack,type='raider')=>({id,name,x,y,hp,maxHp:hp,attack,type,cooldown:0});
const alive=units=>units.filter(u=>u.hp>0);
export function createTraining(seed=1){
  const hero={id:'hero',name:'Aldren',x:19,y:31,hp:240,maxHp:240,attack:25,cooldown:0,dashUntil:0,skillUntil:0,rallyUntil:0,moveTo:null};
  return {seed,hero,squads:[ally('vanguard','Öncü',14,25,'guard',200,15),ally('archers','Okçular',11,33,'archer',125,18),ally('mages','Büyücüler',14,41,'mage',105,22)],
    enemies:[foe('raider1','Akıncı',69,20,180,12),foe('raider2','Akıncı',73,38,180,12),foe('caster','Gölgeli büyücü',82,30,150,15,'caster')],
    gate:{id:'gate',name:'Kale Kapısı',x:91,y:30,hp:800,maxHp:800,attack:0,type:'gate',cooldown:0},
    elapsed:0,selected:0,score:0,status:'active',abilityUses:0,orderCount:0,effects:[],event:'Kapıya ilerlemek için birliklerine emir ver.',waveStarted:false};
}
export function setHeroDestination(g,x,y){
  if(g.status!=='active'||!Number.isFinite(x)||!Number.isFinite(y))return false;
  g.hero.moveTo={x:clamp(x,2,98),y:clamp(y,2,58)};return true;
}
export function orderSquad(g,index,order,x,y){
  if(g.status!=='active'||!Number.isInteger(index)||index<0||index>=g.squads.length||!['follow','advance','hold','focus'].includes(order))return false;
  const unit=g.squads[index];if(unit.hp<=0)return false;
  if(order==='advance'&&(!Number.isFinite(x)||!Number.isFinite(y)))return false;
  unit.order=order;
  if(order==='advance') {
    unit.point={x:clamp(x,2,98),y:clamp(y,2,58)};
  } else if(order==='hold')unit.point={x:unit.x,y:unit.y};
  g.selected=index;g.orderCount++;g.event=`${unit.name}: ${ {follow:'Kahramanı takip et',advance:'İlerle',hold:'Mevzini koru',focus:'Hedefe odaklan'}[order]}`;
  return true;
}
function applyHit(g,source,target,damage){
  if(target.hp<=0)return;
  const dealt=Math.min(target.hp,Math.round(damage));target.hp=Math.max(0,target.hp-dealt);
  if(target.hp===0&&source.kills!==undefined)source.kills++;
  g.effects.push({x:target.x,y:target.y,amount:dealt,side:source.id==='hero'||g.squads.includes(source)?'ally':'enemy',age:0});
}
export function heroAbility(g,kind){
  if(g.status!=='active')return false;
  const h=g.hero,t=g.elapsed;
  if(kind==='dash'&&t>=h.dashUntil){h.dashUntil=t+4;const target=h.moveTo||{x:h.x+10,y:h.y};towards(h,target,22,.55);h.x=clamp(h.x,2,98);h.y=clamp(h.y,2,58);g.event='Kahraman ileri atıldı.';g.abilityUses++;return true;}
  if(kind==='burst'&&t>=h.skillUntil){h.skillUntil=t+8;let hits=0;for(const e of alive([...g.enemies,g.gate]))if(distance(h,e)<=16){applyHit(g,h,e,65);hits++;}g.event=hits?`Yıldız darbesi: ${hits} hedef vuruldu.`:'Yıldız darbesi isabet etmedi.';g.abilityUses++;return true;}
  if(kind==='rally'&&t>=h.rallyUntil){h.rallyUntil=t+12;for(const s of alive(g.squads))if(distance(h,s)<=27)s.hp=Math.min(s.maxHp,s.hp+28);g.event='Savaş narası: yakındaki birlikler iyileşti.';g.abilityUses++;return true;}
  return false;
}
function strike(g,unit,target,dt,range=7,period=1,bonus=0){
  unit.cooldown-=dt;
  if(target&&distance(unit,target)<=range&&unit.cooldown<=0){applyHit(g,unit,target,unit.attack+bonus);unit.cooldown=period;}
}
export function stepTraining(g,dt,move={x:0,y:0}){
  if(g.status!=='active')return g;
  if(!Number.isFinite(dt)||dt<=0)return g;
  dt=clamp(dt,0,.1);
  g.elapsed+=dt;
  const h=g.hero;
  const mx=clamp(Number(move.x)||0,-1,1),my=clamp(Number(move.y)||0,-1,1);const len=Math.hypot(mx,my);
  if(len>.01){h.x+=mx/len*18*dt;h.y+=my/len*18*dt;h.moveTo=null;}
  else if(h.moveTo){towards(h,h.moveTo,16,dt);if(distance(h,h.moveTo)<.4)h.moveTo=null;}
  h.x=clamp(h.x,2,98);h.y=clamp(h.y,2,58);
  const targets=alive([...g.enemies,g.gate]);
  const closest=(unit,arr)=>[...arr].sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
  for(const s of alive(g.squads)) {
    const enemy=closest(s,targets);
    let goal=s.order==='follow'?{x:h.x-6,y:h.y+(g.squads.indexOf(s)-1)*7}:s.point;
    if(s.order==='focus')goal=enemy||goal;
    if(s.order==='advance'&&enemy&&distance(s,enemy)<14)goal=enemy;
    if(s.order==='hold'&&enemy&&distance(s,enemy)<9)goal=s.point;
    const pace=s.type==='guard'?10:12;
    if(goal&&distance(s,goal)> (s.order==='focus'?5:2))towards(s,goal,pace,dt);
    // Focused units target nearby enemy, but ranged squads keep their tactical reach.
    const range=s.type==='guard'?6: s.type==='archer'?21:17;
    if(enemy&&distance(s,enemy)<=range)strike(g,s,enemy,dt,range,s.type==='guard'?1.1:1.5);
  }
  const nearby=closest(h,targets);
  if(nearby)strike(g,h,nearby,dt,8,.8);
  for(const e of alive(g.enemies)) {
    const goals=alive([h,...g.squads]);const victim=closest(e,goals);
    if(!victim)break;
    if(distance(e,victim)> (e.type==='caster'?13:5))towards(e,victim,e.type==='caster'?6:7,dt);
    strike(g,e,victim,dt,e.type==='caster'?14:6,e.type==='caster'?1.6:1.2);
  }
  // Prevent fast objective wins: the fortress spawns a final defensive wave when gate is exposed.
  if(g.gate.hp<=0&&!g.waveStarted){g.waveStarted=true;g.event='Kapı yıkıldı! Son muhafızlar saldırıyor.';
    g.enemies.push(foe('captain','Gölge Komutanı',94,30,350,20,'boss'));
  }
  const contest=alive(g.enemies).some(e=>distance(e,{x:91,y:30})<15);
  const atGate=alive([h,...g.squads]).some(u=>distance(u,{x:91,y:30})<13);
  if(g.gate.hp<=0&&atGate&&!contest)g.score=clamp(g.score+dt*19,0,100);
  if(g.gate.hp<=0&&contest)g.score=clamp(g.score-dt*5,0,100);
  if(g.score>=100){g.status='won';g.event='Zafer! Kale ele geçirildi.';}
  else if(h.hp<=0||alive(g.squads).length===0||g.elapsed>=180){g.status='lost';g.event='Birliklerin geri çekildi. Tatbikat sona erdi.';}
  g.effects=g.effects.filter(e=>e.age<.85);for(const effect of g.effects)effect.age+=dt;
  return g;
}
