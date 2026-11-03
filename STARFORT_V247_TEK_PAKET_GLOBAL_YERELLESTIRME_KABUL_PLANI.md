# STARFORT v2.47 — Tek kapsamlı global yerelleştirme paketi

**Durum: TASLAK — YAYINLANMAZ.** Tek GitHub PR: #32. Oyuncular hâlâ v2.46 GitHub Pages / v2.45 Render üzerinde olabilir. Ayrı ayrı “dil sürümü” yayımlanmayacak.

## Neden bu değişiklik?

v2.43–v2.46 arasında dil seçici 14 dil oldu, ancak 12 ek dilde çoğu hikâye, kahraman ve mod uzun metni İngilizceye düşüyordu. Bu **tam çeviri** değildir. Oyuncu 14 dil seçeneği gördüğü için hem görünür ekranların hem de hata/öykü metinlerinin seçtiği dilde olmasını bekler. Bundan sonra küçük dağıtımlar yerine bu PR içinde tek kabul kriteri uygulanacak.

## Ürün yüzeyleri — tek PR içinde tamamlanacaklar

| Yüzey | Mevcut çalışma | Global çıkış öncesi tamamlanması gereken |
|---|---|---|
| Hesap / şifre sıfırlama | v2.44'ten beri 14 dil beta | Tüm doğrulama ve sunucu hata durumlarının 14 dilde tam kontrolü |
| Navigasyon / ayarlar | v2.44 çekirdeği | Menü, ipucu, erişilebilirlik ve durum bildirimlerinin denetlenmesi |
| Köy / 7 bina / inşaat 20 seviye | v2.47: 7 bina adı ve açıklaması, 4 kaynak adı **14 dilde** | Dinamik inşaat ipuçları, kaynak hata mesajları ve görsel alt metinlerinin kalan 12 dilde denetimi |
| Kahramanlar / 9 karakter / yetenekler | **9 unvan, 9 yetenek adı, 9 uzun biyografi, 9 sayısal yetenek açıklaması ve 6 sınıf 14 dilde** | Oyun içi replikler, animasyon alt metinleri, dil editörü değerlendirmesi |
| Envanter / 19 eşya / 4 kaynak | **19 gerçek eşyanın adı ve açıklaması, 3 set, 4 kaynak 14 dilde**; 34 kontrol metni v2.46'da | Ustalık/üretim özel hata mesajları, erişilebilirlik ve gerçek cihaz testi |
| Ana hikâye 8 bölge / 24 görev | **8 bölge adı + 8 açıklama + 24 görev adı ve hedefi 14 dilde** | Sinematik seslendirme, savaş sırasında değişen görev mesajları, editör QA |
| İkinci perde 8 bölge / 24 görev | **8 bölgenin ad/konum/öykü/patronu ve 24 görevin adı/hedefi 14 dilde**; 4 kilit/güç mesajı ×14 | Dalga içi olay mesajları, patron replikleri, erişilebilirlik ve editör QA |
| Labirent / 16 kat | v2.47 taslak: 14 dil ortak etiketler, uzun metin EN | Oda, görev, çevresel olaylar ve dinamik olay metinleri |
| Günlük ödül 28 günlük döngü | v2.45: 39 anahtar ×14 | Yerel tarih biçimi, gün uzunluğu, UTC ve RTL testleri |
| Kervan pazarı / sunucu takası | v2.47 taslak: ana düğmeler 14 dil | 3 rota açıklaması, sınır ve hata mesajları |
| Cephe / ikmal / savaş sandığı | **3 doktrinin adı + yüzde açıklaması + önerisi 14 dilde**; kaynak isimleri seçilen dile dinamik uyarlanır | Savaş sandığı ve dönemsel görevlerin diğer uzun açıklamaları, özel hata metinleri |
| 30 kalıcı Komutan Kroniği rütbesi | v2.47 taslak: arayüz 14 dil, rütbe EN | 30 unvanın bütün dillerde tutarlı terminolojisi |
| Premium vitrin / 8 kozmetik / 4 ücretsiz ödül | **8 kozmetik + 4 ücretsiz sezon ödülü + 3 planlanan paketin adı ve açıklaması 14 dilde**; ödemeler kapalı | Ödeme yok uyarısı ve VIP açıklamalarında kalan İngilizce yedekler, hukukî kontrol |
| Arena 1v1 / bot / canlı eşleşme | v2.47 taslak: giriş ve bir kısım durum mesajı | Bütün bekleme/yeniden bağlantı/maç sonucu, grafik ve dokunmatik kontroller |
| Takım arena / 2v2 / 5v5 / kuşatma | v2.47: 33 takım komut/başlık etiketi **14 dilde**, maç yaşam döngüsü ve HUD EN yedekli | 12 dilde uzun açıklamalar, objektif kartları, minimap ve tüm dinamik bildirimler |
| Lonca / ittifak / parti / baskın | v2.47: 33 ittifak/üyelik/savaş odası/baskın/sohbet etiketi **14 dilde**, ekran açıklamaları EN yedekli | Sunucu kaynaklı hatalar, davet kodu akışı, yerel sıralama, tüm anlatılar |
| Sezon / haftalık yarık / görevler | Karışık Türkçe ve İngilizce | Tüm tekrar eden hedefler, sayaçlar, rütbeler ve erişilebilirlik |
| Hikâye günlüğü / dünya yazıları | Çoğunlukla Türkçe | Bölüm anlatıları, sinematikler, görev sonuçları, 14 dilde sesli anlatım (hakları uygun sesler) |
| Hata, ağ, sunucu ve güvenlik metinleri | Bazı EN yedekler | Güvenilir, oyuncuya gösterilen hata kodlarına dayalı 14 dilde açıklamalar |
| Yasal / destek / mağaza koşulları | Tam global yayına hazır değil | Ülke bazlı destek, gizlilik, ödeme açılırsa şartlar ve iade metinleri |

