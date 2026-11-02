# STARFORT v2.29 — Tam Başlangıç Oynanışı, Kritik Eksikler ve Geliştirme Planı

**Tarih:** 2 Kasım 2026 · **Kaynak:** STARFORT v2.28 main incelemesi + v2.29 gerçek API/QA kodu · **Kapsam:** yerel oyun, doğrulanmış çevrim içi kayıt, ekonomi, savaş, labirent, ekipman, 3D ve yayın.

## 1. Gerçek başlangıçtan oyun sonuna test: somut bulgu

Önceki `campaign-journey.test.mjs` bütün binaları seviye 8'e, bütün kahramanları seviye 20'ye, bütün kaynakları 10.000.000'a ayarlıyordu. Bu bir savaş sistemi regresyon testidir, **ilk kez oynayan insanın gerçek ilerleyişi değildir.**

v2.29'da `fresh-player-journey-v229.test.mjs` yeni kayıt oluşturur ve **başlangıç bakiyesini değiştirmeden** şu adımları aynı oyun API'leri üzerinden gerçekleştirir:

1. Başlangıç kılıcı/zırhını gerçek `equipItem` ile kuşanır. İlk hikâye savaşını henüz hiçbir bina/hero şişirmeden kazanabilir.
2. Gerçek kaynak üretimini günde bir toplar ve günlük ödülü takvimden günde bir alır. Saatin gerçek beklemesi yerine **UTC sanal günlerle hızlandırılmış** zaman modelini kullanır.
3. Kahramanları yalnızca kasada yeterli kaynak varsa yükseltir; kalenin/demirhanenin gerçek inşaat kuyruğu ve bitiş zamanı beklenir.
4. Labirentte gerçek bağlı koridorlar boyunca yürür; muhafıza gerçek savaş başlatır, muhafızı yenip geçitten çıkar ve kat ödülünü gerçek oyun fonksiyonuyla alır.
5. Sekiz hikâye bölümünü sırayla oynar; kapıların gerektirdiği demirhane, ekipman, labirent ve takım gücü koşullarını uygular; her gün save/restore sağlamlığını doğrular.

**Deterministik başlangıç testi sonucu:** 11 sanal gün sonunda **8/8 ana hikâye, 24/24 hikâye yıldızı, 8 labirent katı, demirhane seviyesi 4 ve takım gücü 945**. Başlangıçta hiçbir oyuncuya ekstradan seviye veya para verilmemiştir.

### Bunun işaret ettiği tasarım sorunu
İlk 8 bölümün oynanabilirliği olumlu; ancak daha çok **içerik ve meydan okuma** gerekiyor. 11 günde biten hikâye, her yapı için 20 seviye ve 100+ günlük tek usta bekleyişi ile eş zamanlı olarak oyuncuyu uzun süre aktif tutmayabilir. Hikâyeyi sırf zorlaştırarak veya 3 günlük kapılar koyarak bu sorun çözülmez. Bu, insan davranışı/retention ölçümü de değildir; özellikle yetenekleri optimâl kullanan hızlı sanal oyuncu senaryosudur.

## 2. Bu pakette giderilen P0 sorunlar

| Önceki sorun | Doğrudan düzeltme | Doğrulama |
|---|---|---|
| Sunucu hesabının komutan rehberi yerel kayıttaki 8 bölüm başarısını gösterebiliyordu | `commanderPath(villageView())`, sunucudan gelen ilerleme ve `serverRiftWeek` kullanır; eski `riftRecords` online başarı yerine kabul edilmez | Unit testte sahte yerel tamamlamayla sıfır online başarı |
| Usta seferinde arayüzü atlayıp doğrudan kademe 3 RPC çağrısı yapılabiliyordu | PostgreSQL `mission_start` artık `tier <= previous tier + 1` doğrular; eski kazanılmış kademeler tekrar oynanabilir | Sentetik auth.uid ile rollback testi: 3 reddedildi, 1 kabul edildi |
| Misafir oyununda bölüm 3–8 kapıları varken online PvE bunları atlayabiliyordu | Sunucu da aynı demirhane/kuşanılmış eşya/labirent katı şartlarını doğrular; eski tamamlanmış bölümlerin tekrarı bloklanmaz | SQL migration uygulandı; canlı fonksiyon kontrolü dört güvenlik kapısını doğruladı |
| Oyuncuya sadece 'kilitli' deniyordu | Online sefer kartları eksik şartları gösterir; rehber demirhane, ekipman veya labirente doğrudan yönlendirir | `official-progress-coach-v229.test.mjs` 3–8 kapılar ve dinamik hedefler |
| 8 sefer testi aşırı güçlendirilmiş hazır hesapla geçiyordu | Başlangıç bakiyeli gerçek 1–8 günlük ilerleme testi eklendi | 11 sanal günlük deterministik autoplay |
| `qa:smoke` eski 2.8.1 sürümünü arıyordu ve `qa:all` içinde yoktu | HTTP/Render sunucu smoke testi v2.29'a güncellendi ve tam QA zincirine eklendi | GitHub QA içinde gerçek HTTP route, statik asset ve auth koruması |

**Açık doğrulama sınırı:** Forge/maze/gear kapılarının PostgreSQL fonksiyonunda canlı olduğu ayrıca okundu; sentetik oyuncunun tüm kombinasyonlarını canlının içinde transactionla değiştiren ek testin bir denemesi güvenlik/kısmi izin hatasıyla tamamlanamadı. Sıfır oyuncu verisi değiştirilerek bu konuda test yapıldığı iddia edilmez. SQL tarafındaki kural, offline sözleşme testleri ve canlı fonksiyon kontrolü mevcuttur.

