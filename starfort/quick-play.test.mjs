import test from 'node:test';import assert from 'node:assert/strict';
import {ensureTestCommander} from './quick-play.js';
test('quick play registers only when requested, reuses token, and never overwrites campaign state',async()=>{
 const map=new Map([['starfort:v1','saved-progress']]);let calls=0;
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const request=async(route,token,body)=>{calls++;if(route==='me')return {player:{id:'test'}};assert.equal(route,'register');assert.equal(token,null);assert.match(body.name,/^Deneme [0-9]{6}$/);return {token:'a'.repeat(64)}};
 assert.equal(await ensureTestCommander({storage,request,random:()=>1234}),'a'.repeat(64));
 assert.equal(await ensureTestCommander({storage,request,random:()=>5678}),'a'.repeat(64));
 assert.equal(calls,2);assert.equal(map.get('starfort:v1'),'saved-progress');
});
test('quick play rejects bad registration and leaves storage untouched',async()=>{
 const map=new Map();const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 await assert.rejects(ensureTestCommander({storage,request:async()=>({token:'bad'}),random:()=>1}),/doğrulanamadı/);
 assert.equal(map.size,0);
});

test('quick play renews stale server token without losing village save',async()=>{
 const map=new Map([['starfort:guild-token','b'.repeat(64)],['starfort:v1','keep-level-8']]);
 const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const request=async(route)=>{if(route==='me')throw Error('Bu cihazda oturum yok.');return {token:'c'.repeat(64)}};
 assert.equal(await ensureTestCommander({storage,request,random:()=>42}),'c'.repeat(64));
 assert.equal(map.get('starfort:v1'),'keep-level-8');
});
