# STARFORT v2.55 / Beta.9 — İlk dakikalar, gerçek sunucu savaşı ve 17 madde kontrolü

**Tarih:** 3 Kasım 2026 · **Kapsam:** Kullanıcının doğrudan oyunu deneyerek bildirdiği 17 kusurun incelenmesi. **Kritik ayrım:** Render/GitHub Pages arayüzünde yapılan Chromium QA, izole sahte Supabase yanıtları kullanır. Gerçek savaş ve klan kimliği ayrıca **mevcut üretim Supabase veritabanında**, geçici Auth kimliği üzerinden **BEGIN/ROLLBACK** ile çağrıldı. Bunlar karıştırılmamalıdır. Gerçek insanın e-posta onayını ve 90 günlük deneyimini taklit etmiyoruz.

## Canlı sistemden alınan ve geri alınan gözlemler

Canlı `public.sfb_starfort_progress` baseline MD5 **b1848362b2822c0d78f7c4f0e38397df** (Beta.8, v5). Gerçek `mission_start('1')`: **güç 267, takım canı 290, düşman canı 124**. Aynı RPC'de 3 saniyelik gerçek cooldown korunarak, 10 defa gerçek `mission_turn('strike')` yapıldı:

| Tur | Dalga | Takım HP | Düşman HP | Sonuç |
|---:|---:|---:|---:|---|
| 1 | 1 | 263 | 71 | Normal |
| 2 | 1 | 217 | 18 | Ağır saldırı |
| 3 | 2 | **287** | 155 | Dalga geçişi, büyük otomatik iyileşme |
| 4 | 2 | 260 | 102 | Normal |
| 5 | 2 | 233 | 49 | Normal |
| 6 | 3 | **290** | 194 | Dalga geçişi, otomatik can tamamen doldu |
| 7 | 3 | 263 | 141 | Normal |
| 8 | 3 | 241 | 98 | Normal |
| 9 | 3 | 214 | 45 | Normal |
| 10 | 3 | — | — | **Yalnızca Saldır ile zafer** |

Bu sonuç kullanıcı bildirimi **#11'i gerçek üretim savaş kurallarında yeniden üretti**. Can/değerler test hesabının geçici kayıtlarıydı; işlem sonunda `ROLLBACK` kullanıldı, normal oyuncu verisi değişmedi.

**Gerçek lonca** `sfb_account_api('status')`→200, `('me')`→404 (e-posta hesabı var ama lonca profili yok), `('register')`→201 ve ardından `('me')`→200 ile test edildi. İşlem sonunda `ROLLBACK`. İkinci kayıt gerektiren backend ayrımı doğrulandı.

## Hata / değişiklik ve kabul kriteri

