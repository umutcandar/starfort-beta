import {createHmac} from 'node:crypto';
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HERO=/^[a-z_]{1,20}$/;
export function matchRecord(room,kind,ended=Date.now()){
 if(!room || room.status!=='ended'||room.isPractice||!Array.isArray(room.players))return null;
 const duel=kind==='duel',team=room.teamSize,mode=duel?'duel':room.variant==='siege'?'siege-5':team===2?'team-2':team===5?'team-5':null;
 if(!mode)return null;
 const people=room.players.filter(p=>UUID.test(p.id)).map(p=>{
   const isDraw=room.winner==null;
   const winner=duel?room.winner===p.id:room.winner===p.team;
   return {user_id:p.id,outcome:isDraw?'draw':winner?'win':'loss',hero_id:HERO.test(p.heroId||'')?p.heroId:'aldren'};
 });
 if(!people.length)return null;
 const started=duel?room.startedAt:room.createdAt;
 if(!Number.isFinite(started)||ended<started||ended-started>30*60000)return null;
 return {room_id:room.id,mode,reason:room.reason||'completed',started_at:new Date(started).toISOString(),ended_at:new Date(ended).toISOString(),players:people};
}
export function createMatchLedger({secret=process.env.STARFORT_MATCH_INGEST_SECRET||'',fetcher=fetch,now=()=>Date.now()}={}){
 const enabled=/^[a-f0-9]{64}$/.test(secret),queue=[],seen=new Set(),receipts=new WeakMap();let sending=false,lastError='',sent=0;
 function enqueue(room,kind){
   if(!enabled||!room||seen.has(room.id))return false;
   const payload=matchRecord(room,kind,now());
   if(!payload)return false;
   const p_body=JSON.stringify(payload);
   const p_sig=createHmac('sha256',secret).update(p_body).digest('hex');
   const receipt=Object.freeze({p_body,p_sig});
   seen.add(room.id);receipts.set(room,receipt);
   queue.push({receipt,attempts:0,nextAt:0});return true;
 }
 // Only the authoritative server can create a signed receipt. The client may
 // replay it after Render restarts; the database checks HMAC and deduplicates.
 function receiptFor(room,kind){
   if(!room)return null;
   if(!receipts.has(room))enqueue(room,kind);
   return receipts.get(room)||null;
 }
 async function flush(){
   if(!enabled||sending||!queue.length||queue[0].nextAt>now())return false;
   sending=true;const entry=queue[0];
   try{
     const r=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_match_ingest',{
       method:'POST',signal:AbortSignal.timeout(12000),
       headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
       body:JSON.stringify(entry.receipt)
     });
     if(!r.ok)throw Error('Match-history write returned HTTP '+r.status);
     const result=await r.json();
     if(result?.ok!==true)throw Error('Match-history write not acknowledged');
     queue.shift();sent++;lastError='';return true;
   }catch(error){
     lastError=error.message;
     entry.attempts++;
     entry.nextAt=now()+Math.min(60000,1500*2**Math.min(entry.attempts,5));
     return false;
   }finally{sending=false;}
 }
 return {enqueue,receiptFor,flush,get status(){return {enabled,sent,pending:queue.length,lastError};}};
}
