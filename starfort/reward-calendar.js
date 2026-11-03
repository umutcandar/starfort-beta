import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {formatNumber} from './locale-v243.js';
import {rewardText as rt,rewardMilestoneLabel,rewardItemLabel} from './locale-rewards-v245.js';
export const CALENDAR_DAYS=28;
export const MILESTONES=Object.freeze({
 7:Object.freeze({label:'Ay Işığı Sandığı',item:'lunar_charm',extra:{gold:200,wood:90,stone:90,aether:20}}),
 14:Object.freeze({label:'Kor Sandığı',item:'ember_blade',extra:{gold:400,wood:180,stone:160,aether:35}}),
 21:Object.freeze({label:'Yıldız Sandığı',item:'star_lens',extra:{gold:700,wood:260,stone:240,aether:60}}),
 28:Object.freeze({label:'Kraliyet Sandığı',item:'royal_blade',extra:{gold:1200,wood:450,stone:380,aether:100}})
});
export const REWARD_ITEMS=Object.freeze({lunar_charm:'Ay Tılsımı',ember_blade:'Kor Kılıcı',star_lens:'Yıldız Merceği',royal_blade:'Kraliyet Kılıcı'});
export function rewardForDay(day){
 if(!Number.isInteger(day)||day<1||day>28)throw Error('Ödül günü 1–28 arasında olmalı.');
 const extra=MILESTONES[day]?.extra||{};
 return Object.freeze({gold:90+day*12+(extra.gold||0),wood:45+day*6+(extra.wood||0),
  stone:35+day*5+(extra.stone||0),aether:5+Math.floor((day-1)/4)*3+(extra.aether||0),
  item:MILESTONES[day]?.item||null});
}
export const utcDate=ms=>new Date(ms).toISOString().slice(0,10);
export function normalizeCalendar({claimCount=0,streak=0,lastClaimDay=null,serverNow=Date.now(),lastGranted=null}={}){
 if(!Number.isSafeInteger(claimCount)||claimCount<0||!Number.isInteger(streak)||streak<0||streak>100000||
   !Number.isSafeInteger(serverNow)||serverNow<0||lastClaimDay!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(lastClaimDay))
   throw Error('Ödül takvimi verisi geçersiz.');
 const today=utcDate(serverNow),available=!lastClaimDay||lastClaimDay<today;
 const nextDay=claimCount%28+1,displayDay=available?nextDay:(claimCount-1+28)%28+1;
 const cycle=Math.floor((claimCount-(available?0:1))/28)+1;
 if(lastClaimDay&&lastClaimDay>today)throw Error('Ödül takvimi sunucu gününden ileride.');
 return {claimCount,streak,lastClaimDay,serverNow,available,nextDay,displayDay,cycle:Math.max(1,cycle),
  lastGranted:lastGranted||null};
}
export function calendarFromServer(data){
 if(!data||data.ok!==true||data.source!=='server-calendar')throw Error('Sunucu ödül takvimi doğrulanamadı.');
 if(typeof data.available!=='boolean')throw Error('Sunucu ödül durumu geçersiz.');
 const value=normalizeCalendar(data);
 if(value.available!==data.available||data.nextDay!==value.nextDay||data.displayDay!==value.displayDay)throw Error('Sunucu ödül ilerlemesi uyuşmuyor.');
 return value;
}
export async function calendarRequest(action,{fetcher=fetch,requestId=null}={}){
 if(!['get','claim'].includes(action))throw Error('Geçersiz ödül işlemi.');
 const session=await freshAccountSession(fetcher);
 if(!session?.access_token||!session?.user?.id)throw Error('Günlük sunucu ödülü için hesabına gir.');
 let response,data;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_daily_calendar',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_request_id:action==='claim'?(requestId??crypto.randomUUID()):null})
  });
  data=await response.json();
 }catch{throw Error('Günlük ödül sunucusuna ulaşılamadı. Ödül verilmedi.');}
 if(!response.ok)throw Error(data?.message||'Günlük ödül sunucusu işlemi reddetti.');
 return {identity:session.user.id,calendar:calendarFromServer(data),claim:data.granted||null};
}
const num=n=>formatNumber(Number(n));
const shortReward=(r,detail=false)=>detail?
  `<span>🪙 ${num(r.gold)} ${rt('gold')}</span><span>🪵 ${num(r.wood)} ${rt('wood')}</span><span>🪨 ${num(r.stone)} ${rt('stone')}</span><span>✦ ${num(r.aether)} ${rt('aether')}</span>`:
  `🪙 ${num(r.gold)} · ✦ ${num(r.aether)}`;
