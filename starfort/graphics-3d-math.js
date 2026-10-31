/** World coordinates are server-authoritative (0–100, 0–60); graphics are presentation only. */
export const clamp3=(v,a,b)=>Math.max(a,Math.min(b,v));
export const world3=(x,y)=>({x:Number(x)-50,z:Number(y)-30});
export const server3=(x,z)=>({x:x+50,y:z+30});
export const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const sub3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit3=v=>{const d=Math.hypot(...v)||1;return v.map(n=>n/d)};
export function cameraBasis(eye=[0,72,78],target=[0,0,0]){
  const forward=unit3(sub3(target,eye));const right=unit3(cross3(forward,[0,1,0]));const up=cross3(right,forward);
  return {eye,forward,right,up};
}
/** Column-major projection and view multiplication; no dependency on a render library. */
export function cameraMatrix(aspect=5/3,fov=Math.PI/3,near=.1,far=300,eye=[0,72,78],target=[0,0,0]){
  const {right:r,up:u,forward:f}=cameraBasis(eye,target),b=[
    r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot3(r,eye),-dot3(u,eye),dot3(f,eye),1
  ];
  const s=1/Math.tan(fov/2),p=[s/aspect,0,0,0,0,s,0,0,0,0,(far+near)/(near-far),-1,0,0,(2*far*near)/(near-far),0];
  return multiply4(p,b);
}
export function multiply4(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
export function project3(p,m){const v=[p[0],p[1],p[2],1],out=[0,0,0,0];for(let r=0;r<4;r++)for(let c=0;c<4;c++)out[r]+=m[c*4+r]*v[c];return out.map((x,i)=>i===3?x:x/(out[3]||1));}
/** Perspective ground-plane picking; input is normalized 0..1 from the rendered canvas. */
export function pickGround(u,v,{aspect=5/3,fov=Math.PI/3,eye=[0,72,78],target=[0,0,0]}={}){
  if(![u,v].every(Number.isFinite)||u<0||u>1||v<0||v>1)return null;
  const {forward,right,up}=cameraBasis(eye,target),tan=Math.tan(fov/2);
  const xx=(u*2-1)*tan*aspect,yy=(1-v*2)*tan;
  const d=unit3([forward[0]+right[0]*xx+up[0]*yy,forward[1]+right[1]*xx+up[1]*yy,forward[2]+right[2]*xx+up[2]*yy]);
  if(d[1]>=-.0001)return null;
  const t=-eye[1]/d[1];return {x:eye[0]+d[0]*t,z:eye[2]+d[2]*t};
}
