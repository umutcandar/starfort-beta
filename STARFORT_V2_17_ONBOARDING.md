# STARFORT v2.17 — İlk giriş ve oyuncu kayıt güvenliği

## Tamamlanan işlevler

- **İlk ziyaret:** Oyunu ilk kez açan oyuncu e-posta hesabıyla başlamak veya kayıtları yalnızca tarayıcıda tutarak misafir oynamak arasında seçim yapar. Misafir tercihinde köy oynanabilir kalır. Ekran sonraki ziyaretlerde tekrar zorunlu çıkmaz.
- **E-posta doğrulama:** Supabase Auth kayıt isteği `redirect_to` ile resmi STARFORT URL'sine yönlendirilir. Doğrulama e-postasından dönen `#type=signup` ve `#type=email` bağlantıları sunucu üzerinden doğrulanır, oturum açılır, URL'deki erişim tokenları hemen temizlenir.
- **Onay e-postası:** E-posta doğrulama beklenirken yeniden gönder düğmesi vardır. Supabase rate limitlerine tabidir.
- **Şifre sıfırlama:** Mevcut recovery bağlantı akışı korunur; şifre güncellemesinden sonra bulut eşitleme başlar.
- **İki cihaz karşılaştırması:** Yerel ve bulut kayıtları farklıysa kale seviyesi, kazanılan bölüm, kahraman ve altın özeti gösterilir. Oyuncu karar vermeden otomatik üzerine yazılmaz.
- **Kurtarma noktaları:** İçeri alınan dosya, bulut üzerinden geri yükleme veya bulutun üzerine bu cihazı kaydetme gibi işlemlerden önce geçerli yerel ilerlemenin kopyası alınır. Son üç sağlam nokta Ayarlar'da görülebilir ve geri yüklenebilir. Hatalı nokta diğerlerini gizlemez.
- **Çevrimdışı eşitleme:** Geçici bağlantı hatası gerçek revizyon çatışmasından ayrılır. Yerel kayıt korunur, bağlantı gelince tekrar yükleme denenir. Yanlış sürümle yazma hâlâ reddedilir.
- **Gizlilik:** Kurtarma kopyaları bu cihazın localStorage'ındadır; tam oyun JSON'u gerçek PvP hasar/ekonomi verisi olarak kabul edilmez.

## Testler

- `onboarding-safety.test.mjs`: email confirmation link, farklı adrese token yönlendirmeme, yeni e-posta gönderimi, son üç kurtarma noktası, geçersiz yedek, iki cihaz kayıt çatışması, ağ kesintisi/kurtarma senaryoları.
- `scripts/reference-browser-qa.mjs`: gerçek Chromium'da ilk ziyaret ekranı, hesap/misafir seçenekleri, misafir oynayabilme ve seçim kalıcılığı; önceki mobil/yatay testler.
- `npm run qa:all`: eski oyun, canlı arena ve yeni güvenlik testleri.

## Canlıya açmadan önce Supabase Dashboard kontrolü

Supabase projesi `ftbbzqzgafmallrfimnt`, Authentication → URL Configuration:

- Site URL ve Redirect URLs: `https://umutcandar.github.io/starfort-beta/starfort/` (tam URL, son slash dahil).
- Email provider açık, e-posta doğrulama ve SMTP yapılandırması kontrollü.
- Gerçek bir test e-postasıyla signup, gelen e-posta doğrulama, ardından başka cihazda giriş, bulut kaydı karşılaştırma, şifre sıfırlama ve geri yükleme senaryoları test edilmeli. Bu canlı e-posta teslimatını GitHub CI'daki sahte cevaplı testler tek başına doğrulayamaz.

## Hâlâ açık

Oyuncu ilk girişini gerçek e-postayla yapmadıkça Auth SMTP teslimat ve Redirect URL konfigürasyonunun doğruluğu kesinleşmez. Sunucu otoriteli kaynak ekonomisi, kalıcı maç devamlılığı ve lonca kadrolu gerçek eşleşmeler önceki sürümdeki gibi ayrı işlerdir.
