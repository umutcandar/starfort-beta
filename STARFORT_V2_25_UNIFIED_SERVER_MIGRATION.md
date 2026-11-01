# STARFORT v2.25 — Tek seferde sunucuya geçen oyun ilerlemesi

## Karar
Oyuncu olmayan beta için değişikliği ayrı küçük sürümlere bölmek yerine tek v2.25 içinde topladık. **Hesaplı oyun ile yerel deneme artık birbirinden ayrılmıştır.** Tek Supabase Auth kimliği her cihazda aynı sunucu kasasına, sefer ilerlemesine ve envantere erişir. Sunucu, istemciden gönderilen kaynak/level/hasar/kazanma verisine güvenmez.

## Sunucuya taşınan sistemler
- Köy: 7×20 seviye, tek inşaat ustası, üretim, zaman, kaynak maliyetleri, revizyon, tekrar çağrı koruması (v2.24 korunur).
- Kahramanlar: 7 standart kahraman, açılma eşikleri, gerçek seviye ve her yükseltmenin kaynak maliyeti sunucuda.
- Demirhane: 12 üretilebilir eşya, gerçek altın/kereste/taş/öz maliyetleri, üretim seviyesi kilidi, 20 kopya sınırı. 8 hikâye ganimeti ve ilk 5 ayrı 3★ sefer ganimeti sunucuda kayıt edilir.
- Kuşanma/çıkarma ve üç kişilik takım: eşyaların adedi ve her kahramanın yuvası sunucuda denetlenir. Tek kopya iki kahramana kuşandırılamaz. Otomatik donanım istemcide önerilir, **her değişiklik** sunucu tarafından ayrı doğrulanır.
- Hikâye seferleri: 8 hikâye bölgesi, birbirini açan bölge koşulu, her seferin sunucu savaşı ve 1–3★ derece.
- Sunucuda savaş: oyuncu yalnızca **saldır/savun/yetenek** komutunu gönderir. Kahraman gücü sunucu kahraman/eşya/köy kayıtlarından hesaplanır; düşman HP, hasar, cooldown, tur ve kazanma kararı sunucuda tutulur. Hamleler arasında en az 3 saniye, sefer başlangıçları arasında en az 20 saniye vardır. Klonlanmış istemci sahte "kazandım" ile kaynak alamaz.
- Usta seferleri (1–3 kademe), haftalık yarık (tek haftalık resmî ödül), 16 kat labirent, günlük doğrulanmış görev ödülleri, kalıcı üç komutan unvanı.
- Resmî kaynak ve kozmetik ödülleri sunucu durumuna bağlıdır. Doğrulanmış PvP galibiyet ödülü v2.24 HMAC/match-history hattından gelir ve iki kez kullanılamaz.
- Gerçek hesap bakiyesi, sefer ve kahraman/çanta ekranında aynı sunucu profilini gösterir; giriş, çıkış ve cihaz değişimiyle yeniden okunur.

## Uygulama güvenliği
- `public.starfort_player_progress` RLS korumalı, `authenticated` / `anon` için doğrudan SELECT/UPDATE/INSERT yok. İlgili eşsiz RPC: `public.sfb_starfort_progress`.
- Eski farklı uygulamanın `sfb_account_api(text,jsonb)` fonksiyonu korunur; geçici dört parametreli isim kaldırılmıştır. Aynı isimli RPC çakışması oluşmaz.
- **SECURITY DEFINER** bilinçli olarak kullanılır: rol doğrudan tabloya erişemez; fonksiyon `auth.uid()`, sabit eylem/ID listeleri, `FOR UPDATE`, salt sunucu saati, yalnızca sunucu hesaplı ödül ve kalıcı `(user_id,request_id)` işlem deduplikasyonu uygular. `search_path=''`, anonim RPC kapalı.
- Günlük sözleşmelerin ödenmesi için önceki sözleşmeden **sonra yeni doğrulanmış sayaç artışı** gerekir.
- Sayfayı yenilemek / tarayıcı saatini veya localStorage JSON'u değiştirmek sunucu değerlerini değiştirmez; sunucu çağrısı hata verirse istemci ödülü taklit etmez.
- Eski yerel/özel bulut yedeği **silinmez** fakat resmî kasaya otomatik *import* edilmez. Mülk aktarımı veya kazanım şişirmesi yapılmaz.

