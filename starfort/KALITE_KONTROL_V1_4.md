# Starfort v1.4 — kalite kontrol / kapsam

## Yeni özellikler

- `team-arena.js`: Klana özel, **atomik 2v2 ve 5v5 grup eşleştirme**. Mevcut solo takım kuyruğundan ayrıdır. Gruplar rakip klanla karşılaşınca mevcut sunucu doğrulamalı arena kurallarıyla savaşa girer.
- `guild-server.mjs`: `/api/team/party/queue` yalnızca ilgili klanın lideri için; `guild.warRoster` hazır durumları sunucu tarafında kontrol edilir. Hazır olmayan lider ve eksik kadrolar reddedilir.
- `team-view.js`, `team.css`: 'Klan 2v2' ve 'Klan 5v5' tuşları, takımla bekleme durumu ve klan adlarının okunması.
- Bekleme sırasında bir klan üyesi çıkarsa grup dağıtılır; 45 saniyeden uzun süre savaş ekranından kaybolan hazır oyuncunun klanı kuyruktan kaldırılır.
- Takım savaşındaki hasar, hareket, puanlama ve asker emirleri önceden olduğu gibi sunucuda doğrulanır; geçmiş oynanış/kale kaydı korunur.

## Çalıştırılan kalite kontrolleri

- `npm run qa:all`: **88/88 başarılı**, sözdizimi temiz.
- Oyun kuralları: İki klanı karıştırmadan aynı maçta karşı karşıya yerleştirme; takımın iptal edilmesi; süresi dolan üyelerin kuyruğu temizlemesi.
- HTTP entegrasyonu: Klan lideri yetkisi, hazır olma doğrulaması, iki farklı 2 kişilik klanın 2v2'de eşleşmesi, sunucuda emir verilmesi.
- Dört ayrı Playwright oturumu: iki klan, tüm üyeler hazır, liderler 'Klan 2v2' ile eşleşti; hareket ve emir senkronu çalıştı. Mobil sanal tuşlar görünür, yatay taşma ve JS hatası gözlenmedi. Test sunucusu ayrı HTTP köprüsüyle kullanıldı; bu, gerçek mobil cihazlar ve internet performansı testi yerine geçmez.

## Kısıtlar / planlanan geliştirmeler

- Klan takımı karşılaşmaları hâlâ **İki Sancak Muharebesi** haritasında. Yıkılabilir kale kapısı/kuşatma topu/20v20 henüz yok.
- Tam parti eşleşmesi yalnızca 2 veya 5 üyeyle yapılır. Parti davet/alt kadro seçimi, otomatik takım yerleşimi, klan ligi ve sesli sohbet yok.
- Oyun test sunucusu varsayılan yalnızca localhost üzerinde dinler. İnternete açılması güvenli değildir; gerçek kimlik sistemi, ağ güvenliği ve yük/perf. çalışması gerekir.
- Bekleme odaları RAM üzerindedir; sunucu kapanınca maçlar ve kuyruklar silinir. Tek oyunculu kayıtlar tarayıcıda tutulur; orijinal v1 kayıt sözleşmesi değiştirilmedi.
- Tarihsel Three.js testleri orijinal pakette bulunmayan `lib/three.module.js` nedeniyle ana test dizisine dahil değildir.
