# STARFORT v2.47 — Tek kapsamlı global yerelleştirme paketi

**Durum: TASLAK — YAYINLANMAZ.** Tek GitHub PR: #32. Oyuncular hâlâ v2.46 GitHub Pages / v2.45 Render üzerinde olabilir. Ayrı ayrı “dil sürümü” yayımlanmayacak.

## Neden bu değişiklik?

v2.43–v2.46 arasında dil seçici 14 dil oldu, ancak 12 ek dilde çoğu hikâye, kahraman ve mod uzun metni İngilizceye düşüyordu. Bu **tam çeviri** değildir. Oyuncu 14 dil seçeneği gördüğü için hem görünür ekranların hem de hata/öykü metinlerinin seçtiği dilde olmasını bekler. Bundan sonra küçük dağıtımlar yerine bu PR içinde tek kabul kriteri uygulanacak.

## Ürün yüzeyleri — tek PR içinde tamamlanacaklar

| Yüzey | Mevcut çalışma | Global çıkış öncesi tamamlanması gereken |
|---|---|---|
| Hesap / şifre sıfırlama | v2.44'ten beri 14 dil beta | Tüm doğrulama ve sunucu hata durumlarının 14 dilde tam kontrolü |
| Navigasyon / ayarlar | v2.44 çekirdeği | Menü, ipucu, erişilebilirlik ve durum bildirimlerinin denetlenmesi |
| Köy / 7 bina / inşaat 20 seviye | v2.45 İngilizce içerik | 12 ek dil, tüm mimari aşamalar ve dinamik ipuçları |
| Kahramanlar / 9 karakter / yetenekler | v2.45 İngilizce içerik | 12 ek dil, ekran okuyucu ve grafik alt metinleri |
| Envanter / 19 eşya / 4 kaynak | v2.46 düğmeler 14 dilde, lore EN | Eşya açıklamaları, setler ve ustalık metinleri 12 ek dilde |
| Ana hikâye 8 bölge / 24 görev | v2.45 İngilizce yedek | 12 ek dilde bölüm/görev açıklamaları |
| İkinci perde 8 bölge / 24 görev | v2.45 İngilizce yedek | 12 ek dilde bölüm/görev açıklamaları ve özel yetenekler |
| Labirent / 16 kat | v2.47 taslak: 14 dil ortak etiketler, uzun metin EN | Oda, görev, çevresel olaylar ve dinamik olay metinleri |
| Günlük ödül 28 günlük döngü | v2.45: 39 anahtar ×14 | Yerel tarih biçimi, gün uzunluğu, UTC ve RTL testleri |
| Kervan pazarı / sunucu takası | v2.47 taslak: ana düğmeler 14 dil | 3 rota açıklaması, sınır ve hata mesajları |
| Cephe / ikmal / savaş sandığı | v2.47 taslak: ana düğmeler 14 dil | Doktrinler, ödül ve kural metinleri 12 dilde |
| 30 kalıcı Komutan Kroniği rütbesi | v2.47 taslak: arayüz 14 dil, rütbe EN | 30 unvanın bütün dillerde tutarlı terminolojisi |
| Premium vitrin / 8 kozmetik / 4 ücretsiz ödül | v2.47 taslak, ödemeler kapalı | 12 dilde ürün adı/açıklaması, ödeme yok durumunun hukukî kontrolü |
| Arena 1v1 / bot / canlı eşleşme | v2.47 taslak: giriş ve bir kısım durum mesajı | Bütün bekleme/yeniden bağlantı/maç sonucu, grafik ve dokunmatik kontroller |
| Takım arena / 2v2 / 5v5 / kuşatma | Başka dilde metinler kısmen eksik | Eşleşme, takım emirleri, minimap, sonuc ekranları ve ipuçları |
| Lonca / ittifak / parti / baskın | Büyük ölçüde Türkçe | Tam üyelik, davet, sohbet, sıralama, baskın ve hata akışları |
| Sezon / haftalık yarık / görevler | Karışık Türkçe ve İngilizce | Tüm tekrar eden hedefler, sayaçlar, rütbeler ve erişilebilirlik |
| Hikâye günlüğü / dünya yazıları | Çoğunlukla Türkçe | Bölüm anlatıları, sinematikler, görev sonuçları, 14 dilde sesli anlatım (hakları uygun sesler) |
| Hata, ağ, sunucu ve güvenlik metinleri | Bazı EN yedekler | Güvenilir, oyuncuya gösterilen hata kodlarına dayalı 14 dilde açıklamalar |
| Yasal / destek / mağaza koşulları | Tam global yayına hazır değil | Ülke bazlı destek, gizlilik, ödeme açılırsa şartlar ve iade metinleri |

## v2.47'de kodlanmaya başlanan ortak yapı

- `locale-sections-v247.js`: **60 ortak ekran anahtarı ×14 gerçek dil**.
- `labyrinth-view.js`, `kingdom-caravan.js`, `warfront-v237.js`, `premium-store.js`, `premium-catalog.js`, `commander-chronicle.js`, `arena-view.js`: çeviri erişimini oyun kurallarından ayırmaya başlayan refaktör.
- `locale-v247.test.mjs`: gerçek arayüzlerde 14 dil ve değişmeyen kimlik / maliyet / ödül testleri.
- `scripts/i18n-coverage.mjs`: kaynak dosyalarını tarar; yeni sözlükleri ve riskli görünür Türkçe parçalarını raporlar. `--release-check` tamamlanmadığı sürece hata vermelidir.

## Tek yayın için zorunlu geçiş koşulları

1. Giriş, köy, kahraman, envanter, 8+8 hikâye, 48 görev, PvE, PvP, lonca, sezon, mağaza, kronikler ve günlük ödüllerde her dilde %100 gerekli anahtar.
2. Türkçe/İngilizce yedek kalan **oyuncuya gösterilen metin** yok; varsa ürün gereği gerekçesi testlerle belgelenmiş.
3. Oyun kimlikleri (`id`), `data-*` eylemleri, RPC adları, savaş matematiği, ödül miktarları, JWT ve UTC reset sabit.
4. Her dilde mobil düzen, etiket taşması, erişilebilirlik ve Arapça RTL doğrulanmış.
5. Resmî metinler deneyimli ana dili editörü tarafından kontrol edilmiş; otomatik çeviri tek başına yeterli kabul edilmemiş.
6. Sunucuyla gerçek oturum, 20 seviye uzun oyun, 1–3 yıldız, tekrar seferleri, günlük/haftalık ödüller, çevrim içi karşılaşma ve yeniden bağlanma testlerinden geçilmiş.
7. GitHub QA + Chromium + GitHub Pages + Render aynı **tek yayın commit SHA**'sını doğrulamış.
8. Bu PR taslaktan çıkarılıp **tek v2.47 final sürümü** olarak birleştirilecek.

**Not:** Yukarıdaki geliştirme listesi bir gelecek vaadi değil; mevcut tek paketin denetim ve yapılacak işler sınırını gösterir. Şu anda 14 dilde eksiksiz yerelleştirme tamamlanmış değildir.
