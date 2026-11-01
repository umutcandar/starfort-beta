# STARFORT v2.21 — Köy Geliştirme Merkezi

## Yeni deneyim
Köy haritasındaki herhangi bir binaya dokununca bina küçük bir maliyet penceresi yerine tam boyutlu, oyun temalı *Geliştirme Merkezi* açar. Tüm yedi bina yan menüde; bina değiştirmek için pencereyi kapatmak gerekmez. Mevcut ve sonraki mimari görünümü, sekiz seviyelik ilerleme, gerçek üretim veya takım bonusu karşılaştırması, bir sonraki mimari parça, maliyet yüzdesi ve eksik kaynakları aynı akışta gösterir.

- **Geliştirilmeye hazır:** Tek tıklamayla seviye atlatır, pencere açık kalır.
- **Toplanacak üretimle hazır:** Tek işlemle biriken kaynakları toplar ve yükseltir. İşlem başarısızsa oyunun kayıt durumu değişmez.
- **Eksik:** Kaynak detayları ve yalnızca mevcut üretim hızına dayanıyorsa yaklaşık bekleme süresi; beklemeyecekse sefer kaynakları önerisi.
- **Kale kilidi:** Kilidin nedenini ve ilgili kaleye git düğmesini gösterir.
- **Savaş / son seviye:** Yanlış yükseltme işlemi sunmaz.
- **Krallık planı:** Şu anda geliştirilebilen öncelikli binaya geçiş sunar.

Ekran 3 sütunlu geniş masaüstü, dokunmatik yatay mobil ve dar dikey mobil için farklı düzenlere sahiptir. Mevcut köy resimleri, aynı çizim sistemi, mevcut bina/oyuncu verileri ve Supabase kayıt uyumluluğu korunmuştur.

## Gerçek ekonomiye bağlı
`R.upgradeBuildingFromProduction` yalnızca mevcut `production` ve `upgradeCost` fonksiyonlarını kullanır; 24 saatlik üretim tavanını, 4 saatten sonraki yavaşlamayı, kale ön koşulunu, aktif savaş kilidini ve kaynak tavanını aşmaz. Başarısız işlem atomiktir ve kaydı değiştirmez. Yeni bina, yeni para birimi, yükseltme süresi veya premium kısayol eklenmez.

## Kontrol
`building-workshop-v221.test.mjs` bina planının hesaplarını, kayda dokunmadan önizlemeyi, yapım kilitlerini, mevcut üretimin birlikte harcanmasını ve responsive CSS/uygulama bağlarını test eder. Mevcut senaryolar ve Chromium layout smoke tests koşmaya devam eder.
