import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudSaveRequest,cloudBackupSummary} from './cloud-save.js';
const token='a'.repeat(64);
const respond=(status,body)=>async (_url,options)=>({
  ok:true,json:async()=>({status,body}),capture:options
});
test('cloud client rejects unknown routes and invalid tokens before network',async()=>{
  await assert.rejects(()=>cloudSaveRequest('save/raw',token),/Bilinmeyen/);
  await assert.rejects(()=>cloudSaveRequest('save/put','x'),/komutan hesabı/);
});
test('cloud get validates payload and passes token through POST body',async()=>{
  let request;
  const fetcher=async(url,opts)=>{request={url,opts};return {ok:true,json:async()=>({status:200,body:{exists:false,revision:0}})}};
  assert.deepEqual(await cloudSaveRequest('save/get',token,{},fetcher),{exists:false,revision:0});
  const body=JSON.parse(request.opts.body);
  assert.equal(body.route,'save/get');assert.equal(body.token,token);assert.deepEqual(body.data,{});
  assert.match(request.url,/\/rpc\/sfb_save_api$/);
});
test('cloud client respects revision conflicts and network failures',async()=>{
  await assert.rejects(()=>cloudSaveRequest('save/put',token,{expectedRev:1},respond(409,{error:'Değişti'})),/Değişti/);
  await assert.rejects(()=>cloudSaveRequest('save/get',token,{},async()=>{throw Error('offline')}),/ulaşılamadı/);
});
test('cloud backup status is normalized',()=>{
  assert.deepEqual(cloudBackupSummary({exists:false}),{exists:false,revision:0,savedAt:null});
  assert.deepEqual(cloudBackupSummary({exists:true,revision:7,savedAt:'2026-11-01'}),{exists:true,revision:7,savedAt:'2026-11-01'});
});
