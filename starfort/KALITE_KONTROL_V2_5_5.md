# STARFORT v2.5.5 — Birlik Komutları / Kalite Kontrol

**Durum:** Oynanabilir geliştirme sürümü; nihai ticari oyun veya AAA 3B grafik kalitesi değildir.

## Yapılanlar

- Takım / kuşatma modlarında **Tüm Birlikler / Öncü / Okçular** seçimi eklendi.
- `Takip`, `İlerle`, `Savun`, `Odaklan` komutları seçili birlik grubuna uygulanıyor; iki farklı birliğe birbirinden bağımsız emir verilebiliyor.
- Sunucu gelen `squad` parametresini yalnızca `all`, `guard`, `archer` olarak kabul ediyor; komutlar başka oyuncunun birliklerini değiştirmiyor.
- Bot kimlikleri artık hedef odaklama doğrulamasında destekleniyor; 5v5 bot kuşatmasında bot hedefleme reddedilmiyor.
- Birlik seçim butonlarında erişilebilir seçili durumu (`aria-pressed`) ve canlı emir geri bildirimi bulunuyor.
- 2.5B savaş renderer'ında seçili kendi birlikleri altın halka ile görsel olarak belirginleşiyor.
- Yatay mobil için seçici, yetenek/emir panelinin üstüne yerleştirildi (joystick alanını kapatmıyor).
- Tuşlar: `5` Tümü, `6` Öncü, `7` Okçular; `1–4` emirler.

## Test sonuçları

- `npm run qa:all` — **174/174 başarılı** (oyun kuralları, sunucu entegrasyonları, eski özellikler, yeni grup emirleri).
- Yeni otomatik testler: geçersiz grup hedeflerinin reddi, öncü/okçuya bağımsız emir, `all` emri, başka oyuncu emirlerinin etkilenmemesi, bot kimliğine odaklanma.
- Yerel gerçek HTTP denemesi: yeni oyuncu kaydı → Zor bot 5v5 kuşatma → 9 botla oda → okçulara bot odak emri → öncüye ayrı ilerle emri → maçtan çıkış. **Geçti.**
- Chromium HTML/CSS düzen kontrolü (gerçek sunucu oyun sayfası olmadan oluşturulan kontrol görünümü): **667×375, 844×390, 932×430** yatay ekranlarda butonların sayfa dışına taşması yok. Bu bir gerçek maç ekran görüntüsü değildir.
- Doğrudan Chromium `127.0.0.1` oyun sayfasını bu ortamda `ERR_BLOCKED_BY_ADMINISTRATOR` yüzünden açamadı. Bu nedenle **tam tarayıcı menü/savaş uçtan uca testi geçmiş sayılmaz**.
- Fiziksel telefon GPU/FPS testi ve gerçek ağda yük testi bu turda yapılmadı.

## Açık kalite hedefleri

Gerçek, detaylı 3B karakter ve mimari varlıklar; animasyon, kaplama ve dinamik ışık kalitesi; 5v5 kuşatma grafik performansı; gerçek telefon testleri; geniş ölçekli gerçek oyuncu yük testleri. Deneysel 3B görünüm hâlâ önerilen varsayılan değildir.

## Çalıştırma

Node.js 20+, Mac `BAŞLAT.command`, Windows `BASLAT.bat` veya `node launch-starfort.mjs`. Başlangıç adresi `http://127.0.0.1:8897/starfort/`. Port doluysa Terminal'deki yeni adresi kullan. Kaydın başka portta ise önce eski oyundan kayıt yedeğini al.
