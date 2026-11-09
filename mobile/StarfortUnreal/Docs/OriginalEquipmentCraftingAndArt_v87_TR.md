# STARFORT v87 | Özgün ekipman, malzeme ve 3D sanat üretim rehberi

**Durum:** Uygulanmış gerçek sistem ile gelecek için tasarladığımız sistemi ayırır. `equipment_future_v87.json` sadece **tasarım sözleşmesidir**; veritabanına yeni eşya, para, malzeme, ganimet veya satın alma eklemez. Mevcut oyuncu kayıtlarını ve +5 ustalık masraflarını değiştirmeyiz. Canlı kodda `sfb_starfort_progress` işlevinin `forge/equip/unequip/enhance/ascend` adımları sunucu yetkisiyle çalışır.

## 1. Temel prensip ve envanter sayısı

**3 ana yuva**: Silah (atak), Zırh (dayanıklılık), Tılsım (şifa / hibrit). Bir kahraman için **3**, üç kişilik takım için **9**, yedi kahramanı aynı anda tam donatmak için **21 fiziksel eşya kopyası** gerekir. Bunlar **farklı eşya türü sayısı değil**, bir eşyayı iki karaktere aynı anda kuşandırmak için iki kopya gerekir. Her bir eşya türünden depoda üst sınır şimdilik **20 kopya**. 19 mevcut tür + önerilen **12 yeni tür = 31 tür**; başta 7 ayrı ek yuva veya 50 farklı para koymak oyunu gereksiz karmaşıklaştırır.

Üç görünür yuva kalsın; set bonusu ve geliştirilebilir yıldız gravürleri daha derin ilerleme sağlar. Miğfer/çizme yeni gerçek yuva olarak ancak sunucuya, 3D riglere ve UI'a dahil edilmiş, endgame testleriyle onaylı bir sonraki sezonda düşünülsün. Bu sürümde önerilen yeni eşyalar **henüz kuşanılamaz, droplanamaz, üretilemez**.

## 2. Mevcut 19 eşya — gerçek etki, köken ve özgün sanat yönü

| Eşya | Oyun gücü | İlk elde ediliş / üretim | 3D siluet tasarım yönü |
|---|---|---|---|
| Yemin Kılıcı | Saldırı +4 | Başlangıç; Demirhane 1 | Kale surlarını çağrıştıran köşeli kısa kılıç, kırık altın kabza |
| Muhafız Zırhı | Can +30, Zırh +3 | Başlangıç; Demirhane 1 | Perçinli katmanlı göğüs levhası, yıpranmış kumaş |
| Ay Mührü | Can +8, Şifa +6 | Hikâye 1 ilk zafer; Demirhane 1 | Asimetrik açık hilal içinde tek sedef çekirdek |
| Kor Kılıcı | Saldırı +10 | Hikâye 2 ilk zafer; Demirhane 2 | Kül sarısı kesici ağız, içeriden kızaran yarık |
| Hisar Levhası | Can +65, Zırh +7 | Hikâye 3 ilk zafer; Demirhane 2 | Göğüste üst üste binen iki kalkan plakası |
| Yıldız Merceği | Saldırı +5, Şifa +8 | Hikâye 4 ilk zafer; Demirhane 2 | Asılı altıgen optik mercek, metal yörüngeler |
| Şafak Yaran | Saldırı +17 | Hikâye 6 ilk zafer; Demirhane 4 | Hafif eğimli altın-gümüş pala, yedi kule oyması |
| Son Siper | Can +110, Zırh +12 | Demirhane 4 | Şato kemerlerinden kesilmiş, yekpare omuz levhası |
| Ayın Kalbi | Can +35, Şifa +14 | Hikâye 8 ilk zafer; Demirhane 4 | Sedef pürüzlü kalp biçimli gümüş kristal |
| Mahzen Ruh Mührü | Can +26, Şifa +8 | Hikâye 5 ilk zafer; üretilemez | İnce zincirde asılı içi boş siyah mahzen rozeti |
| Tutulma Kılıcı | Saldırı +15 | Hikâye 7 ilk zafer; üretilemez | İki katlı kesici ağız, kenarda kararmış hilal |
| Ay Siperi | Can +45, Zırh +6 | İlk farklı 3★ bölüm; üretilemez | Sol omza inen ay levhası, mavi yarım halka |
| Kor Lejyonu Zırhı | Can +50, Zırh +5 | 2. farklı 3★ bölüm; haftalık patron rotasyonu | Kül lekeli katı omuzluklar, bronz koruyucu düğümler |
| Şafak Yemini | Can +20, Şifa +7 | 3. farklı 3★ bölüm; üretilemez | Dikey zarf şeklinde açılan bakır şafak mührü |
| Ayışığı Mızrağı | Saldırı +11 | 4. farklı 3★ bölüm; haftalık patron rotasyonu | İki ayrı hilal mızrak ucu ve esnek lacivert sap |
| Şafak Muhafızı Levhası | Can +70, Zırh +6 | 5. farklı 3★ bölüm; üretilemez | Siperli yüzey ve yedi kuleyi temsil eden kemer |
| Yıldızkıran Kılıç | Saldırı +28 | Demirhane 6; haftalık patron rotasyonu | Yedi uçlu merkez yıldızı ve uzun kırık yörünge kabzası |
| Küllerin Zırhı | Can +150, Zırh +14 | Demirhane 5 | Dumanla kararmış mavi çelik, çatlaklardan çok düşük kor ışığı |
| Koruyucu Mühür | Can +35, Şifa +17 | Demirhane 5; haftalık patron rotasyonu | Havada dönen iki kalkan halkası ve yıldız prizması |

