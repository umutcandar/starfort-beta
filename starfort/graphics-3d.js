/** STARFORT Experimental 3D — actual perspective, lit triangle meshes, depth testing.
 * No procedural geometry modifies the authoritative server simulation.
 * Designed for landscape screens. If WebGL2 is unavailable use the existing renderer.
 */
import {cameraMatrix,clamp3,world3,server3,pickGround} from './graphics-3d-math.js';
import {rigPose,rigBones} from './graphics-3d-rig.js';
import {create3DResolutionManager} from './graphics-3d-performance.js';
import {createBattleMotion} from './battle-motion.js';
import {fetchGLB} from './graphics-gltf.js';

const VERT=`#version 300 es
precision highp float;
in vec3 aPosition; in vec3 aNormal; in vec3 aColor;
uniform mat4 uCamera; out vec3 vColor; out vec3 vWorld; out float vLight;
void main(){gl_Position=uCamera*vec4(aPosition,1.);vWorld=aPosition;vColor=aColor;
vec3 sun=normalize(vec3(-.35,.78,.46));vLight=.48+max(0.,dot(normalize(aNormal),sun))*.52;}`;
const FRAG=`#version 300 es
precision highp float;
in vec3 vColor;in vec3 vWorld;in float vLight;out vec4 outColor;
void main(){float fog=smoothstep(30.,120.,length(vWorld.xz));
vec3 c=pow(vColor*mix(.75,1.2,vLight),vec3(.92));
c=mix(c,vec3(.18,.28,.36),fog*.30);outColor=vec4(c,1.);}`;
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('3D shader: '+gl.getShaderInfoLog(s));return s;}
function createProgram(gl){const v=shader(gl,gl.VERTEX_SHADER,VERT),f=shader(gl,gl.FRAGMENT_SHADER,FRAG),p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('3D shader bağlantısı: '+gl.getProgramInfoLog(p));return p;}
const BLUE=[.18,.50,.76],RED=[.67,.20,.23],STONE=[.43,.46,.48],GOLD=[.86,.67,.34],WHITE=[.85,.84,.73],BLACK=[.15,.19,.23];
const lerp=(a,b,t)=>a+(b-a)*t;
const color=(c,m=1)=>c.map(x=>clamp3(x*m,0,1));
const cubeFaces=[
  {n:[0,1,0],q:[[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]],s:1.16},
  {n:[0,-1,0],q:[[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,-1,-1]],s:.52},
  {n:[0,0,1],q:[[1,-1,1],[-1,-1,1],[-1,1,1],[1,1,1]],s:.93},
  {n:[0,0,-1],q:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]],s:.68},
  {n:[1,0,0],q:[[1,-1,-1],[1,-1,1],[1,1,1],[1,1,-1]],s:.86},
  {n:[-1,0,0],q:[[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]],s:.74}
];
class MeshBatch {
  constructor(){this.a=[];this.faces=0;}
  tri(p,n,c){this.a.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2]);}
  quad(a,b,c,d,n,col){this.tri(a,n,col);this.tri(b,n,col);this.tri(c,n,col);this.tri(a,n,col);this.tri(c,n,col);this.tri(d,n,col);this.faces+=2;}
  box(x,y,z,w,h,d,col,{yaw=0,tilt=0,faceStart=0}={}){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),ct=Math.cos(tilt),st=Math.sin(tilt);
    const transform=p=>{let px=p[0]*w*.5,py=p[1]*h*.5,pz=p[2]*d*.5;
      const tx=px*ct-py*st,ty=px*st+py*ct;px=tx;py=ty;
      return [x+px*cy-pz*sy,y+py,z+px*sy+pz*cy];};
    for(let i=faceStart;i<cubeFaces.length;i++){const f=cubeFaces[i],q=f.q.map(transform);const nx=f.n[0]*ct-f.n[1]*st,ny=f.n[0]*st+f.n[1]*ct,nz=f.n[2];
      this.quad(...q,[nx*cy-nz*sy,ny,nx*sy+nz*cy],color(col,f.s));}
  }
  segment(a,b,w,d,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
    const length=Math.hypot(dx,dy)||.001;
    this.box((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,w,length,d,col,{tilt:-Math.atan2(dx,dy),yaw:Math.atan2(dz,Math.max(.001,length))});
  }
  ground(x,z,w,d,col){this.quad([x-w/2,.015,z+d/2],[x-w/2,.015,z-d/2],[x+w/2,.015,z-d/2],[x+w/2,.015,z+d/2],[0,1,0],col);}
  prism(x,y,z,r,h,col,n=8){const top=y+h/2,bot=y-h/2;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n,pa=[x+Math.cos(a)*r,z+Math.sin(a)*r],pb=[x+Math.cos(b)*r,z+Math.sin(b)*r],norm=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];this.quad([pa[0],bot,pa[1]],[pb[0],bot,pb[1]],[pb[0],top,pb[1]],[pa[0],top,pa[1]],norm,col);} }
  pyramid(x,y,z,r,h,col,n=6){for(let i=0;i<n;i++){let a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;const aa=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],bb=[x+Math.cos(b)*r,y,z+Math.sin(b)*r],cc=[x,y+h,z];this.tri(aa,[0,1,0],col);this.tri(bb,[0,1,0],col);this.tri(cc,[0,1,0],col);this.faces++;}}
}
function drawBanner(mesh,x,z,team,time){mesh.box(x,5,z,.2,10,.2,BLACK);mesh.box(x+1.25,7,z,2.6,3,.15,team?RED:BLUE,{tilt:Math.sin(time*2+x)*.07});mesh.box(x+1.2,8.9,z,3,.28,.3,GOLD);}
function drawWall(mesh,gateHp=1,time=0){
  for(const sign of [-1,1]){
    for(let j=0;j<5;j++){
      const z=sign*(8+j*5),s=1+(j%2)*.04;
      mesh.box(0,7.4,z,4,14.8,5,color(STONE,s));
      mesh.box(0,15,z,5.5,1,5.5,[.55,.54,.48]);
      for(let p=-1;p<=1;p++)mesh.box(.1,16.7,z+p*1.8,4.7,2.4,1.25,[.57,.55,.49]);
    }
  }
  for(const z of [-33,-8,8,33]){mesh.prism(0,10.5,z,4,21,[.44,.47,.48],10);mesh.prism(0,21,z,5.2,2,[.56,.55,.48],10);mesh.pyramid(0,22,z,5.3,7,[.17,.28,.42]);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;mesh.box(Math.cos(a)*4.3,24,z+Math.sin(a)*4.3,1.9,3,1.9,[.62,.61,.55],{yaw:a});}
  }
  // Gate state is driven by server HP, not by local prediction.
  mesh.box(0,15,0,6,7.2,16,[.51,.48,.44]);
  const stage=gateHp<=0?3:gateHp<.3?2:gateHp<.65?1:0;
  if(stage<3){const c=stage===0?[.38,.24,.13]:stage===1?[.32,.22,.15]:[.23,.19,.17];
    mesh.box(-2.45,5,0,1.3,10.1,11.5,c);
    for(let z=-4.5;z<=4.5;z+=1.6)mesh.box(-3.18,5,z,.23,9.7,.15,[.52,.35,.20]);
    for(let y=2;y<9;y+=3)mesh.box(-3.45,y,0,.4,.6,12,[.18,.22,.24]);
  }else for(let i=0;i<11;i++){mesh.box(-2.3,1+(i%3)*.37,-4.5+i*.85,1.5+(i%3)*.4,1.1,.85,[.38,.37,.34],{yaw:i*.5});}
  drawBanner(mesh,-2,15,-0,time);drawBanner(mesh,-2,-15,1,time);
  for(const x of [14,29])for(const z of [-22,22]){
    mesh.box(x,5,z,9,10,9,[.48,.46,.42]);mesh.pyramid(x,10,z,7,7,[.20,.26,.37],4);
  }
  mesh.prism(29,12,0,7,24,[.44,.47,.49],12);mesh.pyramid(29,24,0,9,11,[.23,.30,.43],8);
  mesh.prism(29,27,0,2.5,5,[.33,.69,.90],8);
}
function drawActor(mesh,item,pose,time,hero,quality,reducedMotion){
  // Segment bones are actually articulated; all animation is presentation-only.
  const side=item.team||0,main=side?RED:BLUE,p=world3(pose?.x??item.x,pose?.y??item.y),x=p.x,z=p.z;
  const action=item.action==='attack'||item.action==='cast'?item.action:'idle';
  const health=Math.max(0,Math.min(1,(item.hp||0)/Math.max(1,item.maxHp||100)));
  const poseState=rigPose({action,speed:pose?.speed||0,walk:pose?.walk||0,
    hit:pose?.hit||0,life:health,attackPhase:((time+(Number(item.attackAt)||0))%1),castPhase:time%1},time,{reducedMotion});
  const scale=hero?1.48:1;const bones=rigBones(poseState,scale);
  const yaw=(pose?.face||(side?-1:1))>0?Math.PI/2:-Math.PI/2;
  const armor=color(main,poseState.state==='hit'?.9:1),shoulder=bones.shoulder,hip=bones.hip;
  // Ground-contact shadow, differentiated by team; no gameplay hitbox changes.
  mesh.box(x,.035,z,hero?2.7:1.75,.06,hero?1.55:1.05,[.085,.10,.12]);
  // Boots, knees and hips follow rig joints instead of static rotating cubes.
  for(const part of bones.legs){
    const [a,k,b]=[part.hip,part.knee,part.boot],c=[.23,.28,.34];
    mesh.segment([x+a[0],a[1],z+a[2]],[x+k[0],k[1],z+k[2]],.40*scale,.46*scale,c);
    mesh.segment([x+k[0],k[1],z+k[2]],[x+b[0],Math.max(.27,b[1]),z+b[2]],.38*scale,.44*scale,[.29,.33,.38]);
    mesh.box(x+b[0]-.12*scale,Math.max(.2,b[1]-.10*scale),z+b[2]+.17*scale,.59*scale,.26*scale,.78*scale,[.21,.23,.27],{yaw});
  }
  // Breastplate, belt, pauldrons and cape give each hero a stronger silhouette.
  mesh.box(x,(hip+shoulder)/2,z,1.15*scale,(shoulder-hip)*.98,.82*scale,armor,{yaw,tilt:poseState.torsoTilt});
  mesh.box(x,hip+.05*scale,z,1.18*scale,.25*scale,.88*scale,GOLD,{yaw});
  mesh.box(x,shoulder+.26*scale,z,.84*scale,.39*scale,.76*scale,[.68,.67,.59],{yaw});
  mesh.box(x,shoulder+.65*scale,z,.80*scale,.73*scale,.74*scale,[.67,.55,.42],{yaw});
  mesh.box(x,shoulder+1.06*scale,z,1.12*scale,.34*scale,.82*scale,[.63,.67,.69],{yaw});
  mesh.pyramid(x,shoulder+1.16*scale,z,.72*scale,.77*scale,[.26,.31,.40],5);
  mesh.box(x+.05*scale,hip+.42*scale,z+.53*scale,.92*scale,1.30*scale,.15*scale,color(main,.57),{yaw,tilt:poseState.torsoTilt*.5});
  for(const part of bones.arms){
    const [a,k,b]=[part.shoulder,part.elbow,part.hand];
    mesh.box(x+a[0],a[1],z+a[2],.56*scale,.53*scale,.61*scale,[.58,.61,.66],{yaw});
    mesh.segment([x+a[0],a[1],z+a[2]],[x+k[0],k[1],z+k[2]],.36*scale,.37*scale,color(armor,.91));
    mesh.segment([x+k[0],k[1],z+k[2]],[x+b[0],b[1],z+b[2]],.33*scale,.35*scale,[.59,.61,.64]);
  }
  const hand=bones.arms[1].hand;
  if(hero||item.type!=='archer'){
    const h=[x+hand[0],hand[1],z+hand[2]],tip=[h[0]+(.55+poseState.swordSwing*.4)*scale,h[1]+(1.52-poseState.swordSwing*.75)*scale,h[2]];
    mesh.segment(h,tip,.16*scale,.16*scale,WHITE);
    mesh.box(h[0],h[1]+.24*scale,h[2],.76*scale,.14*scale,.22*scale,GOLD,{yaw});
  }else{
    const h=[x+hand[0],hand[1],z+hand[2]];
    mesh.segment([h[0]-.42*scale,h[1]+.80*scale,h[2]],[h[0]+.48*scale,h[1]-.82*scale,h[2]],.14*scale,.18*scale,GOLD);
  }
  if(poseState.glow>.1){const wave=poseState.glow;
    mesh.prism(x,.20,z,1.7*scale,.12,[.16*wave,.60*wave,.93*wave],12);
    mesh.prism(x,shoulder+1.5*scale,z,.32*scale,.8,[.35,.80,.97],6);
  }
}

