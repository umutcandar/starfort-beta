/** Server-backed premium wardrobe and free season path. Never store purchase state in a browser save. */
import {SUPABASE_URL,SUPABASE_KEY} from './online-config.js';
import {freshAccountSession} from './account-auth.js';
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
 if(loading||!data)return '<section class="premium-live"><h3>Yıldız Hazinesi</h3><p>Sunucuya bağlı mağaza hesabı doğrulanıyor.</p><button class="secondary" data-premium-refresh>Mağazayı yenile</button></section>';
 const owned=new Set(data.owned),season=data.season;
 const itemRows=PREMIUM_COSMETICS.map(o=>{
  const has=owned.has(o.id),active=data.equipped[o.kind]===o.id,afford=data.crystals>=o.price;
  return `<article class="premium-live-item ${active?'equipped':''}">
   <div class="premium-live-icon" aria-hidden="true">${({castle:'♜',cape:'♟',banner:'⚑',victory:'✦'})[o.kind]}</div>
   <span class="eyebrow">${kindNames[o.kind]} · ${o.price} ✦</span><h4>${esc(o.name)}</h4><p>${esc(o.detail)}</p>
   <button class="${active?'secondary':has||afford?'primary':'secondary'}"
    data-premium-action="${active?'unequip':has?'equip':'purchase'}"
    data-premium-item="${active?o.kind:o.id}" ${busy||!has&&!afford?'disabled':''}>${active?'Kuşanımı kaldır':has?'Kuşan':'✦ '+o.price+' Kristal'}</button>
   </article>`;
 }).join('');
 const free=FREE_SEASON.map(o=>{
  const claimed=season.freeClaims.includes(o.id),has=owned.has(o.item),active=data.equipped[o.kind]===o.item,
    earned=season.wins>=o.wins;
  return `<article class="premium-season-tier ${claimed?'claimed':''}"><span class="premium-season-count">${o.wins} ZAFER</span>
    <strong>${esc(o.name)}</strong><small>${claimed?'✓ Kazanıldı':season.wins+' / '+o.wins+' zafer'}</small>
    <button class="${earned&&!claimed||claimed&&!active?'primary':'secondary'}"
     data-premium-action="${!claimed?'claim':active?'unequip':'equip'}"
     data-premium-item="${!claimed?o.id:active?o.kind:o.item}"
     ${busy||!earned&&!claimed?'disabled':''}>${!claimed?'Ödülü al':active?'Çıkar':has?'Kuşan':'Alındı'}</button></article>`;
 }).join('');
 const ownedNames=data.owned.map(id=>PREMIUM_ALL_ITEMS.find(x=>x.id===id)?.name||id);
 return `<section class="premium-live" aria-label="Hesaba bağlı mağaza">
  <header class="premium-live-head"><div><span class="eyebrow">STARFORT · SUNUCU KONTROLLÜ MAĞAZA</span><h3>✦ Yıldız Hazinesi</h3>
  <p>Kalıcı kozmetik sahipliği; saldırı, PvP gücü veya inşaat süresi değiştirmez.</p></div>
  <div class="premium-wallet"><strong>${data.crystals.toLocaleString('tr-TR')} ✦</strong><small>Yıldız Kristali</small><small>${data.owned.length} görünüm</small></div></header>
  <div class="premium-payment-lock"><b>Gerçek para ödemeleri henüz kapalı</b><p>Kristal paketleri, VIP ve premium sezon bileti hazırlanıyor. Ödeme sağlayıcısı bağlanmadan bakiye yüklenmez, para çekilmez.</p></div>
  <div class="premium-packages">${CRYSTAL_PACKS.map(o=>`<div><strong>${esc(o.name)}</strong><span>${o.crystals} ✦</span><button disabled class="secondary">Yakında</button></div>`).join('')}
    <div><strong>VIP · 30 gün</strong><span>Özel hesap çerçevesi</span><button disabled class="secondary">Yakında</button></div>
    <div><strong>Sezon Bileti</strong><span>Premium kozmetik yolu</span><button disabled class="secondary">Yakında</button></div></div>
  <div class="premium-live-subhead"><h3>Görünüm Koleksiyonu</h3><p>Kristal bakiyesi yalnızca doğrulanmış ödeme ile oluşabilir. Eşyalar bir kez alınır ve hesabında kalır.</p></div>
  <div class="premium-live-grid">${itemRows}</div>
  <section class="premium-season"><div class="premium-season-head"><div><span class="eyebrow">AYLIK YOLCULUK · ÜCRETSİZ İLERLEME</span>
  <h3>${esc(season.month)} · Sezon Yolu</h3><p>Bu sezonda ilk kez mağazaya girdiğinden beri kaydedilen doğrulanmış savaş galibiyetleri sayılır. Günlük giriş zorunluluğu yoktur.</p></div>
  <strong>${season.wins} <small>ZAFER</small></strong></div>
  <div class="premium-season-grid">${free}</div>
  <p class="premium-payment-lock">Premium ödül yolu ödeme sistemi açılana kadar kilitli. Ücretsiz ödüller için kristal gerekmez.</p></section>
  <p class="premium-owned"><b>Sahip olduğun görünümler:</b> ${ownedNames.length?ownedNames.map(esc).join(' · '):'Henüz yok'}</p>
  <button class="secondary" data-premium-refresh ${busy?'disabled':''}>Sunucu envanterini yenile</button></section>`;
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
  const title=PREMIUM_ALL_ITEMS.find(x=>x.id===equipped.banner)?.name;
  badge.textContent=title?'⚑ '+title:'';
  badge.hidden=!title;
 }
}
