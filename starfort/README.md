# STARFORT v2.7.0 — Taktik savaş arayüzü ve güvenilirlik (ara sürüm)

Bu sürüm v2.6.0'ın şehir, kahraman, kaynak, PvE, klan ve sunucu tabanlı savaş sistemlerini korur. **Oyun hâlâ bir geliştirme prototipidir; gerçek 3B/AAA grafik hedefi tamamlanmadı.**

- **Canlı hedef rehberi** (`battle-director.js`): Sunucu verisiyle kuşatmacıya koçbaşına eskort, kapıya saldırı ve çekirdeği ele geçirme; savunmacıya koçbaşını durdurma ve iç kale savunması; sancak moduna bölge kontrol bilgisi verilir. Ölü oyuncuya yeniden doğma zamanı görünür. Bu arayüz oyunun hasar/zafer kurallarını değiştirmez.
- **Mini harita aç/kapat**: Savaş HUD'unda Harita butonu, masaüstünde `M`. Oyuncu tercihi aynı tarayıcı/port için saklanır. Yatay mobilde harita istenirse gizlenebilir.
- **Savaş süresi ve skor**: Önceki grafik CSS'sinin aktif savaşta gizlediği takım skor/süre HUD'u tekrar görünür; 667×375 telefonda üst kısma sığacak şekilde küçültülür.
- **Güvenilir saldırı girdisi**: Ağ isteği başarısız olduğunda takım savaşındaki tek tıklık saldırı komutu tekrar denemeye alınır. Daha önce atılma/yıldız darbesi için bulunan koruma genişletilmiştir.
- **Mobil yatay düzen**: Hedef kartı sol üstte, sağ üstte mini harita; 667×375, 844×390 ve 932×430 ölçülerinde düzen çakışmaları kontrol edildi.

Kontroller: WASD yön, J saldırı, Q yıldız darbesi, Space atılma, 1–4 birlik emri, 5–7 birlik seçimi, **M mini harita**. Dokunmatik kullanımda karşılıkları ekranda bulunur.

Başlatma: Node.js 20+; Mac'te `BAŞLAT.command`, Windows'ta `BASLAT.bat` veya `npm start`. İlk port 8897, doluysa başlatıcı sıradaki boş portu dener. Kaydedilen köy ilerlemesi tarayıcı portuna bağlıdır; eski porttan kayıt yedeği alın.

Test/eksikler: `npm run qa:all` ve `KALITE_KONTROL_V2_6_1.md`. Otomatik başarı gerçek telefon FPS/çevrim içi uzak sunucu/AAA görsel kalite kanıtı değildir. Aynı geliştirme sunucusunu kimlik doğrulaması, güvenlik ve ölçek testleri olmadan herkese açmayın.

---

# Starfort v2.6.0 — Savaş görünürlüğü ve hedefleme düzeltmeleri (geliştirme sürümü)

## v2.6.0 güncellemesi

- Klan kuşatmasında arka plana daha okunur ve **içinde önceden çizilmiş asker/koçbaşı bulunmayan** savaş alanı eklendi (`assets/battlefield-live.webp`).
- Kale kapısı ve koçbaşı artık statik resme bağlı değil; sunucudaki can ve konum verilerinden bağımsız sahne nesneleri olarak çiziliyor. Kapı için dört yıkım aşaması var.
- Kahramanı takip eden 2.5B kamera ile dokunmatik rakip seçimi arasında ölçek uyuşmazlığı düzeltildi.
- 2v2/5v5 takım savaşlarına oyuncuları, birlikleri, koçbaşını, kapıyı ve çekirdeği gösteren küçük **canlı taktik harita** eklendi.
- Yeni grafikler hâlâ **geliştirme/prototip** seviyesinde. Sanat yönü konsept görselleriyle aynı kalitede değil. Gerçek fiziksel telefon 3B GPU/FPS testi tamamlanmadı.



**Yeni:** 2v2, 5v5 ve klan kuşatmasında askerler artık **Tümü / Öncü / Okçular** olarak seçilebilir. Komut panelinden verilen Takip / İlerle / Savun / Odaklan emri yalnızca seçilen birliklere uygulanır. Kısayollar: `5` tümü, `6` öncü, `7` okçular; `1–4` birlik emri. Emirler sunucuda doğrulanır; oyuncu yalnızca kendi birliklerine emir verebilir. Seçilen birlikler savaş alanında altın renkli çemberle işaretlenir (2.5B modunda).

Sürüm, köy, kahraman, ekipman, hikâye savaşları, bot 1v1 / 2v2 / 5v5 / kuşatma ve mevcut çok oyunculu savaşları korur. Grafik motoru hâlâ geliştirme seviyesindedir; fiziksel telefon FPS ve profesyonel 3B animasyon kalitesi **doğrulanmamıştır**.

**Çalıştırma:** Node.js 20+, `BAŞLAT.command` (Mac) / `BASLAT.bat` (Windows), ya da `node launch-starfort.mjs`. Başlangıç portu `8897`; port doluysa Terminal'de gösterilen adresi kullan. **Test:** `npm run qa:all`.

---

# STARFORT v2.5.4 – Bot eğitimi ve savaş okunabilirliği (geliştirme sürümü)

