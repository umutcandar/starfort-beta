# STARFORT — Hesap oluşturma ve canlıya çıkış kontrolü
Tarih: 2026-11-02. Uygulama Supabase projesi: `ftbbzqzgafmallrfimnt`.

## Durum

STARFORT hesaplarını açmak ve doğrulamak için Supabase Auth kullanıyor. Gerçek ilk testte HTTP kayıt, yönetici tarafından doğrulanan e-posta, giriş, JWT ve üç dalgalı hikâye ödülleri başarıyla sınandı. Gerçek gelen kutusundan doğrulama bağlantısı tıklanmadı. Üretim SMTP servisi henüz bağlanmadığı için herkese açık hesap açılışının güvenilir olduğunu iddia etmeyin.

Supabase'in yerleşik SMTP hizmeti üretim için uygun değildir: yeni Auth dokümanlarına göre sadece organizasyon üyelerine e-posta gönderebilir ve saatlik çok düşük posta limiti bulunur. Test sırasındaki `over_email_send_rate_limit` 429 bununla uyumludur.

## Kullanıcının sağlayıcı üzerinden tamamlaması gereken tek dış yapılandırma

1. Alan adını doğrulayabildiğin bir işlem e-postası hizmetinde (örneğin Resend, Postmark, Brevo veya SendGrid) SMTP hesabı aç. Tedarikçide onaylı gönderen alan adı/adresini etkinleştir, SPF/DKIM ve tercihen DMARC DNS kayıtlarını doğrula.
2. Supabase Dashboard → [Authentication SMTP settings](https://supabase.com/dashboard/project/ftbbzqzgafmallrfimnt/auth/providers) → **Custom SMTP**: host, port, username, password, sender address ve sender name `STARFORT` gir. SMTP parolasını **asla** GitHub'a veya oyunun kaynak koduna ekleme. Araçlarla mevcut bir SMTP hizmeti bağlı değil; yönetici hesabında güvenli şekilde yapılmalı.
3. Authentication → URL Configuration: ana yönlendirme adresi `https://starfort-online-beta.onrender.com/starfort/`; izinli yönlendirmeler `https://starfort-online-beta.onrender.com/starfort/` ve `https://umutcandar.github.io/starfort-beta/starfort/`. Yerel test linkleri ayrı ortamlarda olmalı. **Email confirmation açık kalmalı**; anonim hesaplar ve misafir kayıtları kapalı olmalı.
4. Authentication → Rate Limits ile normal kullanıcı hacmine uygun e-posta limiti seç; spam ve otomatik kötüye kullanımı sınırlamak için CAPTCHA ve kötüye kullanma izlemesi ekle.
5. E-posta adresi sana ait olan bir gerçek hesapla: kayıt → gerçek gelen kutusunda onay bağlantısı → oyun girişi → mobil ekran → şifre kurtarma bağlantısı → tekrar giriş testlerini yap. Gönderim ve ulaştırma durumunu posta sağlayıcısından kontrol et.

## Otomatik regresyon

- `npm run qa:game`: e-posta gönderim limiti, geçersiz e-posta ve doğrulanmamış hesap hatalarını güvenli biçimde reddetmeyi test eder.
- `scripts/reference-browser-qa.mjs`: Chromium'da gerçek STARFORT arayüzünü, yerel sentetik Supabase yanıtlarıyla sınar. Masaüstü giriş, kilitli misafir ekranı, sayfa yenileme, mobil 390px ve sahte doğrulama callback'i. **Gerçek SMTP veya canlı e-posta teslimatı değildir**.
- `.github/workflows/real-account-production-qa.yml`: gerçek Supabase sign-up testi sadece elle tetiklenir; e-posta limitini tüketmemek için her push'ta çalışmaz. Çalıştırmadan önce önceki QA kullanıcılarını temizle.

## GitHub ve Render

GitHub Pages depodaki son commit ile otomatik eşitleniyor. Render bağlantısı otomatik dağıtımı açık göstermesine rağmen geçmişte tetiklemedi; oyun kodu değiştirilirse QA yeşil olduktan sonra Render commit'i kontrol edilir ve gerekiyorsa tek manuel deploy başlatılır.

## Kaynaklar
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/testing-auth-flows
- https://supabase.com/docs/guides/auth/rate-limits
