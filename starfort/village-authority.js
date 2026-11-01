import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
const BUILDINGS=['keep','farm','lumber','quarry','forge','tavern','observatory'];
const RESOURCES=['gold','wood','stone','aether'];
/** Zero trust in browser clocks, balances, saves or progress. Only action & building ID are sent. */
export async function villageAuthorityRequest(action,{building=null,roomId=null,requestId=null,fetcher=fetch}={}){
 if(!['get','collect','upgrade','finish','daily','match'].includes(action))throw Error('Bilinmeyen sunucu köy işlemi.');
 if(building!==null&&!BUILDINGS.includes(building))throw Error('Geçersiz bina.');
 if(roomId!==null&&(typeof roomId!=='string'||roomId.length>128))throw Error('Maç kimliği geçersiz.');
 const current=await freshAccountSession(fetcher);
 if(!current?.access_token||!current.user?.id)throw Error('Sunucu köyü için e-posta hesabına giriş yap.');
 const identity=current.user.id;
 const id=action==='get'?null:(requestId??crypto.randomUUID());
 let response,data;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_village_api',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+current.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_building:building,p_request_id:id,p_room_id:roomId})
  });
  data=await response.json();
 }catch{throw Error('Köy sunucusuna bağlanılamadı; işlem yapılmadı.');}
 if(!response.ok)throw Error(data?.message||data?.error||'Sunucu köy işlemini reddetti.');
 return {identity,snapshot:validateVillageSnapshot(data),requestId:id};
}
/** A strict response schema prevents unrelated values replacing locally owned combat state. */
export function validateVillageSnapshot(data){
 if(!data||data.ok!==true||data.source!=='server')throw Error('Sunucu ekonomi yanıtı geçersiz.');
 if(!Number.isSafeInteger(data.serverNow)||!Number.isSafeInteger(data.lastCollected)||!Number.isSafeInteger(data.revision))throw Error('Sunucu saat veya sürüm bilgisi bozuk.');
 for(const resource of RESOURCES)if(!Number.isSafeInteger(data.res?.[resource])||data.res[resource]<0||data.res[resource]>1e9)throw Error('Kaynak verisi bozuk.');
 for(const building of BUILDINGS)if(!Number.isInteger(data.buildings?.[building])||data.buildings[building]<1||data.buildings[building]>20)throw Error('Bina verisi bozuk.');
 if(!Number.isInteger(data.mastery)||data.mastery<0||data.mastery>24)throw Error('Sunucu ustalığı geçersiz.');
 const c=data.construction;
 if(c!==null&&(!c||!BUILDINGS.includes(c.id)||!Number.isSafeInteger(c.endsAt)||!Number.isSafeInteger(c.startedAt)||c.endsAt<=c.startedAt||c.fromLevel!==data.buildings[c.id]))throw Error('İnşaat kaydı geçersiz.');
 if(data.lastDailyReward!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(data.lastDailyReward||''))throw Error('Günlük görev bilgisi geçersiz.');
 return {res:Object.fromEntries(RESOURCES.map(k=>[k,data.res[k]])),
  buildings:Object.fromEntries(BUILDINGS.map(k=>[k,data.buildings[k]])),
  construction:c?{id:c.id,fromLevel:c.fromLevel,startedAt:c.startedAt,endsAt:c.endsAt}:null,
  mastery:data.mastery,lastCollected:data.lastCollected,lastDailyReward:data.lastDailyReward,
  serverNow:data.serverNow,revision:data.revision,applied:data.applied,gain:data.gain||{},reward:data.reward||{}};
}
export function villageServerView(local,server){
 if(!server)return {...local,serverVillage:true,serverVillageReady:false};
 return {...local,serverVillage:true,serverVillageReady:true,serverMastery:server.mastery,
  res:{...server.res},buildings:{...server.buildings},construction:server.construction?{...server.construction}:null,
  lastCollected:server.lastCollected,lastDailyReward:server.lastDailyReward};
}
