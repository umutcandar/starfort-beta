/** Opt-in development-server connection. Never sends the player's local game save. */
export const GUILD_TOKEN_KEY='starfort:guild-token';
export const STARFORT_BETA_CODE_KEY='starfort:beta-test-code';
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
// Hosted mode (GitHub Pages): accounts/guilds via Supabase RPC, bot battles simulated in the browser.
const hostedMode=()=>{try{return !!SUPABASE_URL&&(globalThis.location?.hostname?.endsWith('github.io')||globalThis.location?.search?.includes('hosted=1'));}catch{return false;}};
let localSvc=null,localPlayer=null;
async function local(){
  if(localSvc)return localSvc;
  const [{createArenaService},{createTeamService}]=await Promise.all([import('./arena.js'),import('./team-arena.js')]);
  const arena=createArenaService(),teams=createTeamService();
  setInterval(()=>{arena.tick(.05);arena.prune();teams.tick(.05);teams.prune();},50);
  return localSvc={arena,teams};
}
async function rpc(route,token,data){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/sfb_api`,{method:'POST',signal:AbortSignal.timeout(8000),headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({route,token,data:data||{}})});
  if(!r.ok)throw new Error('Sunucuya ulaşılamadı.');
  const {status,body}=await r.json();
  if(body?.player)localPlayer=body.player;
  if(status>=300)throw new Error(body?.error||'Sunucuda işlem gerçekleştirilemedi.');
  return body;
}
async function hostedRequest(route,token,data){
  const m=/^(arena|team)\/(.+)$/.exec(route);
  if(!m)return rpc(route,token,data);
  const {arena,teams}=await local();
  const user=localPlayer||{id:'local-commander',name:'Komutan'};
  const [kind,op]=[m[1],m[2]];
  if(op==='queue'||op==='party/queue')throw new Error('Canlı oyuncu eşleşmesi bu sürümde kapalı. Bot maçıyla hemen oyna.');
  const unwrap=v=>{if(Array.isArray(v)){if(v[0]>=300)throw new Error(v[1]?.error||'İşlem yapılamadı.');return v[1];}return v;};
  const svc=kind==='arena'?arena:teams;
  if(op==='state')return svc.result(user);
  if(op==='bot')return unwrap(svc.queueBot(user,data||{}));
  if(op==='leave')return unwrap(svc.leave(user));
  if(op==='input')return unwrap(svc.input(user,data||{}));
  throw new Error('İşlem bulunamadı.');
}
export async function guildRequest(route,token=null,data=null){
  if(hostedMode())return hostedRequest(route,token,data);
  let body=data;
  if(route==='register'&&body){
    let stored='';
    try{stored=globalThis.sessionStorage?.getItem(STARFORT_BETA_CODE_KEY)||'';}catch{}
    if(stored)body={...body,testCode:stored};
  }
  async function send(payload){
    const response=await fetch(`/api/${route}`,{method:payload===null?'GET':'POST',signal:AbortSignal.timeout(6500),
      headers:{...(token?{'Authorization':`Bearer ${token}`} :{}),...(payload===null?{}:{'Content-Type':'application/json'})},
      ...(payload===null?{}:{body:JSON.stringify(payload)})});
    const result=await response.json();
    return {response,result};
  }
  let {response,result}=await send(body);
  if(route==='register'&&response.status===403&&result.code==='INVITE_REQUIRED'&&typeof globalThis.prompt==='function'){
    // Prompt only if the server explicitly requests an invite code; local play remains unchanged.
    let code=globalThis.prompt('Starfort çevrim içi beta giriş kodunu yaz:');
    code=typeof code==='string'?code.trim():'';
    if(!code)throw new Error('Test sunucusu giriş kodu gerekli.');
    ({response,result}=await send({...data,testCode:code}));
    if(response.ok){try{globalThis.sessionStorage?.setItem(STARFORT_BETA_CODE_KEY,code);}catch{}}
    else{try{globalThis.sessionStorage?.removeItem(STARFORT_BETA_CODE_KEY);}catch{}}
  }
  if(!response.ok)throw new Error(result.error||'Sunucuda işlem gerçekleştirilemedi.');
  return result;
}
export const guildOnline=()=>guildRequest('status');
