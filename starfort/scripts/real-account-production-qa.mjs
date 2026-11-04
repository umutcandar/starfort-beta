/**
 * STARFORT real production QA. Requires an existing, confirmed, dedicated
 * testing account. No signup, random email address or service-role key.
 *
 * GitHub Actions secrets (never print, commit or paste them into a chat):
 * STARFORT_QA_EMAIL + STARFORT_QA_PASSWORD.
 * Optional STARFORT_QA_USER_ID pins ownership to an expected UUID.
 *
 * This test intentionally plays real PvE on the public production endpoint.
 * It may earn rewards only for the dedicated QA account.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {SUPABASE_URL,SUPABASE_KEY} from '../online-config.js';
import {accountSignIn,accountSignOut,accountSession,loadAccountSession} from '../account-auth.js';
import {accountProgressRequest} from '../account-progression.js';
import {guildRequest} from '../guild-client.js';
import {testDeployedLogin} from './authenticated-browser-smoke.mjs';

const credentials=Object.freeze({
 email:String(process.env.STARFORT_QA_EMAIL||'').trim(),
 password:String(process.env.STARFORT_QA_PASSWORD||''),
 expectedUser:String(process.env.STARFORT_QA_USER_ID||'').trim()
});
const marker='[STARFORT PRODUCTION QA]';
const log=(message)=>console.log(marker,message);
const must=(v,msg)=>assert.ok(v,msg);
function ensureDedicatedAccount(){
 must(credentials.email.includes('@')&&credentials.password.length>=8,
  'Real QA requires STARFORT_QA_EMAIL and STARFORT_QA_PASSWORD (GitHub Actions Secrets). Never use an ordinary player account.');
 if(credentials.expectedUser)assert.match(credentials.expectedUser,/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i);
}
const api=async (route,init={})=>{
 const response=await fetch(SUPABASE_URL+route,{
  ...init,signal:AbortSignal.timeout(20000),
  headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(init.headers||{})}
 });
 const payload=await response.json().catch(()=>({}));
 return {ok:response.ok,status:response.status,payload};
};
const snapshot=async()=>accountProgressRequest('get');
const now=()=>Date.now();
const tactics=(battle)=>{
 const intent=battle.enemyIntent;
 if(['crush','sunder','eclipse'].includes(intent))return 'guard';
 if(intent==='shield')return 'feint';
 if((battle.playerHp||0)<(battle.playerMaxHp||1)*.40 &&
    (battle.turn||0)-(battle.lastRallyTurn||0)>=4)return 'rally';
 return 'strike';
};
async function fight(stage,strategy){
 let requestId=randomUUID(),started=false,previous=null,completed=null;
 const turns=[];
 try{
  const first=await accountProgressRequest('mission_start',{target:String(stage),requestId});
  must(first.account?.mission?.stage===stage&&first.account.mission.mode==='story',
   'The live PvE server rejected legitimate story stage '+stage);
  must(first.account.mission.balanceVersion===6,
   'The real production server must create balanceVersion 6; do not run a QA fight on older rules.');
  const duplicate=await accountProgressRequest('mission_start',{target:String(stage),requestId});
  assert.equal(duplicate.data.revision,first.data.revision,
   'Duplicate request-id unexpectedly modified production village resources.');
  started=true;previous=first.account.mission;
  const startingPower=previous.power,initialHp=previous.playerMaxHp;
  for(let n=0;n<28;n++){
   const action=strategy==='attack-only'?'strike':tactics(previous);
   // Account/server clock skew is tolerated: every turn waits more than 3s.
   await sleep(Math.max(3200,(previous.lastTurnAt||now())+3250-now()));
   const response=await accountProgressRequest('mission_turn',{aux:action});
   must(response.data.revision>first.data.revision,
    'Server did not persist a new revision for turn '+n);
   const battle=response.account.mission;
   turns.push({
    turn:n+1,wave:battle?.wave??previous.wave,
    hp:battle?.playerHp??0,enemyHp:battle?.enemyHp??0,
    action,enemyIntent:previous.enemyIntent,
    outcome:battle?'active':response.account.lastReport?.won?'victory':'defeat'
   });
   if(!battle){
    const report=response.account.lastReport;
    must(report&&typeof report.won==='boolean'&&Number.isInteger(report.turns),
     'Server did not create a battle receipt');
    completed={report,startingPower,initialHp,turns,resources:response.data.res};
    break;
   }
   must(battle.turn>previous.turn,'Live game turn did not advance');
   must(battle.wave>=previous.wave,'Live server wave regressed');
   previous=battle;
  }
  must(completed,'A live fight did not complete in 28 authentic server-verified turns');
  const reread=await snapshot();
  assert.equal(reread.account.lastReport?.turns,completed.report.turns,
   'Fresh production read did not preserve the latest battle outcome');
  assert.deepEqual(reread.account.cleared,completed.report.won?reread.account.cleared:reread.account.cleared);
  log(strategy+' '+JSON.stringify({
   stage,balanceVersion:6,power:startingPower,
   won:completed.report.won,stars:completed.report.stars||0,
   turns:completed.report.turns,wavesReached:Math.max(...turns.map(t=>t.wave)),
   lowestLiveHp:Math.min(...turns.filter(t=>t.hp>0).map(t=>t.hp)),
   waveTransitions:turns.filter((t,i)=>i>0&&t.wave>turns[i-1].wave)
    .map(t=>({wave:t.wave,hp:t.hp}))
  }));
  return completed;
 }finally{
  if(started&&!completed){
   // Do not leave QA-only active fights after an exception.
   try{await accountProgressRequest('mission_abandon')}catch{}
  }
 }
}
async function run(){
 ensureDedicatedAccount();
 loadAccountSession({getItem:()=>null});
 let loggedIn=false;
 try{
  const auth=await accountSignIn(credentials.email,credentials.password);
  loggedIn=true;
  must(auth?.user?.id,'Verified dedicated QA account did not return user identity');
  if(credentials.expectedUser)assert.equal(auth.user.id,credentials.expectedUser,
   'Authenticated account differs from the specifically authorized QA account.');
  log('PASS real password login and owner check (credentials never logged).');
  const current=await snapshot();
  must(current.account&&current.data,'Production did not return both village and account snapshots.');
  if(current.account.mission)throw Error('QA account has an unfinished expedition. Resolve it using the game before starting new production QA.');
  const wrong=await api('/rest/v1/rpc/sfb_starfort_progress',{
   method:'POST',headers:{Authorization:'Bearer '+accountSession().access_token},
   body:JSON.stringify({p_action:'mission_start',p_target:'999',p_request_id:randomUUID()})
  });
  assert.equal(wrong.ok,false,'Production server erroneously accepted story chapter 999.');
  log('PASS authenticated RPC and rejected forged chapter.');
  const me=await guildRequest('me');
  must(me?.player?.id,'Live guild identity did not auto-link with current email login.');
  log('PASS existing Supabase account automatically linked to commander guild identity.');
  const raw=await fight(1,'attack-only');
  // Play a second, strategically different server fight; compare player HP,
  // stage stars and effort rather than faking wins or guaranteed difficulty.
  const tactical=await fight(1,'tactical');
  log('COMPARISON '+JSON.stringify({
   strikeOnly:{won:raw.report.won,stars:raw.report.stars||0,turns:raw.report.turns,
    lowestHp:Math.min(...raw.turns.filter(t=>t.hp>0).map(t=>t.hp))},
   tactical:{won:tactical.report.won,stars:tactical.report.stars||0,turns:tactical.report.turns,
    lowestHp:Math.min(...tactical.turns.filter(t=>t.hp>0).map(t=>t.hp))}
  }));
  await testDeployedLogin(credentials.email,credentials.password);
  log('PASS live Chrome login, reload and authenticated mobile UI after PvE battles.');
 }finally{
  if(loggedIn){try{await accountSignOut()}catch{}}
 }
}
await run();
