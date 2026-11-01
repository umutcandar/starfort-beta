/** Durable browser relay for receipts issued by the server, never client-authored wins.
 * Supabase independently verifies HMAC and keeps (room_id,user_id) idempotent.
 * This covers restarts AFTER at least one player receives a signed receipt.
 */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const MAX_PENDING=16,MAX_AGE_MS=6*24*60*60*1000;
export function createMatchReceiptRecovery({storage,userId,fetcher=fetch,now=()=>Date.now()}={}){
 const enabled=UUID.test(userId||'')&&storage&&typeof storage.getItem==='function';
 const key='starfort:match-receipts:'+userId;
 let sending=false,nextRetryAt=0;
 function valid(receipt){
   if(!receipt||typeof receipt.p_body!=='string'||receipt.p_body.length>8000
      ||typeof receipt.p_sig!=='string'||!/^[a-f0-9]{64}$/.test(receipt.p_sig))return false;
   try{
     const body=JSON.parse(receipt.p_body);
     const ended=Date.parse(body.ended_at);
     return /^[a-f0-9]{16,18}$/.test(body.room_id||'')
       && Number.isFinite(ended)&&ended<=now()+300000&&now()-ended<MAX_AGE_MS
       && Array.isArray(body.players)&&body.players.some(p=>p.user_id===userId);
   }catch{return false;}
 }
 function read(){
   if(!enabled)return [];
   try{
     const list=JSON.parse(storage.getItem(key)||'[]');
     return Array.isArray(list)?list.filter(valid).slice(-MAX_PENDING):[];
   }catch{return [];}
 }
 function save(list){
   if(!enabled)return false;
   try{if(list.length)storage.setItem(key,JSON.stringify(list.slice(-MAX_PENDING)));
      else storage.removeItem(key);return true;}catch{return false;}
 }
 function remember(snapshot){
   if(!enabled||snapshot?.status!=='ended'||snapshot.room?.isPractice)return false;
   const receipt=snapshot.matchReceipt;
   if(!valid(receipt))return false;
   const existing=read();
   if(existing.some(x=>x.p_body===receipt.p_body))return true;
   // Never overwrite a different unresolved room with the same room ID.
   const roomId=JSON.parse(receipt.p_body).room_id;
   if(existing.some(x=>JSON.parse(x.p_body).room_id===roomId))return false;
   return save([...existing,receipt]);
 }
 async function flush(){
   if(!enabled||sending||now()<nextRetryAt)return false;
   const pending=read();
   if(!pending.length){save([]);return true;}
   sending=true;nextRetryAt=now()+30000;
   try{
     for(const receipt of pending.slice(0,4)){
       try{
         const response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_match_ingest',{
           method:'POST',signal:AbortSignal.timeout(9000),
           headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
           body:JSON.stringify(receipt)
         });
         if(!response.ok)break;
         const accepted=await response.json();
         if(accepted?.ok!==true)break;
         // Re-read before deleting: don't erase a new receipt captured mid-request.
         save(read().filter(x=>x.p_body!==receipt.p_body));
       }catch{break;}
     }
   }finally{sending=false;}
   return read().length===0;
 }
 return {remember,flush,get pending(){return read().length}};
}
