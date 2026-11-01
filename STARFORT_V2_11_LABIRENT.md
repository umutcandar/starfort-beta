# STARFORT v2.11.0 – Yıldızaltı Labirenti ve Çanta

## Oyuncunun yolculuğu
1. Yıldız Kalesi ana hikâyesinde Kül Geçidi'nden Yıldızsız Taht'a 8 bölümü sırasıyla temizle. Önerilen güçler 250'den 920'ye aşama aşama yükselir; güçlükler kolay/normal/zor/efsanevi olarak belirtilir.
2. Seferler sayfasındaki **Yıldızaltı Labirenti** düğmesine gir. Her hikâye bölümü iki labirent katının mührünü açar (16 kat/8 bölüm).
3. Labirentte 5×5 haritadan parlayan bitişik odaya tıklayarak ilerle. Odalar yakından görünür; sandık, yıldız pınarı ve tuzakları keşfet.
4. Kat muhafızını gerçek kahraman savaşında yen; çıkış portalına ulaş. Her kat altın/taş/yıldız özü kazandırır. 4., 8., 12. ve 16. katlar ayrıca birer ekipman verir.
5. Her ana bölümün ilk zaferinde en az bir belirli ekipman kazanılır; 3 yıldız başarıları daha önceki özel set ödüllerini açmaya devam eder.
6. **Çanta ve Donanım** ekranında kahramanı seç, silah/zırh/tılsım yuvasına ekipman kuşandır. Çantamdakiler / Tüm eşyalar / Üretim / Silah / Zırh / Tılsım filtrelerini kullan.

## Kademeli güç dengesi
- Ana hikâye gücü: 250, 310, 380, 450, 540, 650, 780, 920 önerilen savaş gücü.
- Labirent ilk katta ana hikâye 1'in muhafızını kullanır; her ikinci kat fazladan can ve her kat kademeli saldırı ekler.
- Savaşta kaybedildiğinde labirent haritası sıfırlanmaz; muhafız yeniden denenebilir.
- Sandıklar, pınarlar ve tuzaklar her katta tek sefer işler. Kat ödülleri iki kez alınamaz.
- Labirent zaferleri ana sefer yıldızlarını, PvP derecesini veya klan puanını değiştirmez.

## Ücretli PvE eşyaları
- Mağazada güçlü **Göksel Koleksiyon** için 3 görsel prototip görünür. Planlanan istatistikler yazılıdır.
- **Şu an satın alınamaz, ücret alınmaz, hesaba gerçek premium ekipman verilmez.**
- Üretime geçmeden önce sunucuda doğrulanan ödeme, iade, satın alma kaydı ve karakter envanterine tek seferlik ödül aktarımı gerekir.
- Rekabetçi PvP'de ücretli ekipman gücü kullanılması planlanmıyor.

## QA / sınırlamalar
- Yeni labirent mantığı, ilerleme kapısı, istikrarlı kayıt, tek seferlik ödüller, görsel bağlantılar ve ödeme kapalı önizleme için Node testleri eklendi.
- Bu sürümün UI'si masaüstü ve mobil için CSS ile uyarlanmıştır; gerçek telefon ekran görüntüsü / dokunmatik performans QA'sı ayrı doğrulama gerektirir.
- Labirent haritası orijinal, deterministik ve çevrim dışı çalışan bir tek oyuncu modudur; Wartune Guild Maze'nin çok oyunculu kazı sisteminin kopyası değildir.

## Başlat
cd starfort && npm run qa:all
