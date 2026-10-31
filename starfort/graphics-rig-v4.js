/** Frame-atlas bridge for painted 2.5D actors. Art is deliberately NOT real 3D.
 * All animation is presentation-only; server positions, cooldowns and HP remain authoritative.
 * Sheets are 6 columns × 6 rows, with a padded transparent region per cell.
 */
export const RIG_STATES=Object.freeze(['idle','run','attack','cast','hit','down']);
export const RIG_COLUMNS=6;
export const RIG_ROWS=6;
const idx=state=>Math.max(0,RIG_STATES.indexOf(state));
export function rigFrame(state,time=0,walk=0,speed=0,reducedMotion=false){
  if(reducedMotion)return 0;
  const t=Math.max(0,Number(time)||0);
  const w=Math.max(0,Number(walk)||0);
  if(state==='run')return Math.floor((w*1.7+t*1.8)%RIG_COLUMNS);
  const rates={idle:1.2,attack:8,cast:5,hit:5,down:3};
  return Math.floor(t*(rates[state]||1.3))%RIG_COLUMNS;
}
export function rigUV(state,frame=0){
  const row=idx(state),col=Math.min(RIG_COLUMNS-1,Math.max(0,Math.floor(frame)));
  // Inset half a pixel + atlas cell padding; avoids adjacent-frame bleed on GPU.
  const insetX=.8/(192*RIG_COLUMNS),insetY=.8/(288*RIG_ROWS);
  return [col/RIG_COLUMNS+insetX,row/RIG_ROWS+insetY,(col+1)/RIG_COLUMNS-insetX,(row+1)/RIG_ROWS-insetY];
}
export function motionAssetFilename(index){
  if(!Number.isInteger(index)||index<1||index>6)return null;
  return `assets/rigs/unit-${index<=3?'dawn':'dusk'}-${index<=3?index:index-3}-motion.webp`;
}
export function motionSprite(index,pose,time=0,walk=0,reducedMotion=false,ready=false){
  if(!ready||!Number.isInteger(index)||index<1||index>6)return {id:'art-'+index,uv:pose?.face===-1?[1,0,0,1]:[0,0,1,1],atlas:false};
  const state=RIG_STATES.includes(pose?.state)?pose.state:'idle',frame=rigFrame(state,time,walk,pose?.speed||0,reducedMotion);
  const uv=rigUV(state,frame);
  if(pose?.face===-1){[uv[0],uv[2]]=[uv[2],uv[0]];}
  return {id:'rig-'+index,uv,atlas:true,state,frame};
}
