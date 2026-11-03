import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {t} from './locale-v243.js';
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
export function explainAuthError(status,payload={}){
 // Provider details can contain unlocalized, user-controlled or sensitive text.
 // Keep stable error codes for logic; show only our reviewed localized messages.
 const code=String(payload?.error_code||payload?.code||payload?.error||'').trim().toLowerCase();
 const detail=String(payload?.msg||payload?.message||payload?.error_description||'').trim().toLowerCase();
 if(status===429||['over_email_send_rate_limit','over_request_rate_limit','email_rate_limit_exceeded'].includes(code))
  return t('auth.limit');
 if(code==='email_address_not_authorized')
  return t('auth.unauthorized');
 if(code==='email_address_invalid')
  return t('auth.badAddress');
 if(code==='email_not_confirmed'||detail==='email not confirmed')
  return t('auth.notConfirmed');
 if(code==='invalid_credentials'||detail==='invalid login credentials')
  return t('auth.invalidCredentials');
 if(code==='weak_password')
  return t('auth.validation.password');
 if(code==='validation_failed')
  return t('auth.invalidForm');
 // Unknown codes must not leak raw provider exceptions or fall back to English.
 return t('auth.failed');
}
async function request(path,opts={},fetcher=fetch){
 let res,payload;
 try {res=await fetcher(SUPABASE_URL+path,{...opts,signal:AbortSignal.timeout(12000),headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});payload=await res.json();}
 catch{throw Error(t('auth.connection'));}
 if(!res.ok)throw Error(explainAuthError(res.status,payload));
 return payload;
}
export async function accountSignIn(email,password,fetcher=fetch){
 const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})},fetcher);
 return saveSession(result);
}
export async function accountSignUp(email,password,fetcher=fetch,redirectTo=null){
 const dest=redirectTo?'?redirect_to='+encodeURIComponent(verifiedRedirect(redirectTo)):'';
 const result=await request('/auth/v1/signup'+dest,{method:'POST',body:JSON.stringify({email,password})},fetcher);
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
 if(!session)throw Error(t('auth.validation.signIn'));
 if((session.expires_at||0)>Date.now()/1000+60)return session;
 const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})},fetcher);
 return saveSession(data);
}
export async function accountBackup(action,body={},fetcher=fetch){
 if(!['get','save','restore','delete'].includes(action))throw Error(t('auth.validation.backupAction'));
 const active=await freshAccountSession(fetcher),uid=active.user.id;
 if(!/^[0-9a-f-]{36}$/i.test(uid))throw Error(t('auth.validation.userId'));
 const base='/rest/v1/starfort_account_backups';
 const url=base+'?user_id=eq.'+encodeURIComponent(uid)+(action==='get'||action==='restore'?'&select=state,revision,updated_at':'');
 const headers={Authorization:'Bearer '+active.access_token,Prefer:'return=representation'};
 if(action==='get'||action==='restore'){
   const rows=await request(url,{method:'GET',headers},fetcher);
   return Array.isArray(rows)?rows[0]||null:null;
 }
 if(action==='delete'){
   const rev=Number(body.revision);
   if(!Number.isInteger(rev)||rev<1)throw Error(t('auth.validation.checkBackup'));
   return request(url+'&revision=eq.'+rev,{method:'DELETE',headers},fetcher);
 }
 if(!body.state || typeof body.state!=='object'||body.state.version!==1)throw Error(t('auth.validation.file'));
 const size=JSON.stringify(body.state).length;
 if(size>125000)throw Error(t('auth.validation.size'));
 const rev=Number(body.revision)||0;
 if(!Number.isInteger(rev)||rev<0)throw Error(t('auth.validation.revision'));
 const rows=await request(base+(rev?'?user_id=eq.'+encodeURIComponent(uid)+'&revision=eq.'+rev:''),
    {method:rev?'PATCH':'POST',headers,body:JSON.stringify(rev?{state:body.state,revision:rev+1}:{user_id:uid,state:body.state,revision:1})},fetcher);
 if(!Array.isArray(rows)||rows.length!==1)throw Error(t('auth.validation.concurrent'));
 return rows[0];
}