## v2.47'de kodlanmaya başlanan ortak yapı

- `locale-sections-v247.js`: **60 ortak ekran anahtarı ×14 gerçek dil**.
- `locale-team-v247.js`: **33 takım savaş komutu ×14**; `locale-guild-v247.js`: **33 ittifak/klan metni ×14**; `locale-training-v247.js`: **10 canlı eğitim olay bildirimi ×14**.
- `locale-world-v247.js`: **7 bina adı ve 7 açıklama + 8 bölüm adı + 4 kaynak adı ×14**.
- `locale-hero-ui-v247.js`: **9 kahraman unvanı + 9 özel yetenek adı + 6 sınıf adı ×14**.
- `locale-item-names-v247.js`: **19 gerçek ekipman + 3 set adı ×14**, ekonomik ID ve özellikler aynı.
- `tactics-view.js`, `team-view.js`, `app.js` içindeki ittifak salonu görünümü de ortak çeviri katmanlarını kullanmaya başladı.
- `labyrinth-view.js`, `kingdom-caravan.js`, `warfront-v237.js`, `premium-store.js`, `premium-catalog.js`, `commander-chronicle.js`, `arena-view.js`: çeviri erişimini oyun kurallarından ayırmaya başlayan refaktör.
- `locale-v247.test.mjs` ile birlikte `locale-team-v247.test.mjs`, `locale-guild-v247.test.mjs`, `locale-training-v247.test.mjs`, `locale-world-v247.test.mjs`, `locale-hero-ui-v247.test.mjs` ve `locale-item-names-v247.test.mjs` ayrı kapsam ve kanonik kimlik testleri yapıyor.
- `scripts/i18n-coverage.mjs`: kaynak dosyalarını tarar; yeni sözlükleri ve riskli görünür Türkçe parçalarını raporlar. `--release-check` tamamlanmadığı sürece hata vermelidir.