**Ay/Kor/Şafak setleri** bir kahramanda aynı aileden 2 ekipman kuşanınca devreye girer: Ay = +25 Can, +2 Zırh; Kor = +4 Saldırı, +2 Zırh; Şafak = +3 Saldırı, +3 Şifa. Bunlar **mevcut** istatistiklerdir. Bir silah tek başına 4 parçalık setmiş gibi satılamaz.

## 3. Eklenmesini önerdiğim 12 farklı, gerçek karakter rolü olan ekipman

| Yeni eşya | Kime yakışır / önerilen etki | Kaynak / sanat kimliği |
|---|---|---|
| Gökyarığı Yayı (Destansı, Fırtına) | Rovan, Lyra · +15 Saldırı | Ortası boş yıldızdan oluşan yay, kobalt asimetrisi. Öneri: Fırtına Avı sözleşmesi, Demirhane 4 |
| Ocağın Son Sözü (Destansı, Kor) | Doran, Aldren · +13 Saldırı | Kırık volkan camı savaş çekici, bakır perçin. Öneri: Kor Ocağı usta seferi |
| Boşluk İğnesi (Efsanevi, Yarık) | Vesper · +22 Saldırı | Mat-siyah ikili hilal hançer, kenarında ince menekşe çizgi. Öneri: Derin Yarık patronu |
| Kökışığı Asası (Efsanevi, Can) | Mira, Eira · +12 Saldırı, +16 Şifa | Ağacın köklerinden yapılmış üçlü halka, cam filiz. Öneri: Ay Bahçesi |
| Köz Dokuması (Destansı, Kor) | Doran, Aldren · +80 Can, +8 Zırh | Yalın bronz tokalı yanık kumaş, katmanlı gerçek deri. Öneri: Veteran Bölüm 4 |
| Gece Dokusu (Destansı, Yarık) | Vesper, Rovan · +70 Can, +5 Zırh | Yırtık uçlu çivit manto, ışık yutmayan mat metal. Öneri: Yarık Gözcüsü |
| Gök Nöbetçisi (Efsanevi, Fırtına) | Aldren, Eira · +120 Can, +10 Zırh | Açılı bulut levhaları ve iki ince yıldırım damarı. Öneri: Fırtına Kalesi |
| Ay İzli Göğüslük (Efsanevi, Ay) | Lyra, Mira · +100 Can, +9 Zırh | Göğüste tek ay yarığı, sedef-gümüş şeritler. Öneri: 12. labirent katı |
| Fırtına Prizması (Efsanevi, Fırtına) | Rovan, Lyra, Eira · +12 Saldırı, +20 Can | Üç ince altın halka içinde asılı mavi cam damlası. Öneri: Fırtına Kalesi patronu |
| Hiçlik Pusulası (Destansı, Yarık) | Vesper, Lyra · +8 Saldırı, +10 Şifa | Eksik pusula halkası, siyah safir lens. Öneri: Labirent Gözcüleri |
| Can Yurdu Tohumu (Efsanevi, Can) | Mira, Eira · +60 Can, +18 Şifa | Kırılmış tohum içinde yaşayan cam filiz. Öneri: Ay Bahçesi patronu |
| Şafak Çarkı (Efsanevi, Şafak) | Aldren, Doran · +14 Saldırı, +25 Can | Beş açık yörünge halkası, ortada beyaz yıldız iğnesi. Öneri: Şafak Ayini sezon/solo görevleri |

Yeni önerilen Fırtına seti **+4 Saldırı/+15 Can**, Yarık seti **+6 Saldırı/+1 Zırh**, Can seti **+35 Can/+4 Şifa** olacak şekilde ilk denge adayıdır. Yeni setlerin gerçek savaş etkisi, kesin sunucu statı ve oyuncu testlerinden önce **aktif değildir**. Roller sert ekipman kilidi değil öneridir; tüm kahramanlar seçebildikleri yuvaya uygun eşyayı kuşanabilir, böylece özgür takım kurma korunur.

