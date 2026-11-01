// Non-competitive PvE campaign season. No paywall, league, tradable currency,
// paid pass or trust in client-side records for online matchmaking.
const PERIOD=28*86400000;
const ORIGIN=Date.UTC(2026,10,1);
export const SEASON_GOALS=Object.freeze([
  {id:'win',name:'Sefer zaferi',target:8},
  {id:'upgrade',name:'Köy veya kahraman geliştirmesi',target:8},
  {id:'forge',name:'Ekipman üretimi',target:4},
  {id:'maze',name:'Labirent katı',target:4},
  {id:'star',name:'İyileştirilen yıldız derecesi',target:4},
  {id:'rift',name:'Haftalık yarık zaferi',target:1},
]);
export const SEASON_TITLES=Object.freeze([
  {target:4,name:'Vadi İz Sürücüsü'},
  {target:10,name:'Şafak Nöbetçisi'},
  {target:18,name:'Kuzey Sancaktarı'},
  {target:29,name:'Yıldız Vekili'},
]);
const cap=n=>Number.isInteger(n)&&n>=0?n:0;
export function seasonId(now=Date.now()){return 1+Math.floor(Math.max(0,now-ORIGIN)/PERIOD);}
export function newSeason(now=Date.now()){return {id:seasonId(now),progress:Object.fromEntries(SEASON_GOALS.map(g=>[g.id,0])),claimed:[],legacy:[]};}
export function restoreSeason(raw,now=Date.now()) {
  const fresh=newSeason(now);
  if(!raw || typeof raw!=='object')return fresh;
  const legacy=Array.isArray(raw.legacy)?raw.legacy.filter(x=>typeof x==='string'&&/^S\d+:/.test(x)).slice(-64):[];
  if(raw.id!==fresh.id)return {...fresh,legacy:[...new Set([...legacy,...(Array.isArray(raw.claimed)?raw.claimed.map(n=>`S${raw.id}:${n}`):[])])].slice(-64)};
  const progress=Object.fromEntries(SEASON_GOALS.map(g=>[g.id,Math.min(g.target,cap(raw.progress?.[g.id]))]));
  const claimed=SEASON_TITLES.filter(t=>raw.claimed?.includes(t.name)).map(t=>t.name);
  return {...fresh,progress,claimed,legacy:[...new Set(legacy)]};
}
function ensureSeason(state,now=Date.now()){state.season=restoreSeason(state.season,now);return state.season;}
export function seasonEvent(state,kind,now=Date.now()){
  const season=ensureSeason(state,now),goal=SEASON_GOALS.find(g=>g.id===kind);
  if(!goal || season.progress[kind]>=goal.target)return false;
  season.progress[kind]=(season.progress[kind]||0)+1;
  return true;
}
export function seasonStatus(state,now=Date.now()){
  const season=ensureSeason(state,now);
  const points=SEASON_GOALS.reduce((sum,g)=>sum+(season.progress[g.id]||0),0);
  return {id:season.id,points,progress:SEASON_GOALS.map(g=>({...g,count:season.progress[g.id]||0})),
    titles:SEASON_TITLES.map(t=>({...t,ready:points>=t.target,claimed:season.claimed.includes(t.name)})),
    legacy:[...season.legacy]};
}
export function claimSeasonTitle(state,name,now=Date.now()){
  const summary=seasonStatus(state,now),t=summary.titles.find(x=>x.name===name);
  if(!t)return {ok:false,error:'Bilinmeyen sezon unvanı.'};
  if(!t.ready)return {ok:false,error:'Unvan için henüz yeterli sezon görevi tamamlanmadı.'};
  if(t.claimed)return {ok:false,error:'Bu unvan alındı.'};
  state.season.claimed.push(t.name);
  state.season.legacy=[...new Set([...state.season.legacy,`S${summary.id}:${t.name}`])].slice(-64);
  return {ok:true,name:t.name};
}
