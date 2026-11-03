# STARFORT v2.39 — Patron Görselleri, Ganimet Sunumu ve Orta Seviye Denge
**3 Kasım 2026 · STARFORT v2.39.0**

## Tamamlanan geliştirmeler

### 1. Dört özgün patronun savaş görseli

Diken Nöbetçisi, Oyuk Siren, Kül Fırtınası ve Tutulma Hükümdarı için dört farklı **orijinal SVG silüet** çizildi. Sahnelerde bölgeye özgü renkler, zemin, arka plan, patron gövdesi ve ışık efektleri bulunuyor. Vektörler çözünürlükten bağımsızdır; uzak sunucudan resim indirilmez. Tek bir görselin tüm kartlarda kopyalanması söz konusu değildir.

- Bölgelerin kartlarında patron resmi ve tamamlanma durumu gösterilir.
- Aktif savaş sırasında patronun 1/3, 2/3, 3/3 dalgası; can yüzdesi; mevcut hamle niyeti; bölgeye özel safha adı ve karşı taktik görünür.
- Son safhada ağır darbe/kalkan/can emme etkilerine uygun görsel vurgular vardır; Tutulma Hükümdarı %68 ve %35 can eşiklerinde farklı uyarı gösterir.
- Hareketli nefes/ışıltı ve sonuç animasyonları CSS ile yapılır. **Azaltılmış hareket (prefers-reduced-motion)** seçen oyunculara animasyonsuz görünüm sunulur.
- Bunlar **yeni 3D model ya da özel ses/animasyon dosyası değildir**. Mevcut çevrim içi oyuna bağlı SVG/CSS çizimleridir.

### 2. Gerçek ödüllerin görünür olduğu sonuç ekranı

Sunucunun doğruladığı savaş raporu kullanılarak 1–3 yıldız, tur sayısı ve kaynak tutarları gösterilir. Dört kaynak kategorisi: altın, kereste, taş ve yıldız özü. İstemcinin keyfî bir ödeme/ganimet tutarı uydurması önlenir.

İlk zaferden gerçek ekipman gelirse o eşyanın adı, açıklaması ve nadirlik seviyesi ayrı kartta gösterilir. **Çantada incele** komutu gerçek envanter ekranına gider. Sonuç penceresi kapatılabilir; kapatma gerçek sunucu savaş kaydını veya ödülleri silmez.

**Ganimet sınırı düzeltmesi:** İlk-zafer ekipmanının oyuncuda zaten 20 adet olması hâlinde düşmemiş bir eşyanın kazandırıldığı söylenmez. Sunucu bunun yerine **36 ilave yıldız özü** verir; sonuç ekranında durum açıklanır. Bu dönüşüm gerçek SQL transaction testiyle kanıtlandı: birinci bölge için normal 60 özü + dönüşüm 36 = **96 öz** kayda geçti, ekipman sayısı 20 kaldı. Test `ROLLBACK` ile temizlendi.

### 3. Orta seviyeli oyuncu ilerleme testi

Gerçek `sfb_shadow_api` savaş fonksiyonunda, dört farklı test hesabı için artan kahraman seviyesi ve o seviyeye uygun hazırlanmış ekipmanla deneme yapıldı. Rütbe, ekipman ve ilerleme koşulları fixture'a göre oluşturuldu. Hamleler kalkan için Aldat, ağır darbe için Savun ve gerektiğinde beceri/Toparlan stratejisine göre seçildi.

| Yeni bölge | Takımdaki kahraman seviyesi | Sunucunun hesapladığı güç | Tur | Yıldız |
| --- | ---: | ---: | ---: | ---: |
| Diken Nöbetçisi | 8 | 746 | 9 | 3 |
| Oyuk Siren | 10 | 843 | 11 | 3 |
| Kül Fırtınası | 12 | 1017 | 12 | 3 |
| Tutulma Hükümdarı | 14 | 1096 | 16 | 2 |

Bu testler **önceden ilerletilmiş, çeşitli ekipmanlarla donatılmış geçici fixture hesaplarıdır**. Tüm testler transaction içinde geri alındı. Seviye 8'e yeni ulaşmış veya farklı kahraman dizilimindeki herkesin aynı sonucu alacağı iddia edilmiyor. Gerçek oyuncular üzerinde günler/haftalar süren davranışsal oynanış analizi yapılmadı.

### 4. Testler, mobil deneyim ve güvenlik

- 434 Node oyun ve regresyon testi başarılı.
- Chromium otomatik testinde hesap girişleri, satın alma kilidi, eski Cephe Karargâhı, yeni patron çizimleri, özel safhalar, üç dalgalı sentetik sefer, 3 yıldız, ilk ganimet ve envantere yönlendirme doğrulandı.
- 390 piksel mobil ekranda savaş sahnesi ve ganimet sonuç kartlarının yatay taşması bulunmadı.
- Yeni SVG görseller salt statik kod içerir; üçüncü taraf URL ve çalıştırılabilir SVG script'i yoktur.
- Gerçek Supabase ilk-zafer ganimet dönüşümü, sunucu kararları ve mevcut RLS izinleri korunmuştur.
- Misafir modu, gerçek para ödemeleri ve son kullanıcıya rastgele bedava kristal verme özelliği açılmadı.

## Sonraki kapsam

Görsel animasyonları ayrı silah darbesi/hasar parçacıklarına dönüştürme, hikâyedeki tüm düşmanlar için çizim yapma, daha fazla orta-seviye dizilimde denge kontrolü, gerçek oyuncuların haftalık geri dönüş ve bölüm terk verilerinin ölçülmesi. Ses ve 3D boss modelleri ayrı bir gelecek sürüm işidir.

## Kaynak kod

- `starfort/shadow-boss-art-v239.js`: özgün çizimler ve safha hesaplaması
- `starfort/shadow-rewards-v239.js`: sunucu ödülleri ile sonuç ekranı
- `starfort/shadow-boss-v239.css`: hareket, vektör sahneler, responsif görünüm
- `starfort/sql/starfort-v239-first-clear-loot-cap.sql`: 20 adet sınırında doğru kaynak dönüşümü
- `starfort/shadow-boss-v239.test.mjs`: güvenlik, vektör, sahne, ganimet ve arayüz regresyonu
- `starfort/scripts/reference-browser-qa.mjs`: Chromium görsel/etkileşim testi

**Sürüm yayımlama kabul ölçütü:** GitHub Actions QA ve Pages başarıyla sonuçlanmalı, ardından Render'ın aynı commit üzerinde `live` olduğunu görmek gerekir.
