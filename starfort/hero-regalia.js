// Original reliefs in the equipment rig's local coordinate system (front is +Z).
import * as THREE from 'three';

const buckler = [[-.36,.19],[-.18,.29],[0,.24],[.19,.3],[.34,.15],[.29,-.22],[.08,-.55],[0,-.64],[-.22,-.43],[-.34,-.19]];
const feather = [[0,0],[-.05,.21],[-.08,.4],[.04,.63],[.12,.45],[.1,.32],[.15,.35],[.1,.17]];
const facet = [[0,-.17],[-.11,-.05],[-.08,.1],[0,.23],[.1,.07],[.12,-.05]];
const star = Array.from({length:8},(_,i)=>{
 const angle=i*Math.PI/4, radius=i%2?.065:.21;
 return [Math.sin(angle)*radius,Math.cos(angle)*radius];
});

export function addHeroRegalia(id, {body,head,shoulderL,shoulderR,kneeL,kneeR,weapon,offhand,add,box,tube,ell,cylinder,
 metal,bright,black,cloth,emissive,rich}){
 // Bevels catch the stage light. A separate inset face leaves a visible metal rim.
 function relief(parent,outline,material,x,y,z,size=1,tilt=0){
  const shape=new THREE.Shape();
  outline.forEach(([px,py],i)=>i?shape.lineTo(px,py):shape.moveTo(px,py));
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:rich,
   bevelThickness:.012,bevelSize:.012,bevelSegments:1,steps:1});
  const piece=add(parent,geometry,material,x,y,z);
  piece.scale.setScalar(size);
  piece.rotation.z=tilt;
 }
 function ring(parent,x,y,z,r,material,arc=Math.PI*2,rotation=0){
  const piece=add(parent,new THREE.TorusGeometry(r,.023,5,rich?32:16,arc),material,x,y,z);
  piece.rotation.z=rotation;
 }
 // A fitted undercoat connects the separate armour shells. The hem's length
 // reads at battle distance, even when an individual insignia is edge-on.
 const robe = ['lyra','mira','eira'].includes(id);
 const guard = ['aldren','doran'].includes(id);
 const hem = robe ? -1.29 : guard ? -.85 : -.72;
 const radius = robe ? .57 : .43;
 const profile = [[radius*.94,hem],[radius,hem+.07],[.39,-.44],[.31,-.22],[.42,.14],[.36,.29]];
 const garment = add(body,new THREE.LatheGeometry(
  profile.map(([r,y])=>new THREE.Vector2(r,y)),rich?20:10),cloth,0,0,.02);
 garment.scale.z=.76;
 const trim=add(body,new THREE.LatheGeometry([
  new THREE.Vector2(radius*.955,hem+.015),new THREE.Vector2(radius*.996,hem+.053)
 ],rich?20:10),bright,0,0,.02);
 trim.scale.z=.77;
 for(const [side,arm,leg] of [[-1,shoulderL,kneeL],[1,shoulderR,kneeR]]){
  cylinder(arm,cloth,side*.025,-.26,.015,.145,.12,.46);
  cylinder(leg,guard?metal:black,0,-.20,.0,.136,.095,.43);
  ell(leg,black,0,-.49,.08,.127,.10,.23);
 }
 switch(id){
  case 'aldren':
   relief(offhand,buckler,bright,-.08,-.06,.32,1.25);
   relief(offhand,buckler,cloth,-.08,-.06,.38,1.12);
   relief(offhand,star,bright,-.08,-.17,.44,1.05);
   tube(offhand,[[.19,.23,.46],[.07,.05,.46],[.13,0,.46],[.04,-.11,.46]],.018,black);
   relief(shoulderL,feather,metal,-.19,.08,.06,.94,.52);
   break;
  case 'lyra':
   // An astrolabe with two inclined brass orbits enclosing the star.
   ring(weapon,0,1.65,.02,.42,bright);
   ring(weapon,0,1.65,.07,.33,metal);
   relief(weapon,star,emissive,0,1.65,.26,1.28,.16);
   for(const side of [-1,1])relief(head,feather,bright,side*.29,.18,.11,.72,-side*.58);
   break;
  case 'rovan':
   // Overlapping leaves make an asymmetric forest mantle.
   for(let i=0;i<(rich?5:3);i++)
    relief(shoulderL,feather,i%2?bright:cloth,-.08-i*.063,.13,.15-i*.06,.7+i*.035,1.1+i*.21);
   relief(weapon,feather,bright,.01,1.16,0,.64,-.18);
   relief(weapon,feather,bright,.01,-.17,0,.55,Math.PI+.18);
   break;
  case 'mira':
   ring(offhand,-.08,-.12,.28,.40,bright,Math.PI*1.42,Math.PI*.79);
   relief(body,star,emissive,0,.06,.53,.7);
   ring(head,0,.32,-.21,.49,bright,Math.PI*1.3,-Math.PI*.15);
   break;
  case 'doran':
   // A furnace in the hammer face, bounded by forged iron hoops.
   box(weapon,black,0,1.02,.23,.71,.28,.045);
   for(const x of [-.23,0,.23])box(weapon,emissive,x,1.02,.266,.048,.19,.035,.18);
   for(const side of [-1,1])relief(shoulderL,facet,metal,side*.16,.20,0,.91,side*.27);
   break;
  case 'vesper':
   for(const grip of [weapon,offhand]){
    relief(grip,feather,bright,.10,.40,.035,.90,-.61);
    relief(grip,facet,emissive,0,.24,.10,.45);
   }
   relief(head,feather,metal,-.26,.08,.19,.82,.73);
   break;
  case 'eira':
   for(const i of [-2,-1,0,1,2]){
    relief(head,facet,i%2?bright:emissive,i*.13,.36,.14-Math.abs(i)*.035,
     1.32-Math.abs(i)*.22,-i*.23);
   }
   for(const i of [-1,0,1])
    relief(weapon,facet,i?bright:emissive,i*.18,1.73,.12,i?1.20:1.65,-i*.44);
   break;
 }
}
