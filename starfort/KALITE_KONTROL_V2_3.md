# STARFORT v2.3 · Kalite Kontrol

## Tamamlanan doğrulamalar
- `npm run qa:all`: **134/134 otomatik test başarılı** (oyun, ekonomi, klan/savaş API regresyonları, grafik matematiği ve 3B testleri).
- `node --check`: yeni grafik motoru, render adaptörü, takım/düello ekranları ve diğer oyun kodu sözdizimi hatasız.
- Perspektif kamera ve zemine dokunma eşleşmesi: merkez ve farklı koordinatlar için projeksiyon/ters projeksiyon testi.
- WebGL2 kullanılamadığında 3B motorun açık hata vermesi ve 2.5B yedek rotası.
- Mock WebGL2 bağlamı ile karakterler, kuşatma kapısı ve diğer geometri için draw çağrıları; statik geometri GPU'ya tekrar tekrar yüklenmiyor, yalnızca hasar evresi/kalite değişiminde yenileniyor.
- HTTP GET: `graphics-3d-preview.html`, `graphics-3d.js`, `graphics-3d-math.js`, `team-view.js` ve `arena-view.js` sunuluyor.
- Sürüm paketini sıfırdan açıp otomatik testler tekrar çalıştırıldı.

## Doğrulanamayanlar / kalan riskler
- Chromium'da yerel sunucu gezinmesi ERR_BLOCKED_BY_ADMINISTRATOR döndü; in-memory Chromium da WebGL2 context oluşturamadı. **Gerçek GPU shader derleme ve görsel sonuç doğrulanamadı.**
- Fiziksel telefon FPS, GPU sıcaklık ve pil ömrü ölçülmedi.
- 3B geometri şu anda prosedürel düşük poligon prototiptir; AAA grafik veya gerçekçi kemik animasyonu değildir.
- Çok oyunculu büyük ölçek testleri, rekabetçi sıralama ve sunucu güvenliği tamamlanmadı.

## Kullanıcı kabul testi önerisi
1. `graphics-3d-preview.html` açılıp '3B GPU etkin' bilgisi görülebilmeli; 'WebGL2 açılamadı' görülüyorsa GPU/tarayıcı desteği test edilmeli.
2. Kapıyı zayıflat düğmesi 3B kapının hasar durumunu değiştirmeli.
3. Gerçek maçta 3B ve 2.5B arasında geçiş oyunu bozmamalı.
4. Yatay mobilde joystick, hedef seçimi, kamera ve savaş komutları gerçek Android/iOS cihazlarda denenmeli.
5. Hareket ve hasar sonuçları sunucu durumuyla tutarlı kalmalı.
