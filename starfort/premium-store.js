/** Server-backed premium wardrobe and free season path. Never store purchase state in a browser save. */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
import {textKey as tx,longText as lt} from './locale-sections-v247.js';
import {formatNumber,getLocale} from './locale-v243.js';
export const PREMIUM_COSMETICS=Object.freeze([
 {id:'castle-aurora',name:'Kutup Işığı Hisarı',kind:'castle',price:200,detail:'Köyün üzerinde kutup ışıkları renkleri.'},
 {id:'castle-ember',name:'Kor Hisarı',kind:'castle',price:200,detail:'Kale çevresine bakır ve kor teması.'},
 {id:'cape-starlight',name:'Yıldız Komutanı Pelerini',kind:'cape',price:160,detail:'Komutan kimliğinde parlayan yıldız çerçevesi.'},
 {id:'cape-shadow',name:'Gölge Pelerini',kind:'cape',price:160,detail:'Karanlık savaşçının gümüş izleri.'},
 {id:'banner-royal',name:'Kraliyet Sancağı',kind:'banner',price:120,detail:'Altın hanedan sancağı.'},
 {id:'banner-astral',name:'Astral Sancak',kind:'banner',price:120,detail:'Mavi yıldız lonca arması.'},
 {id:'victory-gold',name:'Altın Zafer İzi',kind:'victory',price:140,detail:'Zafer sahnesinde altın arma.'},
 {id:'victory-sky',name:'Göksel Zafer İzi',kind:'victory',price:140,detail:'Zafer sahnesinde gök mavisi arma.'}
]);
export const FREE_SEASON=Object.freeze([
 {id:'1',wins:2,item:'banner-trailblazer',name:'Öncü Sancağı',kind:'banner'},
 {id:'2',wins:5,item:'cape-scout',name:'İzci Pelerini',kind:'cape'},
 {id:'3',wins:10,item:'castle-dawn',name:'Şafak Hisarı',kind:'castle'},
 {id:'4',wins:18,item:'victory-constellation',name:'Takımyıldızı Zaferi',kind:'victory'}
]);
export const PREMIUM_ALL_ITEMS=Object.freeze([...PREMIUM_COSMETICS,...FREE_SEASON.map(x=>({id:x.item,name:x.name,kind:x.kind,price:null,detail:'Ücretsiz sezon zafer ödülü.'}))]);
export const CRYSTAL_PACKS=Object.freeze([
 {id:'crystals100',name:'Yıldız Kıvılcımı',crystals:100},
 {id:'crystals500',name:'Göksel Sandık',crystals:500},
 {id:'crystals1200',name:'Kraliyet Hazinesi',crystals:1200}
]);
const kindNames=Object.freeze({castle:'Kale',cape:'Komutan',banner:'Sancak',victory:'Zafer'});
const PREMIUM_DISPLAY_EN={
 'castle-aurora':['Aurora Keep','Northern lights shimmering over your village.'], 'castle-ember':['Ember Keep','A copper and ember theme for the keep.'],
 'cape-starlight':['Starlight Commander Cape','A glowing star frame on your commander profile.'],'cape-shadow':['Shadow Cape','Silver trails of a dark warrior.'],
 'banner-royal':['Royal Banner','A golden dynasty banner.'],'banner-astral':['Astral Banner','A blue-star alliance crest.'],
 'victory-gold':['Golden Victory Trail','A golden emblem during victory scenes.'],'victory-sky':['Skyward Victory Trail','A sky-blue victory emblem.'],
 'banner-trailblazer':['Trailblazer Banner','Free season victory reward.'],'cape-scout':['Scout Cape','Free season victory reward.'],
 'castle-dawn':['Dawn Keep','Free season victory reward.'],'victory-constellation':['Constellation Victory','Free season victory reward.'],
 'crystals100':['Star Spark','A crystal pack planned for a future release.'], 'crystals500':['Celestial Chest','A crystal pack planned for a future release.'],'crystals1200':['Royal Treasury','A crystal pack planned for a future release.']
};
export const displayPremiumItem=x=>!x||getLocale()==='tr'?x:({...x,name:lt(x.name,PREMIUM_DISPLAY_EN[x.id]?.[0]||x.name),detail:lt(x.detail,PREMIUM_DISPLAY_EN[x.id]?.[1]||x.detail)});
const displayPremiumKind=kind=>lt(kindNames[kind],({castle:'Keep',cape:'Cape',banner:'Banner',victory:'Victory'})[kind]||kind);
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const allowed=new Map(PREMIUM_ALL_ITEMS.map(x=>[x.id,x.kind]));
export function validatePremium(data){
 if(!data||data.ok!==true||data.source!=='server-premium'||data.paymentsEnabled!==false)
  throw Error('Mağaza hesabı sunucudan doğrulanamadı.');
 if(!Number.isSafeInteger(data.crystals)||data.crystals<0||data.crystals>100000000||
    !Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Kristal bakiyesi geçersiz.');
 if(data.vipUntil!==null&&(data.vipUntil===undefined||!Number.isSafeInteger(data.vipUntil)||data.vipUntil<0))
  throw Error('VIP tarihi geçersiz.');
 if(!Array.isArray(data.owned)||data.owned.length>PREMIUM_ALL_ITEMS.length||
    new Set(data.owned).size!==data.owned.length||!data.owned.every(x=>allowed.has(x)))
  throw Error('Kozmetik envanteri geçersiz.');
 if(!data.equipped||typeof data.equipped!=='object'||Array.isArray(data.equipped)||
   !Object.entries(data.equipped).every(([slot,item])=>kindNames[slot]&&allowed.get(item)===slot&&data.owned.includes(item)))
  throw Error('Kozmetik kuşanımı doğrulanamadı.');
 const s=data.season;
 if(!s||typeof s.month!=='string'||!/^20\d\d-(0[1-9]|1[0-2])$/.test(s.month)||
   !Number.isSafeInteger(s.wins)||s.wins<0||s.premium!==false||
   JSON.stringify(s.thresholds)!=='[2,5,10,18]'||!Array.isArray(s.freeClaims)||
   !Array.isArray(s.premiumClaims)||s.premiumClaims.length!==0||
   new Set(s.freeClaims).size!==s.freeClaims.length||
   !s.freeClaims.every(x=>['1','2','3','4'].includes(x)))
  throw Error('Sezon bileti ilerlemesi geçersiz.');
 return {crystals:data.crystals,revision:data.revision,owned:[...data.owned],equipped:{...data.equipped},
  vipUntil:data.vipUntil,season:{...s,freeClaims:[...s.freeClaims],premiumClaims:[...s.premiumClaims]},paymentsEnabled:false};
}
export async function premiumRequest(action,{item=null,requestId=null,fetcher=fetch}={}){
 if(!['get','purchase','equip','unequip','claim'].includes(action))throw Error('Tanımsız mağaza işlemi.');
 if(action==='purchase'&&!PREMIUM_COSMETICS.some(x=>x.id===item))throw Error('Ürün mağazada yok.');
 if(action==='equip'&&!allowed.has(item))throw Error('Kozmetik mağazada yok.');
 if(action==='unequip'&&!Object.hasOwn(kindNames,item))throw Error('Kozmetik yuvası geçersiz.');
 if(action==='claim'&&!FREE_SEASON.some(x=>x.id===item))throw Error('Sezon ödülü geçersiz.');
 const account=await freshAccountSession(fetcher);
 if(!account?.access_token||!account.user?.id)throw Error('Önce hesabına giriş yap.');
 let response,data;
 try{
  response=await fetcher(SUPABASE_URL+'/rest/v1/rpc/sfb_premium_api',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+account.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({p_action:action,p_item:action==='get'?null:item,p_request_id:action==='get'?null:(requestId??crypto.randomUUID())})
  });
  data=await response.json();
 }catch{throw Error('Mağaza sunucusuna ulaşılamadı. İşlem gerçekleşmedi.');}
 if(!response.ok)throw Error(data?.message||data?.error||'Mağaza işlemi reddedildi.');
 return {identity:account.user.id,snapshot:validatePremium(data)};
}
export const seasonProgress=s=>({wins:s?.season?.wins||0,month:s?.season?.month||'-',claimed:s?.season?.freeClaims||[]});
export function premiumStoreMarkup(data,{loading=false,busy=false}={}){
 if(loading||!data)return `<section class="premium-live"><h3>${tx('premiumTitle')}</h3><p>${lt('Sunucuya bağlı mağaza hesabı doğrulanıyor.','Verifying your server-linked store account.')}</p><button class="secondary" data-premium-refresh>${tx('refresh')}</button></section>`;
 const owned=new Set(data.owned),season=data.season;
 const itemRows=PREMIUM_COSMETICS.map(o=>{
  const has=owned.has(o.id),active=data.equipped[o.kind]===o.id,afford=data.crystals>=o.price;
  return `<article class="premium-live-item ${active?'equipped':''}">
   <div class="premium-live-icon" aria-hidden="true">${({castle:'♜',cape:'♟',banner:'⚑',victory:'✦'})[o.kind]}</div>
   <span class="eyebrow">${displayPremiumKind(o.kind)} · ${o.price} ✦</span><h4>${esc(displayPremiumItem(o).name)}</h4><p>${esc(displayPremiumItem(o).detail)}</p>
   <button class="${active?'secondary':has||afford?'primary':'secondary'}"
    data-premium-action="${active?'unequip':has?'equip':'purchase'}"
    data-premium-item="${active?o.kind:o.id}" ${busy||!has&&!afford?'disabled':''}>${active?tx('unequip'):has?tx('equip'):'✦ '+o.price+' '+lt('Kristal','Crystals')}</button>
   </article>`;
 }).join('');
 const free=FREE_SEASON.map(o=>{
  const claimed=season.freeClaims.includes(o.id),has=owned.has(o.item),active=data.equipped[o.kind]===o.item,
    earned=season.wins>=o.wins;
  return `<article class="premium-season-tier ${claimed?'claimed':''}"><span class="premium-season-count">${o.wins} ${tx('wins')}</span>
    <strong>${esc(displayPremiumItem({...o,id:o.item}).name)}</strong><small>${claimed?'✓ '+tx('claimed'):season.wins+' / '+o.wins+' '+tx('wins')}</small>
    <button class="${earned&&!claimed||claimed&&!active?'primary':'secondary'}"
     data-premium-action="${!claimed?'claim':active?'unequip':'equip'}"
     data-premium-item="${!claimed?o.id:active?o.kind:o.item}"
     ${busy||!earned&&!claimed?'disabled':''}>${!claimed?tx('claim'):active?tx('unequip'):has?tx('equip'):tx('claimed')}</button></article>`;
 }).join('');
 const ownedNames=data.owned.map(id=>displayPremiumItem(PREMIUM_ALL_ITEMS.find(x=>x.id===id))?.name||id);
 return `<section class="premium-live" aria-label="${lt('Hesaba bağlı mağaza','Account-linked store')}">
  <header class="premium-live-head"><div><span class="eyebrow">STARFORT · ${lt('SUNUCU KONTROLLÜ MAĞAZA','SERVER-AUTHORITATIVE STORE')}</span><h3>✦ ${tx('premiumTitle')}</h3>
  <p>${lt('Kalıcı kozmetik sahipliği; saldırı, PvP gücü veya inşaat süresi değiştirmez.','Permanent cosmetic ownership never changes attack, PvP power or construction times.')}</p></div>
  <div class="premium-wallet"><strong>${formatNumber(data.crystals)} ✦</strong><small>${lt('Yıldız Kristali','Star Crystals')}</small><small>${data.owned.length} ${lt('görünüm','appearances')}</small></div></header>
  <div class="premium-payment-lock"><b>${lt('Gerçek para ödemeleri henüz kapalı','Real-money payments are disabled')}</b><p>${lt('Kristal paketleri, VIP ve premium sezon bileti hazırlanıyor. Ödeme sağlayıcısı bağlanmadan bakiye yüklenmez, para çekilmez.','Crystal packs, VIP and the premium season pass are planned. No money is charged or added without a verified payment provider.')}</p></div>
  <div class="premium-packages">${CRYSTAL_PACKS.map(o=>`<div><strong>${esc(displayPremiumItem(o).name)}</strong><span>${o.crystals} ✦</span><button disabled class="secondary" >${tx('soon')}</button></div>`).join('')}
    <div><strong >VIP · 30 ${lt('gün','days')}</strong><span>${lt('Özel hesap çerçevesi','Special profile frame')}</span><button disabled class="secondary">Yakında</button></div>
    <div><strong>${lt('Sezon Bileti','Season Pass')}</strong><span>${lt('Premium kozmetik yolu','Premium cosmetic rewards')}</span><button disabled class="secondary">Yakında</button></div></div>
  <div class="premium-live-subhead"><h3>${tx('premiumCollection')}</h3><p>${lt('Kristal bakiyesi yalnızca doğrulanmış ödeme ile oluşabilir. Eşyalar bir kez alınır ve hesabında kalır.','Crystals can be added only through verified payment. Cosmetics are permanently owned once unlocked.')}</p></div>
  <div class="premium-live-grid">${itemRows}</div>
  <section class="premium-season"><div class="premium-season-head"><div><span class="eyebrow">${lt('AYLIK YOLCULUK · ÜCRETSİZ İLERLEME','MONTHLY JOURNEY · FREE PROGRESSION')}</span>
  <h3>${esc(season.month)} · ${tx('premiumSeason')}</h3><p>${lt('Bu sezonda ilk kez mağazaya girdiğinden beri kaydedilen doğrulanmış savaş galibiyetleri sayılır. Günlük giriş zorunluluğu yoktur.','Verified battle victories count after you first open this season. No daily login requirement.')}</p></div>
  <strong>${season.wins} <small>${tx('wins')}</small></strong></div>
  <div class="premium-season-grid">${free}</div>
  <p class="premium-payment-lock">${lt('Premium ödül yolu ödeme sistemi açılana kadar kilitli. Ücretsiz ödüller için kristal gerekmez.','Premium rewards remain locked until payments launch. Free rewards never require crystals.')}</p></section>
  <p class="premium-owned"><b>${lt('Sahip olduğun görünümler','Owned appearances')}:</b> ${ownedNames.length?ownedNames.map(esc).join(' · '):tx('empty')}</p>
  <button class="secondary" data-premium-refresh ${busy?'disabled':''}>${tx('refresh')}</button></section>`;
}
export function applyPremiumAppearance(snapshot,doc=globalThis.document){
 const equipped=snapshot?.equipped||{};
 const body=doc?.body;
 if(!body)return;
 for(const key of Object.keys(kindNames)){
  if(equipped[key]&&allowed.get(equipped[key])===key)body.dataset['premium'+key[0].toUpperCase()+key.slice(1)]=equipped[key];
  else delete body.dataset['premium'+key[0].toUpperCase()+key.slice(1)];
 }
 const badge=doc.querySelector?.('#premium-wear-badge');
 if(badge){
  const title=displayPremiumItem(PREMIUM_ALL_ITEMS.find(x=>x.id===equipped.banner))?.name;
  badge.textContent=title?'⚑ '+title:'';
  badge.hidden=!title;
 }
}
