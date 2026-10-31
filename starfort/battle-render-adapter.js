/** Cross-device graphics adapter: GPU scene first, tested Canvas2D fallback. */
import {createBattleGraphicsV2} from './graphics-scene-v2.js';
import {createGraphics3D} from './graphics-3d.js';
import {loadBattleArt,renderBattleFrame} from './team-renderer.js';
import {setCanvasQuality} from './graphics-display.js';
// The team HUD sends legacy 10000x6000 logical coordinates. 3D picking uses 1000x600.
export const legacy3DTargetCoordinates=(x,y)=>({x:x/10,y:y/10});
export const normalizeBattlePick=legacy3DTargetCoordinates;
export function createBattleRenderer(canvas,{quality='ultra',reducedMotion=false,renderMode='3d'}={}){
  let renderer=null,ctx=null,mode='webgl2';
  if(renderMode==='3d')try{renderer=createGraphics3D(canvas,{quality,reducedMotion});mode='webgl3d';}catch{
    // WebGL context may be allocated even if a shader fails: never reuse that canvas.
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
  }
  try{if(!renderer)renderer=createBattleGraphicsV2(canvas,{quality,reducedMotion});}
  catch(err){
    // If a WebGL context was claimed before failing, replace the canvas before 2D fallback.
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    ctx=canvas.getContext('2d');if(!ctx)throw Error('Cihazda kullanılabilir grafik motoru bulunamadı: '+err.message);
    mode='canvas2d';
  }
  const art=mode==='canvas2d'?loadBattleArt():null;
  return {
    mode,get canvas(){return canvas;},
    render(room,you,time,options={}){
      if(renderer)renderer.render(room,you,time,mode==='webgl3d'?{cameraMode:'follow',...options}:options);
      else renderBattleFrame(ctx,room,you,art,time,options.selectedTarget,{...options,reducedMotion});
    },
    resize(qualityValue=quality){quality=qualityValue;if(renderer){renderer.setQuality(quality);renderer.resize(1000,600,window.devicePixelRatio||1);}
      else setCanvasQuality(canvas,ctx,quality,canvas.clientWidth||1000,canvas.clientHeight||600,window.devicePixelRatio||1);},
    toWorld(x,y){
      // Callers provide 10000×6000 legacy coordinates; GPU/canvas camera use 1000×600.
      // Do not mix scales when a hero-follow camera has moved. Return 1000x600
      // world pixels; team-view divides those by 10 to obtain server units.
      const point=normalizeBattlePick(x,y);
      const world=renderer?renderer.toWorld(point.x,point.y):point;
      return world;
    },
    stats(){return renderer?.stats()||{mode:'canvas2d'};},dispose(){renderer?.dispose();}
  };
}
