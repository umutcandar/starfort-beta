# STARFORT v2.28 — Ortak 3D Savaş Motoru ve Sunucu Onaylı PvE

## Ana hedef

v2.27'ye kadar resmî hesaplı seferler 2D sprite animasyonlarla, yerel grafik laboratuvarı ve çok oyunculu arenalar ise ayrı WebGL3D/Canvas2D çizim altyapısıyla oynanıyordu.

**v2.28'de resmî hesabın hikâye, usta seferi, labirent, yarık ve ortak patron savaşları aynı 3D renderer'a bağlandı.** Oyuncunun gerçek sunucu tarafı savaşını kaydettiği `public.sfb_starfort_progress` RPC'si hasarı, taktik komutu, yetenek bekleme süresini ve galibiyeti hesaplamayı sürdürüyor. 3D motor oyuncunun sunucu kaynaklarını/ganimetlerini değiştiremiyor.

## Gerçek yapılan birleştirme

- `official-battle-bridge.js`: doğrulanmış Supabase PvE görevi -> **mevcut arena renderer'ın `room.players`, `room.squads`, `room.fx`, `room.id` sözleşmesi**. Oyuncu üç kahraman ve üç düşmanı görür. Şirket içi takım/konum animasyon verileri gerçek hasar veya fizik kurallarına dönüşmez. Sahnedeki konumlar *yalnızca çizim koreografisidir*.
- `official-3d-director.js`: **gerçek `createBattleRenderer(...,{renderMode:'3d'})`**, `graphics-3d.js` WebGL2/mesh/kemik/animasyon motoru. Kontroller mobilde performans modunu, masaüstünde dengeli modu seçer. GPU desteği olmayan ortamlarda görsel sprite fallback kullanılır.
- 3D oyun motoruna verilen resmî PvE durumları sunucu RPC'sinden gelir. Render edilmiş can, alınan hasar, son hamle ve galibiyet/ganimet bilgisi istemcide üretilmez. Hileli localStorage/JS 3D grafiği para kazanma aracı yapmaz.
- Kullanıcı **3D/2D** arasında savaş sırasında geçiş yapabilir; seçim bu tarayıcının görsel tercihidir, oyun ekonomisini değiştirmez.
- Her yenilemede `workspaceEl.innerHTML` değiştiğinden normalde kopan WebGL sahnesi, **aynı canvas DOM nesnesini** yeni savaş konteynerine yeniden bağlar; böylece savaş turu ve sunucu profilinin yeniden yüklenmesi sırasında GPU tekrar başlatılmaz.
- Arka plana geçişte animasyon durur; geri dönerken devam eder. Ekran/savaş değişiminde ve sekme kapanışında GPU kaynakları temizlenir; bağlanmadığında 2D görünüm çalışır.
- Kampanya içinde **↻ Sunucuyu yenile** eklendi. İlerlemiş resmî savaşın son güvenilir snapshot'ı yenilenirken silinmez.
- Kısa savaş aksiyonları için **sunucu tarafından doğrulanan son tur hasar/alınan hasar** göstergesi ve ayrı vuruş/özel yetenek animasyonu.

## Testler

`official-3d-v228.test.mjs` şu sözleşmeleri doğrular:

1. Her resmî savaş modunun mevcut 3D oda modeline dönüştürülmesi.
2. Her kahramanın/takımın, düşmanın ve HP'nin sunucu durumunu bozmayacak biçimde 3D'ye kopyalanması.
3. Kayıt yenilendiğinde görev kimliğinin korunması ve sadece doğrulanmış tur deltalarının gösterilmesi.
4. 3D/2D tercihinin görselliğe etki etmesi, ödül veya sahte galibiyet verisi üretmemesi.
5. 3D sürücünün **aynı** `battle-render-adapter.js` ve `graphics-3d.js` motorunu kullanması.

Gerçek Chromium QA'da resmî hesap canlandırmasıyla WebGL2 varsa 3D sahnenin etkinleşmesi, DOM yeniden çiziminde canvas kimliğinin korunması, sunucu yenilemesi, 2D/3D geçişi ve mobil sahne görüntüsü sınanır.

## Bilinçli güvenlik ve mimari sınır

**Aynı grafik motoru ve resmî savaş arayüzü birleştirildi; iki savaş matematiği tek algoritmaya dönüşmedi.** Oyuncunun resmî hesabında bir **tek doğrulanmış PvE çözümleme hattı** vardır: Supabase RPC. Hesapsız yerel/öğretici tatbikatların gerçek zamanlı savaş algoritması ayrı tutulur; kaynakları hiçbir zaman resmî hesap kasasına aktarılmaz. Bu ayrım, istemcide oynanan bir denemenin zafer sonucunu gerçek ödül diye yollamaması için korunur.

Bir sonraki motor ölçeğinde yapılabilecek farklı çalışma, fiziksel birim konumları ve sürekli çarpışma/AI simülasyonunu sunucu tarafına taşımak olacaktır. v2.28 bunun yapıldığını iddia etmez. Mevcut sunucu onaylı tur taktikleri üzerinde gerçek 3D görseller vardır. Tarayıcı WebGL2 ve 3D performansı gerçek kullanıcı cihazlarında ayrıca ölçülmelidir.