## 3 Kasım 2026 — birleşik sürümde yapılan ek çalışmalar

- 14 dilde doğrulanan temel sözlükler: 39 günlük ödül, 34 envanter, 60 ortak menü, 33 takım savaşı, 33 ittifak ve 10 eğitim bildirimi = **209 anahtar/dil**. Bazı anahtarlar farklı modlarda aynı anlamı paylaşır; bu sayı oyunun bütün görünür metinleri demek değildir.
- Kanonik içeriklerde ek karşılıklar: **7 bina adı + 7 açıklama + 8 bölge adı + 4 kaynak + 9 kahraman unvanı + 9 yetenek adı + 6 sınıf + 19 ekipman adı + 3 set adı**, toplam 72 içerik alanı/dil.
- Yeni sözlüklerin toplam doğrulanan alanı **281/dil**, 14 dilde 3.934 metin değeri. Bunlar tamamen yerelleştirilmiş bir oyunla eşdeğer değildir. 48 hikâye operasyonunun uzun metinleri, diğer perdeler, premium ürün anlatıları, PvP sunucu bildirimleri ve bazı erişilebilirlik ipuçları halen eksiktir.
- Gözden geçirilen dosyalarda `data-guild-action`, `data-team-order`, `data-caravan-trade`, `data-premium-action` ve kaydedilen savaş/ödül kimlikleri değiştirilmedi.
- **Kapalı tutulan yayın kriteri:** `node scripts/i18n-coverage.mjs --release-check` tüm diller ve ekranlar tamamlanana kadar başarısız olmalıdır. Normal `--check` mevcut 14 dilli sözlüklerin teknik tutarlılığını denetler.
- Ürünün tamamında kalan eski Türkçe ifadelerin sıfırlandığı henüz kanıtlanmadı. Ayrıntılı çeviri raporu hâlâ eksik ekranlar bulur.

## 3 Kasım 2026 — genişletilmiş içerik çevirileri

Bu v2.47 **taslak PR içinde**, mevcut Türkçe ve İngilizceye ek olarak diğer 12 dil için:
- Ana hikâye: **8 bölüm açıklaması, 24 görev adı ve 24 görev hedefi** (`locale-story-eu-v247.js`, `locale-story-asia-v247.js`, `locale-story-v247.js`).
- İkinci perde: **8 × bölüm adı, mekân, hikâye ve patron adı** ile **24 görev adı ve 24 hedefi**; tüm dillerde dört kilit/güç uyarısı (`locale-act2-*.js`).
- Kahramanlar: **9 tam biyografi ve 9 sayısal yetenek açıklaması**; hasar ve süre yüzdeleri sunucunun kurallarından bağımsız metinsel karşılıklardır (`locale-hero-lore-*.js`).
- Envanter: **19 eşyanın tam açıklaması** (`locale-item-lore-*.js`).
- Mağaza: **15 ürün ve ödülün adı ve açıklaması**, bunların 3'ü henüz satılmayan paketlerdir. Gerçek para ödemesi ve VIP satın alma **kapalı kalır** (`locale-premium-*.js`).
- Cephe: **3 doktrin adı, kural yüzdeleri, taktik önerisi** ve dil değişince anında güncellenen kaynak adları (`locale-warfront-v247.js`).

### Global yayın hâlâ neden engelli?
- **Sözlüklerin doğrulanması, tüm oyunun 14 dilde bittiği anlamına gelmez.** PvP sunucu hata kodları, ittifak hataları, labirent/yarık içerik olayları, gerçek zamanlı bildirimler, kronik unvanları, kervan ayrıntıları, bütün sinematik replikler ve sesler tamamlanmadı.
- Dinamik UI ve statik HTML çeviri taraması kısmi kanıt sağlar. Tüm ekranların gerçek hesapla, her dilde mobil ve masaüstü etkileşimli görüntülerinin denetlenmesi gerekir.
- Arapça RTL, Japonca/Çince/Korece satır kırılması, mobil taşmalar ve ana dili editörü kontrolü henüz tamamlanmış kabul edilmedi.
- Yeni `locale-release-v247.test.mjs`: mevcut sözlüklerin `--check` denetimini geçmesini; **global `--release-check` çalıştırmasının ise tüm eksikler tamamlanana kadar hata vermesini** zorunlu kılar.
- PR #32 taslak kalır. Sunucu, ödeme ve ekonomi kurallarına dokunulmaz. Her dilde kaynak string değiştiğinde sunucu UUID/operasyon kodu ve ödül sabit kalmalıdır.

