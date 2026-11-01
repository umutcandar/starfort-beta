/** Mobile combat assist: input-only helpers. The simulation (server or in-browser) still owns every hit. */
const len=(x,y)=>Math.hypot(x,y);
/** When the player holds attack/burst with no stick input and the target is out of reach, walk toward it. */
export function assistMove(me,target,axis,{range=15,wantsAction=false}={}){
  const manual=len(axis?.x||0,axis?.y||0)>0.05;
  if(manual||!wantsAction||!me||!target)return {x:axis?.x||0,y:axis?.y||0,assisted:false};
  const dx=target.x-me.x,dy=target.y-me.y,d=len(dx,dy);
  if(!(d>range*0.85))return {x:0,y:0,assisted:false};
  return {x:Math.round(dx/d*1000)/1000,y:Math.round(dy/d*1000)/1000,assisted:true};
}
/** Nearest living enemy of `me` (side/team aware). */
export function nearestEnemy(me,players){
  if(!me||!Array.isArray(players))return null;
  const side=me.team??me.side;let best=null,bd=Infinity;
  for(const p of players){if(!p||p.id===me.id||(p.team??p.side)===side||!(p.hp>0))continue;const d=len(p.x-me.x,p.y-me.y);if(d<bd){bd=d;best=p;}}
  return best;
}
/** HP deltas between two snapshots → floating combat numbers. */
export function hpEvents(prev,next){
  if(!Array.isArray(prev)||!Array.isArray(next))return [];
  const before=new Map(prev.map(p=>[p.id,p.hp]));const out=[];
  for(const p of next){const h=before.get(p.id);if(typeof h==='number'&&typeof p.hp==='number'&&p.hp!==h)out.push({id:p.id,x:p.x,y:p.y,delta:p.hp-h,crit:h-p.hp>=25});}
  return out;
}
/** Honest local practice rewards for bot wins (no real money, no ranking). */
export const PRACTICE_REWARD=Object.freeze({easy:{gold:30,aether:2},normal:{gold:60,aether:4},hard:{gold:100,aether:7}});
export const MODE_MULTIPLIER=Object.freeze({duel:1,team2:1.5,team5:1.5,siege:2});
/** Mirrors the server table in public.sfb_api('reward/claim'); used offline / on the self-hosted Node server. */
export function practiceReward(difficulty,won,firstWinToday=false,mode='duel'){
  if(!won)return {gold:10,aether:0,bonus:false};
  const base=PRACTICE_REWARD[difficulty]||PRACTICE_REWARD.normal,m=MODE_MULTIPLIER[mode]||1;
  const gold=Math.round(base.gold*m),aether=Math.round(base.aether*m);
  return firstWinToday?{gold:gold*2,aether:aether*2,bonus:true}:{gold,aether,bonus:false};
}
export function rewardMode(room){if(!room)return 'duel';if(room.variant==='siege')return 'siege';if(room.teamSize)return room.teamSize<=2?'team2':'team5';return 'duel';}
