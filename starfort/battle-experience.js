/**
 * Shared public-beta presentation policy.
 * GitHub Pages can run local bots and Supabase guilds, but not real-time queues.
 * The low-detail 3D prototype stays in a separately requested graphics lab.
 */
export function battleExperience(locationLike={},storageMode=null,pointerCoarse=false){
  const hostname=String(locationLike.hostname||'').toLowerCase();
  const params=new URLSearchParams(String(locationLike.search||'').replace(/^\?/,''));
  const hosted=hostname.endsWith('github.io')||params.get('hosted')==='1';
  const graphicsLab=params.get('graphicslab')==='1';
  return Object.freeze({
    hosted,
    liveMatchmaking:!hosted,
    graphicsLab,
    renderMode:graphicsLab && storageMode==='3d'?'3d':'2d',
    defaultQuality:pointerCoarse?'balanced':'ultra',
  });
}