## Tek yayın için zorunlu geçiş koşulları

1. Giriş, köy, kahraman, envanter, 8+8 hikâye, 48 görev, PvE, PvP, lonca, sezon, mağaza, kronikler ve günlük ödüllerde her dilde %100 gerekli anahtar.
2. Türkçe/İngilizce yedek kalan **oyuncuya gösterilen metin** yok; varsa ürün gereği gerekçesi testlerle belgelenmiş.
3. Oyun kimlikleri (`id`), `data-*` eylemleri, RPC adları, savaş matematiği, ödül miktarları, JWT ve UTC reset sabit.
4. Her dilde mobil düzen, etiket taşması, erişilebilirlik ve Arapça RTL doğrulanmış.
5. Resmî metinler deneyimli ana dili editörü tarafından kontrol edilmiş; otomatik çeviri tek başına yeterli kabul edilmemiş.
6. Sunucuyla gerçek oturum, 20 seviye uzun oyun, 1–3 yıldız, tekrar seferleri, günlük/haftalık ödüller, çevrim içi karşılaşma ve yeniden bağlanma testlerinden geçilmiş.
7. GitHub QA + Chromium + GitHub Pages + Render aynı **tek yayın commit SHA**'sını doğrulamış.
8. Bu PR taslaktan çıkarılıp **tek v2.47 final sürümü** olarak birleştirilecek.

**Not:** Yukarıdaki geliştirme listesi bir gelecek vaadi değil; mevcut tek paketin denetim ve yapılacak işler sınırını gösterir. Şu anda 14 dilde eksiksiz yerelleştirme tamamlanmış değildir.

## v2.47 çalışma dalı — erişilebilir sabit ekran paketi

- `locale-shell-v247.js`: 23 sabit arayüz erişilebilirlik etiketi ve açıklaması **14 dilde**. Üst menü, kaynaklar, kahraman kısayolu, harita/zoom, inşaat, sefer, günlük ödül, kayıt yedeği ve yönetim panelleri dahildir.
- `index.html`: mevcut düğme eylemlerini değiştirmeden `data-i18n-aria-label` ve `data-i18n-title` bağlandı; `applyLocaleUI` artık yerel `title` alanlarını da günceller.
- `locale-shell-v247.test.mjs`: 14 dil, Arapça RTL, erişilebilir etiketler ve değiştirilmemiş oyun eylemi alanları denetlenir.
- Bu ekleme tüm dinamik bildirimlerin veya 14 dilin insan editörü tarafından doğrulandığı anlamına **gelmez**. v2.47 taslak ve global yayın kapısı kapalıdır.

## v2.47 çalışma dalı — çok dilli hesap ve e-posta durumları

- `locale-auth-messages-v247.js`: giriş, kayıt, sıfırlama, e-posta doğrulama, SMTP kota sınırı, geçersiz adres, hatalı şifre, bağlantı kesintisi ve sunucu hesabı durumlarına ait 16 bilinen hata/bilgi anahtarı ×14 dil. Önceki onaylanmamış e-posta uyarısı yanlış başarı vaat etmeden korunur.
- `locale-v243.js`: bu mesajlar zaten kullanılan `t()` üzerinden ilgili dilde verilir; kullanıcı giriş akışına, Supabase doğrulamasına veya token saklama işlemine dokunulmadı.
- `locale-auth-messages-v247.test.mjs`: 14 dilde tüm anahtarlar ve hata kodlarından çeviri kontrol edilir. Tanınmayan sunucu hata metinleri hâlâ kaynak dillerinde gelebilir; bu alan global yayın öncesi ayrıca kapatılmalıdır.

