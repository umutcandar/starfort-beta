# Starfort v1.6 — Kalite kontrol

**Kapsam:** v1.5 üzerine mobil yatay ekran odaklı 1v1 ve takım/klan savaş arayüzü.

## Tamamlanan geliştirmeler

- `mobile-controls.js`: analog sanal joystick; ölü bölge ve kademeli hız; klavye ve joystick vektörü birleştirme; el çekilince veya pencere odak kaybında hareketin durdurulması; pointer-capture ve dinleyici temizliği.
- `team-view.js` ve `arena-view.js`: joystick ve maç durumuna göre tam ekran HUD; isteğe bağlı tam ekran butonu, Köy'e dönüş, eski klavye/tuş kontrolünün korunması.
- `mobile-landscape.css`: 667×375, 844×390 ve 932×430 yatay ekranlarda savaş alanını kaplayan düzen; ekran kenarı boşlukları, düşük ekranda komutların sıkıştırılması ve tuşların joystick'ten ayrı kalması. Dikeyde yatay oynama uyarısı.
- `battlePoint`: Canvas 1000×600 çiziminin ekranda `object-fit: contain` ile oluşan kenar boşluklarını hesaba katan hedef dokunma dönüşümü.
- `index.html` ve dokümantasyon güncellendi. Mevcut kayıtlara, oyun ekonomisine, saldırı hesaplarına veya klan veri dosyasına müdahale edilmedi.

## Test sonuçları

1. `npm run qa:all`: **101/101 başarılı**; sözdizimi, PvE, binalar, kayıtlar, 1v1, 2v2, 5v5, kuşatma, klan, grafik dosyaları ve yeni joystick testleri dahil.
2. Yeni birim testleri: joystick dead-zone, yön ve hız normalizasyonu, ters yön klavye önceliği, parmak bırakma/boş eleman, letterbox alanına yanlış tıklamayı önleme ve analog paketin sunucu doğrulamasıyla uyumluluğu.
3. Chromium'da **gerçek uygulama URL'sine gezinme** `net::ERR_BLOCKED_BY_ADMINISTRATOR` engeline takıldı. Bu yüzden gerçek HTML/JavaScript oyununu tarayıcıda açıp 1v1/5v5'i oynama testi **bu turda yapılamadı**.
4. Bunun yerine proje dosyasındaki gerçek `team-view.js` HTML iskeleti ve gerçek CSS dosyaları Chromium'un `page.set_content` yöntemiyle yüklenerek **statik yerleşim** sınandı. Yatay 667×375, 844×390 ve 932×430 ölçülerinde aktif HUD ekranı kapladı, joystick ve savaş butonları kesişmedi, yatay taşma olmadı; 390×844 dikey ölçüde eski dikey düzen görüldü. Bu bir **yerleşim simülasyonudur, çalışan oyunun ekran görüntüsü değildir**.
5. Yerel sunucu HTTP `/api/status` yanıtı başarılı; paket sonrası temiz test ayrıca yürütülür.

## Bilinen sınırlar / üretim sürümüne geçmeden yapılacaklar

- Fiziksel iPhone/Android yatay dokunmatik, yüksek DPI, çentik/güvenli alan, sanal joystick tepkimesi, kare/saniye ve gecikme testi tamamlanmadı.
- 5v5 savaş, mobilde çok sayıda karakter/isim üst üste gelebilir; yakınlaştırma, etiket gizleme ve hedef önceliklendirme geliştirilmeli.
- Savaş ekranı sinematik Canvas2D teknolojisi kullanır, AAA 3B model/iskelet animasyonu değildir.
- Sunucu bir geliştirme prototipidir: üretim ortamında HTTPS, hesap güvenliği, kalıcı oturum, hile önleme, yük/latency testleri, moderasyon gereklidir.
- Orijinal kaynakta bulunmayan `lib/three.module.js` yüzünden eski 3B testler aktif koşumda değildir.

**Durum:** v1.6 yerel denemeye hazır geliştirme paketi; ticari çıkış veya tam mobil cihaz sertifikasyonu anlamına gelmez.
