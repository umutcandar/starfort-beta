/** Starfort v1.4 - server-authoritative team skirmish, volatile development matches.
 * 2v2 or 5v5 human players; two AI-controlled squads per hero.
 * No account economy/loot, no ranking, no public hosting.
 */
import {randomBytes} from './rand-id.js';
import {trainingDifficulty} from './training-difficulty.js';
import {validArenaHero,arenaHeroStyle} from './arena-heroes.js';
import {SIEGE,createSiege,siegeWall,siegeAttack,damageSiegeRam,stepSiegeRam,siegeOutcome} from './siege-rules.js';

export const TEAM_RULES=Object.freeze({width:100,height:60,heroHp:140,speed:16,attackRange:13,attackDamage:12,attackCooldown:.8,burstDamage:22,burstRange:12,burstCooldown:8,dashCooldown:5,respawnSeconds:9,duration:180,targetScore:100});
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const factions=['Şafak Muhafızları','Gece Lejyonu'];
const stand=[{x:50,y:20},{x:50,y:40}];
const orders=new Set(['follow','push','hold','focus']);
export const SQUAD_TARGETS=Object.freeze(['all','guard','archer']);
const makeHero=(user,team,index,now)=>({id:user.id,name:user.name,heroId:validArenaHero(user.heroId),team,x:team?87:13,y:13+index*9,hp:TEAM_RULES.heroHp,maxHp:TEAM_RULES.heroHp,lastSeen:now,lastSeq:-1,attackAt:0,burstAt:0,dashAt:0,respawnAt:0,input:{x:0,y:0,attack:false},burst:false,dash:false,order:'follow',focus:null,orderAt:-1});
const makeSquad=(owner,type,idx)=>({id:owner.id+':'+type,ownerId:owner.id,team:owner.team,type,x:owner.x+(owner.team?3:-3),y:owner.y+(idx?4:-4),hp:type==='guard'?90:60,maxHp:type==='guard'?90:60,attackAt:0,order:'follow',focus:null});
export function createTeamRoom(users,teamSize,now=Date.now(),variant='flags'){
  if(![2,5].includes(teamSize)||users.length!==teamSize*2||!['flags','siege'].includes(variant)||(variant==='siege'&&teamSize!==5))throw Error('Invalid team room');
  const players=users.map((user,i)=>makeHero(user,i%2,Math.floor(i/2),now));
  return {id:randomBytes(9).toString('hex'),mode:variant==='siege'?'Kuşatma 5v5':`${teamSize}v${teamSize}`,variant,siege:variant==='siege'?createSiege():null,teamSize,createdAt:now,status:'active',winner:null,reason:'',elapsed:0,ticks:0,players,squads:players.flatMap(p=>[makeSquad(p,'guard',0),makeSquad(p,'archer',1)]),score:[0,0],capture:[null,null],fx:[]};
}
export function sanitizeTeamInput(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return null;
  const {seq,x,y,attack,burst,dash,order,focus,squad='all'}=data;
  if(!Number.isSafeInteger(seq)||seq<0||seq>1e9||typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1||Math.abs(y)>1||typeof attack!=='boolean'||typeof burst!=='boolean'||typeof dash!=='boolean')return null;
  if(order!==undefined&&!orders.has(order))return null;
  if(!SQUAD_TARGETS.includes(squad)||(squad!=='all'&&order===undefined))return null;
  if(focus!==undefined&&focus!==null&&(typeof focus!=='string'||!(/^[a-f0-9]{1,32}$/.test(focus)||/^bot-[a-f0-9]{18}$/.test(focus))))return null;
  const len=Math.hypot(x,y);return {seq,x:len>1?x/len:x,y:len>1?y/len:y,attack,burst,dash,order,focus,squad};
}
function moveToward(obj,pos,amount){const length=dist(obj,pos);if(length<.01)return;const step=Math.min(amount,length);obj.x=bound(obj.x+(pos.x-obj.x)/length*step,2,98);obj.y=bound(obj.y+(pos.y-obj.y)/length*step,3,57);}
function nearest(origin,targets,range=Infinity){let best=null,bestDist=range;for(const e of targets){if(e.hp<=0||e.team===origin.team)continue;const d=dist(origin,e);if(d<bestDist){best=e;bestDist=d;}}return best;}
export function stepTeamRoom(room,seconds){
  if(room.status!=='active')return room;
  const dt=bound(seconds,0,.1);room.elapsed+=dt;room.ticks++;
  const fx=(type,p,team)=>room.fx.push({type,x:p.x,y:p.y,team,t:room.elapsed});
  const damage=[];
  for(const p of room.players){
    if(p.hp<=0){if(room.elapsed>=p.respawnAt){p.hp=p.maxHp;p.x=p.team?87:13;p.y=30;p.input={x:0,y:0,attack:false};fx('respawn',p,p.team);}else continue;}
    p.x=bound(p.x+p.input.x*TEAM_RULES.speed*arenaHeroStyle(p.heroId).speed*dt,3,97);p.y=bound(p.y+p.input.y*TEAM_RULES.speed*arenaHeroStyle(p.heroId).speed*dt,4,56);siegeWall(room,p);
    if(p.dash&&room.elapsed>=p.dashAt){p.x=bound(p.x+p.input.x*9,3,97);p.y=bound(p.y+p.input.y*9,4,56);p.dashAt=room.elapsed+TEAM_RULES.dashCooldown;siegeWall(room,p);fx('dash',p,p.team);}p.dash=false;
    const enemies=room.players.filter(e=>e.team!==p.team&&e.hp>0);
    if(p.burst&&room.elapsed>=p.burstAt){p.burstAt=room.elapsed+TEAM_RULES.burstCooldown;fx('burst',p,p.team);
      const style=arenaHeroStyle(p.heroId),burstDamage=Math.round(TEAM_RULES.burstDamage*style.burst),burstRange=TEAM_RULES.burstRange*style.burstRange;
      if(style.heal)p.hp=Math.min(p.maxHp,p.hp+style.heal);for(const e of [...enemies,...room.squads.filter(s=>s.team!==p.team&&s.hp>0)])if(dist(p,e)<=burstRange)damage.push({target:e,amount:burstDamage});siegeAttack(room,p,burstDamage,burstRange);damageSiegeRam(room,p,burstDamage,burstRange);}p.burst=false;
    if(p.input.attack&&room.elapsed>=p.attackAt){
      const style=arenaHeroStyle(p.heroId),strike=Math.round(TEAM_RULES.attackDamage*style.damage),reach=TEAM_RULES.attackRange*style.range;
      if(siegeAttack(room,p,strike,reach)){p.attackAt=room.elapsed+TEAM_RULES.attackCooldown;}
      else {const victim=nearest(p,enemies,reach)||nearest(p,room.squads,reach);if(victim){damage.push({target:victim,amount:strike});p.attackAt=room.elapsed+TEAM_RULES.attackCooldown;fx('attack',victim,p.team);}else if(damageSiegeRam(room,p,strike,reach)){p.attackAt=room.elapsed+TEAM_RULES.attackCooldown;}}
    }
  }
  for(const s of room.squads){
    if(s.hp<=0)continue;
    const owner=room.players.find(p=>p.id===s.ownerId);
    if(!owner)continue;
    const opposing=[...room.players,...room.squads].filter(e=>e.team!==s.team&&e.hp>0);
    const currentOrder=s.order??owner.order;
    const selectedFocus=('focus' in s)?s.focus:owner.focus;
    const target=selectedFocus?opposing.find(e=>e.id===selectedFocus):null;
    const enemy=target||nearest(s,opposing,s.type==='archer'?20:18);
    let destination;
    if(currentOrder==='push')destination={x:s.team?25:75,y:owner.y};
    else if(currentOrder==='hold')destination={x:s.team?78:22,y:s.type==='archer'?40:20};
    else if(currentOrder==='focus'&&target)destination=target;
    else destination={x:owner.x+(s.team?4:-4),y:owner.y+(s.type==='archer'?5:-5)};
    if(enemy&&currentOrder!=='hold'&&dist(s,enemy)>(s.type==='archer'?15:5))destination=currentOrder==='push'?destination:enemy;
    if(room.variant==='siege'&&s.team===0&&currentOrder==='push')destination=room.siege.gate.hp>0?room.siege.gate:room.siege.core;
    moveToward(s,destination,(s.type==='guard'?11:13)*dt);siegeWall(room,s);
    const range=s.type==='archer'?18:6;
    const victim=enemy&&dist(s,enemy)<=range?enemy:nearest(s,opposing,range);
    if(room.elapsed>=s.attackAt){
      if(siegeAttack(room,s,s.type==='archer'?8:10,s.type==='archer'?SIEGE.archerRange:SIEGE.guardRange))s.attackAt=room.elapsed+(s.type==='archer'?1.25:1);
      else if(victim){s.attackAt=room.elapsed+(s.type==='archer'?1.25:1.0);damage.push({target:victim,amount:s.type==='archer'?8:10});if(room.ticks%3===0)fx('squad-attack',victim,s.team);}else if(damageSiegeRam(room,s,s.type==='archer'?8:10,range)){s.attackAt=room.elapsed+(s.type==='archer'?1.25:1.0);}
    }
  }
  for(const hit of damage){if(hit.target.hp<=0)continue;hit.target.hp=Math.max(0,hit.target.hp-hit.amount);if(hit.target.hp===0){if('respawnAt'in hit.target){hit.target.respawnAt=room.elapsed+TEAM_RULES.respawnSeconds;room.score[1-hit.target.team]+=3;fx('ko',hit.target,1-hit.target.team);}else{room.score[1-hit.target.team]++;fx('ko',hit.target,1-hit.target.team);}}}
  // Capture a beacon by having uncontested living heroes in its circle.
  if(room.variant!=='siege')stand.forEach((point,i)=>{let a=0,b=0;for(const p of room.players){if(p.hp>0&&dist(p,point)<=11){if(p.team===0)a++;else b++;}}
    if(a&&!b){room.capture[i]=0;room.score[0]+=dt*(2+a*.6);}else if(b&&!a){room.capture[i]=1;room.score[1]+=dt*(2+b*.6);}else if(a&&b){room.capture[i]=null;}
  });
  if(room.variant==='siege'){stepSiegeRam(room,dt);siegeOutcome(room);}
  else if(room.score.some(s=>s>=TEAM_RULES.targetScore)||room.elapsed>=TEAM_RULES.duration){room.status='ended';room.reason=room.elapsed>=TEAM_RULES.duration?'time':'objectives';room.winner=room.score[0]===room.score[1]?null:room.score[0]>room.score[1]?0:1;}
  room.fx=room.fx.filter(e=>room.elapsed-e.t<.7).slice(-36);
  return room;
}

