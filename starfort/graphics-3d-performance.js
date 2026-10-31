/** Adaptive render scale, never changes gameplay simulation or combat timestamps.
 * Supply frame durations in milliseconds from requestAnimationFrame / measured CPU.
 * Slow downscaling responds faster than upscaling to avoid oscillation.
 */
const LIMITS=Object.freeze({ultra:[.65,1],balanced:[.7,1],performance:[.8,1]});
export function create3DResolutionManager(initial='balanced'){
 let quality=LIMITS[initial]?initial:'balanced',scale=1,frames=0,elapsed=0,slow=0,fast=0;
 return {
  observe(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>250)return scale;
   elapsed+=deltaMs;frames++;
   if(frames<30)return scale;
   const average=elapsed/frames;elapsed=0;frames=0;
   slow=average>24?slow+1:0;fast=average<15.5?fast+1:0;
   if(slow>=2){scale=Math.max(LIMITS[quality][0],Math.round((scale-.1)*100)/100);slow=0;fast=0;}
   else if(fast>=6){scale=Math.min(LIMITS[quality][1],Math.round((scale+.05)*100)/100);fast=0;}
   return scale;
  },
  setQuality(next){quality=LIMITS[next]?next:'balanced';scale=Math.max(LIMITS[quality][0],Math.min(LIMITS[quality][1],scale));slow=fast=frames=elapsed=0;},
  reset(){scale=1;slow=fast=frames=elapsed=0;},
  getScale:()=>scale,
  profile:()=>quality
 };
}
