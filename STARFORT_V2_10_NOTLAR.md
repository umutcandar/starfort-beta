# STARFORT v2.10.0 — Görsel ve oynanış bütünlüğü

## Görsel yön
- Ana hikâye öncelikli: Sefer haritası, yıldız yolu, bölüm kartları ve zorluk dereceleri artık alternatif maç seçeneklerinden önce geliyor.
- Tek oyun evreni: Yıldız Kalesi, Kül Geçidi, Karaorman, Ayaz Surları ve Tutulma Kulesi aynı karanlık fantastik sanat dilinde sunulur.
- Sekiz bölge atmosferi: Mevcut çizimli savaş alanına her sefer için farklı sis, ışık ve renk düzeni eklendi. Henüz sekiz ayrı çevre varlığı çizilmedi.
- 14 ayırt edilebilir ekipman: Silah, zırh ve tılsımlar artık kendilerine özgü SVG silüetlerine sahip.
- Sinematik 2.5B varsayılan; deneysel 3B yalnızca ?graphicslab=1 ile isteğe bağlı açılır. 3B geliştirme kodu korunur.

## Oyun modları
- Ana hikâye: Kuzeydeki sekiz sefer temel ilerleme hattıdır.
- Savaş salonu: Bot düellosu, takım tatbikatı, komutan akademisi ve gerçek PvP ayrı bir paneldedir.
- GitHub Pages üstünde canlı eşleşme sağlayıcısı olmadığı için çalışmayan butonlar pasifleştirilir; gerçek Node sunucusunda canlı seçenekler korunur.
- Takım savaşı: Dokuz düğme yerine bot tatbikatı ve ittifak cephesi ayrı kartlarda. Büyük tanıtım afişi ana maç alanından kaldırıldı.
- Bot ve canlı PvP ödül farklılıkları oyuncuya daha açık anlatılır.

## Korunanlar ve sonraki kontrol
- Mevcut ilerleme kayıtları, oyun ekonomisi ve savaş matematiği değiştirilmedi.
- Bu sürümde yeni 3B varlıklar üretilmedi; değişiklikler mevcut çizimler, CSS ve SVG tabanlıdır.
- Mobil gerçek cihaz FPS, ısı ve farklı ekranlarda görsel QA hâlâ gereklidir.
- GitHub Pages üzerinde gerçek oyunculu PvP hâlâ açık değildir; üretim altyapısı ayrıca geliştirilmelidir.

## Otomatik kontrol
cd starfort && npm run qa:all
