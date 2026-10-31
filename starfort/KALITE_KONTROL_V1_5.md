# Starfort v1.5 — Kalite kontrol raporu

## Kapsam

**Yeni kodlar:** `team-renderer.js`, `siege-rules.js`, yenilenen `team-view.js`, `arena-view.js`, `team.css`, `arena.css`, `team-arena.js` ve `guild-server.mjs`; ayrıca altı yeni WebP birim görseli.

**Otomatik test:** `npm run qa:all` → **95 test başarılı / 0 başarısız**. Bunlar önceki 88 test + 5 kuşatma birim testi + 1 kuşatma HTTP testi + 1 sanat varlığı kontrol testidir.

### Yeni senaryolar

1. Kuşatma modu yalnızca 5v5'e açılır; başta kapı ve kristal HP sunucudan üretilir.
2. Kapı sağlamken geçiş sınırlandırılır; savunmacı kapıya hasar veremez.
3. Saldıran takım kapıyı kırdıktan sonra kristali yıkınca kazanır; süre dolarsa savunmacılar kazanır.
4. Kuşatma eşleşmesi normal sancak 5v5 kuyruğuyla karışmaz.
5. İki klanın beşer kişilik hazır kadrosu birbirine karışmadan kuşatmada eşleşir.
6. HTTP üzerinden 10 ayrı kayıtlı kullanıcı kuşatma maçına girer, sunucu durumunu paylaşır; saldırı ve komut doğrulanır.
7. Altı sprite ve savaş alanı WebP görselleri pakette yer alır; dosya biçimleri denetlenir.

### Görsel denetim

- `team-renderer.js` doğrudan Canvas2D uyumlu **Skia** bağlamında çalıştırıldı; 5v5 sancak ve 5v5 kuşatma sahneleri PNG olarak üretildi.
- Ekran görüntüleri **gerçek tarayıcı ekranı değil**, aynı render fonksiyonunun kontrollü sahne verileriyle oluşturduğu motor önizlemeleridir.
- Bu oturumda Chromium/Playwright yerel HTTP ve diğer sayfa gezinmelerini `ERR_BLOCKED_BY_ADMINISTRATOR` ile reddetti; bu nedenle v1.5 tarayıcı E2E ve mobil taşma testleri tamamlanmadı. Önceki sürümün başarılı testleri v1.5'e otomatik olarak genellenemez.

### Bilinen kısıtlar

- 5v5 tamamen kalabalıkken etiketler üst üste gelebilir; üretim sürümünde etiketi gruplama, kamera yakınlaştırma ve hedef öne çıkarma geliştirilmeli.
- 3B model, animasyon rig'i, skelet animasyonu, ray tracing veya AAA seviyesi görsel kalite yoktur. Yüksek kaliteli çizimlerle desteklenmiş 2B Canvas görselleri kullanılır.
- Tarayıcıdan çıkan veriler server-authoritative olsa da geliştirme sunucusu henüz internet ölçeğinde güvenli/performanslı değildir.
- Mobil FPS, erişilebilirlik ve animasyon pürüzsüzlüğü gerçek cihazda ölçülmedi.
- Tarihsel Three.js testleri `lib/three.module.js` eksikliği nedeniyle ana QA dışında.

## Sonuç

v1.5, yerel kullanıcı testine hazır **oynanabilir geliştirme sürümü**. Kesin ticari sürüm, yüksek yük ve çapraz cihaz kabulü için henüz hazır değil.
