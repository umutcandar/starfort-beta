# STARFORT v2.14.0 — Beş öncelikli eksik: uygulama / güvenlik özeti

Güncel kaynak: v2.13 ve Cursor raporu (1 Kasım 2026). Burası oyun arayüzü/geliştirme sürümüdür; tam ölçekli rekabetçi canlı hizmet değildir.

## 1. Hikâye ilerleme koşulları — OYNANABİLİR SÜRÜM
- Bölüm 3–8'de yeni oyuncunun **gerçek canlı sefer başlatma yoluna** takım gücü, demirhane seviyesi, kuşanılmış ekipman ve temizlenmiş labirent katı kapıları kondu.
- Sefer listesi hangi gereksinimin eksik olduğunu ve mevcut değeri gösteriyor. Köy kartı kilitliyse oyuncuyu sefer koşullarına yönlendiriyor.
- Daha önce kazanılmış bölümleri tekrar oynamaya izin veriliyor.
- Eski dahili turn-based API ve test fikstürleri uyumluluk için otomatik koşul uygulamıyor; oyuncu arayüzü açıkça `{enforceGates:true}` kullanıyor. Bu tarayıcı odaklı oyuncu güvenliğinin sınırıdır.

## 2. Bölüme özgü düşmanlar — OYNANABİLİR SÜRÜM
- Bölüm 3: Dikenli pusu; enerji azaltan saldırı.
- Bölüm 4: Demir kırıcı; siper/kalkanı kıran saldırı.
- Bölüm 5: Mahzen ayini; düşman yenilenmesi.
- Bölüm 6: Ayaz zinciri; hareket/saldırı gecikmesi ve enerji baskısı.
- Bölüm 7: Tutulma soğurması; düşman can çalıyor.
- Bölüm 8: son boss %66 ve %33 can eşiklerine bağlı üç ayrı aşama (yıkım → soğurma → boşluk patlaması).
- Canlı ve tur tabanlı savaşa etkiler bağlandı; son boss'un önceki yıkım ritmi korunuyor.

## 3. Hesap/kayıt — HESAP VE YEDEK HAZIR, SUNUCU OTORİTESİ TAMAMLANMADI
- Supabase Auth ile e-posta/şifre hesabı; manuel farklı cihaz yedeği ve geri yükleme.
- `public.starfort_account_backups` tablosu gerçek Supabase üzerinde kurulu, RLS aktif, SELECT/INSERT/UPDATE/DELETE kullanıcıya özel. Anonim rolün okuma izni yok; service-role anahtarı tarayıcıya verilmedi.
- Mevcut kod ve yerel ilerleme bozulmaz, eski beta anahtarlı sistem ayrı tutulur.
- **Güvenlik sınırı:** saklanan köy JSON'u kullanıcı tarafından düzenlenebilir. PvP ve satış için güvenilir kaynak değildir. Sunucu tarafında savaş/ekonomi kuralları, hesap kurtarma UX'i, e-posta sağlayıcı ayarları, istismar testi ve canlı eşleşme ayrıca gereklidir. Bu alanı 'tamamlandı' diye etiketlemeyin.

## 4. Sezonluk döngü — PvE SÜRÜMÜ
- 28 günde bir dönen 6 hedef (sefer zaferi, gelişim, üretim, labirent, yükseltilmiş yıldız, haftalık yarık).
- 4 kalıcı kozmetik unvan. Sezon arşivi cihazda tutulur.
- Oyun döngüsünün oyuncunun gerçek eylemlerinden ilerlemesi ve kayıt uyumu var.
- Yeni fiziksel dünya, arkadaş listesi, sunucu derecesi ve kalıcı rekabetçi sezon ligi bu kapsamda yok. Yerel sezon puanı PvP için doğrulanmış sayılmaz.

## 5. Sesler — OYNANABİLİR SÜRÜM
- Üçüncü taraf kayıt veya telifli parça kullanmadan Web Audio ile orijinal, kısa köy/savaş ambiyansı ve tıklama, kuşan, darbe, zafer, uyarı efektleri.
- Başlangıç sessizdir. Aç/kapa ayarı vardır; kullanıcı onayıyla etkinleşir, arka planda durdurulur.
- Gerçek orkestrasyon, seslendirme ve kayıtlı stüdyo sesleri hâlâ ileri kalite aşamasıdır.

## Kalite doğrulaması
- `npm run qa:all` tüm eski testleri ve beş kritik alanın testlerini çalıştırır.
- `npm run qa:visual` gerçek Chromium ile mobil-yatay ve masaüstü düzen, login formu ve ses kontrolünü kontrol eder.
- Supabase SQL sahiplik politikaları, anonim erişim kısıtları ayrıca kontrol edilmiştir.
- Gerçek çok cihazlı e-posta doğrulama akışı kullanıcının e-posta servisi ayarlarına ve teslimata bağlıdır; mock API testleri gerçek hesap açma kanıtı değildir.
