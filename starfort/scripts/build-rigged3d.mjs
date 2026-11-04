/** Deterministic beta.15 asset provisioning for Render and GitHub QA.
 * Bundles the Three.js skinned character renderer locally; fetches only the
 * eight explicitly pinned CC0 GLBs, validates binary header/size, fails closed.
 * Models are cached on build; no remote model hosts contacted during gameplay.
 */
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {build} from 'esbuild';
import {RIGGED_ASSETS,RIGGED_BUNDLE,RIGGED_LICENSE,RIGGED_CLIPS} from '../official-rigged-contract-v264.js';

const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DEST=resolve(dir,'assets/rigged');
const MAX_SIZE=8*1024*1024;
const MIN_SIZE=1000;
function checkGLB(buffer,name){
 if(buffer.byteLength<MIN_SIZE||buffer.byteLength>MAX_SIZE)throw Error(name+' invalid size: '+buffer.byteLength);
 const b=new DataView(buffer.buffer,buffer.byteOffset,buffer.byteLength);
 if(b.getUint32(0,true)!==0x46546c67||b.getUint32(4,true)!==2||b.getUint32(8,true)!==buffer.byteLength)throw Error(name+' is not a complete glTF v2 binary');
}
async function download(name,url){
 const dest=join(DEST,name+'.glb');
 try{const cached=await readFile(dest);checkGLB(cached,name);return {name,cached:true,size:cached.byteLength};}catch{}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),28000);
 let data;
 try{
  const response=await fetch(url,{signal:controller.signal,headers:{'User-Agent':'STARFORT-CC0-Asset-Build/2.48'}});
  if(!response.ok)throw Error(name+' unavailable: '+response.status);
  const size=Number(response.headers.get('content-length')||0);
  if(size>MAX_SIZE)throw Error(name+' exceeded asset size budget');
  data=new Uint8Array(await response.arrayBuffer());
 }finally{clearTimeout(timeout);}
 checkGLB(data,name);
 await writeFile(dest,data);
 return {name,cached:false,size:data.byteLength};
}
await mkdir(DEST,{recursive:true});
const files=Object.entries(RIGGED_ASSETS);
const result=[];
for(let index=0;index<files.length;index+=3){
 const group=await Promise.all(files.slice(index,index+3).map(([name,url])=>download(name,url)));
 result.push(...group);
}
await build({
 entryPoints:[join(dir,'official-rigged-three-v264.entry.js')],
 bundle:true,format:'esm',platform:'browser',target:['es2022'],
 outfile:resolve(dir,RIGGED_BUNDLE),minify:true,
 sourcemap:false,logLevel:'warning',legalComments:'none'
});
await writeFile(join(DEST,'MODEL-LICENSE.txt'),
 RIGGED_LICENSE+'\nhttps://gobkit.com/freebies\nhttps://creativecommons.org/publicdomain/zero/1.0/\n'+
 Object.entries(RIGGED_ASSETS).map(([k,v])=>k+': '+v).join('\n')+'\n');
const built=await stat(resolve(dir,RIGGED_BUNDLE));
if(built.size<20000)throw Error('Three.js skinned renderer bundle is unexpectedly small');
console.log('STARFORT rigged Three.js ready:',result.map(x=>x.name+' '+(x.size/1024).toFixed(0)+'KiB'+(x.cached?' (cache)':'')).join(', '),'bundle',Math.round(built.size/1024)+'KiB');