## 4. Yükseltmek için yeni parçalar: 7 özgün malzeme

| Parça | Özgün görünüm | Önerilen elde edilme şekli |
|---|---|---|
| **Yıldız Kesiti** | Damarı mavi olan beşgen kırık keski | Günün ilk 3 doğrulanmış hikâye zaferi, oyuncu **Silah** hedefi seçtiyse |
| **Hisar Perçini** | İç içe iki metalli altıgen perçin, yedi kule damgası | Aynı garantili 3 günlük zafer, **Zırh** hedefi |
| **Astral Lif** | Havada birbirine değmeden duran üç şerit | Aynı garantili 3 günlük zafer, **Tılsım** hedefi |
| **Yıldız Camı** | Altı ışınlı iç kırılmalı koyu mavi kuvars | Bölüm 5–8 günün ilk 3★ galibiyeti, garantili |
| **Yörünge Çekirdeği** | Kırık küre ve üç dönen halka | Tekrarlanabilir **yeni** Labirent Sözleşmesi haftalık ödülü |
| **Muhafız Damgası** | Yedi farklı köşeli koyu metal patron mührü | Haftanın ilk doğrulanmış Dünya Patronu zaferi |
| **Takımyıldız Levhası** | Kırık diskin üzerine çizilmiş özgün yedi kale takımyıldızı | İttifak haftalık katkısı **veya** eşdeğer tek oyunculu görev |

Bunlar yalnızca zorluk çıkarsın diye biriktirilecek on farklı para değil. Her malzeme başka bir oyun moduna yönlendirir; **yetenek gerektiren sefer**, **günlük kısa hedef**, **haftalık patron**, **labirent** ve **ittifak veya solo seçenek** arasında neden-sonuç bağı kurar. Şu anda sunucu bu yedi parçayı vermiyor. Elde etme yerleri ve oranlar öneridir; sunucuda uyarlamadan oyuna 'düşüyor' yazılmaz.

## 5. Kaç adet gerekir? Bütün maliyetler

### Mevcut, gerçek +5 ustalık

Eşya kopyası harcanmaz, her eşya ID'si **hesap genelinde +5** olur; tüm aynı kopyalar bu ustalıktan faydalanır. Ustalık 1–5 formülü nadirlik katsayısına bağlıdır: Nadir ×1, Destansı ×2, Efsanevi ×3.

| Ustalık adımı | Efsanevi Altın | Efsanevi Taş | Efsanevi Yıldız Özü |
|---|---:|---:|---:|
| +0 → +1 | 360 | 120 | 24 |
| +1 → +2 | 1.440 | 240 | 96 |
| +2 → +3 | 3.240 | 360 | 216 |
| +3 → +4 | 5.760 | 480 | 384 |
| +4 → +5 | 9.000 | 600 | 600 |
| **Toplam** | **19.800** | **1.800** | **1.320** |

Nadir bir eşyayı sıfırdan +5 yapmak **6.600 Altın, 600 Taş, 440 Öz**; Destansı için **13.200 Altın, 1.200 Taş, 880 Öz** gerekir.

### Mevcut özel +4 Yıldız İşleme ve teklif edilen parçalar

Şu anda **Kor Lejyonu Zırhı, Ayışığı Mızrağı, Koruyucu Mühür, Yıldızkıran Kılıç** +5 ustalıktan sonra dört işleme rütbesine çıkabilir. Boss şartları **2, 5, 9, 14 farklı hafta**; para maliyetleri aynen aşağıdadır. Tablodaki malzemeler **ileriye dönük öneridir, şu an harcanmaz**.

| İşleme | Gerçek Altın / Taş / Öz | Önerilen sınıf parçası | Cam | Çekirdek | Damga | Levha |
|---|---|---:|---:|---:|---:|---:|
| I — 2 hafta | 1.400 / 420 / 100 | 6 | 2 | 1 | 0 | 0 |
| II — 5 hafta | 5.600 / 840 / 400 | 12 | 4 | 1 | 1 | 0 |
| III — 9 hafta | 12.600 / 1.260 / 900 | 20 | 8 | 2 | 2 | 0 |
| IV — 14 hafta | 22.400 / 1.680 / 1.600 | 32 | 12 | 4 | 3 | 1 |
| **Toplam** | **42.000 / 4.200 / 3.000** | **70** | **26** | **8** | **6** | **1** |

Kritik: **Her işlem %100 başarılı olsun.** Efsanevi eşyayı rastgele 'patlatan', düşüren, kaybettiren sistem yapmayalım. Oyuncu her haftalık ilerlemenin sonuç verdiğini görsün. 14 farklı hafta kapısı tek başına uzun bir ilerleme olduğundan bunun üzerine aşırı rastgele malzeme kasma eklememeliyiz. Oyuncu bir hafta kaçırdığında sezon bitti diye sıfırlanmamalı. İttifaka girmeyen oyuncu da farklı bir solo sözleşmeyle Levha kazanabilmeli.

