# STARFORT v2.37 — Altı Maddelik Büyük Oynanış ve İlerleme Paketi
**3 Kasım 2026.** Bu doküman v2.36 üzerine geliştirilen, hesabı zorunlu ve Supabase sunucu kurallarının hâkim olduğu PvE büyük paketinin kapsamını, kabul ölçütlerini ve hâlâ tamamlanmamış alanları tanımlar.

## 1. Savaşın genişletilmesi

Dört mevcut düşman niyeti (**Saldırı, Ağır Darbe, Kalkan, Can Emme**) korunarak iki yeni aktif komut eklendi:

- **◈ Aldat (feint):** Normalde yalnızca %72 temel hasar. Düşman kalkanı sırasında normal saldırının %45 cezasını yemeden %35 karşı hamle bonusu; seçilmiş Keşif doktrini varsa %25 ek etki. Her düşmana karşı en iyi tuş değildir.
- **♡ Toparlan (rally):** Yalnızca %45 temel hasar fakat azami canın %16'sını iyileştirir. Aynı seferde yeniden kullanılmadan önce **en az dört tur** gerekir; sunucu kayıtlı `lastRallyTurn` ile denetlenir.
- **Guard/Savun** ağır darbenin karşı hamlesi olmayı sürdürür. Kahraman yetenekleri kendi sunucu soğuma sürelerini korur. Yeni komutlar bu özelleştirmeyi kaldırmaz.
- Savaş panelinde doğru karşı hamle tavsiyesi ve **şu anki can/tura göre tahmini** 1–3 yıldız hedefi vardır. Gerçek yıldız derecesini yalnızca sunucu hesaplar.

## 2. Kalıcı savaş ganimeti, nadirlik ve sandık

Savaştan kazanılan kalıcı doğrulanmış **hikâye/İkinci perde galibiyetleri** zamanla `win` sayacını artırır. Bununla alınan savaş sandıkları **rastgele değildir**:

| Sandık | Gerekli toplam zafer | Kesin ekipman | Nadirlik |
| --- | ---: | --- | --- |
| 1 | 3 | Muhafız Zırhı (`ward_mail`) | Sıradışı |
| 2 | 8 | Kor Kılıcı (`ember_blade`) | Nadir |
| 3 | 15 | Yıldız Merceği (`star_lens`) | Destansı |
| 4 | 24 | Ay Kalbi (`moonheart`) | Efsanevi |
| 5 ve sonrası | Her 12 ek zafer | Kor Muhafızı, Yıldız Mızrağı, Muhafız Mührü, Yıldızkıran döngüsü | Nadir–Efsanevi |

Kazanılan ekipman **doğrudan gerçek sunucu çantasına** eklenir ve oyundaki mevcut silah/zırh/tılsım sistemleriyle kuşanılabilir. Bir eşyanın adet sınırı 20'ye ulaştığında ilgili sandık **36 yıldız özüne** çevrilir (depo üst sınırı uygulanır). Her sandık yalnızca bir kez alınır; üst sınırın altında hiç şans faktörü yoktur. Sandık ilerlemesi bir sonraki hedefi önceden gösterir. PvP için ücretli eşya yoktur.

## 3. Köy ekonomisi + savaş ikmali

Oyuncu gelişmiş köyden cepheye kaynak aktarır:

| Doktrin | Maliyet | Sunucudaki savaş etkisi |
| --- | --- | --- |
| Hücum Taburu | 70 altın, 50 kereste | %12 fazla verilen hasar; %6 fazla alınan hasar |
| Siper Garnizonu | 30 kereste, 65 taş | %10 başlangıç canı; %22 az alınan hasar |
| Yıldız Keşif Birliği | 90 altın, 12 yıldız özü | Aldat hamlesinde %25 ilave hasar |

İkmal **bir kez hazırlanır**; kaynak maliyeti sunucuda düşülür. Sefer başlamamışsa iptal edip malzemeleri **tam iade** almak mümkündür. Savaş başlarken ikmal kilitli sunucu işleminde otomatik tüketilir; oyuncu savaştayken yeni ikmal hazırlayamaz. Köy Geliştirme Merkezi'ne **Cephe Karargâhı'na git** bağlantısı eklendi.

Mevcut 7 × 20 seviyelik bina, tek inşaat ustası, gerçek inşaat süreleri, ustalık kilitleri ve 2 günlük Kervan Pazarı sınırı korunmuştur. Hesap ilerleme yanıtındaki Kervan Pazarı günlük hak bilgisi de sunucu verisiyle hizalandı.

