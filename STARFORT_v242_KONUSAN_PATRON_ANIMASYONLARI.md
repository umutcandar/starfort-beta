# STARFORT v2.42 — Konuşan Patron Animasyonları

**3 Kasım 2026 | Görsel kalite ve ses senkronizasyonu paketi**

- Dört farklı WebGL patronunun yüzüne özgün 3D ağız geometri parçası eklendi.
- Tarayıcıda Türkçe ses gerçekten başladığında yüz hareket ediyor; ses bittiğinde, hata verdiğinde veya kullanıcı seslendirmeyi kapattığında duruyor. İptal edilmiş eski repliğin yeni repliği kapatması önleniyor.
- Sunucu tarafından doğrulanmış patron niyetine göre ağır darbe için kol/pençe, kalkan için hale, can emme için uzuv/göz animasyonu var.
- Bunlar salt görsel tepkiler: istemci HP, hasar, kaynak, XP ve yıldız hesaplamıyor. v2.41 ekonomi korunuyor.
- Hareket azaltma erişilebilirlik seçeneği jestleri durduruyor; WebGL olmayan cihazlarda 2D yedek sahne ve altyazı kullanılıyor.
- Ses stüdyo kaydı değil, cihazın Türkçe TTS sesi; hareket gerçek ses dalgası analizi değil TTS'nin aktif olduğu süreye bağlı animasyon.

Yeni `shadow-expression-v242.test.mjs` ile dört yüz modeli, niyet geçişleri, hareket azaltma, TTS yarış koşulları ve 2D fallback test edilir.

**Sonraki çalışma:** gerçek oyuncu uzun süreli oyun testi, yeni boss varyantları ve güvenli çok oyunculu sistemlerin tamamlanması.
