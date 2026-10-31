/** Unfinished procedural 3D is opt-in, not the default for new/revisiting players. */
export const VISUAL_MODE_KEY='starfort:battleVisualMode-v2';
export function getPreferredBattleMode(storage){
  return storage?.getItem(VISUAL_MODE_KEY)==='3d'?'3d':'2d';
}
export function savePreferredBattleMode(storage,value){
  const next=value==='3d'?'3d':'2d';
  storage?.setItem(VISUAL_MODE_KEY,next);
  return next;
}
