import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
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
const num=n=>Number(n).toLocaleString('tr-TR');
const shortReward=(r,detail=false)=>detail?
  `<span>🪙 ${num(r.gold)} altın</span><span>🪵 ${num(r.wood)} kereste</span><span>🪨 ${num(r.stone)} taş</span><span>✦ ${num(r.aether)} yıldız özü</span>`:
  `🪙 ${num(r.gold)} · ✦ ${num(r.aether)}`;
export function rewardCalendarMarkup(calendar,{online=false,loading=false}={}){
 if(loading||!calendar)return `<div class="reward-sheet"><button type="button" class="reward-close" data-reward-close aria-label="Kapat">×</button><h2>Yıldız Sandıkları</h2><p>Sunucudaki ödül takvimi doğrulanıyor.</p><button class="secondary" data-reward-retry>Yeniden bağlan</button></div>`;
 const selected=calendar.displayDay,rec=rewardForDay(selected),current=calendar.claimCount%28;
 const completed=calendar.available?current:current||28;
 const cells=Array.from({length:28},(_,i)=>{
  const day=i+1,r=rewardForDay(day),milestone=MILESTONES[day],past=calendar.available?day<=current:day<=completed;
  const active=day===selected;
  return `<div class="reward-day ${past?'collected':''} ${active?'active':''} ${milestone?'milestone':''}" aria-label="${day}. gün; ${milestone?.label||'Günlük kaynak sandığı'}; ${past?'alındı':active?'sıradaki':'gelecek'}"><div class="reward-day-top"><small>GÜN ${day}</small>${past?'<span aria-label="Alındı">✓</span>':''}</div><div class="reward-day-icon">${milestone?(day===28?'👑':day===21?'💎':day===14?'🔥':'🌙'):'✦'}</div><strong>${milestone?milestone.label:'Kaynak Sandığı'}</strong><small class="reward-day-amount">✦ ${num(r.aether)} · 🪙 ${num(r.gold)}</small></div>`;
 }).join('');
 const next=rewardForDay(calendar.nextDay),itemText=rec.item?`<div class="reward-item"><strong>🎁 ${REWARD_ITEMS[rec.item]}</strong><small>Eşya envanterine eklenir; sınır doluysa +250 yıldız özü alırsın.</small></div>`:'';
 return `<div class="reward-sheet"><button class="reward-close" type="button" data-reward-close aria-label="Ödül penceresini kapat">×</button>
 <div class="reward-sheet-header"><span class="eyebrow">STARFORT · 28 GÜNLÜK TEKRARLANAN TAKVİM</span><h2>✦ Yıldız Sandıkları</h2><p>Her gün yeni bir sandık. Kaçırdığın günler ilerlemeni silmez; kaldığın sandıktan devam edersin.</p></div>
 <div class="reward-summary"><div><strong>${calendar.displayDay} / 28</strong><small>Bu döngünün günü</small></div><div><strong>${calendar.cycle}. Döngü</strong><small>28 gün bitince yenilenir</small></div><div><strong>🔥 ${calendar.streak}</strong><small>Aralıksız giriş serisi</small></div><div><strong>${online?'🛡 Sunucu':'🎮 Deneme'}</strong><small>${online?'Gerçek hesap ödülü':'Yalnızca yerel kayıt'}</small></div></div>
 <div class="reward-progress" role="progressbar" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${completed}"><span style="width:${Math.round(completed/28*100)}%"></span></div>
 <div class="reward-grid">${cells}</div>
 <section class="reward-today"><div class="reward-today-copy"><span class="eyebrow">${calendar.available?'BUGÜNÜN ÖDÜLÜ':'BUGÜN ALINDI'} · GÜN ${selected}</span><h3>${MILESTONES[selected]?.label||'Günlük Kaynak Sandığı'}</h3><div class="reward-breakdown">${shortReward(rec,true)}</div>${itemText}<p class="reward-next">Sıradaki ${calendar.nextDay}. gün: ${shortReward(next)}${next.item?' · 🎁 '+REWARD_ITEMS[next.item]:''}</p></div><button class="primary reward-claim" data-reward-claim ${calendar.available?'':'disabled'}>${calendar.available?'✦ Bugünkü sandığı aç':'✓ Bugünün ödülü alındı'}</button></section>
 <p class="reward-footer">Gün UTC 00.00'da yenilenir. Bir günü kaçırırsan kaldığın yerden devam edersin; yalnızca aralıksız giriş serisi sıfırlanır. ${online?'Ödüller sunucuda hesaplanır ve hesabına işlenir.':'Bu takvim çevrimdışı denemedir ve sunucu hesabına aktarılmaz.'}</p>
 </div>`;
}
