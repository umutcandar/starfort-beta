/** Procedural outdoor arenas for authenticated 3D campaigns. Pure graphics only.
 * Shapes are ground scenery; no collisions, hitboxes, attack values or rewards.
 * Stage geometry is stable between frames and uploaded to the static GPU buffer.
 */
const palettes=Object.freeze([
 {ground:[.25,.25,.24],stone:[.39,.34,.31],wood:[.34,.22,.17],accent:[.87,.39,.20],mood:'ember'},
 {ground:[.28,.29,.29],stone:[.53,.51,.47],wood:[.30,.23,.22],accent:[.54,.60,.83],mood:'chapel'},
 {ground:[.23,.32,.27],stone:[.37,.43,.38],wood:[.34,.25,.16],accent:[.48,.77,.49],mood:'forest'},
 {ground:[.28,.27,.25],stone:[.43,.40,.38],wood:[.36,.28,.18],accent:[.91,.50,.24],mood:'fort'},
 {ground:[.19,.25,.30],stone:[.36,.40,.45],wood:[.29,.26,.25],accent:[.48,.77,.92],mood:'crypt'},
 {ground:[.37,.48,.53],stone:[.56,.63,.68],wood:[.29,.35,.37],accent:[.63,.87,.97],mood:'frost'},
 {ground:[.25,.20,.30],stone:[.43,.37,.50],wood:[.27,.20,.32],accent:[.81,.51,.97],mood:'eclipse'},
 {ground:[.19,.16,.26],stone:[.31,.29,.45],wood:[.27,.22,.32],accent:[.91,.44,.73],mood:'void'}
]);
export function officialBattlefieldProfile(stage=1){
 const index=Number.isInteger(stage)?Math.max(1,Math.min(8,stage))-1:0;
 return palettes[index];
}
function pillar(mesh,x,z,p,{height=7,broken=false}={}){
 mesh.box(x,.25,z,4,.5,4,p.stone);
 mesh.prism(x,height/2,z,1.2,height,p.stone,8);
 if(!broken){mesh.box(x,height+.25,z,3,.5,3,p.stone);mesh.pyramid(x,height+.6,z,2,1.3,p.accent,4);}
 else{mesh.box(x,height,z,2.3,.7,2.3,p.stone,{tilt:.27});}
}
function tree(mesh,x,z,p,{frozen=false,dead=false,height=9}={}){
 mesh.prism(x,height*.43,z,.53,height*.86,p.wood,7);
 if(dead){
  for(const a of [-1,1])mesh.box(x+a*1.3,height*.72,z,2.7,.28,.35,p.wood,{tilt:a*.3});
 }else{
  const leaf=frozen?[.66,.82,.87]:[.24,.45,.34];
  mesh.pyramid(x,height*.55,z,3.5,height*.9,leaf,7);
  mesh.pyramid(x,height*.78,z,2.5,height*.85,leaf,7);
 }
}
function rock(mesh,x,z,p,i){
 mesh.box(x,.35+(i%3)*.25,z,2.8+(i%3),.7+(i%3)*.5,2.2+(i%2),p.stone,{yaw:i*.63});
 mesh.box(x+.6,.2,z+.55,1.2,.3,1.4,[.33,.33,.32],{yaw:i*.4});
}
function brazier(mesh,x,z,p){
 mesh.prism(x,1.6,z,.85,3.2,p.stone,8);
 mesh.prism(x,3.35,z,1.35,.5,p.wood,8);
 mesh.pyramid(x,3.6,z,1.05,2.4,p.accent,7);
}
export function drawOfficial3DBattlefield(mesh,stage=1,quality='balanced'){
 const p=officialBattlefieldProfile(stage);
 const rich=quality==='ultra'?12:quality==='performance'?4:8;
 // Authentic depth cues: roadbed, battlefield wheel ruts and shattered stone.
 mesh.ground(0,0,82,28,p.ground);
 mesh.ground(0,0,82,9,[.37,.34,.30]);
 for(const z of [-5,5]){
  for(let i=-5;i<=5;i++){
   mesh.box(i*7, .055,z,.95,.09,1.5,[.20,.21,.20],{yaw:.1*Math.sin(i)});
  }
 }
 for(let i=0;i<rich;i++){
  const side=i%2?-1:1,x=-37+(i*29)%75,z=side*(20+(i*7)%12);
  if(stage===3||stage===6)tree(mesh,x,z,p,{frozen:stage===6,height:7+(i%3)*2});
  else if(stage===1) {i%3?rock(mesh,x,z,p,i):tree(mesh,x,z,p,{dead:true,height:8+i%3});}
  else if(stage===2||stage===5||stage===7||stage===8)pillar(mesh,x,z,p,{height:5+i%3*2,broken:i%3===0});
  else if(stage===4){pillar(mesh,x,z,p,{height:7+i%3});}
 }
 for(const [x,z]of [[-40,-16],[39,16]]){
  brazier(mesh,x,z,p);
 }
 if([2,4,5,7,8].includes(stage)){
  // A destroyed high wall behind the enemy lane, not a flat background.
  for(let i=-3;i<=3;i++){
   const z=i*7;
   mesh.box(45,3+(i%3),z,3.8,6+(i%3)*2,6,p.stone);
   if(i%2===0)mesh.box(45,8,z,4,.55,6,p.stone);
  }
 }
 if(stage===1||stage===3||stage===6){
  for(let i=0;i<rich/2;i++){
   const x=-35+i*13,z=27+(i%2)*4;
   rock(mesh,x,z,p,i);
  }
 }
 // An actual 3D world anchor beneath the boss; no server target implied.
 if(stage>=7){
  mesh.prism(34,.34,0,6,.68,p.stone,12);
  mesh.prism(34,.72,0,4,.17,p.accent,12);
 }
 return p;
}
