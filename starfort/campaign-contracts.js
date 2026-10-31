// Offline campaign contracts: bounded, optional, no streak penalties and no paid advantage.
// This is intentionally local-only progress; competitive rewards must be server validated.
export const CONTRACTS = Object.freeze([
  Object.freeze({id:'supply',event:'collect',title:'Erzak yolunu aç',detail:'Köy üretimini bir defa topla.',target:1,reward:{gold:60,wood:35}}),
  Object.freeze({id:'victory',event:'win',title:'Kuzey devriyesi',detail:'Herhangi bir hikâye seferini kazan.',target:1,reward:{gold:90,stone:45}}),
  Object.freeze({id:'tactics',event:'ability',title:'Yıldız yemini',detail:'Hikâye savaşlarında iki kahraman yeteneği kullan.',target:2,reward:{aether:8,wood:35}}),
]);
export const BANNER_MILESTONES = Object.freeze([
  {count:3,name:'Yeminli İzci'},
  {count:12,name:'Vadinin Muhafızı'},
  {count:36,name:'Yıldız Sancaktarı'},
  {count:90,name:'Kuzeyin Koruyucusu'},
]);
const validDay=day=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day);
const clampCount=(n,max)=>Number.isInteger(n)&&n>=0?Math.min(n,max):0;
export function localDay(now=Date.now()) {
  const d=new Date(Number.isFinite(now)&&now>=0?now:Date.now());
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function createContracts(now=Date.now()){
  return {day:localDay(now),progress:{supply:0,victory:0,tactics:0},claimed:{},totalClaims:0};
}
export function restoreContracts(raw,now=Date.now()){
  const current=createContracts(now);
  if(!raw||typeof raw!=='object')return current;
  current.totalClaims=clampCount(raw.totalClaims,100000);
  // Never trust a future-dated save; clock rewinds cannot reset the same day's claims.
  if(!validDay(raw.day)||raw.day!==current.day)return current;
  for(const contract of CONTRACTS){
    current.progress[contract.id]=clampCount(raw.progress?.[contract.id],contract.target);
    if(raw.claimed?.[contract.id]===true)current.claimed[contract.id]=true;
  }
  return current;
}
function currentContracts(state,now){
  if(!state.contracts)state.contracts=createContracts(now);
  const day=localDay(now);
  if(state.contracts.day<day){
    const total=clampCount(state.contracts.totalClaims,100000);
    state.contracts=createContracts(now);state.contracts.totalClaims=total;
  }
  return state.contracts;
}
export function recordContract(state,event,now=null){
  // Game combat can use a simulated clock; don't mix the wall clock into its save data.
  // An explicit timestamp (production) still advances the local day normally.
  if(now===null){const day=state.contracts?.day;now=validDay(day)?new Date(day+'T12:00:00').getTime():Date.now();}
  const record=currentContracts(state,now);
  if(record.day!==localDay(now))return false;
  let changed=false;
  for(const contract of CONTRACTS){
    if(contract.event!==event||record.claimed[contract.id])continue;
    const next=Math.min(contract.target,(record.progress[contract.id]||0)+1);
    if(next!==(record.progress[contract.id]||0)){record.progress[contract.id]=next;changed=true;}
  }
  return changed;
}
export function contractsStatus(state,now=Date.now()){
  const day=localDay(now),record=state.contracts?.day===day?state.contracts:createContracts(now);
  const totalClaims=clampCount(state.contracts?.totalClaims,100000);
  const earned=BANNER_MILESTONES.filter(b=>totalClaims>=b.count).map(b=>b.name);
  return {day,totalClaims,earned,upcoming:BANNER_MILESTONES.find(b=>totalClaims<b.count)||null,
    contracts:CONTRACTS.map(c=>({...c,progress:clampCount(record.progress?.[c.id],c.target),claimed:record.claimed?.[c.id]===true}))};
}
export function claimContractProgress(state,id,now=Date.now()){
  const record=currentContracts(state,now),contract=CONTRACTS.find(c=>c.id===id);
  if(!contract)return {ok:false,error:'Böyle bir görev yok.'};
  if(record.day!==localDay(now))return {ok:false,error:'Günlük görevler henüz yenilenemedi.'};
  if(record.claimed[id])return {ok:false,error:'Bu görevin ödülü zaten alındı.'};
  if((record.progress[id]||0)<contract.target)return {ok:false,error:'Önce görevi tamamla.'};
  record.claimed[id]=true;record.totalClaims=Math.min(100000,record.totalClaims+1);
  return {ok:true,reward:{...contract.reward},title:contract.title};
}
