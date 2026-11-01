import test from 'node:test';
import assert from 'node:assert/strict';
import {accountSignUp,accountAcceptAuthHash,accountSession,accountSignOut,accountResendConfirmation} from './account-auth.js';
import {makeRecoveryPoint,recoveryPoints,loadRecoveryPoint} from './recovery-points.js';
import {progressionSummary} from './save-summary.js';
import {createAccountSync} from './account-sync.js';
import * as R from './rules.js';
const now=Date.UTC(2026,10,1);
function storage(){
 const m=new Map();
 return {get length(){return m.size;},key(i){return [...m.keys()][i]||null;},getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
test('signup adds configured first-party verification redirect, no account token before confirmation',async()=>{
 let path,opts;
 const fetcher=async(url,o)=>{path=url;opts=o;return {ok:true,json:async()=>({user:{id:'1234'},access_token:null})}};
 const result=await accountSignUp('new@example.com','long-password',fetcher,'https://umutcandar.github.io/starfort-beta/starfort/');
 assert.equal(result.needsConfirmation,true);
 assert.match(path,/\/auth\/v1\/signup\?redirect_to=https%3A%2F%2Fumutcandar\.github\.io/);
 assert.deepEqual(JSON.parse(opts.body),{email:'new@example.com',password:'long-password'});
 await assert.rejects(()=>accountSignUp('bad','password',fetcher,'https://attacker.example/tokens'),/STARFORT/);
});
test('verified signup callback sets a real authenticated account, clears tokens from URL',async()=>{
 let cleared=0;
 const fetcher=async(url,opts)=>({ok:true,json:async()=>({id:'123e4567-e89b-12d3-a456-426614174000',email:'pilot@example.com'})});
 const result=await accountAcceptAuthHash('#type=signup&access_token=verified-access&refresh_token=verified-refresh&expires_in=3600',()=>{cleared++},fetcher);
 assert.equal(result.type,'signup');assert.equal(accountSession().user.email,'pilot@example.com');
 assert.equal(cleared,1);
 assert.equal(await accountAcceptAuthHash('#x=1',()=>{},fetcher),null);
 await assert.rejects(()=>accountAcceptAuthHash('#error_code=otp_expired&error=invalid',()=>{},fetcher),/süresi dolmuş/);
 await accountSignOut(async()=>({ok:true,json:async()=>({})}));
});
test('resend confirmation uses first party URL and respects non-enumerating message',async()=>{
 let url,body;
 const fetcher=async(u,opts)=>{url=u;body=JSON.parse(opts.body);return {ok:true,json:async()=>({})}};
 assert.deepEqual(await accountResendConfirmation('pilot@example.com','https://umutcandar.github.io/starfort-beta/starfort/',fetcher),{ok:true});
 assert.equal(body.email,'pilot@example.com');assert.equal(body.type,'signup');
 assert.equal(body.options.emailRedirectTo,'https://umutcandar.github.io/starfort-beta/starfort/');
 assert.match(url,/\/auth\/v1\/resend/);
 await assert.rejects(()=>accountResendConfirmation('a@b.c','https://other.example',fetcher),/STARFORT/);
});
test('recovery checkpoint preserves previous village and retains newest three only',()=>{
 const store=storage(),s=R.createState(now);
 for(let i=0;i<4;i++){
   s.buildings.keep=i+1;makeRecoveryPoint(store,s,now+i*1000);
 }
 const points=recoveryPoints(store);
 assert.equal(points.length,3);
 assert.equal(points[0].state.buildings.keep,4);
 assert.equal(points[2].state.buildings.keep,2);
 assert.equal(loadRecoveryPoint(store,points[2].key).buildings.keep,2);
 assert.equal(progressionSummary(points[0].state).keep,4);
 assert.throws(()=>loadRecoveryPoint(store,'untrusted:key'),/Geçersiz/);
});
test('invalid checkpoint and storage write error never replace an existing save',()=>{
 const store=storage(),s=R.createState(now);
 s.season.legacy={bad:'value'};
 assert.throws(()=>makeRecoveryPoint(store,s,now),/hasarlı/);
 assert.equal(recoveryPoints(store).length,0);
 const good=R.createState(now),blocked={setItem(){throw Error('quota exhausted');},getItem(){return null;},get length(){return 0}};
 assert.throws(()=>makeRecoveryPoint(blocked,good,now),/quota exhausted/);
});

test('two-device end-to-end: first device uploads, second conflicts, no hidden overwrite',async()=>{
 let cloud=null,rev=0,uploads=0;
 const remote=async()=>cloud?{state:structuredClone(cloud),revision:rev}:null;
 const push=async(state,expected)=>{
   assert.equal(expected,rev,'stale device must not overwrite newer revision');
   cloud=structuredClone(state);rev++;uploads++;return {revision:rev};
 };
 const a=R.createState(now),b=R.createState(now);
 const options={fetchRemote:remote,saveRemote:push,validateLocal:x=>x};
 const first=createAccountSync({...options,readLocal:()=>a});
 assert.equal(await first.start(),true);
 assert.equal(rev,1);assert.equal(uploads,1);
 a.buildings.keep=4;first.noteSaved();await first.flush();
 assert.equal(rev,2);assert.equal(cloud.buildings.keep,4);
 const second=createAccountSync({...options,readLocal:()=>b});
 assert.equal(await second.start(),false);
 assert.equal(second.status,'conflict');
 assert.equal(b.buildings.keep,1);
 assert.equal(cloud.buildings.keep,4);
 assert.equal(uploads,2,'second device must not send a write until explicit choice');
 const checkpoint=storage();makeRecoveryPoint(checkpoint,b,now);
 // Device B explicitly chooses cloud. The recovered previous save stays available.
 Object.assign(b,structuredClone(cloud));
 assert.equal(b.buildings.keep,4);
 assert.equal(loadRecoveryPoint(checkpoint,recoveryPoints(checkpoint)[0].key).buildings.keep,1);
 // A different remote change prevents first device silently overwriting its previous revision.
 cloud.buildings.keep=5;rev++;
 a.res.gold+=100;
 assert.equal(await first.flush(),false);
 assert.equal(first.status,'conflict');
 assert.equal(cloud.buildings.keep,5);
});

test('internet loss retains offline progress and resumes sync without discarding it',async()=>{
 const s=R.createState(now);let rev=1,offline=false,cloud=structuredClone(s);
 const sync=createAccountSync({
   fetchRemote:async()=>({state:structuredClone(cloud),revision:rev}),
   saveRemote:async(next,expected)=>{
     if(offline)throw Error('Sunucuya bağlanılamadı.');
     assert.equal(expected,rev);cloud=structuredClone(next);return {revision:++rev};
   },
   readLocal:()=>s,validateLocal:x=>x,
   schedule:()=>0,cancel:()=>{}
 });
 assert.equal(await sync.start(),true);
 s.buildings.keep=3;offline=true;
 assert.equal(await sync.flush(),false);
 assert.equal(sync.status,'offline');
 assert.equal(s.buildings.keep,3);assert.equal(cloud.buildings.keep,1);
 offline=false;
 assert.equal(await sync.refresh(),true);
 assert.equal(await sync.flush(),true);
 assert.equal(sync.status,'synced');
 assert.equal(cloud.buildings.keep,3);
});