export function rewardCalendarMarkup(calendar,{online=false,loading=false}={}){
 if(loading||!calendar)return `<div class="reward-sheet"><button type="button" class="reward-close" data-reward-close aria-label="${rt('close')}">×</button><h2>${rt('heading')}</h2><p>${rt('loading')}</p><button class="secondary" data-reward-retry>${rt('retry')}</button></div>`;
 const selected=calendar.displayDay,rec=rewardForDay(selected),current=calendar.claimCount%28;
 const completed=calendar.available?current:current||28;
 const cells=Array.from({length:28},(_,i)=>{
  const day=i+1,r=rewardForDay(day),milestone=MILESTONES[day],past=calendar.available?day<=current:day<=completed;
  const active=day===selected;
  return `<div class="reward-day ${past?'collected':''} ${active?'active':''} ${milestone?'milestone':''}" aria-label="${rt('day',{day})}; ${rewardMilestoneLabel(milestone?day:null)}; ${past?rt('opened'):active?rt('today'):rt('upcoming')}"><div class="reward-day-top"><small>${rt('day',{day})}</small>${past?'<span aria-label="${rt('opened')}">✓</span>':''}</div><div class="reward-day-icon">${milestone?(day===28?'👑':day===21?'💎':day===14?'🔥':'🌙'):'✦'}</div><strong>${milestone?rewardMilestoneLabel(day):rt('sourceChest')}</strong><small class="reward-day-amount">✦ ${num(r.aether)} · 🪙 ${num(r.gold)}</small></div>`;
 }).join('');
 const next=rewardForDay(calendar.nextDay),itemText=rec.item?`<div class="reward-item"><strong>🎁 ${rewardItemLabel(rec.item)}</strong><small>${rt('inventory')}</small></div>`:'';
 return `<div class="reward-sheet"><button class="reward-close" type="button" data-reward-close aria-label="${rt('close')}">×</button>
 <div class="reward-sheet-header"><span class="eyebrow">${rt('repeating')}</span><h2>✦ ${rt('heading')}</h2><p>${rt('intro')}</p></div>
 <div class="reward-summary"><div><strong>${calendar.displayDay} / 28</strong><small>${rt('day',{day:calendar.displayDay})}</small></div><div><strong>${rt('cycle',{cycle:calendar.cycle})}</strong><small>${rt('cycleRepeat')}</small></div><div><strong>🔥 ${calendar.streak}</strong><small>${rt('streak')}</small></div><div><strong>${rt(online?'server':'demo')}</strong><small>${rt(online?'serverReward':'localOnly')}</small></div></div>
 <div class="reward-progress" role="progressbar" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${completed}"><span style="width:${Math.round(completed/28*100)}%"></span></div>
 <div class="reward-grid">${cells}</div>
 <section class="reward-today"><div class="reward-today-copy"><span class="eyebrow">${rt(calendar.available?'today':'claimedToday')} · ${rt('day',{day:selected})}</span><h3>${rewardMilestoneLabel(selected)}</h3><div class="reward-breakdown">${shortReward(rec,true)}</div>${itemText}<p class="reward-next">${rt('next',{day:calendar.nextDay})} ${shortReward(next)}${next.item?' · 🎁 '+rewardItemLabel(next.item):''}</p></div><button class="primary reward-claim" data-reward-claim ${calendar.available?'':'disabled'}>${rt(calendar.available?'openChest':'claimed')}</button></section>
 <p class="reward-footer">${rt('utc')} ${rt(online?'serverFooter':'offlineFooter')}</p>
 </div>`;
}