/** Deterministic-enough server side training AI: no remote account or session is created. */
export function teamBotInput(room,bot,difficulty='normal'){
  const enemies=room.players.filter(p=>p.team!==bot.team&&p.hp>0);
  const target=enemies.sort((a,b)=>dist(bot,a)-dist(bot,b))[0];
  const d=target?dist(bot,target):Infinity;
  let goal;
  if(target&&d<20)goal=target;
  else if(room.variant==='siege')goal=bot.team===0?(room.siege.gate.hp>0?room.siege.gate:room.siege.core):{x:73,y:30};
  else goal=room.elapsed%16<8?stand[0]:stand[1];
  let dx=goal.x-bot.x,dy=goal.y-bot.y;
  const len=Math.hypot(dx,dy);
  const mode=trainingDifficulty(difficulty)||'normal';
  const move=len>5?Math.min(mode==='easy'?.55:mode==='hard'?1.0:.80,len/12):0;
  const attack=(d<TEAM_RULES.attackRange||room.variant==='siege')&&(mode!=='easy'||room.elapsed%2.2<1.3);
  return {x:len?dx/len*move:0,y:len?dy/len*move:0,
    attack,
    burst:mode!=='easy'&&d<TEAM_RULES.burstRange&&room.elapsed>=bot.burstAt,
    dash:mode!=='easy'&&len>(mode==='hard'?15:22)&&len<44&&room.elapsed>=bot.dashAt,
    order:room.variant==='siege'&&bot.team===0?'push':d<19?'focus':'push'};
}

