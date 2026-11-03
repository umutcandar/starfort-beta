import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORTED_LOCALES,setLocale,t} from './locale-v243.js';
import {SOCIAL_KEYS,SOCIAL_TRANSLATIONS,auditSocialTranslations} from './locale-social-v248.js';
import {accountSocialAvailability,accountBeginSocialLogin,accountAcceptSocialCallback,
 accountSession,accountSignOut,SOCIAL_PROVIDERS} from './account-auth.js';
const NONCE='abcdefab-1234-4234-8234-abcdefabcdef';
const storage=()=>{
 const map=new Map();
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),
  removeItem:k=>map.delete(k)};
};
const begin=(provider,bag=storage())=>{
 let destination='';
 const authorize=accountBeginSocialLogin(provider,
  'https://starfort-online-beta.onrender.com/starfort/',{
   storage:bag,random:()=>NONCE,clock:()=>2000000,navigate:url=>{destination=url;}
  });
 return {bag,destination,authorize};
};
test('OAuth buttons and all state messages are localized in the 14 supported languages',()=>{
 assert.equal(SOCIAL_KEYS.length,9);
 assert.deepEqual(Object.keys(SOCIAL_TRANSLATIONS).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditSocialTranslations(SUPPORTED_LOCALES),[]);
 try{
  for(const lang of SUPPORTED_LOCALES){
   setLocale(lang);
   for(const key of SOCIAL_KEYS){
    assert.equal(t(key),SOCIAL_TRANSLATIONS[lang][key],lang+' '+key);
    assert.ok(t(key).trim());
    assert.doesNotMatch(t(key),/<script|javascript:/i);
   }
  }
 }finally{setLocale('tr');}
});
test('Google and Apple buttons remain disabled until public Supabase settings confirm each provider',async()=>{
 const withProviders=await accountSocialAvailability(async (url,opts)=>{
  assert.equal(new URL(url).pathname,'/auth/v1/settings');
  assert.ok(opts.headers.apikey.startsWith('sb_publishable_'));
  return {ok:true,json:async()=>({external:{google:true,apple:false}})};
 });
 assert.deepEqual(withProviders,{google:true,apple:false,checked:true});
 const disabled=await accountSocialAvailability(async()=>({ok:true,json:async()=>({external:{google:false,apple:false}})}));
 assert.deepEqual(disabled,{google:false,apple:false,checked:true});
 const disconnected=await accountSocialAvailability(async()=>{throw Error('network down');});
 assert.deepEqual(disconnected,{google:false,apple:false,checked:false});
});
test('OAuth starts only approved providers and exact HTTPS STARFORT callback paths',()=>{
 assert.deepEqual(SOCIAL_PROVIDERS,['google','apple']);
 for(const provider of SOCIAL_PROVIDERS){
  const flow=begin(provider),url=new URL(flow.destination),callback=new URL(url.searchParams.get('redirect_to'));
  assert.equal(flow.authorize,flow.destination);
  assert.equal(url.origin,'https://ftbbzqzgafmallrfimnt.supabase.co');
  assert.equal(url.pathname,'/auth/v1/authorize');
  assert.equal(url.searchParams.get('provider'),provider);
  assert.equal(callback.origin,'https://starfort-online-beta.onrender.com');
  assert.equal(callback.pathname,'/starfort/');
  assert.equal(callback.searchParams.get('starfort_oauth'),NONCE);
  const pending=JSON.parse(flow.bag.getItem('starfort:oauth-pending-v248'));
  assert.equal(pending.provider,provider);
  assert.equal(pending.nonce,NONCE);
 }
 for(const bad of ['facebook','github','','google%0a'])assert.throws(()=>
  accountBeginSocialLogin(bad,'https://starfort-online-beta.onrender.com/starfort/',{
   storage:storage(),random:()=>NONCE,navigate:()=>{}
  }));
 const forbidden=[
  'https://evil.example/starfort/',
  'https://starfort-online-beta.onrender.com.evil.example/starfort/',
  'http://starfort-online-beta.onrender.com/starfort/',
  'https://starfort-online-beta.onrender.com/admin',
  'https://umutcandar.github.io/private/'
 ];
 for(const url of forbidden)assert.throws(()=>
  accountBeginSocialLogin('google',url,{storage:storage(),random:()=>NONCE,navigate:()=>{}}),url);
 const pages=accountBeginSocialLogin('apple','https://umutcandar.github.io/starfort-beta/starfort/',{
  storage:storage(),random:()=>NONCE,navigate:()=>{},clock:()=>2000000
 });
 assert.equal(new URL(new URL(pages).searchParams.get('redirect_to')).pathname,'/starfort-beta/starfort/');
});
test('OAuth callback is one-time, wipes URL first, verifies user with Supabase and never creates a guest',async()=>{
 const flow=begin('google');
 const query='?starfort_oauth='+NONCE;
 const hash='#access_token=qa.jwt&refresh_token=qa.refresh&token_type=bearer&expires_in=3600';
 const events=[];
 const fetcher=async(url,opts)=>{
  events.push('verified');
  assert.equal(new URL(url).pathname,'/auth/v1/user');
  assert.equal(opts.headers.Authorization,'Bearer qa.jwt');
  return {ok:true,json:async()=>({id:'11111111-1111-4111-8111-111111111111',email:'qa@example.test'})};
 };
 const done=await accountAcceptSocialCallback(query,hash,()=>events.push('cleaned'),
  fetcher,flow.bag,()=>2000100);
 assert.deepEqual(events,['cleaned','verified']);
 assert.equal(done.type,'oauth');
 assert.equal(done.provider,'google');
 assert.equal(accountSession().user.email,'qa@example.test');
 assert.equal(flow.bag.getItem('starfort:oauth-pending-v248'),null);
 await assert.rejects(accountAcceptSocialCallback(query,hash,()=>{},
  async()=>{throw Error('must not run');},flow.bag,()=>2000200));
 await accountSignOut(async()=>({ok:true,json:async()=>({})}));
});
test('forged, expired, cancelled and unverified OAuth responses cannot create a session',async()=>{
 const hash='#access_token=forged&refresh_token=fake&token_type=bearer';
 const invalid=begin('apple');
 let cleaned=0;
 await assert.rejects(accountAcceptSocialCallback('?starfort_oauth=wrong',hash,()=>cleaned++,
  async()=>{throw Error('must not fetch');},invalid.bag,()=>2000001));
 assert.equal(cleaned,1);
 assert.equal(accountSession(),null);
 const old=begin('google');
 await assert.rejects(accountAcceptSocialCallback('?starfort_oauth='+NONCE,hash,()=>cleaned++,
  async()=>{throw Error('must not fetch');},old.bag,()=>2700000));
 assert.equal(accountSession(),null);
 const cancelled=begin('apple');
 await assert.rejects(accountAcceptSocialCallback('?starfort_oauth='+NONCE,
  '#error=access_denied&error_description=raw-provider-message',()=>cleaned++,
  async()=>{throw Error('must not fetch');},cancelled.bag,()=>2000001));
 assert.equal(accountSession(),null);
 const bogus=begin('google');
 await assert.rejects(accountAcceptSocialCallback('?starfort_oauth='+NONCE,hash,()=>cleaned++,
  async()=>({ok:false,status:401,json:async()=>({message:'forbidden'})}),bogus.bag,()=>2000001));
 assert.equal(accountSession(),null);
 assert.equal(cleaned,4);
 assert.equal(await accountAcceptSocialCallback('',hash,()=>{throw Error('must not clear');}),null);
});
test('social login is account-only; UI never embeds secrets or bypasses the authoritative game gate',()=>{
 const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
 const auth=readFileSync(new URL('./account-auth.js',import.meta.url),'utf8');
 for(const provider of SOCIAL_PROVIDERS){
  assert.match(html,new RegExp('data-social-login="'+provider+'" disabled'));
 }
 assert.match(html,/data-i18n="gate\.socialDivider"/);
 assert.match(app,/accountAcceptSocialCallback\(location\.search,location\.hash/);
 assert.match(app,/accountSocialAvailability/);
 assert.match(app,/button\.disabled=!enabled/);
 assert.match(app,/if\(!accountReady\(\)\)/);
 assert.doesNotMatch(auth,/client_secret|service_role|sb_secret_/);
 assert.doesNotMatch(html,/data-welcome="guest"/);
});
