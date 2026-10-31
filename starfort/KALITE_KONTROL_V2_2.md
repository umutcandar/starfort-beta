# Starfort v2.2 — Grafik atlasları kalite kontrolü

**Durum:** Ara geliştirme sürümü. Bitmiş ürün veya AAA 3B oyun değil.

## Kod ve içerik
- WebGL2/Canvas2D sahnelerine şeffaf 2.5B animasyon atlasları bağlandı; savaş hesapları ve sunucu protokolü değiştirilmedi.
- 6 birim çizimi × 6 durum × 6 kare = **216 önceden hazırlanmış görsel kare**. Durumlar: idle, run, attack, cast, hit, down (down atlası ilerideki ölüm sahnesi için hazır; ölü aktörler hâlen varsayılan sahnede gizlenir).
- Ayrı atlaslı yükleme; kaynak görsel, atlas yüklenene kadar ve Performans modunda geri dönüş olarak kullanılır.
- Performans modunda atlasa ayrılan grafik belleği bırakılır; Ultra/Dengeli'ye dönülünce atlaslar yeniden yüklenir.
- `scripts/build-rig-atlases.py` varlıkları yeniden üretir; kaynak kod paketinde sunulur. Bu araç için Python, Pillow, NumPy ve OpenCV gereklidir; oyunu oynatmak için **gerekmez**.

## Doğrulananlar
- `npm run qa:all`: **127/127** test geçti, JS syntax kontrolü geçti (yerel araç ortamı).
- Her atlas `1152×1728` WebP. Altı atlasın tamamı yüklendi.
- Chromium `set_content` ile render: **1440×900** ve **844×390** ekranlarda JavaScript hatası yok, sayfa yatay taşma yok.
- Görsel test sırasında aktif sprite sayısı 201, ana sanat dosyaları 7/7, gate aşamaları 4/4, atlaslar 6/6.
- Her iki çözünürlükte kaliteyi **Ultra → Performans → Ultra** değiştirince atlas sayıları **6 → 0 → 6**; yükleme ve bellek bırakma kodları çalıştı.
- ZIP çıkarma sonrası aynı otomatik testler yeniden çalıştırıldı.

## Bilinen sınırlar ve yapılmayan testler
- Chromium test ortamı WebGL2'yi kullanamadı; gerçek çizim testi **Canvas2D yedek motorunda** yapıldı. Fiziksel telefon GPU, cihaz bazlı FPS, ısı/enerji ve bağlam kaybı geri yükleme testleri yapılmadı.
- Yerel tam web sayfasına tarayıcı erişimi `ERR_BLOCKED_BY_ADMINISTRATOR` nedeniyle engellendi. Render testi yalnızca bağımsız grafik sahnesidir; gerçek çevrim içi maçın uçtan uca testi **değildir**.
- Atlaslar, mevcut figür görsellerinin kontrollü 2B deformasyonuyla üretildi. Gerçek kemik animasyonu, 3B model, gerçek perspektif kamera veya animasyonlu 3B kale **yok**.
- Önceki kale kapısı ve savaş haritası sanat kalitesi hâlâ sinematik konsept görselinin altında. Bunların profesyonel varlıklarla değiştirilmesi gerekiyor.
- 20v20/50v50 ölçek, internete açık canlı servis, gecikme ve kötü niyetli kullanıcı yük testleri yapılmadı.
