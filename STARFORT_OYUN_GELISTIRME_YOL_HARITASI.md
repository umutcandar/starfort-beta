# STARFORT — Tam Oyun Geliştirme Yol Haritası
2 Kasım 2026 | v2.35 paketi

## Hedef
Hesap zorunlu, sunucuda doğrulanmış ilerleme ile çalışan, 1–3 yıldızlı seferleri, kalıcı karakter/eşya/köy geliştirmeleri, tekrar oynanabilir patronları ve zamanla topluluk oyununu destekleyen uzun soluklu bir strateji/RPG.

## Gerçekten çalışan sistemler
- Köy: 7 yapı × 20 seviye, tek inşaat ustası, doğrulanmış maliyet ve zaman, 24 saatlik sınırlı kaynak üretimi, kalıcı tekil istek kaydı.
- Hesap: doğrulanmış Supabase e-posta hesabı; misafir oynanışı kapalı. Sunucuda kahraman, eşya, ekipman, yükseltme ve takım.
- Seferler: ana hikâye 8×3 dalga, ikinci perde 8×3 dalga, 8 benzersiz ikinci-perde patron yeteneği, 1–3 yıldız, 2D/3D karşılaşmalar.
- Diğer faaliyetler: labirent, usta seferleri, haftalık yarık/dünya patronu, günlük sözleşmeler, 30 rütbelik Komutan Kroniği, günlük ödül takvimi.
- **v2.35:** Kervan Pazarı (kale seviye 2/3/4; kaynak takası; günde en çok 2 farklı rota) ve ilgili bina eksiğini öneren geliştirme UI'si.
- En kritik hesap davranışı gerçek Supabase JWT ile sınandı; doğal yeni oyuncu ilk seferi 9 turda 3 yıldızla kazandı. 16 bölgenin RPC zinciri yalnızca **geçici, hızlandırılmış test önkoşullarıyla** doğrulandı; bu tam oynanış deneyi değildir.

## Üretime çıkmadan yapılacak işlerin öncelik sırası

### P0 — Temel ürün güvenliği ve erişilebilirlik
1. Gerçek gelen kutusundan onaylama, şifre kurtarma ve hesap oluşturma için özel SMTP + alan adı. Doğrulamayı kapatma; gerçek limit ve spam önlemlerini ölç.
2. Gerçek oyuncu kabul testi: sıfırdan bina inşaatı, ilerleme kapıları, 16 seferin ödülleri ve uzun süreli çıkış/giriş. Geçici yüksek seviye hesabı bu testin yerine geçmez.
3. Render otomatik deployment bağlantısını düzelt; GitHub QA geçmeden üretime geçme. Sunucu verileri, 3D fallback, ağ kesilmesi ve depolama sınırlarını doğrula.
4. Kaynak, ekipman, mission, günlük ödül ve lonca API'leri için güvenlik taraması (RLS, spoof, replay, rate limit ve yarış koşulları). Test arayüzü üretim sayfasına eklenmemelidir.

### P1 — Daha zengin PvE oyunu
1. Seferlerde özgün olay ve seçimler: keşif rotaları, savaş öncesi ikmal, farklı karşılaşma taktikleri ve saydam ödül gösterimi. Tüm ekonomik kararlar RPC'de.
2. Nadir eşya kazanımı ve sandık ilerleme sistemi; sahte veya sınırsız düşüşleri engelleyen sunucu loot tabloları, koruma/garanti sınırları.
3. Kahraman ve ekipman uzmanlaşması: takım rollerine göre anlamlı, karşı taktikli yetenekler; sadece sayı artırma değil.
4. Zorluk dengesi: hesap gücüyle patronların sonsuz ölçeklenmemesi, her 1/2/3 yıldızın dürüstçe elde edilebilir olması; yeni hesap → ileri aşama ulaşılabilirlik simülasyonu.

### P2 — Topluluk ve rekabet
1. Mevcut yerel Guild/arena Node prototipini Supabase Auth kimliğiyle bağlanan güvenli eşleştirme sistemine taşı. Şimdilik bunu yayınlanmış, güvenli canlı çok oyunculu ürün olarak tanımlama.
2. Sunucu doğrulamalı lonca katkıları, arkadaş/ittifak, grup patronu ve maç kayıtları; çift ödül/kendi kendine farm koruması.
3. Eşleştirme adaleti, oyuncu bulunmadığında PvE alternatifleri, sezon ve birikimli rütbelerin erişilebilirliği.

### P3 — Yayın kalitesi
1. Dokunmatik oynanış, 390px ve daha küçük ekranlar, 2D/3D düşük cihaz performansı, erişilebilir renk/animasyon seçenekleri.
2. Kontekst yardım/öğretici, bekleme sürelerini anlaşılır gösterme, kaynak açıklarının nerede giderileceğini anlatma.
3. Gerçek trafik, yük, yeniden başlatma, veri yedeği, hata ve performans izleme; bakım araçları.

## v2.35 Kervan Pazarı güvenliği / ekonomi

| Rota | Açılış | Harcanan | Kazanılan |
| --- | ---: | --- | --- |
| Karaorman | Kale 2 | 180 altın + 35 taş | 220 kereste |
| Aytaşı | Kale 3 | 200 altın + 90 kereste | 175 taş |
| Yıldız | Kale 4 | 260 altın + 140 kereste + 120 taş | 28 yıldız özü |

Günlük **2 farklı rota** limiti UTC gününe göre hesaplanır. Aynı rota aynı gün tekrar alınamaz. Kaynak yetersiz, depo dolu, kale seviyesi düşük veya üçüncü rota talebi sunucuda reddedilir. Sunucu idempotent UUID kaydı, kullanıcıya özel satır kilidi ve `auth.uid()` koruması sürer. Bütün kaynaklar sunucu ledger'ında atomik değişir. Bu bir çevrim içi oyuncu pazarı değil, NPC ikmal kervanıdır. Günlük kota üretim/upgrade süresini ortadan kaldırmaz.

## Test kriterleri
- Her sürümde Node testleri, Chrome kilit/giriş/mobil smoke ve Supabase RPC işlemi için önceki davranış regresyonu.
- Her yeni ekonomi eyleminde geri alınan test hesabı ile gerçek SQL, eşik, tek kullanımlık ve replay testi.
- Tek yönlü ticaret; iki kaynak yönü arasında döngüyle sınırsız değer kazanılması engellenmeli.
- GitHub Pages ile Render aynı commit, SQL migration uygulanmış olmalı; adımlar ayrı ayrı raporlanmalı.
- Testin gerçek insan oyununu temsil etmediği her yerde açıkça belirtilmeli.