## 4. Uzun vadeli tekrarlanabilir hedefler

- **Günlük Sınır Nöbeti:** Karargâhın o gün ilk açılmasından sonraki 2 yeni doğrulanmış sefer zaferi; **160 altın, 75 kereste, 65 taş, 14 yıldız özü**, günlük bir defa.
- **Haftalık Kuzey Muhafızları:** Karargâhın haftalık başlangıç kaydından sonraki 8 yeni zafer; **580 altın, 250 kereste, 210 taş, 50 yıldız özü**, haftalık bir defa.
- UTC tarih ve ISO hafta üzerinden sıfırlanır; ödül için aralıksız giriş serisi veya para yatırma gerekmez. İlerlemiş hesaplar tamamlanmış hikâye bölümlerini yeniden oynayarak bu hedefleri de bitirebilir.
- Süre, altın ya da zafer sayısını istemci belirleyemez; kayıt sunucu hesabında, tekrarlanan işlem kimliği ile çifte ödüle karşı korunur.

## 5. Arayüz, rehberlik ve erişilebilirlik

- Cephe Karargâhı; üç ikmal kartı, mevcut doktrin, garanti sandığı önizlemesi ve doluluk çubuğu, günlük/haftalık hedefler ve açık ödül tutarlarını gösterir.
- Yeni savaş komutlarının kısa açıklamaları, düşman niyetine bağlı karar önerisi ve görünür bekleme sınırları vardır.
- 390 px mobil ekran için karargâh kartları tek sütuna düşer; muharebe komutları satır kaydırır.
- Ödeme / kristal / VIP kodları bu pakette açılmaz; premium satışlar **kapalı** ve hiçbir yeni savaş komutu parayla satılmaz.

## 6. Test, doğrulama ve dağıtım

**Supabase sunucusunda yapılan ve `ROLLBACK` ile temizlenen doğrulamalar:**
- Tek kullanımlık kayıt, ikmal maliyeti, iptal ve tam iade, aynı UUID ile tekrar işlemede hiçbir yeni kesinti olmaması.
- Sefer başlangıcında ikmalin tam bir kez kullanılması; feint/kalkan, rally/soğuma ve aktif savaş ikmal kilidi.
- Sadece doğrulanmış galibiyetlerle sandık, 2 sandık ganimeti, günlük/haftalık tamamlanma, üst hedef kilidi.
- Yeni açılmış geçici hesapta **üç dalgalı ilk hikâye bölümü**, orijinal gerçek savaş fonksiyonunda **8 turda 3 yıldız**.
- Test kullanıcısı, tüm işlemleriyle birlikte geri alınır; gerçek oyunculara ikmal, zafer, ekipman veya ücretsiz para yüklenmez.

**GitHub QA:** Node testleri, dinamik Chromium giriş/kayıt/kullanıcı-gate, premium mağaza kilidi, 390px karargâh, hazırlık/iade ve günlük görev. Yeni `warfront-v237.test.mjs` regresyon kapsamına dahildir. Hata halinde Render dağıtımı durdurulmalıdır.

## Güvenlik tasarımı

`starfort_warfront` ve `starfort_warfront_requests` tabloları RLS korumalı ve doğrudan `anon`/`authenticated` yazma yetkisizdir. `sfb_warfront_api` yalnızca gerçek hesabı kabul eder, `auth.uid()` ile kullanıcıyı bağlar, kilit sırası **köy → ilerleme → karargâh** olup çift harcamayı önler. Her ödül için farklı `UUID` kullanılır, önceki sonuç kalıcı ledger'dan geri döner. Kaynak üst sınırı ve envanter maksimum adet uygulanır.

## Bilerek eksik bırakılan alanlar

Bu sürüm **bütün oyunun tamamlandığı** anlamına gelmez. 16 hikâye/İkinci Perde bölümünün her birine tamamen yeni haritalar, düşman animasyonları veya yan görev dalları bu pakette eklenmedi. Gerçek e-posta SMTP/domain ve gerçek ödeme altyapısı hâlâ kapalıdır. Çok aylık gerçek oyuncu tutunma, canlı lonca eşleştirme ve büyük trafik testi ayrı çalışma gerektirir.

**Sıradaki öncelik:** Bölüm başına farklı mini-patron mekanikleri, yan sefer/harita dalları, kalıcı eşya uzmanlıkları ve üretim ortamında gerçek insanlarla uzun süreli denge testleri.
