import {graphicsPreset,GRAPHICS_PRESETS} from './battle-motion.js';
/** Starfort battle visual layer (v1.7): animated, asset-backed Canvas2D renderer.
 * Display only: hit detection, movement, HP and objectives remain server-authoritative.
 */
export const ART_ASSETS = Object.freeze([
  'assets/battlefield.webp',
  'assets/unit-dawn-1.webp','assets/unit-dawn-2.webp','assets/unit-dawn-3.webp',
  'assets/unit-dusk-1.webp','assets/unit-dusk-2.webp','assets/unit-dusk-3.webp'
]);
export function loadBattleArt(ctor = typeof Image === 'function' ? Image : null){
  return ART_ASSETS.map(src=>{
    if(!ctor)return {src,complete:false,naturalWidth:0};
    const im = new ctor(); im.decoding='async'; im.src=src; return im;
  });
}
const TEAM=['#7bd8f6','#ff978e'];
const clip=(v,a,b)=>Math.max(a,Math.min(b,v));
const playerPos=p=>({x:p.x*10,y:p.y*10});
function circle(ctx,x,y,r,stroke,fill,weight=2){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=weight;ctx.strokeStyle=stroke;ctx.stroke()}
}
function diamond(ctx,x,y,r,color){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function safeImage(ctx,img,x,y,w,h){if(img?.complete && img.naturalWidth>0)ctx.drawImage(img,x,y,w,h);else return false;return true}
function glow(ctx,x,y,r,rgba){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
export function renderBattleFrame(ctx,room,you,art,clock=0,selectedTarget=null,options={}){
  const W=1000,H=600;
  const quality=graphicsPreset(options.quality||'ultra');
  const preset=GRAPHICS_PRESETS[quality],low=quality==='performance';
  const frame=options.motion?.sample(room,clock);
  const reduced=!!options.reducedMotion;
  ctx.save();ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=low?'medium':'high';
  if(!reduced&&preset.shake&&frame?.shake)ctx.translate(frame.shake.x,frame.shake.y);
  // Cinematic scenic artwork: no heavy grids or opaque blue rectangles.
  if(!safeImage(ctx,art[0],0,0,W,H)){
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1c354a');g.addColorStop(1,'#39434a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
  let shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#050e1d22');shade.addColorStop(.38,'#06132144');shade.addColorStop(1,'#03132255');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  // Environment-first staging: avoid the former rectangular debug board and bright frame.
  // Smoky ground haze and a natural falloff preserve the illustrated fortress scene.
  const atmosphere=ctx.createLinearGradient(0,160,0,600);
  atmosphere.addColorStop(0,'#19252a00');
  atmosphere.addColorStop(.7,'#28343216');
  atmosphere.addColorStop(1,'#d1a06b19');
  ctx.fillStyle=atmosphere;ctx.fillRect(0,160,W,440);
  if(!low&&!reduced){
    for(let i=0;i<13;i++){
      const px=74+((i*161.3+clock*(i%3+1)*2.2)%860),py=390+(i*37)%165;
      ctx.globalAlpha=.04+(i%4)*.015;
      glow(ctx,px,py,35+i%5*13,i%3===0?'#f5c68b60':'#b4d5d050');
    }
    ctx.globalAlpha=1;
  }
  // Capture areas are gold-inlaid magical circles, not white wireframe circles.
  const points=[{x:500,y:200},{x:500,y:400}];
  if(!options.duel&&room?.variant!=='siege')points.forEach((p,i)=>{
    const team=room?.capture?.[i],color=team===null||team===undefined?'#f4d59a':TEAM[team],pulse=Math.sin(clock*2.7+i)*.08;
    glow(ctx,p.x,p.y,125,team===0?'#2bc6ec23':team===1?'#f16d6522':'#e0bb7920');
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clock*.08*(i?1:-1));ctx.strokeStyle=color;ctx.globalAlpha=.68;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,88,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([12,9]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,103,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(let j=0;j<8;j++){const a=j*Math.PI/4;diamond(ctx,Math.cos(a)*88,Math.sin(a)*88,4,color)}
    ctx.restore();
    circle(ctx,p.x,p.y,36+pulse*12,color,'#06192bc9',3);
    diamond(ctx,p.x,p.y-4,19,'#e9c989');diamond(ctx,p.x,p.y-4,13,team===0?'#409ab9':team===1?'#a95f62':'#25435b');
    ctx.fillStyle='#fff4db';ctx.font='bold 17px Georgia';ctx.textAlign='center';ctx.fillText(i===0?'A':'B',p.x,p.y+2);
    ctx.fillStyle='#fff1ce';ctx.font='bold 12px system-ui';ctx.fillText('SANCAK',p.x,p.y+57);
  });
  // Art-directed, textured gatehouse with proper visual depth instead of a flat grey stripe.
  // Collision and HP remain owned by the server; architecture is presentation only.
  if(room?.variant==='siege'&&room.siege){
    const {gate,core}=room.siege,damage=1-clip(gate.hp/gate.maxHp,0,1),gateDown=gate.hp<=0;
    ctx.save();
    // Broad ambient contact shadow integrates the fortifications into the terrain.
    const wallShadow=ctx.createLinearGradient(444,0,588,0);
    wallShadow.addColorStop(0,'#00000000');wallShadow.addColorStop(.35,'#081116bb');
    wallShadow.addColorStop(.68,'#090e13aa');wallShadow.addColorStop(1,'#00000000');
    ctx.fillStyle=wallShadow;ctx.fillRect(440,70,155,493);
    function masonryWall(y,h){
      const rock=ctx.createLinearGradient(478,0,558,0);
      rock.addColorStop(0,'#11191c');rock.addColorStop(.13,'#6b6a5e');
      rock.addColorStop(.28,'#939083');rock.addColorStop(.58,'#4c514e');
      rock.addColorStop(.87,'#292f2d');rock.addColorStop(1,'#111719');
      ctx.fillStyle=rock;ctx.fillRect(476,y,82,h);
      // Individual weathered stone courses, offset joints and aged mortar shadows.
      for(let row=0,yy=y;yy<y+h;row++,yy+=19){
        const rowH=Math.min(19,y+h-yy),shift=row%2?16:0;
        for(let xx=476-shift;xx<557;xx+=33){
          const x=Math.max(478,xx),end=Math.min(555,xx+31);
          if(end<=x)continue;
          const jitter=((row*11+xx*7)%7)-3;
          ctx.fillStyle=`rgba(${90+jitter*3},${89+jitter*3},${78+jitter*3},.13)`;
          ctx.fillRect(x+1,yy+2,end-x-2,rowH-4);
          ctx.strokeStyle='#101a1a77';ctx.lineWidth=1;ctx.strokeRect(x,yy,end-x,rowH);
          ctx.fillStyle='#e6d5ad18';ctx.fillRect(x+2,yy+2,end-x-3,1);
        }
      }
      ctx.fillStyle='#0b1519bb';ctx.fillRect(549,y,8,h);
      ctx.fillStyle='#cfbd8d55';ctx.fillRect(476,y,3,h);
      // Battlements sit on the wall and break its monotonous outline.
      for(let yy=y+4;yy<y+h-5;yy+=58){
        ctx.fillStyle='#272f2f';ctx.fillRect(468,yy,11,26);
        ctx.fillStyle='#858072';ctx.fillRect(469,yy+1,8,20);
        ctx.fillStyle='#a39a7e99';ctx.fillRect(469,yy+1,8,2);
      }
    }
    masonryWall(77,174);masonryWall(344,213);
    // Two stone towers lit by torch fire: stepped foundations, cornices and merlons.
    for(const yy of [120,510]){
      ctx.save();ctx.translate(518,yy);
      const tw=ctx.createLinearGradient(-54,0,54,0);
      tw.addColorStop(0,'#1c2526');tw.addColorStop(.3,'#858579');tw.addColorStop(.56,'#a19a84');tw.addColorStop(1,'#283035');
      ctx.fillStyle='#09121699';ctx.fillRect(-63,7,125,23);
      ctx.fillStyle=tw;ctx.beginPath();ctx.moveTo(-44,-32);ctx.lineTo(43,-32);ctx.lineTo(52,19);ctx.lineTo(-52,19);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ccad7f88';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-55,-11);ctx.lineTo(55,-11);ctx.stroke();
      for(let x=-48;x<=46;x+=25){ctx.fillStyle='#737268';ctx.fillRect(x,-43,17,17);ctx.fillStyle='#a5a18d';ctx.fillRect(x+2,-43,3,16)}
      glow(ctx,0,10,58,'#ff9b483b');
      ctx.fillStyle='#382a1f';ctx.fillRect(-9,2,18,5);
      ctx.fillStyle='#f8b25e';ctx.beginPath();ctx.moveTo(-6,0);ctx.quadraticCurveTo(-11,-12,2,-22);ctx.quadraticCurveTo(14,-4,7,0);ctx.closePath();ctx.fill();
      ctx.restore();
    }
    // Dimensional arched entry / breakable oak portcullis.
    ctx.fillStyle='#0b1218';ctx.beginPath();ctx.moveTo(482,344);ctx.lineTo(482,289);
    ctx.quadraticCurveTo(480,248,517,244);ctx.quadraticCurveTo(555,249,555,289);
    ctx.lineTo(555,344);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#a49b82';ctx.lineWidth=8;ctx.stroke();
    ctx.strokeStyle='#2c2b2b';ctx.lineWidth=3;ctx.stroke();
    if(!gateDown){
      const oak=ctx.createLinearGradient(489,0,544,0);
      oak.addColorStop(0,'#20170f');oak.addColorStop(.23,'#765338');oak.addColorStop(.5,'#a07445');oak.addColorStop(.78,'#553923');oak.addColorStop(1,'#211812');
      ctx.save();ctx.beginPath();ctx.moveTo(491,345);ctx.lineTo(491,288);
      ctx.quadraticCurveTo(494,252,518,254);ctx.quadraticCurveTo(542,257,545,289);
      ctx.lineTo(545,345);ctx.closePath();ctx.clip();ctx.fillStyle=oak;ctx.fillRect(490,250,57,96);
      for(let i=0;i<6;i++){
        ctx.strokeStyle=i%2?'#281c13aa':'#d0a06a55';ctx.lineWidth=i%2?3:1;
        ctx.beginPath();ctx.moveTo(491+i*11,253);ctx.lineTo(491+i*11,347);ctx.stroke();
      }
      ctx.strokeStyle='#28231f';ctx.lineWidth=5;
      for(let y=278;y<346;y+=23){ctx.beginPath();ctx.moveTo(488,y);ctx.lineTo(546,y);ctx.stroke()}
      ctx.strokeStyle='#c39e69';ctx.lineWidth=1.5;
      for(let y=278;y<346;y+=23){ctx.beginPath();ctx.moveTo(490,y-3);ctx.lineTo(544,y-3);ctx.stroke()}
      for(let i=0;i<9;i++){
        const xx=494+(i%3)*21,yy=278+Math.floor(i/3)*23;
        circle(ctx,xx,yy,2,'#0b1218','#bdac83',.7);
      }
      if(damage>.16){
        ctx.strokeStyle='#f39c5aaa';ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(520,263);ctx.lineTo(507,287);ctx.lineTo(528,315);ctx.lineTo(513,337);ctx.stroke();
      }
      ctx.restore();
    }else{
      for(let i=0;i<22;i++){
        const xx=487+(i*19)%65,yy=328+(i*13)%27;
        ctx.save();ctx.translate(xx,yy);ctx.rotate(i*.45);ctx.fillStyle=i%3?'#827768':'#4a433d';ctx.fillRect(-6,-3,8+i%6,4+i%4);ctx.restore();
      }
      if(!low)glow(ctx,517,314,66,'#ffb35c3e');
    }
    // Red defensive banners signal the defending faction and share the world's light.
    for(const [bx,by] of [[481,152],[556,405]]){
      ctx.save();ctx.translate(bx,by);
      ctx.fillStyle='#4b1f22';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(23,3);ctx.lineTo(22,60);ctx.lineTo(12,53);ctx.lineTo(0,59);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#d7a06d';ctx.lineWidth=1.2;ctx.stroke();
      ctx.fillStyle='#d9b38a';ctx.font='21px Georgia';ctx.fillText('✦',4,32);ctx.restore();
    }
    // Magical heart: a focused focal point, no oversized wireframe circle.
    const pulse=1+Math.sin(clock*1.8)*.035;
    if(!low)glow(ctx,780,301,100,'#46d9ff3d');
    ctx.save();ctx.translate(780,300);ctx.scale(pulse,pulse);
    ctx.fillStyle='#111923b0';ctx.beginPath();ctx.ellipse(0,62,53,15,0,0,Math.PI*2);ctx.fill();
    const pedestal=ctx.createLinearGradient(-37,0,42,0);pedestal.addColorStop(0,'#212e34');pedestal.addColorStop(.5,'#9a978b');pedestal.addColorStop(1,'#18252e');
    ctx.fillStyle=pedestal;ctx.beginPath();ctx.moveTo(-42,30);ctx.lineTo(43,30);ctx.lineTo(28,69);ctx.lineTo(-28,69);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#bd9e6e';ctx.lineWidth=2;ctx.stroke();
    const crystal=ctx.createLinearGradient(-24,-50,26,32);
    crystal.addColorStop(0,'#ffffff');crystal.addColorStop(.25,'#9af7ff');crystal.addColorStop(.58,'#2ac5e2');crystal.addColorStop(1,'#0e4b84');
    ctx.fillStyle=crystal;ctx.beginPath();ctx.moveTo(0,-56);ctx.lineTo(28,-8);ctx.lineTo(12,40);ctx.lineTo(0,54);ctx.lineTo(-21,30);ctx.lineTo(-28,-9);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c9faff';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#f8ffffaa';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-56);ctx.lineTo(0,54);ctx.moveTo(-28,-9);ctx.lineTo(12,40);ctx.stroke();
    if(core.hp/core.maxHp<.5){ctx.strokeStyle='#ffdece';ctx.beginPath();ctx.moveTo(-9,-26);ctx.lineTo(13,-4);ctx.lineTo(-10,18);ctx.stroke()}
    ctx.restore();
    // Three discreet objective meters share one consistent top-edge visual language.
    const metrics=[['KAPI',gate,470,'#e5b97c'],['ÇEKİRDEK',core,715,'#69dfff']];
    for(const [label,obj,px,color] of metrics){
      rounded(ctx,px,39,152,29,7);ctx.fillStyle='#08151fc9';ctx.fill();
      ctx.strokeStyle='#e0c99e55';ctx.lineWidth=1;ctx.stroke();
      ctx.font='bold 10px system-ui';ctx.textAlign='left';ctx.fillStyle='#f1e7d7';ctx.fillText(label,px+10,px===470?50:50);
      rounded(ctx,px+10,56,132,4,2);ctx.fillStyle='#1c2830';ctx.fill();
      rounded(ctx,px+10,56,132*clip(obj.hp/obj.maxHp,0,1),4,2);ctx.fillStyle=color;ctx.fill();
    }
    ctx.restore();
  }
  // Escort-powered siege ram; position and durability are exclusively server-supplied.
  if(room?.variant==='siege'&&room.siege?.ram){
    const ram=room.siege.ram,x=ram.x*10,y=ram.y*10+17,alive=ram.hp>0;
    const shade=ctx.createRadialGradient(x,y+6,4,x,y+6,84);
    shade.addColorStop(0,'#010b16bb');shade.addColorStop(1,'#010b1600');
    ctx.fillStyle=shade;ctx.fillRect(x-90,y-35,180,80);
    ctx.save();ctx.translate(x,y);
    if(!alive){
      ctx.fillStyle='#392b29';ctx.fillRect(-38,-4,80,10);
      for(let i=0;i<8;i++){
        const xx=-35+i*10,yy=(i*13)%15;
        ctx.save();ctx.translate(xx,yy);ctx.rotate(i*.43);ctx.fillStyle=i%2?'#6a4835':'#8b7a6d';ctx.fillRect(-9,-3,20,6);ctx.restore();
      }
      if(!low&&!reduced)for(let i=0;i<6;i++){
        ctx.globalAlpha=.22*(1+i%2);circle(ctx,-15+i*8,-22-Math.sin(clock*.9+i)*12,5+i%3,null,'#afa7a2');
      }
      ctx.globalAlpha=1;
    }else{
      if(!low)glow(ctx,0,-22,73,ram.phase==='ramming'?'#fbb56536':'#92e8ec17');
      const shake=ram.phase==='ramming'&&!reduced?Math.sin(clock*12)*3:0;
      // Wheels and chassis are painted as miniature, layered 2.5D shapes.
      for(const dx of [-30,33]){
        circle(ctx,dx,11,17,'#c0a06b','#17232b',4);
        circle(ctx,dx,11,11,'#5e4535','#785a3c',3);
        for(let i=0;i<6;i++){const a=i*Math.PI/3+clock*(ram.phase==='advancing'?.8:0);
          ctx.strokeStyle='#d8b583';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx,11);ctx.lineTo(dx+Math.cos(a)*10,11+Math.sin(a)*10);ctx.stroke();}
        circle(ctx,dx,11,3,'#efd39c','#846442',2);
      }
      const wood=ctx.createLinearGradient(-52,-40,52,18);wood.addColorStop(0,'#e2bf81');wood.addColorStop(.3,'#5b3c2b');wood.addColorStop(.68,'#9b6b42');wood.addColorStop(1,'#2e2b2a');
      ctx.fillStyle=wood;rounded(ctx,-53,-45,108,38,7);ctx.fill();ctx.strokeStyle='#d3a973';ctx.lineWidth=3;ctx.stroke();
      // Tower roof of iron-banded laminated timber.
      ctx.beginPath();ctx.moveTo(-55,-44);ctx.lineTo(-38,-63);ctx.lineTo(34,-63);ctx.lineTo(56,-44);ctx.closePath();
      const roof=ctx.createLinearGradient(0,-63,0,-42);roof.addColorStop(0,'#1a303c');roof.addColorStop(.5,'#495b62');roof.addColorStop(1,'#162632');ctx.fillStyle=roof;ctx.fill();ctx.strokeStyle='#d7bd83';ctx.stroke();
      for(const px of [-34,-11,12,35]){ctx.fillStyle='#b6a07b';ctx.fillRect(px,-46,4,35);ctx.fillStyle='#33424b';ctx.fillRect(px+2,-44,1,30);}
      ctx.strokeStyle='#e5cb8c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-49,-10);ctx.lineTo(48,-10);ctx.moveTo(-50,-40);ctx.lineTo(50,-40);ctx.stroke();
      // Heavy, animated iron-head battering beam (moves forward when striking).
      const extension=ram.phase==='ramming'?6+Math.sin(clock*14)*7:0;
      ctx.fillStyle='#59382b';rounded(ctx,-57,-31,115+extension,13,4);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#d5aa77';ctx.stroke();
      const iron=ctx.createLinearGradient(46,0,72,0);iron.addColorStop(0,'#263544');iron.addColorStop(.6,'#e5dbbb');iron.addColorStop(1,'#425765');
      ctx.fillStyle=iron;ctx.beginPath();ctx.moveTo(52+extension,-36);ctx.lineTo(71+extension,-30);ctx.lineTo(74+extension,-22);ctx.lineTo(52+extension,-15);ctx.closePath();ctx.fill();ctx.strokeStyle='#f2d49d';ctx.stroke();
      // Faction banner.
      ctx.strokeStyle='#e0c38b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-29,-62);ctx.lineTo(-29,-90);ctx.stroke();
      ctx.fillStyle='#27698c';ctx.beginPath();ctx.moveTo(-28,-88);ctx.lineTo(4,-84);ctx.lineTo(-28,-75);ctx.closePath();ctx.fill();
      ctx.fillStyle='#e8d9aa';ctx.font='bold 12px Georgia';ctx.fillText('✦',-19,-79);
      if(!reduced&&ram.phase==='advancing'){
        for(let i=0;i<(low?0:5);i++){
          ctx.globalAlpha=.15+i*.035;circle(ctx,-58-i*9,17-(i%3)*5,2+i%3,null,'#e7c99d');
        }ctx.globalAlpha=1;
      }
    }
    ctx.restore();
    const bar=clip(ram.hp/ram.maxHp,0,1);
    ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillStyle='#f8e6c4';
    ctx.shadowColor='#050b10';ctx.shadowBlur=5;
    ctx.fillText(alive?'KOÇBAŞI':'YENİDEN GELİYOR',x,y+38);ctx.shadowBlur=0;
    rounded(ctx,x-28,y+44,56,4,2);ctx.fillStyle='#172630';ctx.fill();
    rounded(ctx,x-27,y+45,54*bar,2,1);ctx.fillStyle='#dbbc7d';ctx.fill();
  }

  // Magical ambient dust particles (deterministic trigonometric positions).
  for(let n=0;n<(reduced?0:preset.particles);n++){
    const x=40+((n*97.71+clock*(n%3+1)*5)%920),y=90+((n*151.17+Math.sin(clock*.6+n)*19)%450);
    ctx.globalAlpha=.12+.16*(.5+.5*Math.sin(clock+n*2.4));circle(ctx,x,y,n%4===0?2.2:1,null,n%3===0?'#f5c97e':'#a1e4fc');
  }
  ctx.globalAlpha=1;
  if(room){
    const me=room.players.find(p=>p.id===you),sprites=art.slice(1);
    // Sort by vertical position so miniatures naturally overlap.
    const units=[];
    for(const s of room.squads||[])if(s.hp>0)units.push({kind:'squad',data:s});
    for(const p of room.players||[])if(p.hp>0)units.push({kind:'hero',data:p});
    units.sort((a,b)=>a.data.y-b.data.y);
    for(const entity of units){
      const item=entity.data,pose=frame?.actors.get(String(item.id)),{x,y}=pose?{x:pose.x,y:pose.y}:playerPos(item),faction=item.team,color=TEAM[faction];
      const shadow=ctx.createRadialGradient(x,y+8,1,x,y+8,37);shadow.addColorStop(0,'#030b12aa');shadow.addColorStop(1,'#030b1200');ctx.fillStyle=shadow;ctx.fillRect(x-38,y-20,76,56);
      ctx.save();const hero=entity.kind==='hero';
      const active=hero&&item.id===you,target=hero&&item.id===selectedTarget,unitSelected=!hero&&item.ownerId===you&&(options.selectedSquad==='all'||options.selectedSquad===item.type);
      if(hero){
        const img=sprites[faction*3+((room.players.findIndex(p=>p.id===item.id)%3+3)%3)];
        const height=active?92:76,width=height*.58;
        glow(ctx,x,y-38,active?64:47,active?'#f1ca7e3a':faction?'#dc59653b':'#49b6eb35');
        // Procedural gait, turning, idle breathing and hit reaction: drawn at 60fps
        // while world positions still originate exclusively from server snapshots.
        const speed=reduced?0:(pose?.speed||0);
        const bob=(reduced?0:Math.sin(clock*2.6+item.x*.2)*.7)+Math.sin((pose?.walk||0)*2.7)*speed*3.3;
        const lean=(reduced?0:Math.sin((pose?.walk||0)*2.7)*speed*.045);
        ctx.save();ctx.translate(x,y);ctx.scale(pose?.face===-1?-1:1,1);ctx.rotate(lean);
        const drawn=safeImage(ctx,img,-width/2,-height+bob+10,width,height);ctx.restore();
        if(!drawn){
          circle(ctx,x,y-20,22,color,faction?'#562c35':'#234b67',3);
          ctx.fillStyle='#f6e6cb';ctx.font='bold 20px Georgia';ctx.textAlign='center';ctx.fillText('✦',x,y-13);
        }
        ctx.shadowBlur=low?0:active?23:10;ctx.shadowColor=color;
        ctx.beginPath();ctx.ellipse(x,y+8,active?27:23,9,0,0,Math.PI*2);ctx.strokeStyle=active?'#ffe2a6':color;ctx.lineWidth=active?4:2.5;ctx.stroke();ctx.shadowBlur=0;
        if(target){ctx.setLineDash([5,3]);circle(ctx,x,y-18,42,'#ffe692',null,2);ctx.setLineDash([])}
        if(pose?.hit>0){ctx.globalAlpha=pose.hit*.7;circle(ctx,x,y-height*.45,36+20*(1-pose.hit),'#fff5cd',null,3);glow(ctx,x,y-height*.45,45,'#ffb89465');ctx.globalAlpha=1;}
        if(preset.trail&&!reduced&&speed>.18){const back=-(pose?.face||1);for(let k=0;k<3;k++){ctx.globalAlpha=.12*(1-k/3)*speed;circle(ctx,x+back*(k*10+8),y+6-k*3,7+k*4,null,faction?'#fd987e':'#94e1f7');}ctx.globalAlpha=1;}
        // Retain only actionable nameplates. Dense 5v5 scenarios otherwise read as debug UI.
        const health=clip(item.hp/item.maxHp,0,1);
        if(active||target){
          const widthName=Math.max(62,Math.min(120,item.name.length*7+16));
          rounded(ctx,x-widthName/2,y-height-19,widthName,18,5);
          ctx.fillStyle='#07131dce';ctx.fill();ctx.lineWidth=1;
          ctx.strokeStyle=active?'#e9c58b':color;ctx.stroke();
          ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0d5';
          ctx.fillText(item.name.slice(0,15),x,y-height-6);
        }
        rounded(ctx,x-22,y-height+5,44,4,2);ctx.fillStyle='#04131b';ctx.fill();
        rounded(ctx,x-21,y-height+6,42*health,2,1);
        ctx.fillStyle=health<.25?'#f2746c':color;ctx.fill();
      }else{
        const guard=item.type==='guard',size=guard?14:11;
        // Unit squads shown as three armored figures, rather than abstract diamonds.
        for(let k=-1;k<=1;k++){
          const offset=k*8;
          ctx.fillStyle=faction?'#412a31':'#253e49';
          ctx.beginPath();ctx.moveTo(x+offset-5,y+4);ctx.lineTo(x+offset-4,y-14);ctx.lineTo(x+offset+4,y-14);ctx.lineTo(x+offset+6,y+4);ctx.closePath();ctx.fill();
          circle(ctx,x+offset,y-16,guard?4.6:3.6,'#d4c49d',faction?'#bd716a':'#7aaebc',1);
          ctx.strokeStyle=guard?'#e6bd7b':'#adcaad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+offset+4,y-5);ctx.lineTo(x+offset+8,y-17);ctx.stroke();
        }
        ctx.beginPath();ctx.ellipse(x,y+9,guard?23:21,7,0,0,Math.PI*2);ctx.strokeStyle=unitSelected?'#ffe2a6':color;ctx.lineWidth=unitSelected?4:2;ctx.stroke();
        ctx.fillStyle='#061722d9';rounded(ctx,x-21,y-35,42,5,2);ctx.fill();ctx.fillStyle=color;rounded(ctx,x-20,y-34,40*clip(item.hp/item.maxHp,0,1),3,1);ctx.fill();
      }
      ctx.restore();
    }
    for(const fx of room.fx||[]){
      const age=room.elapsed-fx.t;if(age<0||age>.7)continue;
      const progress=age/.7,x=fx.x*10,y=fx.y*10,color=fx.type==='ko'?'#ff6678':TEAM[fx.team];
      ctx.save();ctx.globalAlpha=(1-progress)*.85;ctx.globalCompositeOperation='screen';
      const demolition=['gate-down','core-down','ram-down'].includes(fx.type);
      const heavy=fx.type==='ram-strike';
      const radius=demolition?32+progress*115:heavy?25+progress*72:fx.type==='burst'?35+progress*95:fx.type==='dash'?15+progress*55:15+progress*38;
      if(!reduced&&fx.type==='attack'){ctx.lineWidth=5*(1-progress);ctx.strokeStyle='#fff5bf';ctx.shadowBlur=preset.shadows;ctx.shadowColor=color;ctx.beginPath();ctx.arc(x,y-12,18+progress*44,-1.25,1.2);ctx.stroke();ctx.shadowBlur=0;}
      if(!reduced&&fx.type==='dash'){ctx.lineWidth=12*(1-progress);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x-32,y+13);ctx.lineTo(x+18+progress*30,y-21);ctx.stroke();}
      if((heavy||demolition)&&!reduced){
        const pieces=low?7:demolition?26:15;
        for(let i=0;i<pieces;i++){
          const a=i*2.399963+fx.t*4,velocity=(0.5+(i%5)*.19)*radius;
          const px=x+Math.cos(a)*velocity,py=y-12+Math.sin(a)*velocity*.65+progress*progress*39;
          const side=(2+i%4)*(1-progress)+.6;
          ctx.save();ctx.translate(px,py);ctx.rotate(a+progress*5);
          ctx.fillStyle=i%3===0?'#ffeac0':i%3===1?'#8a8e90':'#b77a4e';
          ctx.fillRect(-side,-side,side*2.2,side*1.5);ctx.restore();
        }
        if(!low)glow(ctx,x,y-12,radius*1.3,demolition?'#e89d677d':'#fbd3a778');
      }
      if(!low)glow(ctx,x,y-12,radius,fx.type==='burst'?'#c3a3ffad':fx.type==='ko'?'#f16a79a5':fx.team?'#f6b3a4a9':'#9bdfffaa');
      circle(ctx,x,y-12,radius,color,null,fx.type==='burst'?7:3);
      for(let i=0;i<(fx.type==='burst'?18:8);i++){
        const a=i*Math.PI*2/(fx.type==='burst'?18:8)+fx.t*4;
        const xx=x+Math.cos(a)*radius,yy=y-12+Math.sin(a)*radius;
        ctx.fillStyle=i%2?'#fff3c6':color;ctx.fillRect(xx-2,yy-2,4,4)
      }
      ctx.restore();
    }
    // Compact live status plate overlay.
    if(me){
      rounded(ctx,36,490,196,56,8);ctx.fillStyle='#061522e9';ctx.fill();ctx.strokeStyle='#d4ad6b9c';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font='bold 12px system-ui';ctx.fillStyle='#f3d49a';ctx.textAlign='left';ctx.fillText(options.duel?'DÜELLO':'KOMUTAN',49,507);
      ctx.font='bold 17px Georgia';ctx.fillStyle='#f8eed8';ctx.fillText(`${Math.ceil(me.hp)} / ${me.maxHp} CAN`,49,526);
      rounded(ctx,49,534,168,5,2);ctx.fillStyle='#1c3440';ctx.fill();rounded(ctx,50,535,166*clip(me.hp/me.maxHp,0,1),3,1);ctx.fillStyle=me.hp/me.maxHp<.3?'#ed7470':'#66cfb9';ctx.fill();
    }
  }
  // Ultra-only cinematic grade. Keeps actual playable hitboxes unchanged.
  if(quality==='ultra'&&!reduced){
    const mist=ctx.createLinearGradient(0,390,0,590);mist.addColorStop(0,'#a8ccf200');mist.addColorStop(.8,'#80bdc009');mist.addColorStop(1,'#e5c68a19');ctx.fillStyle=mist;ctx.fillRect(0,380,W,210);
    const rim=ctx.createLinearGradient(0,0,0,160);rim.addColorStop(0,'#ffdb9e18');rim.addColorStop(1,'#ffdb9e00');ctx.fillStyle=rim;ctx.fillRect(0,0,W,160);
  }
  // Vignette keeps labels legible without hiding illustration.
  const vign=ctx.createRadialGradient(500,305,150,500,305,660);vign.addColorStop(0,'#06121b00');vign.addColorStop(1,'#06121b99');ctx.fillStyle=vign;ctx.fillRect(0,0,1000,600);
  ctx.restore();
}
