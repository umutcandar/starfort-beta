import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
const KEY='starfort:account-session';
let session=null;
export const accountSession=()=>session;
export function loadAccountSession(storage=globalThis.sessionStorage) {
 try {
   const raw=JSON.parse(storage.getItem(KEY));
   session=raw&&typeof raw.access_token==='string'&&typeof raw.refresh_token==='string'
     &&typeof raw.user?.id==='string' ?raw:null;
 }catch{session=null;}
 return session;
}
function saveSession(data,storage=globalThis.sessionStorage){
 session=data&&typeof data.access_token==='string'&&typeof data.refresh_token==='string'&&typeof data.user?.id==='string'
  ?{access_token:data.access_token,refresh_token:data.refresh_token,user:{id:data.user.id,email:data.user.email||''},expires_at:Math.floor(Date.now()/1000)+Number(data.expires_in||3600)}
  :null;
 try{if(session)storage.setItem(KEY,JSON.stringify(session));else storage.removeItem(KEY);}catch{}
 return session;
}
async function request(path,opts={},fetcher=fetch){
 let res,payload;
 try {res=await fetcher(SUPABASE_URL+path,{...opts,signal:AbortSignal.timeout(12000),headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});payload=await res.json();}
 catch{throw Error('Sunucuya bağlanılamadı. Yerel kayıt değişmedi.');}
 if(!res.ok)throw Error(payload?.msg||payload?.message||payload?.error_description||payload?.error||'Hesap işlemi başarısız.');
 return payload;
}
export async function accountSignIn(email,password,fetcher=fetch){
 const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})},fetcher);
 return saveSession(result);
}
export async function accountSignUp(email,password,fetcher=fetch){
 const result=await request('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})},fetcher);
 if(result.access_token)saveSession(result);
 return {needsConfirmation:!result.access_token};
}
export async function accountSignOut(fetcher=fetch){
 const existing=session;
 saveSession(null);
 if(!existing?.access_token)return;
 try{await request('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+existing.access_token}},fetcher);}catch{}
}
export async function freshAccountSession(fetcher=fetch){
 if(!session)throw Error('E-posta hesabına giriş yap.');
 if((session.expires_at||0)>Date.now()/1000+60)return session;
 const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})},fetcher);
 return saveSession(data);
}
export async function accountBackup(action,body={},fetcher=fetch){
 if(!['get','save','restore','delete'].includes(action))throw Error('Geçersiz yedek işlemi.');
 const active=await freshAccountSession(fetcher),uid=active.user.id;
 if(!/^[0-9a-f-]{36}$/i.test(uid))throw Error('Hesap kimliği geçersiz.');
 const base='/rest/v1/starfort_account_backups';
 const url=base+'?user_id=eq.'+encodeURIComponent(uid)+(action==='get'||action==='restore'?'&select=state,revision,updated_at':'');
 const headers={Authorization:'Bearer '+active.access_token,Prefer:'return=representation'};
 if(action==='get'||action==='restore'){
   const rows=await request(url,{method:'GET',headers},fetcher);
   return Array.isArray(rows)?rows[0]||null:null;
 }
 if(action==='delete'){
   const rev=Number(body.revision);
   if(!Number.isInteger(rev)||rev<1)throw Error('Önce bulut yedeğini kontrol et.');
   return request(url+'&revision=eq.'+rev,{method:'DELETE',headers},fetcher);
 }
 if(!body.state || typeof body.state!=='object'||body.state.version!==1)throw Error('Geçersiz yedek dosyası.');
 const size=JSON.stringify(body.state).length;
 if(size>125000)throw Error('Yedek çok büyük (125 KB sınırı).');
 const rev=Number(body.revision)||0;
 if(!Number.isInteger(rev)||rev<0)throw Error('Geçersiz yedek sürümü.');
 const rows=await request(base+(rev?'?user_id=eq.'+encodeURIComponent(uid)+'&revision=eq.'+rev:''),
    {method:rev?'PATCH':'POST',headers,body:JSON.stringify(rev?{state:body.state,revision:rev+1}:{user_id:uid,state:body.state,revision:1})},fetcher);
 if(!Array.isArray(rows)||rows.length!==1)throw Error('Kayıt başka cihazda değişmiş. Önce bulut durumunu yenile.');
 return rows[0];
}
