# STARFORT v2.45 — 14 dilde oyun akışlarını genişletme

**Tarih:** 3 Kasım 2026

## Eklenenler
- 14 dilin tamamında 28 günlük günlük ödül takvimi: 39 anahtar, 28 sandık, kaynak dökümü, 7/14/21/28 kilometre taşı, hediyeler, giriş serisi ve UTC reset açıklamaları.
- Oyuncu hesap durumunu veya ödül miktarlarını değiştirmeden `rewardCalendarMarkup` seçili dilde sunulur.
- 7 bina için İngilizce ad, açıklama ve üretim birimi yedeği; köy bina menüsü, etiketler ve geliştirme atölyesinde uluslararası görünüm.
- 8 ana hikâye bölgesi, 24 görev, 8 harita bölgesi için kaynak kimliğini değiştirmeyen İngilizce ad/açıklamalar.
- İkinci perde: 8 bölge, 24 görev ve sefer gereksinimlerinin İngilizce gösterimi.
- Resmî sunucu savaşında İngilizce metinler: komutlar, düşman niyetleri, ödül sonuçları, dünya patronu, sözleşmeler ve bazı erişilebilirlik etiketleri.
- 9 kahraman için İngilizce rol, unvan, karakter geçmişi ve yetenek açıklaması. Türkçe olmayan diğer diller şimdilik İngilizce yedek içerik kullanır.
- Bunlar yalnızca **sunum katmanıdır**. Sunucu `RPC` adları, JWT, savaş hareketleri, gerçek ödül miktarı, 28 günlük döngü ve UTC hak sahipliği hesapları aynı.

## Test edilecek değişmezler
- 14 dilin her birinde 28 sandık, 39 tam sözlük anahtarı, aynı 7. gün ödül miktarı ve sunucuya verilecek komutların aynı `data-*` isimleri.
- Kazanılan/henüz kazanılmamış sandık durumu yalnızca onaylı sunucu takviminden alınır.
- 7 bina, 8 sefer, 24 ilk-perde operasyonu, 8 dünya haritası bölgesi ve ikinci perdenin 8+24 içeriği orijinal ID/güç eşiğiyle eşleşir.
- Kahraman konumu ve yetenekleri değişse bile ekrandaki dil, savaş gücünü veya kaydı değiştirmez.

## Kritik eksikler (tam global yayına engel)
Bu paket tüm oyunun 14 dilde eksiksiz yerelleştirildiği anlamına **gelmez**. 12 ek dilde ana hikâye/ikinci perde/bina/kahraman uzun metinleri hâlâ İngilizce yedektir. `armory-v212.js` (eşyalar), `warfront-v237.js`, `premium-store.js`, `guild`, `arena`, `team-view`, `commander-chronicle`, `official-progress-coach`, senaryo günlükleri, bazı hata bildirimleri ve teknik senaryolar da tam uluslararasılaştırma kapsamı bekliyor. Ek çeviriler gerçek anadili editörlerinden kalite kontrol görmeli.

## Lansman ön koşulları
1. Her dilin ekran bazlı tamamlanma oranı ve terminoloji kılavuzu (çeviri anahtarlarının otomatik denetimi)
2. Gerçek mobil/RTL/ekran okuyucu testi
3. Kullanıcı sözleşmeleri, gizlilik, moderasyon, destek ve ülke bazlı yasal gereksinimler
4. Çok bölgeli gecikme ölçümü, canlı hesaplar ve yük testleri
5. **Render sürüm eşitliği**: 3 Kasım kontrolünde Render `v2.41` kodundan ilerlememiş. GitHub Pages başarılı olsa bile Render ayrı kaldığı sürece global oyuncu girişini canlı yayın olarak duyurmayın.

Kod güvenliği: UI sözlükleri hiçbir kimlik bilgisi, ödül miktarı, ekonomi kuralı veya ödeme verisi içermemeli.
