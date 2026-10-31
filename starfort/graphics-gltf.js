/** Starfort GLB v2 mesh/scene/animation reader. Pure JS: no network or GPU dependencies.
 * Supports embedded BIN buffer, indexed triangle primitives, vertex normals/colors,
 * node TRS + matrices and LINEAR/STEP animation channels. Skinned vertices and textures
 * are intentionally unsupported until GPU skinning + texture pipelines are implemented.
 */
const MAX_BYTES=32*1024*1024, MAX_VERTICES=400000;
const c=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const multiply=(a,b)=>{const out=new Array(16).fill(0);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;};
const quaternion=(q)=>{const [x,y,z,w]=q,xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;return [1-2*(yy+zz),2*(xy+wz),2*(xz-wy),0,2*(xy-wz),1-2*(xx+zz),2*(yz+wx),0,2*(xz+wy),2*(yz-wx),1-2*(xx+yy),0,0,0,0,1];};
const trs=(t=[0,0,0],r=[0,0,0,1],s=[1,1,1])=>{const m=quaternion(r);for(let j=0;j<3;j++)for(let i=0;i<3;i++)m[j*4+i]*=s[j];m[12]=t[0];m[13]=t[1];m[14]=t[2];return m;};
const transform=(m,v,w=1)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*w,m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*w,m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*w];
const normal=(v)=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function mixRotation(a,b,t){let bb=b.slice(),co=dot(a,bb);if(co<0){bb=bb.map(x=>-x);co=-co;}if(co>.9995)return normal(a.map((x,i)=>x+(bb[i]-x)*t));const theta=Math.acos(c(co,-1,1)),d=Math.sin(theta);return a.map((x,i)=>(Math.sin((1-t)*theta)*x+Math.sin(t*theta)*bb[i])/d);}
const FORMAT={5120:['getInt8',1],5121:['getUint8',1],5122:['getInt16',2],5123:['getUint16',2],5125:['getUint32',4],5126:['getFloat32',4]};
const NCOMP={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
export function parseGLB(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.byteLength<20||bytes.byteLength>MAX_BYTES)throw Error('GLB boyutu desteklenmiyor');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==bytes.length)throw Error('Geçersiz GLB v2 başlığı');
 let json=null,bin=null,pos=12;const decoder=new TextDecoder();
 while(pos+8<=bytes.length){const length=v.getUint32(pos,true),type=v.getUint32(pos+4,true);pos+=8;
  if(length>bytes.length-pos)throw Error('GLB bölüm uzunluğu geçersiz');
  if(type===0x4e4f534a){if(json)throw Error('Çift JSON bölümü');json=JSON.parse(decoder.decode(bytes.subarray(pos,pos+length)).trim());}
  if(type===0x004e4942){if(bin)throw Error('Çift BIN bölümü');bin=bytes.subarray(pos,pos+length);}
  pos+=length;
 }
 if(pos!==bytes.length||!json||!bin||json.asset?.version!=='2.0')throw Error('GLB JSON/BIN eksik');
 if((json.buffers||[]).length!==1||json.buffers[0].uri||json.buffers[0].byteLength>bin.length)throw Error('Yalnızca gömülü tek BIN destekleniyor');
 if((json.skins||[]).length)throw Error('GLB skin henüz desteklenmiyor');
 const dv=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 const accessor=(index)=>{const a=json.accessors?.[index];if(!a||a.sparse||a.bufferView===undefined||!FORMAT[a.componentType]||!NCOMP[a.type])throw Error('GLB accessor desteklenmiyor');
  const view=json.bufferViews?.[a.bufferView];if(!view||view.buffer!==0)throw Error('GLB bufferView desteklenmiyor');
  const [method,size]=FORMAT[a.componentType],n=NCOMP[a.type],stride=view.byteStride||size*n,start=(view.byteOffset||0)+(a.byteOffset||0);
  if(!Number.isInteger(a.count)||a.count<0||a.count>MAX_VERTICES||stride<size*n||stride%size||start<0||(a.count&&start+(a.count-1)*stride+n*size>Math.min(bin.length,(view.byteOffset||0)+view.byteLength)))throw Error('GLB accessor sınır dışı');
  const out=new Array(a.count);for(let i=0;i<a.count;i++){const vec=[];for(let j=0;j<n;j++){
   let q=dv[method](start+i*stride+j*size,size>1);if(a.normalized&&a.componentType!==5126){const max=a.componentType===5121?255:a.componentType===5123?65535:a.componentType===5120?127:a.componentType===5122?32767:4294967295;q=Math.max(-1,q/max);}vec.push(finite(q));
  }out[i]=vec;}return out;
 };
 const objects=(json.meshes||[]).map(mesh=>(mesh.primitives||[]).map(primitive=>{
  if(primitive.mode!==undefined&&primitive.mode!==4)throw Error('Yalnızca GLB TRIANGLES destekleniyor');
  if(primitive.attributes?.POSITION===undefined)throw Error('GLB POSITION eksik');
  const positions=accessor(primitive.attributes.POSITION),normals=primitive.attributes.NORMAL!==undefined?accessor(primitive.attributes.NORMAL):null;
  const colors=primitive.attributes.COLOR_0!==undefined?accessor(primitive.attributes.COLOR_0):null;
  const idx=primitive.indices!==undefined?accessor(primitive.indices).map(row=>row[0]):positions.map((_,i)=>i);
  if(idx.length%3||idx.length>MAX_VERTICES)throw Error('GLB üçgen sayısı geçersiz');
  const base=json.materials?.[primitive.material||0]?.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1];
  return {positions,normals,colors,indices:idx,base};
 }));
 const nodes=json.nodes||[],roots=json.scenes?.[json.scene||0]?.nodes||[];
 const animations=(json.animations||[]).map(anim=>({name:anim.name||'clip',channels:(anim.channels||[]).map(ch=>({node:ch.target.node,path:ch.target.path,interpolation:anim.samplers[ch.sampler].interpolation||'LINEAR',times:accessor(anim.samplers[ch.sampler].input).map(v=>v[0]),values:accessor(anim.samplers[ch.sampler].output)}))}));
 function geometry({clip=null,time=0,tint=[1,1,1],offset=[0,0,0],scale=1}={}){
  const overrides=new Map(),animation=animations.find(a=>a.name===clip);
  for(const ch of animation?.channels||[]){if(!['translation','rotation','scale'].includes(ch.path)||!ch.times.length||ch.interpolation==='CUBICSPLINE')continue;
   let i=0;const duration=ch.times.at(-1);const t=duration>0?((time%duration)+duration)%duration:0;
   while(i+1<ch.times.length&&ch.times[i+1]<t)i++;
   let f=i+1<ch.times.length?(t-ch.times[i])/(ch.times[i+1]-ch.times[i]||1):0;
   if(ch.interpolation==='STEP')f=0;
   const a=ch.values[i],b=ch.values[Math.min(i+1,ch.values.length-1)];
   const value=ch.path==='rotation'?mixRotation(a,b,f):a.map((x,j)=>x+(b[j]-x)*f);
   if(!overrides.has(ch.node))overrides.set(ch.node,{});overrides.get(ch.node)[ch.path]=value;
  }
  const vertices=[],visited=new Set();
  function visit(id,parent,depth){if(depth>40||visited.has(id))throw Error('GLB node grafiği geçersiz');visited.add(id);const node=nodes[id];if(!node)throw Error('GLB node yok');
   const o=overrides.get(id)||{};const local=node.matrix&&!Object.keys(o).length?node.matrix:trs(o.translation||node.translation,o.rotation||node.rotation,o.scale||node.scale);
   const m=multiply(parent,local);
   if(node.mesh!==undefined)for(const primitive of objects[node.mesh]||[]){const {positions,normals,colors,indices,base}=primitive;
    for(let k=0;k<indices.length;k+=3){const a=positions[indices[k]],b=positions[indices[k+1]],d=positions[indices[k+2]];
     if(!a||!b||!d)throw Error('GLB üçgen indeksi geçersiz');
     const u=b.map((x,j)=>x-a[j]),v=d.map((x,j)=>x-a[j]);const cross=normal([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]);
     for(let q=0;q<3;q++){const index=indices[k+q],p=transform(m,positions[index]);const n=normal(transform(m,normals?.[index]||cross,0));const f=colors?.[index]||[1,1,1];
      vertices.push(offset[0]+p[0]*scale,offset[1]+p[1]*scale,offset[2]+p[2]*scale,...n,...[0,1,2].map(z=>c((base[z]??1)*(f[z]??1)*(tint[z]??1),0,1)));
     }
    }
   }
   for(const child of node.children||[])visit(child,m,depth+1);visited.delete(id);
  }
  for(const id of roots)visit(id,identity(),0);
  if(vertices.length/9>MAX_VERTICES)throw Error('GLB sahnesi çok büyük');
  return new Float32Array(vertices);
 }
 return {geometry,animations:animations.map(a=>a.name),meshCount:objects.length,nodeCount:nodes.length};
}
export async function fetchGLB(url,{fetcher=fetch,signal}={}){
 const response=await fetcher(url,{signal});if(!response.ok)throw Error('GLB indirilemedi: '+response.status);
 const array=await response.arrayBuffer();return parseGLB(array);
}
