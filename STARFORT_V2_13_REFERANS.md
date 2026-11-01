# STARFORT v2.13.0 — Görsel referans arayüzü

Bu sürüm kullanıcının paylaştığı **Köy/Seferler** ve **Çanta/Donanım** referans ekranlarının sayfa hiyerarşisini gerçek oyuna uygular. Bu bir statik resim değildir; tüm kartlar oyun kaydı ve mevcut sistemler üzerinden çalışır.

## Düzen

- Üst: STARFORT logosu, Altın / Kereste / Taş / Yıldız Özü değerleri.
- Alt: Köy, Seferler, Kahramanlar, Çanta, İttifak, Mağaza; seçili sekme altın konturla belirgin.
- Köy ve Seferler: sürüklenebilir, yakınlaştırılabilir resimli kale ve tıklanabilir bina etiketleri. Seferler sekmesi artık köy panoramasında sinematik sağ sefer kartını açar. Karttan gerçek savaş başlatılır veya "Tüm seferler" ile sekiz bölümlük tam kampanya listesine gidilir.
- Çanta: dört sıralı alan; kahraman listesi, karakter ve savaş değerleri, kuşanılmış silah/zırh/tılsım ile filtreli eşya- ve malzeme ızgarası, seçili eşya detayları.
- Boş yuvaların siluetleri açıklayıcı örnek görseldir; ekipman kazanılmış gibi gösterilmez.
- Gerçek veri: envanter, kaynak, set bonusları, üretim, kuşan/çıkar, kahraman erişimi. Görseldeki örnek kaynak miktarları veya +14 seviye değerleri oyuna sabitlenmez.
- **Yıldızkıran Kılıç, Küllerin Zırhı ve Koruyucu Mühür** yeni ve gerçekten üretilebilen üç eşyadır. Kaynak ve demirhane seviyesi gerektirir. İlk açılıştaki seçili Yıldızkıran Kılıç sadece önizlemedir.

## Testler

- `npm run qa:all`: otomatik oyun/sözdizimi/entegrasyon testleri.
- `npm run qa:visual`: Node.js + Google Chrome ile gerçek sayfa ölçümleri, menü/çanta/ekipman/sefer etkileşimleri ve ekran görüntüsü üretimi.
- 1536×864 geniş görünüm ve 667×375 mobil yatay görünüm kontrol edilir.
- CI resimleri GitHub Actions'daki `starfort-layout-screenshots` çıktısında tutulur.

## Kapsam sınırı

Referans görsellerin ayrı ayrı kaynak resimleri veya özgün 3B karakter modelleri olmadığı için **piksel piksel aynı çizim** değil, aynı genel düzen/tema/işlev yaklaşımı uygulanmıştır. Mevcut oynanabilir panorama ve kahraman portreleri kullanılmıştır. Tam görsel birebirlik için referansın özgün katmanlı görsel varlıklarının ayrıca oluşturulması gerekir.

Bu sürüm Supabase şemasını değiştirmez. Oyun kayıtları ve mevcut çevrim içi protokol korunur.
