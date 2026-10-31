# Starfort Graphics Core v2 — Kalite Kontrol / 31 Ekim 2026

## Gerçekten yapılanlar
- Savaş render yolu, 1v1 ve takım/kuşatma görünümlerinde yeni **Graphics Core v2**'ye bağlandı.
- Yerel, bağımsız **WebGL2 doku/sprite, kamera, şeffaflık ve parçacık katmanı** geliştirildi; aynı sahne komutlarını kullanan Canvas2D yedek çizimi eklendi.
- Doku yükleme, birlik çizim sırası, hedef seçimi için kamera ters dönüşümü, sağlıklı oyuncu/asker göstergeleri, dört hasar durumu, koçbaşı çizimi, bayrak kontrol bölgeleri ve kalite profilleri eklendi.
- Çarpışma/hasar ve kuşatma zafer koşulları eski **sunucu yetkili** kodda kaldı; yeni render kodu saldırı kararı vermiyor.
- Yatay telefonda oyun koordinatlarını esnetmemek için `object-fit:contain` kullanıldı; yan boşluklar doğal.
- Yeni `graphics-v2-preview.html` üzerinde sunucudan bağımsız ekran testi yapılabilir. Bu sayfa **oyunun canlı maçı değil**; kaynak motorunun teknik deneme sahnesidir.

## Doğrulanan testler
- `npm run qa:all`: **118/118** (önceki 114 + 4 grafik matematiği) başarılı.
- Browser in-memory test: **1440×900 ve 844×390** ayrı ekranlarda, **7/7 görsel varlığı yükledi**; yeni sahne çizildi; sayfa kaynaklı JavaScript hatası **0**.
- Tarayıcıda WebGL2 donanımı bu test ortamında etkinleştirilemedi; burada test edilen motor **Canvas2D-v2** idi. **WebGL2 shader'ları fiziksel GPU üzerinde uçtan uca doğrulanmadı.**
- Bağımsız kamera ileri/geri dönüşüm testi; grafik kalite profilleri ve reduce-motion matematik testleri geçti.
- Paketleme sonrası yeniden test ve sunucu dosyası erişim kontrolü yapılmıştır (sonuçlar ayrıca komut çıktılarında).

## Bilinen kalite açıkları
- Yenilik bir **teknik altyapı değişimi**, henüz AAA / üst düzey nihai grafik kalitesi değildir.
- Profesyonel animasyonlu model/sprite takımları ve sanat yönetimi için yeni, tutarlı lisanslı varlıklar gerekiyor. Şimdiki karakterler tek kareli illüstrasyon temelli.
- Gerçek telefonlarda GPU FPS, ısınma, bellek, çok oyunculu 5v5 gecikme ve stres testleri yapılmadı.
- 5v5/klan sunucusu geliştirme prototipidir; internete açık güvenli üretim altyapısı olarak değerlendirilmemelidir.
- Yerel hesap, kayıt ve eski ekonomi sistemleri değiştirilmedi; kapsamlı ürün testi gereklidir.

## Tekrar çalıştırma
```
npm run qa:all
npm start
```
Oyun: `http://127.0.0.1:8767/starfort/`; grafik laboratuvarı `http://127.0.0.1:8767/starfort/graphics-v2-preview.html`.
