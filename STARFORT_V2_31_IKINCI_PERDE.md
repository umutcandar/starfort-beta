# STARFORT v2.31 — Şafağın Ötesi / Act II

## Kapsam

8 ana Kuzey Seferi bitince açılan ayrı hikâye perdesi. Sekiz yeni bölge ve her bölge için üç operasyon (toplam 24 savaş hedefi) içerir:

1. Kızıl Ufuk — Kızıl Gözcü
2. Cam Çölü — Cam Kehanetçisi
3. Göktaşı Vadisi — Göktaşı Devi
4. Diken Tacı — Diken Kraliçesi
5. Mavi Kül Dağı — Kül Muhafızı
6. Sonsuz Gece — Gece Başrahibi
7. Fırtına Sırtı — Fırtına Mareşali
8. Şafak Uçurumu — Boşluk Varisi

## Kalıcı kayıt ve ödül

- Her ilk zafer sunucu tablosundaki `act2_cleared` dizisine sıralı kaydedilir; 1–3 yıldız `act2_stars` içinde tutulur.
- Tüm ilerleme yalnızca `sfb_starfort_progress` içinden, kullanıcı kimliği ile kilitli sunucu satırında hesaplanır.
- Bir bölge üç dalga içerir. Aktif savaşın HP'si, süre/tur sayısı, kahraman bekleme süreleri ve dalga numarası sunucuda saklanır; tarayıcı yenilemesi kayıt kaybettirmez.
- Son dalga kazanılmadan **altın, yıldız, görev sayacı veya yeni bölge açılmaz**.
- Tekrar oynanan ikinci perde bölümleri azaltılmış kaynak verir; yıldız puanı daha iyi sonuç gelirse yükselir.
- Yeni bölgelerde güç eşikleri artar, gelen hasara karşı hücum/siper/yetenek tercihleri önemlidir. Düşman niyetleri bölge ve dalgaya göre değişir.
- Mevcut ilk perde, eski yarık, labirent ve usta savaşı kayıtlarını silmez.

## Teknik kurulum

- Sunucu migration: `starfort/sql/starfort-v231-second-act.sql` (2 yeni JSONB kolon, güvenli kimlik kontrollü fonksiyon).
- İstemci: `starfort/second-act.js`, `starfort/second-act-view.js`, doğrulanmış ikinci perde kartları ve WebGL sahne isimlendirmesi.
- Doğrulama: `starfort/second-act-v231.test.mjs` ve `npm run qa:all`.
- Eski hesabın 8 ana bölgeyi geçmiş olması gerekir. Misafir moduna yeni perde henüz eklenmemiştir.
- Yeni illüstrasyon ve benzersiz düşman modelleri yoktur; şimdilik mevcut savaş atlası kullanılmaktadır.

## Sonraki öncelikler

1. Gerçek oyuncuyla 1–8 perde-II bölümünün tam tempolu oynanış testi: 1, 7 ve 30 günlük denemeler.
2. Her bölgeye özgü saldırı mekaniği ve daha uzun süren, karar veren patron döngüleri.
3. Misafir hikâyesini, aynı 24 yeni operasyonu destekleyecek şekilde kayıt kaybı olmadan genişletme.
4. Benzersiz ikinci perde ekipmanı ve elde etme dengesi.
5. Render'ın main commit'ini otomatik algılamaması sorununu kalıcı çözme ve gerçek tarayıcı/cihaz QA.
