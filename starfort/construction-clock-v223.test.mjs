import test from 'node:test';
import assert from 'node:assert/strict';
import {constructionClockBase,trustedConstructionNow} from './construction-clock.js';
test('GitHub Pages uses the live game server, local dev uses its own trusted instance',()=>{
 assert.equal(constructionClockBase({hostname:'umutcandar.github.io',origin:'https://umutcandar.github.io'}),'https://starfort-online-beta.onrender.com');
 assert.equal(constructionClockBase({hostname:'127.0.0.1',origin:'http://127.0.0.1:8877'}),'http://127.0.0.1:8877');
 assert.equal(constructionClockBase({hostname:'localhost',origin:'http://localhost:8877'}),'http://localhost:8877');
});
test('server clock accepts only fresh validated explicit server responses',async()=>{
 const ref=Date.UTC(2026,10,2,1);
 let seen;
 const fetcher=async (url,opts)=>{seen={url,opts};return {ok:true,json:async()=>({ok:true,source:'starfort-server',now:ref})}};
 assert.equal(await trustedConstructionNow({fetcher,base:'https://clock.example'}),ref);
 assert.equal(seen.url,'https://clock.example/api/clock');
 assert.equal(seen.opts.method,'GET');
 assert.equal(seen.opts.cache,'no-store');
 assert.ok(seen.opts.signal);
 for(const payload of [{source:'starfort-server',now:ref},{ok:true,source:'evil',now:ref},{ok:true,source:'starfort-server',now:'2030'},{ok:true,source:'starfort-server',now:Infinity},{ok:true,source:'starfort-server',now:0}]){
  await assert.rejects(trustedConstructionNow({fetcher:async()=>({ok:true,json:async()=>payload}),base:'https://clock.example'}));
 }
});
test('offline, bad JSON and HTTP failures cannot claim or start a timed building',async()=>{
 const fetchers=[
  async()=>{throw Error('offline')},
  async()=>({ok:false}),
  async()=>({ok:true,json:async()=>{throw Error('bad json')}})
 ];
 for(const fetcher of fetchers)await assert.rejects(
  trustedConstructionNow({fetcher,base:'https://clock.example'}),/İnşaat saati/);
});
test('app checks trusted time before timed upgrade or completion and never sends client-provided now',async()=>{
 const app=await import('node:fs').then(fs=>fs.readFileSync(new URL('./app.js',import.meta.url),'utf8'));
 const server=await import('node:fs').then(fs=>fs.readFileSync(new URL('./guild-server.mjs',import.meta.url),'utf8'));
 assert.match(app,/mode==='finish'\|\|state\.buildings\[id\]>=R\.CONSTRUCTION_START_LEVEL/);
 assert.match(app,/needsClock\?await verifyConstructionTime\(\):Date\.now\(\)/);
 assert.match(app,/verifiedClockAnchor\.now\+Math\.max\(0,performance\.now\(\)-verifiedClockAnchor\.monotonic\)/);
 assert.match(server,/route==='\/api\/clock'&&req.method==='GET'/);
});
