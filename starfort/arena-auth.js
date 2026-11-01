import {createHash} from 'node:crypto';
// Validate Supabase bearer tokens with Auth itself. No service-role key on Render.
const endpoint='https://ftbbzqzgafmallrfimnt.supabase.co';
const publicKey='sb_publishable_Z46YoAdDJSnL3RYmX61vBg_XUbiAfuZ';
const cache=new Map();
export async function verifiedArenaUser(authorization,{fetcher=fetch,now=Date.now}={}){
  const token=/^Bearer ([A-Za-z0-9_.-]{50,8192})$/.exec(authorization||'')?.[1];
  if(!token)throw Error('E-posta hesabı ile oturum aç.');
  const digest=createHash('sha256').update(token).digest('hex');
  const entry=cache.get(digest),time=now();
  if(entry && entry.expires>time)return entry.user;
  let res,body;
  try{
    res=await fetcher(endpoint+'/auth/v1/user',{method:'GET',signal:AbortSignal.timeout(5000),
      headers:{apikey:publicKey,Authorization:'Bearer '+token}});
    body=await res.json();
  }catch{throw Error('Kimlik doğrulama sunucusu şu anda erişilemiyor.');}
  if(!res.ok || typeof body?.id!=='string' || !/^[0-9a-f-]{36}$/i.test(body.id))
    throw Error('E-posta oturumun geçersiz. Tekrar giriş yap.');
  const user={id:body.id,name:'Komutan-'+body.id.slice(0,6)};
  if(cache.size>1000)cache.clear();
  cache.set(digest,{user,expires:time+15000});
  return user;
}
