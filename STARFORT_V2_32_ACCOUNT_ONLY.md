# STARFORT v2.32 — Hesap Zorunlu Sürüm + İkinci Perde Patron Safhaları

## Çevrim içi tek hesap modeli

Misafir başlatma seçeneği üretim HTML'inden kaldırıldı. İlk yüklenen ekran yalnızca e-posta hesabıyla giriş, hesap oluşturma, parola sıfırlama ve e-posta onay işlemlerini gösterir.

Tarayıcıda saklanmış bir hesap token'ı bile dünya ekranını açmaya **yetmez**. `accountReady()` hem kimliği hem de o kullanıcıya ait sunucu köyü ve kahraman ilerlemesi cevaplarını bekler. Hata veya bağlantı kesintisinde oyun kilitli kalır; yeniden bağlan ve hesap değiştir seçenekleri vardır.

Misafir oyununun yerel kaynak, offline ödül, pratik maç ödülü, test komutanı, yerel içe/dışa aktarma ve eski sefer düğmeleri üretim arayüzünden kaldırıldı veya ortak `isLegacyOnlyAction` filtresiyle kapatıldı. Eski kayıtlar **silinmedi**; uygulama onları başlatmaz veya sunucu kasasına taşımaz. Eski kodun bazı iç test yardımcıları henüz depoda saklıdır; çalışan oyun rotası değildir.

Şifre kurtarma bağlantısına gelen kullanıcı doğrulanmış hesap köyünü yüklemeden önce güvenli kapı ekranından yeni parola belirleyebilir. Yetkisiz oturumla ikinci perde, arena veya bina yükseltmeleri açılamaz.

## Yeni patron taktikleri

8 ikinci perde patronu için ayrı üç safha isimleri vardır. Son dalga içindeki sunucu düşmanı %67 ve %33 can eşiklerinde daha farklı taktik uygular.

- %67 ve altında kalkan, can emme ve güçlü yetenek karşılığı taktikler devreye girer.
- %33 ve altında ağır saldırı tehdidi büyür. Siper emri önemli hâle gelir.
- Patron niyeti `enemyIntent`, can, tur, dalga ve ödül sunucuda hesaplanır.
- Tek bir ara dalgayı kazanmak yıldız veya kaynak kazandırmaz.
- Üç safhanın adları, patronun ismi ve karşı tedbir ipuçları resmi sefer HUD'unda gösterilir.

Veritabanı dosyası: `starfort/sql/starfort-v232-boss-phases.sql`. Canlı Supabase bağlantısına uygulanmış ve fonksiyonun yeni taktikleri içerdiği okunarak doğrulanmıştır.

## QA

Yeni otomatik testler: `account-only-v232.test.mjs`, `account-only-boss-v232.test.mjs`. Gerçek Chromium sınaması: `scripts/reference-browser-qa.mjs`, masaüstü ve telefon boyutunda hesapsız giriş, başarısız oturum açma ve sahte token'ın kilidi aşamaması.

Bu paket henüz gerçek oyuncuyla uçtan uca hesap açma ve 16 bölgeli tam sefer testi değildir. Mevcut Supabase projesinde test sırasında sıfır gerçek oyuncu ilerleme satırı tespit edildi.

Render web servisi GitHub main otomatik dağıtımını kendiliğinden algılamıyor; Pages başarılı yayımlanırken Render en son önceki sürümü çalıştırıyordu. Render ile GitHub arasındaki otomatik dağıtım bağlantısının ayrı düzeltilmesi gerekiyor.

## Sıradaki ürün işleri

- Sunucu savaşlarının 8 yeni bölgede gerçek oyuncu temposunda otomatik oynanış ve ödül dengeleme testi
- Her yeni patron için yalnızca isim değil, benzersiz hareketler ve görsel efektler
- İttifak/arena katılımcısının ayrı test token'ından e-posta hesabına bağlanması
- Render otomatik dağıtımındaki webhook/bağlantı sorununun kalıcı onarımı
