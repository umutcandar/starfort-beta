/** STARFORT v2.40 — procedural, animated WebGL2 boss sculptures.
 * Three spatial dimensions + time-driven rig motion (not literal four spatial dimensions).
 * No untrusted model downloads, no textures, no dependency and no combat authority.
 * Static v2.39 SVG remains available on old/low-power devices.
 */
const VS=`#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uProjection;
uniform vec3 uOffset;
uniform vec3 uSize;
uniform vec3 uSpin;
uniform float uOrbit;
out vec3 vNormal;
out vec3 vWorld;
vec3 rotateX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 rotateY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rotateZ(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}
void main(){
 vec3 p=aPosition*uSize;
 p=rotateX(rotateY(rotateZ(p,uSpin.z),uSpin.y),uSpin.x);
 p+=uOffset;
 p=rotateY(p,uOrbit);
 vec3 norm=rotateX(rotateY(rotateZ(aNormal,uSpin.z),uSpin.y),uSpin.x);
 vNormal=normalize(rotateY(norm,uOrbit));
 vWorld=p;
 gl_Position=uProjection*vec4(p.x,p.y,p.z-9.,1.);
}`;
const FS=`#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vWorld;
uniform vec3 uTint;
uniform float uGlow;
out vec4 color;
void main(){
 vec3 n=normalize(vNormal);
 float light=.38+.57*max(0.,dot(n,normalize(vec3(-.5,.85,1.))));
 light+=.24*max(0.,dot(n,normalize(vec3(.9,.35,-.6))));
 vec3 c=uTint*light+uTint*uGlow*.35;
 c=mix(c,vec3(.16,.22,.32),min(.24,max(0.,-vWorld.y)*.08));
 color=vec4(c,1.);
}`;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
function meshBuilder(){
 const points=[];
 const tri=(a,b,c,n)=>{for(const v of [a,b,c])points.push(...v,...n);};
 const quad=(a,b,c,d,n)=>{tri(a,b,c,n);tri(a,c,d,n);};
 return {tri,quad,result:()=>new Float32Array(points)};
}
function cube(){
 const m=meshBuilder();
 const sides=[
  [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
  [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
  [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
  [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
  [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
  [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
 ];
 for(const f of sides)m.quad(...f);return m.result();
}
function orb(latitude=12,longitude=16){
 const m=meshBuilder(),p=(phi,theta)=>[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];
 for(let i=0;i<latitude;i++)for(let j=0;j<longitude;j++){
  const a=p(i*Math.PI/latitude,j*2*Math.PI/longitude),b=p((i+1)*Math.PI/latitude,j*2*Math.PI/longitude),
   c=p((i+1)*Math.PI/latitude,(j+1)*2*Math.PI/longitude),d=p(i*Math.PI/latitude,(j+1)*2*Math.PI/longitude);
  m.tri(a,b,c,a);m.tri(a,c,d,a);
 }
 return m.result();
}
function cone(rings=14){
 const m=meshBuilder();for(let i=0;i<rings;i++){
  const a=i*2*Math.PI/rings,b=(i+1)*2*Math.PI/rings;
  const p=[Math.cos(a),-1,Math.sin(a)],q=[Math.cos(b),-1,Math.sin(b)],tip=[0,1,0];
  m.tri(p,q,tip,[Math.cos((a+b)/2),.43,Math.sin((a+b)/2)]);
  m.tri([0,-1,0],q,p,[0,-1,0]);
 }return m.result();
}
function ring(tubes=20,sides=7){
 const m=meshBuilder(),p=(i,j)=>{const u=i/tubes*Math.PI*2,v=j/sides*Math.PI*2,
  r=1+.11*Math.cos(v);return [r*Math.cos(u),.11*Math.sin(v),r*Math.sin(u)]};
 for(let i=0;i<tubes;i++)for(let j=0;j<sides;j++){
  const a=p(i,j),b=p(i+1,j),c=p(i+1,j+1),d=p(i,j+1);
  m.tri(a,b,c,[0,1,0]);m.tri(a,c,d,[0,1,0]);
 }return m.result();
}
const GEOMETRY=Object.freeze({cube:cube(),orb:orb(),cone:cone(),ring:ring()});
const PALETTE=Object.freeze([
 Object.freeze({skin:[.31,.55,.37],dark:[.18,.34,.23],light:[.67,.8,.43],energy:[.71,.9,.52],ground:[.20,.34,.28]}),
 Object.freeze({skin:[.49,.65,.87],dark:[.27,.3,.54],light:[.81,.88,1],energy:[.37,.75,1],ground:[.20,.32,.50]}),
 Object.freeze({skin:[.83,.33,.17],dark:[.41,.19,.18],light:[1,.66,.3],energy:[1,.31,.13],ground:[.37,.22,.21]}),
 Object.freeze({skin:[.45,.32,.72],dark:[.18,.16,.35],light:[.8,.63,1],energy:[.77,.45,1],ground:[.21,.19,.39]})
]);
const part=(mesh,offset,size,color,kind='')=>({mesh,offset,size,color,kind});
export function shadow3DParts(stage){
 const id=clamp(Math.trunc(stage),1,4),p=PALETTE[id-1],out=[];
 out.push(part('orb',[0,-2.35,0],[2,.13,1.3],p.ground,'ground'));
 if(id===1){
  // Tree body, twisting roots, independently bobbing crown and protruding thorns.
  out.push(part('cone',[0,-.30,0],[.92,1.55,.86],p.dark,'torso'));
  out.push(part('orb',[0,.94,.09],[.72,.7,.68],p.skin,'head'));
  out.push(part('orb',[0,.91,.66],[.42,.23,.13],p.light,'eye'));
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3,x=Math.sin(a),z=Math.cos(a);
   out.push(part('cone',[x*.8,-1.63,z*.62],[.30,.82,.28],p.dark,'root'));
   out.push(part('cone',[x*1.08,.20+(i%2)*.44,z*.75],[.22,.90,.23],p.light,'thorn'));
  }
  out.push(part('ring',[0,.93,.08],[1.05,.1,.86],p.energy,'halo'));
 }else if(id===2){
  out.push(part('cone',[0,-.60,0],[.86,1.55,.76],p.dark,'torso'));
  out.push(part('orb',[0,.80,.09],[.66,.74,.61],p.light,'head'));
  out.push(part('orb',[0,.89,.63],[.39,.24,.11],p.energy,'eye'));
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;
   out.push(part('cone',[Math.sin(a)*.72,-.14,Math.cos(a)*.65],[.18,1.20,.18],i%2?p.skin:p.light,'tentacle'));
  }
  for(let i=0;i<3;i++)out.push(part('ring',[0,-1.1+i*.42,0],[1.30-i*.2,.12,1.14-i*.16],p.energy,'orbit'));
 }else if(id===3){
  out.push(part('orb',[0,-.16,0],[1.05,1.35,.8],p.dark,'torso'));
  out.push(part('cone',[0,1.20,0],[.72,.87,.64],p.light,'head'));
  for(let i=0;i<7;i++){const a=i*2*Math.PI/7;
   out.push(part('cone',[Math.sin(a)*1.30,.20,Math.cos(a)*.59],[.31,.95,.27],p.energy,'flame'));
  }
  for(let s of [-1,1]){
   out.push(part('cube',[s*1.33,.23,0],[.45,.43,.42],p.skin,'arm'));
   out.push(part('cone',[s*1.6,-.36,.06],[.29,.65,.32],p.light,'claw'));
   out.push(part('cone',[s*.48,-1.94,.04],[.32,.79,.31],p.dark,'leg'));
  }
  out.push(part('orb',[0,.45,.82],[.36,.46,.18],p.energy,'eye'));
 }else{
  out.push(part('cone',[0,-.65,0],[1.14,1.64,.82],p.dark,'cape'));
  out.push(part('cube',[0,.06,.25],[.67,.96,.52],p.skin,'torso'));
  out.push(part('orb',[0,1.16,.24],[.50,.59,.48],p.light,'head'));
  out.push(part('orb',[0,1.16,.7],[.34,.18,.12],p.energy,'eye'));
  for(let i=0;i<7;i++){const x=(i-3)*.24;
   out.push(part('cone',[x,1.88+Math.cos(i)*.12,.15],[.12,.48,.12],i%2?p.energy:p.light,'crown'))}
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;
   out.push(part('cube',[Math.sin(a)*1.55,.1+Math.cos(a)*.45,Math.cos(a)*.8],[.24,.46,.27],p.energy,'orbit'))}
  out.push(part('ring',[0,1.12,.15],[1.27,.11,1.20],p.energy,'halo'));
 }
 return out;
}
export function shadow3DSceneSignature(stage,phase=1,intent='strike'){
 const id=clamp(Math.trunc(stage),1,4),wave=clamp(Math.trunc(phase),1,3);
 return Object.freeze({stage:id,wave,intent:['strike','shield','drain','crush'].includes(intent)?intent:'strike',
  pieces:shadow3DParts(id).length});
}
function compile(gl,type,source){
 const s=gl.createShader(type);if(!s)return null;gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;
}
function program(gl){
 const a=compile(gl,gl.VERTEX_SHADER,VS),b=compile(gl,gl.FRAGMENT_SHADER,FS);
 if(!a||!b)return null;
 const p=gl.createProgram();gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);
 gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS)){gl.deleteProgram(p);return null;}return p;
}
function projection(aspect){
 const f=1/Math.tan(50*Math.PI/360),near=.1,far=120,nf=1/(near-far);
 return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
export function createShadow3D(canvas,{stage=1,reduceMotion=false}={}){
 if(!canvas?.getContext)return {ok:false,sync(){},destroy(){}};
 let gl=null,shader=null;
 try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(gl)shader=program(gl);}catch{}
 if(!gl||!shader)return {ok:false,sync(){},destroy(){}};
 const bufferByMesh=new Map(),parts=shadow3DParts(stage),palette=PALETTE[clamp(stage,1,4)-1];
 const attrs={p:gl.getAttribLocation(shader,'aPosition'),n:gl.getAttribLocation(shader,'aNormal')};
 const loc={projection:gl.getUniformLocation(shader,'uProjection'),offset:gl.getUniformLocation(shader,'uOffset'),
  size:gl.getUniformLocation(shader,'uSize'),spin:gl.getUniformLocation(shader,'uSpin'),
  orbit:gl.getUniformLocation(shader,'uOrbit'),tint:gl.getUniformLocation(shader,'uTint'),glow:gl.getUniformLocation(shader,'uGlow')};
 for(const [id,vertices] of Object.entries(GEOMETRY)){
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  bufferByMesh.set(id,{buf,count:vertices.length/6});
 }
 const orbit=[[-1.0,-.5],[0.2,0.8],[1.1,-.5],[-.3,.7]];let raf=0,wave=1,intent='strike',enraged=false,
  hits=0,sceneAt=0,disposed=false,runAt=0,visible=true;
 const reduced=Boolean(reduceMotion);
 let observer=null;
 const stop=()=>{if(raf){cancelAnimationFrame(raf);raf=0;}};
 function frame(now){
  raf=0;if(disposed||!visible)return;
  const width=Math.max(1,Math.round(canvas.getBoundingClientRect().width)),
   height=Math.max(1,Math.round(canvas.getBoundingClientRect().height));
  const dpr=Math.min(1.5,globalThis.devicePixelRatio||1);
  const cw=Math.max(1,Math.round(width*dpr)),ch=Math.max(1,Math.round(height*dpr));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  gl.viewport(0,0,cw,ch);gl.clearColor(0,0,0,0);gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.useProgram(shader);
  gl.uniformMatrix4fv(loc.projection,false,projection(cw/ch));
  const t=reduced?0:(now-runAt)/1000;
  const phase=wave===3?1.19:1;
  const theta=reduced?0:Math.sin(t*.25)*.14+(intent==='crush'?Math.sin(t*1.3)*.05:0);
  const impact=reduced?0:Math.max(0,1-(now-sceneAt)/390)*(hits?1:0);
  for(let i=0;i<parts.length;i++){
   const p=parts[i],geometry=bufferByMesh.get(p.mesh);if(!geometry)continue;
   let x=p.offset[0],y=p.offset[1],z=p.offset[2];
   let sx=p.size[0],sy=p.size[1],sz=p.size[2],spinY=0,spinX=0,spinZ=0;
   if(p.kind==='head'||p.kind==='torso'){y+=Math.sin(t*1.5)*.07;spinZ+=Math.sin(t*.85)*.035}
   if(['thorn','root','tentacle','flame','claw','arm'].includes(p.kind)){
     spinZ+=Math.sin(t*1.7+i*1.4)*(p.kind==='flame'?.35:.13);
     spinX+=Math.sin(t*1.2+i)*.12;
   }
   if(p.kind==='orbit'||p.kind==='halo'){spinY+=t*.4+i*.4;sy*=1+Math.sin(t*.9+i)*.11}
   if(p.kind==='eye'){sy*=1+Math.sin(t*2.5)*.14}
   if(p.kind==='cape'){sx*=1+Math.sin(t)*.045}
   if(wave===3){sx*=phase;sy*=phase;sz*=phase;}
   if(impact&&p.kind!=='ground'){x+=Math.sin(i*3.2)*impact*.065;z+=Math.cos(i)*impact*.06;}
   const rgb=p.color,glow=(p.kind==='eye'||p.kind==='halo'||p.kind==='orbit'||p.kind==='flame')?.48+.13*Math.sin(t*2):0;
   gl.bindBuffer(gl.ARRAY_BUFFER,geometry.buf);
   gl.enableVertexAttribArray(attrs.p);gl.vertexAttribPointer(attrs.p,3,gl.FLOAT,false,24,0);
   gl.enableVertexAttribArray(attrs.n);gl.vertexAttribPointer(attrs.n,3,gl.FLOAT,false,24,12);
   gl.uniform3f(loc.offset,x,y,z);
   gl.uniform3f(loc.size,sx,sy,sz);
   gl.uniform3f(loc.spin,spinX,spinY,spinZ);
   gl.uniform1f(loc.orbit,theta);
   gl.uniform3f(loc.tint,rgb[0],rgb[1],rgb[2]);
   gl.uniform1f(loc.glow,glow+(enraged?.20:0));
   gl.drawArrays(gl.TRIANGLES,0,geometry.count);
  }
  if(!reduced)raf=requestAnimationFrame(frame);
 }
 const onLost=e=>{e.preventDefault();visible=false;stop();};
 canvas.addEventListener('webglcontextlost',onLost);
 if(typeof IntersectionObserver==='function'){
  observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;
   if(visible)paint();else stop();},{threshold:0});
  observer.observe(canvas);
 }
 function paint(){if(disposed||!visible)return;stop();raf=requestAnimationFrame(frame);}
 const api={ok:true,sync(next={}){
  wave=clamp(next.wave||1,1,3);
  intent=['strike','crush','shield','drain'].includes(next.intent)?next.intent:'strike';
  enraged=Boolean(next.enraged);paint();
 },hit(){hits++;sceneAt=performance.now();paint();},destroy(){
  disposed=true;stop();observer?.disconnect();canvas.removeEventListener('webglcontextlost',onLost);
  for(const item of bufferByMesh.values())gl.deleteBuffer(item.buf);
  gl.deleteProgram(shader);bufferByMesh.clear();
 }};
 runAt=performance.now();api.sync({wave,intent,enraged});return api;
}
