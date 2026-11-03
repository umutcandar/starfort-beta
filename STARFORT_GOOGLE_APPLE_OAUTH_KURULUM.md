# STARFORT — Google (Gmail) ve Apple hesabıyla giriş

## Kod durumu

STARFORT v2.47.0-beta.2, iki **OAuth giriş butonunu** ve güvenli istemci akışını içerir.
Bu özellik **Supabase sağlayıcı ayarları etkinleştirilmeden kullanılamaz**.
Butonlar \`/auth/v1/settings\` kaynağındaki \`external.google\` veya
\`external.apple\` değeri \`true\` olmadıkça kapalıdır. Kullanıcının e-posta/şifre
girişi etkilenmez; misafir modu açılmaz.

OAuth işleyişi:
1. Oyuncu Google/Apple butonuna tıklar. STARFORT, yalnızca iki desteklenen
   sağlayıcı için Supabase Auth \`/auth/v1/authorize\` adresine gider.
2. Oturum açıldıktan sonra Supabase, kullanıcıyı kabul edilen STARFORT HTTPS
   adresine geri yönlendirir. İstemci, aynı sekmede oluşturulan tek-kullanımlık
   nonce değerini (10 dakika) kontrol edip URL'deki tokenları geçmişten siler.
3. \`/auth/v1/user\` cevabı gerçekten kullanıcı ID'si dönmeden oyun açılmaz.
   Aynı kullanıcı ID'sinin köyü ve ekonomisi sunucudan yüklenir.
4. Yeni giriş yöntemi **farklı bir Supabase kullanıcı ID'si oluşturabilir**.
   Farklı ID'lerin köy kayıtları bu güncellemeyle otomatik birleştirilmez.

## 1. Supabase ayarı

Proje: \`ftbbzqzgafmallrfimnt\` (mevcut STARFORT Auth projesi).

Supabase Dashboard → Authentication → URL Configuration:

- Site URL (uygun olan canlı STARFORT adresi):
  \`https://starfort-online-beta.onrender.com/starfort/\`
- Additional Redirect URLs:
  \`https://starfort-online-beta.onrender.com/starfort/**\`
  \`https://umutcandar.github.io/starfort-beta/starfort/**\`

OAuth, URL query parametresinde \`starfort_oauth=<nonce>\` taşır.
Her iki URL'nin bu parametreyi koruyarak geri dönebildiğini gerçek tarayıcıyla
doğrulayın. Eğer wildcard kabul edilmiyorsa Supabase'in güncel redirect eşleme
kurallarına göre izinleri yeniden düzenleyin; güvenli olmayan genel yönlendirmelere
izin vermeyin.

Sağlayıcıların **ortak OAuth callback adresi** (Google Cloud ve Apple Developer
tarafında kaydedilecek adres):

\`https://ftbbzqzgafmallrfimnt.supabase.co/auth/v1/callback\`

Bu adres STARFORT'un dönüş adresi ile aynı şey değildir.

## 2. Google (Gmail) oturum açma

1. [Google Auth Platform / Google Cloud](https://console.cloud.google.com/auth/overview)
   üzerinden projenizi ve OAuth onay ekranını kurun. Gerekiyorsa test
   kullanıcılarını ekleyin ve uygulamayı dış kullanıma uygun şekilde yayımlayın.
2. Web application türünde OAuth Client ID oluşturun.
3. Authorized JavaScript origins için:
   \`https://starfort-online-beta.onrender.com\`
   \`https://umutcandar.github.io\`
4. Authorized redirect URIs için Supabase ortak callback adresini ekleyin.
5. Client ID + Client Secret değerlerini **yalnızca Supabase Dashboard →
   Authentication → Providers → Google** alanında kaydedin ve sağlayıcıyı
   etkinleştirin. Secret'ı GitHub'a, HTML'e veya sohbet mesajına yazmayın.

## 3. Apple hesabıyla oturum açma

1. [Apple Developer](https://developer.apple.com/account/resources/identifiers/list)
   içinde Team ID, Sign in with Apple yetkili App ID ve bu App ID'ye bağlı
   bir **Services ID** oluşturun. Ücretli Apple Developer üyeliği gerekebilir.
2. Services ID → Web Authentication Configuration içinde:
   **Domain** \`ftbbzqzgafmallrfimnt.supabase.co\`
   ve **Return URL** \`https://ftbbzqzgafmallrfimnt.supabase.co/auth/v1/callback\`.
3. Sign in with Apple için signing key üretin; \`.p8\`, Key ID ve Team ID
   güvenli saklanmalıdır. Apple Services ID web Client ID olarak kullanılmalıdır.
4. Gerekli client secret'ı üretip **yalnızca Supabase Dashboard →
   Authentication → Providers → Apple** alanından yapılandırın.
   Gerçek \`.p8\` dosyasını veya secret'ı repoya koymayın.
5. Apple'ın web OAuth client secret'ı **6 ayda bir yenilenmelidir**.
   Yenileme takvimi oluşturun. Apple private email relay kullanan oyuncularda
   e-posta adresi farklı görünebilir; hesap birleştirmeyi e-postaya göre
   varsaymayın.

## 4. Yayın kabulü

- \`cd starfort && npm run qa:syntax && npm test && npm run qa:visual\`
- Her iki sağlayıcı etkin değilken butonlar kapalı; yanlışlıkla konuk oyununu
  açmak veya veri oluşturmak mümkün değil.
- Her iki sağlayıcı etkinleştirildikten sonra gerçek Google ve Apple test
  hesaplarıyla: giriş, e-posta gizleme, izin reddi, yeniden oturum açma,
  iPhone Safari, Android Chrome, Chrome masaüstü, çıkış, eski e-posta/şifre
  hesabının korunması ve Supabase Auth redirect allowlist testi yapılmalı.
- Google/Apple kimlik bilgilerinin platformlarda oluşturulması, Supabase'de
  etkinleştirilmesi ve **gerçek sağlayıcı hesabıyla uçtan uca oturum açma**
  bu kod güncellemesinin dışında kalan haricî işlemlerdir; bunlar doğrulanmadan
  "Google/Apple girişleri çalışıyor" diye lansman yapılmamalıdır.

## Güncel resmî kaynaklar

- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-apple
- https://supabase.com/docs/guides/auth/redirect-urls
