# Starfort v2.6.1 — Kalite kontrol raporu

**Durum:** Oynanabilir geliştirme prototipi; grafik / performans açısından son sürüm değil.

## Geliştirme kapsamı

1. `battle-director.js`: Sunucu durumundan türetilen saldırı, savunma, eskort, kapı yıkımı, çekirdek, sancak, yeniden doğuş ve maç sonucu hedefleri; oyun kurallarına müdahale etmez.
2. `team-view.js`: Canlı hedef kartı; mini harita aç/kapat (M ve dokunmatik buton), hatalı ağ isteğinde tek seferlik saldırı komutunu tekrar deneme, güncel arayüz sürüm etiketi.
3. `team.css`, `mobile-landscape.css`: Kapsamlı aktif maç HUD düzeni; skor ve saat artık eski CSS tarafından gizlenmiyor; küçük ekranlarda hedef, mini harita, yetenek ve birlik kontrolleri birbirine girmiyor.
4. `index.html`, `launch-starfort.mjs`, `package.json`, `README.md`: v2.6.1 sürüm açıklamaları ve test yapılandırması.

## Doğrulamalar

- `npm run qa:all`: **184/184 başarılı.** Eski 181 otomatik test + yeni hedef rehberi için 3 test.
- Yeni testler: saldıran/savunan kuşatma aşamaları, koçbaşı kaybı, kapı ve çekirdek, sancak kontrolü, yeniden doğuş, maç sonucu, geçersiz veri halinde güvenli ilerleme yüzdesi.
- 667×375, 844×390, 932×430 yatay ve 1440×900 masaüstü için gerçek CSS + HTML ile Chromium `set_content` düzen denemesi yapıldı. Yatay ekranlarda skor/süre, joystick, mini harita, hedef ve birlik komutlarının konumları incelendi. **Bu bir canlı maç ekranı testi değildir.**
- Yerel HTTP sunucusu oyun sayfasını `200 OK` ile sundu.
- Temiz ZIP çıkartma ve yeni klasörden `npm run qa:all` tekrar kontrolü yapıldı.

## Bilinen sınırlar

- Yerel adresi Chromium `page.goto` ile açma girişimi ortam güvenlik kuralı `ERR_BLOCKED_BY_ADMINISTRATOR` nedeniyle engellendi. Oyunun bütün menülerinin kullanıcı gibi tıklanarak uçtan uca doğrulandığı iddia edilmez.
- Fiziksel Android / iPhone üzerinde FPS, WebGL2, ısınma, bellek, tam ekran ve gerçek çevrim içi 10 cihaz testi yapılmadı.
- Düşük detaylı deneysel 3B savaş varlıkları **henüz profesyonel sinematik/AAA kalite değildir**. 3B mod isteğe bağlıdır; varsayılan 2.5B korunur.
- Yerel test sunucusunu güvenlik sertleştirmesi, kimlik doğrulama, TLS, yetkilendirme denetimleri ve yük testi olmadan halka açık sunucu olarak yayınlamayın.

## Çalıştırma

Node.js 20+; Mac: `BAŞLAT.command`; Windows: `BASLAT.bat`; terminal: `npm start`. Başlangıç portu 8897; doluysa boş port seçilir. Oyun: `http://127.0.0.1:8897/starfort/` veya terminalde gösterilen adres. Farklı portlarda tarayıcı kayıtları ayrıdır; önceki porttan oyun yedeği alın.
