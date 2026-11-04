/** Read-only 3D magic and collision presentation for verified official PvE turns.
 * Draws no reward, combat stats, client damage or server-hit prediction.
 * Deterministic WebGL mesh effects: naturally vanish after the accepted turn.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const FX_LIFETIME=1.9;
const colors={
 lyra:[.67,.49,.97],rovan:[.90,.70,.34],mira:[.47,.89,.68],
 aldren:[.53,.81,.99],doran:[.98,.48,.30],vesper:[.77,.40,.83],
 eira:[.48,.81,.98]
};
export function officialFxAge(f,time){
 if(!f||!Number.isFinite(time)||!Number.isFinite(f.t))return null;
 const dt=time-f.t;return dt>=0&&dt<=FX_LIFETIME?dt:null;
}
function ring(mesh,x,z,y,r,col,quality,phase=0){
 const n=quality==='performance'?6:quality==='balanced'?10:14;
 for(let i=0;i<n;i++){
  const a=i*Math.PI*2/n+phase,b=(i+1)*Math.PI*2/n+phase;
  const p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r];
  mesh.segment(p,q,.08,.07,col);
 }
}
export function drawOfficialFantasyEffects(mesh,fx,time,quality='balanced'){
 let total=0;
 const max=quality==='performance'?4:12;
 for(const f of fx||[]){
  if(total>=max)break;
  const age=officialFxAge(f,time);
  if(age===null)continue;
  if(!Number.isFinite(f.x)||!Number.isFinite(f.y))continue;
  const p=clamp(age/FX_LIFETIME,0,1);
  const x=f.x-50,z=f.y-30,ramp=Math.sin(Math.PI*p),fade=Math.max(.1,1-p);
  const base=colors[f.heroId]||[.92,.66,.41];
  const col=f.team===1?[.93,.37,.31]:base;
  const n=quality==='performance'?5:quality==='balanced'?9:13;
  if(f.type==='ward'){
   ring(mesh,x,z,1.5,4+ramp*2,[.38,.77,.99],quality,age*.4);
   mesh.prism(x,1.8,z,1.6,3.6,[.29,.55,.73],8);
   total++;continue;
  }
  if(f.type==='heal'){
   for(let i=0;i<(quality==='performance'?2:4);i++){
    const y=.4+i*.7+age*1.4;
    ring(mesh,x,z,y,1.8+i*.5,[.42,.94,.64],quality,age+i);
   }
   mesh.prism(x,2.6,z,.5,2,[.75,1,.81],6);
   total++;continue;
  }
  if(f.type==='spell'){
   const projectileX=x-19+p*36,projectileY=2.5+Math.sin(p*Math.PI)*7;
   const offset=Math.sin(p*9)*1.9;
   mesh.prism(projectileX,projectileY,z+offset,.55+fade*.4,1+fade*.6,col,9);
   if(quality!=='performance'){
    for(let i=0;i<6;i++){
     const t=Math.max(0,p-i*.037),px=x-19+t*36;
     mesh.box(px,projectileY+Math.sin((p-i*.04)*12)*.35,z+offset+i*.13,
      .18+i*.025,.18+i*.025,.18+i*.025,col);
    }
   }
   if(p>.48)ring(mesh,x+2,z,2,.8+(p-.48)*7,col,quality,age*2);
   total++;continue;
  }
  if(f.type==='flank'||f.type==='slash'){
   const t=clamp(p*1.6,0,1);
   for(let i=0;i<n;i++){
    const a=i/n*Math.PI*.9,scale=1+Math.sin(t*Math.PI)*2.2;
    const bx=x-10+21*t+Math.cos(a)*scale;
    const by=1.8+Math.sin(a)*3.3;
    mesh.box(bx,by,z+Math.cos(t*3+i)*.7,.17,.18,.85,col,{yaw:a+.6});
   }
   if(quality!=='performance'&&f.type==='flank')ring(mesh,x,z,1.3,2+p*2,col,quality,age*4);
   total++;continue;
  }
  if(f.type==='impact'){
   ring(mesh,x,z,.45,1+9*p,[.89,.60,.42],quality,age*.3);
   for(let i=0;i<n;i++){
    const angle=i*Math.PI*2/n,rad=1+p*6;
    mesh.box(x+Math.cos(angle)*rad,.55+(i%3)*.25+Math.sin(p*Math.PI)*2,
     z+Math.sin(angle)*rad,.19+fade*.24,.21+fade*.35,.23,col,{yaw:angle});
   }
   total++;continue;
  }
 }
 return total;
}
