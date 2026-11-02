# STARFORT v2.26 — Tek Paket: Resmî Savaş, Dünya Haritası, Eşya Ustalığı, Ortak Patron

## Hedef
v2.25'te köy, kahraman ve ödül ekonomisi sunucuya taşındı. v2.26, bu güvenli altyapıya gerçek oynanış derinliği ve görsel kalite ekleyen **tek sürüm**dür.

## Teslim edilen oyun mekanikleri
**Sunucu onaylı resmî savaş görselleri:** Yerel savaşta kullanılan mevcut resmî kahraman sprite atlasları (hero 1–3) ve düşman atlası, aynı bölüm atmosferleri ve savaş alanı görseli resmî sunucu savaşının içerisine kompoze edilir. Üç kahraman/düşman dizilimi, can yüzdeleri, tur, yetenek animasyon çağrıları ve mobil düzen sunucu görev durumuyla beslenir. Hasarı, düşman HP'yi ve ödülleri *tarayıcı belirlemez*. Bu, eski 3D denemenin tamamen aynı 3D motorla birleştirilmesi değildir; mevcut çizim varlıklarını paylaşan 2D görsel birlikteliktir.

**Yedi özgün kahraman taktiği:** Resmî savaşta oyuncu takımındaki üç kahramanın portresinden kendine ait özel hamlesi çağrılır. Aldren siper kurar; Lyra güçlü yıldız hasarı; Rovan yaralı düşmana odaklanır; Mira iyileştirir; Doran çift darbe etkisi; Vesper bitirici darbe; Eira buz/koruma/şifa uygular. Komut `skill:<heroId>` olarak gider. Sunucu oyuncunun takımını doğrular ve her kahraman için üç turluk yenilenme süresi tutar. Genel saldırı/siper/yıldız taktiği mevcut olmaya devam eder; gerçek zamanlı 3 saniyelik genel hamle sınırı korunur.

**Büyük sefer haritası:** Kuzey Kıtası'nda konumları ve temaları farklı **8 resmî bölge düğümü**, bağlayıcı yollar, etkileşimli bölge seçimi, 1–3 yıldız (24 toplam), 1–3 kademe usta mührü (24 toplam), bölüm kilitleri ve hızlı savaş başlatma. Bu sürüm *24 yeni hikâye bölümü* eklemez; mevcut 8 bölüm ve 24 usta mücadelesini tek haritada gösterir. Mevcut karakter ilerlemesi korunur.

**Ekipman endgame:** Her kazanılmış eşya türü hesaplı sunucu ekonomisinde **+1–+5 ustalık** kazanabilir. Nadirlik (common/epic/legendary) maliyet çarpanı ve karesel artışla kaynağa yük bindirir; tek eşya türünün tüm kopyaları etkilenir. Sunucu can/atak katkısını ve aynı kahramana kuşanılmış 2 parçalı Ay/Kor/Şafak set eşleşmesini hesaplar; item statları istemcide de görünür. Maliyet sabittir: bir sonraki tier `N`, rarity `R` için altın `120*N²*R`, taş `40*N*R`, yıldız özü `8*N²*R` (R=1,2,3). Sunucu kaynak keser; kayıt JSON'u eşyayı yükseltemez.

**Ortak dünya patronu:** Hesaplı oyuncular 4. hikâye bölgesinden sonra haftalık **Küllerin Kadim Hükümdarı** seferine çıkabilir. Her hesap haftada bir kez doğrulanmış zafer katkısı bırakır. Haftanın küresel ortak hasar hedefi **4.500**; herkesin gerçek galibiyet katkısı PostgreSQL'de kilitli tabloda birikir. Ortak hedef tamamlandıktan sonra o haftaya gerçekten katkı yapan her hesap **yalnızca bir kez** altın/taş/yıldız özü ortak ödül sandığını alır. Bu mod **asenkron ortak dünya etkinliği**dir; klana özel eş zamanlı çok oyunculu baskın değildir. Mevcut lonca ve lonca baskınları v2.25'ten korunur.

**Uzun vadeli ekonomi:** 20 bina seviyesi, tek usta ve mevcut üretim süreleri korunur. Yeni +5 eşya ustalığı kaynaklara ikinci tüketim hattı ekler. Haftalık patron, yıldız ve veteran tekrar oynanabilir hedefler verir. Yeni hesap ile yerel deneme kaydı karıştırılmaz.

## Sunucu ve veri güvenliği
- `starfort_player_progress`: `item_upgrades` ve `boss_week` alanları geriye dönük varsayılanla eklendi.
- `starfort_world_boss_week`: haftalık toplam, hedef, katılımcı galibiyet sayısı.
- `starfort_world_boss_contribution`: hesap başına haftalık hasar ve ortak sandık alma kaydı.
- Her iki tablo RLS açık; anonim ve authenticated doğrudan `SELECT`/`UPDATE` yapamaz. Tek hesap RPC'si `auth.uid()`, `FOR UPDATE` ve UUID tekrar istek korumasıyla yönlendirir.
- `GET` yanıtında yalnızca doğrulanmış hesap eşyaları, ustalık ve ortak dünya patronu özeti gösterilir. Tarayıcıdan sayı/hasar gönderimi ödül vermez.
- Başarısız geliştirme, yetenek veya ödül talebi atomik işlemi geri alır.

## Kaynaklar ve uygulanan migrasyonlar
- `starfort/sql/starfort-v226-world-boss-gear.sql`: yeni tablo şeması, kalıcı eşya ustalığı, set senkronu ve patron seferi.
- `starfort/sql/starfort-v226-hero-abilities.sql`: son resmî savaş RPC'si ve yedi kahraman yeteneği. **Güncel fonksiyon kaynağı budur.**
- Canlı migrasyonlar: `starfort_v226_gear_world_boss_economy`, `starfort_v226_distinct_hero_skills`.
- `starfort/world-combat-v226.test.mjs`: 8 bölge + sahici görsel atlas, gerçek sunucu profilindeki nadirlik, eşya maliyeti, ortak ödül ve farklı yetenek sözleşmeleri.
- Gerçek Chromium mobil/masaüstü: sunucu hesabı, 1. kahraman geliştirmesi, +1 eşya ustalığı, harita, patron düğmesi, gerçek sprite alanı ve mobil ekran görüntüsü.
- Canlı Supabase rollback'li QA: +1 geliştirme maliyeti, çift istek koruması, patron galibiyeti, küresel hasar/ödül kilidi, ikinci sandık denemesi, Lyra özel yeteneği ve takım dışı/kısa cooldown komutlarının reddi. Test kimlikleri ve verileri commit edilmedi, transaction sonunda tamamen geri alındı.

## Açıkça kalan sınırlar
- Bütün canlı kullanıcı trafiği için performans/yük testi yapılmadı; ürün öncesi gereklidir.
- Eski tam 3D yerel savaş motoru ile resmî server battle motoru aynı hesaplama motoru hâline getirilmedi; görseller ve karakter varlıkları ortaklaştırıldı ve yeni sunucu kontrollü taktik oyun geliştirildi.
- Klanlara özel eş zamanlı çok oyunculu patron seferi yerine **haftalık asenkron ortak dünya etkinliği** teslim edildi. Mevcut lonca sistemi bozulmadı.
- Gerçek e-posta token'ıyla kullanıcı kabul testi için test kullanıcısı gerekebilir; bot/rollback Supabase kimliğiyle otomatik testler bunu ikame etmez.