Bu sürüm, v2.5.3 kalite kontrol paketinin üzerine kurulmuştur. 1v1 ile takım/kuşatma bot antrenmanlarında **Kolay / Normal / Zor** bot kararı seçimi eklendi. Bu seçenek oyuncunun kaynak, güç veya maç ödüllerini değiştirmez; yalnızca botun hareket ve beceri kullanma davranışını etkiler. Bot zorluk seçimi hem takım hem bireysel savaş arayüzlerinde bulunur. 1v1 savaşının üzerine oyuncu/rakip can göstergeleri ve geri sayım eklendi. Sunucu bot zorluğunu doğrular ve maç sonucunu sunucu hesaplar.

Başlatma: ZIP'i çıkar, Mac'te `BAŞLAT.command`, Windows'ta `BASLAT.bat`, ya da klasörde `node launch-starfort.mjs`. Başlangıç portu **8897**, doluysa Terminal'de yazan başka port kullanılır. `http://127.0.0.1:8897/starfort/` adresini açıp **Seferler** altındaki savaş modlarını dene. Eski porttaki tarayıcı kayıtlarının yeni portta görünmemesi normaldir; ayarlardan önce yedek alıp içe aktar.

Kalite kontrol: `npm run qa:all`. Fiziksel telefon performansı, gerçek WebGL2 GPU görüntüsü ve İnternet üzerinden geniş ölçekli savaş testi **henüz doğrulanmamıştır**. Deneysel 3B karakterler hâlâ profesyonel kalitede değil; sinematik 2.5B görünüm varsayılandır.

---

# Starfort v2.5.1 – Yeni portlu başlatıcı (8877)

**Yeni oyun adresi:** `http://127.0.0.1:8877/starfort/`. `BAŞLAT.command` (Mac) veya `BASLAT.bat` (Windows) artık portu otomatik seçer, sunucu açılınca doğru adresi tarayıcıya gönderir. 8877 doluysa 8878, 8879... denenir; gerçek adres Terminal ekranında yazdırılır. 8767'de çalışan eski sunucuyla karışmaz.

**Kaydın önemli:** 8767 ve 8877 farklı tarayıcı depolama alanlarıdır. Önce 8767'deki eski oyun → **Ayarlar → Kayıt dosyasını indir**. Sonra yeni oyunda **Ayarlar → Yedeği geri yükle**. Klan hesaplarının sunucu verileri eski klasördeki `.local-data` içerisinde olabilir; farklı ZIP klasörlerine otomatik taşınmaz. Yeni oyundaki boş kayıt eski kayıtların silindiği anlamına gelmez.

**Mac güvenlik uyarısı:** Dosyanın kaynağından eminsen Terminal'de oyun klasörüne geçip `node launch-starfort.mjs` çalıştırabilirsin.

---

# STARFORT v2.5 — GLB Mimari Varlık Altyapısı ve 3B Hedefleme Düzeltmesi (Geliştirme Sürümü)

**Oyun bitmedi.** 3B motora ilk gerçek `.glb` dış model yükleme sistemi eklendi. Kuşatma kale kapısının dekoratif 3B mimari parçası `assets/models/siege-gatehouse.glb` dosyasından, bağımsız üçgenler ve malzeme renkleriyle okunuyor. Kaledeki dinamik kapı HP hesabı sunucuda korunuyor; model yüklenemezse kodla üretilen mimari yedek kalıyor.

- `graphics-gltf.js`: yerel GLB v2, node hiyerarşisi, temel renk materyalleri, indexed/stride mesh, LINEAR/STEP node animasyonlarını okuma; **skin ve PBR dokular henüz yoktur**.
- `battle-render-adapter.js`: mobil yatay 5v5'te 3B dokunmatik hedeflemenin 10× koordinat uyumsuzluğu giderildi.
- `graphics-3d-preview.html` GLB varlık durumunu da gösterir. Ana oyundaki mevcut 3B deneysel modu ve 2.5B yedeği korunur.
- **Kalite kontrol:** `npm run qa:all`, 150/150 otomatik test başarılı. GPU ve gerçek telefon FPS testi henüz yapılamadı. Ayrıntılar `KALITE_KONTROL_V2_5.md`.
- **Çalıştırma:** Node.js 20+, `BAŞLAT.command` veya `BASLAT.bat`; oyun `http://127.0.0.1:8877/starfort/`, 3B deneme `http://127.0.0.1:8877/starfort/graphics-3d-preview.html`.

Bu küçük stilize GLB geliştirme modeli tek başına sinematik kalite sağlamaz. Profesyonel rigged karakterler, GPU skinning, PBR materyal, gölge ve GPU/telefon optimizasyonu bir sonraki grafik üretim aşamalarıdır.

---

# STARFORT v2.4 — Eklemli 3B Karakterler ve Mobil Kamera (Geliştirme Sürümü)

**Bitmiş oyun değildir.** WebGL2 gerçek 3B sahnenin üzerine prosedürel eklemli karakter hareketleri, kahramanı takip eden kamera, dokunmatik hedefleme eşleştirmesi ve adaptif çizim çözünürlüğü eklendi. Hasar, hareket ve oyun ekonomisi hesapları sunucuda kalıyor.