| # | Bildirim | Beta.9 düzeltmesi ve doğrulama |
|---|---|---|
| 1 | E-posta onay linki localhost'a gidiyor | İstemci, kayıt/resend/reset/OAuth dönüş adresi için Render oyun URL'sini kanonik biçimde gönderiyor. **Ayrı zorunlu işlem:** Supabase Auth projesinin Site URL ve Redirect URLs ayarı dashboard'dan yapılmalı; SDK bu proje ayarını değiştiremiyor. Onay e-postasının teslimat/yeniden yönlendirilme testi ancak bu işlemden sonra tamamlandı sayılır. |
| 2 | Login'den sonra köy açılmıyor | Giriş, yeni kayıt ve link callback'i için 4 adımlı otomatik yükleme/yeniden deneme. İlk get yanıtını 503 yapan test fikstürü; **manuel yeniden dene tıklamadan** köy açılması Chromium ile doğrulanmalı. |
| 3 | İttifak yükleniyor, ayrı Komutan kaydı istiyor | Supabase doğrulanmış hesabın `auth.uid()` ile tek `sfb_account_api` komutan profiline kendi kendine bağlanması. İkinci form kaldırıldı. Canlı RPC'de register/me akışı doğrulandı. |
| 4 | Mağaza demo düğmesi çalışmıyor | Kaldırılmış yerel “Eğitim savaşında dene” ve çelişkili yazı kaldırıldı; gerçek oyun sunucusu bot düellosuna açık yönlendirme. |
| 5 | Ödül / ödeme butonları aktif gibi | Ödeme açılmadan satın alma açık değil; disabled görünüm ve açıklama. Ücretsiz sezon hedefi için kalan gerçek zafer sayısı gösteriliyor. |
| 6 | strike/skill/guard İngilizce kaydı | Sunucu action ID'leri gösterim katmanında 14 dilde karşılığa dönüyor. Sunucu payload'ı değiştirilmiyor. |
| 7 | Şimdi geliştir düğmesi kesiliyor | İnşaat işlemleri sticky CTA, alt güvenli alan ve kaydırma payı. 390px Chromium ile **gerçek tıklanabilirlik / görünürlük** kontrolü eklendi. |
| 8 | Çanta vs Cephanelik | Rehber ve sekme **Çanta / Çantaya git** olarak eşleşiyor. |
| 9 | Otomatik Kuşan iki kez gerekiyor | Bir UI mutex altında, sırasıyla her çıkartma ve her kuşanma RPC'sinin gerçek sunucu yanıtı tamamlandıktan sonra sonraki RPC. 1 tık kılıç + zırh Chromium fikstürüyle ölçülüyor. |
| 10 | Eski bildirim birikiyor | Toast içeriği de 2.8 saniye sonra temizleniyor; başarılı login eski hata gösterimini sıfırlıyor. |
| 11 | Savaşlar çok kolay / dalgada full HP | **Sadece yeni `balanceVersion=6`**: hikâye 1–3 gelen hasarı +%12, 4–8 +%6; dalga iyileşmesi hikâyede %24→%11, II. Perde'de %34→%18. Korunan v1–v5 aktif savaşlar aynı kalır. Yeni savaş SQL'i canlıya geçince üretim RPC'sinde tekrar tam savaşla test edilmeli. |
| 12 | Zafer ekranı yok | Büyük, ekran ortası sonuç/gerçek sunucu ödül paneli, yıldızlar, sonraki bölüm ve Çanta bağlantısı. |
| 13 | Arena çok küçük, hasar görünmüyor | Sahne yüksekliği, karakter görünürlüğü, hasar patlaması ve komut düğmeleri büyütüldü; canlı 3D/2D gösterim saklanmadı. |
| 14 | Rehber yok | İlk galibiyete kadar **köyün başlangıcında** ve Seferler ekranında üç adımlı rehber. |
| 15 | 283/55 belirsiz | Maliyetler `Sahip olduğun` ve `Gerekli` olarak ayrıldı; 14 dil metinleri. |
| 16 | Kale düşükse kilitli buton | Eksik seviyeye sahip binada doğrudan **Kaleye git** düğmesi; Atölye'nin mevcut yönlendirmesi korunuyor. |
| 17 | Bot/pratik maçı görünmüyor | Hesaplı Seferler ekranında **Bot Düellosu** girişi; `mountArena` yerel eski kahraman listesi yerine doğrulanmış hesap kadrosunu kullanır. Derecesiz ve ödülsüzdür. |

## Güvenlik ve dağıtım

- **Veri göçü yok**, mevcut gerçek oyuncu hesapları ve aktif savaşlar korunuyor.
- Sunucu `auth.uid()`, RLS, row-level locks ve UUID idempotency korunur. Yeni savaş denge kuralları istemciden gönderilemez; kaynak ödülleri/yıldızları sadece RPC verir.
- İlgili `starfort/sql/starfort-v255-first-minute-combat.sql` canlı checksum'a karşı oluşturulmuştur; production SQL drift varsa uygulama durdurulmalı. Yeni v6 yaratılan savaşlar; eski aktif v1–v5 kayıtlara dokunulmaz.
- Değişikliklerden sonra: tüm Node testleri, 14 dil × 6 mobil görünüm, yeni Chromium kayıt/köy/ittifak/zafer/auto-equip/inşaat kontrolleri, ana dal CI ve Render deployment sonuçları doğrulanmalı.
- Kullanıcının gerçek e-posta linki Site URL'sini ancak Supabase Dashboard değiştirebilir. Bunun tamamlanmadığı raporlanmalıdır.
- Gerçek oyuncu hesabıyla **tarayıcıdan giriş ve 90–180 gün boyunca canlı oyun oynama** henüz bu test kapsamında değildir. Ayrı QA e-postası ve doğrulanmış login gerektirir; kullanıcı hesabı kullanılmaz.

**Kullanıcı bildirimi:** İlk dakikaların rehbersiz olması, saldırı spam'ı ve anlamsız zafer hissi. Bu değişiklikler gösteriş için değil, ölçülebilir oyun deneyimine odaklanır.
