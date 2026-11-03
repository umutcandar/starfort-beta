# STARFORT v2.44 — 14 dil ile global beta altyapısı

**Tarih:** 3 Kasım 2026 · **Kapsam:** hesap girişine ve temel gezinmeye yönelik uluslararasılaştırma.

## Dil listesi (14)

| Kod | Arayüz adı | Yazım yönü |
| --- | --- | --- |
| tr | Türkçe | LTR |
| en | English | LTR |
| es | Español | LTR |
| pt-BR | Português (Brasil) | LTR |
| fr | Français | LTR |
| de | Deutsch | LTR |
| it | Italiano | LTR |
| ru | Русский | LTR |
| ar | العربية | RTL |
| hi | हिन्दी | LTR |
| id | Bahasa Indonesia | LTR |
| ja | 日本語 | LTR |
| ko | 한국어 | LTR |
| zh-CN | 简体中文 | LTR |

## Gerçekten çevrilen alanlar

- Her yeni dilde **41 kritik metin**: hesap açma / giriş / şifre yenileme alanları, sunucu doğrulama durumları, ana menü, kaynak isimleri, temel köy başlıkları, dil seçimi, ayarların çekirdek düğmeleri.
- Ziyaretçi giriş ekranından **hesap açmadan** dil değiştirebilir; oyun yine yalnızca doğrulanmış hesapla açılır.
- Seçim `starfort:language-v243` anahtarında yalnızca **görünüm tercihi** olarak saklanır; hesabın ilerlemesi ve ekonomisi etkilenmez.
- Tarayıcı diline göre ilk dil seçilir (`es-MX` → es, `pt-PT` → pt-BR, `ar-EG` → ar, `zh-Hans` → zh-CN). Desteklenmeyen dil İngilizceye döner; örneğin `zh-TW` için Geleneksel Çince çevrilmiş gibi davranılmaz.
- Arapça `lang=ar` ve `dir=rtl` ile sunulur. Oyun sayısının gösterimi `Intl.NumberFormat` üzerinden seçilen dili izler.
- Gölge Sınırı savaşlarının mevcut İngilizce çevirisi **diğer 12 dilde geçici yedek** olarak gösterilir; yanlışlıkla Türkçeye düşmez. Patron sesleri profesyonel yerel kayıtlar olmadığı için Türkçe dışında şimdilik İngilizce tarayıcı TTS sesini kullanır.

## Sınırlar ve sonraki geliştirme

**Bu sürüm 14 dilde tamamen çevrilmiş bir oyun değildir.** Ana hikâye, karakter/eşya isimleri ve açıklamaları, lonca/PvP, mağaza, günlük ödüller ve bazı sunucu hata mesajları hâlâ Türkçe veya İngilizce görünebilir. Bu yüzden ek diller seçicide *Beta* olarak görünür. Dil paketleri yayımlanmadan önce ana dili konuşan editör kontrolünden geçmelidir. Bu paket uluslararası satış/ülke bazlı vergi veya ödeme altyapısı eklemez.

Bir sonraki hedef: kalan bütün oyun metinlerini tekil i18n anahtarlarına ayırmak, kapsam raporu üretmek, her ekranın kapsama oranını doğrulamak, RTL ekranları mobil cihazlarda test etmek, ardından bölgesel sunucu gecikmesi, hukuki metinler, global ödeme ve altyapı testlerini bitirmek.

## Güvenlik ve QA

- `locale-v244.test.mjs`: 14 dil, 12 ek pakette 41 tam anahtar, BCP-47, seçicinin erişilebilirliği, Arapça RTL, İngilizce geri dönüş, dil tercihi / hesap kimliği izolasyonu ve patron ekranlarında güvenli yedek.
- `scripts/reference-browser-qa.mjs`: Chromium'da giriş öncesi 14 dil listesi, İspanyolca, Arapça ve Japonca gerçek DOM geçişleri.
- Supabase JWT, RPC, köy kaynakları, günlük/haftalık sunucu saatleri, ödül hakları, sunucu güvenliği ve misafir modu kuralları **değişmedi**.

Yayın doğrulaması: GitHub PR QA ve Pages başarılı olmadan sürümü ana dala birleştirmeyin; Render deploy commit SHA ayrıca kontrol edilmeli.
