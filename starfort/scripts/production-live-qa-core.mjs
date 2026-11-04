/** Pure checks used by the opt-in authenticated production QA harness. */
export function validateDedicatedQaCredentials(env){
 const email=String(env.STARFORT_QA_EMAIL||'').trim();
 const password=String(env.STARFORT_QA_PASSWORD||'');
 const userId=String(env.STARFORT_QA_USER_ID||'').trim().toLowerCase();
 const localPart=email.split('@')[0].toLowerCase();
 if(!email.includes('@')||email.length>254||!/(?:^|[.+_-])qa(?:$|[.+_-])/.test(localPart))
  throw Error('Create a separate, confirmed QA email address with "qa" in its local-part. Do not use a normal player email.');
 if(password.length<8)throw Error('Missing STARFORT_QA_PASSWORD GitHub Secret.');
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(userId))
  throw Error('Missing or invalid STARFORT_QA_USER_ID GitHub Secret. Pin the authorized QA identity.');
 return Object.freeze({email,password,userId});
}
export function chooseProductionTactic(battle){
 const intent=String(battle.enemyIntent||'');
 if(['crush','sunder','eclipse'].includes(intent))return 'guard';
 if(intent==='shield')return 'feint';
 if(Number(battle.playerHp)<Number(battle.playerMaxHp)*.40 &&
   Number(battle.turn||0)-Number(battle.lastRallyTurn||0)>=4)return 'rally';
 return 'strike';
}
export function summarizeProductionFight(strategy,stage,startingPower,initialHp,report,turns){
 const positives=turns.map(x=>x.hp).filter(x=>Number.isFinite(x)&&x>0);
 return {
  strategy,stage,balanceVersion:6,power:startingPower,maxHp:initialHp,
  won:!!report?.won,stars:Number(report?.stars||0),turns:Number(report?.turns||0),
  wavesReached:turns.length?Math.max(...turns.map(t=>t.wave)):0,
  lowestLiveHp:positives.length?Math.min(...positives):0,
  waveTransitions:turns.filter((t,i)=>i>0&&t.wave>turns[i-1].wave)
   .map(t=>({wave:t.wave,hp:t.hp}))
 };
}
