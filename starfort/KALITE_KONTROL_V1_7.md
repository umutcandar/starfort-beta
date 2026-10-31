# STARFORT v1.7 — Kalite Kontrol Raporu
Tarih: 31 Ekim 2026
Durum: **Yerel, test edilmiş geliştirme prototipi; ticari canlı servis değil.**

## Yeni özellikler
- Animasyon ara katmanı (`battle-motion.js`), savaş istemcisine bağlandı; sunucu doğrulamalı oyun verileri mutasyona uğratılmadan görsel olarak yumuşatılır.
- Yürüyüş/salınım, yön, hasar tepkisi, saldırı ve dash izleri; Ultra modda atmosfer ve parçacık yoğunluğu artırıldı.
- Ultra / Dengeli / Performans kalitesi için ayrı sınırlar ve dinamik Canvas çözünürlüğü eklendi. Önceki Sinematik kayıt ayarı Ultra ile uyumlu.
- Mobil yatay tam ekran HUD'ında oyun sırasında kalite değiştirme düğmesi var; düşman seçim koordinatları iç Canvas çözünürlüğünden bağımsız tutuluyor.

## Otomatik testler
- `npm run qa:all`: **106 / 106 başarılı** (101 önceki test + 5 yeni animasyon/kalite testi).
- Sözdizimi kontrolleri: Başarılı.
- Yeni animasyon testleri: hareket ara geçişi, sunucu kaydı değişmezliği, hasar tepkisi, silinen oyuncu temizliği, kalite geçişi ve çözünürlük sınırları.
- Önceki sunucu / klan / takım / kuşatma otomatik entegrasyon testleri de geçti.

## Görsel kontroller
- Chromium, HTML `set_content` + gerçek `team-renderer.js` ve WebP kaynakları ile **1000×600 Ultra kuşatma Canvas'ı çizdi**; JavaScript hatası gözlenmedi. Önizleme: `Starfort_v1_7_Ultra_Kusatma_Onizleme.png`.
- Statik tam ekran savaş HUD yerleşimleri gerçek Chromium ile kontrol edildi: **667×375, 844×390, 932×430** yatay; ayrıca 390×844 dikey uyarı. Yatay görünümlerde joystick / komut paneli çakışmadı, yatay taşma saptanmadı.
- Chromium'da doğrudan yerel sunucu adresinde tam oyunun uçtan uca açılışı, ağ ortamının `ERR_BLOCKED_BY_ADMINISTRATOR` kısıtı sebebiyle yapılamadı. Statik HTML/CSS görsel testi, tam canlı maç testi **yerine geçmez**.
- Fiziksel iOS/Android cihazların gerçek FPS, ısınma/batarya tüketimi ve 10 fiziksel cihazla çevrim içi maç performansı henüz ölçülmedi.

## Sürüm sınırlamaları
- Bütün görüntüler Canvas 2D ve şeffaf WebP sprite varlıklarıyla üretilir; 3B/AAA içerik veya kemik tabanlı animasyon değildir.
- Sunucudaki savaşlar yerel geliştirme sistemidir: gerçek internet dağıtımı öncesi HTTPS, güvenilir kimlik doğrulama, kalıcı depolama, moderasyon, anti-cheat ve ağ altyapısı gerektirir.
- 20v20/50v50 henüz yoktur. 5v5 kale kuşatması prototipi korunur.
- Önceki yerel kaydın `starfort:v1` şeması değişmedi. Test edilmiş olsa da kullanıcıların Ayarlar bölümünden kayıt yedeği alması önerilir.

## Tekrar test etme
1. Node.js 20+ ile proje klasöründe `npm run qa:all`.
2. `npm start` ile yerel sunucuyu aç, `http://127.0.0.1:8767/starfort/` adresinde oyunu dene.
3. 5v5 kuşatma için 10 ayrı oyuncu oturumu gerekir. Grafik geçişini aktif maç sırasında sağ üstteki ✦ Ultra düğmesiyle test et.
4. İsteğe bağlı `npm run qa:watch`, terminal açık kaldığı sürece üç QA hattını her 5 dakikada kontrol eder.