**Çalıştırma:** Node.js 20+ ile Mac’te `BAŞLAT.command`, Windows’ta `BASLAT.bat`, ya da terminalden `npm start`. Oyun: `http://127.0.0.1:8877/starfort/`. 3B grafik laboratuvarı: `http://127.0.0.1:8877/starfort/graphics-3d-preview.html`. Laboratuvar gerçek oyuncu maçı değildir.

**Kontrol:** `npm run qa:all`; ayrıntılar `KALITE_KONTROL_V2_4.md`. Gerçek GPU WebGL2 ve fiziksel mobil telefon performansı bu çalışma ortamında doğrulanmadı. Mevcut 3B karakterler profesyonel varlıklar yerine düşük poligonlu kodla üretilmiş modellerdir.

---

# STARFORT v2.3 — Gerçek 3B Grafik Çekirdeği (Deneysel)

**Bu sürüm bitmiş bir oyun veya AAA grafik paketi değildir.** v2.2'nin üzerine yeni gerçek perspektifli **WebGL2 3B geometri** altyapısı eklenmiştir. Karakterler henüz profesyonel 3B model dosyaları veya kemik animasyonları kullanmaz: zırh, gövde, kol, bacak, miğfer ve kuşatma makineleri düşük poligonlu, kodla üretilen 3B parçalardır. Gerçekçi modelleme, materyal, özel animasyon ve GPU optimizasyonu daha fazla geliştirme ister.

## Nasıl çalıştırılır?

1. Node.js 20+ kurulu olmalı.
2. Mac: `BAŞLAT.command` / Windows: `BASLAT.bat` veya `npm start`.
3. `http://127.0.0.1:8877/starfort/` adresinden oyunu aç.
4. **Seferler** bölümünde 1v1, 2v2, 5v5 veya Kuşatma aç; üstte **Grafik Motoru → Gerçek 3B (deneysel)** seç. Canlı yatay maç HUD'unda ◈ 3B / ▧ 2.5B düğmesiyle motor değiştir.
5. Oyuncu hesabı ve başka oyuncular olmadan 3B grafiğe bakmak için **`http://127.0.0.1:8877/starfort/graphics-3d-preview.html`** adresini aç. Bu sahne *gerçek oyunculu maç değildir*.

## Bu turda gerçek kod değişiklikleri

- `graphics-3d.js`: WebGL2 vertex+fragment shader, perspektif kamera, derinlik tamponu, normal tabanlı basit ışık, sis, 3B zemin, taş kuleler, surlar, kapının dört hasar durumu, kale çekirdeği, üç boyutlu koçbaşı ve parçalı birim figürleri.
- `graphics-3d-math.js`: Sunucunun 100×60 savaş koordinatlarını 3B dünya koordinatlarına dönüştürme, kamera projeksiyonu, dokunmatik hedef ışını/zemin kesişimi.
- 3B sahnede **sabit çevre geometrisi önbelleğe alınıyor**; her animasyon karesinde yeniden GPU'ya gönderilmiyor. Kapının hasar seviyesi ya da grafik profili değişirse tekrar oluşturulur.
- 1v1 ve 2v2/5v5/klan kuşatmasında çizim motoru seçimi; GPU desteklemezse mevcut 2.5B/Canvas yedeği çalışır. Oyun içi sunucu kuralları, hasar, kaynaklar, ekonomi, kayıt biçimi ve klan oturumları değiştirilmedi.
- `graphics-3d-preview.html` bağımsız 3B deneme sahnesi; kale kapısını zayıflatma, kalite değiştirme, hareketi durdurma kontrolü.
- Üç grafik kalite profili korunur: Ultra / Dengeli / Performans. Varsayılan grafik motoru 3B'dir; tarayıcı WebGL2 desteklemiyorsa otomatik 2.5B yedeğine geçer.

## Test kapsamı ve önemli sınırlamalar

- `npm run qa:all`: **134/134 otomatik test başarılı**. Yeni testler matematiksel kamera/projeksiyon, zemine doğru hedefleme, 3B cihaz yedeği, sahne çizim çağrıları ve statik geometri GPU önbelleğini kapsar.
- HTTP sunucusunda yeni HTML ve JavaScript dosyalarının 200 ile sunulduğu doğrulandı.
- **Bu geliştirme ortamında Chromium WebGL2 bağlamı açmadı.** Bu nedenle yeni 3B shader'ların gerçek GPU görüntüsü, fiziksel Android/iPhone kare hızı, sıcaklık, bellek ve gerçek çevrim içi savaşın 3B uçtan uca testi **henüz doğrulanmadı**. Otomatik 3B çizim testi API taklidiyle (mock) yapıldı; gerçek GPU testi değildir.
- Kaliteli gerçek 3B içerik için profesyonel mesh/texture, skeletal animation, PBR malzemeleri, LOD, gölge ve güçlü mobil profil ayarlarına hâlâ ihtiyaç var. Şu an yalnızca çalışan 3B altyapının ilk aşaması hazır.
- Sunucu yerel geliştirme sunucusudur; güvenlik ve ölçeklenebilirlik testleri olmadan halka açık internete sunmayın.

---

# Starfort v2.2 — 2.5B Karakter Atlasları (Geliştirme Sürümü)

