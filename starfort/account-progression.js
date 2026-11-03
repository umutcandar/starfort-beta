import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {HEROES,ITEMS} from './rules.js';
import {ASCENSION_ITEMS} from './relic-ascension-v252.js';
const HERO_IDS=new Set(HEROES.map(h=>h.id)),ITEM_IDS=new Map(ITEMS.map(x=>[x.id,x]));
const COUNTERS=['win','hero','forge','maze','rift','veteran'];
const MOVES=['strike','guard','feint','rally'];
export const ACCOUNT_ACTIONS=['get','hero','forge','equip','unequip','team','enhance','ascend','mission_start','mission_turn','mission_abandon','contract','chronicle_claim','title','boss_claim'];
const safeNumber=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function validateAccountSnapshot(data){
 if(!data||data.ok!==true||data.source!=='server')throw Error('Hesap doğrulaması başarısız.');
 const heroes=data.heroes,inventory=data.inventory,loadouts=data.loadouts,team=data.team,cleared=data.cleared,stars=data.campaignStars;
 if(!object(heroes)||!object(inventory)||!object(loadouts)||!Array.isArray(team)||!Array.isArray(cleared)||!object(stars))
  throw Error('Sunucu kahraman/çanta kaydı bozuk.');
 if(!Object.keys(heroes).every(id=>HERO_IDS.has(id)&&safeNumber(heroes[id],1,20)))throw Error('Sunucu kahraman seviyesi bozuk.');
 if(!Object.keys(inventory).every(id=>ITEM_IDS.has(id)&&safeNumber(inventory[id],1,20)))throw Error('Sunucu eşya verisi bozuk.');
 if(team.length!==3||new Set(team).size!==3||!team.every(id=>HERO_IDS.has(id)&&heroes[id]))throw Error('Sunucu takım dizilimi bozuk.');
 if(cleared.length>8||!cleared.every((stage,i)=>stage===i+1))throw Error('Sunucu hikâye verisi bozuk.');
 if(!Object.keys(stars).every(id=>safeNumber(Number(id),1,8)&&safeNumber(stars[id],1,3)&&cleared.includes(Number(id))))throw Error('Sunucu yıldız verisi bozuk.');
 const used={};
 for(const [hero,slots] of Object.entries(loadouts)){
  if(!heroes[hero]||!object(slots))throw Error('Sunucu ekipman dizilimi bozuk.');
  for(const [slot,id] of Object.entries(slots)){
   if(!['weapon','armor','relic'].includes(slot)||ITEM_IDS.get(id)?.slot!==slot)throw Error('Sunucu ekipman yuvası bozuk.');
   used[id]=(used[id]||0)+1;
   if(used[id]>(inventory[id]||0))throw Error('Bir eşya aynı anda iki kahramanda olamaz.');
  }
 }
 if(!safeNumber(data.mazeFloor,0,16))throw Error('Labirent katı geçersiz.');
 if(!object(data.counters)||!COUNTERS.every(k=>safeNumber(data.counters[k],0,1e8)))throw Error('Sunucu başarı sayacı bozuk.');
 if(!object(data.contractClaims)||!Array.isArray(data.titles)||data.titles.length>16)throw Error('Sunucu görev/unvan verisi bozuk.');
 const upgrades=data.itemUpgrades||{};
 if(!object(upgrades)||!Object.keys(upgrades).every(k=>ITEM_IDS.has(k)&&safeNumber(upgrades[k],1,5)&&inventory[k]>0))throw Error('Eşya ustalığı verisi bozuk.');
 const ascensions=data.relicAscensions??{},bossSeals=data.bossSeals??0;
 if(!object(ascensions)||!safeNumber(bossSeals,0,10000)||
    !Object.entries(ascensions).every(([id,level])=>
      ASCENSION_ITEMS.includes(id)&&safeNumber(level,1,4)&&inventory[id]>0&&upgrades[id]===5))
  throw Error('Sunucu yıldız işleme verisi bozuk.');
 const boss=data.worldBoss||null;
 if(boss!==null&&(!object(boss)||typeof boss.week!=='string'||boss.week.length>12||
  !safeNumber(boss.goal,1,1e9)||!safeNumber(boss.damage,0,boss.goal)||!safeNumber(boss.victories,0,1e8)||typeof boss.claimed!=='boolean'))
  throw Error('Ortak dünya patronu verisi bozuk.');
 if(data.bossWeek!==null&&data.bossWeek!==undefined&&(typeof data.bossWeek!=='string'||data.bossWeek.length>12))throw Error('Patron haftası geçersiz.');

 const act2Cleared=data.act2Cleared??[],act2Stars=data.act2Stars??{};
 if(!Array.isArray(act2Cleared)||act2Cleared.length>8||!act2Cleared.every((x,i)=>x===i+1)||!object(act2Stars)||
  !Object.entries(act2Stars).every(([k,v])=>safeNumber(Number(k),1,8)&&act2Cleared.includes(Number(k))&&safeNumber(v,1,3)))
  throw Error('İkinci perde ilerlemesi bozuk.');
 const m=data.mission;
 // v2.51: accept the new server-only encounter balance while preserving legacy missions.
 if(m&&m.balanceVersion!==undefined&&!safeNumber(m.balanceVersion,1,6))throw Error('Sunucu savaş dengesi sürümü geçersiz.');
 // Three-wave stories have a longer server turn budget. Preserve legacy single-wave saves.
 const multiWave=object(m)&&['story','act2'].includes(m.mode)&&m.waves===3;
 const waveValid=!object(m)||(m.waves===undefined&&m.wave===undefined&&m.waveTurn===undefined)||
  (safeNumber(m.waves,1,3)&& (m.waves===1||['story','act2'].includes(m.mode)&&m.waves===3)&&
   safeNumber(m.wave,1,m.waves)&&safeNumber(m.waveTurn,0,multiWave?36:14)&&
   m.waveTurn<=m.turn);
 if(m!==null&&(!object(m)||!waveValid||
  (m.doctrine!==undefined&&!['none','assault','bulwark','recon'].includes(m.doctrine))||
  (m.lastRallyTurn!==undefined&&(!safeNumber(m.lastRallyTurn,0,36)||m.lastRallyTurn>m.turn))||
  (m.enemyIntent!==undefined&&!['strike','crush','shield','drain','sunder','eclipse'].includes(m.enemyIntent))||
  (m.enemyIntent==='sunder'&&!(m.balanceVersion>=3&&(m.mode==='boss'||(m.mode==='story'&&m.stage>=4&&m.wave===3))))||(m.enemyIntent==='eclipse'&&!(m.balanceVersion>=4&&(
    (m.mode==='boss'&&m.stage===4)||
    (m.mode==='story'&&m.stage>=6&&m.wave===3)||
    (m.mode==='act2'&&m.stage>=5&&m.wave===3))))||
   !['story','act2','veteran','rift','maze','boss'].includes(m.mode)||!safeNumber(m.stage,1,8)||
 !safeNumber(m.turn,0,multiWave?36:14)||!safeNumber(m.enemyHp,0,100000)||!safeNumber(m.playerHp,0,100000)||
 !safeNumber(m.lastTurnAt,1e12,2e13)|| (m.cooldowns!==undefined&&(!object(m.cooldowns)||!Object.entries(m.cooldowns).every(([id,next])=>HERO_IDS.has(id)&&safeNumber(next,1,multiWave?40:20))))))throw Error('Sunucu sefer kaydı bozuk.');
 return {heroes:{...heroes},inventory:{...inventory},loadouts:structuredClone(loadouts),team:[...team],
  cleared:[...cleared],campaignStars:{...stars},act2Cleared:[...act2Cleared],act2Stars:{...act2Stars},veteranMedals:{...(data.veteranMedals||{})},
  mazeFloor:data.mazeFloor,riftWeek:data.riftWeek,mission:m?{...m}:null,lastReport:data.lastReport?{...data.lastReport}:null,
  counters:{...data.counters},contractClaims:{...data.contractClaims},titles:[...data.titles],itemUpgrades:{...upgrades},relicAscensions:{...ascensions},bossSeals,bossWeek:data.bossWeek??null,worldBoss:boss?{...boss}:null};
}
export async function accountProgressRequest(action,{target=null,aux=null,requestId=null,fetcher=fetch}={}){
 if(!ACCOUNT_ACTIONS.includes(action))throw Error('Tanımsız hesap işlemi.');
 if(target!==null&&(typeof target!=='string'||target.length>90))throw Error('Geçersiz seçim.');
 if(aux!==null&&(typeof aux!=='string'||aux.length>60))throw Error('Geçersiz hamle.');
 if(action==='mission_turn'&&!MOVES.includes(aux)&&!(typeof aux==='string'&&/^skill:(aldren|lyra|rovan|mira|doran|vesper|eira)$/.test(aux)))throw Error('Geçersiz savaş hamlesi.');
 const session=await freshAccountSession(fetcher);
 if(!session?.access_token||!session?.user?.id)throw Error('E-posta hesabına giriş yapman gerekiyor.');
 const id=action==='get'?null:requestId??crypto.randomUUID();
 let response,data;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_starfort_progress',{
   method:'POST',signal:AbortSignal.timeout(20000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_target:target,p_aux:aux,p_request_id:id})
  });
  data=await response.json();
 }catch{throw Error('Hesap ilerleme sunucusuna bağlanılamadı; işlem tekrar denenebilir.');}
 if(!response.ok)throw Error(data?.message||'Hesap işlemi reddedildi.');
 return {identity:session.user.id,data,account:validateAccountSnapshot(data),requestId:id};
}
export function accountServerView(state,account){
 if(!account)return state;
 return {...state,heroes:Object.fromEntries(Object.entries(account.heroes).map(([id,level])=>[id,{level}])),
  inventory:{...account.inventory},loadouts:structuredClone(account.loadouts),itemUpgrades:{...account.itemUpgrades},relicAscensions:{...account.relicAscensions},bossSeals:account.bossSeals,team:[...account.team],
  cleared:[...account.cleared],campaignStars:{...account.campaignStars},act2Cleared:[...(account.act2Cleared||[])],act2Stars:{...(account.act2Stars||{})},veteranMedals:{...account.veteranMedals},
  serverMission:account.mission,serverReport:account.lastReport,serverCounters:{...account.counters},
  serverTitles:[...account.titles],serverRiftWeek:account.riftWeek,serverMazeFloor:account.mazeFloor,serverContractClaims:{...account.contractClaims}};
}
