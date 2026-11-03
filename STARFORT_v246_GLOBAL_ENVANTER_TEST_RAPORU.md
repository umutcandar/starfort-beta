# STARFORT v2.46 — Global envanter ve çeviri denetimi

**3 Kasım 2026 · Kapsam: UI metinleri, 14 dil ve test otomasyonu**

## Tamamlanan işler
- `locale-armory-v246.js`: Her biri **34 çevrilmiş arayüz anahtarına** sahip 14 gerçek dil paketi. Envanter başlığı, seçici, filtreler, silah/zırh/tılsım kategorileri, eşya tak/çıkar/üret, otomatik kuşan, karakter ve istatistik etiketleri, materyal kategorileri ve erişilebilirlik etiketleri.
- `locale-items-v246.js`: **19 kanonik eşyanın** tamamı için İngilizce görsel ad ve açıklama, 3 setin İngilizce adı ve 4 kaynağın İngilizce adı/açıklaması. Türkçe dışı 12 ek dilde eşya lore içerikleri şimdilik **İngilizce yedek**; tamamı çevrilmiş gibi sunulmuyor.
- `armory-v212.js`: Envanter, eşya karşılaştırması, ustalık, set bonusu, kalan maliyet, seviye ve filtre etiketleri sözlükten. `data-equip`, `data-unequip`, `data-forge`, `data-account-enhance`, `data-auto-equip` gibi gerçek oyun eylem kimlikleri **değişmedi**.
- `scripts/i18n-coverage.mjs`: Çeviri sözlüklerindeki kayıp/boş/fazla anahtarları ve eksik eşya İngilizce açıklamalarını yakalar. Envanter ve ödül takvimindeki ham Türkçe statik HTML parçaları için katı kontrol yapar. Arena, mağaza, savaş, lonca ve diğer modlardan potansiyel eksik metinleri dosya/örnek/satır olarak raporlar.
- `locale-v246.test.mjs`: Tüm 14 dille açılan gerçek envanter ekranı, kanonik 19 eşyanın ID/maliyet/istatistik özdeşliği, ödül ekranı çeviri sözlüğü ve ilerleme kaydı değiştirmeyen ekran testi.
- Eski Türkçe görsel beklentilerin, metinlerin artık sözlükten geldiğini hesaba katması için regresyon testi güncellendi.

## Önemli güvenlik ve oynanış ilkeleri
- Çeviri modülleri kullanıcı oturumu, ödül hakkı, SQL/RPC, premium hakları veya ekonomi değerlerine dokunmaz.
- Ekrandaki eşya adını çevirmek, bir eşyanın `id` değerini veya nadirliğini değiştirmez.
- Oyun doğrulanmış sunucu hesabı olmadan açılmaz; misafir modu geri getirilmedi.
- Ekipman görselleri ve tüm eylem kimlikleri korunmuştur.

## Kapsamın doğru okunması
Sözlük testlerinin %100 geçmesi, oyunun %100 çevrildiği anlamına gelmez. Bu paketin **34 envanter kontrolü tüm 14 dilde**, **19 eşyanın uzun isim/açıklaması yalnızca Türkçe + İngilizce** mevcuttur. 12 ek dil için uzun hikâye/eşya açıklamaları hâlâ İngilizce yedektir. Statik metin denetimi dinamik sunucu hatalarını veya oyun içeriğinin tamamını otomatik tespit edemez.

## Sonraki global yayın engelleri
1. Arena ve ittifak/klan menülerinin tüm ana düğme, durum, erişilebilirlik metinleri; bot eşleşmesi ve maç raporları
2. Premium mağaza, PvP, sezon ve görev metinleri
3. Hikâye, kahraman, 19 eşya ve ikinci perde için 12 ek dilde gerçek çeviriler
4. Ana dili konuşan editör kontrolü; Japonca/Çince/Arapça font, RTL ve mobil taşma testleri
5. Moderasyon, gizlilik, veri işleme, yerel fiyatlandırma / ödeme altyapısı ve küresel gecikme/yük testleri
6. **Render otomatik dağıtım**: Servis `main` ve `autoDeploy=yes` gösterse de 2.42–2.45 güncellemelerinden sonra hiçbir otomatik dağıtım olayı tetiklenmemişti. 3 Kasım 2026'da `clearCache=true` ile v2.45'in yeniden dağıtımı başlatıldı. Canlı olma ve v2.46 geçişi ayrı doğrulanmalı.

## Yerel doğrulama

```bash
cd starfort
npm run qa:syntax
npm test
node scripts/i18n-coverage.mjs --check
```

Her sürümün gerçek Render commit SHA'sı ile GitHub main SHA'sı karşılaştırılmalıdır.
