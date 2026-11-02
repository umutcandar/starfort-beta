# STARFORT v2.30 — Sunucu onaylı 24 hikâye görevi

8 ana bölge korunur; her biri 3 ayrı isimli görevden oluşur (toplam 24).

- Görev 1: keşif/ilk savunma (0.8 × temel düşman canı)
- Görev 2: orta hat savunması (1 × temel can)
- Görev 3: final operasyonu (1.25 × temel can)
- Dalgalar arasında toplam takım canının en çok %24'ü toparlanır; kahraman yeteneği bekleme süreleri ve savaş tur sayacı korunur.
- Her geçiş sunucuda saklanır. Kazanç/ganimet, 1–3 yıldız ve bölüm açılması **yalnızca final operasyonunda** yapılır.
- Tek dalgalı eski aktif seferler geriye uyumludur. PvP, usta seferi, labirent ve haftalık yarık tek dalga kalır.
- Hesap UI 24 görev rotasını, aktif görevi ve üç adımlı ilerlemeyi gösterir. Misafir hikâyesi şimdilik 8 bölüm olarak kalır.
- Yeni hikâye için 36 hamle sınırı, üçüncü yıldız için 18 tur + %70 takım canı şartı uygulanır.

## Kurulum

SQL: `starfort/sql/starfort-v230-story-operations.sql` dosyası, Supabase'de eski `sfb_starfort_progress` fonksiyonunun yerine uygulanmalıdır. SQL yayınlanmadan istemci 3 dalgalı oyun göstermez. Paket QA ve canlı doğrulamadan sonra yayınlanmalıdır.

## Güvenlik

Tek istemci eylemi `mission_turn` komutudur. İstemci dalga, HP, tur sayısı veya ödül miktarı gönderemez. Tekil istek UUID'si ve kilitli ledger korunur; ara dalgalar kaynak, yıldız veya eşya kazandırmaz.
