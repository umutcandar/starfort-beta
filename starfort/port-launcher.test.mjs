import test from 'node:test';
import assert from 'node:assert/strict';
import {candidatePorts,startLocalGame} from './launch-starfort.mjs';
import {createServer} from 'node:net';

test('başlatıcı 8877 portuyla başlar ve sıralı yedek portlara geçer',()=>{
  assert.deepEqual(candidatePorts(8877,3),[8877,8878,8879]);
  assert.throws(()=>candidatePorts(-1),/Geçersiz/);
});

test('dolu portu atlar ve farklı portu açar',async()=>{
  const busy=createServer();
  await new Promise((resolve,reject)=>busy.once('error',reject).listen(0,'127.0.0.1',resolve));
  const port=busy.address().port;
  if(port>65530){await new Promise(resolve=>busy.close(resolve));return;}
  let running;
  try{
    running=await startLocalGame({preferredPort:port,browser:false});
    assert.notEqual(running.port,port);
    assert.ok(running.port>port);
  }finally{
    if(running)await new Promise(resolve=>running.server.close(resolve));
    await new Promise(resolve=>busy.close(resolve));
  }
});
