/** Lightweight layered original character silhouettes for the STARFORT WebGL rig.
 * Keeps all mesh shapes anchored to existing articulated figure, no imported IP.
 * These shapes are presentation only and add no collider/hit point.
 */
const SKIN=[.70,.58,.47],STEEL=[.66,.69,.70],DARK=[.17,.20,.27];
const PALETTE=Object.freeze({
 aldren:[.80,.65,.34],lyra:[.60,.51,.89],rovan:[.38,.71,.48],
 mira:[.92,.76,.56],doran:[.81,.36,.34],vesper:[.68,.45,.74],
 eira:[.52,.78,.92]
});
export function characterMaterial(id,team=0){
 const c=PALETTE[id];return c|| (team===1?[.65,.25,.29]:[.26,.63,.78]);
}
export function drawCharacterDetail(mesh,item,{x,z,scale,shoulder,hip,time=0,quality='balanced',poseState}={}){
 if(!item||!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(scale))return 0;
 const role=item.role||'fighter',boss=item.type==='boss';
 const cloth=characterMaterial(item.heroId,item.team),rich=quality!=='performance';
 const headY=shoulder+.7*scale,back=z+.55*scale;
 let pieces=0;
 const box=(...args)=>{mesh.box(...args);pieces++};
 const prism=(...args)=>{mesh.prism(...args);pieces++};
 const pyramid=(...args)=>{mesh.pyramid(...args);pieces++};
 // Voxel helmet was the same for every role; a rounded crest and faceplate
 // make this silhouette readable even at a 720p mobile battle stage.
 prism(x,headY,z,.42*scale,.62*scale,role==='mage'?SKIN:STEEL,rich?10:6);
 box(x+.25*scale,headY+.02*scale,z,.09*scale,.18*scale,.28*scale,DARK);
 if(role==='mage'||role==='healer'){
  // Cloth shoulders, pointed ritual crown, runic staff aura.
  prism(x,shoulder+.35*scale,z,.95*scale,.22*scale,cloth,rich?9:6);
  pyramid(x,headY+.28*scale,z,.65*scale,.95*scale,cloth,rich?8:5);
  prism(x,headY+.85*scale,z,.20*scale,.39*scale,[.90,.88,.73],rich?8:5);
  if(rich)for(let j=0;j<4;j++){
   const a=j*Math.PI/2+time*.28;
   box(x+Math.cos(a)*.87*scale,shoulder-.45*scale,z+Math.sin(a)*.87*scale,.18,.14,.16,cloth);
  }
 }else if(role==='ranger'){
  // Hood, split quiver and arrow shafts.
  prism(x,headY+.22*scale,z,.67*scale,.27*scale,cloth,rich?9:6);
  box(x-.4*scale,shoulder-.38*scale,back,.35*scale,1.4*scale,.41*scale,DARK,{tilt:-.23});
  for(let j=0;j<(rich?4:2);j++){
   box(x+(-.47+j*.11)*scale,shoulder+.54*scale,back+.1*scale,.08*scale,.68*scale,.07*scale,STEEL,{tilt:.10});
  }
 }else if(role==='tank'){
  // Chest crest, rounded shoulder plates and an upright helmet spike.
  prism(x,shoulder+.14*scale,z,.85*scale,.25*scale,STEEL,rich?10:6);
  box(x,shoulder-.22*scale,z-.49*scale,.68*scale,.58*scale,.14*scale,cloth);
  pyramid(x,headY+.45*scale,z,.32*scale,.72*scale,cloth,rich?7:5);
 }else if(role==='assassin'){
  // Twin dagger insignia and lower hood.
  prism(x,headY+.12*scale,z,.59*scale,.3*scale,cloth,rich?8:6);
  for(const j of [-1,1])box(x+j*.28*scale,hip+.2*scale,back,.18*scale,1.3*scale,.13*scale,STEEL,{tilt:j*.16});
 }else{
  box(x,shoulder-.26*scale,z-.49*scale,.88*scale,.61*scale,.16*scale,cloth);
  for(const j of [-1,1])box(x+j*.59*scale,shoulder+.15*scale,z,.23*scale,.40*scale,.6*scale,STEEL);
 }
 if(boss){
  // Distinct oversized silhouette. Spiked crown and articulated-looking wing
  // planes are decorative; health remains one server-owned enemy HP pool.
  prism(x,headY+.32*scale,z,.87*scale,.53*scale,[.26,.24,.31],rich?11:7);
  for(let i=-2;i<=2;i++){
   pyramid(x+i*.31*scale,headY+.57*scale,z,.18*scale,(1.2-Math.abs(i)*.2)*scale,
    [1,.57,.35],rich?6:4);
  }
  for(const sign of [-1,1]){
   for(let j=0;j<3;j++){
    const zx=z+sign*(.8+j*.66)*scale,xx=x-.4*scale-j*.48*scale;
    box(xx,shoulder+(.37-j*.17)*scale,zx,.29*scale,1.36*scale,.86*scale,
     [.28,.25,.39],{tilt:sign*.17});
   }
  }
  prism(x,hip+.2*scale,z,1.18*scale,.25*scale,[.95,.41,.31],rich?10:6);
 }
 if(poseState?.state==='cast'&&rich){
  // Magical sparks are shown only during an accepted spell animation.
  for(let i=0;i<5;i++){
   const a=time*4+i*Math.PI*2/5;
   box(x+Math.cos(a)*1.6*scale,shoulder+Math.sin(time*6+i)*.5*scale,
     z+Math.sin(a)*1.6*scale,.17*scale,.17*scale,.17*scale,cloth);
  }
 }
 return pieces;
}