## 3. Sıradaki ürün işleri — gerçek öncelik ve tamamlanma ölçütü

### P1 / Kısa vadede en büyük kazanım: gerçek savaş derinliği
- **Sunucuda gerçek zamanlı ortak savaş durumu:** mevcut resmî PvE 3 saniye/hamle ve 14 tur sınırıyla çalışıyor; 3D çizim motoruyla aynı fizik/pozisyon otoritesine sahip değil. Yeni savaş protokolü, doğrulanabilir pozisyon ve hedef seçme, AI niyetleri, takım kontrolü, ödülden tamamen ayrı güvenli işleme ile kademeli tasarlanmalı.
- **Düşman çeşitliliği:** mevcut dört niyet (strike/crush/shield/drain) sabit döngüde. Bölgeye özgü saldırı, farklı öncelik seçme ve daha zor patron safhaları olmalı.
- **Kabul ölçütü:** PvE ve PvP aynı taktik/hasar sözleşmesini paylaşmalı, istemciden gönderilen sahte sonuç ödül yazamamalı, 3D/2D her platformda aynı sunucu HP'sini göstermeli, reconnect sonrası savaş aynı kalmalı.

### P1 / İçerik: 11-günlük hikâyenin bitişindeki boşluk
- **İkinci hikâye perdesi:** 8 bölümden sonra anlamlı yeni bölgeler, düşmanlar, hikâye sahneleri, boss ve ganimet; yeni bir içeriği sadece mevcut bölümün istatistiklerini artırıp 'yeni sefer' diye sunmamak.
- **Tekrar oynanabilir mücadele:** boss safhaları, günlük/haftalık değişen harita unsurları, farklı takım kompozisyonu gerektiren hedefler.
- **Kabul ölçütü:** yeni oyuncunun ilk saatini, 7. günü, 30. günü ve hikâye sonrası dönemi ayrı sanal senaryolarla test etmek; beta gerçek oyuncu davranışıyla da kıyaslamak.

### P1 / Gerçek çok oyunculu ve güvenlik
- **Sunucu ölçek testi:** eşzamanlı hesap savaşı, lonca etkinliği, ortak patron ledger kilitleri, duplicate RPC/replay, doğrulama token süresi, kaynak sınırları, Render restart.
- **Sıra/kontrat tutarlılığı:** arena/klan maç sonu ödüllerinin server-only oluşu, bir zafer için bir ödül, sıralama ve rekabette tüm maliyetlerin güvenilir UTC saatine bağlı olması.
- **Kabul ölçütü:** 25/100/250 senaryolu sentetik yük raporu; hata oranı, p95 RPC süresi ve maç başına işlem tutarlılığı. Gerçekçi bir kullanıcı sayısı performans testi yapılmadan vaat edilmemeli.

### P2 / Köy ve metagame
- **Seviye 10–20 bina evrimi:** sadece sayısal yükseltme değil, farklı görsel silüet, oynanışa etkili uzmanlık ve inşaat devam ederken üretilecek anlamlı kararlar.
- **Ekipman ekonomisi:** +5 sistemine ek nadir malzemeler, güvenli elde etme kaynakları, yalnızca mağazadan alınan güç avantajı yaratmayan crafting.
- **Günlük 28 gün takvimi:** tekrar başladığında motivasyonu kaybettirmeyen ama zorunlu girişe de cezalandırmayan farklı döngü temaları.
- **Mobil erişilebilirlik:** düşük uç GPU, dokunmatik kumanda, ekran okuyucu ve düşük hareket tercihi, gerçek cihaz taraması.

### P0 / Dağıtım altyapısı (ürün operasyonu)
- **Render otomatik deploy sorunu (#16) devam ediyor:** GitHub main'e push, Render'a her zaman otomatik geçmiyor. Bugüne kadar yeni sürümler manuel deploy doğrulaması ile canlıya alındı. CI–CD tetik sorununun çözülmesi gerekiyor; başarı logu ve SHA eşleşmeden 'canlı' denmemeli.

## 4. Yarın yapılabilecek kullanıcılı kabul senaryosu
1. Yeni misafir oyunu aç: 1. bölüm, başlangıç envanteri, kale1 ve günlük 1. sandık.
2. Hesapla giriş yap: misafir kaydı sunucu seferlerini/ödülleri haksız yere açmamalı.
3. Sefer 3'e gel: eksik demirhane, labirent ve eşya şartları kartta görünmeli; tamamlayınca açılmalı.
4. Usta seferi: önce kademe1, ardından 2, son olarak 3; doğrudan 3 talebi sunucuda reddedilmeli.
5. Savaş sırasında 3D↔2D değiştir, sayfayı yenile, mobil ekranı dene: HP, ödül ve aktif görev aynı kalmalı.
6. 28 günlük sandıkta bugün/yarın/7-14-21-28 içeriklerini gör; bugün bir kez alıp yeniden açmayı dene.

**Test yapılmadı olarak işaretlenenler:** gerçek insanın 90–180 günlük davranışı, canlı ortamda gerçek oyuncu eşzamanlı yükü, her cihaz GPU uyumluluğu. Bunlar henüz kanıtlanmış değildir.
