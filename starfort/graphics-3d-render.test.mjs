import test from 'node:test';import assert from 'node:assert/strict';
import {createGraphics3D} from './graphics-3d.js';
function mockCanvas({width=1000,height=600,available=true}={}){
 const calls={uploaded:0,draws:[],deleted:0,context:null};
 const constants={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,ARRAY_BUFFER:34962,FLOAT:5126,TRIANGLES:4,DEPTH_TEST:2929,LEQUAL:515,CULL_FACE:2884,COLOR_BUFFER_BIT:16384,DEPTH_BUFFER_BIT:256,DYNAMIC_DRAW:35048,STATIC_DRAW:35044};
 const gl=new Proxy({}, {get(_target,key){if(key in constants)return constants[key];if(key==='getShaderParameter'||key==='getProgramParameter')return ()=>true;if(key==='getAttribLocation')return (_prog,name)=>({aPosition:0,aNormal:1,aColor:2})[name];if(key==='getUniformLocation')return ()=>1;if(key==='bufferData')return (...a)=>{calls.uploaded++;assert.ok(a[1].length>0);};if(key==='drawArrays')return (...a)=>{calls.draws.push(a[2]);};if(key==='deleteBuffer')return ()=>{calls.deleted++;};if(key==='getShaderInfoLog'||key==='getProgramInfoLog')return ()=>'';if(key==='getContext')return ()=>null;return ()=>({});}});
 const listeners=new Map();const canvas={clientWidth:width,clientHeight:height,width,height,getContext:kind=>available&&kind==='webgl2'?gl:null,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),dispatch:(type)=>listeners.get(type)?.({preventDefault(){}})};calls.context=gl;
 return {canvas,calls};
}
const room={id:'r',variant:'siege',players:[{id:'a',team:0,x:20,y:30,hp:100,maxHp:100},{id:'b',team:1,x:80,y:30,hp:90,maxHp:100}],squads:[{id:'s',type:'archer',team:0,x:15,y:36,hp:50,maxHp:50}],siege:{gate:{x:50,y:30,hp:800,maxHp:900},core:{x:78,y:30,hp:1000,maxHp:1000},ram:{x:22,y:30,hp:360}},fx:[]};
test('3B devre dışı cihazda açık bir hata vererek 2.5B yedeğine izin verir',()=>{assert.throws(()=>createGraphics3D(mockCanvas({available:false}).canvas),/WebGL2/);});
test('3B sahne geometri çizer; sabit geometriyi her karede yüklemez',()=>{
 const {canvas,calls}=mockCanvas();const prev=globalThis.window;globalThis.window={devicePixelRatio:1};
 try{
  const r=createGraphics3D(canvas,{quality:'balanced'});r.render(room,'a',1,{quality:'balanced'});
  assert.equal(calls.uploaded,2);assert.equal(calls.draws.length,2);assert.ok(r.stats().vertices>3000);assert.ok(Math.abs(r.toWorld(500,300).x-500)<.001);
  r.render(room,'a',1.2,{quality:'balanced'});assert.equal(calls.uploaded,3);
  const broken={...room,siege:{...room.siege,gate:{...room.siege.gate,hp:0}}};r.render(broken,'a',1.3,{quality:'balanced'});assert.equal(calls.uploaded,5);
  r.setQuality('performance');r.render(broken,'a',1.4,{quality:'performance'});assert.equal(calls.uploaded,7);
  r.dispose();assert.equal(calls.deleted,2);
 }finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
});
test('3B kamera takip modunda dokunmatik hedefleme aynı kamerayı kullanır',()=>{
 const {canvas}=mockCanvas();const prev=globalThis.window;globalThis.window={devicePixelRatio:1};
 try{
  const r=createGraphics3D(canvas);
  r.render(room,'a',1,{cameraMode:'follow'});
  const center=r.toWorld(500,300);
  assert.ok(Number.isFinite(center.x)&&Number.isFinite(center.y));
  assert.ok(center.x<500,'kahramanı izleyen kamera dünya merkezinden kaymalı');
  assert.ok(Math.abs(center.x-500)<160,'kamera ani şekilde savaş alanından uzaklaşmamalı');
  r.dispose();
 }finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
});
test('3B render yeniden boyutlandırmada konum dönüşümü NaN üretmez',()=>{
 const {canvas}=mockCanvas({width:844,height:390});const prev=globalThis.window;globalThis.window={devicePixelRatio:2};
 try{
  const r=createGraphics3D(canvas,{quality:'ultra'});r.render(room,'a',1,{cameraMode:'follow'});
  const point=r.toWorld(400,250);assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  assert.ok(r.stats().vertices>1000);r.dispose();
 }finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
});

test('WebGL bağlamı kaybolup geri gelince sabit geometri yeniden yüklenir',()=>{
 const {canvas,calls}=mockCanvas();const prev=globalThis.window;globalThis.window={devicePixelRatio:1};
 try{
  const r=createGraphics3D(canvas);r.render(room,'a',1);const up=calls.uploaded;
  canvas.dispatch('webglcontextlost');assert.equal(r.stats().contextLost,true);r.render(room,'a',1.1);assert.equal(calls.uploaded,up);
  canvas.dispatch('webglcontextrestored');r.render(room,'a',1.2);assert.equal(r.stats().contextLost,false);
  assert.ok(calls.uploaded>=up+2);r.dispose();
 }finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
});

test('Harici GLB kale modeli 3B kuşatmaya gerçekten eklenir; varsayılan kale HP ve render korunur',async()=>{
 const {parseGLB}=await import('./graphics-gltf.js');const {readFile}=await import('node:fs/promises');
 const model=parseGLB(await readFile(new URL('./assets/models/siege-gatehouse.glb',import.meta.url)));
 const {canvas}=mockCanvas();const prev=globalThis.window;globalThis.window={devicePixelRatio:1};
 try{
  const basic=createGraphics3D(canvas,{quality:'balanced'});basic.render(room,'a',1);const count=basic.stats().vertices;basic.dispose();
  const {canvas:callsCanvas,calls}=mockCanvas();const advanced=createGraphics3D(callsCanvas,{quality:'balanced',gateModel:model});
  advanced.render(room,'a',1);assert.equal(advanced.stats().glbGateLoaded,true);
  assert.ok(advanced.stats().vertices-count>=model.geometry().length/9);
  assert.equal(calls.draws.length,2);advanced.dispose();
 }finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
});
