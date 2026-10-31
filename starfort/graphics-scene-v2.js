/** GPU battle scene, shared by duel / flag fights / guild siege. Visuals only. */
import {createGraphicsCore,createCanvasGraphicsCore,qualityConfig,cameraFor,clamp} from './graphics-core-v2.js';
import {actorPose,impactFrame,effectsBudget,groundY,inverseGroundY,depthScale} from './graphics-animation-v3.js';
import {motionAssetFilename,motionSprite} from './graphics-rig-v4.js';
import {siegeVisualState} from './siege-visual-state.js';
const teamColors=[[.32,.78,.98,1],[1,.43,.39,1]];
const faction=(team)=>teamColors[team===1?1:0];
const assets=['battlefield-live.webp','unit-dawn-1.webp','unit-dawn-2.webp','unit-dawn-3.webp','unit-dusk-1.webp','unit-dusk-2.webp','unit-dusk-3.webp'];
function makeCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);return c;}
function gradient(ctx,x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);for(const [pos,color]of stops)g.addColorStop(pos,color);return g;}
export function createBattleTextures(){
  const textures={};
  textures.glow=makeCanvas(128,128,(c)=>{c.fillStyle=gradient(c,64,64,64,[[0,'#ffffffee'],[.16,'#ffffff88'],[.5,'#ffffff1b'],[1,'#ffffff00']]);c.fillRect(0,0,128,128);});
  textures.shadow=makeCanvas(128,64,c=>{c.save();c.scale(1,.5);c.fillStyle=gradient(c,64,64,64,[[0,'#000000a8'],[.5,'#00000044'],[1,'#00000000']]);c.fillRect(0,0,128,128);c.restore();});
  textures.ring=makeCanvas(128,128,(c)=>{c.translate(64,64);c.strokeStyle='#fff';c.lineWidth=4;c.shadowColor='#fff';c.shadowBlur=9;c.beginPath();c.ellipse(0,0,53,31,0,0,2*Math.PI);c.stroke();c.shadowBlur=0;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.fillStyle='#ffffffc7';c.fillRect(Math.cos(a)*53-2,Math.sin(a)*31-2,4,4);}});
  textures.spark=makeCanvas(64,64,c=>{c.translate(32,32);c.fillStyle=gradient(c,0,0,31,[[0,'#fff'],[.17,'#fffae0'],[.35,'#ffc45aa2'],[1,'#ffb24900']]);c.fillRect(-32,-32,64,64);c.strokeStyle='#ffedb8';c.lineWidth=1;c.beginPath();c.moveTo(-25,0);c.lineTo(25,0);c.moveTo(0,-25);c.lineTo(0,25);c.stroke();});
  textures.smoke=makeCanvas(128,128,c=>{const g=gradient(c,64,64,62,[[0,'#c1d2d7a2'],[.5,'#8da2aaa0'],[1,'#71808c00']]);c.fillStyle=g;c.fillRect(0,0,128,128);});
  // One textured architectural gatehouse, several damage phases, independently animated.
  for(let stage=0;stage<=3;stage++)textures['gate-'+stage]=makeCanvas(360,620,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.save();c.shadowColor='#03090e';c.shadowBlur=22;
    const stone=c.createLinearGradient(28,0,w-25,0);stone.addColorStop(0,'#202d35');stone.addColorStop(.15,'#525f5c');stone.addColorStop(.4,'#9b9682');stone.addColorStop(.74,'#62675e');stone.addColorStop(1,'#18252d');
    c.fillStyle=stone;c.beginPath();c.moveTo(30,585);c.lineTo(44,120);c.lineTo(315,120);c.lineTo(330,585);c.closePath();c.fill();c.shadowBlur=0;
    for(let r=0;r<20;r++)for(let j=0;j<8;j++){const x=47+j*36+(r%2)*16,y=139+r*21;if(x>312)continue;c.fillStyle=(r+j)%3===0?'#25323958':'#ffffff0d';c.fillRect(x,y,33,17);c.strokeStyle='#10191b58';c.strokeRect(x,y,33,18)}
    for(const tx of [64,290]){const tower=c.createLinearGradient(tx-39,0,tx+35,0);tower.addColorStop(0,'#192733');tower.addColorStop(.53,'#a4a08c');tower.addColorStop(1,'#23313b');c.fillStyle=tower;c.fillRect(tx-38,70,76,510);c.strokeStyle='#c4b48c';c.lineWidth=3;c.strokeRect(tx-38,70,76,510);for(let i=0;i<4;i++){c.fillStyle=i%2?'#67756e':'#9a9681';c.fillRect(tx-44+i*25,48,20,38)}c.fillStyle='#0d1d27';for(let i=0;i<3;i++){c.beginPath();c.moveTo(tx-26,180+i*130);c.quadraticCurveTo(tx,145+i*130,tx+26,180+i*130);c.lineTo(tx+26,214+i*130);c.lineTo(tx-26,214+i*130);c.fill();}}
    c.fillStyle='#10161c';c.beginPath();c.moveTo(112,580);c.lineTo(112,335);c.bezierCurveTo(112,270,248,270,248,335);c.lineTo(248,580);c.closePath();c.fill();c.strokeStyle='#b7b1a0';c.lineWidth=16;c.stroke();c.strokeStyle='#343f40';c.lineWidth=6;c.stroke();
    if(stage<3){const wood=c.createLinearGradient(118,0,244,0);wood.addColorStop(0,'#1f1b18');wood.addColorStop(.45,'#90613e');wood.addColorStop(1,'#211912');c.fillStyle=wood;c.beginPath();c.moveTo(124,583);c.lineTo(124,331);c.bezierCurveTo(126,289,232,289,235,333);c.lineTo(235,583);c.closePath();c.fill();c.save();c.clip();for(let i=0;i<7;i++){c.strokeStyle=i%2?'#d4a46d55':'#21140fa3';c.lineWidth=i%2?3:7;c.beginPath();c.moveTo(123+i*19,312);c.lineTo(123+i*19,590);c.stroke();}for(let y=375;y<580;y+=52){c.fillStyle='#273039';c.fillRect(120,y,120,13);c.fillStyle='#ad9572';c.fillRect(120,y,120,3);}if(stage){for(let i=0;i<stage*9;i++){const x=145+(i*29)%85,y=366+(i*47)%220;c.strokeStyle='#2a1615';c.lineWidth=1+stage/2;c.beginPath();c.moveTo(x,y);c.lineTo(x+7+stage*4,y+14);c.lineTo(x-7,y+20);c.stroke();}}c.restore();}
    else{for(let i=0;i<28;i++){let x=92+(i*29)%170,y=548+(i*17)%46;c.fillStyle=i%2?'#726b5c':'#45443a';c.fillRect(x,y,6+(i%6)*3,7+i%4*3)}}
    // Stone arch crest, stained banners and gilt tracery.
    c.fillStyle='#293742';c.beginPath();c.moveTo(91,87);c.lineTo(180,25);c.lineTo(268,87);c.closePath();c.fill();c.strokeStyle='#d4b581';c.lineWidth=5;c.stroke();c.fillStyle='#d6ba79';c.font='bold 55px Georgia';c.textAlign='center';c.fillText('✦',180,101);
    for(const x of [101,256]){c.fillStyle='#822f38';c.beginPath();c.moveTo(x-18,200);c.lineTo(x+18,200);c.lineTo(x+18,320);c.lineTo(x,309);c.lineTo(x-18,320);c.closePath();c.fill();c.fillStyle='#e5bf74';c.font='bold 24px Georgia';c.fillText('✧',x,251)}
    c.restore();});

  // Dedicated VFX atlas pieces; no particle is represented by a CSS element.
  textures.slash=makeCanvas(256,128,c=>{c.translate(128,64);c.lineCap='round';for(let i=5;i>=0;i--){c.beginPath();c.ellipse(0,0,111-i*4,39-i*3,-.22,-.12,2.1);c.strokeStyle=['#bfe9ff22','#6fd6ff44','#fdf0c17a','#fff4d5c9','#ffffffee','#ffffff'][5-i];c.lineWidth=2+i*1.1;c.shadowColor='#97eaff';c.shadowBlur=6;c.stroke();}});
  textures.dust=makeCanvas(128,128,c=>{for(let j=0;j<8;j++){const cx=15+(j*53)%100,cy=29+(j*37)%75,r=18+j%3*7;c.fillStyle=gradient(c,cx,cy,r,[[0,'#b1a28b77'],[.7,'#756e6060'],[1,'#655b4c00']]);c.fillRect(cx-r,cy-r,r*2,r*2);}});
  textures.rock=makeCanvas(96,96,c=>{c.save();c.translate(48,48);c.fillStyle='#2c3335';c.beginPath();c.moveTo(-40,-10);c.lineTo(-8,-37);c.lineTo(25,-31);c.lineTo(42,1);c.lineTo(13,34);c.lineTo(-23,28);c.closePath();c.fill();c.fillStyle='#79807b';c.beginPath();c.moveTo(-40,-10);c.lineTo(-8,-37);c.lineTo(25,-31);c.lineTo(7,2);c.lineTo(-12,11);c.closePath();c.fill();c.strokeStyle='#c4b694';c.lineWidth=3;c.beginPath();c.moveTo(-8,-37);c.lineTo(7,2);c.lineTo(13,34);c.stroke();c.restore();});
  textures.fire=makeCanvas(96,160,c=>{c.save();c.translate(48,151);for(let i=0;i<6;i++){c.beginPath();c.moveTo(-23+i*5,0);c.quadraticCurveTo(-43+i*16,-66,4+i*8,-143+i*11);c.quadraticCurveTo(50-i*8,-54,22-i*4,0);c.closePath();c.fillStyle=i<3?'#ff581c44':'#ffc65461';c.fill();}c.restore();});
  for(const side of [0,1])textures['standard-'+side]=makeCanvas(80,150,c=>{c.save();c.translate(40,25);c.fillStyle='#c1a77b';c.fillRect(-2,0,5,121);c.fillStyle=side===0?'#124d77':'#8a2937';c.beginPath();c.moveTo(3,8);c.lineTo(68,12);c.lineTo(64,74);c.lineTo(5,68);c.closePath();c.fill();c.strokeStyle='#e6bc6e';c.lineWidth=3;c.stroke();c.fillStyle='#e3c485';c.font='bold 32px Georgia';c.fillText(side===0?'✦':'♛',15,48);c.restore();});

  textures.ram=makeCanvas(380,235,c=>{
    c.save();c.translate(190,130);c.fillStyle='#06111985';c.beginPath();c.ellipse(0,60,154,26,0,0,2*Math.PI);c.fill();
    for(const x of [-100,96]){c.fillStyle='#263139';c.beginPath();c.arc(x,51,35,0,7);c.fill();c.strokeStyle='#b79b66';c.lineWidth=8;c.stroke();for(let i=0;i<7;i++){const a=i*Math.PI*2/7;c.beginPath();c.moveTo(x,51);c.lineTo(x+Math.cos(a)*29,51+Math.sin(a)*29);c.stroke();}}
    let metal=c.createLinearGradient(-125,-105,120,30);metal.addColorStop(0,'#273a43');metal.addColorStop(.3,'#a99a7d');metal.addColorStop(.66,'#3d4750');metal.addColorStop(1,'#0e1b2c');c.fillStyle=metal;c.beginPath();c.moveTo(-145,0);c.lineTo(-100,-80);c.lineTo(93,-80);c.lineTo(145,0);c.closePath();c.fill();c.lineWidth=8;c.strokeStyle='#d0b17d';c.stroke();for(let x=-115;x<140;x+=40){c.strokeStyle='#a88762';c.lineWidth=4;c.beginPath();c.moveTo(x,-65);c.lineTo(x+18,6);c.stroke();}c.fillStyle='#573921';c.fillRect(-160,0,300,35);c.fillStyle='#b89e6c';c.fillRect(-156,6,286,7);c.fillStyle='#adb9b8';c.beginPath();c.moveTo(120,-16);c.lineTo(172,13);c.lineTo(120,43);c.closePath();c.fill();c.strokeStyle='#e6ce9d';c.lineWidth=6;c.stroke();c.restore();});
  return textures;
}
function seeded(n){const v=Math.sin(n*78.233+12.492)*43128.344;return v-Math.floor(v);}
export function createBattleGraphicsV2(canvas,{quality='ultra',reducedMotion=false}={}){
  let gpu;try{gpu=createGraphicsCore(canvas,{quality,reducedMotion});}catch(_error){gpu=createCanvasGraphicsCore(canvas,{quality,reducedMotion});}const textures=createBattleTextures();for(const [id,c]of Object.entries(textures))gpu.upload(id,c);
  let loaded=0,gateLoaded=0,rigLoaded=0,disposed=false,lastRoom=null,lastCamera={x:0,y:0,zoom:1};
  const rigReady=new Set();let rigLoadStarted=false,rigEpoch=0;
  function loadRigAtlases(){
    if(rigLoadStarted||disposed)return;rigLoadStarted=true;const epoch=++rigEpoch;
    for(let i=1;i<=6;i++){const img=new Image();img.onload=()=>{if(!disposed&&epoch===rigEpoch){gpu.upload('rig-'+i,img);rigReady.add(i);rigLoaded++;}};img.onerror=()=>{};img.src=motionAssetFilename(i);}
  }
  for(const [i,filename]of assets.entries()){const img=new Image();img.onload=()=>{if(!disposed){gpu.upload('art-'+i,img);loaded++;}};img.src='assets/'+filename;}
  for(let i=0;i<4;i++){const gate=new Image();gate.onload=()=>{if(!disposed){gpu.upload('gate-'+i,gate);gateLoaded++;}};gate.src='assets/siege-gate-'+i+'.webp';}
  function unloadRigAtlases(){if(!rigLoadStarted)return;rigEpoch++;rigLoadStarted=false;for(const i of rigReady)gpu.unload('rig-'+i);rigReady.clear();rigLoaded=0;}
  const quad=(...args)=>gpu.quad(...args);const bar=(...args)=>gpu.bar(...args);
  function render(room,you,time=0,{quality:next=quality,duel=false,motion=null,selectedTarget=null,selectedSquad='all',reducedMotion:reduced=reducedMotion}={}){
    const config=qualityConfig(next),players=room?.players||[],me=players.find(p=>p.id===you),camera=cameraFor(me,next,reduced);lastCamera=camera;
    // Low-memory quality mode keeps the light original sprites. Atlas images are loaded on demand.
    if(next!=='performance')loadRigAtlases();else unloadRigAtlases();
    gpu.begin({quality:next,camera,reducedMotion:reduced});
    const t=reduced?0:time,budget=effectsBudget(next,reduced),elapsed=room?.elapsed||0;
    // Parallax environment plate. World entities always use the same server coordinates.
    // The former siege poster contains painted soldiers, a painted ram and a painted gate.
    // It must NOT be used as a playable background: those objects would not react to gameplay.
    // The live battlefield has no baked combatants; every entity below is a server snapshot.
    quad('art-0',500,300,1080,644,{screen:true});
    quad('__white',500,300,1000,600,{screen:true,color:[.015,.043,.070,.13]});
    // Distant warm torchlight / atmospheric haze, entirely cosmetic.
    if(budget.softLight){
      for(const [x,y,r] of [[95,440,185],[925,448,155],[508,460,115]]){
        quad('glow',x+Math.sin(t*.34+x)*3,y,r*2,r*1.2,{screen:true,blend:'add',color:[1,.39,.12,.13]});
      }
    }
    for(let i=0;i<budget.embers;i++){
      const x=(i*79.3+(t*(i%4+1)*2.8))%1060-30,y=110+(i*137.17)%490;
      const smoke=i%5===0;
      quad(smoke?'dust':'spark',x,y,smoke?60+(i%5)*13:5+(i%4),smoke?45+(i%4)*18:5+(i%4),{screen:true,blend:smoke?'alpha':'add',color:smoke?[.79,.78,.76,.09]:[1,.68,.35,.2],rotation:Math.sin(t+i)*.12});
    }
    // Capture shrines remain in world-space. No fake capture/HP computations are performed client-side.
    if(!duel&&room?.variant!=='siege')for(const [i,y]of [200,400].entries()){
      const owner=room?.capture?.[i];const c=owner===0?teamColors[0]:owner===1?teamColors[1]:[1,.85,.52,1];
      quad('glow',500,groundY(y),180,72,{color:[...c.slice(0,3),.22],blend:'add'});
      quad('ring',500,groundY(y),176,56,{color:[...c.slice(0,3),.72]});
    }
    const siegeState=siegeVisualState(room);
    if(siegeState){
      const stage=siegeState.gateStage;
      // Broken gate is a staged physical object, not just a decreasing health bar.
      quad('shadow',520,531,230,36,{color:[.06,.08,.08,.65]});
      quad('glow',522,384,235,290,{color:[.98,.64,.32,.15],blend:'add'});
      // Draw all four real HP-dependent gates, not a static gate painted into the backdrop.
      quad('gate-'+stage,520,386,204,306);
      if(stage>0){
        const cracks=stage*5;
        for(let i=0;i<cracks;i++){
          const lx=450+(i*37)%135,ly=425+(i*43)%110;
          quad('rock',lx,ly,11+(i%4)*6,9+(i%4)*7,{color:[.9,.83,.7,.72],rotation:seeded(i)*6});
        }
        if(budget.softLight)quad('dust',518,515,165+stage*25,71+stage*22,{color:[.83,.69,.52,.19]});
      }
      const ram=room.siege.ram;
      if(ram){const rx=ram.x*10,ry=groundY(ram.y*10);
        quad('shadow',rx,ry+19,154,47,{color:[.12,.21,.26,.65]});
        if(ram.hp>0){
          quad('ram',rx,ry-30,174,118,{rotation:ram.phase==='ramming'&&!reduced?Math.sin(t*12)*.035:0});
          if(ram.phase==='advancing'&&budget.softLight){
            for(let j=0;j<3;j++)quad('dust',rx-72-j*9,ry+25+j*4,42+j*13,35+j*9,{color:[.68,.64,.54,.13]});
          }
          if(ram.phase==='ramming')quad('glow',rx+64,ry-30,120,90,{blend:'add',color:[1,.57,.19,.35]});
        }else {quad('smoke',rx,ry-5,150,100,{color:[.7,.7,.7,.24]});quad('rock',rx-24,ry+21,32,28,{rotation:.22});}
        bar(rx,ry+45,85,6,ram.hp/ram.maxHp,[.95,.74,.35,1]);
      }
      // Health indicators are graphics-only reflections of server-authoritative values.
      bar(521,190,164,8,siegeState.gateFraction,[.92,.6,.36,1]);
      bar(770,248,105,7,siegeState.coreFraction,[.38,.85,1,1]);
      // Server-defined destruction stage controls the collapse cloud, never a fake animation timer.
      if(stage===3&&budget.softLight){
        quad('smoke',520,435,216,195,{color:[.74,.63,.51,.27]});
        for(let k=0;k<10;k++)quad('rock',460+k*12,532-(k%3)*7,13+k%4*7,12+k%3*9,{rotation:k*.58,color:[.83,.81,.72,.9]});
      }
    }
    const frame=motion?.sample(room,time*1000)||null;
    const entities=[];
    for(const squad of room?.squads||[])if(squad.hp>0)entities.push({type:'squad',data:squad});
    for(const player of players)if(player.hp>0)entities.push({type:'hero',data:player});
    entities.sort((a,b)=>a.data.y-b.data.y);
    for(const {type,data} of entities){
      const isHero=type==='hero',team=data.team??data.side??0,c=faction(team),p=frame?.actors?.get(String(data.id));
      const x=p?.x??data.x*10,worldY=p?.y??data.y*10,y=groundY(worldY),heroActive=isHero&&data.id===you,heroTarget=isHero&&data.id===selectedTarget;
      const depth=depthScale(worldY),size=(isHero?(heroActive?95:82):41)*depth;
      const nearestFx=(room?.fx||[]).find(f=>f.team===team&&Math.hypot(f.x*10-x,groundY(f.y*10)-y)<100&&Math.abs(elapsed-f.t)<.38);
      const visualStrike=nearestFx?1-Math.abs(elapsed-nearestFx.t)/.38:0;
      const visualSpell=nearestFx&&/burst|spell|magic|star|frost|heal|eclipse|cast/i.test(String(nearestFx.type||''))?visualStrike:0;
      const pose=actorPose({time:t,speed:p?.speed||0,walk:p?.walk||0,hit:p?.hit||0,face:p?.face??1,attack:visualSpell?0:visualStrike,cast:visualSpell,hp:data.hp,reducedMotion:reduced});
      const bob=pose.bob,turn=pose.face;
      // Contact shadows, a directional stance, and class-specific accents add depth to flat sprite art.
      quad('shadow',x,y+9,isHero?77:53,isHero?25:19,{color:[.08,.16,.21,.72]});
      if(heroActive||heroTarget)quad('glow',x,y-43,138,145,{blend:'add',color:heroTarget?[1,.55,.3,.3]:[.45,.76,1,.25]});
      if(heroActive||heroTarget)quad('ring',x,y+3,79,45,{color:heroTarget?[1,.8,.35,.85]:[.37,.88,1,.89]});
      if(!isHero&&data.ownerId===you&&(selectedSquad==='all'||selectedSquad===data.type)){
        quad('ring',x,y+6,70,40,{color:[1,.8,.38,.86]});
        if(budget.softLight)quad('glow',x,y-12,91,72,{blend:'add',color:[.97,.75,.35,.17]});
      }
      const idx=Math.max(0,players.findIndex(a=>a.id===data.id));
      const imgId=1+team*3+idx%3;
      if(isHero){
        if(pose.trail>.2&&!reduced)quad('glow',x-turn*22,y-36,60,90,{blend:'add',color:team===0?[.16,.6,1,pose.trail*.11]:[1,.25,.12,pose.trail*.11]});
        const sprite=motionSprite(imgId,pose,t,p?.walk||0,reduced,next!=='performance'&&rigReady.has(imgId));
        quad(sprite.id,x,y-size/2+bob,size*.58*pose.scale,size*pose.scale,{uv:sprite.uv,rotation:pose.lean});
        if(pose.state==='attack')quad('slash',x+turn*35,y-49,76,54,{rotation:turn*.28,blend:'add',color:[1,.92,.68,Math.min(.65,visualStrike*.64)]});
      }else {
        for(let i=-1;i<=1;i++){
          const shift=reduced?0:Math.sin((p?.walk||0)*1.3+i*1.7)*Math.max(0,p?.speed||0)*3;
          const sid=1+team*3+(i+3)%3;const sprite=motionSprite(sid,pose,t+i*.12,p?.walk||0,reduced,next!=='performance'&&rigReady.has(sid));
          quad(sprite.id,x+i*15,y-19+Math.abs(i)*5+bob+shift,25,56,{uv:sprite.uv,color:[.9,.92,.98,.94],rotation:pose.lean*.4});
        }
      }
      if(pose.flash>0)quad('spark',x,y-45,100,100,{blend:'add',color:[1,.66,.4,pose.flash]});
      bar(x,y-size+11,isHero?52:39,5,data.hp/data.maxHp,team===1?[1,.42,.38,1]:[.34,.85,.99,1]);
    }
    // All impact timestamps come from server snapshots. Particle positions are deterministic visuals only.
    for(const fx of room?.fx||[]){const impact=impactFrame(fx,elapsed);if(!impact)continue;
      const {phase,intensity,severe,radius,alpha}=impact,x=fx.x*10,y=groundY(fx.y*10);
      const hostile=(fx.team??fx.side)===1;
      quad('glow',x,y,radius*1.8,radius*1.1,{blend:'add',color:hostile?[1,.3,.12,alpha*.56]:[.29,.74,1,alpha*.58]});
      if(severe)quad('dust',x,y+24,radius*2,radius*.9,{color:[.75,.69,.6,intensity*.55]});
      else quad('slash',x,y-16,radius*1.1,radius*.53,{rotation:phase*2.4,blend:'add',color:[1,.87,.64,alpha]});
      if(!reduced){const n=severe?budget.shards:Math.ceil(budget.shards/3);
        for(let i=0;i<n;i++){
          const angle=seeded(i+fx.t*17)*Math.PI*2,spread=(15+(i%7)*7)*(severe?3:1)*phase;
          const dx=Math.cos(angle)*spread,dy=Math.sin(angle)*spread+phase*phase*52;
          const id=severe?'rock':'spark';const dim=severe?9+i%4*5:5+i%3*4;
          quad(id,x+dx,y-18+dy,dim,dim*1.1,{rotation:phase*(i%2?3:-3),blend:severe?'alpha':'add',color:severe?[.94,.81,.65,intensity*.95]:[1,.74,.38,intensity*.9]});
        }
      }
    }
    // A small ambient foreground veil provides occlusion and consistent depth at sunset.
    if(budget.softLight){
      quad('dust',180,595,530,98,{screen:true,color:[.36,.45,.52,.13]});
      quad('dust',850,603,460,105,{screen:true,color:[.37,.38,.39,.14]});
    }
    // Small unobtrusive commander frame and objective hints; large CSS HUD remains accessible.
    if(me){const c=faction(me.team??me.side??0);bar(131,550,185,10,me.hp/me.maxHp,c,true);}
    gpu.flush();lastRoom=room;
  }
  return {kind:gpu.kind,render,resize:(w,h,dpr)=>gpu.resize(w,h,dpr),setQuality:q=>gpu.setQuality(q),toWorld:(x,y)=>{const p=gpu.toWorld(x,y);return {x:p.x,y:inverseGroundY(p.y)};},stats:()=>({...gpu.stats(),loadedAssets:loaded,liveSiegeProps:true,loadedGateAssets:gateLoaded,loadedRigAtlases:rigLoaded}),dispose:()=>{disposed=true;gpu.dispose();}};
}
