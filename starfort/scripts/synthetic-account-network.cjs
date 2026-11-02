/* Synthetic Supabase browser adapter. Used ONLY by local Chromium QA; NEVER loaded by production.
 * Exercises real STARFORT UI/auth integration without sending emails or modifying cloud data.
 */
(() => {
 const BASE='https://ftbbzqzgafmallrfimnt.supabase.co';
 const ID='11111111-1111-4111-8111-111111111111';
 const mail='qa@starfort.test',secret='StarfortTest!528468';
 const now=()=>Date.now();
 const initial=()=>({
  ok:true,source:'server',applied:'get',serverNow:now(),revision:1,
  res:{gold:500,wood:300,stone:200,aether:120},
  buildings:{keep:1,farm:1,lumber:1,quarry:1,forge:1,tavern:1,observatory:1},
  construction:null,mastery:0,lastCollected:now()-200000,lastDailyReward:null,
  heroes:{aldren:1,lyra:1,rovan:1},inventory:{iron_sword:1},
  loadouts:{},team:['aldren','lyra','rovan'],cleared:[],campaignStars:{},
  act2Cleared:[],act2Stars:{},veteranMedals:{},mazeFloor:0,riftWeek:null,bossWeek:null,
  worldBoss:{week:'2026-45',goal:4500,damage:0,victories:0,claimed:false},
  itemUpgrades:{},mission:null,lastReport:null,counters:{win:0,hero:0,forge:0,maze:0,rift:0,veteran:0},
  contractClaims:{},titles:[],cost:{},reward:{}
 });
 const read=()=>{try{return JSON.parse(sessionStorage.getItem('__starfort_qa_snapshot'))||initial()}catch{return initial()}};
 const write=d=>{sessionStorage.setItem('__starfort_qa_snapshot',JSON.stringify(d));return d;};
 const ok=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
 const authResponse=()=>({access_token:'qa.synthetic.jwt',refresh_token:'qa.synthetic.refresh',
   expires_in:3600,user:{id:ID,email:mail}});
 const realFetch=window.fetch.bind(window);
 window.fetch=(input,options={})=>{
  const url=String(input?.url||input);
  if(!url.startsWith(BASE))return realFetch(input,options);
  const path=url.slice(BASE.length),payload=(()=>{try{return JSON.parse(options.body||'{}')}catch{return {}}})();
  if(path.startsWith('/auth/v1/signup')){
   if(payload.email!==mail)return ok({code:400,msg:'Only synthetic QA email is allowed.'},400);
   return ok({user:{id:ID,email:mail}});
  }
  if(path.startsWith('/auth/v1/token?grant_type=password')){
   if(payload.email!==mail||payload.password!==secret)return ok({code:400,msg:'Invalid login credentials'},400);
   return ok(authResponse());
  }
  if(path.startsWith('/auth/v1/token?grant_type=refresh_token'))return ok(authResponse());
  if(path==='/auth/v1/user'&&options.method==='GET')return ok({id:ID,email:mail});
  if(path.startsWith('/auth/v1/logout'))return ok({});
  if(path.includes('/rest/v1/rpc/sfb_starfort_progress')){
   if(!String(options.headers?.Authorization||'').startsWith('Bearer qa.synthetic.'))return ok({message:'unauthorized'},401);
   const d=read(),a=payload.p_action;
   d.serverNow=now();
   if(a!=='get')d.revision++;
   d.applied=a;
   if(a==='hero'&&d.heroes[payload.p_target]&&d.res.gold>=60){
    d.heroes[payload.p_target]++;d.res.gold-=60;d.counters.hero++;
   }
   if(a==='mission_start'&&payload.p_target==='1'&&!d.mission){
    d.mission={mode:'story',stage:1,wave:1,waves:3,turn:0,waveTurn:0,tier:0,floor:0,
     startedAt:now(),lastTurnAt:now()-5000,power:268,enemyHp:130,enemyMaxHp:130,
     playerHp:420,playerMaxHp:420,enemyIntent:'strike',lastAction:'Başladı',cooldowns:{}};
   }
   if(a==='mission_turn'&&d.mission){
    d.mission.turn++;d.mission.waveTurn++;d.mission.lastAction=payload.p_aux;
    d.mission.lastTurnAt=now()-5000;d.mission.enemyHp=Math.max(0,d.mission.enemyHp-100);
    if(d.mission.enemyHp===0){
     if(d.mission.wave<3){d.mission.wave++;d.mission.waveTurn=0;d.mission.enemyHp=130;d.mission.enemyMaxHp=130;}
     else{d.mission=null;d.cleared=[1];d.campaignStars={'1':3};d.counters.win++;
      d.lastReport={won:true,mode:'story',stage:1,stars:3,turns:6,reward:{gold:120,wood:60,stone:35,aether:12}};
      d.res.gold+=120;d.res.wood+=60;d.res.stone+=35;d.res.aether+=12;
     }
    }
   }
   return ok(write(d));
  }
  if(path.includes('/rest/v1/rpc/sfb_daily_calendar'))return ok({message:'calendar not mocked'},404);
  if(path.includes('/rest/v1/rpc/sfb_village_api')){
   const d=read();return ok(write({...d,applied:payload.p_action}));
  }
  return ok({message:'unsupported synthetic QA endpoint'},404);
 };
 Object.defineProperty(window,'__starfortQaMock',{value:true});
})();
