// Canvas-drawn architecture, composited onto the authored village panorama.
// Geometry is authored in world space and identical in gameplay and previews.
import {masteryArchitectureForLevel,MASTERY_START_LEVEL} from './mastery-architecture.js';
function polygon(ctx,points,color,stroke){
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function jewel(ctx,x,y,r,o){
 ctx.save();ctx.shadowColor=o.highlight;ctx.shadowBlur=12;
 polygon(ctx,[[x,y-r],[x+r*.65,y],[x,y+r],[x-r*.65,y]],o.accent,o.highlight);
 ctx.fillStyle='#fffce0';ctx.beginPath();ctx.arc(x-r*.16,y-r*.17,Math.max(.8,r*.2),0,Math.PI*2);ctx.fill();ctx.restore();
}
function flag(ctx,x,tip,o){
 ctx.strokeStyle='#f1d8a0';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,tip);ctx.stroke();
 polygon(ctx,[[x,tip],[x+27,tip+6],[x+18,tip+15],[x,tip+18]],o.accent,o.highlight);
 jewel(ctx,x+12,tip+8,3.5,o);
}
export function paintMasteryOrnament(ctx,o){
 ctx.save();ctx.translate(o.x,o.y);const k=o.height/80;ctx.scale(k,k);
 // Plinth and grounding shadow keep the decorations anchored to the village.
 ctx.fillStyle='#0b15238c';ctx.beginPath();ctx.ellipse(0,1,28,7,0,0,Math.PI*2);ctx.fill();
 const stone=ctx.createLinearGradient(-22,-12,24,0);
 stone.addColorStop(0,'#263d52');stone.addColorStop(.55,o.base);stone.addColorStop(1,'#152535');
 ctx.fillStyle=stone;ctx.fillRect(-20,-8,40,8);ctx.strokeStyle=o.highlight;ctx.lineWidth=1.5;ctx.strokeRect(-20,-8,40,8);
 const arch=()=>{
  ctx.fillStyle=o.base;ctx.fillRect(-22,-53,9,45);ctx.fillRect(13,-53,9,45);
  polygon(ctx,[[-26,-51],[-15,-71],[15,-71],[26,-51],[15,-56],[-15,-56]],o.accent,o.highlight);
  jewel(ctx,0,-60,8,o);
 };
 switch(o.shape){
  case 'banner':
   flag(ctx,0,-82,o);ctx.fillStyle=o.accent;ctx.fillRect(-9,-13,18,7);break;
  case 'lantern':
   ctx.fillStyle=o.base;ctx.fillRect(-7,-64,14,56);
   polygon(ctx,[[-18,-59],[0,-79],[18,-59]],o.accent,o.highlight);
   jewel(ctx,0,-49,11,o);break;
  case 'turret':
   ctx.fillStyle=o.base;ctx.fillRect(-20,-58,40,50);
   for(let i=0;i<4;i++)ctx.fillRect(-24+i*14,-65,10,12);
   polygon(ctx,[[-25,-57],[0,-80],[25,-57]],o.accent,o.highlight);
   jewel(ctx,0,-39,8,o);break;
  case 'shield':
   ctx.fillStyle=o.base;ctx.fillRect(-11,-68,22,60);
   polygon(ctx,[[-25,-59],[25,-59],[20,-31],[0,-17],[-20,-31]],o.accent,o.highlight);
   jewel(ctx,0,-42,11,o);break;
  case 'arch':arch();break;
  case 'crystal':
   polygon(ctx,[[-25,-8],[-16,-44],[0,-76],[20,-38],[27,-8]],o.accent,o.highlight);
   jewel(ctx,0,-40,15,o);break;
  case 'twin-banner':flag(ctx,-15,-78,o);flag(ctx,15,-69,o);break;
  case 'obelisk':
   polygon(ctx,[[-15,-8],[-18,-54],[0,-93],[18,-54],[15,-8]],o.base,o.highlight);
   polygon(ctx,[[-18,-54],[0,-93],[18,-54]],o.accent,o.highlight);
   jewel(ctx,0,-44,10,o);break;
  case 'crown':
   arch();
   polygon(ctx,[[-24,-76],[-15,-89],[-6,-77],[0,-97],[7,-77],[16,-89],[24,-76],[20,-66],[-20,-66]],o.accent,o.highlight);
   jewel(ctx,0,-77,7,o);break;
  case 'beacons':
   for(const x of [-16,16]){
    ctx.fillStyle=o.base;ctx.fillRect(x-6,-42,12,34);
    jewel(ctx,x,-51,11,o);
   }
   break;
  case 'monument':
   arch();
   polygon(ctx,[[-14,-63],[0,-108],[14,-63],[10,-26],[-10,-26]],o.accent,o.highlight);
   jewel(ctx,0,-74,16,o);
   flag(ctx,-23,-69,o);break;
 }
 ctx.restore();
}
export function paintMasteryArchitecture(ctx,levels){
 for(const [id,level] of Object.entries(levels||{})){
  if(level<MASTERY_START_LEVEL)continue;
  for(const ornament of masteryArchitectureForLevel(id,level))paintMasteryOrnament(ctx,ornament);
 }
}
