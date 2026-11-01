import test from 'node:test';
import assert from 'node:assert/strict';
import {accountSignUp,accountAcceptAuthHash,accountSession,accountSignOut,accountResendConfirmation} from './account-auth.js';
import {makeRecoveryPoint,recoveryPoints,loadRecoveryPoint} from './recovery-points.js';
import {progressionSummary} from './save-summary.js';
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
