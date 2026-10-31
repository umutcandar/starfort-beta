/** Procedural joint rig for the experimental Starfort 3D characters.
 * All positions are visual-only; the server remains authoritative for combat.
 * The clips can be replaced by skeletal GLB animation clips later.
 */
export const RIG_ACTIONS=Object.freeze(['idle','run','attack','cast','hit','death']);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;

export function rigPose({action='idle',speed=0,walk=0,hit=0,life=1,attackPhase=0,castPhase=0}={},time=0,{reducedMotion=false}={}){
  const alive=life>0;
  let state=!alive?'death':hit>.15?'hit':action==='attack'?'attack':action==='cast'?'cast':speed>.11?'run':'idle';
  if(!RIG_ACTIONS.includes(state))state='idle';
  const phase=finite(walk,time*3),stride=reducedMotion?0:Math.sin(phase*1.9)*clamp(finite(speed),0,1);
  const breath=reducedMotion?0:Math.sin(time*2.5+phase*.1)*.035;
  let armL=stride*.55,armR=-stride*.55,legL=-stride*.65,legR=stride*.65;
  let crouch=0,torsoTilt=0,roll=0,swordSwing=0,glow=0;
  if(state==='idle'){armL=.1+breath;armR=-.1-breath;legL=0;legR=0;}
  if(state==='attack'){
    const t=clamp(finite(attackPhase),0,1),s=Math.sin(t*Math.PI);
    armR=-.6-1.45*s;armL=.4+.25*s;legL=-.25;legR=.2;
    swordSwing=s;torsoTilt=.21*s;
  }
  if(state==='cast'){
    const t=clamp(finite(castPhase),0,1);armR=-1.85;armL=-1.65;
    legL=.1;legR=-.1;glow=.35+.65*Math.sin(t*Math.PI);torsoTilt=-.1;
  }
  if(state==='hit'){torsoTilt=-.24*clamp(hit,0,1);crouch=.36*hit;armL=-.9;armR=.7;}
  if(state==='death'){crouch=1.1;torsoTilt=.95;roll=.7;legL=legR=.4;armL=-.2;armR=.8;}
  return {state,armL,armR,legL,legR,breath,crouch,torsoTilt,roll,swordSwing,glow,
    stride,reducedMotion:Boolean(reducedMotion)};
}

/** Endpoints of actual articulated segments; no joints change hitboxes or server positions. */
export function rigBones(pose={},scale=1){
  const s=clamp(finite(scale,1),.3,4),hip=1.65*s-(pose.crouch||0)*s;
  const shoulder=hip+1.55*s+(pose.breath||0)*s;
  const head=shoulder+.91*s;
  const limb=(root,angle,length)=>[root[0]+Math.sin(angle)*length*s,root[1]-Math.cos(angle)*length*s,root[2]];
  const arms=[],legs=[];
  for(const [i,side]of [-1,1].entries()){
    const shoulderRoot=[side*.72*s,shoulder,0];
    const elbow=limb(shoulderRoot,side<0?pose.armL||0:pose.armR||0,.84);
    const hand=limb(elbow,(side<0?pose.armL||0:pose.armR||0)*.52, .75);
    arms.push({shoulder:shoulderRoot,elbow,hand,side});
    const hipRoot=[side*.34*s,hip,0];
    const knee=limb(hipRoot,side<0?pose.legL||0:pose.legR||0,.88);
    const boot=limb(knee,side<0?Math.max(0,pose.legL||0)*.24:Math.max(0,pose.legR||0)*.24, .76);
    legs.push({hip:hipRoot,knee,boot,side});
  }
  return {hip,shoulder,head,arms,legs};
}
