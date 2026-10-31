/** Lightweight client-side presentation only. The server owns positions, HP, and outcomes. */
export const GRAPHICS_PRESETS=Object.freeze({
  ultra:Object.freeze({particles:52,shadows:24,trail:true,shake:true,maxScale:2}),
  balanced:Object.freeze({particles:14,shadows:8,trail:false,shake:false,maxScale:1.4}),
  performance:Object.freeze({particles:0,shadows:0,trail:false,shake:false,maxScale:1})
});
export function graphicsPreset(value){const name=value==='cinematic'?'ultra':value;return Object.hasOwn(GRAPHICS_PRESETS,name)?name:'balanced'}
export function resolutionScale(width,height,dpr=1,quality='balanced'){
  if(![width,height,dpr].every(v=>Number.isFinite(v)&&v>0))return 1;
  const scale=Math.min(width/1000,height/600)*Math.min(3,dpr);
  return Math.min(GRAPHICS_PRESETS[graphicsPreset(quality)].maxScale,Math.max(1,Math.round(scale*4)/4));
}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
/** Smoothes server snapshots without affecting hit detection or game state. */
export function createBattleMotion(){
  const actors=new Map();let lastTime=null,lastRoom=null,impactTime=-100,impactPosition={x:0,y:0},lastImpactKey=null;
  return {
    reset(){actors.clear();lastTime=null;lastRoom=null;impactTime=-100;lastImpactKey=null},
    sample(room,time=0){
      if(!room){this.reset();return {actors,shake:{x:0,y:0}};}
      if(room.id!==lastRoom){this.reset();lastRoom=room.id;}
      const dt=lastTime===null?0:clamp(time-lastTime,0,.08);lastTime=time;
      const active=new Set();
      for(const item of [...(room.players||[]),...(room.squads||[])]){
        const id=String(item.id);active.add(id);
        const x=Number(item.x)*10,y=Number(item.y)*10;
        if(!Number.isFinite(x)||!Number.isFinite(y))continue;
        let p=actors.get(id);
        if(!p){p={x,y,face:item.team===1?-1:1,walk:0,speed:0,hit:0,hp:Number(item.hp)||0};actors.set(id,p);}
        const dx=x-p.x,dy=y-p.y,dist=Math.hypot(dx,dy);
        const a=dist>170?1:1-Math.exp(-14*dt);
        const mx=dx*a,my=dy*a;
        p.x+=mx;p.y+=my;
        const travel=Math.hypot(mx,my);
        p.speed=dt?clamp(travel/dt/110,0,1):0;
        p.walk+=travel/9;
        if(Math.abs(mx)>0.15)p.face=mx>0?1:-1;
        if(Number(item.hp)<p.hp){p.hit=1;impactTime=time;impactPosition={x:p.x,y:p.y};}
        else p.hit=Math.max(0,p.hit-dt*2.8);
        p.hp=Number(item.hp);
      }
      for(const id of actors.keys())if(!active.has(id))actors.delete(id);
      const majorFx=[...(room.fx||[])].reverse().find(f=>['ram-strike','gate-down','ram-down','core-down'].includes(f.type));
      if(majorFx){const key=majorFx.type+':'+majorFx.t;if(key!==lastImpactKey){lastImpactKey=key;impactTime=time;impactPosition={x:majorFx.x*10,y:majorFx.y*10};}}
      const age=time-impactTime;
      const power=age<0||age>.27?0:(1-age/.27)*2.5;
      return {actors,shake:{x:Math.sin(time*93)*power,y:Math.cos(time*101)*power},impactPosition};
    },
    count(){return actors.size}
  };
}
