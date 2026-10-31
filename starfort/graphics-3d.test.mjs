import test from 'node:test';import assert from 'node:assert/strict';
import {world3,server3,pickGround,project3,cameraMatrix,multiply4,unit3} from './graphics-3d-math.js';
test('3B/2B sunucu koordinatları tersine doğru dönüşür',()=>{for(const [x,y]of [[0,0],[50,30],[100,60],[17,43]]){const w=world3(x,y);assert.deepEqual(server3(w.x,w.z),{x,y});}});
test('perspektif kamera merkez ışını zemin merkezine düşer',()=>{let p=pickGround(.5,.5);assert.ok(p);assert.ok(Math.hypot(p.x,p.z)<1e-5);});
test('3B sahne konumu projeksiyonda doğru piksele karşılık gelir',()=>{const m=cameraMatrix(1000/600);for(let p of [[-20,0,-12],[0,0,0],[13,0,14]]){const projected=project3(p,m);const picked=pickGround((projected[0]+1)/2,(1-projected[1])/2);assert.ok(picked);assert.ok(Math.hypot(picked.x-p[0],picked.z-p[2])<1e-5);}});
test('ekran dışında ve göğe bakan ışınlar hedef olamaz',()=>{assert.equal(pickGround(-.1,.5),null);assert.equal(pickGround(.3,2),null);});
test('üniteler sıfır vektörde NaN üretmez ve matris çarpımı doğru',()=>{assert.deepEqual(unit3([0,0,0]),[0,0,0]);let i=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];assert.deepEqual(multiply4(i,i),i);});
