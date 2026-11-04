# STARFORT Beta.10 · gerçek sunucuda, gerçek hesapla tekrar edilebilir oyun testi

## Ne değişti?
Eski `real-account-production-qa.mjs` her tetiklendiğinde rastgele `@gmail.com` adresiyle yeni bir Supabase hesabı açmaya çalışıyor, e-posta onayını bekliyordu. Bu otomatik ve güvenilir değildi. Yeni sistem **yeni hesap açmaz**. Sadece özel, önceden doğrulanmış bir QA oyuncusuyla canlı oyuna girer.

Bu özel QA oyuncusu da normal kullanıcıdan farklı yetki taşımaz: standart `authenticated` erişimi, gerçek `auth.uid()` ve aynı RLS/RPC kuralları kullanılır. Yönetici anahtarı, `service_role` veya `anon` ile ödül verilemez.

## Bir kez yapılması gereken kurulum

1. [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/ftbbzqzgafmallrfimnt/auth/url-configuration) içinden **Site URL** değerini `https://starfort-online-beta.onrender.com/starfort/` yap. **Redirect URLs** listesine bu tam adresi ve ayrıca gerekiyorsa `https://umutcandar.github.io/starfort-beta/starfort/` adresini ekle. Kullanılmayan `localhost:3000` adresini üretim varsayılanı olmaktan çıkar.
2. E-posta şablonları özelleştirilmişse `{{ .SiteURL }}` yerine onay akışı için önerilen `{{ .RedirectTo }}` değişkenini değerlendir; Supabase'in [resmî Redirect URLs kılavuzunu](https://supabase.com/docs/guides/auth/redirect-urls) kullan.
3. Yalnızca QA için ayrı bir mail adresiyle (ör. **kendi kontrolünde** `starfort-qa@alanadiniz.com`) [oyunda](https://starfort-online-beta.onrender.com/starfort/) normal e-posta kaydı oluştur ve gelen linki doğrula. Gerçek oyuncu hesabını kullanma.
4. Supabase Authentication > Users ekranında **bu QA hesabının kullanıcı UUID değerini** görüntüle. [GitHub Actions Secrets](https://github.com/umutcandar/starfort-beta/settings/secrets/actions) altında üç repo sırrını oluştur: `STARFORT_QA_EMAIL`, `STARFORT_QA_PASSWORD`, `STARFORT_QA_USER_ID`. Şifreyi sohbete, issue'ya, kod dosyasına veya build loguna asla yazma.
5. [STARFORT real-account production QA](https://github.com/umutcandar/starfort-beta/actions/workflows/real-account-production-qa.yml) içinden **Run workflow** seç. Bu, GitHub runner'ında gerçek Render sitesi ve Supabase ile çalışır.

## Doğrulama kapsamı

- Gerçek e-posta+şifre oturumu, UUID sabitleme, hesap/köyün sunucu RPC'si.
- `mission_start('999')` ile geçersiz bölümün gerçek sunucuda reddedilmesi.
- Gerçek `mission_start('1')` ve aynı request-id tekrarında hiç çift işlem olmaması.
- *Aynı QA hesabında* iki gerçek resmî savaş: (A) yalnızca `strike`; (B) sunucu niyetine göre `guard`/`feint`/`rally`/`strike` taktiği.
- Sunucunun v6 savaşı oluşturması, 3.2 sn gerçek cooldown, her tur artan revision, değişmeyen sahiplik, `lastReport` ile kalıcı zafer/yenilgi kayıtları; her dalgadaki can, yıldız ve kaç tur sürdüğü.
- Gerçek Render sayfasında headless Chromium ile giriş, sunucu köyünün otomatik açılması, yenileme sonrası oturum korunması ve 390px mobil görünüm.
- **Sunucu ödülleri yalnızca QA hesabına verilir.** Her çalıştırmanın sonunda girişten çıkılır. Bir test yarıda kesilirse sadece QA hesabındaki test seferi iptal edilir.

## Testin sınırları

Bu bir *gerçek API ve gerçek tarayıcı oyun testi* olsa da test hesabı gerçek ekonomide kaynak kazanır. Bu yüzden günlük otomatik çalıştırılmaz; **bilinçli manuel tetikleme** ile çalışır. Kullanıcının özel hesabı veya devam eden savaşı kullanılmaz. Güç/ekipman seviyesi test hesabı yükseldikçe saldırı-spam karşılaştırması değişebilir; rapor bu yüzden başlangıç takım gücünü de açıkça gösterir.

**Üretim oyun fonksiyonunun v6 SQL denge göçü (2026-11-04) doğrulandı:** yeni sürümlü savaşlar `balanceVersion=6` ile başlıyor; eski açık v1-v5 savaşların koşulları korunuyor. Canlı SQL checksum: `658f4094e39b4904e1364ad4e8351145` (sadece ilk geçiş için referans).

## Mevcut durum

GitHub Actions normal Node/Chromium simülasyonları gerçek hesap şifresi gerektirmeden çalışır. Bu yeni **production QA iş akışı ancak üç sır birden tanımlandığında** gerçek hesabı kullanabilir. Sırlar yapılandırılmadan yapılan çalışma başarısız olur ve gerçek oyunu oynadığını iddia etmez.
