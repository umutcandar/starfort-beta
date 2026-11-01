/** Starfort Graphics Core v2 — self-contained GPU sprite/particle compositor.
 * The server remains the sole authority for combat. This module only draws.
 * No CDN, third-party runtime, cookies, telemetry or network access.
 */
export const WORLD_WIDTH=1000, WORLD_HEIGHT=600;
export const QUALITY={performance:{dpr:1,particles:15,glow:0,camera:0},balanced:{dpr:1.5,particles:48,glow:1,camera:1},ultra:{dpr:2,particles:100,glow:2,camera:1}};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function qualityConfig(quality='balanced'){return QUALITY[quality]||QUALITY.balanced;}
export function cameraFor(player=null,quality='balanced',reduced=false){
  const cfg=qualityConfig(quality);if(!player||!cfg.camera||reduced)return {x:0,y:0,zoom:1};
  // Bounded camera tracking: no divergence between visuals and server-side coordinates.
  return {x:clamp((player.x-50)*10*.11,-42,42),y:clamp((player.y-30)*10*.09,-23,23),zoom:1.035};
}
export function screenToWorld(x,y,camera={x:0,y:0,zoom:1}){
  return {x:(x-500)/camera.zoom+500+camera.x,y:(y-300)/camera.zoom+300+camera.y};
}
export function worldToScreen(x,y,camera={x:0,y:0,zoom:1}){
  return {x:(x-500-camera.x)*camera.zoom+500,y:(y-300-camera.y)*camera.zoom+300};
}
const VERT=`#version 300 es
precision mediump float;
in vec2 aPos; in vec2 aUV; in vec4 aColor;
uniform vec2 uSize; out vec2 vUV; out vec4 vColor;
void main(){ vec2 p=vec2(aPos.x/uSize.x, aPos.y/uSize.y);gl_Position=vec4(p*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vUV=aUV;vColor=aColor;}`;
const FRAG=`#version 300 es
precision mediump float;in vec2 vUV;in vec4 vColor;uniform sampler2D uTex;out vec4 outColor;
void main(){outColor=texture(uTex,vUV)*vColor;}`;
function compile(gl,type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('GPU shader: '+e)}return s;}
function makeProgram(gl){const p=gl.createProgram(),vs=compile(gl,gl.VERTEX_SHADER,VERT),fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('GPU link: '+gl.getProgramInfoLog(p));return p;}
export function createGraphicsCore(canvas,{quality='ultra',reducedMotion=false}={}){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,premultipliedAlpha:true,desynchronized:true,preserveDrawingBuffer:false});
  if(!gl)throw Error('WebGL2 desteklenmiyor');
  const program=makeProgram(gl),buffer=gl.createBuffer(),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const stride=8*4;const loc=(name)=>gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc('aPos'));gl.vertexAttribPointer(loc('aPos'),2,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(loc('aUV'));gl.vertexAttribPointer(loc('aUV'),2,gl.FLOAT,false,stride,8);
  gl.enableVertexAttribArray(loc('aColor'));gl.vertexAttribPointer(loc('aColor'),4,gl.FLOAT,false,stride,16);
  gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'uSize'),WORLD_WIDTH,WORLD_HEIGHT);gl.uniform1i(gl.getUniformLocation(program,'uTex'),0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
  const white=new Uint8Array([255,255,255,255]);let destroyed=false,lastCount=0,contextLost=false;
  const textures=new Map();let draws=[],cam={x:0,y:0,zoom:1},q=quality,red=!!reducedMotion;
  function texture(id,img=null){if(textures.has(id))return textures.get(id);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,white);
    if(img && (img.naturalWidth||img.width))gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    textures.set(id,t);return t;}
  texture('__white');
  function unload(id){const tex=textures.get(id);if(tex){gl.deleteTexture(tex);textures.delete(id);}}
  function upload(id,img){if(destroyed||!img)return;const t=texture(id);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
  function resize(w=canvas.clientWidth||1000,h=canvas.clientHeight||600,dpr=1){const scale=Math.min(2.5,qualityConfig(q).dpr,Math.max(1,dpr));const width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);}
  function begin({quality=q,camera=cam,reducedMotion=red}={}){lastCount=0;draws=[];q=quality;cam=camera;red=reducedMotion;gl.clearColor(.025,.055,.082,1);gl.clear(gl.COLOR_BUFFER_BIT);}
  // World sprites share a camera; screen-space frames are unaffected by movement.
  function quad(id,x,y,w,h,{color=[1,1,1,1],rotation=0,screen=false,blend='alpha',uv=[0,0,1,1],anchor=[.5,.5]}={}){
    if(!Number.isFinite(x+y+w+h)||w<=0||h<=0)return;
    let pos=screen?{x,y}:worldToScreen(x,y,cam);let zw=screen?1:cam.zoom;
    draws.push({id,x:pos.x,y:pos.y,w:w*zw,h:h*zw,color,rotation,blend,uv,anchor});
  }
  function bar(x,y,w,h,percent,colour=[.28,.78,.82,1],screen=false){quad('__white',x,y,w,h,{color:[.025,.065,.105,.91],screen});if(percent>0)quad('__white',x-w*(1-clamp(percent,0,1))/2,y,w*clamp(percent,0,1),h,{color:colour,screen});}
  function flush(){if(contextLost||destroyed)return;gl.useProgram(program);gl.bindVertexArray(vao);gl.activeTexture(gl.TEXTURE0);let current=null,mode=null,count=0,packed=[];
    function drawBatch(){if(!count)return;const data=new Float32Array(packed);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STREAM_DRAW);gl.bindTexture(gl.TEXTURE_2D,texture(current));gl.blendFunc(mode==='add'?gl.SRC_ALPHA:gl.SRC_ALPHA,mode==='add'?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,count);lastCount+=count;packed=[];count=0;}
    for(const d of draws){if(d.id!==current||d.blend!==mode){drawBatch();current=d.id;mode=d.blend;}
      const [u0,v0,u1,v1]=d.uv,[r,g,b,a]=d.color,c=Math.cos(d.rotation),s=Math.sin(d.rotation);
      const xy=[[0,0],[1,0],[1,1],[0,1]].map(([px,py])=>{const dx=(px-d.anchor[0])*d.w,dy=(py-d.anchor[1])*d.h;return [d.x+dx*c-dy*s,d.y+dx*s+dy*c]});
      const verts=[[0,u0,v0],[1,u1,v0],[2,u1,v1],[0,u0,v0],[2,u1,v1],[3,u0,v1]];
      for(const [i,u,v]of verts)packed.push(xy[i][0],xy[i][1],u,v,r,g,b,a);count+=6;
    }drawBatch();
  }
  function setQuality(next){q=next;}
  function setReducedMotion(value){red=!!value;}
  const onLost=e=>{e.preventDefault();contextLost=true;},onRestore=()=>{contextLost=false;};
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestore);
  return {gl,kind:'webgl2',quad,bar,upload,unload,texture,begin,flush,resize,setQuality,setReducedMotion,toWorld:(x,y)=>screenToWorld(x,y,cam),get camera(){return cam;},stats:()=>({sprites:draws.length,vertices:lastCount,textures:textures.size}),dispose(){if(destroyed)return;destroyed=true;for(const t of textures.values())gl.deleteTexture(t);gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteProgram(program);textures.clear();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestore);}};
}

