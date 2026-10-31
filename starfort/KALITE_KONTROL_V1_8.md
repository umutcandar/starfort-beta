# STARFORT v1.8 — Kalite Kontrol Raporu

Tarih: 31 Ekim 2026  
Durum: **Oynanabilir geliştirme sürümü; bitmiş ticari oyun değildir.**

## Bu turda geliştirilen modüller

- `siege-rules.js`: sunucu doğrulamalı eskortlu koçbaşı; kuşatma makinesi HP, menzil, saldırı bekleme süresi, yıkılma ve tekrar doğma.
- `team-arena.js`: savunan kahraman / askerlerin koçbaşına saldırması; ram ilerletme ve yıkım hesaplarının sunucu tick işlemine eklenmesi.
- `team-renderer.js`: çizim bazlı ahşap/demir kuşatma aracı, hareketli tekerlek/başlık, parçacık ve yıkım efektleri, kompakt bilgi etiketi.
- `battle-motion.js`: koçbaşı ağır darbe/yıkım olaylarını tekrarlı sarsıntı yaratmadan gösterebilen kamera tepkisi.
- `team-view.js`: klan kuşatması durum alanında koçbaşı canı ve durumunun gösterilmesi.
- `siege-ram.test.mjs`: 8 yeni test.

## Otomatik kontroller

- `npm run qa:all`: **114 başarılı / 0 başarısız**.
- Önceki 106 test ile yeni sekiz koçbaşı testi geçti. Mevcut 1v1/2v2/5v5, klan, sefer/ekipman, şehir, kayıt ve savaş özellikleri için eski testler korundu.
- Test edilen güvenlik oyun kuralları: saldıranın kendi koçbaşını vuramaması, sahte hasar verilerinin yok sayılması, eskort olmadan hareket/hasar olmaması, savunanın koçbaşını vurabilmesi, yeniden doğma zamanının sunucu tarafından tutulması, ana kapı yıkıldıktan sonra koçbaşının çekirdeğe vuramaması.

## Görsel ve düzen testleri

- Gerçek `team-renderer.js` ve WebP varlıkları Chromium'da Canvas üzerinde render edildi: **1000 × 600** çözünürlükte JavaScript hatası olmadı.
- Statik yatay ekran yerleşimi **667×375, 844×390, 932×430**, dikey uyarı **390×844** Chromium ile kontrol edildi. Joystick, butonlar ve HUD arasında yatay taşma saptanmadı.
- Uygulama modülleri `set_content` içinde çalıştırılarak desktop/mobile/landscape arayüz açılış testleri yapıldı. 3/3 geçti, JavaScript hatası saptanmadı.
- Render mikrobenchmark'ı örnek bir Chromium oturumunun 1000×600 boyutundaki **tek sahnesi** içindir; mobil cihaz FPS garantisi olarak kullanılmamalıdır.

## Sınırlamalar ve açık riskler

- Canlı sunucu üzerinden tam maçın tüm ekranlarını uçtan uca tarayıcı testi bu ortamda yapılmadı; görsel smoke testi gerçek internet bağlantısının yerine geçmez.
- Gerçek iOS/Android cihazlarda FPS, ısınma/batarya, ağ gecikmesi, 10 telefonla eşzamanlı mücadele ve uzun süreli yük testleri yapılmadı.
- Görseller Canvas 2D/şeffaf WebP temellidir; tam kemik animasyonlu 3B karakterler veya AAA üretim kalitesi yoktur.
- Bu prototip internete güvenli biçimde yayımlanmak için hazır değildir: HTTPS, kalıcı depolama, kimlik doğrulama sağlamlaştırma, rate limit, moderasyon ve çok sunuculu yapı gerekecektir.
- Klan savaşları yerel sunucuda takım eşleştirmesi seviyesindedir; büyük 20v20/50v50 modları ve gerçek cihaz performansı doğrulanmamıştır.

## Tekrar kontrol

1. Node.js 20 veya üzeriyle `npm run qa:all`.
2. `npm start` ve tarayıcıda `http://127.0.0.1:8767/starfort/`.
3. `Seferler → Kuşatma 5v5` ve farklı profillerde 10 hesap ile test. Sunucuyu güvenlik önlemleri olmadan internete açmayın.
4. `npm run qa:watch`, terminal açıkken periyodik QA çalıştırır. Sohbet kapalıyken kod geliştiren bir yapay zekâ ajanı değildir.
