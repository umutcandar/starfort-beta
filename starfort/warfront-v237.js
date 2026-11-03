/** STARFORT v2.37 — verified battle logistics, guaranteed equipment crates, recurring objectives.
 * All balances and unlocks come from sfb_warfront_api; UI cannot mint rewards. */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {ITEMS} from './rules.js';
import {textKey as tx,longText as lt} from './locale-sections-v247.js';
import {formatNumber} from './locale-v243.js';
import {displayResource} from './locale-game-content-v245.js';
import {displayItem} from './locale-items-v246.js';
import {nativeWarfrontDoctrine} from './locale-warfront-v247.js';
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
const NUM=n=>formatNumber(Number(n));
const DOCTRINE_EN={assault:['Assault Battalion','12% more damage, 6% more incoming damage.','Take risks to earn three stars in fast battles.'],bulwark:['Shield Garrison','10% more starting health, 22% less incoming damage.','Survive against challenging bosses.'],recon:['Star Recon Corps','25% bonus damage to the Feint action.','Counter enemies who rely on shields.']};
export const displayWarfrontDoctrine=d=>!d?d:({...d,...(nativeWarfrontDoctrine(d.id)||{name:lt(d.name,DOCTRINE_EN[d.id]?.[0]||d.name),summary:lt(d.summary,DOCTRINE_EN[d.id]?.[1]||d.summary),focus:lt(d.focus,DOCTRINE_EN[d.id]?.[2]||d.focus)})});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemsById=new Map(ITEMS.map(x=>[x.id,x]));
const prizeLabel=prize=>Object.entries(prize).map(([id,amount])=>NUM(amount)+' '+displayResource(id)).join(' · ');
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
 if(!front)return `<section class="warfront-shell"><h3>⚔ ${tx('warTitle')}</h3><p>${lt('Ganimet ve ikmal hesabı sunucudan yükleniyor.','Loading your server-verified supplies and loot.')}</p><button class="secondary" data-warfront-refresh>${tx('refresh')}</button></section>`;
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
   <strong>${esc(displayWarfrontDoctrine(d).name)}</strong><p>${esc(displayWarfrontDoctrine(d).summary)}</p><small>${esc(displayWarfrontDoctrine(d).focus)}</small>
   <div class="warfront-cost">${tx('warSupply')}: ${prizeLabel(d.cost)}</div>
   <button class="${pending?.id===d.id?'secondary':'primary'}" data-warfront-action="prepare" data-warfront-target="${d.id}"
   ${!canPrepare||!affordable?'disabled':''}>${pending?.id===d.id?'✓ '+tx('ready'):!affordable?lt('Kaynak eksik','Insufficient resources'):lt('İkmali hazırla','Prepare supplies')}</button>
   </article>`;
 }).join('');
 const missionLabel=mission?.doctrine&&mission.doctrine!=='none'
  ?displayWarfrontDoctrine(WARFRONT_DOCTRINES.find(d=>d.id===mission.doctrine))?.name:'';
 const bounty=(title,period,wins,need,claimed,reward,key)=>`<article class="warfront-bounty">
   <span class="eyebrow">${esc(period)} · ${lt('TEKRARLANABİLİR','REPEATABLE')}</span><strong>${esc(title)}</strong>
   <div class="warfront-progress"><i style="width:${Math.min(100,Math.floor(wins/need*100))}%"></i></div>
   <span>${NUM(Math.min(wins,need))} / ${need} ${tx('wins')}</span><small>${prizeLabel(reward)}</small>
   <button class="${wins>=need&&!claimed?'primary':'secondary'}" data-warfront-action="${key}"
     ${claimed||wins<need||busy?'disabled':''}>${claimed?lt('Bu dönem alındı','Claimed this period'):wins>=need?tx('claim'):lt('Zaferleri tamamla','Earn more victories')}</button>
   </article>`;
 return `<section class="warfront-shell" aria-label="${lt('Sunucu Cephe Karargâhı','Server Frontier Headquarters')}">
 <header class="warfront-head"><div><span class="eyebrow">${lt('KOMUTAN CEPHESİ · GERÇEK SUNUCU İLERLEMESİ','COMMANDER FRONTIER · VERIFIED SERVER PROGRESSION')}</span>
 <h3>⚔ ${tx('warTitle')}</h3><p>${lt('Savaştan önce ikmalini seç. Zaferlerinle garantili ekipman kazan. Tamamlanmış bölümleri tekrar oynamak da sayılır.','Choose your supply doctrine before battle. Earn guaranteed equipment through victories, including replayed chapters.')}</p></div>
 <span class="warfront-record">${NUM(front.wins)}<small>${lt('GERÇEK ZAFER','VERIFIED WINS')}</small></span></header>
 <div class="warfront-section-title"><b>01 · ${tx('warSupply')}</b><span>${lt('İsteğe bağlı; yalnızca bir sonraki sefer için','Optional · Applies to the next expedition only')}</span></div>
 <div class="warfront-options">${options}</div>
 ${pending?`<div class="warfront-pending"><span>🛡 ${lt('Hazır ikmal','Ready supplies')}: <b>${esc(displayWarfrontDoctrine(pending).name)}</b> · ${lt('bir sonraki sefer başladığında tüketilir.','consumed when the next expedition starts.')}</span>
 <button class="secondary" data-warfront-action="cancel" ${busy||mission?'disabled':''}>${tx('cancel')} · ${lt('malzemeleri iade al','refund resources')}</button></div>`:''}
 ${missionLabel?`<p class="warfront-current">${lt('Sürmekte olan savaş doktrini','Active battle doctrine')}: <b>${esc(missionLabel)}</b></p>`:''}
 <div class="warfront-section-title"><b>02 · ${tx('warChest')}</b><span>${lt('Garantili eşya · rastgele ödül yok','Guaranteed item · No random loot')}</span></div>
 <div class="warfront-chest ${chestColor}"><div class="warfront-chest-icon">▣</div><div>
 <span class="eyebrow">${esc(lt(namesRarity[chestColor],({uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary'})[chestColor]))} ${tx('reward')} · ${tx('warChest')} ${NUM(front.chestsClaimed+1)}</span>
 <strong>${esc(displayItem(loot)?.name||preview.id)}</strong>
 <div class="warfront-progress"><i style="width:${Math.min(100,Math.floor(front.wins/front.nextChestWins*100))}%"></i></div>
 <small>${NUM(front.wins)} / ${NUM(front.nextChestWins)} ${lt('doğrulanmış hikâye zaferi','verified story victories')}</small></div>
 <button class="${ready?'primary':'secondary'}" data-warfront-action="claim_chest" ${!ready||busy?'disabled':''}>${ready?lt('Sandığı aç','Open chest'):lt('Zafer gerekli','More wins required')}</button></div>
 ${front.lastLoot?`<p class="warfront-last-loot">${lt('Son sandık','Last chest')}: ${esc(front.lastLoot.converted?lt('Depo dolduğu için yıldız özü','Star essence (storage full)'):'🎁 '+(displayItem(itemsById.get(front.lastLoot.item))?.name||front.lastLoot.item))}</p>`:''}
 <div class="warfront-section-title"><b>03 · ${tx('daily')} / ${tx('weekly')}</b><span>${lt('Her dönem sıfırlanan, her oyuncuya açık hedefler','Recurring objectives open to every player')}</span></div>
 <div class="warfront-bounties">
 ${bounty(lt('Sınır Nöbeti','Frontier Watch'),front.day,front.dailyWins,2,front.dailyClaimed,WARFRONT_DAILY_REWARD,'claim_daily')}
 ${bounty(lt('Kuzey Muhafızları','Northern Wardens'),front.week,front.weeklyWins,8,front.weeklyClaimed,WARFRONT_WEEKLY_REWARD,'claim_weekly')}
 </div>
 <small class="warfront-note">${lt('Tüm ilerleme, kaynaklar, zafer sayıları ve sandık ödülleri sunucudadır. Cephe hedefi sayacı ilk girişten sonra ilerlemeye başlar; giriş serisi şartı yoktur. Gün ve hafta UTC takvimine göre yenilenir.','Progress, resources, wins and chest rewards are stored on the server. The tracker starts after your first login. No login streak is required; daily and weekly objectives reset on the UTC calendar.')}</small>
 <button class="secondary" data-warfront-refresh ${busy?'disabled':''}>↻ ${tx('refresh')}</button></section>`;
}