function drawRam(mesh,ram,time){if(!ram||ram.hp<=0)return;const p=world3(ram.x,ram.y),x=p.x,z=p.z;
  mesh.box(x,1.35,z,8,2,5,[.35,.26,.18]);mesh.box(x,4.4,z,7,4,4,[.34,.28,.23]);
  for(const dz of [-2.2,2.2])for(const dx of [-2.7,2.7]){
    mesh.prism(x+dx,.92,z+dz,1,1.8,[.19,.22,.26],8);
  }
  for(let i=-2;i<=2;i++)mesh.box(x+i*1.1,6.1,z,1,1,.4,[.68,.60,.44]);
  mesh.box(x+4,3.1,z,3.6,.85,1,[.69,.70,.67]);
  drawBanner(mesh,x-2,z,0,time);
}
function drawEffects(mesh,fx,time,quality){if(quality==='performance')return;let n=0;for(const f of fx||[]){if(n++>22)break;const p=world3(f.x,f.y),x=p.x,z=p.z;const age=Math.max(0,time-(f.t||0)),size=.8+age*3;
    const c=f.team===1?[.98,.40,.22]:[.27,.74,.99];
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5+f.t*2;mesh.box(x+Math.cos(a)*size,2+i*.5,z+Math.sin(a)*size,.35,.35,.35,c,{yaw:a});}
  }}