Yeni sürümde 6 karakterin (Şafak/Gece) 6 farklı hareket durumunu içeren toplam 216 görsel animasyon karesi oyunun grafik motoruna bağlandı. **Gerçek 3B model/kemik rig sistemi henüz yoktur.** Görsel atlaslar yalnızca animasyon katmanını geliştirir; çevrim içi savaş kurallarını değiştirmez. Yatay telefonda Ultra/Dengeli/Performans grafik ayarları korunur.

İlk oynatmada animasyon sayfalarının yüklenmesi kısa süre alabilir; bu sırada eski figürler kullanılır. Performans modunda büyük animasyon atlasları bellekten çıkarılır. İçerik ve QA: `KALITE_KONTROL_V2_2.md`. Grafik laboratuvarı: `http://127.0.0.1:8877/starfort/graphics-v2-preview.html` (gerçek maç değil).

---

# STARFORT v2.1 — Kuşatma görüntüsü ve yatay mobil geliştirmesi (ara sürüm)

**Hedef grafiğe henüz ulaşılmadı.** v2.1, v2.0 temelini korurken savaş ekranının gerçek görüntüsü üzerinde yapılan bir geliştirme turudur. Gerçek 3B / AAA oyun iddiası yoktur.

## Bu turda yapılanlar

- **Gerçek dünya/ekran perspektifi:** sunucunun x/y koordinatları korunurken birimler zemine projekte edilir; önceki sürümde gökyüzünde yüzme etkisi azaltıldı. Ters projeksiyon hedef seçimini eşler.
- **Daha ayrıntılı kale kapısı:** fotoğraf dokusu ile üretilmiş dört kapı hasar varlığı (`assets/siege-gate-0.webp` … `3.webp`) ve kapı yıkıldığında açık geçit / moloz. Özgün Starfort görselleri kullanılarak türetildi. Bunlar gerçek zamanlı 3B geometri değildir.
- **Animasyon katmanı (`graphics-animation-v3.js`):** yürüme, saldırı, büyü ve darbe için sunucu simülasyonunu değiştirmeyen görsel durumlar; koşu salınımı, vuruş izi ve animasyon azaltma tercihi.
- **Kuşatma efektleri:** koçbaşının ilerleme tozu; kapı hasarı, kırık parçalar, saldırı izi, toz ve ışık; Ultra/Dengeli/Performans bütçeleri.
- **Yatay ekran:** canlı savaşlarda `object-fit:cover`, ekranın dolması ve kırpılan alanlar için doğru dokunmatik hedef koordinatları. Sınır dışı dokunmalar seçime dönüşmez.
- Şehir, kahraman, kaynak ekonomisi, PvE ve sunucu tabanlı 1v1, 2v2, 5v5, klan ve kuşatma hesapları aynı bırakıldı.

## Test ve sınırlar

`npm run qa:all` ile otomatik oyun/sunucu testlerini tekrar çalıştır. Tarayıcıdaki WebGL2 bu geliştirme ortamında kullanılamadığından yapılan grafik denemeleri **Canvas2D yedeği** ile görüntülendi; mobil fiziksel cihaz FPS testi henüz yoktur. Test edilen in-memory demo, **canlı çevrim içi maç değildir**. Bilinen görsel kalite farkı devam ediyor: tek kareli figürleri gerçek animasyonlu 3B/2.5B karakterle değiştirmek, modellerin ışıklandırmasını ve tutarlı oyun sahnesini tasarlamak gerekiyor.

## Çalıştırma

Node.js 20+ ile ZIP çıkarıldıktan sonra Mac'te `BAŞLAT.command`, Windows'ta `BASLAT.bat`, ya da `npm start`. Açılış: `http://127.0.0.1:8877/starfort/`. Laboratuvar: `/starfort/graphics-v2-preview.html`. Çok oyunculu sunucuyu kimlik doğrulaması, TLS ve güvenlik kontrolleri olmadan internete açmayın.

---

# STARFORT v2 — Graphics Core (geliştirme sürümü)

**Bu henüz tamamlanmış yüksek kaliteye sahip ticari oyun değildir.** Yeni sürüm v1.9 üzerine teknik render mimarisi ekler: varsayılan WebGL2, cihaz desteklemiyorsa aynı sahneyi çizen Canvas2D-v2; eski sunucu ve şehir kuralları korunur.

## Yeni grafik altyapısı

- `graphics-core-v2.js`: WebGL2 shader, GPU doku/yığın çizimi, kamera projeksiyonu ve kalite profilleri; Canvas2D yedek çekirdek.
- `graphics-scene-v2.js`: paylaşımlı savaş sahnesi; çevre, kahraman, birlik, ışık/parçacık, koçbaşı, kapı hasar aşamaları.
- `battle-render-adapter.js`: 1v1 ve takım/kuşatma arayüzlerini aynı motora bağlar.
- `graphics-v2-preview.html`: gerçek sunucu gerektirmeyen **laboratuvar önizlemesi** (canlı maç değil).
- `graphics-v2.css`: yatay mobil görünümü esnetmeden korur.

Şu an karakter sprite'ları tek kareli çizimlerden geliyor, gerçek 3B/kemik animasyonu değildir. Ultra kalite hedefi için profesyonel içerik/animasyon ve fiziksel cihaz testleri hâlâ gerekiyor.

## Başlatma

