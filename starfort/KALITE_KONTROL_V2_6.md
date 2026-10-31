# Starfort v2.6.0 — Geliştirme ve kalite kontrol

**Durum:** Oynanabilir geliştirme sürümü; final veya AAA grafik kalitesi değildir.

## Gerçek değişiklikler

- **Sunucuya bağlı kuşatma görselleri:** `siege-visual-state.js` artık kapı / koçbaşı / çekirdek durumlarını sunucunun HP ve faz verilerinden türetiyor. Kapının dört hasar seviyesi görüntüleniyor, koçbaşı statik arka plana bağımlı değil.
- **Kuşatma savaş zemini:** `battlefield-live.webp` ile sabit çizilmiş askerler ve hareket etmeyen koçbaşını içeren arka planın oynanış sahnesinde kullanılmasına son verildi. Bu değişiklik görsel tutarlılığı artırır ancak varlıkların sanat kalitesi hâlâ prototip düzeyinde.
- **Dokunmatik hedefleme:** 2.5B kamera hareket ederken 10000×6000 eski giriş ölçeği ile 1000×600 render ölçeğinin karışması düzeltildi. Gerçek 3B deneysel modun dönüş ölçeği de korundu.
- **Taktik mini harita:** 2v2, 5v5 ve klan savaşlarında server snapshot verilerinden oyuncu, takım, birlik, bayrak, koçbaşı, kapı ve çekirdek gösteriliyor. Ölü oyuncular ve yıkılan hedefler haritadan kaldırılıyor.
- **Yatay telefon:** Mini harita küçük ekranlarda yer kaplamayacak şekilde ölçekleniyor. Grafik kalite ve mevcut kontrol seçenekleri korunuyor.

## Testler

- `npm run qa:all`: **181/181 test geçti**. Oyun kuralları, sunucu entegrasyonları, 1v1/bot/takım/kuşatma ve regresyon testlerini içeriyor.
- Yeni testler: kuşatma görsel hasar aşamaları, koçbaşının bağımsız görünürlüğü, mini harita durumları, kamera hareketiyle hedefleme koordinat dönüşümü.
- Yerel HTTP sunucusunun grafik dosyaları ve oyun sayfası için `200 OK` yanıtları doğrulandı.
- Chromium belleğine yüklenen gerçek grafik JS modülünde 1200×720 ve 844×390 çözünürlüklerde **Canvas2D yedek motoru sahneyi çizdi, JavaScript hatası olmadı**. Bu sonuçlar oyun sayfasının gerçek uçtan uca tarayıcı testi değildir.
- Yerel URL'ye doğrudan Chromium `page.goto` çağrısı test ortamının `ERR_BLOCKED_BY_ADMINISTRATOR` kısıtına takıldı. **Tam uygulama menü tıklama testi yapılmadı.**
- Gerçek telefon WebGL2/FPS, üretim düzeyinde GPU testi, 10 ayrı gerçek cihazlı yük testi **yapılmadı**.

## Açık kalan önemli işler

- Mevcut 2.5B kale/koçbaşı ve karakter varlıkları sinematik konsept hedefinden görsel olarak uzak. Gerçekçi modellenmiş GLB/glTF varlıklar, profesyonel animasyon, aydınlatma, materyal ve görsel seviye tasarımı gerekiyor.
- Deneysel gerçek 3B mod hâlâ düşük detaylı ve fiziksel GPU'da doğrulanmadı.
- Gerçek çok oyunculu uzak sunucu dağıtımı/performansı ve yük testleri yapılmalı.

## Açılış

Node.js 20+ gerekli. ZIP'i ayrı klasöre çıkart, Mac'te `BAŞLAT.command`, Windows'ta `BASLAT.bat` veya oyun klasöründe `node launch-starfort.mjs` çalıştır. Varsayılan port 8897'dir; doluysa başlatıcı başka boş port seçer. Tarayıcı verisi porta bağlıdır: eski köy ilerlemesini taşımak için önceki porttan kayıt dosyasını dışa aktar.