function drawTerrain(mesh,quality){const n=quality==='performance'?12:20;const w=110/n,d=76/Math.max(8,Math.round(n*.64));const nz=Math.max(8,Math.round(n*.64));
  for(let i=0;i<n;i++)for(let j=0;j<nz;j++){
    const x=-55+(i+.5)*w,z=-38+(j+.5)*d,h=((i*41+j*23)%13)/150;
    const grass=(i+j)%5===0,base=grass?[.31,.37,.32]:[.29,.32,.30];
    mesh.ground(x,z,w+.04,d+.04,color(base,1+h));
    if((i*7+j*11)%17===0)mesh.box(x,.18,z,.8,.3,1.8,[.37,.36,.31],{yaw:.8});
  }
  mesh.box(0,.08,0,110,.15,4,[.38,.34,.28]);
  for(const z of [-37,37])mesh.box(0,.9,z,110,1.6,.6,[.28,.32,.31]);
}
export function createGraphics3D(canvas,{quality='balanced',reducedMotion=false,gateModel=null}={}){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:quality!=='performance',depth:true,preserveDrawingBuffer:false});if(!gl)throw Error('WebGL2 / 3D GPU desteği yok');
  let program=null,vao=null,vbo=null,staticVbo=null,uniform=null;
  const stride=9*4;
  function configureAttributes(buffer){gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,off]of [['aPosition',0],['aNormal',12],['aColor',24]]){
      const id=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(id);gl.vertexAttribPointer(id,3,gl.FLOAT,false,stride,off);
    }
  }
  function setupGpu(){program=createProgram(gl);vao=gl.createVertexArray();vbo=gl.createBuffer();staticVbo=gl.createBuffer();
    gl.useProgram(program);configureAttributes(vbo);uniform=gl.getUniformLocation(program,'uCamera');
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  }
  setupGpu();
  let model=gateModel,modelError=null,modelVersion=gateModel?1:0;
  const ready=(typeof document!=='undefined'&&!gateModel)
    ?fetchGLB('./assets/models/siege-gatehouse.glb').then(asset=>{if(!disposed){model=asset;modelVersion++;staticKey='';}return true;}).catch(err=>{modelError=String(err?.message||err);return false;})
    :Promise.resolve(Boolean(gateModel));
  let disposed=false,frame=0,vertices=0,staticCount=0,staticKey='',qualityName=quality,eye=[0,74,81],target=[0,0,0],lastClock=null,contextLost=false;
  const resolution=create3DResolutionManager(qualityName);
  const internalMotion=createBattleMotion();
  function resize(_w=1000,_h=600,dpr=1){const base=qualityName==='ultra'?Math.min(2,dpr):qualityName==='balanced'?Math.min(1.35,dpr):1;
    const factor=base*resolution.getScale();
    const w=Math.max(1,Math.round((canvas.clientWidth||1000)*factor)),h=Math.max(1,Math.round((canvas.clientHeight||600)*factor));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);}
  function render(room,you,time=0,{quality:next=qualityName,motion=null,reducedMotion:reduced=reducedMotion,cameraMode='overview'}={}){
    if(next!==qualityName){qualityName=next;resolution.setQuality(next);}
    const firstFrame=lastClock===null;
    if(!firstFrame)resolution.observe((time-lastClock)*1000);lastClock=time;
    if(contextLost)return;
    const player=(room?.players||[]).find(item=>String(item.id)===String(you));
    const point=player&&cameraMode==='follow'?world3(player.x,player.y):{x:0,z:0};
    const desiredX=clamp3(point.x*.33,-12,12),desiredZ=clamp3(point.z*.28,-9,9);
    const blend=firstFrame?1:(reduced?1:.095);
    target=[target[0]+(desiredX-target[0])*blend,0,target[2]+(desiredZ-target[2])*blend];
    eye=[target[0],74,81+target[2]];
    resize(0,0,typeof window==='undefined'?1:window.devicePixelRatio||1);
    gl.clearColor(.14,.21,.29,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(disposed)return;
    const aspect=canvas.width/canvas.height;const mat=cameraMatrix(aspect,Math.PI/3,.1,350,eye,target);gl.useProgram(program);gl.uniformMatrix4fv(uniform,false,new Float32Array(mat));
    const gateFraction=room?.siege?.gate?room.siege.gate.hp/room.siege.gate.maxHp:1;
    const stage=gateFraction<=0?3:gateFraction<.3?2:gateFraction<.65?1:0;
    const key=`${next}:${room?.variant==='siege'?'siege':'arena'}:${stage}:asset${modelVersion}`;
    if(key!==staticKey){
      const scenery=new MeshBatch();drawTerrain(scenery,next);
      if(room?.variant==='siege'){drawWall(scenery,gateFraction,0);
        // Imported GLB architectural insert; the gameplay gate itself remains HP-driven.
        if(model){const vertices=model.geometry();for(let i=0;i<vertices.length;i++)scenery.a.push(vertices[i]);}
      }
      else {
        for(const point of [{x:0,z:-10},{x:0,z:10}]){
          scenery.prism(point.x,.4,point.z,4,.8,[.44,.41,.33],12);scenery.prism(point.x,2,point.z,1,3,[.30,.66,.79],8);
        }
        for(const x of [-46,46])for(const z of [-31,31]){scenery.prism(x,4,z,2.5,8,[.44,.45,.43],8);scenery.pyramid(x,8,z,4,5,[.19,.28,.38],6);}
      }
      const buf=new Float32Array(scenery.a);gl.bindBuffer(gl.ARRAY_BUFFER,staticVbo);gl.bufferData(gl.ARRAY_BUFFER,buf,gl.STATIC_DRAW);
      staticCount=buf.length/9;staticKey=key;
    }
    const mesh=new MeshBatch();
    const smoothed=(motion||internalMotion).sample(room,time).actors;for(const a of [...(room?.squads||[]),...(room?.players||[])])if(a.hp>0){const p=smoothed?.get(String(a.id));drawActor(mesh,a,p?{x:p.x/10,y:p.y/10,speed:p.speed,walk:p.walk,face:p.face,hit:p.hit}:null,time,!(a.type),next,reduced);}
    if(room?.variant==='siege')drawRam(mesh,room.siege.ram,time);
    if(room?.variant==='siege'){
      const core=world3(room.siege.core.x,room.siege.core.y);
      mesh.prism(core.x,1,core.z,4,2,[.49,.42,.28],8);mesh.pyramid(core.x,2,core.z,2.1,6,[.25,.77,.95]);
    }
    drawEffects(mesh,room?.fx,time,next);
    configureAttributes(staticVbo);
    gl.drawArrays(gl.TRIANGLES,0,staticCount);
    const data=new Float32Array(mesh.a);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    configureAttributes(vbo);
    gl.drawArrays(gl.TRIANGLES,0,data.length/9);frame++;vertices=staticCount+data.length/9;
  }
  function toWorld(x,y){const u=x/1000,v=y/600,hit=pickGround(u,v,{aspect:canvas.width/canvas.height,fov:Math.PI/3,eye,target});if(!hit)return {x:-1e6,y:-1e6};const p=server3(hit.x,hit.z);return {x:p.x*10,y:p.y*10};}
  const onLost=e=>{e.preventDefault();contextLost=true;};canvas.addEventListener('webglcontextlost',onLost);
  const onRestored=()=>{if(disposed)return;setupGpu();staticKey='';resolution.reset();contextLost=false;};canvas.addEventListener('webglcontextrestored',onRestored);
  return {kind:'webgl3d',ready,render,resize,setQuality:q=>{qualityName=q;resolution.setQuality(q)},toWorld,stats:()=>({mode:'3d',vertices,frames:frame,mesh:'articulated-rig',glbGateLoaded:Boolean(model),glbGateError:modelError,renderScale:resolution.getScale(),contextLost}),dispose(){if(disposed)return;disposed=true;gl.deleteBuffer(vbo);gl.deleteBuffer(staticVbo);gl.deleteVertexArray(vao);gl.deleteProgram(program);canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);}};
}
