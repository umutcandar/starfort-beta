# STARFORT v2.5.3 — Kapsamlı kalite kontrol

Tarih: 31 Ekim 2026. Durum: **Test edilmiş geliştirme sürümü; ticari/nihai sürüm değil.**

## Değişiklikler

1. Seferler ana sayfasına doğrudan **Botla 1v1** ve **Tek Kişilik 5v5 Kuşatma** hızlı başlatma eklendi. Test hesabı yoksa sadece kullanıcı düğmeye bastığında otomatik açılıyor. Ana köy ilerlemesine dokunulmuyor.
2. Önceki ZIP'teki sunucu hesabıyla açılan geçersiz oturum anahtarının otomatik yenilenmesi eklendi. İttifak ekranında eski oturum anahtarı bulunamazsa komutan kaydı ekranına dönülüyor.
3. 1v1 / takım bot antrenmanlarından çıkışta gereksiz pratik odaları hemen temizleniyor. Art arda 50 yeniden başlatma testi eklendi.
4. **Kuşatma Tatbikatı** üzerindeki kareli debug ızgara çıkarıldı; resimli zemin, karakter figürleri ve ayrıntılı kapı grafiği eklendi. Bu hâlâ 2B çizimdir.
5. Güncel olmayan alt menü sürüm yazısı, eski '5v5 yok' açıklaması, başlatıcı/HTML sürüm metinleri yenilendi.
6. Güncel uygulamada çağrılmayan ve eksik `../lib/three.module.js` bağımlılığı olan eski sahne prototipi ve iki eski test dosyası dağıtımdan çıkarıldı. Geçerli çizim sistemi korunuyor.
7. Pakete 8 bölümlü hikâye akışını, tekrar oynama odalarını, bot yaşam döngüsünü ve gerçek HTTP sunucusu üzerinden kayıt/klan/savaş isteklerini kapsayan yeni testler eklendi.

## Test özeti

**163/163 otomatik test başarılı.** Komut: `npm run qa:all`.

| Alan | Yapılan doğrulama | Sonuç |
|---|---|---|
| Köy ve binalar | Yeni kayıt, maliyet/limitler, üretim tahsilatı, yükseltme, bozuk kayıt | Başarılı (birim/entegrasyon) |
| Kahramanlar | Seviye, takım dizilimi, güç hesapları | Başarılı (birim) |
| Ekipman | Üretme, kuşanma, çıkarma, ilk zafer ganimetleri | Başarılı (birim) |
| Sekiz sefer | 1’den 8’e kadar canlı savaş simülasyonu, ardışık kilit açma, ganimet, kayıt yedek/geri yükleme | Başarılı (simülasyon) |
| 1v1 PvP ve bot | Giriş, hareket, saldırı, botla maç sonucuna kadar ilerleme, tekrar maç | Başarılı (servis/HTTP) |
| 2v2 ve 5v5 bot | 2v2/5v5 tam maç, koordinat ve HP kontrolü, sonuç, çıkış | Başarılı (simülasyon) |
| 5v5 kuşatma | 10 oyunculu bot odası, koçbaşı, kapı/kristal, maç bitişi, ayrılma | Başarılı (servis/simülasyon) |
| Klan | Kayıt, klan oluşturma/katılma, hazır kadro, lider planı, baskın, sunucu API | Başarılı (HTTP ve entegrasyon) |
| Tek kişi 50 tekrar | Bot maçından çıkıp yeniden başlatma; oda birikimi yok | Başarılı |
| Paket ve güvenlik | Eksik import/asset araması, saklı sunucu dosyasına erişim engeli, yayınlanan dosyalar | Başarılı |
| Grafik | Görsel referans bütünlüğü, JavaScript sözdizimi, eski SVG/Canvas kaynakları | Başarılı (statik) |

## Test sınırlamaları (açık eksikler)

- **Gerçek tarayıcıdan baştan sona tıklama, mobil Safari/Chrome ekran görüntüsü ve fiziksel telefon GPU/FPS testleri tamamlanmadı.** Bu ortamda Playwright/Chromium gezinmesi `ERR_BLOCKED_BY_ADMINISTRATOR` ile engellendi. Bu rapor bunları başarılı saymaz.
- Deneysel **3B modu düşük detaylıdır**. Profesyonel 3B karakter modeli, PBR malzemeler, iskelet animasyonu, gölge kalitesi ve yük testleri hâlâ geliştirilmelidir.
- Gerçek internet şartlarında 10 fiziksel oyuncunun eşzamanlı 5v5 gecikme/yük testi yapılmadı.
- Yerel sunucunun oyuncu kimliği modeli ticari canlı sunucu için güvenli kimlik doğrulama yerine geçmez.
- Yatay mobil ekranın fiziksel dokunmatik ergonomisi ve performansı gerçek cihazlarda tekrar değerlendirilmeli.

## Çalıştırma

ZIP'i tamamen çıkartın. macOS: `BAŞLAT.command` (güvenlik engelinde terminalde `node launch-starfort.mjs`). Windows: `BASLAT.bat`. Node.js 20+ gereklidir.

Varsayılan adres `http://127.0.0.1:8897/starfort/`. Port doluysa başlatıcı bir sonrakini seçer; **Terminal'in yazdığı adres esas alınmalıdır**. Tarayıcı port değişince yerel kayıt alanı da değişebilir; eski porttaki köy yedeğini **Ayarlar > Kayıt dosyasını indir** ile alıp yeni porta içe aktarın.

Tek başına test: **Seferler > Botla 1v1** veya **Seferler > Botlarla 5v5 Kuşatma**. Bunlar ödülsüz antrenmandır. Normal PvE: **Seferler > Bölüm 1…8**. Klan: **İttifak**.
