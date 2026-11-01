# STARFORT v2.16.0 — tek kimlik, güvenli senkronizasyon, canlı oyuncular

## Mimari seçimi
- **Supabase Auth:** tek oyuncu e-posta/şifre kimliği, şifre kurtarma ve Auth JWT.
- **Supabase Postgres:** kalıcı lonca, kullanıcıya özel RLS ilerleme yedekleri ve iç auth→lonca eşleştirme.
- **Render Node:** erişimi Supabase JWT ile doğrulanan geçici 1v1 / 2v2 / 5v5 savaş oturumları, sunucuda hesaplanan hasar/konum/yetenekler. Sunucu yeniden başlarsa aktif maçlar kurtarılmaz, dereceli/ücretli içerik açık değildir.
- **GitHub Pages:** sadece statik istemci. API sırları, kalıcı oyuncu verileri veya savaş gerçeği tarayıcıda tutulmaz (yerel köy ilerlemesi PvP için hâlâ güvenilir kaynak sayılmaz).

## Hesap ve bulut kayıt
- Giriş yapılınca otomatik ilk yedek; sonraki yerel kayıtlar gecikmeli ve sürüm denetimli yedeklenir.
- Çatışmada hiçbir taraf sessizce silinmez: kullanıcı 'bu cihaz' veya 'bulut' seçer.
- Önceki sekme koruması ve JSON yedek geri yükleme değişmeden devam eder.
- Şifre sıfırlama isteği, recovery bağlantısı doğrulama, yeni şifre kaydetme arayüzü.
- Supabase Auth URL Configuration içinde **Site URL ve Redirect URLs** arasında GitHub Pages oyunun gerçek `https://umutcandar.github.io/starfort-beta/starfort/` adresi ve kullanılıyorsa Render URL bulunmalıdır. E-posta sağlayıcı/SMTP ve şifre kurtarma teslimatı gerçek test hesabında ayrıca sınanmalı.

## Klanlar ve güvenlik
- `public.sfb_account_api` yalnızca `authenticated` rolü tarafından çalıştırılır; `auth.uid()` hesap kimliği kullanır.
- `starfort_beta.auth_links` özel tabloda e-posta hesap UUID'si sunucu içi mevcut klan kullanıcı kimliğine bağlanır.
- İlk komutan adı bu yetkiyle açılır. Tarayıcıya 64 karakterli eski bearer token hiç dönmez.
- Önceki test kayıtları silinmedi; eski halka açık RPC erişimi ayrı geçiş SQL'iyle devre dışı bırakılır.
- Auth RPC'nin sahibi bu bağlantıyı yalnızca sunucu içinde çözebilir; anonim rolün işlevi çalıştırma/bağlantıları okuma izni yoktur.

## Canlı savaş
- Render `STARFORT_AUTH_REQUIRED=1` durumunda 1v1 ve 2v2/5v5 oda isteklerinin öncesinde Supabase `/auth/v1/user` ile JWT doğrular; her karakter seçimi sunucuda doğrulanır.
- GitHub Pages canlı kuyrukları artık Render'a gönderir, CSS/2D/3D sunum seçimi savaş verisini belirlemez.
- Aldren yakın koruma/iyileştirme, Lyra uzak menzil, Rovan hareket, Mira savaş şifası ile oynar. Tümünün taban canı aynı; güç oyuncunun kale kaynaklarına veya ücretli eşyalara göre yükselmez.
- **Klan kadrosuyla toplu eşleşme hâlâ kapalıdır:** eski Node guild JSON'u Auth'e bağlanmış klanları temsil etmez. Yanıltıcı düğmeler kapatıldı.
- **Render maç state'i RAM'de:** ücretsiz sunucu yeniden başlayınca bekleyen ve aktif odalar kaybolabilir. Dereceli maç/maç ödülü/rekabet ekonomisi için dayanıklı olay günlüğü, oran sınırları, anti-cheat ve kurtarma işi kalır.
- Render `STARFORT_AUTH_REQUIRED=1` iken eski Node `/api/register` ve lonca yazma uç noktaları kapatılır. Kalıcı lonca zaten Supabase'dedir. Render `/tmp` oyuncu kayıt kaynağı değildir.

## QA
- `npm run qa:all`: eski oyun testleri, hesap senkronizasyonu, iki kullanıcıyla doğrulanmış gerçek HTTP 1v1 eşleşmesi, sunucu tarafında kahraman farklılıkları.
- `npm run qa:visual`: gerçek masaüstü ve telefon yatay ekranının tarayıcı kontrolü.
- Gerçek e-posta teslimi, Auth URL ayarları ve Render soğuk başlangıcı test kullanıcılarıyla kontrol edilmedikçe geniş oyuncu kitlesine duyurulmamalı.
