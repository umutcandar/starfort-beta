# STARFORT v2.24 — Sunucu yetkili krallık ekonomisi

## Çalışma şekli
**Giriş yapmış komutan:** Supabase hesabı için ayrı bir sunucu köyü oluşturulur. Kaynak stoğu, üretim zamanları, kale/6 bina seviyeleri, tek inşaat kuyruğu, günlük sandık ve ustalık puanları sunucu satırında saklanır. İstemci yalnızca `get`, `collect`, `upgrade`, `finish`, `daily`, `match` işlemlerini isteyebilir. Kaynak miktarı, oyuncu ID, maliyet, inşaat süresi, bina seviyesi veya saat gönderemez. `get` oturum açıldığında ve periyodik olarak çağrılır, ekran gerçeği sunucudan okur.

**Hesapsız komutan:** Eski çevrimdışı/yerel oyun deneme modu korunur. E-posta hesabına girince yerel save otomatik olarak sunucu kasasına taşınmaz. İki ekonomik alan ayrıdır. Yanıltıcı eski ve yüklenmiş kaynak değerleri sunucu olarak sunulmaz. Savaş, kahraman/çanta ilerlemesi hâlâ yerel oyun mekaniklerine bağlıdır; bunlardan gelen ödüller sunucu kasasını **artırmaz**. Sunucu yetkili PvE zafer doğrulaması ve kahraman/ekipman harcamaları bir sonraki aşamada taşınmalıdır. Bu sürümü bütün oyun ekonomisinin tamamlanmış taşınması olarak sunmuyoruz.

## Sunucu kuralları
- Başlangıçta yedi bina seviye 1; altın 280, kereste 180, taş 150, yıldız özü 65. Hiçbir client save içe aktarılmaz.
- Her kaynak yalnızca sunucunun `clock_timestamp()` zamanıyla, tam 4 saat + kalan 20 saatte %12 hız ve 24 saat sınırıyla üretilir. Her kaynak 1 milyar ile sınırlıdır.
- Gerçek oyunla aynı 20 seviye, güçlenen maliyetler ve 2→3'ten başlayan 3–3600 dakikalık tek usta süresi. Topla ve yükselt atomiktir: işlem başarısızsa bakiyeye dokunulmaz. İkinci aktif inşaat reddedilir. İnşaatın bitmesi kayıtlı sunucu saatiyle doğrulanır.
- Ustalık 3/6/12/18/24 sınırlarına göre binayı kilitler. Kanıtlanmamış yerel sefer yıldızları kullanılmaz. Doğrulanmış sunucu günlük sandığı +1, HMAC doğrulanmış PvP geçmişindeki ilk ve tek galibiyet kaydı +3 ustalık verir. Hileli istemci `room_id` gönderse bile oyuncuya ait `win` geçmişi yoksa ödül yok.
- İşlemler sunucu transaction'ında satır kilidi (`FOR UPDATE`) ve UUID işlem kimliğinin **kalıcı sunucu işlem geçmişinde** (benzersiz `(user_id,request_id)`) tutulmasıyla tekrar yürütmeye karşı korunur. Tarayıcı kapansa dahi inşaat ilerler.
- Veri tabanında tabloların RLS'si açık; `anon`/authenticated doğrudan SELECT/UPDATE/INSERT yapamaz. `public.sfb_village_api` sadece `authenticated` yetkisiyle, `auth.uid()` üzerinden kendi satırına, `SECURITY DEFINER SET search_path = ''` ile çalışır. `anon` RPC çağrısı yasak.

## Sınırlar ve izleme
- Sunucu sunumunda hileli tarayıcı saati/JSON/sahte kaynak transferleri etkisizdir. PvP galibiyetleri `starfort_match_history` ile doğrulanır; yerel bot/sefer ödülleri sunucu ekonomisine giremez.
- Oyunun diğer sistemleri (kahraman geliştirme, çanta/ekipman, solo savaş) hâlâ *yerel deneme modu* kaynaklarını kullanır. Bu sistemlerin sunucu ekonomisine dahil edilmesi için ayrıca yetkili savaş/ekipman RPC'leri gerekir. Bu açık sınır özellikle beta oyuncularına açıklanır.
- Hesap yedeklemesi ve JSON aktarma sunucu köyünü değiştirmez. Eski ilerleme özel yedeği korunur.
- Hata/bağlantı yoksa sunucu işlemi istemcide taklit edilmez; veri sorgu hatası açıkça bildirilir.
- Reconciliation: 60 saniyede ve girişten sonra `get`; sunucu doğrulaması başarısız olursa hesaplı köy kaynakları yerel mod olarak gösterilmez.

## Kaynaklar ve test
- `starfort/sql/starfort-village-authority.sql` canlı Supabase migrasyonunun kaynak kopyasıdır.
- `village-authority-v224.test.mjs`: istemci API güvenliği, veri şeması, oturum izolasyonu ve SQL sözleşmesi.
- Mevcut bütün oyun/Chromium/PvP QA testleri koşmalıdır.
- Canlı Supabase migration `starfort_authoritative_village_20261102` ve `starfort_village_permanent_request_replay_guard` uygulanmış; üç tablonun RLS ve doğrudan SELECT/UPDATE izinlerinin kapalı olduğu SQL'den doğrulanmıştır. İkinci migration kaynak dosyası `starfort/sql/starfort-village-replay-guard.sql`.

## Bekleyen güvenlik işleri
- Oyunun tüm kahraman/çanta harcamalarını sunucu kayıtlarına taşımak; sunucu doğrulamalı PvE muharebe sonucu/ekipman ödülleri; Rank/PvP parametrelerini yalnızca sunucu kayıtlarından üretmek; çoklu istek / eşitleme ve offline davranış için end-to-end Auth hesabı kabul testi.
