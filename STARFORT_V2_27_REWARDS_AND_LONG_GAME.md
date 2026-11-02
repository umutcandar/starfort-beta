# STARFORT v2.27 — Yıldız Sandıkları, Taktik Savaş ve 180 Günlük İlerleme Kontrolü

## Tek paket kapsamı
v2.27, önceki sürümde başlayan sunucu onaylı görsel savaşları **okunabilir düşman niyetleri** ile derinleştirir; ödül akışını sıradan bir “sandığı al” düğmesi olmaktan çıkarıp 28 günlük takvime dönüştürür; ilerleme ekonomisini 1–180 günlük senaryolarla doğrular. Eski sunucu köyü/ekipman/klan/mimari kayıtları silinmez.

## 28 günlük Yıldız Sandıkları
- Kullanıcı üstteki **GÜNLÜK ÖDÜL** düğmesini her gün açabilir; sandığı aldıktan sonra buton kapanmaz. Mobil/masaüstü erişilebilir pencere içinde 28 günün *hepsi* ve hangi sandıkların tamamlandığı gösterilir.
- **1–28. gün arasında artan** altın, kereste, taş ve yıldız özü; 7,14,21,28. günlerde çok daha büyük bonuslar ve garantili ekipman:
  - Gün 7: **Ay Işığı Sandığı**: 374 altın, 177 kereste, 160 taş, 28 yıldız özü, 1 Ay Tılsımı (`lunar_charm`)
  - Gün 14: **Kor Sandığı**: 658 altın, 309 kereste, 265 taş, 49 yıldız özü, 1 Kor Kılıcı (`ember_blade`)
  - Gün 21: **Yıldız Sandığı**: 1042 altın, 431 kereste, 380 taş, 80 yıldız özü, 1 Yıldız Merceği (`star_lens`)
  - Gün 28: **Kraliyet Sandığı**: 1626 altın, 663 kereste, 555 taş, 123 yıldız özü, 1 Kraliyet Kılıcı (`royal_blade`)
- Envanterde bu eşyanın 20 kopyası varsa ek kopya yerine **+250 yıldız özü** (kaynak sınırına tabi) verilir.
- 28. günün ardından **2. döngünün 1. günü** gelir; ödül takvimi tekrar oynanabilir. `claim_count` kalıcıdır.
- **Bir gün kaçırmak takvim ilerlemesini silmez.** Sadece ayrı gösterilen aralıksız giriş serisi tekrar 1 olur. Tarih sınırı sunucu saatiyle **UTC 00:00**.
- Giriş yapan hesabın ödül içeriği, tarihi, eşya ve günlük ustalık (+1) **Supabase RPC transaction'ında** hesaplanır. Önceki v2.24 günlük ödül yolu kapatılır; eski ve yeni sistemin aynı günde iki ödül vermesi mümkün olmaz. Aynı istek UUID ile tekrarlanırsa önceki yanıt döner.
- Misafir için aynı 28 günlük takvim **yerel deneme ilerlemesidir**; sunucu hesabına aktarılmaz. Eski `lastDailyReward` verisi yeni `dailyCalendar` alanına dikkatli şekilde yükseltilir.

## Resmî savaşın yeni taktik katmanı
- Düşmanın **bir sonraki hareketi önceden ve açıkça görünür**:
  - **Normal Saldırı**: standart karşılık
  - **Ağır Darbe**: özellikle **Siper** kullanılırsa ekstra azaltılan, aksi hâlde güçlenen hasar
  - **Kalkan Savunması**: normal vuruşu azaltır, kahramanların özel yetenekleri kalkanı aşar
  - **Can Emme**: düşman hayattaysa hasar verince kendi canını geri kazanır
- Niyet sunucunun göreve kaydettiği alandan gelir; tarayıcı sadece gösterir. Hamleler ve savaşı/ganimeti sunucu doğrular. Özel kahraman yetenekleri ve üç turluk cooldown korunur.
- Resmî karakter çizimleri saldırı/özel yetenek kullanıldığında ayrı efektler gösterir. Erişilebilir metinlerle düşman niyeti açıklanır. Bu çalışma **3D yerel motorun birebir sunucu motoruna taşınması değildir**; varlık ve eylem geri bildirimi ortaklaştırılır.

## Uzun vadeli denge ve testler
- `long-game-v227.test.mjs`: 1,7,30,90,180 günlük kaynak üretimi ve 28 günlük takvim katkısı, her gün/birkaç günde üretim toplama farkı, 24 saatlik offline üretim limiti, 20 seviyeli binaların inşaat süresi ve bir haftada yüksek seviyeye sıçranamaması.
- Bu bir **ekonomi ufuk simülasyonudur**; 180 gün boyunca PvE/PvP oynayan gerçek bir oyuncunun davranışını veya sunucu yükünü simüle etmez. Oyuncular gelmeden önce gerçek uzun süreli oynanış ve eş zamanlı yük testleri ayrıca gereklidir.
- `reward-calendar-v227.test.mjs`: 28 gün, eski kayıt geçişi, kesintisiz seri ve kaçırılan günler, döngü yenileme, sandığın içeriğinin önceden görünmesi ve hesap izni.
- `tactical-enemies-v227.test.mjs`: dört düşman niyeti, kalkan/ağır darbe/can emme karşılıkları ve sahte düşman niyeti verisinin reddi.
- Gerçek Chromium e2e: giriş yapmış gibi test ortamı, 28 hücre ve 4 özel sandık, ödül içeriği, resmî hesabın alıp yeniden açamaması, masaüstü ekran görüntüsü. Diğer bütün mobil/sunucu oyun testleri korunur.
- Gerçek Supabase testlerinde iki geçici işlem/geri alma senaryosu: **7. gün özel eşya ve idempotency**, **28. gün/serinin kırılması ve 20 kopyalık eşya yerine alternatif ödül**, eski günlük API ile ikinci ödülün reddi. Düşman ağır darbe/tahminli niyet ve Guard savunmasının gerçek veritabanı durumuyla doğrulanması. Test hesaplarının/kayıtlarının tamamı `ROLLBACK` ile geri alındı.

## Veritabanı ve güvenlik
- `sql/starfort-v227-reward-calendar.sql`: yeni `starfort_reward_calendar` tablosu, RLS ve yetkisiz doğrudan tablo erişiminin kapatılması; `public.sfb_daily_calendar('get'|'claim')` sadece kimliği doğrulanmış kullanıcının kendi kaydına çalışır. Envanter, kasa, ödül ve tamamlanan gün tek transaction'da güncellenir.
- `sql/starfort-v227-tactical-combat.sql`: sunucunun kayıtlı düşman niyeti ve dönemsel davranışı.
- Bu sürümde `sfb_daily_calendar` bir `SECURITY DEFINER` RPC'si olarak authenticated rolüne kasıtlı açılmıştır; bu nedenle Supabase güvenlik danışmanı `authenticated_security_definer_function_executable` uyarısını verir. Fonksiyon `auth.uid()`, sabit eylem listesi, satır kilidi ve kontrol edilen UUID ile sınırlandırılmıştır; tablo izinleri kapalıdır. `rls_enabled_no_policy` bilerek doğrudan tüm tablo erişimini kapatmak için kullanılır.
- Yerel saat/JSON değerleri sunucuda ödül vermek için güvenilmez.

## Sınırlar
- Gerçek kullanıcı e-postasıyla üretim kabul testi, 180 günlük birebir oynanış ve yüksek oyuncu yükü henüz tamamlanmış değildir.
- Günlük ödül takvimi parasal satın alımlar, reklam izleme mecburiyeti veya ceza veren streak sistemi içermez.