Node.js 20+ ile Mac: `BAŞLAT.command`; Windows: `BASLAT.bat`; terminal: `npm start`.
Oyun: **http://127.0.0.1:8877/starfort/**
Teknik demo: **http://127.0.0.1:8877/starfort/graphics-v2-preview.html**

Çevrim içi klan ve maçlar yerel Node sunucusunda çalışır. Sunucuyu kimlik doğrulaması, TLS, rate-limit ve yük testi tamamlanmadan internete açık hâle getirmeyin.

## Kalite kontrol

`npm run qa:all` — ayrıntılı sonuçlar `KALITE_KONTROL_V2.md`. Bu sürümde **118 otomatik test** bulunuyor. Bu test sayısı yüksek grafik kalitesinin kanıtı değildir.

## Önceki özellikler

# STARFORT v1.9 — Görsel kalite iyileştirme (ARA SÜRÜM)

**Bu bir final sürüm değil.** v1.8 üzerine geliştirilmiştir. Oyunun mevcut şehir, kayıt, birlik ve çok oyunculu savaş mantığı korunur.

## v1.9'da yapılanlar

- Kale kuşatması ekranına yeni sinematik konsept afişi eklendi; bu **gerçek oynanış görüntüsü değildir**.
- Canlı Canvas savaş motorunda prototip görünümlü dikdörtgen zemin çerçevesi kaldırıldı; atmosfer, gölge ve kompozisyon sadeleştirildi.
- Kuşatma duvarı / kapı tasarımı daha detaylı taş örgüsü, ahşap geçit ve meşale katmanlarıyla yenilendi.
- Beşer oyunculu savaşta tüm isim etiketleri yerine sadece kendi kahramanın ve seçili düşmanın ismi gösteriliyor.
- Kapı, kristal, koçbaşı göstergeleri daha küçük ve daha tutarlı oldu; sunucuya bağlı can bilgileri değişmedi.

## Henüz çözülmeyen büyük kalite farkı

Geliştirilmiş 2B motor, hedeflenen sinematik konseptteki 3B/AAA hareket, çevre derinliği ve çoklu karakter animasyonu seviyesinde değildir. Bu kalite için gerçek zamanlı 3B grafik motoru, profesyonel karakter animasyonları, shader/ışık sistemi ve mobil cihaz üzerinde yük testleri gerekir. Yeni sinematik afişi canlı maç ekranı sanmayın.

## Test

`npm run qa:all` — sunucu, oyun kuralları, entegrasyon ve sözdizimi testleri.

## Çalıştırma

Node.js 20+ kurulu bilgisayarda `BAŞLAT.command` (Mac) ya da `BASLAT.bat` (Windows) ile; veya `npm start` çalıştırıp `http://127.0.0.1:8877/starfort/` adresini açın. Klan ve çok oyunculu maçlar için aynı sunucuya erişen farklı kullanıcı hesapları gerekir.

# STARFORT v1.8 — Kuşatma Koçbaşı ve Yıkım Efektleri

**Geliştirme prototipi, final sürüm değil.** v1.8, önceki v1.7'nin üzerine inşa edildi; kaynak ve şehir ilerlemesi biçimi değişmedi. Başlatma adımları, cihaz gereksinimleri ve canlı servis sınırlamaları aşağıdaki v1.7 açıklamalarında da geçerlidir.

## v1.8'de yenilikler

- **Eskortlu kuşatma koçbaşı**: 5v5 kale kuşatmasında saldıran oyunculardan en az biri koçbaşına yaklaşırsa koçbaşı hareket eder. Kale kapısına gelince 2,4 saniyelik sunucu bekleme süresiyle ağır darbe vurur; yalnız bırakılırsa durur. `İlerle` ordu komutunu kullanmak faydalıdır, fakat kahraman eskortu gereklidir.
- **Savunma karşı hamlesi**: Savunan kahramanlar ve askerler, menzile girdiklerinde koçbaşını hedef alıp durdurabilir. Yok edilen koçbaşı 19 saniye sonra başlangıç noktasında yeniden oluşturulur. Kazanma hedefi (kapı → çekirdek) aynı kalır.
- **Daha ayrıntılı 2B savaş görüntüsü**: Ağaç ve demir katmanlı kuşatma makinesi, hareketli tekerlekler, koçbaşı başlığı, sancak, vuruş/parçalanma parçacıkları, daha net sağlık göstergesi ve ağır darbede kamera vurgusu.
- **Sunucu doğrulaması**: Koçbaşı konumu, canlılığı, kapı hasarı ve tekrar doğma zamanı sadece sunucuda hesaplanır. İstemcinin çizimi bu sayıları değiştiremez. Savaş ekranında koçbaşının durumu ve canı görünür.
- **Yatay mobil hedefi korunuyor**: 667×375, 844×390, 932×430 yatay ekranlarda dokunmatik joystick ve savaş butonu yerleşimleri kontrol edildi. Dikey ekranda yatay oynama önerisi var.
- v1.7 ve önceki **1v1, 2v2, 5v5, klan eşleşmesi, kuşatma, şehir ve PvE** sistemleri korunmuştur.

## v1.8 kalite durumu

