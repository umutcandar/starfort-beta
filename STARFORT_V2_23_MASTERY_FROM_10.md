# STARFORT v2.23 — Mimari 10. seviyede başlar

## Tam olarak değişenler
- **Kullanıcı kararına göre ustalık mimarisinin başlangıcı SEVİYE 10**. Level 9, 8. seviyenin tamamlanmış yerleşimini koruyor; 9→10 aşamasında ilk yeni mimari eklenti ortaya çıkıyor.
- Yedi binanın tamamında **10'dan 20'ye 11 ayrı kalıcı mimari ekleme** çiziliyor: ustalık sancağı, gözetleme feneri, burç, kraliyet arması, kemer, kristal, çift sancak, obelisk, taç, iki fener ve yıldız anıtı. Her bina kendi renk paletini taşıyor.
- Görseller hem gerçek panoramada hem bina geliştirme karşılaştırmasında **aynı çizim fonksiyonu** üzerinden üretiliyor. Sahte 10–20 önizlemesi veya yeni desteklenmeyen resim dosyası yok; ilk 8 seviyelik mimari bozulmadı.
- İnşaat başlatma ve teslim almada tarayıcının `Date.now()` değerine güvenilmiyor; Render'ın `GET /api/clock` yanıtı esas alınıyor. Sunucu yoksa işlemler *başlamıyor* ve kaynak harcanmıyor. Oyun içi kalan süre, bir kez doğrulanmış sunucu saatine ve monotonic süreye bağlanıyor.
- 1→2 tanıtım yükseltmesi servis yanıtı olmadan da oynanır.
- **Önemli dürüst sınır:** oyunun yerel kayıtları hâlâ kullanıcı tarafından değiştirilebilir. Bu yöntem sistem saatini ileri alarak geliştirmenin kolayca tamamlanmasını durdurur ama tam yetkili güvenli ekonomi değildir. Gerçek PvP/rekabetçi ekonomi için inşaat kaydı ve kaynak envanteri sunucu veri tabanında yetkili tutulmalıdır.

## Doğrulama
- Pure Node testleri: seviye 9'dan önce sıfır ustalık nesnesi, 10'da ilk, 20'de 11 nesne; bütün binalarda kademeli ve değişmez sanat, dünya sınırları, 9→10 karşılaştırma ve 20'de son görünüm.
- Saat testleri: eksik, sahte, bozuk ve erişilemeyen saat yanıtlarının reddi; aynı-origin yerel sunucu ve GitHub Pages uzaktaki Render adresi seçimi.
- Gerçek Chromium: inşaatı başlatma, kayıt yenileme, saat saptırması ve 10→11 mimari karşılaştırması için yeni ekran görüntüsü.
- Otomatik QA: syntax, oyun, entegrasyon ve görsel kontroller.
