# STARFORT v2.38 — Gölge Sınırı ve Kahraman Disiplinleri

## Yeni 4 bölge / toplam 12 savaş dalgası

| Bölge | İkinci Perde önkoşulu | Özgün patron taktiği | İlk zafer ekipmanı |
| --- | ---: | --- | --- |
| Karanlık Geçit — Diken Nöbetçisi | 2/8 | Tekrarlanan kalkan | Grave Seal |
| Fısıltı Kıyıları — Oyuk Siren | 4/8 | Güçlü can emme | Eclipse Edge |
| Yanık Uçurum — Kül Fırtınası | 6/8 | Arka arkaya ağır darbeler | Guardian Seal |
| Karanlık Taht — Tutulma Hükümdarı | 8/8 | %68 ve %35 can eşiklerinde güçlenen saldırılar | Starbreaker |

Bölümler sıra ile açılır. Her savaş 3 dalgalıdır ve en fazla 36 turdur. Sunucu galibiyete 1–3 yıldız verir; ilk zaferde bir kalıcı ekipman, tekrarlanan zaferlerde temel ödülün %38'i kazanılır. Yeni bölgelerde kazanılan zaferler mevcut günlük ve haftalık görevlere de sayılır.

## Uzmanlık sistemi

Her kahraman Hücum veya Muhafız uzmanlığını yalnızca bir kez seçer; sonradan değiştiremez. Her uzmanlıkta 3 rütbe vardır.

| Rütbe | Kahraman seviyesi | Ana hikâye | İkinci Perde | Eğitim |
| --- | ---: | ---: | ---: | --- |
| 1 | 3 | 2 | — | 250 altın, 45 yıldız özü, 25 taş |
| 2 | 6 | 6 | — | 1.000 altın, 180 yıldız özü, 50 taş |
| 3 | 10 | 8 | 2 | 2.250 altın, 405 yıldız özü, 75 taş |

Hücum rütbesi: Gölge Sınırı güç hesabında +18. Muhafız rütbesi: bu savaşlarda +20 başlangıç canı ve %3 hasar azaltma. Bonuslar **şimdilik yalnızca Gölge Sınırı** savaşlarında etkilidir; normal hikâyede veya PvP'de etkiliymiş gibi gösterilmemelidir.

## Güvenlik ve kayıt

Yeni veritabanı tabloları starfort_shadow_frontier ve starfort_shadow_requests üzerinde RLS açıktır. Oyuncular bu tablolara doğrudan yazamaz; sfb_shadow_api tek yetkili ilerleme kapısıdır. Sunucu galibiyeti, hasarı, uzmanlık ücretini ve ekipmanı hesaplar. UUID tekrar koruması, 3 saniye hamle bekleme sınırı, 20 saniye sefer başlangıç sınırı vardır.

İkinci bir sefer aynı anda başlatılamaz. Gölge Sınırı oynanırken takım, eşya ve kahraman istatistiklerini değiştiren işlemler veritabanı tetikleyicileriyle engellenir. Savaş bitince normal işlemler devam eder.

## Gerçek doğrulama

- Supabase'de geçici hesap ve geri alınan transaction ile başlangıç kilidi, rütbe 1–3 uzmanlığı, kalıcı tercih, eğitim maliyeti ve tekrar işlem koruması test edildi.
- Üç dalgalı ilk yeni bölüm, gerçek SQL savaş sistemiyle tamamlandı. İlk zaferin özel ekipmanı gerçek envanter kaydına yazıldı.
- Aktif savaş ortasında normal hikâye açma, takım değiştirme ve çantayı oynama denemeleri reddedildi.
- Node testlerinde ayrı v2.38 doğrulamaları; gerçek Chromium tarayıcıda hesap, uzmanlık, kilitli bölge, taktik komutlar ve 390 px mobil görünüm doğrulanır.

Bu paket gerçek ödeme veya misafir oyununu açmaz. Yeni patronlar ayrı savaş matematiği ve temalı kartlarla gelir; her biri için yeni 3D harita, özel animasyon ve yeni müzik henüz yapılmadı. Oyuncularla aylar süren gerçek denge testi de henüz gerçekleştirilmedi.

## Sıradaki hedef

Gölge Sınırı için görsel ortamlar, patron animasyonları, özel eşya gösterimi ve çok günlük oyuncu ilerleme testi.