- `npm run qa:all`: **114/114 başarılı**. Yeni koçbaşı eskortu, sunucu vuruş bekleme süresi, savunmacı hasarı, yıkım, yeniden doğuş, kamera tepkisi ve önceki özelliklerin korunması test edildi.
- Chromium `set_content` ile gerçek Canvas/WebP render kontrolü ve statik yatay HUD kontrolü yapıldı. Ayrıca oyun modülleri gömülerek şehir/kahraman/sefer/klan arayüzü açılışına smoke test uygulandı.
- Yine de gerçek çok oyunculu maçın fiziksel telefonlar üzerinde uçtan uca test edildiği, tam 60 FPS sağlandığı veya AAA 3B kaliteye ulaşıldığı iddia edilmez. İnternete açık sunucu olarak yayınlamadan önce ciddi güvenlik, yük, gecikme ve cihaz testleri gerekir.

## Kuşatmada deneme

Seferler bölümünden Kuşatma 5v5 seç. Başlatılan maçta saldıran takımın en az bir kahramanı koçbaşının yanında durarak onu kapıya götürmeli. Savunmacılar koçbaşını vurarak yıkabilir. Takım savaşı için aynı yerel Node.js sunucusunda 10 ayrı komutan hesabı gerekir.

---

# STARFORT v1.7 — Önceki ultra savaş güncellemesi

**Oynanabilir yerel geliştirme sürümü.** Starfort, tarayıcı tabanlı kale geliştirme/RPG oyunudur. v1.7; önceki şehir, kahraman, PvE, 1v1, 2v2/5v5 takım savaşları, klan özellikleri ve sinematik 2B kuşatmayı korurken **Ultra/Dengeli/Performans** görselliği, akıcı karakter animasyonlarını ve yatay telefon savaş HUD’unu geliştirir. Bu sürüm ticari veya internete açık bir canlı servis değildir.

## Başlatma

- **Mac:** Node.js 20+ kurulu olmalı. `BAŞLAT.command` dosyasını çift tıkla; macOS engellerse Terminal'de `bash BAŞLAT.command` çalıştır.
- **Windows:** Node.js 20+ kurulu olmalı. `BASLAT.bat` dosyasını çalıştır.
- **Terminal:** `npm start`, ardından `http://127.0.0.1:8877/starfort/`.
- Çok oyunculu maç için bütün oyuncuların **aynı Node sunucusunu** kullanması gerekir. İkinci oyuncuyu aynı bilgisayarda denemek için farklı tarayıcı profilleri aç. Sunucuyu izin/güvenlik önlemleri olmadan internete açma.

Klan hesap bilgileri `.local-data/guilds.json` içerisinde tutulur; bu dosyayı herkese açık paylaşma. Şehir ilerlemesi tarayıcıdaki yerel kayıt alanında saklanır; Ayarlar'dan yedek alabilirsin. Önceki `starfort:v1` kayıt biçimi değiştirilmedi.

## v1.7 yenilikleri (Ultra grafik)

- **Yeni hareket interpolasyonu:** sunucudan gelen kahraman ve birlik koordinatları ekran üzerinde yumuşakça takip edilir; sunucu konumu, hasarı ve kazanma kuralları kesinlikle değiştirilmez. Ani büyük yer değiştirmeler takılmayı azaltmak için farklı işlenir.
- **Prosedürel karakter hareketleri:** yürüyüş salınımı, karakter yön değiştirme, adım izleri, darbe halkası ve kısa sarsıntı tepkisi. Sprite kareleri henüz bağımsız kemik animasyonuna sahip değildir; bu yüzden AAA 3B hareket beklenmemelidir.
- **Daha canlı savaş efektleri:** saldırı yayları, atılma çizgileri, büyü patlaması ve ortam tozu Ultra modda güçlendirilir. Azaltılmış hareket tercihine saygı gösterilir.
- **Uyarlanır Canvas çözünürlüğü:** Ultra en çok 2× çizim çözünürlüğü, Dengeli 1,4×, Performans 1× kullanır; cihazın ekran ölçüsü ve piksel oranına göre sınırlandırılır. Yakınlaştırma ve seçme için aynı 1000×600 mantıksal savaş koordinatları korunur.
- **Savaş içinde anında grafik seçimi:** yatay mobil tam ekran üst çubuktaki ✦ Ultra düğmesiyle kalite döngüsü, maçtan çıkmadan değiştirilebilir. Önceden kayıtlı `Sinematik` ayarı otomatik Ultra’ya geçer.
- Önceki şehir/kale/PvE, çevrim içi 1v1, takım 2v2/5v5, klan ve 5v5 kale kuşatması kuralları korunur.

## v1.6 yenilikleri (mobil yatay)

- **Aktif 1v1 ve 2v2/5v5 maçta, yatay telefonda ekranı kaplayan HUD:** üstte kısa maç skoru/süre bilgisi, solda joystick, sağda saldırı-büyü-atılma ve asker emirleri. Gereksiz başlık ve menüler maç sırasında gizlenir.
- **Analog, basınca duyarlı sanal joystick:** parmağı sürükleyince hız/yön kademeli değişir; bırakınca hareket durur. Masaüstü WASD kontrolleri korunur.
- **Telefonun güvenli ekran kenarlarına uygun boşluklar** ve küçük yatay ekranlar için sıkıştırılmış tuş dizilimi. 667×375, 844×390 ve 932×430 boyutlarında yerleşim kontrolü.
- Aktif savaş ekranından **Köy** düğmesiyle çıkış, isteğe bağlı tam ekran düğmesi (tarayıcı destekliyorsa). Dikey açılırsa yatay oyun önerisi gösterilir.
- Dokunmatik düşman seçimi, Canvas yan boşluklarını hesaba katar; yanlış hedef seçimi azalır.
- Mobil grafik kalitesi varsayılanı **Sinematik**; performans gerektiğinde menüden Dengeli/Performans seçilebilir. Bu üç kalite seçeneği v1.5'ten korunmuştur.
- Yerel kayıt şeması değişmedi, eski kayıtla uyumlu. Sunuculu maç mantığı ve ödül dengeleri değişmedi.

