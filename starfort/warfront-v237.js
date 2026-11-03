/** STARFORT v2.37 — verified battle logistics, guaranteed equipment crates, recurring objectives.
 * All balances and unlocks come from sfb_warfront_api; UI cannot mint rewards. */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {ITEMS} from './rules.js';
export const WARFRONT_DOCTRINES=Object.freeze([
 Object.freeze({id:'assault',name:'Hücum Taburu',icon:'⚔',cost:Object.freeze({gold:70,wood:50}),
  summary:'%12 daha fazla hasar; %6 daha fazla gelen hasar.',focus:'Hızlı biten savaşlarda üç yıldız için risk al.'}),
 Object.freeze({id:'bulwark',name:'Siper Garnizonu',icon:'🛡',cost:Object.freeze({wood:30,stone:65}),
  summary:'%10 başlangıç canı ve %22 daha az gelen hasar.',focus:'Zor patronlara karşı hayatta kal.'}),
 Object.freeze({id:'recon',name:'Yıldız Keşif Birliği',icon:'✧',cost:Object.freeze({gold:90,aether:12}),
  summary:'Aldatma hamlesine %25 ek hasar.',focus:'Düşman kalkanına karşı etkili karşı saldırı.'})
]);
export const WARFRONT_LOOT=Object.freeze([
 Object.freeze({id:'ward_mail',rarity:'uncommon'}),
 Object.freeze({id:'ember_blade',rarity:'rare'}),
 Object.freeze({id:'star_lens',rarity:'epic'}),
 Object.freeze({id:'moonheart',rarity:'legendary'}),
 Object.freeze({id:'ember_guard',rarity:'rare'}),
 Object.freeze({id:'star_spear',rarity:'rare'}),
 Object.freeze({id:'guardian_seal',rarity:'epic'}),
 Object.freeze({id:'starbreaker',rarity:'legendary'})
]);
export const WARFRONT_DAILY_REWARD=Object.freeze({gold:160,wood:75,stone:65,aether:14});
export const WARFRONT_WEEKLY_REWARD=Object.freeze({gold:580,wood:250,stone:210,aether:50});
const NUM=n=>Number(n).toLocaleString('tr-TR');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemsById=new Map(ITEMS.map(x=>[x.id,x]));
const names={gold:'altın',wood:'kereste',stone:'taş',aether:'yıldız özü'};
const prizeLabel=prize=>Object.entries(prize).map(([id,amount])=>NUM(amount)+' '+names[id]).join(' · ');
export const warfrontChestTarget=chestsClaimed=>chestsClaimed<4?[3,8,15,24][chestsClaimed]:24+(chestsClaimed-3)*12;
export const warfrontChestPrize=chestsClaimed=>WARFRONT_LOOT[chestsClaimed<4?chestsClaimed:4+((chestsClaimed-4)%4)];
const safe=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const oneOf=(x,options)=>options.includes(x);
export function validateWarfrontSnapshot(x){
 if(x?.ok!==true||x.source!=='server-warfront')throw Error('Cephe kaydı sunucudan doğrulanamadı.');
 if(x.pending!==null&&!WARFRONT_DOCTRINES.some(d=>d.id===x.pending))throw Error('Sunucu ikmali geçersiz.');
 if(!safe(x.revision,1e12)||x.revision<1||!safe(x.wins,1e8)||!safe(x.dailyWins,1e8)||
    !safe(x.weeklyWins,1e8)||x.dailyWins>x.wins||x.weeklyWins>x.wins||
    !safe(x.chestsClaimed,1e5)||x.nextChestWins!==warfrontChestTarget(x.chestsClaimed)||
    !/^20\d\d-\d\d-\d\d$/.test(x.day||'')||
    !/^20\d\d-\d\d$/.test(x.week||'')||
    typeof x.dailyClaimed!=='boolean'||typeof x.weeklyClaimed!=='boolean')
  throw Error('Cephe hedefleri geçersiz.');
 if(x.lastLoot!==null&&x.lastLoot!==undefined){
  const l=x.lastLoot;
  if(typeof l!=='object'||Array.isArray(l)||!safe(l.chest,1e5)||
     !oneOf(l.rarity,['uncommon','rare','epic','legendary'])||
     typeof l.converted!=='boolean'||l.chest>x.chestsClaimed||
     (l.converted?l.item!==null:!WARFRONT_LOOT.some(d=>d.id===l.item)))
    throw Error('Ganimet kaydı geçersiz.');
 }
 return {pending:x.pending,revision:x.revision,wins:x.wins,
  dailyWins:x.dailyWins,weeklyWins:x.weeklyWins,
  day:x.day,week:x.week,dailyClaimed:x.dailyClaimed,weeklyClaimed:x.weeklyClaimed,
  chestsClaimed:x.chestsClaimed,nextChestWins:x.nextChestWins,
  lastLoot:x.lastLoot?{...x.lastLoot}:null};
}
export async function warfrontRequest(action,{target=null,requestId=null,fetcher=fetch}={}){
 if(!oneOf(action,['get','prepare','cancel','claim_daily','claim_weekly','claim_chest']))
  throw Error('Bilinmeyen karargâh işlemi.');
 if(action==='prepare'&&!WARFRONT_DOCTRINES.some(x=>x.id===target))
  throw Error('Geçersiz ikmal planı.');
 const session=await freshAccountSession(fetcher);
 if(!session?.access_token||!session?.user?.id)throw Error('Cephe Karargâhı için hesabına gir.');
 let response,payload;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_warfront_api',{
   method:'POST',signal:AbortSignal.timeout(18000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_target:action==='prepare'?target:null,
    p_request_id:action==='get'?null:(requestId??crypto.randomUUID())})
  });
  payload=await response.json();
 }catch{throw Error('Cephe sunucusuna ulaşılamadı. Hesabın değiştirilmedi.');}
 if(!response.ok)throw Error(payload?.message||'Cephe işlemi sunucu tarafından reddedildi.');
 return {identity:session.user.id,snapshot:validateWarfrontSnapshot(payload)};
}
export function warfrontMarkup(front,game={},mission=null,{busy=false}={}){
 if(!front)return '<section class="warfront-shell"><h3>⚔ Cephe Karargâhı</h3><p>Ganimet ve ikmal hesabı sunucudan yükleniyor.</p><button class="secondary" data-warfront-refresh>Karargâhı yenile</button></section>';
 const canPrepare=!mission&&!front.pending&&!busy;
 const resource=game.res||{};
 const pending=WARFRONT_DOCTRINES.find(d=>d.id===front.pending);
 const preview=warfrontChestPrize(front.chestsClaimed),loot=itemsById.get(preview.id);
 const ready=front.wins>=front.nextChestWins;
 const chestColor=preview.rarity;
 const namesRarity={uncommon:'Sıradışı',rare:'Nadir',epic:'Destansı',legendary:'Efsanevi'};
 const options=WARFRONT_DOCTRINES.map(d=>{
  const affordable=Object.entries(d.cost).every(([k,v])=>(resource[k]||0)>=v);
  return `<article class="warfront-option ${pending?.id===d.id?'queued':''}"><span class="warfront-icon">${d.icon}</span>
   <strong>${esc(d.name)}</strong><p>${esc(d.summary)}</p><small>${esc(d.focus)}</small>
   <div class="warfront-cost">İkmal: ${prizeLabel(d.cost)}</div>
   <button class="${pending?.id===d.id?'secondary':'primary'}" data-warfront-action="prepare" data-warfront-target="${d.id}"
   ${!canPrepare||!affordable?'disabled':''}>${pending?.id===d.id?'✓ Hazır':!affordable?'Kaynak eksik':'İkmali hazırla'}</button>
   </article>`;
 }).join('');
 const missionLabel=mission?.doctrine&&mission.doctrine!=='none'
  ?WARFRONT_DOCTRINES.find(d=>d.id===mission.doctrine)?.name:'';
 const bounty=(title,period,wins,need,claimed,reward,key)=>`<article class="warfront-bounty">
   <span class="eyebrow">${esc(period)} · TEKRARLANABİLİR</span><strong>${esc(title)}</strong>
   <div class="warfront-progress"><i style="width:${Math.min(100,Math.floor(wins/need*100))}%"></i></div>
   <span>${NUM(Math.min(wins,need))} / ${need} zafer</span><small>${prizeLabel(reward)}</small>
   <button class="${wins>=need&&!claimed?'primary':'secondary'}" data-warfront-action="${key}"
     ${claimed||wins<need||busy?'disabled':''}>${claimed?'Bu dönem alındı':wins>=need?'Ödülü al':'Zaferleri tamamla'}</button>
   </article>`;
 return `<section class="warfront-shell" aria-label="Sunucu Cephe Karargâhı">
 <header class="warfront-head"><div><span class="eyebrow">KOMUTAN CEPHESİ · GERÇEK SUNUCU İLERLEMESİ</span>
 <h3>⚔ Cephe Karargâhı</h3><p>Savaştan önce ikmalini seç. Zaferlerinle garantili ekipman kazan. Tamamlanmış bölümleri tekrar oynamak da sayılır.</p></div>
 <span class="warfront-record">${NUM(front.wins)}<small>GERÇEK ZAFER</small></span></header>
 <div class="warfront-section-title"><b>01 · Savaş Öncesi İkmal</b><span>İsteğe bağlı; yalnızca bir sonraki sefer için</span></div>
 <div class="warfront-options">${options}</div>
 ${pending?`<div class="warfront-pending"><span>🛡 Hazır ikmal: <b>${esc(pending.name)}</b> · bir sonraki sefer başladığında tüketilir.</span>
 <button class="secondary" data-warfront-action="cancel" ${busy||mission?'disabled':''}>İptal et · malzemeleri iade al</button></div>`:''}
 ${missionLabel?`<p class="warfront-current">Sürmekte olan savaş doktrini: <b>${esc(missionLabel)}</b></p>`:''}
 <div class="warfront-section-title"><b>02 · Savaş Sandığı</b><span>Garantili eşya · rastgele ödül yok</span></div>
 <div class="warfront-chest ${chestColor}"><div class="warfront-chest-icon">▣</div><div>
 <span class="eyebrow">${esc(namesRarity[chestColor])} GANİMET · SANDIK ${NUM(front.chestsClaimed+1)}</span>
 <strong>${esc(loot?.name||preview.id)}</strong>
 <div class="warfront-progress"><i style="width:${Math.min(100,Math.floor(front.wins/front.nextChestWins*100))}%"></i></div>
 <small>${NUM(front.wins)} / ${NUM(front.nextChestWins)} doğrulanmış hikâye zaferi</small></div>
 <button class="${ready?'primary':'secondary'}" data-warfront-action="claim_chest" ${!ready||busy?'disabled':''}>${ready?'Sandığı aç':'Zafer gerekli'}</button></div>
 ${front.lastLoot?`<p class="warfront-last-loot">Son sandık: ${esc(front.lastLoot.converted?'Depo dolduğu için yıldız özü':'🎁 '+(itemsById.get(front.lastLoot.item)?.name||front.lastLoot.item))}</p>`:''}
 <div class="warfront-section-title"><b>03 · Günlük ve Haftalık Cephe</b><span>Her dönem sıfırlanan, her oyuncuya açık hedefler</span></div>
 <div class="warfront-bounties">
 ${bounty('Sınır Nöbeti',front.day,front.dailyWins,2,front.dailyClaimed,WARFRONT_DAILY_REWARD,'claim_daily')}
 ${bounty('Kuzey Muhafızları',front.week,front.weeklyWins,8,front.weeklyClaimed,WARFRONT_WEEKLY_REWARD,'claim_weekly')}
 </div>
 <small class="warfront-note">Tüm ilerleme, kaynaklar, zafer sayıları ve sandık ödülleri sunucudadır. Cephe hedefi sayacı ilk girişten sonra ilerlemeye başlar; giriş serisi şartı yoktur. Gün ve hafta UTC takvimine göre yenilenir.</small>
 <button class="secondary" data-warfront-refresh ${busy?'disabled':''}>↻ Karargâhı güncelle</button></section>`;
}
