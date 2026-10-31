# Starfort v2.5.2 kalite kontrol

**Amaç:** Tek başına savaş deneyimini açmak, kötü görünen deneysel 3B motoru varsayılan olmaktan çıkarmak ve görsel iddiaları gerçek sonuçlardan ayırmak.

- Oyun modeli: mevcut kale, kahraman, PvP, klan ve kuşatma mantığı korundu.
- Savaş varsayılanı: Sinematik 2.5B; 3B yalnızca deneysel.
- Düello botu: gerçek sunucu tick'leri; rakibin hareket/hasar/yetenek hesapları istemciye bırakılmadı.
- Takım botları: tek oyuncuyla 2v2 ve 5v5 kuşatma örnekleri; antrenman/ödülsüz.
- Tam test komutu: `npm run qa:all`.
- Görsel test: 1440×900 ve 844×390; yüklenen animasyon atlasları 6/6; Canvas2D fallback; JavaScript hatası yok.
- **Açık eksikler:** WebGL2 gerçek GPU doğrulaması, fiziksel telefon FPS, profesyonel glTF karakterler, doğal kemik animasyonu, sahne objelerinin kalite tutarlılığı. Resimli arka plan dinamik 3B dünya değildir.