### Günlük/haftalık önerilen dağıtım

Günde toplam ilk **3 doğrulanmış hikâye zaferi**: her biri seçili türden 3 parça = **9 parça/gün**. Bölüm 5–8'in günün ilk **3★ zaferi**: **1 Cam/gün**. Yeni haftalık Labirent Sözleşmesi: **1 Çekirdek/hafta**. Haftalık Patron: **1 Damga/hafta**. İttifak katkısı ya da solo eşdeğer görev: **1 Levha/hafta**. Bu garanti sistemi sayesinde IV. rütbeye gereken 70 sınıf parçası 8 aktif oyun gününde, 26 cam 26 uygun günde, 8 çekirdek 8 haftada toplanabilir; en uzun bekleme zaten **mevcut 14 farklı patron haftası** olur. Tekrar oynama ile ikinci kez günlük/haftalık hak talep edilmesi **sunucuda tekil kayıtla** engellenmeli.

## 6. Özgün, üst düzey kalite kuralları

STARFORT'un eşya kimliğinde **yedi kale kulesi**, kırık yörüngeler, yıldız haritaları ve elle dövülmüş kusurlu metaller kullanılmalı. Sıradan “mavi parlayan kılıç + altın zırh” çeşitleri değil; oyuncu bir eşyanın siluetinden adını anlamalı.

**Görsel dil:** Lacivert çelik, kararmış bronz, mat altın, gerçek deri, sedef, opak safir ve kontrollü emisyon. Kızıl Kor ailesi sıcak, Ay ailesi sedef-beyaz, Şafak altın, Fırtına kobalt, Yarık ise mat gece moru; ama **nadirlik rengini sadece renge bağlamayız**, farklı çerçeve oyması ve yıldız sembolü de kullanırız. Vesper'ın hançerini Aldren'ın zırhından yalnızca renk değiştirerek üretmeyiz.

**3D teslim standardı:** Her eşya kendi özgün siluetine sahip gerçek mesh, üç LOD, PBR Base Color/Normal/ORM/Emissive mask, ayrı yüksek kaliteli ikon, hero rig bağlantı soketi, materyal varyantları ve mobil ayar profili ile teslim edilir. Başlangıç üst sınırları öneri olarak silah **7k / 3,5k / 1,2k üçgen**, zırh **14k / 6,5k / 2,2k**, tılsım **4k / 1,9k / 0,6k**. Bunlar Unreal ve gerçek telefon testine göre optimize edilmelidir. İkon için 1024 kaynak / 256 mobil atlas; ASTC sıkıştırma, gereksiz dinamik ışık yok, yakın kamerada kaliteyi koruyan normal map. Niagara efektleri, sürekli kör eden parlama yerine **çekme, saldırı, yükseltme ve zafer anlarında kısa** ve anlamlı olmalı.

**Oyuncu için kalite kontrol:** Üç yeni eşya kuşanma animasyonunda bedene gömülmeyecek, kalkan ve omuzluk kamera açısını kapatmayacak, mobil yatay ekranda 48dp dokunma hedefleri olacak. Görsel model ve animasyon gerçek Unreal Editor'da denenmeden “oyuna hazır” sayılmayacak. Kullanıcıya 2D konsepti 3D mesh olarak sunmayacağız.

## 7. Fazlı uygulama kararı

**v87:** Gerçek mevcut üretim/maliyet ve eşyanın nereden geldiği bilgisi oyun içi Çanta'da; +5 sonrası gerçek patron haftası kapısı; 12 yeni eşya/7 malzeme ve özgün sanat sözleşmesi yalnızca içerik tasarımında. Eski eşyaların isim ve sunucu ID'leri değişmez.

**Sonraki sunucu paketi (henüz yapılmadı):** Malzeme envanterinin ayrı bir tabloya alınması, günlük/haftalık garantili ganimet için idempotent işlem anahtarları, solo/ittifak eşitliği, eşyaların oyun sunucusunda açılması ve tüm yeni 31 eşya için güvenli fiyat/rarity/set matrisinin birlikte dağıtılması. Sadece JS'ye item koymak yeterli değildir.

**Sonraki sanat paketi (Mac/Unreal gerekli):** Önce **Yıldızkıran Kılıç + Küllerin Zırhı + Koruyucu Mühür** için üç gerçek UE mesh ve ikon; sonra 12 yeni orijinal mesh. Unreal derlemesi, iPhone/Android performans ve sunucu denemesi olmadan nihai sürüm yayımlanmaz.
