# STARFORT v2.4 — Kalite Kontrol ve Sınırlamalar

**Sürüm:** 2.4.0-dev / deneysel gerçek 3B motor. **Bu bitmiş ticari oyun veya AAA kalitede grafikleri olan bir oyun değildir.**

## Gerçekten eklenen işlevler

- `graphics-3d-rig.js`: Gövde / kalça / omuz / dirsek / el / diz / ayak bileşenleri üzerinden 3B eklemli prosedürel pozlar; boşta, koşu, saldırı, büyü, darbe ve düşme görsel durumları. Profesyonel rigged GLB animasyon klipleri **değildir**. Eylem animasyonu ancak sunucudan uygun eylem bildirimi geldiğinde tetiklenir; mevcut savaş sunucusu her eylem için ayrı animasyon sinyali yayınlamaz.
- `graphics-3d.js`: 3B karakterlerin hareketli eklem noktaları üzerinden çizimi; kahraman / birlik siluetleri, zırh parçaları ve savaş gölgeleri; kullanıcı kahramanını izleyen kamera; aynı kamera matrisine bağlı doğru dokunmatik nokta dönüşümü. Gerçek 3B geometri ve WebGL2 derinlik testi korunur.
- `graphics-3d-performance.js`: Kare süresi istatistiklerine göre çözünürlük ölçeğini sınırlı şekilde düşürüp yükselten denetleyici. FPS garantisi değildir; GPU profil ölçümü yerine geçen bir araç değildir.
- WebGL bağlamı kaybolursa çizim geçici durur; bağlam geri geldiğinde GPU shader / buffer / geometri yüklemeleri tekrar hazırlanır.
- `graphics-3d-preview.html`: Kamera takibi ve kalite ayarlarının deneysel gösterimi; canlı çok oyunculu oyun değildir.
- `battle-render-adapter.js`: 3B motorun gerçek maç ekranında takip kamerasını kullanması. 2.5B yedek çizim motoru ve mevcut sunucu mantığı korunmuştur.

## Otomatik testler

- `npm run qa:all` — **142/142 başarılı**. Oyun, ekonomi, tek oyunculu savaş, klan, çevrim içi eşleşme, takım kuşatması, grafik matematiği, prosedürel rig, adaptif çözünürlük, kamera / ekran hedefleme ve mock WebGL kurtarma testleri.
- Yeni 3B çizim testleri **sahte (mock) WebGL API** ile yapılmıştır; gerçek GPU shader derlemesi, görüntü kalitesi veya mobil FPS kanıtı değildir.
- Yeni kaynaklar HTTP 200 ile sunulmuştur. ZIP dosyaları sıfırdan çıkartılıp otomatik testler tekrar çalıştırılmıştır.

## Henüz doğrulanamayanlar

- Bu ortamın Chromium'u WebGL/WebGL2 bağlamı oluşturamadı; yerel web sayfası tarayıcı erişim kısıtıyla engellendi. **Gerçek GPU 3B görüntüsü doğrulanmadı.**
- Android/iPhone yatay ekran gerçek cihaz FPS, pil, RAM ve GPU ısınma testleri yapılmadı.
- Profesyonel GLB/glTF 3B modeller, PBR materyaller, HDR ışık, gerçek gölgeler, iskelet animasyonları, doğal hareket geçişleri ve optimize edilmiş LOD henüz yok.
- Gerçek internet ortamında büyük klan savaşı / rekabetçi kullanım için sunucu güvenlik, gecikme ve yük testleri yeterli değildir.

## Kullanıcı kabul kontrolleri

1. `npm start` ile oyun açılır. `http://127.0.0.1:8767/starfort/graphics-3d-preview.html` sayfasında `3B GPU etkin` görülürse tarayıcının 3B bağlamı oluşmuştur.
2. Kamera `Kahramanı izle` / `Savaş alanı` olarak değiştirildiğinde görünüm kaymalı.
3. Kapıyı zayıflat düğmesi kapının görünüşünü değiştirmeli. Yere dokunarak hedef seçmek kahraman konumuna göre doğru çalışmalı.
4. Kendi telefonunda yatay (landscape) 5v5 maçta Ultra ve Performans modlarını karşılaştırarak gerçek FPS ve aşırı ısınma olup olmadığını kontrol et.
5. 3B desteklenmiyorsa 2.5B yedek moduna geç; kalıcı hesaplar ve maç durumları değişmemeli.
