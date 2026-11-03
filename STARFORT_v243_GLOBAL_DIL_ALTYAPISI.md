# STARFORT v2.43 — Global oyun için TR/EN dil altyapısı

**3 Kasım 2026 · İlk uluslararasılaştırma paketi**

## Bu sürümde çalışanlar
- Dil seçimi hesap açılmadan yapılabilir: **Türkçe / English**. Seçim tarayıcıda `starfort:language-v243` olarak saklanır. Başka cihazda aynı hesabı kullanırken dil tekrar seçilebilir; sunucu hesabı ve ilerleme değişmez.
- Kayıt yoksa tarayıcı dili Türkçe ile başlıyorsa Türkçe; diğerleri için İngilizce varsayılandır.
- Giriş formu, ana gezinme, ayarlar, temel kaynak adları ve köy arayüzünün ilk bölümü iki dile ayrıldı.
- Gölge Sınırı'nın 4 patronu için savaş komutları, bölge adları, savaş/ganimet raporu ve 12 rütbelik ustalık ekranının ana metinleri çevrildi.
- Patron replikleri Türkçe ve İngilizce özgün metinlere sahip. Tarayıcı SpeechSynthesis destekliyorsa seçilen dilin `tr-TR` veya `en-US` sesini arar; kayıtlı ses dosyaları değildir.
- Sayfa `html lang` ve erişilebilir dil düğmesi durumu doğru güncellenir; sayı biçimi dil tercihine göre değişir. Ekonominin kaynak sayıları aynı kalır.

## Değişmeyen güvenlik kuralları
Dil tercihi oyuncunun JWT kimliğine, veritabanı kullanıcı kayıtlarına, savaş hamlelerine, rastgele düşüş sistemine, gerçek para ödeme iznine veya `UTC` haftalık/günlük sınırlarına **dokunmaz**. Oyuncu hesabı mecburidir; misafir modu yoktur. Dil seçimi ilerlemeyi sıfırlamaz.

## Henüz global sürüm hazır değil
Ana hikâyenin kalan tüm yazıları, bina/kahraman/eşya açıklamaları, lonca/arena, günlük ödül, mağaza ve bazı hata mesajları kısmen Türkçe kalabilir. Uluslararası tam sürüm için bütün metinler sözlük anahtarlarına taşınmalı; EN/TR çevirileri profesyonel kontrol edilmeli, para birimi / bölgesel ödeme ve vergi, kullanıcı şartları, gizlilik metinleri, erişilebilirlik, çok bölgeli gecikme testi ve gerçek oyuncu kabulü tamamlanmalı. V2.43'ü bitmiş global lansman olarak pazarlamamak gerekir.

## QA
`locale-v243.test.mjs`: tarayıcı dili seçimi, saklama, güvenli geçiş, sayı biçimi, dört patronun İngilizce metni, sunucu ödül raporu ve hesap zorunluluğu. `scripts/reference-browser-qa.mjs`: giriş yapılmadan EN/TR anahtarının çalışması ve Türkçe geriye dönüşü.

Yayına alma ölçütü: Node/GitHub QA, Pages ve Render üzerinde sürüm eşitliği. Render otomatik dağıtım tetiklenmezse sorun ayrıca çözülmeli.