## v2.47 çalışma dalı — hesap doğrulama ve yedekleme hata metinleri

- `account-auth.js` dosyasındaki 15 doğrudan Türkçe istisna, artık 14 dilde `auth.validation.*` anahtarlarını kullanıyor. Bunlar geçersiz hesap, yedek biçimi ve 125 KB sınırı, eski kayıt revizyonu, güvenli yönlendirme, zaman aşımına uğrayan kurtarma bağlantısı ve 8–100 karakterlik şifre uyarılarını içerir.
- Tek `locale-auth-messages-v247.js` sözlüğü böylece toplam **31 hesap durumu/validasyon anahtarını 14 dilde** içerir. JWT, güvenli yönlendirme izin listesi, oturum kontrolü, Supabase RPC ve dosya sınırları değiştirilmedi.
- Kod testleri, 14 dilde geçersiz e-posta, kısa şifre, hatalı yedek eylemi ve son kullanma tarihli bağlantının aynı mantıksal koşullarda reddedilmesini denetler.

## v2.47 çalışma dalı — ilk arayüz sözlüğünün kalan dilleri

- `locale-core-completion-v247.js`: v2.43'teki `WORDS` sözlüğünde 12 yeni dil için yalnızca İngilizceye düşen 20 arayüz alanı çevrildi. Dünya/harita yardım metinleri, sunucu ve üretim durumları, hesap/deneyim ayarları, ses, tam ekran ve profesyonel olmayan TTS uyarısı dahildir.
- `locale-v243.js` aktif dilde 20 yeni karşılığı kullanır; 41 önceki çekirdek anahtar ile 31 hesap ve yedekleme anahtarı korunur.
- `locale-core-completion-v247.test.mjs` tüm v2.43 `WORDS` anahtarlarının 14 dilde çeviri katmanı tarafından kapsandığını test eder. Bu denetim yalnızca çekirdek sözlük için geçerlidir, oyunun bütün modlarını kapsamaz.

## v2.47 çalışma dalı — 30 Komutan Kroniği rütbesi

- `locale-chronicle-v247.js`: on adet rütbe teması × üç aşama ile oluşturulan **30 unvan**, 14 dilde; 11 kronik bilgilendirme/ilerleme/ödül metni ve erişilebilirlik etiketi 14 dilde.
- `commander-chronicle.js`: 30 kanonik rütbenin kimlikleri ve adımları, `rank ** 2 * 2` zafer eşiği, altın/yıldız özü değerleri ve `data-account-chronicle` eylemleri korunur. Yalnızca görünen adlar/metinler yerelleştirilir.
- `locale-chronicle-v247.test.mjs`: 14 dil × 30 görünen unvanı, arayüz metinlerini, tamamlanma durumunu ve ekonomi değişmezliğini denetler.
- Dil editörü onayı ve tüm modların bitirilmesi sürümden önce hâlâ zorunludur.

## v2.47 çalışma dalı — 3 kervan rotasının tam yerel metinleri

- `locale-caravan-v247.js`: **3 kervan rotasının adı/açıklaması ve 10 arayüz/koşul metni 14 dilde**. Günlük hak, kalenin seviye şartı, depo dolu, kaynak yetersiz, UTC reset uyarıları kapsandı.
- `kingdom-caravan.js`: yalnızca metin sunumu değişir; `wood/stone/aether` rota kimlikleri, 2 günlük hak, `cost`, `reward`, sunucu RPC ve UTC kısıtları aynı kalır.
- `locale-caravan-v247.test.mjs`: 14 dilde tüm rota isimleri, buton durumları, 2 günlük takas sınırı, seviye ve ekonomi değişmezliği denetlenir.