## Deneme ve ticaret sınırı
- Hesapsız oyun, önizleme savaşları, bot antrenmanları ve premium kahraman **denemeleri** yerel kalabilir; bunların kazanımları resmi sunucu bakiyesine yazılmaz.
- Orijinal gerçek zamanlı/3D istemci PvE savaşının görsel deneyimi hâlâ yerel deneme için vardır. Resmî hesaplı PvE savaşları bu sürümde **ayrı sunucu-tur arayüzü** kullanır; bu ayrım sahte client sonuçlarının gerçek ödüle girmesini engeller. Görsel savaş modlarının tek motorda birleştirilmesi, yeniden yazılmadan dürüstçe "tamamlandı" denemez.
- Kozmetik anket, ses ayarları ve deneme/kurtarma yedekleri hesap envanteri değildir ve isteğe bağlı yerel kalabilir. Ödeme açık değildir.

## Test kanıtları
- 324+ Node oyun/entegrasyon/regresyon testleri, gerçek Chromium mobil/masaüstü ve giriş yapmış kullanıcı canlandırması.
- Supabase'de **ROLLBACK'li test işlemi**: sahte geçici Auth kullanıcısı ile hesap açma, kahraman yükseltme, forge, equip, takım, canlı sefer başlatma/hamle, gerçek sunucu galibiyeti, yıldız, ilk eşya ve görev ödülü. Aynı UUID istek tekrarı idempotent. Geçici Auth, kasa ve profil satırları işlem sonrası sıfır.
- Veritabanında RLS/privilege kontrolleri: authenticated tablolardan doğrudan SELECT/UPDATE edemez; `anon` RPC çağıramaz. Güvenlik linterinin `SECURITY DEFINER executable by authenticated` uyarısı **bu kontrollü RPC'nin tasarımından kaynaklanan kabul edilmiş bir istisnadır**; `rls_enabled_no_policy` uyarısı doğrudan tablo erişiminin kasıtlı kapatılmasındandır. Referans: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Migrations, API ve geri dönüş
- `sql/starfort-v225-account-progression.sql`: yeni sunucu ilerleme tablosu ve ilk RPC kaynağı.
- `sql/starfort-v225-account-safety-patch.sql`: ekipman yuvası açılması ve günlük kontrat tekrarı savunması.
- `sql/starfort-v225-unique-progress-api.sql`: yalnızca STARFORT'a ait benzersiz RPC adı ve önceki fonksiyonun kaldırılması.
- `sql/starfort-v225-runtime-ambiguity-fix.sql`: PL/pgSQL UPDATE değişken/kolon belirsizliğini düzeltir. En güncel SQL burada ve benzersiz API dosyasında mevcuttur.
- Projede login/guest değişimi mevcut. Geri alma: eski arayüz branch'ına dönmek sunucudaki resmî oyuncu verilerini silmez; migrasyonlar geriye dönük silinmemelidir.

## Bilinen sınırlamalar
- Prod token ile gerçek e-posta hesabı üzerinden uçtan uca doğrulama için bir test oyuncusu hesabı gerekir; otomatik testler mock kimlik ve rollback'li Postgres Auth kimliğiyle yapıldı. Ekonomi mantığı gerçek Postgres RPC çağrısıyla denetlendi.
- Resmî PvE UI sunucu-tur tabanlıdır; yerel 3D canlı savaşın birebir görsel karşılığı değildir.
- Asıl oyun (ücretli ürün) açılmadan önce stres testi, RLS/SECURITY DEFINER güvenlik incelemesi ve sunucu replay yük testinin daha geniş ortamda tekrarlanması gerekir.
