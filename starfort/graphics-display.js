/** Responsive bitmap sizing. Always draw using 1000 x 600 logical coordinates. */
import {graphicsPreset,resolutionScale} from './battle-motion.js';
export const QUALITY_LABELS=Object.freeze({ultra:'Ultra',balanced:'Dengeli',performance:'Performans'});
export function setCanvasQuality(canvas,ctx,quality,cssWidth,cssHeight,dpr=1){
  const normalized=graphicsPreset(quality);
  const factor=resolutionScale(cssWidth,cssHeight,dpr,normalized);
  const w=Math.round(1000*factor),h=Math.round(600*factor);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.setTransform(canvas.width/1000,0,0,canvas.height/600,0,0);
  return factor;
}
export function nextQuality(q){const list=Object.keys(QUALITY_LABELS);return list[(list.indexOf(graphicsPreset(q))+1)%list.length]}
