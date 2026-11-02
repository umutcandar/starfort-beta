/** Deterministic balance shadow model of the authoritative Act II SQL.
 * Used by automated design regression tests; it does NOT grant rewards or replace the RPC. */
export const requiredActTwoPower=stage=>Math.ceil((1000+stage*150)*.7);
export const recommendedActTwoPower=stage=>1000+stage*150;
export function actTwoEnemyMaxHp(stage,wave,power){
 if(!Number.isInteger(stage)||stage<1||stage>8||![1,2,3].includes(wave)||!Number.isFinite(power)||power<=0)throw Error('Invalid balance model');
 const difficulty=1.5+stage*.12, capped=Math.min(power,recommendedActTwoPower(stage)*1.25);
 const base=(110+stage*45)*difficulty;
 return Math.round(Math.max(base*[1,1.25,1.50][wave-1],capped*[1.20,1.55,1.90][wave-1]));
}
export function simulateActTwoBattle({stage,power,policy='tactical'}={}){
 const maxTurns=36,maxHp=Math.round(130+power*.6);
 let playerHp=maxHp,wave=1,turn=0,intent='strike',enemyHp=actTwoEnemyMaxHp(stage,1,power),enemyMaxHp=enemyHp;
 const nextReady={lyra:1,rovan:1};
 const history=[];
 while(turn<maxTurns&&playerHp>0){
  turn++;
  let move='strike';
  if(policy==='tactical'){
   if(intent==='crush')move='guard';
   else if(intent==='shield'&&nextReady.lyra<=turn)move='skill:lyra';
   else if(intent==='drain'&&nextReady.rovan<=turn)move='skill:rovan';
   else if(nextReady.lyra<=turn)move='skill:lyra';
  }
  let damage=Math.max(12,Math.round(power/5*(move==='guard'?.68:1)));
  let enemyDamage=Math.max(5,Math.round((18+stage*9)*(move==='guard'?.35:1)));
  if(move.startsWith('skill:')){
   const hero=move.slice(6);nextReady[hero]=turn+3;
   damage=Math.max(12,Math.round(damage*(hero==='lyra'?1.75:1.55)));
   if(hero==='rovan'&&enemyHp<enemyMaxHp*.5)damage=Math.round(damage*1.25);
  }
  if(intent==='crush')enemyDamage=Math.max(1,Math.round(enemyDamage*(move==='guard'?.22:1.7)));
  else if(intent==='shield'){
   enemyDamage=Math.max(1,Math.round(enemyDamage*.5));
   if(!move.startsWith('skill:'))damage=Math.max(1,Math.round(damage*.55));
  }else if(intent==='drain')enemyDamage=Math.max(1,Math.round(enemyDamage*.8));
  if(wave===3){
   if(enemyHp<=enemyMaxHp*.33)enemyDamage=Math.max(1,Math.round(enemyDamage*1.27));
   else if(enemyHp<=enemyMaxHp*.67&&intent==='shield'&&!move.startsWith('skill:'))damage=Math.max(1,Math.round(damage*.82));
   if(stage===1&&intent==='crush'&&move!=='guard')enemyDamage=Math.round(enemyDamage*1.22);
   if(stage===2&&intent==='shield'&&!move.startsWith('skill:'))enemyDamage+=Math.round(damage*.18);
   if(stage===3&&intent==='shield'&&!move.startsWith('skill:'))damage=Math.max(1,Math.round(damage*.58));
   if(stage===4&&intent==='strike'&&move!=='guard')enemyDamage+=Math.round(damage*.17);
   if(stage===5&&intent==='drain')enemyDamage=Math.round(enemyDamage*1.12);
   if(stage===6&&intent==='shield'&&!move.startsWith('skill:'))damage=Math.max(1,Math.round(damage*.63));
   if(stage===7&&intent==='crush'&&move!=='guard')enemyDamage=Math.round(enemyDamage*1.32);
   if(stage===8&&intent==='drain'&&move==='guard')enemyDamage=Math.max(1,Math.round(enemyDamage*.8));
  }
  enemyHp=Math.max(0,enemyHp-damage);
  if(enemyHp>0){
   playerHp=Math.max(0,playerHp-enemyDamage);
   if(intent==='drain'){
    const factor=wave!==3?.45:stage===8?(move==='guard'?.35:.92):stage===5?.82:.65;
    enemyHp=Math.min(enemyMaxHp,enemyHp+Math.max(2,Math.round(enemyDamage*factor)));
   }
  }
  const previousWave=wave;
  if(enemyHp===0&&playerHp>0&&wave<3){
   wave++;enemyMaxHp=actTwoEnemyMaxHp(stage,wave,power);enemyHp=enemyMaxHp;
   playerHp=Math.min(maxHp,playerHp+Math.round(maxHp*.34));
  }
  if(wave===3&&enemyHp/enemyMaxHp<=.33)intent=turn%3===0?'drain':'crush';
  else if(wave===3&&enemyHp/enemyMaxHp<=.67)intent=turn%3===0?'shield':'drain';
  else intent=['crush','drain','shield','strike'][(turn+stage+wave)%4];
  history.push({turn,wave:previousWave,move,enemyIntent:intent,playerHp,enemyHp,damage});
  if(enemyHp===0&&wave===3)break;
 }
 const won=enemyHp===0&&playerHp>0;
 const stars=!won?0:playerHp>=maxHp*.7&&turn<=18?3:playerHp>=maxHp*.3?2:1;
 return Object.freeze({stage,power,won,stars,turns:turn,playerHp,maxHp,wave,enemyHp,history});
}
