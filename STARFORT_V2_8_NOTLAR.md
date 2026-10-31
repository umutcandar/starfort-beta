# Starfort v2.8.0 — Komutan Yolu + GitHub QA

## Oyuncu deneyimi
- Seferler ekranındaki **Komutan Yolu**, güncel kayıt ilerlemesine göre 7 anlamlı hedefi gösterir.
- Adımlar oyuncunun seçtiği sırada tamamlanabilir; zorunlu giriş serisi, ödeme veya süre baskısı yoktur.
- Eski yerel kayıtlar olduğu gibi açılır; yeni kayıt alanı gerekmez.
- Görevler bittikten sonra haftalık Yarık, Usta Seferleri ve klan sistemi tekrar oynanabilir içeriktir.

## QA ve sunucu
- `cd starfort && npm run qa:all` — oyun, sunucu ve söz dizimi testleri.
- `cd starfort && npm run qa:smoke` — geçici kullanıcı ve beta giriş koduyla gerçek yerel HTTP sağlık/dosya/giriş testleri.
- `.github/workflows/starfort-qa.yml` — GitHub'a yüklendiğinde her push, PR ve günlük saatli kontrol.
- Render Blueprint `render.yaml`: Node servisi, `/api/status` sağlık kontrolü, gizli `STARFORT_TEST_CODE`.

## Sınırlar
- Gerçek oyuncuların memnuniyeti ya da ödeme isteği yapay testlerle ispatlanmaz.
- Render ücretsiz/ephemeral dosya sistemi hesapları kalıcı tutmaz; kalıcı kayıt için ayrı veritabanı planlanmalı.
- WebGL2 görsel kalite ve gerçek telefon FPS testi henüz doğrulanmadı.
- Ödeme/mağaza tahsilatı entegre değil; kozmetik kartlar yalnızca ilgi işaretlemesidir.
- Çevrim içi hesap ve güvenlik sistemi hâlâ **kapalı beta** seviyesindedir.