## v1.5 ile gelenler

### Görsel kalite

- Savaş alanının karanlık ızgara görünümü çıkarılıp mevcut detaylı fantastik çevre çizimi görünür hale getirildi.
- Gerçek oyun çizimlerinden WebP formatında kesilen **iki fraksiyona ait 6 şeffaf karakter minyatürü** eklendi; daire biçimli kahraman simgeleri değiştirildi.
- Hareketli büyü halkaları, renkli hasar efektleri, asker siluetleri, zemin gölgeleri, isim/can göstergeleri, parlak sancaklar ve kale çekirdeği eklendi.
- Daha okunaklı 1v1 ve takım savaşı HUD'ları, alt yetenek düğmeleri, takım bildirimleri geliştirildi.
- 1v1 ve takım savaşı ekranlarına **Sinematik / Dengeli / Performans** görüntü seçenekleri eklendi. Seçim aynı tarayıcıda saklanır. Tam görsel kalite için Sinematik seç.
- Bunlar Canvas 2D görselleridir; 3B oyun motoru, AAA düzeyinde model/animasyon sistemi veya donanımsal benchmark iddiası yoktur.

### 5v5 kale kuşatması

- **Seferler → Takım savaşına gir → Kuşatma 5v5** (rastgele takım) ya da **Klan Kuşatma** (klan liderinin hazırladığı 5 kişilik grup).
- Şafak takımı **kuşatan**, Gece takımı **savunandır**. Saldıranlar önce **kale kapısının 900 canını**, sonra **yıldız çekirdeğinin 1000 canını** tüketmelidir.
- Kapı sağlamken her iki taraf fiziksel olarak kapının karşı tarafına geçemez; sunucu pozisyonları sınırlar. Kapı yıkılınca yol açılır. Rakip askerler savaşmayı sürdürür.
- Kapı ve kristal hasarı sunucuda hesaplanır. Kuşatanlar çekirdeği yok edince kazanır; süre (180 saniye) bitene kadar çekirdeği savunan takım kazanır.
- Komutlar: `WASD` veya oklar hareket, `J` saldırı, `Q` büyü, `Space` atılma, `1` takip, `2` ilerle, `3` savun, `4` hedefe odaklan. **Kuşatmada askerleri kapıya yöneltmek için `2` (İlerle)** komutunu kullan. Hedefe yakın dururken saldırılarıyla kapıya/çekirdeğe hasar verebilirler.
- **İttifak → Savaş Odası** ekranında klan üyeleri rol seçip Hazır olmalıdır. Lider klan kuşatması kuyruğunu başlatır; ikinci klan da aynı modu seçince eşleşme tamamlanır. Her klan 5 hazır komutan getirmelidir.

## Önceki sistemler

- Şehir: 7 bina, kaynak üretimi, bina geliştirme, panoramik şehir etkileşimleri.
- PvE: 8 hikâye bölümü, kahramanlar, ekipman üretme/kuşanma, taktik modları.
- Yerel kuşatma tatbikatı: tek kişilik eğitim amaçlı komutan/ordu kontrolü.
- Gerçek zamanlı sunuculu **1v1 düello**, **2v2/5v5 sancak savaşı**, **klan eşleştirmesi**.
- Klan oluşturma/katılma, davet kodu, sohbet, savaş odası, ortak baskın.
- Günlük ödül, ayarlardan kayıt yedeği/geri yükleme.

## Test ve sınırlamalar

- `npm run qa:all` çalıştırarak sözdizimi kontrolü + **106 otomatik test** çalıştırabilirsin.
- `npm run qa:watch`: bilgisayar/terminal açıkken 5 dakikada bir üç QA hattını çalıştırır; arka planda otomatik geliştirme yapmaz.
- Test kapsamı: eski oyun kuralları, iki oyunculu düello, takım savaşı, 10 kişilik 5v5 eşleşmesi, 5v5 kuşatma kapı/kristal mekanikleri, klan savaşı kuyrukları, HTTP sunucu doğrulaması ve sanat varlıklarının pakette bulunması.
- Bu çalışma ortamında gerçek sayfa gezinmesi `ERR_BLOCKED_BY_ADMINISTRATOR` nedeniyle engellendi. v1.7'de gerçek Canvas çizimi ayrıca Chromium `set_content` ile test edilerek kuşatma görseli üretildi; fakat bu, çalışan çevrim içi maçın uçtan uca tarayıcı testi değildir. Yerel HTML/CSS, Chromium içinde `set_content` kullanılarak 3 yatay ve 1 dikey çözünürlükte düzen açısından sınandı; bu, **gerçek oyunun tarayıcıda uçtan uca testi değildir**. Savaş motorunun v1.5 Canvas render testleri korunuyor. Fiziksel telefon FPS ve çok oyunculu canlı oyun testi henüz yapılmadı.
- İnternetteki oyunculara sunmak için HTTPS, hesap güvenliği, yetki/rate limiting, moderasyon, kalıcı maç/kayıt depolaması, gecikme dengeleme, ölçeklenebilir gerçek zamanlı ağ altyapısı gerekecek. Şu an HTTP polling ve RAM'deki kısa ömürlü maçlarla geliştirme prototipidir.
- Aynı klanın ekip olarak 5v5 kuşatması çalışır; **20v20/50v50**, gerçek 3B animasyonlar, yıkılabilir tüm surlar, klan ligi ve kalıcı PvP ödülleri henüz yoktur.
- Orijinal kaynak içindeki eski Three.js testleri, bulunmayan `lib/three.module.js` nedeniyle aktif test grubunda değildir.

