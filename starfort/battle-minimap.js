/** Read-only tactical overview of server room snapshots. Never changes game rules. */
const bound=(v,min,max)=>Math.max(min,Math.min(max,v));
export function minimapMarkers(room,you){
  if(!room||!Array.isArray(room.players))return [];
  const mySide=room.players.find(p=>p.id===you)?.team;
  const out=[];
  const add=(type,x,y,side=null,id='')=>{
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    out.push({type,x:bound(x,0,100),y:bound(y,0,60),side,id});
  };
  if(room.variant==='siege'&&room.siege){
    const {gate,core,ram}=room.siege;
    if(gate?.hp>0)add('gate',gate.x,gate.y);
    if(core?.hp>0)add('core',core.x,core.y);
    if(ram?.hp>0)add('ram',ram.x,ram.y,0);
  }else if(!room.variant||room.variant==='flags'){
    add('flag',50,20,room.capture?.[0]);add('flag',50,40,room.capture?.[1]);
  }
  for(const s of room.squads||[])if(s.hp>0)add('squad',s.x,s.y,s.team,s.id);
  for(const p of room.players)if(p.hp>0)add(p.id===you?'you':p.team===mySide?'ally':'enemy',p.x,p.y,p.team,p.id);
  return out;
}
export function drawBattleMinimap(ctx,room,you){
  if(!ctx)return;
  const {width:w,height:h}=ctx.canvas;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#071725e8';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#c6a8778a';ctx.strokeRect(.5,.5,w-1,h-1);
  ctx.strokeStyle='#7792a53b';ctx.lineWidth=.65;
  for(let k=1;k<4;k++){const x=k*w/4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let k=1;k<3;k++){const y=k*h/3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const colors={you:'#ffe0a3',ally:'#55d2f5',enemy:'#ff6d6d',squad:'#83aeb6',ram:'#edcb75',gate:'#ef9474',core:'#8ee4fa',flag:'#f6d08d'};
  for(const m of minimapMarkers(room,you)){
    const x=4+m.x/100*(w-8),y=4+m.y/60*(h-8),r=m.type==='you'?4:m.type==='gate'||m.type==='core'?4.5:m.type==='squad'?1.7:2.8;
    ctx.beginPath();
    if(m.type==='gate'||m.type==='core'||m.type==='flag'){ctx.rect(x-r,y-r,r*2,r*2)}
    else{ctx.arc(x,y,r,0,Math.PI*2)}
    ctx.fillStyle=m.type==='flag'&&m.side===0?colors.ally:m.type==='flag'&&m.side===1?colors.enemy:colors[m.type];ctx.fill();
    if(m.type==='you'){ctx.strokeStyle='#fff9d6';ctx.lineWidth=1.3;ctx.stroke()}
  }
}