function verifiedRedirect(url){
 if(typeof url!=='string'||!/^https:\/\//.test(url))throw Error(t('auth.validation.redirectHttps'));
 const parsed=new URL(url);
 // Never allow a recovery token to be routed to a third-party website.
 if(!['umutcandar.github.io','starfort-online-beta.onrender.com'].includes(parsed.hostname))
   throw Error(t('auth.validation.redirectHost'));
 return parsed.origin+parsed.pathname;
}
export async function accountResendConfirmation(email,redirectTo,fetcher=fetch){
 if(typeof email!=='string'||!email.includes('@'))throw Error(t('auth.validation.email'));
 await request('/auth/v1/resend',{method:'POST',body:JSON.stringify({type:'signup',email,options:{emailRedirectTo:verifiedRedirect(redirectTo)}})},fetcher);
 return {ok:true};
}
export async function accountRequestPasswordReset(email,redirectTo,fetcher=fetch){
 if(typeof email!=='string'||!email.includes('@'))throw Error(t('auth.validation.email'));
 // Redirect URLs must be registered under Supabase Auth > URL Configuration.
 const dest=verifiedRedirect(redirectTo);
 await request('/auth/v1/recover?redirect_to='+encodeURIComponent(dest),{method:'POST',body:JSON.stringify({email})},fetcher);
 return {ok:true};
}
/** v2.48: Google and Apple web OAuth; client contains no provider secrets. */
const SOCIAL_PENDING_KEY='starfort:oauth-pending-v248';
export const SOCIAL_PROVIDERS=Object.freeze(['google','apple']);
const socialProvider=provider=>{
 if(!SOCIAL_PROVIDERS.includes(provider))throw Error(t('auth.socialInvalid'));
 return provider;
};
export async function accountSocialAvailability(fetcher=fetch){
 try{
  const response=await fetcher(SUPABASE_URL+'/auth/v1/settings',{
   method:'GET',headers:{apikey:SUPABASE_KEY},signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)return {google:false,apple:false,checked:false};
  const settings=await response.json();
  return {google:settings?.external?.google===true,apple:settings?.external?.apple===true,checked:true};
 }catch{
  // Fail closed when the provider configuration cannot be verified.
  return {google:false,apple:false,checked:false};
 }
}
export function accountBeginSocialLogin(provider,redirectTo,{
 storage=globalThis.sessionStorage,
 navigate=url=>globalThis.location.assign(url),
 random=()=>globalThis.crypto.randomUUID(),
 clock=()=>Date.now()
}={}){
 socialProvider(provider);
 const redirect=verifiedRedirect(redirectTo);
 const target=new URL(redirect);
 const allowed=(target.hostname==='umutcandar.github.io'&&['/starfort-beta/starfort/','/starfort-beta/starfort/index.html'].includes(target.pathname))||
  (target.hostname==='starfort-online-beta.onrender.com'&&['/starfort/','/starfort/index.html'].includes(target.pathname));
 if(!allowed)throw Error(t('auth.socialInvalid'));
 // A one-time, same-tab marker binds the returned session to this login click.
 // Provider authorization state is independently verified by Supabase Auth.
 const nonce=random();
 if(typeof nonce!=='string'||!/^[\da-f-]{36}$/i.test(nonce))throw Error(t('auth.socialInvalid'));
 target.searchParams.set('starfort_oauth',nonce);
 const url=new URL(SUPABASE_URL+'/auth/v1/authorize');
 url.searchParams.set('provider',provider);
 url.searchParams.set('redirect_to',target.toString());
 storage.setItem(SOCIAL_PENDING_KEY,JSON.stringify({nonce,provider,createdAt:clock()}));
 navigate(url.toString());
 return url.toString();
}
export async function accountAcceptSocialCallback(search,hash,clearUrl=()=>{},fetcher=fetch,
 storage=globalThis.sessionStorage,clock=()=>Date.now()){
 const query=new URLSearchParams(String(search||'').replace(/^\?/,''));
 if(!query.has('starfort_oauth'))return null;
 let pending=null;
 try{pending=JSON.parse(storage.getItem(SOCIAL_PENDING_KEY)||'null')}catch{}
 // Consume the marker and remove query/hash before any remote request. Tokens
 // must never linger in browser history, analytics, error logs or referrers.
 try{storage.removeItem(SOCIAL_PENDING_KEY)}catch{}
 clearUrl();
 if(query.getAll('starfort_oauth').length!==1||
  !pending||!SOCIAL_PROVIDERS.includes(pending.provider)||
  pending.nonce!==query.get('starfort_oauth')||
  !Number.isFinite(pending.createdAt)||clock()-pending.createdAt>10*60*1000||
  clock()<pending.createdAt-60*1000)throw Error(t('auth.socialInvalid'));
 const fragment=String(hash||'');
 if(fragment.length>12000)throw Error(t('auth.socialInvalid'));
 const params=new URLSearchParams(fragment.replace(/^#/,''));
 if(query.has('error')||query.has('error_code')||params.has('error')||params.has('error_code'))
  throw Error(t('auth.socialFailed'));
 const access_token=params.get('access_token'),refresh_token=params.get('refresh_token');
 if(!access_token||!refresh_token||!['','bearer'].includes((params.get('token_type')||'').toLowerCase()))
  throw Error(t('auth.socialInvalid'));
 // Never accept an OAuth hash as proof of login until /auth/v1/user validates it.
 const user=await request('/auth/v1/user',{method:'GET',headers:{Authorization:'Bearer '+access_token}},fetcher);
 if(typeof user?.id!=='string'||!user.id)throw Error(t('auth.socialInvalid'));
 saveSession({access_token,refresh_token,expires_in:Number(params.get('expires_in')||3600),user});
 return {type:'oauth',provider:pending.provider,user};
}

export async function accountAcceptAuthHash(hash,clearHash=()=>{},fetcher=fetch){
 if(typeof hash!=='string'||hash.length>5000)return false;
 const args=new URLSearchParams(hash.replace(/^#/,''));
 const type=args.get('type');
 if(args.get('error')||args.get('error_code'))throw Error(t('auth.validation.linkExpired'));
 if(!['recovery','signup','email','invite','magiclink'].includes(type))return null;
 const token=args.get('access_token'),refresh=args.get('refresh_token');
 if(!token||!refresh)throw Error(t('auth.validation.recoveryExpired'));
 const user=await request('/auth/v1/user',{method:'GET',headers:{Authorization:'Bearer '+token}},fetcher);
 if(typeof user.id!=='string')throw Error(t('auth.validation.userInfo'));
 saveSession({access_token:token,refresh_token:refresh,expires_in:Number(args.get('expires_in')||3600),user});
 clearHash();
 return {type,user};
}
export async function accountAcceptRecoveryHash(hash,clearHash=()=>{},fetcher=fetch){
 if(new URLSearchParams(String(hash).replace(/^#/,'')).get('type')!=='recovery')return false;
 return !!(await accountAcceptAuthHash(hash,clearHash,fetcher));
}
export async function accountUpdatePassword(password,fetcher=fetch){
 if(typeof password!=='string'||password.length<8||password.length>100)throw Error(t('auth.validation.password'));
 const active=await freshAccountSession(fetcher);
 await request('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+active.access_token},body:JSON.stringify({password})},fetcher);
 return true;
}