Ayrıntı: `KALITE_KONTROL_V1_7.md` (önceki `KALITE_KONTROL_V1_6.md` de vardır) (v1.5 raporu da pakettedir).


## v2.5.2 — Tek oyunculu savaş testleri, görsel mod düzeltmesi

- Yeni varsayılan: **Sinematik 2.5B**. Önceki prosedürel 3B kalite hedefi karşılamadığı için artık varsayılan değil; isteyen deneysel 3B moduna manuel geçebilir.
- Yıldız Düellosu → **Botla Savaş (Tek Başına)**; sunuculu rakip bot hareket eder, vurur, yetenek kullanır.
- İki Sancak ve Kale Kuşatması → **2v2 Bot Antrenmanı** veya **Tek Kişilik Kuşatma**; sunucu eksik yerleri botlarla doldurur. Botlar gerçek oyuncu değildir, maçlar ödülsüzdür.
- Kuşatmada yeni resimli sahne kullanılır; karakterler hâlâ 2B sprite overlay. Konsept resmiyle oynanışın aynı kaliteye geldiği anlamına gelmez.
- Mac/Windows başlatıcı yeni varsayılan **8897** portunu kullanır, doluysa sıradaki boş portu seçer. Tarayıcı oyun ilerlemesi port bazında saklandığı için eski porttaki kaydı önceden yedekle.
- 3B gerçek GPU/fiziksel telefon FPS testleri tamamlanmadı.

## v2.5.3 kalite kontrol ve tek tuş bot

**Seferler** ekranında tek dokunuşla botlu 1v1 veya 5v5 kuşatma başlatabilirsin. Yerel test hesabın yoksa düğmeye bastığında oluşturulur; ana köy kaydı değişmez. Aynı tarayıcıda eski test sunucusu token'ı geçersizse yenisi alınabilir. Kayıt ilerlemesi tarayıcı-port bazında saklanır; eski porttan yedek al.

`npm run qa:all`: 163 otomatik test (sunucu, ekonomi, PvE, 1v1, botlar, 5v5, kuşatma, klan ve kayıt) ve sözdizimi kontrolü. Tam fiziksel telefon/gerçek WebGL2 testinin yerini tutmaz. Ayrıntı: `KALITE_KONTROL_V2_5_3.md`.


## v2.6.1 — çevrim içi kapalı beta hazırlığı (Render)

Bu kaynak klasörü `render.yaml` ile bir **Render Node.js Web Service** olarak yayımlanabilir. `npm run start:cloud`, `STARFORT_HOST=0.0.0.0` ve `PORT` ortam değişkenini kullanır. `STARFORT_TEST_CODE` tanımlanmışsa yeni hesap açmak için giriş kodu sorulur. Bu bir test davet sistemi olup üretim güvenliği sağlamaz.

**Dikkat:** Render Free planda klan/hesap JSON verileri yeniden başlatma, dağıtım veya boşta kalma sonrası silinebilir. Kalıcı veritabanı ve gerçek kimlik doğrulama sistemi henüz yoktur. Kurulum için üst dizindeki `STARFORT_ONLINE_KURULUM.md` dosyasını oku.


## v2.7.0 — Uzun soluklu beta oynanış testi

- 3 isteğe bağlı günlük Komutan Görevi: üretim toplama, hikâye zaferi, yetenek kullanımı.
- 8 haritada 3'er kademeli Usta Seferi (24 mühür); daha güçlü rakiplere karşı taktik sınavı.
- Haftalık Yıldız Yarığı: farklı savaş modifikasyonları, haftada en fazla bir kozmetik kayıt mührü.
- 24 saatlik pasif kaynak rezervi: ilk 4 saat normal, kalanı %12 hızla; sürekli giriş zorunlu değil.
- Mağazada 4 kozmetik konsept için yerel ilgi anketi. **Gerçek satış, ödeme ve oyun gücü satışı yok.**
- Görevler çevrimdışı tek oyunculu bölümün bir parçasıdır; PvP ekonomik güvenlik ve sunucu otoritesi ayrı geliştirme işidir.
- Kullanıcının gerçek oyun keyfi veya satın alma niyeti simülasyonlardan çıkarılamaz; beta insan testleri gerekir.
- Rekabetçi modlar için istemci tarafından değiştirilebilir veriler kullanılmamalıdır.
