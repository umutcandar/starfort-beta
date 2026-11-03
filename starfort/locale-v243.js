/** STARFORT language preference. Display-only: never alters account, combat or UTC rewards. */
export const LOCALE_KEY='starfort:language-v243';
export function resolveLocale(saved,languages=[]){
 if(saved==='tr'||saved==='en')return saved;
 const first=Array.isArray(languages)?languages[0]:languages;
 return typeof first==='string'&&first.toLowerCase().startsWith('tr')?'tr':'en';
}
let active=null;
export function getLocale(){
 if(active)return active;
 let saved=null;
 try{saved=globalThis.localStorage?.getItem(LOCALE_KEY);}catch{}
 const langs=typeof window==='undefined'?['tr']:globalThis.navigator?.languages||[globalThis.navigator?.language||'en'];
 return active=resolveLocale(saved,langs);
}
export function setLocale(value){
 if(value!=='tr'&&value!=='en')return getLocale();
 active=value;
 try{globalThis.localStorage?.setItem(LOCALE_KEY,value);}catch{}
 return active;
}
const WORDS=Object.freeze({
 'gate.title':['Kendi krallığını kur','Build your kingdom'],
 'gate.subtitle':['STARFORT · ÇEVRİM İÇİ KRALLIK','STARFORT · ONLINE KINGDOM'],
 'gate.intro':['STARFORT artık yalnızca e-posta hesabıyla oynanıyor. Köyün, kahramanların, savaşların ve ödüllerin sunucu hesabında korunur.','Play with a verified email account. Your village, heroes, battles and rewards are protected on the server.'],
 'gate.email':['E-posta','Email'], 'gate.password':['Şifre','Password'],
 'gate.emailPlaceholder':['eposta@ornek.com','name@example.com'],
 'gate.passwordPlaceholder':['En az 8 karakter','At least 8 characters'],
 'gate.login':['Hesabımla giriş yap','Sign in'],
 'gate.signup':['Yeni hesap oluştur','Create account'],
 'gate.help':['Hesabın yoksa yeni hesap oluştur. E-postanı doğruladıktan sonra giriş yapabilirsin.','New player? Create an account, verify your email, then sign in.'],
 'gate.forgot':['Şifremi unuttum','Forgot password'],
 'gate.resend':['Onay e-postasını yeniden gönder','Resend confirmation email'],
 'gate.retry':['Sunucu bağlantısını yeniden dene','Retry connection'],
 'gate.other':['Farklı hesapla giriş yap','Use another account'],
 'gate.newPassword':['Yeni şifren','New password'],
 'gate.update':['Şifremi güncelle','Update password'],
 'gate.noGuest':['Misafir kayıt, deneme köyü ve tarayıcıdan kaynak kazanma özelliği bulunmaz.','Verified accounts only. No guest mode, demo village or browser-generated rewards.'],
 'gate.verifying':['Sunucu köyü, kahramanlar ve kaynaklar doğrulanıyor. Bağlantı kesildiyse yeniden dene.','Verifying your server village, heroes and resources. Retry if disconnected.'],
 'gate.recovery':['E-posta kurtarma bağlantısı doğrulandı. Aşağıya yeni şifreni yaz.','Recovery link verified. Enter a new password below.'],
 'nav.keep':['Köy','Village'], 'nav.expedition':['Seferler','Expeditions'],
 'nav.heroes':['Kahramanlar','Heroes'], 'nav.armory':['Çanta','Inventory'],
 'nav.guild':['İttifak','Alliance'], 'nav.shop':['Mağaza','Shop'],
 'nav.foot':['✦ BETA · UZUN OYUN TESTİ','✦ BETA · LONG-PLAY TEST'],
 'resource.gold':['Altın','Gold'], 'resource.wood':['Kereste','Timber'],
 'resource.stone':['Taş','Stone'], 'resource.aether':['Yıldız özü','Star essence'],
 'resource.server':['Sunucu','Server'],
 'world.title':['Yıldız Köyü','Star Village'],
 'world.subtitle':['YILDIZ VADİSİ · BÖLGE 01','STARFALL VALLEY · REGION 01'],
 'world.intro':['Kahramanların gölgesinde yükselen krallığın.','Raise a kingdom beneath the stars.'],
 'world.collect':['✦ Üretimi topla','✦ Collect production'],
 'world.production':['Kaynaklar birikiyor','Resources are accumulating'],
 'world.hint':['↻ Yatay ekranda daha geniş bir köy seni bekliyor','↻ Rotate for a wider village view'],
 'world.help':['Binaya dokunarak geliştir · Haritayı sürükleyerek gez','Tap buildings to upgrade · Drag to explore'],
 'world.daily':['GÜNLÜK ÖDÜL','DAILY REWARD'],
 'world.chest':['Sandık hazır','Chest ready'],
 'world.quest':['Sefer','Expedition'],
 'settings.title':['Hesap ve oyun ayarları','Account and game settings'],
 'settings.desc':['Kaynaklar, inşaatlar, kahramanlar, ekipmanlar ve sefer ödülleri yalnızca sunucuda tutulur. Misafir modu bulunmaz.','Resources, buildings, heroes, equipment and expedition rewards are server-only. No guest mode.'],
 'settings.back':['Köye dön','Back to village'],
 'settings.security':['HESAP GÜVENLİĞİ','ACCOUNT SECURITY'],
 'settings.email':['E-posta hesabın','Your email account'],
 'settings.verify':['Doğrulanmış hesap','Verified account'],
 'settings.emailHelp':['Oyun ilerlemen doğrulanmış hesabına bağlıdır. Yeni cihazda aynı e-postayla oturum açabilirsin.','Your progress belongs to your verified account. Sign in with the same email on another device.'],
 'settings.refresh':['Sunucudaki ilerlemeyi yenile','Refresh server progress'],
 'settings.logout':['Hesaptan çıkış yap','Sign out'],
 'settings.experience':['OYUN DENEYİMİ','GAME EXPERIENCE'],
 'settings.controls':['Kontroller','Controls'],
 'settings.controlsHelp':['Köyü sürükle ve binaları geliştir. Savaş emirleri ve ödüller çevrim içi sunucu tarafından hesaplanır.','Drag to explore the village and upgrade buildings. The server calculates battle actions and rewards.'],
 'settings.fullscreen':['Tam ekranı değiştir','Toggle fullscreen'],
 'settings.audioOn':['Ses ve özgün müzik: Açık · Kapat','Sound and music: On · Turn off'],
 'settings.audioOff':['Ses ve özgün müzik: Kapalı · Aç','Sound and music: Off · Turn on'],
 'settings.disconnected':['Bağlantın kesilirse yeni kaynak veya savaş ödülü üretilmez. Yeniden bağlandığında sunucu durumunu yenileyebilirsin.','If disconnected, you cannot earn new resources or battle rewards. Refresh your server progress when back online.'],
 'settings.language':['DİL / LANGUAGE','LANGUAGE / DİL'],
 'settings.languageHelp':['Bu cihazdaki arayüz dilini değiştir. Oyun kaydın etkilenmez.','Choose the interface language on this device. Game progress is unaffected.'],
 'auth.needEmail':['Önce e-posta adresini yaz.','Enter your email first.'],
 'auth.invalidForm':['E-posta ve en az 8 karakterli şifre yaz.','Enter an email and a password of at least 8 characters.'],
 'auth.signedIn':['E-posta hesabına giriş yapıldı.','Signed in.'],
 'auth.created':['E-posta hesabı oluşturuldu.','Account created.'],
 'auth.confirm':['Onay bağlantısı e-postana gönderildi. Onayla ve oyuna dön.','Check your inbox and confirm your email to play.'],
 'auth.reset':['Hesap varsa kurtarma e-postası gönderildi.','If the account exists, a recovery email has been sent.'],
 'auth.updated':['Şifre güncellendi.','Password updated.'],
 'auth.resent':['Onay e-postası yeniden istendi. Gelen kutunu kontrol et.','Confirmation email requested. Check your inbox.'],
 'auth.signedOut':['E-posta hesabından çıkış yapıldı. Tekrar giriş yaparak krallığına ulaşabilirsin.','Signed out. Sign in again to access your kingdom.'],
 'auth.locked':['Sunucu hesabın doğrulanmadan oyun açılmaz.','A verified server account is required to play.'],
 'audio.voiceNote':['Seslendirme tarayıcının Türkçe ses sentezine bağlıdır; profesyonel kayıt değildir.','Voice lines use browser speech synthesis, not studio recordings.']
});
export function t(key,parameters={}){
 const pair=WORDS[key],string=pair?pair[getLocale()==='en'?1:0]:key;
 return string.replace(/\{([a-zA-Z]+)\}/g,(_,field)=>String(parameters[field]??''));
}
export function formatNumber(value){
 return new Intl.NumberFormat(getLocale()==='en'?'en-US':'tr-TR',{
  notation:value>=100000?'compact':'standard',maximumFractionDigits:1}).format(value);
}
export function applyLocaleUI(doc=globalThis.document){
 if(!doc?.querySelectorAll)return;
 const language=getLocale();
 doc.documentElement.lang=language;doc.documentElement.dir='ltr';
 doc.title=language==='en'?'Starfort Beta — Star Village':'Starfort Beta — Yıldız Köyü';
 for(const el of doc.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
 for(const [attribute,property] of [['data-i18n-placeholder','placeholder'],['data-i18n-aria-label','aria-label']]){
  for(const el of doc.querySelectorAll('['+attribute+']'))el.setAttribute(property,t(el.getAttribute(attribute)));
 }
 for(const el of doc.querySelectorAll('[data-language]'))el.setAttribute('aria-pressed',String(el.dataset.language===language));
}
