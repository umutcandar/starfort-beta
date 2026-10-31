# Starfort v2.1 — Grafik ve oyun kalite kontrol raporu

## Test edilen geliştirmeler
- WebGL2 / Canvas2D ortak render sahnesi için eklenmiş sunucudan bağımsız animasyon pozları, büyü ve darbe efektleri.
- Perspective-ground projeksiyonu ve dokunmatik hedef seçimi ters dönüşümü.
- Fotoğraf taş dokulu dört aşamalı kapı görüntüsü, koçbaşı tozu, kırılma molozu, VFX bütçe profilleri.
- Yatay mobil savaş alanında cover yerleşimi, kırpılan bölgelerde hedef seçimi matematiği.
- Eski oyun kurallarının, kale ilerlemesinin, PvE ve yerel çok oyunculu servis testlerinin regresyonu.

## Geçen kontroller
- `npm run qa:all`: **124 test geçti, 0 başarısız**.
- Savaş grafik motoru Chromium in-memory Canvas2D testinde 1440×900 ve 844×390 tarayıcı boyutlarında çizildi; JavaScript hatası görülmedi.
- Sahne için 7/7 temel görsel ve 4/4 yeni kale kapısı görseli yüklendi.
- Yerel Node sunucusu `/starfort/`, yeni JavaScript dosyaları, kapı varlıkları ve laboratuvar sayfasına HTTP **200** döndürdü.
- Savaşa ait poz/hareket durumları, efekt süresi ve kapı aşaması gibi görseller oyunun sunucu hasar hesaplarını değiştirmez.

## Önemli sınırlar
- Grafik denemeleri **Canvas2D-v2 yedek motorunda** görüntülendi. Chromium ortamında WebGL2 erişilemedi; WebGL2 gerçek GPU üzerinde doğrulanmadı.
- Gösterilen ekranlar canlı 5v5 savaş görüntüsü değil, sentetik render örnekleridir.
- Fiziksel iPhone / Android FPS, ısı/bellek, çevrim içi gecikme ve tam maç kullanıcı deneyimi kontrol edilmedi.
- Animasyonlar gerçek kemik animasyonu/3B karakter değildir; tek kareli 2B görsel tabanı sürer. Kale mimarisi de 2.5B doku katmanıdır. Ultra/AAA kalite hedefi **tamamlanmış değildir**.
- Geliştirme sunucusu üretime hazır güvenlik altyapısı değildir.

## Yeniden test
```bash
npm run qa:all
npm start
```
Oyunu `http://127.0.0.1:8767/starfort/` adresinde; grafik deney sahnesini `/starfort/graphics-v2-preview.html` yolunda aç. Çok oyunculu mod için aynı Node sunucusuna bağlanan farklı oyuncu hesapları gerekir.
