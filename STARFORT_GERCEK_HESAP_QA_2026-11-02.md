# STARFORT — Canlı hesap ve 16 bölüm sunucu testi
**Tarih:** 2 Kasım 2026 · **Kod:** v2.34

## Test kapsamı ve gerçeklik düzeyi

**Gerçek Supabase Auth/HTTP oturumu:** GitHub Actions üzerindeki geçici, rastgele şifreli QA hesabı normal `/auth/v1/signup` isteği ile açıldı (HTTP 200), e-posta **yönetici tarafından yalnızca bu test hesabı için doğrulandı**; `/auth/v1/token?grant_type=password` üzerinden JWT ile gerçek giriş yapıldı. Gelen token ile `/rest/v1/rpc/sfb_starfort_progress` çağrıları yapıldı.

**Gerçek HTTP oyuncu testi — Bölüm 1:**
- Yeni hesap: `cleared=[]`, aktif savaş yok.
- Yetkisiz sahte bölüm `mission_start('999')` reddedildi.
- `mission_start('1')` kabul edildi.
- Aynı `request_id` tekrarlandığında revision artmadı / ödül çoğaltılmadı.
- Üç dalga sonunda **9 turda 3 yıldızlı galibiyet**.
- Sunucu raporu: `{"won":true,"mode":"story","stage":1,"stars":3,"turns":9,"reward":{"gold":120,"wood":60,"stone":35,"aether":12}}`.
- Yeni `get` isteği sonrası `cleared=[1]`, savaş raporu ve ödül kayıtlı.
- **Başarılı GitHub Action:** https://github.com/umutcandar/starfort-beta/actions/runs/41470952344

**PostgreSQL sunucu entegrasyon testi — Bölüm 2–16:**
- Test hesabının savaş gücü, ekipmanı, labirent ve bina önkoşulları bir **BEGIN / ROLLBACK** işlemi içinde hazırlandı.
- Önce ana hikâyenin 2–8. bölümleri (7 bölüm), ardından ayrıca ikinci perdenin 1–8. bölümleri (8 bölüm) sırayla başlatıldı.
- Her dalgadaki `mission_turn` komutları gerçek `sfb_starfort_progress` fonksiyonunda hesaplandı. Test hızı için `lastTurnAt` süresi yalnızca yönetici SQL işlemi içinde geriye alındı.
- **15/15 bölüm tamamlandı, sıralı açılma ve `lastReport` zaferleri doğrulandı.**
- Tüm test değişiklikleri ROLLBACK ile geri alındı. Ana hesap hiçbir şekilde değişmedi.
- Bu, düşük seviyeli doğal ilerlemeyle gerçek oyuncunun 16 bölüm oynaması veya mobil tarayıcıda 16 bölüm oynaması **değildir**.

**Kronik / tek seferlik ödül entegrasyonu:**
- Gerçek test hesabının sadece 1 zaferi varken birinci Kronik sandığının açılması reddedildi.
- Yalnızca geri alınan transaction içinde zafer sayısı geçici 2 yapıldı.
- `chronicle_claim('1')` sunucudan **160 altın + 8 yıldız özü** kazandırdı.
- Aynı `request_id` tekrarında ek ödül/revision oluşmadı.
- Farklı `request_id` ile aynı rütbeyi ikinci defa açma isteği reddedildi.
- ROLLBACK sonunda `wins=1`, `contract_claims={}`, kaynaklar önceki hâliyle kaldı.

## Saptanan test altyapısı sınırları

1. Supabase Auth test için ayrılmış `example.com` adresini geçersiz saydı (`email_address_invalid`); gerçek, rastgele Gmail biçimindeki adres normal kayıt yolundan başarıyla oluşturuldu.
2. Yeni hesap açma işlemi kısa sürede tekrarlandığında **`over_email_send_rate_limit` (HTTP 429)** görüldü. Bu yüzden gerçek hesap QA iş akışı her committe otomatik çalışmayacak şekilde **manual `workflow_dispatch`** yapıldı. Üretime açmadan önce uygun SMTP / Auth e-posta limitleri kontrol edilmeli.
3. Chromium ile gerçek kullanıcı girişi, e-posta bağlantısına tıklama, mobil giriş ekranından oturum açma ve kullanıcı tarafından tüm 16 bölgenin doğal tempoda tamamlanması **bu çalışmada doğrulanamadı**. Var olan Chromium misafir-kilidi testleri bunun yerine geçmez.
4. Test e-postası gerçek bir kişiye ait değildir; özel şifre GitHub kaynak koduna veya loglarına yazılmadı.

## Güvenlik ve temizlik

QA hesabı yalnızca geçici doğrulama amacıyla oluşturuldu; sonuçlar kaynak koduna raporlandı. Test hesabı Auth veritabanından silindiğinde kullanıcıya ait kaynaklar, savaş raporu ve sefer verileri Foreign Key `ON DELETE CASCADE` ile temizlenir. **Bu temizlik yalnızca QA kimliğine uygulanmalı; diğer kullanıcılar etkilenmemelidir.**

## Sonraki kabul testi

- Ayrılmış ve e-postasına erişilebilen bir kullanıcıyla gerçek e-posta bağlantısına tıklama ve Chromium mobil/masaüstü oturum.
- Başlangıç kaynaklarıyla 1–8 normal hikâye ilerleme temposu (bina bekleme, labirent, üretim), ardından doğal 9–16 denemeleri.
- Resmî başlatma/ödül, günlük takvim, online lonca ve uzun soluklu Kronik sıralaması.