/** Same scene commands on Canvas2D; no divergent gameplay or legacy artwork. */
export function createCanvasGraphicsCore(canvas,{quality='balanced',reducedMotion=false}={}){
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D yok');
  const textures=new Map(),draws=[];let camera={x:0,y:0,zoom:1},q=quality,red=reducedMotion,vertices=0;
  function upload(id,img){textures.set(id,img)}
  function unload(id){textures.delete(id)}
  function resize(w=1000,h=600,dpr=1){const scale=Math.min(qualityConfig(q).dpr,Math.max(1,dpr));const ww=Math.round(w*scale),hh=Math.round(h*scale);if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh;}ctx.setTransform(canvas.width/1000,0,0,canvas.height/600,0,0);}
  function begin({quality=q,camera:cam=camera,reducedMotion=red}={}){q=quality;camera=cam;red=reducedMotion;draws.length=0;vertices=0;ctx.setTransform(canvas.width/1000,0,0,canvas.height/600,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#081726';ctx.fillRect(0,0,1000,600);}
  function quad(id,x,y,w,h,{color=[1,1,1,1],rotation=0,screen=false,blend='alpha',uv=[0,0,1,1],anchor=[.5,.5]}={}){if(!Number.isFinite(x+y+w+h)||w<=0||h<=0)return;const p=screen?{x,y}:worldToScreen(x,y,camera);draws.push({id,x:p.x,y:p.y,w:w*(screen?1:camera.zoom),h:h*(screen?1:camera.zoom),rotation,color,blend,uv,anchor});}
  function bar(x,y,w,h,p,colour=[.28,.78,.82,1],screen=false){quad('__white',x,y,w,h,{color:[.02,.06,.1,.9],screen});const v=clamp(p,0,1);if(v>0)quad('__white',x-w*(1-v)/2,y,w*v,h,{color:colour,screen});}
  function flush(){for(const d of draws){ctx.save();ctx.globalAlpha=d.color[3];ctx.globalCompositeOperation=d.blend==='add'?'lighter':'source-over';ctx.translate(d.x,d.y);ctx.rotate(d.rotation);const x=-d.anchor[0]*d.w,y=-d.anchor[1]*d.h;const tex=textures.get(d.id);
      if(d.id==='__white'||!tex){ctx.fillStyle=d.id==='__white'?`rgb(${d.color.slice(0,3).map(v=>Math.round(v*255)).join(',')})`:'#284257';ctx.fillRect(x,y,d.w,d.h);}
      else{const [u0,v0,u1,v1]=d.uv;const tw=tex.naturalWidth||tex.width,th=tex.naturalHeight||tex.height;const sx=Math.min(u0,u1)*tw,sy=Math.min(v0,v1)*th,sw=Math.abs(u1-u0)*tw,sh=Math.abs(v1-v0)*th;
        if(sw>0&&sh>0){if(u1<u0){ctx.translate(d.w*(1-d.anchor[0]*2),0);ctx.scale(-1,1);}ctx.drawImage(tex,sx,sy,sw,sh,x,y,d.w,d.h)}
      }ctx.restore();vertices+=6;}}
  return {kind:'canvas2d-v2',upload,unload,resize,begin,quad,bar,flush,setQuality(next){q=next;},toWorld:(x,y)=>screenToWorld(x,y,camera),stats:()=>({sprites:draws.length,vertices,textures:textures.size}),dispose(){textures.clear();draws.length=0;}};
}
