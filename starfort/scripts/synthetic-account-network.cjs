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
 const premiumInitial=()=>({ok:true,source:'server-premium',paymentsEnabled:false,crystals:0,vipUntil:null,
  equipped:{},owned:[],revision:1,season:{month:new Date().toISOString().slice(0,7),wins:0,
   thresholds:[2,5,10,18],freeClaims:[],premium:false,premiumClaims:[]},applied:'get'});
 const premiumRead=()=>{try{return JSON.parse(sessionStorage.getItem('__starfort_qa_premium'))||premiumInitial()}catch{return premiumInitial()}};
 const premiumWrite=x=>{sessionStorage.setItem('__starfort_qa_premium',JSON.stringify(x));return x;};
 const warfrontInitial=()=>({ok:true,source:'server-warfront',pending:null,revision:1,wins:read().counters.win,
  dailyWins:read().counters.win,weeklyWins:read().counters.win,
  day:new Date().toISOString().slice(0,10),week:'2026-45',
  dailyClaimed:false,weeklyClaimed:false,chestsClaimed:0,nextChestWins:3,lastLoot:null});
 const warfrontRead=()=>{try{return JSON.parse(sessionStorage.getItem('__starfort_qa_warfront'))||warfrontInitial()}catch{return warfrontInitial()}};
 const warfrontWrite=d=>{sessionStorage.setItem('__starfort_qa_warfront',JSON.stringify(d));return d;};
 const shadowMilestones=[12,30,55,90,140,210,300,410,550,710,900,1120];
 const shadowInitial=()=>({ok:true,source:'server-shadow',revision:1,heroPaths:{},cleared:[],
  stars:{},battle:null,lastReport:null,masteryXp:0,masteryRank:0,masteryClaimed:0,
  weeklyRenown:0,weeklyWins:0,weeklyLimit:100,week:'2026-45',applied:'get'});
 const shadowRead=()=>{try{return JSON.parse(sessionStorage.getItem('__starfort_qa_shadow'))||shadowInitial()}catch{return shadowInitial()}};
 const shadowWrite=d=>{sessionStorage.setItem('__starfort_qa_shadow',JSON.stringify(d));return d;};
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
  if(path.includes('/rest/v1/rpc/sfb_account_api')){
   const route=payload.route,profileKey='__starfort_qa_guild_profile';
   const linked=(()=>{try{return JSON.parse(sessionStorage.getItem(profileKey))}catch{return null}})();
   if(route==='status')return ok({status:200,body:{ok:true,online:true}});
   if(route==='me')return ok(linked?{status:200,body:{player:linked,guild:null,guilds:[]}}:
     {status:404,body:{error:'Önce bu e-posta hesabına komutan adı oluştur.'}});
   if(route==='register'&&typeof payload.data?.name==='string'){
    const player={id:'qa-commander-1',name:payload.data.name};
    sessionStorage.setItem(profileKey,JSON.stringify(player));
    return ok({status:201,body:{player,guild:null,guilds:[]}});
   }
   return ok({status:404,body:{error:'Unknown QA guild route'}});
  }
  if(path.includes('/rest/v1/rpc/sfb_starfort_progress')){
   if(!String(options.headers?.Authorization||'').startsWith('Bearer qa.synthetic.'))return ok({message:'unauthorized'},401);
   const d=read(),a=payload.p_action;
   d.serverNow=now();
   // Reproduce the first-login transient error reported by real players.
   // The production client must retry automatically, without a manual button.
   if(a==='get'&&!sessionStorage.getItem('__starfort_qa_first_get_failure')){
    sessionStorage.setItem('__starfort_qa_first_get_failure','1');
    return ok({message:'Temporary game service unavailable'},503);
   }
   if(a!=='get')d.revision++;
   d.applied=a;
   if(a==='equip'&&d.heroes[payload.p_target]){
    const slot=({iron_sword:'weapon',ward_mail:'armor',lunar_charm:'relic',ember_guard:'armor',star_spear:'weapon',guardian_seal:'relic',starbreaker:'weapon'})[payload.p_aux];
    if(!slot||!(d.inventory[payload.p_aux]>0))return ok({message:'Equipment unavailable'},400);
    d.loadouts[payload.p_target]??={};d.loadouts[payload.p_target][slot]=payload.p_aux;
   }
   if(a==='unequip'&&d.heroes[payload.p_target]&&d.loadouts[payload.p_target]){
    delete d.loadouts[payload.p_target][payload.p_aux];
   }
   if(a==='hero'&&d.heroes[payload.p_target]&&d.res.gold>=60){
    d.heroes[payload.p_target]++;d.res.gold-=60;d.counters.hero++;
   }
   if(a==='mission_start'&&payload.p_target==='1'&&!d.mission){
    const f=warfrontRead();
    if(f.pending){f.revision++;warfrontWrite({...f,pending:null});}

    d.mission={mode:'story',balanceVersion:6,stage:1,wave:1,waves:3,turn:0,waveTurn:0,tier:0,floor:0,
     startedAt:now(),lastTurnAt:now()-5000,power:268,enemyHp:130,enemyMaxHp:130,
     playerHp:420,playerMaxHp:420,enemyIntent:'strike',lastAction:'Başladı',cooldowns:{},doctrine:f.pending||'none',lastRallyTurn:0};
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
  if(path.includes('/rest/v1/rpc/sfb_warfront_api')){
   if(!String(options.headers?.Authorization||'').startsWith('Bearer qa.synthetic.'))return ok({message:'unauthorized'},401);
   const d=warfrontRead(),a=payload.p_action,target=payload.p_target,v=read();
   d.wins=v.counters.win;
   d.dailyWins=v.counters.win;d.weeklyWins=v.counters.win;
   if(a==='prepare'){
    const costs={assault:{gold:70,wood:50},bulwark:{wood:30,stone:65},recon:{gold:90,aether:12}};
    const cost=costs[target];
    if(!cost||d.pending||v.mission||Object.entries(cost).some(([k,n])=>v.res[k]<n))
     return ok({message:'İkmal uygun değil.'},400);
    Object.entries(cost).forEach(([k,n])=>v.res[k]-=n);
    d.pending=target;d.revision++;v.revision++;write(v);
   }else if(a==='cancel'){
    if(!d.pending||v.mission)return ok({message:'İkmal iptal edilemez.'},400);
    const c={assault:{gold:70,wood:50},bulwark:{wood:30,stone:65},recon:{gold:90,aether:12}}[d.pending];
    Object.entries(c).forEach(([k,n])=>v.res[k]+=n);
    d.pending=null;d.revision++;v.revision++;write(v);
   }else if(a==='claim_daily'){
    if(d.dailyClaimed||d.dailyWins<2)return ok({message:'Günlük hedef tamamlanmadı.'},400);
    d.dailyClaimed=true;d.revision++;v.revision++;v.res.gold+=160;write(v);
   }else if(a==='claim_weekly'){
    if(d.weeklyClaimed||d.weeklyWins<8)return ok({message:'Haftalık hedef tamamlanmadı.'},400);
    d.weeklyClaimed=true;d.revision++;v.revision++;v.res.gold+=580;write(v);
   }else if(a==='claim_chest'){
    const targets=[3,8,15,24],need=d.chestsClaimed<4?targets[d.chestsClaimed]:24+(d.chestsClaimed-3)*12;
    if(d.wins<need)return ok({message:'Sandık zafer hedefi tamamlanmadı.'},400);
    const drops=['ward_mail','ember_blade','star_lens','moonheart','ember_guard','star_spear','guardian_seal','starbreaker'];
    const tiers=['uncommon','rare','epic','legendary','rare','rare','epic','legendary'];
    const i=d.chestsClaimed<4?d.chestsClaimed:4+(d.chestsClaimed-4)%4;
    v.inventory[drops[i]]=(v.inventory[drops[i]]||0)+1;
    d.chestsClaimed++;d.revision++;v.revision++;d.lastLoot={chest:d.chestsClaimed,item:drops[i],rarity:tiers[i],converted:false};write(v);
   }
   d.nextChestWins=d.chestsClaimed<4?[3,8,15,24][d.chestsClaimed]:24+(d.chestsClaimed-3)*12;
   return ok(warfrontWrite({...d,applied:a}));
  }
  if(path.includes('/rest/v1/rpc/sfb_shadow_api')){
   if(!String(options.headers?.Authorization||'').startsWith('Bearer qa.synthetic.'))return ok({message:'unauthorized'},401);
   const d=shadowRead(),v=read(),a=payload.p_action;
   if(a==='claim_mastery'){
    if(d.masteryClaimed>=d.masteryRank)return ok({message:'Ustalık ödülü hazır değil.'},400);
    const rank=++d.masteryClaimed,prize={gold:80+60*rank,wood:40+30*rank,
      stone:35+30*rank,aether:8+6*rank};
    Object.entries(prize).forEach(([id,n])=>v.res[id]+=n);
    d.reward=prize;d.revision++;v.revision++;write(v);
   }
   if(a==='train'){
    const h=payload.p_target,style=payload.p_aux,rank=(d.heroPaths[h]?.rank||0)+1;
    if(!v.heroes[h]||!['assault','warden'].includes(style)||d.heroPaths[h]&&d.heroPaths[h].path!==style||
       rank>3||v.heroes[h]<[0,3,6,10][rank]||
       v.cleared.length<[0,2,6,8][rank]||v.act2Cleared.length<(rank===3?2:0))
       return ok({message:'Uzmanlık için seviye veya bölüm gerekiyor.'},400);
    const c={gold:250*rank*rank,aether:45*rank*rank,stone:25*rank};
    if(Object.entries(c).some(([k,n])=>(v.res[k]||0)<n))return ok({message:'Kaynaklar yetersiz.'},400);
    Object.entries(c).forEach(([k,n])=>v.res[k]-=n);
    d.heroPaths[h]={path:style,rank};d.revision++;v.revision++;write(v);
   }
   if(a==='start'){
    const stage=Number(payload.p_target);
    if(d.battle||v.mission||!Number.isInteger(stage)||stage<1||stage>4||
       v.act2Cleared.length<stage*2||stage>d.cleared.length+1)
      return ok({message:'Sınır seferi henüz açılmadı.'},400);
    d.battle={mode:'shadow',stage,wave:1,waves:3,turn:0,waveTurn:0,power:760,
      playerHp:580,playerMaxHp:580,enemyHp:240,enemyMaxHp:240,enemyIntent:'strike',
      attackRanks:Object.values(d.heroPaths).filter(x=>x.path==='assault').reduce((n,x)=>n+x.rank,0),
      wardRanks:Object.values(d.heroPaths).filter(x=>x.path==='warden').reduce((n,x)=>n+x.rank,0),
      lastTurnAt:now()-5000,lastRallyTurn:0,cooldowns:{},lastAction:'Başladı'};
    d.lastReport=null;d.revision++;
   }
   if(a==='turn'){
    if(!d.battle)return ok({message:'Aktif savaş yok.'},400);
    d.battle.turn++;d.battle.waveTurn++;d.battle.lastAction=payload.p_aux;
    d.battle.lastTurnAt=now()-5000;d.battle.enemyHp=Math.max(0,d.battle.enemyHp-250);
    if(d.battle.enemyHp===0){
      if(d.battle.wave<3){d.battle.wave++;d.battle.waveTurn=0;d.battle.enemyHp=240;d.battle.enemyMaxHp=240;}
      else{
       const stage=d.battle.stage;const first=!d.cleared.includes(stage);
       const earned=Math.min(100-d.weeklyRenown,stage*3+6+(first?10:0));
       d.masteryXp+=earned;d.weeklyRenown+=earned;d.weeklyWins++;
       d.masteryRank=shadowMilestones.filter(n=>d.masteryXp>=n).length;
       d.lastReport={won:true,stage,stars:3,turns:d.battle.turn,renown:earned,
         reward:{gold:420,wood:200,stone:210,aether:60},item:first?'grave_seal':null,at:now()};
       if(first){d.cleared.push(stage);v.inventory.grave_seal=(v.inventory.grave_seal||0)+1;}
       d.stars[String(stage)]=3;v.counters.win++;v.revision++;
       v.res.gold+=420;write(v);d.battle=null;
      }
    }
    d.revision++;
   }
   if(a==='abandon'){if(!d.battle)return ok({message:'Aktif savaş yok.'},400);
     d.battle=null;d.lastReport={won:false,abandoned:true,at:now()};d.revision++;
   }
   return ok(shadowWrite({...d,applied:a}));
  }
  if(path.includes('/rest/v1/rpc/sfb_premium_api')){
   if(!String(options.headers?.Authorization||'').startsWith('Bearer qa.synthetic.'))return ok({message:'unauthorized'},401);
   const d=premiumRead(),a=payload.p_action,item=payload.p_item;
   d.season.wins=Math.max(0,read().counters.win||0);
   if(a==='purchase')return ok({message:'Yetersiz Yıldız Kristali. Ödeme sistemi henüz kapalı.'},400);
   if(a==='claim'){
    const milestones={'1':2,'2':5,'3':10,'4':18};
    const rewards={'1':'banner-trailblazer','2':'cape-scout','3':'castle-dawn','4':'victory-constellation'};
    if(!(item in milestones)||d.season.wins<milestones[item]||d.season.freeClaims.includes(item))
     return ok({message:'Sezon ödülü henüz kazanılmadı veya alındı.'},400);
    d.season.freeClaims.push(item);d.owned.push(rewards[item]);d.revision++;
   }
   if(a==='equip'){
    const types={'banner-trailblazer':'banner','cape-scout':'cape','castle-dawn':'castle','victory-constellation':'victory'};
    if(!d.owned.includes(item)||!types[item])return ok({message:'Bu kozmetiğe sahip değilsin.'},400);
    d.equipped[types[item]]=item;d.revision++;
   }
   if(a==='unequip'){
    if(!['banner','castle','cape','victory'].includes(item))return ok({message:'Geçersiz görünüm yuvası.'},400);
    delete d.equipped[item];d.revision++;
   }
   return ok(premiumWrite({...d,applied:a}));
  }
  if(path.includes('/rest/v1/rpc/sfb_daily_calendar'))return ok({message:'calendar not mocked'},404);
  if(path.includes('/rest/v1/rpc/sfb_village_api')){
   const d=read();return ok(write({...d,applied:payload.p_action}));
  }
  return ok({message:'unsupported synthetic QA endpoint'},404);
 };
 Object.defineProperty(window,'__starfortQaMock',{value:true});
})();
