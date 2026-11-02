/** Real production account smoke test. Runs only in an explicit one-off QA workflow.
 * Creates a unique throwaway Supabase Auth user with a random password held only in RAM.
 * Operator confirms that exact signup in Supabase while the test polls for login.
 * Never prints tokens or passwords; returns a JSON-free PASS/FAIL trace.
 */
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {SUPABASE_URL,SUPABASE_KEY} from '../online-config.js';
import {accountSignIn,accountSignOut,accountSession,loadAccountSession} from '../account-auth.js';
import {accountProgressRequest} from '../account-progression.js';
const tag='starfort-qa-'+(process.env.GITHUB_RUN_ID||Date.now());
const email=tag+'@example.com';
const password='Test!'+randomBytes(36).toString('base64url');
const headers={apikey:SUPABASE_KEY,'Content-Type':'application/json'};
const must=(value,message)=>assert.ok(value,message);
const request=async(path,options={})=>{
 const r=await fetch(SUPABASE_URL+path,{...options,headers:{...headers,...(options.headers||{})},signal:AbortSignal.timeout(20000)});
 const body=await r.json().catch(()=>({}));
 return {status:r.status,ok:r.ok,body};
};
const line=(text)=>console.log('[STARFORT REAL QA] '+text);
const logAccount=()=>{line('TEST_EMAIL='+email);};
function uidFromSignup(s){return s.body?.id||s.body?.user?.id||null;}
try{
 loadAccountSession({getItem:()=>null});
 const sign=await request('/auth/v1/signup',{
  method:'POST',
  body:JSON.stringify({email,password,options:{data:{qa_marker:'starfort-real-player-test'}}})
 });
 if(!sign.ok)throw Error('Signup HTTP '+sign.status+' '+JSON.stringify(sign.body).slice(0,300));
 const id=uidFromSignup(sign);
 must(typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id),'Auth signup did not create a real user ID');
 logAccount();line('TEST_USER_ID='+id);
 line('Signup accepted: HTTP '+sign.status+'. Secret password is in process memory only.');
 if(!sign.body.access_token&&!sign.body.session?.access_token){
  line('Waiting for administrator confirmation of this exact QA user; verification gate is ON.');
 }
 let signed=false,error='';
 for(let attempt=0;attempt<36;attempt++){
  try{
   const session=await accountSignIn(email,password);
   must(session?.user?.id===id,'Logged in as unexpected user');
   signed=true;break;
  }catch(e){error=e.message;if(attempt%4===0)line('Pending verified email login; attempt '+(attempt+1)+'.');}
  await sleep(5000);
 }
 if(!signed)throw Error('Confirmed Auth login unavailable: '+error);
 line('PASS Auth signInWithPassword, confirmed account, valid JWT and session.');
 let data=(await accountProgressRequest('get')).account;
 assert.deepEqual(data.cleared,[]);
 assert.equal(data.mission,null);
 line('PASS Authenticated account get, empty campaign and initial server profile.');
 const u=accountSession();
 const res=await request('/rest/v1/rpc/sfb_starfort_progress',{
  method:'POST',headers:{Authorization:'Bearer '+u.access_token},
  body:JSON.stringify({p_action:'mission_start',p_target:'999',p_request_id:randomUUID()})
 });
 assert.equal(res.ok,false,'Server accepted an impossible campaign stage');
 line('PASS Server rejected forged stage 999.');
 const battleId=randomUUID();
 let first=await accountProgressRequest('mission_start',{target:'1',requestId:battleId});
 must(first.account.mission?.mode==='story'&&first.account.mission.stage===1,'Official stage 1 did not start');
 const duplicate=await accountProgressRequest('mission_start',{target:'1',requestId:battleId});
 assert.equal(duplicate.data.revision,first.data.revision,'Request replay mutated revision');
 line('PASS Legitimate stage 1, battle start and idempotent duplicate request handling.');
 let result=null,previous=first.account.mission,lastRevision=first.data.revision;
 const cooldowns={};
 for(let n=0;n<36;n++){
  const intent=previous.enemyIntent;
  let move='strike';
  if(intent==='crush')move='guard';
  else if(intent==='shield'&&(!cooldowns.lyra||cooldowns.lyra<=previous.turn+1))move='skill:lyra';
  else if(intent==='drain'&&(!cooldowns.rovan||cooldowns.rovan<=previous.turn+1))move='skill:rovan';
  else if(!cooldowns.lyra||cooldowns.lyra<=previous.turn+1)move='skill:lyra';
  if(move.startsWith('skill:'))cooldowns[move.slice(6)]=previous.turn+4;
  await sleep(3100);
  const next=await accountProgressRequest('mission_turn',{aux:move});
  must(next.data.revision>lastRevision,'Server did not atomically save turn '+(n+1));
  lastRevision=next.data.revision;
  if(next.account.mission){
   must(next.account.mission.turn>previous.turn,'Server turn did not progress');
   must(next.account.mission.wave>=previous.wave,'Wave went backward');
   if(next.account.mission.wave>previous.wave)line('PASS Stage 1 wave '+next.account.mission.wave+' reached.');
   previous=next.account.mission;
  }else{result=next.account.lastReport;data=next.account;break;}
 }
 must(result!==null,'Timed out before server battle ended');
 line('Battle ended '+JSON.stringify({won:result.won,stars:result.stars,turns:result.turns,cleared:data.cleared.length}));
 const loaded=(await accountProgressRequest('get')).account;
 assert.equal(loaded.lastReport?.turns,result.turns,'Fresh read did not preserve battle report');
 assert.deepEqual(loaded.cleared,data.cleared,'Fresh read did not preserve campaign');
 line('PASS Reload persisted server battle report and campaign result.');
 if(result.won){
  assert.deepEqual(data.cleared,[1]);
  must(result.stars>=1&&result.stars<=3,'Invalid awarded stars');
  line('PASS Victory paid exclusively by server and unlocked stage 2.');
 }else{
  line('CHECK: starter team LOST the first stage. This is real balancing evidence.');
 }
 line('QA_RESULT='+JSON.stringify({accountCreated:true,loggedIn:true,serverGet:true,stageStarted:true,stageWon:!!result.won,
  turns:result.turns,stars:result.stars||0,cleared:data.cleared.length,ownerId:id}));
}finally{
 try{await accountSignOut()}catch{}
 line('Test client signed out; use the logged TEST_USER_ID for controlled QA-user cleanup.');
}
