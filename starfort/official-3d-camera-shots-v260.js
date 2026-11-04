/** STARFORT beta.14 camera director.
 * Only a consecutive verified server turn can trigger dramatic motion.
 * Pure presentation: these values are never used by mission RPCs.
 */
import {officialStrikeWindow} from './official-3d-choreography-v259.js';
import {CAMERA_DEFAULT} from './official-3d-camera-v259.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function cinematicCameraShot(previous,mission,now,base=CAMERA_DEFAULT,{reducedMotion=false}={}){
 const safeYaw=clamp(Number(base?.yaw)||0,-.85,.85);
 const safeDistance=clamp(Number(base?.distance)||69,50,95);
 const w=officialStrikeWindow(previous,mission,now);
 if(!w||reducedMotion||w.action==='reinforce')return Object.freeze({yaw:safeYaw,distance:safeDistance,impact:0,focus:false});
 const p=w.progress;
 const pulse=Math.pow(Math.max(0,Math.sin(Math.PI*p)),1.8);
 const skill=w.action.startsWith('skill:');
 const guard=w.action==='guard';
 const flank=w.action==='feint';
 const zoom=skill?12:flank?9:guard?4:7;
 const cameraDistance=clamp(safeDistance-zoom*pulse,50,95);
 const yaw=clamp(safeYaw+(flank?.15:skill?-.08:.035)*pulse,-.85,.85);
 const blow=Math.max(w.enemyHit,w.playerHit);
 const impact=blow>0?clamp(blow/125,0,.9)*Math.exp(-Math.pow((p-.46)/.115,2)):0;
 return Object.freeze({yaw,distance:cameraDistance,impact,focus:true});
}
