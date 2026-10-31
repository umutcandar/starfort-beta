# STARFORT v2.5 — Grafik ve oynanış kalite kontrol raporu

**Durum:** Ara geliştirme sürümü. Grafik hedefi ve ticari yayın hazırlığı tamamlanmadı.

## Gerçekten uygulanan geliştirmeler

- `graphics-gltf.js`: GLB 2.0 dosyasında gömülü BIN, sahne düğümleri, pozisyon/normal, indeksli üçgenler, baz malzeme renkleri, TRS dönüşümleri ve LINEAR/STEP animasyon kanalı okuma. Ağ istekleri için `fetchGLB` yordamı.
- `assets/models/siege-gatehouse.glb`: 11 renkli malzeme grubu ve yaklaşık 2.018 üçgenden oluşan stilize kuşatma giriş yapısı. Bu model kendimiz ürettiğimiz bir geliştirme varlığıdır, profesyonel AAA karakter modeli değildir.
- `graphics-3d.js`: WebGL2 kuşatma sahnesi GLB kapı çevresi modelini asenkron alır, statik geometriye birleştirir, HP kaynaklı mevcut kapı ve çarpışma mantığını korur. Başarısız yüklemede kodla üretilen kale yedeği çalışmaya devam eder. GPU sabit geometri sadece model/yıkım aşaması/grafik kalitesi değişince yeniden yüklenir.
- `battle-render-adapter.js`: 3B takım savaşında eski 10000×6000 HUD koordinatları ile 1000×600 normalize 3B hedefleme arasındaki 10× ölçek uyumsuzluğu düzeltildi. Yatay ekran merkez hedefi 667×375, 844×390 ve 932×430 için matematiksel olarak doğrulandı.
- `graphics-3d-preview.html`: Asenkron GLB yük durumunu önizleme statüsüne yansıtır.

## Otomatik kalite kontrol

`npm run qa:all` ile **150 testin 150'si başarılı** (kod kontrolü + oyun, sunucu ve yeni GLB testleri).

Yeni testler:
- Basit ve çoklu erişimci GLB verilerini okuma, materyal rengi ve yüzey normali.
- GLB sahne animasyonu için LINEAR interpolasyon ve sürenin döngü davranışı.
- Bozuk dosya başlığı, sınır dışı accessor ve desteklenmeyen skin verisinin açık hata vermesi.
- Gerçek GLB modelin yerel dosyadan okunup üçgen verisine dönüştürülmesi ve 3B render tamponuna eklenmesi.
- 3B dokunmatik seçim ölçeğinin düzeltilmesi.

Paket çalıştırma / HTTP kontrolü: `npm start` veya `node guild-server.mjs` ile Node 20+ üzerinde yerel sunucu başlatılır. Yeni `.glb` varlığı yerel HTTP sunucusunda **200 OK** ve `application/octet-stream` ile sunuldu.

## Başarısız veya henüz yapılamayan kontroller

- Otomasyonun Chromium tarayıcısında yerel `127.0.0.1` site açılışı `ERR_BLOCKED_BY_ADMINISTRATOR` nedeniyle engellendi.
- Site yerine bellekte oluşturulmuş test sayfasında yazılım tabanlı GPU bayraklarıyla dahi **WebGL2 bağlamı açılamadı**. Bu yüzden **canlı GPU çizimi, GLSL derlemesi ve fiziksel telefonda FPS henüz doğrulanmadı**.
- Yüksek poligonlu profesyonel modeller, PBR doku/metal-pürüzlülük akışı, GPU skinning, kemik animasyonu, cascaded shadow maps, gerçek LOD, termal test ve kapsamlı ağ yük testi hâlâ eksik.
- GLB loader yalnızca tek gömülü BIN buffer, üçgen geometriler, temel materyal rengi ve düğüm animasyonu destekler. `skins`, gömülü texture/PBR map'leri, KHR uzantıları ve morph targets **desteklenmez**; uyumsuz skin dosyaları açık hatayla reddedilir.

**Karar:** v2.5 teknik ara sürüm; tüm kalite ve gerçek mobil GPU kıstasları sağlanmadan nihai/ultra grafik sürümü denilemez.
