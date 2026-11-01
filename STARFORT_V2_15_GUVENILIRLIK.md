# STARFORT v2.15.0 — oyuncu ilerlemesi ve güvenilirlik onarımları

## Bu sürümde düzeltilen doğrulanabilir durumlar

1. **İki sekmenin ilerlemeyi ezmesi:** `save-guard.js` açık sekmenin son bildiği yerel kayıtla mevcut depoyu karşılaştırır. Başka sekme daha yeni kayıt yazdıysa eski sekme veri yazamaz, oyuncuya yenileme uyarısı görünür. Bu, eşzamanlı çoklu-kaynak çatışmalarında otomatik birleştirme **yapmaz**; doğrudan kayıp riskine karşı fail-closed davranır.
2. **Bozuk içe aktarma:** Yedekler temel kaynağı, binaları, kahramanları, takım üyelerini ve var olan sezon/görev/labirent/aktif savaş verilerini doğrulamadan yüklenmez. `restoreState` hasarlı kayıtla sıfıra düştüğünde içe aktarma artık bunları başarı gibi kabul etmez.
3. **Tıkanan sezon:** 8 hikâye zaferi, 8 yetenek, 4 tekrar zaferi, 4 usta zaferi, 4 taktik değişimi ve 1 yarık zaferi tamamı tekrar yapılabilen PvE eylemleridir. 29 puana bina/kahraman/yıldız/labirent maksimumdayken de ulaşılabilir. Aynı sezonun önceki kazanımları korunur.
4. **Gece yarısı:** Oyuncunun gerçek canlı savaşı veya yeteneği artık açık sekme önceki günde başlatılmış olsa bile eylem zamanını kullanır. Simüle saatle test edilen eski turn-based kayıtların davranışı korunur.
5. **Yanlış tekrar düğmesi:** Usta seferi kendi derecesiyle, haftalık yarık aynı meydan okuma türüyle yeniden başlatılır; normal hikâyeye düşülmez.
6. **Sıkışan HTTP kuyruğu:** Sağlık yolu ve statik dosyalar global veritabanı yazma kuyruğundan ayrıldı. POST isteği gövdesi, sıraya girmeden önce okunur. Eksik gövdeli istemci tüm sunucuyu bloke edemez.
7. **Yeniden bağlanan arena istemcisi:** Sunucu son kabul edilen komut numarasını sadece ilgili oyuncuya gönderir; 1v1 ve takım arayüzü komut sayacını buradan devam ettirir.
8. **Telefon arayüzü:** Yatay ekranda çanta ızgarası ile seçili eşyayı aynı sırada gösterir; sefer kartı açıksa köy bina etiketleri çok uzakta bir konuma kaydırılmaz.

## Açık kalan sınırlar

- Supabase Auth hesabı ile legacy beta lonca anahtarı hâlâ ayrı. Hesaplar birleşmiş veya otomatik çift yönlü senkronizasyon tamamlanmış değildir. E-posta şifre kurtarma UX'i ayrı güvenlik işi.
- GitHub Pages hâlâ canlı insan eşleşmesini sunmuyor. Node eşleşmesi çalışıyor ancak Render ücretsiz plandaki `/tmp` guild JSON verileri **kalıcı değil**; kalıcı üretim barındırması ayrıca gerekir.
- Köydeki kahraman kimliği henüz arena rollerini belirlemiyor. Rekabetçi kurallarda böyle değişiklik, sunucu bazlı dengeli yetenek tasarımı ve ayrı test gerektirir.
- `save-guard` bir veritabanı işlemi / bulut CAS değildir. Aynı milisaniyede farklı sekmelerin gerçekten paralel depolama erişimi için tam transaction garantisi vermez. İki sekme, bozuk import ve giriş/çıkış kaybı risklerine karşı koruma sağlanmıştır.
- Sürekli açık canlı PvP, para/ekonomi otoritesi veya ücretli içerik bu beta güncellemesiyle açılmadı.

## QA

`npm run qa:all`, gerçek Chromium geniş ve telefon yatay görüntü testi; `progress-safety.test.mjs` ve `reconnect-server-safety.test.mjs` ile veri kaybı ve sunucu yük testleri.