## v2.47 çalışma dalı — gerçek hesapla açılan sunucu seferi

- `locale-official-ui-v247.js`: gerçek oyuncuların kullandığı `account-expedition.js` için **46 temel metin × 12 ek dil**, Türkçe/İngilizce korunarak 14-dil seçimiyle bağlandı. Giriş doğrulama, sefer başlatma, bölge/kat durumu, 1–3 yıldız sonuç başlığı, savaş turu, hasar, altı oyuncu komutu, labirent ve haftalık modların temel etiketleri dahil.
- Mevcut `local(tr,en)` çağrıları yeni sözlükten karşılığını alır; eksik uzun açıklamalar şimdilik İngilizceye düşer. Sadece mevcut seçili anahtarların tamamlığı doğrulanır, **tüm sefer ekranının tamamen yerelleştiği iddia edilmez**.
- `data-account-*` eylemleri, sunucu sonuçları ve token/ödül akışları değiştirilmedi. Kanonik olay kaydı orijinal dil ve kodla kalır.
- `locale-official-ui-v247.test.mjs` 12 sözlüğü ve gerçek hesap ekranından üretilen eylem/ödül değerlerini denetler.

## v2.47 çalışma dalı — savaş niyetleri, üç yıldız ve sonuç bildirimi

- Gerçek sunucu seferindeki **29 yeni savaş ifadesi** (4 düşman niyeti, 4 hamle tavsiyesi, tahmini 1–3 yıldız derecesi uyarısı, yetenek bekleme ve son vuruş bilgileri, yenilgi/geri çekilme) 12 ek dilde tamamlandı.
- `locale-official-ui-v247.js` artık toplam **75 temel/doğrulanmış savaş mesajı ×12 ek dil** içerir. Oturum/Türkçe ve İngilizce kuralı aynı kalır. Oyun içi ödüller ve hasar hâlâ sunucuda hesaplanır.
- Bazı uzun dünya patronu anlatımları, istemci dışı hata kodları, seslendirme ve 14 dilde ekran ekran insan QA devam eder.

## v2.47 çalışma dalı — gerçek sunucu dünya haritasının 14 dili

- `locale-realm-ui-v247.js`: gerçek oyuncu hesabındaki 8 bölge/24 yıldız/24 usta kademesi dünya haritasında kullanılan **13 görünür/erişilebilir arayüz ifadesinin 12 ek dili**. Bölge başlıkları ve hikâye isimleri mevcut yerelleştirilmiş içerik sözlüğünden gelir.
- `realm-map.js`: harita iğneleri, ekran açıklamaları ve **yeniden savaş / bölgeye saldır / usta savaşı** eylem adları seçilen dilde. `data-realm-select`, `data-realm-mission`, `data-account-veteran`, koordinatlar, yıldız sayıları, kilit mantığı değişmez.
- 14 dilde harita render'ı, 8 bölge ve eylem kimliği ile 1–3 yıldız değerleri `locale-realm-ui-v247.test.mjs` içinde doğrulanır. Bu değişiklik sunucu ekonomisini etkilemez.

## v2.47 çalışma dalı — 14 dil mobil giriş / RTL denetimi

- `reference-browser-qa.mjs`: gerçek Chromium'da **390×844 mobil ekran**, 14 dil arasında canlı geçiş, doğru `lang`/`dir`, kilitli hesap formu, sayfa yatay taşması ve hesap panelinin viewport içinde kalması denetlenir. Arapça ve Japonca ekran görüntüleri GitHub QA artifact olarak üretilir.
- `locale-v243.css`: doğrulanmış sefer, dünya haritası ve Komutan Kroniği'nde uzun yerel etiketlerin satıra sığması, Arapça yazı yönü ve sağ kenar durum çubukları, CJK satır kırılması iyileştirildi. Haritanın coğrafi pin koordinatları ve savaş sonucu değişmez.
- Bu otomasyon giriş ekranını gerçekten test eder; **14 dilde gerçek oturum içi bütün ekranların görsel kabulü yerine geçmez**.