export function createTeamService({now=()=>Date.now()}={}){
  const queues=new Map([[2,[]],[5,[]],['siege',[]]]),partyQueues=new Map([[2,[]],[5,[]],['siege',[]]]),entries=new Map(),rooms=new Map(),names=new Map(),heroChoices=new Map(),seen=new Map();
  const removeParty=(party)=>{const list=partyQueues.get(party.key);const at=list.indexOf(party);if(at>=0)list.splice(at,1);for(const id of party.ids){const e=entries.get(id);if(e?.type==='party-waiting'&&e.partyId===party.guildId)entries.delete(id);names.delete(id);seen.delete(id);}};
  const cleanupWait=()=>{for(const [mode,q] of queues){for(let i=q.length-1;i>=0;i--)if(now()-(seen.get(q[i])||0)>20000){entries.delete(q[i]);names.delete(q[i]);seen.delete(q[i]);q.splice(i,1);}}
    // Every guild member must keep the arena open while awaiting an opponent.
    for(const [,list] of partyQueues)for(const party of [...list])if(party.ids.some(id=>now()-(seen.get(id)||0)>45000))removeParty(party);
  };
  function result(user){const entry=entries.get(user.id);if(!entry)return {status:'idle'};
    if(entry.type==='waiting'){seen.set(user.id,now());return {status:'waiting',mode:entry.key==='siege'?'Kuşatma 5v5':`${entry.size}v${entry.size}`,waiting:queues.get(entry.key??entry.size).length,required:entry.size*2};}
    if(entry.type==='party-waiting'){seen.set(user.id,now());return {status:'waiting',party:true,mode:entry.key==='siege'?'Kuşatma 5v5':`${entry.size}v${entry.size}`,waiting:partyQueues.get(entry.key??entry.size).length*entry.size,required:entry.size*2};}
    const room=rooms.get(entry.roomId);if(!room){entries.delete(user.id);return {status:'idle'};}
    if(room.status==='active'){const me=room.players.find(p=>p.id===user.id);if(me&&me.lastSeen!==-Infinity)me.lastSeen=now();}
    return {status:room.status==='active'?'active':'ended',you:user.id,inputSeq:room.players.find(p=>p.id===user.id)?.lastSeq??-1,room:{id:room.id,mode:room.mode,variant:room.variant,isPractice:room.isPractice===true,botDifficulty:room.isPractice?room.botDifficulty||'normal':null,siege:room.siege,teamSize:room.teamSize,elapsed:room.elapsed,ticks:room.ticks,status:room.status,winner:room.winner,reason:room.reason,teams:factions,guilds:room.guilds||null,score:room.score.map(x=>Math.round(x)),capture:room.capture,players:room.players.map(p=>({id:p.id,name:p.name,heroId:p.heroId,isBot:p.isBot===true,team:p.team,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,order:p.order,focus:p.focus,burstReady:Math.max(0,p.burstAt-room.elapsed),dashReady:Math.max(0,p.dashAt-room.elapsed),respawnReady:p.hp===0?Math.max(0,p.respawnAt-room.elapsed):0})),squads:room.squads.map(s=>({id:s.id,ownerId:s.ownerId,team:s.team,type:s.type,x:s.x,y:s.y,hp:s.hp,maxHp:s.maxHp,order:s.order??'follow',focus:s.focus??null})),fx:room.fx}};
  }
  function queue(user,body){if(entries.has(user.id))return [200,result(user)];cleanupWait();const size=body?.size;const variant=body?.variant??'flags';
    if(!['flags','siege'].includes(variant))return [400,{error:'Geçersiz savaş türü.'}];
    if(variant==='siege'&&size!==5)return [400,{error:'Kuşatma için 5v5 formatını seç.'}];
    if(size!==2&&size!==5)return [400,{error:'2v2 veya 5v5 formatı seç.'}];
    if(rooms.size>=32)return [503,{error:'Bu test sunucusunun maç kapasitesi dolu.'}];
    const key=variant==='siege'?'siege':size;const q=queues.get(key);if(q.length>=size*2)return [503,{error:'Eşleşme kuyruğu dolu.'}];
    q.push(user.id);names.set(user.id,user.name);heroChoices.set(user.id,validArenaHero(body.heroId));seen.set(user.id,now());entries.set(user.id,{type:'waiting',size,key});
    if(q.length===size*2){const ids=q.splice(0,size*2);const room=createTeamRoom(ids.map(id=>({id,name:names.get(id),heroId:heroChoices.get(id)})),size,now(),variant);rooms.set(room.id,room);ids.forEach(id=>{entries.set(id,{type:'room',roomId:room.id});seen.delete(id)});}
    return [200,result(user)];
  }
  function queueBot(user,body){
    const size=body?.size,variant=body?.variant??'flags',difficulty=trainingDifficulty(body?.difficulty??'normal');
    if(!difficulty)return [400,{error:'Geçersiz bot zorluk seviyesi.'}];
    if(![2,5].includes(size)||!['flags','siege'].includes(variant)||(variant==='siege'&&size!==5))return [400,{error:'Bot antrenmanı 2v2, 5v5 veya 5v5 kuşatma olmalı.'}];
    const entry=entries.get(user.id);
    if(entry?.type==='room'&&rooms.get(entry.roomId)?.status==='active')return [200,result(user)];
    if(entry?.type==='party-waiting')return [409,{error:'Önce klan eşleşmesinden çık.'}];
    if(entry?.type==='waiting'){
      const q=queues.get(entry.key??entry.size);const index=q.indexOf(user.id);if(index>=0)q.splice(index,1);
    }
    entries.delete(user.id);names.delete(user.id);seen.delete(user.id);
    if(rooms.size>=32)return [503,{error:'Antrenman sunucusu kapasitesi dolu.'}];
    const roster=[{...user,heroId:validArenaHero(body.heroId)}];
    for(let i=1;i<size*2;i++)roster.push({id:'bot-'+randomBytes(9).toString('hex'),name:['Kızıl Muhafız','Kule Bekçisi','Demir Okçu','Ay Şövalyesi','Gölge Komutan'][(i-1)%5]+' '+i});
    const room=createTeamRoom(roster,size,now(),variant);
    room.isPractice=true;room.botDifficulty=difficulty;
    for(const p of room.players){if(p.id!==user.id){p.isBot=true;p.lastSeen=now();}}
    rooms.set(room.id,room);entries.set(user.id,{type:'room',roomId:room.id});
    return [200,result(user)];
  }
  /** Atomic, guild-authorized full-party queue. The server supplies members after ready checks. */
  function queueParty(members,size,guildId,guildName,variant='flags'){
    cleanupWait();
    if(![2,5].includes(size)||!['flags','siege'].includes(variant)||(variant==='siege'&&size!==5))return [400,{error:'Klan takımı 2v2, 5v5 veya Kuşatma 5v5 olmalı.'}];
    if(!Array.isArray(members)||members.length!==size||new Set(members.map(u=>u.id)).size!==size||members.some(u=>!/^[a-f0-9]{24}$/.test(u.id)||typeof u.name!=='string'))return [400,{error:'Eksik veya geçersiz klan kadrosu.'}];
    if(!/^[a-f0-9]{24}$/.test(guildId)||typeof guildName!=='string')return [400,{error:'Klan bilgisi geçersiz.'}];
    if(members.some(u=>entries.has(u.id)))return [409,{error:'Kadroda başka bir eşleşmeye katılmış oyuncu var.'}];
    if(rooms.size>=32)return [503,{error:'Test sunucusunun maç kapasitesi dolu.'}];
    const key=variant==='siege'?'siege':size;const q=partyQueues.get(key);
    if(q.length>=2)return [503,{error:'Klan eşleşme kuyruğu dolu.'}];
    const group={size,key,guildId,guildName,ids:members.map(u=>u.id)};
    q.push(group);
    for(const u of members){names.set(u.id,u.name);seen.set(u.id,now());entries.set(u.id,{type:'party-waiting',size,key,partyId:guildId});}
    if(q.length===2){
      const [alpha,beta]=q.splice(0,2);
      // Alternating roster is deliberate: createTeamRoom assigns i%2 to teams.
      const ids=alpha.ids.flatMap((id,i)=>[id,beta.ids[i]]);
      const room=createTeamRoom(ids.map(id=>({id,name:names.get(id),heroId:heroChoices.get(id)})),size,now(),variant);
      room.guilds=[alpha.guildName,beta.guildName];
      rooms.set(room.id,room);
      ids.forEach(id=>{entries.set(id,{type:'room',roomId:room.id});seen.delete(id)});
    }
    return [200,result(members[0])];
  }
  function leave(user){const entry=entries.get(user.id);if(entry?.type==='party-waiting'){const group=partyQueues.get(entry.key??entry.size).find(g=>g.guildId===entry.partyId);if(group)removeParty(group);return {status:'idle'};}if(entry?.type==='waiting'){const q=queues.get(entry.key??entry.size);const index=q.indexOf(user.id);if(index!==-1)q.splice(index,1);}
    else if(entry?.type==='room'){const room=rooms.get(entry.roomId);if(room?.isPractice){room.status='ended';room.reason='forfeit';rooms.delete(room.id);}else if(room?.status==='active'){const p=room.players.find(p=>p.id===user.id);if(p){p.hp=0;p.respawnAt=Infinity;p.lastSeen=-Infinity;p.input={x:0,y:0,attack:false};p.order='hold';for(const s of room.squads.filter(s=>s.ownerId===p.id))s.hp=0;const remaining=room.players.filter(other=>other.team===p.team&&other.id!==p.id&&other.lastSeen!==-Infinity);if(!remaining.length){room.status='ended';room.winner=1-p.team;room.reason='forfeit';}}}}
    entries.delete(user.id);names.delete(user.id);seen.delete(user.id);return {status:'idle'};
  }
  function input(user,data){const entry=entries.get(user.id);if(entry?.type!=='room')return [409,{error:'Aktif takım maçı bulunamadı.'}];const room=rooms.get(entry.roomId);if(!room||room.status!=='active')return [200,result(user)];const v=sanitizeTeamInput(data);if(!v)return [400,{error:'Geçersiz takım hareketi.'}];const p=room.players.find(p=>p.id===user.id);if(!p)return [403,{error:'Bu takım maçında değilsin.'}];
    if(v.seq>p.lastSeq){p.lastSeq=v.seq;p.input={x:v.x,y:v.y,attack:v.attack};p.burst ||=v.burst;p.dash ||=v.dash;p.lastSeen=now();if(v.order&&room.elapsed-p.orderAt>=.45){
        p.orderAt=room.elapsed;
        const targeted=room.squads.filter(s=>s.ownerId===p.id&&(v.squad==='all'||s.type===v.squad));
        for(const s of targeted){s.order=v.order;s.focus=v.focus||null;}
        if(v.squad==='all'){p.order=v.order;p.focus=v.focus||null;}
      }}
    return [200,result(user)];
  }
  function tick(dt){cleanupWait();for(const room of rooms.values()){if(room.status!=='active')continue;
    for(const p of room.players){if(!p.isBot||p.hp<=0)continue;
      p.lastSeen=now();const ai=teamBotInput(room,p,room.botDifficulty);
      p.input={x:ai.x,y:ai.y,attack:ai.attack};p.burst ||=ai.burst;p.dash ||=ai.dash;p.order=ai.order;for(const s of room.squads)if(s.ownerId===p.id){s.order=ai.order;s.focus=null;}
    }
    for(const p of room.players)if(p.lastSeen!==-Infinity&&now()-p.lastSeen>60000){p.hp=0;p.respawnAt=Infinity;p.lastSeen=-Infinity;room.squads.filter(s=>s.ownerId===p.id).forEach(s=>s.hp=0);}
    const aliveTeams=[0,1].map(team=>room.players.some(p=>p.team===team&&p.lastSeen!==-Infinity));if(!aliveTeams[0]||!aliveTeams[1]){room.status='ended';room.winner=aliveTeams[0]?0:aliveTeams[1]?1:null;room.reason='disconnect';}else stepTeamRoom(room,dt);
  }}
  function prune(){for(const [id,room] of rooms)if(room.status==='ended'&&now()-room.createdAt>300000){rooms.delete(id);for(const p of room.players){const entry=entries.get(p.id);if(entry?.roomId===id)entries.delete(p.id);}}}
  return {rooms,entries,queue,queueBot,queueParty,leave,input,result,tick,prune};
}
