# STARFORT — Dört bağımsız oyuncu ajanı oyun ve savaş denetimi

**Tarih:** 3 Kasım 2026. **Başlangıç sürümü:** v2.47.0-beta.7. **Düzeltme adayı:** v2.47.0-beta.8 / sunucu denge sürümü 5.

## Testin niteliği

Dört **ayrı GitHub Actions job'u**, dört ayrı başsız Chromium tarayıcı oturumunda farklı oyun stillerini simüle etti. Bunlar dört bağımsız yapay zekâ modeli değil; belirlenmiş hedefleri yürüten dört farklı **otomatik oyuncu ajanı**. Tarayıcıda gerçek STARFORT arayüzüne tıklanır, ancak giriş/savaş API'si yalnızca test için yazılmış bellek içi **synthetic-account-network.cjs** üzerinden yanıtlanır; canlı müşterilere para veya kayıt eklenmez.

Ek olarak yerel eski oyun motoru ve `act-two-balance.js` modelinde denge simülasyonu çalıştırıldı. Bunlar canlı Supabase RPC'sinde 180 gün yaşayan insan oyuncular veya gerçek sunucuya işlenmiş 48 zafer **değildir**.

Test akışları: `scripts/four-player-agents.mjs`, CI: `.github/workflows/four-player-agents.yml`. Her ajan ayrı JSON izini ve PNG ekran görüntüsünü Actions artifact olarak bırakır.

## Dört oyuncu — gözlenen sonuçlar

**Referans koşu:** GitHub Actions `41710619048`.

| Oyuncu bakış açısı | Gerçekte otomatik çalıştırılanlar | Ölçülen sonuç | Yorum |
|---|---|---|---|
| Yeni oyuncu (rookie) | Hesap gate → synthetic giriş → ilk sefer düğmesi → her savaş hamlesi → zafer ekranı; ek olarak 90 günlük yerel oyun motoru | UI mock ile 6 turda 3★; ayrı eski yerel motor ilk bölge 0. gün, sekiz bölge 11. gün | İlk ekranda tıkanma yok. Bu mock sonuçları online savaşın gerçek zorluğunu göstermez. |
| Taktik oyuncu (tactician) | Version 4 Eclipse uyarısı, Guard ile komut; 8 bölge × 3 takım güç düzeyi × 2 politika = 48 Act II denge senaryosu | Taktik 24/24 zafer, düz saldırı 19/24; mevcut 18 tur sınırıyla **0/24 taktik 3★**; 24 tur + yeterli canla 21/24 | Taktik galibiyeti artırıyor ama 3★ eşiği öncelikle normal takım gücünde erişilemez kalıyordu. |
| Usta oyuncu (veteran) | Gelişmiş hesap durumu → Çanta → Yıldız İşleme → kaynak maliyeti → 90/180 günlük panel | 4. rütbe düğmesi beklenen koşulda açık; 6 proje satırı; 390px taşma yok | Uzun vadeli hedefler ve maliyetler görülüyor; 180 günlük canlı tutunma kanıtı değildir. |
| Hata avcısı (breaker) | Geçersiz giriş denemesi → test hesabı → 14 dil × 6 ekran = 84 mobil rota; Arapça RTL | 320px'te **0 yatay taşma, 0 yön/dil kilitlenme hatası** | Dar ekran ve global gezinme kontrolü başarılı. Tüm kullanıcı akışları uçtan uca incelenmiş değildir. |

## Oyun zevki açısından bulunan iki kritik problem ve düzeltme

**P1 — Sınırsız `skill` saldırısı (kaynak koddan doğrulandı)**

Canlı `sfb_starfort_progress` fonksiyonunda genel `p_aux='skill'` kabul ediliyor ve saldırı hasarı normalin **1,3 katı** hesaplanıyordu. Buna karşılık sadece `skill:<heroId>` biçimindeki kahraman yetenekleri takım üyeliği ve `turn+3` cooldown kontrolünden geçiyordu. Genel düğme, aynı hamlenin sürekli kullanılmasıyla taktik seçimi anlamsızlaştırabiliyordu.

**Düzeltme:** Hem hesap API istemcisi hem server RPC genel `skill` hamlesini reddediyor; genel “Yetenek” düğmesi kaldırılıyor; **her biri ayrı soğuma süresine sahip kahraman yetenekleri korunuyor**. Bu yalnızca UI gizlemesi değil, sunucuda da engellenen bir istismar kapanışıdır.

**P1 — İkinci Perde 3★ erişilebilirliği (simülasyon + canlı SQL eşiği karşılaştırıldı)**

Canlı RPC 3 dalgalı Act II için 18 turda, en az %70 canla bitirmeyi şart koşuyordu. Eldeki eski Act II denge modelinde 24 taktik kombinasyonun hiçbiri bu sürede bitmiyordu. Aynı modelin 24 turluk hedefinde 21/24 uygun hale geldi; saldırı spam'ı ise taktik politikadan daha düşük skor verdi.

**Düzeltme:** Yeni başlayan `balanceVersion=5` Act II savaşları için 3★ tur sınırı **24** oluyor; minimum %70 can şartı aynen korunuyor. Eski, halihazırda açık `balanceVersion=1–4` savaşları için **18** tur eşiği devam ediyor. Ödül miktarlarında, kaynak üretiminde, malzeme maliyetlerinde, patron saldırı çarpanlarında değişiklik yok. Bu değişiklik kalite iyileştirmesi, garantili 3★ değil.

## Uygulama ve sınırlar

- Yeni SQL migrasyonu `starfort/sql/starfort-v254-four-player-battle-fixes.sql` doğrudan o gün kontrol edilen canlı RPC MD5 `c70257da3b29c677c39749c1659f94c5` üstüne hazırlanmıştır. Uygulamadan önce checksum yeniden doğrulanmalı.
- İstemci `balanceVersion=5` snapshot'ını doğrular; v1–v4 savaşları da geçerliliğini korur. Savaşın o anki güç/HP kaydı dönüştürülmez.
- Aktif hesaplar ve istemci ödülleri silinmez; replay/owner lock/UUID idempotency korunur.
- Her ajan log ve ekran görüntüsünü CI üzerinde kaydeder; bir test düşerse kaynak kodu ve test altyapısı ayrı teşhis edilir.
- İnsan oyuncularla gerçek çevrim içi 7/30/90/180 günlük oynanış, gerçek mail ile giriş, internet gecikmesi ve çok oyunculu yoğunluk **henüz tamamlanmış sayılmaz**.

## Takip edilmesi gereken kalite riskleri

Yeni oyuncu botunun 6 hamlelik ilk zaferi mock hasarı 100 ve düşman niyeti `strike` ile üretildiği için online tutorial zorluğu hakkında nihai karar vermek için uygun değildir. Yerel oyun motorunda sekiz bölgenin 11 sanal günde bitmesi, canlı hesap kurallarının aynı hızda tüketildiği anlamına gelmez; ancak gerçek sunucuda ilk üç bölge için **savaş sayısı / yıldız oranı / gün cinsinden süre** ayrıca izlenmelidir.

Yeni 24 tur eşiğinin canlı savaşlarda doğruluğunu belirlemek için gerçek, gönüllü beta oyuncularının isimsiz Act II turn/HP/star dağılımı gerekir. Verisiz şekilde düşman gücünü yeniden düşürme veya bonus ödül ekleme önerilmiyor.