## v2.47 çalışma dalı — doğrulanmış seferin tüm sabit etiketleri

- Kaynak kod taramasında `account-expedition.js` içinde **122 farklı doğrudan `local(tr,en)` sabit mesajı** bulundu. Önceki 75 taneye **47 eksik İngilizce yedek metnin tamamı** 12 ek dilde eklendi.
- Ayrıca 4 adet görev sayacı adı (`Expedition victory`, `Hero training`, `Equipment crafted`, `Labyrinth floor`) ve 3 kalıcı komutan unvanı yeni 12 dil karşılıklarıyla eklendi. Tek resmi sefer sözlüğü artık **129 metin ×12 ek dil**; Türkçe/İngilizce kaynaklar aynı kalır.
- `locale-official-ui-v247.test.mjs` tüm doğrudan sabit iki dilli metinleri oyun dosyasından **kaynak taramasıyla** bulur, 12 dilde eşleşmeyen anahtar varsa GitHub CI hata verir. Dinamik sunucu hata kodları, `mission.lastAction` ve gömülü başka modlarda `local()` dışı kurulan cümleler ayrıca incelenmelidir.
- Hesap kilidi, savaş/ödül otoritesi, kimlikler ve ekonomi değişmez. Global tek sürüm hâlâ QA incelemesi bekler.

## v2.47 bütünleşik mağaza yerelleştirmesi

- `locale-premium-store-native-v247.js` 18 mağaza arayüzü ve ödeme yapılmadığını belirten açıklamaları 12 ek dilde kapsar. `locale-unified-v247.js` üzerinden gerçek sunucu mağaza ekranına bağlandı.
- Premium ödeme ve fiyatlandırma aktif edilmedi. `locale-premium-store-native-v247.test.mjs` gerçek görünümü ve 14 dil sözlüğünü denetler.

## v2.47 birleşik Cephe Karargâhı yerelleştirmesi

- 25 sabit ikmal/ganimet/tekrar seferi mesajı ve bunların 12 ek dildeki karşılıkları `locale-warfront-native-v247.js` ile tamamlandı. Sunucu baskın kazanımları ve ikmal maliyetleri aynı kaldı.

## v2.47 — 91/91 bina yükseltme metni, 14 dil

- `locale-building-native-v247.js` ve `locale-building-advanced-v247.js` gerçek `building-workshop.js` içindeki 91 farklı sabit iki dilli ifadeyi 12 ek dilde karşılar; Türkçe/İngilizce korunur. İnşaat süreleri, malzeme eksikleri, 20 seviye, ustalık mimarisi, sunucu yetkisi ve yıldız koşulları dahildir.
- `locale-unified-v247.js` sözlüğe bağlanır; inşaat ekonomisine ve sunucu eylem adlarına dokunulmaz. `locale-building-native-v247.test.mjs` kaynak koddan birebir 91 ifadeyi tarayarak çeviri kapsamını doğrular.

## Tek paket v2.47 — doğrulanmış hedef koçunun 14 dilde tamamı

- Ana sefer ekranında yalnızca Türkçe kalmış `official-progress-coach.js` aşaması 18 kararlı hedef kimliği için **başlık/açıklama/eylem** olmak üzere toplam 54 UI alanını 12 ek dil + İngilizce destekleyecek şekilde bağlandı. Türkçe kanonik metin korunur.
- Dinamik metinler, `stage`, `chapter`, `rank`, `current/required`, `stars`, `medals` gibi değişkenleri sunucu tarafından doğrulanmış mevcut görünümden alır. Görev/ödül kuralları, ekonomi ve buton `data-view` değerleri etkilenmez.
- HTML escaping ve çok dilli yer değiştirme `locale-goals-v247.test.mjs` ile güvence altında tutulur.
