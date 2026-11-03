# STARFORT v2.41 — Uzun Vadeli Sınır Ustalığı ve Kaynak Ekonomisi

**3 Kasım 2026 — Tekrarlanabilir, sunucu doğrulamalı ilerleme dengesi**

## Oyuna eklenen değişiklikler

STARFORT v2.40 savaş görselleri ve seslerinden sonra v2.41 ile Gölge Sınırı için **12 kalıcı Sınır Ustalığı rütbesi** ve haftalık kaynak dengelemesi getirir. Rütbe sistemi oyuncunun zaten kazanılmış bina, kahraman, bölüm ve eşya ilerlemesine dokunmaz.

### 12 rütbe ve minimum süre

Ustalık rütbesi sunucuda hesaplanan toplam **itibar** ile artar. Eşikler:

| Rütbe | Toplam itibar | Rütbe | Toplam itibar |
| ---: | ---: | ---: | ---: |
| 1 | 12 | 7 | 300 |
| 2 | 30 | 8 | 410 |
| 3 | 55 | 9 | 550 |
| 4 | 90 | 10 | 710 |
| 5 | 140 | 11 | 900 |
| 6 | 210 | 12 | 1120 |

- Bir patron zaferi: **bölge sırası × 3 + kazanılan yıldız sayısı × 2** itibar.
- İlk kez bitirilen bölge buna **+10 itibar** kazandırır.
- Her oyuncu hesabı UTC/ISO haftasında **en fazla 100 itibar** biriktirebilir. 1120 itibar, matematiksel olarak **en az 12 farklı haftalık kazanç penceresi** gerektirir. Bu sürenin gerçek kullanıcı davranışıyla ne kadar uzayacağı henüz ölçülmedi.
- Günlük giriş serisi veya aralıksız giriş şartı **yoktur**. Haftalık sınır dolduktan sonra da oyuna devam edebilir, savaşları bitirebilir ve mevcut günlük/haftalık görevleri ilerletebilirsin.
- Haftalık yeni pencere başladığında yalnızca hafta sayaçları sıfırlanır; **kalıcı itibar, alınan ödüller ve rütbeler korunur.**
- Bu sürümden önce kazanılan Shadow Frontier galibiyetlerine geriye dönük itibar eklenmez; yeni ustalık yolculuğu v2.41 sonrası gerçek galibiyetlerle başlar.

### Kalıcı rütbe ödülleri

Kazanılan her rütbenin kaynağı **bir kez**, yalnızca oyuncu basıp sunucu `claim_mastery` isteğini doğruladığında verilir:

- Rütbe n: 80 + 60n altın, 40 + 30n kereste, 35 + 30n taş, 8 + 6n yıldız özü.
- Örnek: 1. rütbe **140 altın, 70 kereste, 65 taş, 14 yıldız özü**.
- 12. rütbe **800 altın, 400 kereste, 395 taş, 80 yıldız özü**.
- Tekrarlanmış UUID isteğinde aynı yanıt döner; ödül tekrardan eklenmez.
- 12. rütbe sonrasındaki iddia edilen 13. ödül sunucuda reddedilir.
- Kaynaklar 1.000.000.000 üst sınırını aşamaz. Rütbe parayla satın alınamaz.

### Tekrar oynama ödüllerine kontrollü geçiş

Gölge Sınırı'nın ilk zaferinin **tam kaynak ödülü ve özel eşyası korunur**. Yalnızca zaten tamamlanmış bölümün tekrarında aşağıdaki haftalık sefer sınırı geçerlidir:

| O hafta önceden kazanılmış Gölge Sınırı zaferleri | Tekrar bölüm kaynağının oranı |
| --- | ---: |
| 0–5 | %38 |
| 6–11 | %22 |
| 12+ | %10 |

Amaç tek bir kolay patronu aralıksız oynayıp sınırsız kaynak kazanan hesapların ekonomiyi hızla büyütmesini azaltmaktır. Düşük ödül bir kazanmayı geçersiz saymaz; günlük/haftalık zafer görevi ilerlemesi devam eder. Yeni haftayla tekrar ödül oranları da ilk kademeye döner.

### Oyuncu arayüzü

Gölge Sınırı içinde yeni **Sınır Ustalığı** paneli bulunur:

- Kalıcı rütbe **0–12**, toplam itibar ve bir sonraki eşik.
- Bu haftanın ilerlemesi **0–100**, doğrulanmış kazanma sayısı ve hafta etiketi.
- Tek seferlik rütbe ödülünü alma düğmesi; ilerleme eksik veya ödül alındıysa devre dışı.
- 12 rütbelik açılır-kapanır yol haritası.
- Tekrar sefer kazanımlarında kaynak ödülleri ile birlikte gerçek itibar gösterimi.

Görseller 390 px mobil ekran için uyarlanmıştır. Günlük giriş zorunluluğu ve ödeme gereksinimi yoktur.

## Sunucu güvenliği

- Yalnızca `auth.uid()` ile bağlanan `sfb_shadow_api` ustalık seviyesini artırabilir; istemcinin gönderdiği XP, yıldız, zafer veya fiyat dikkate alınmaz.
- Yeni alanlar `starfort_shadow_frontier` tablosunda RLS/REVOKE koruması altındadır.
- Kilit sırası köy → oyuncu ilerlemesi → Gölge Sınırı. XP, haftalık sayaç ve kaynaklar tek sunucu işleminde güncellenir.
- İstek kimliği defterine kayıt alınır; aynı UUID ile tekrar ödül kazanılmaz.
- Başka bir oyuncunun ustalık kaydını istemciden oluşturma, ilerletme veya ödülleme yetkisi yoktur.

## Test kanıtı

Gerçek Supabase üzerinde geçici kimlikle gerçekleştirilen `BEGIN ... ROLLBACK` sınamaları:

1. Yeni oyuncu sıfır rütbeyle başlar. Erken veya tekrar `claim_mastery` reddedilir.
2. Üç dalgalı ilk Gölge Sınırı zaferi itibar ve yeni rütbe kaydeder; ilk ekipman ve tam kaynak ödülünü korur.
3. 1. rütbe gerçek kasaya tam **140 altın** ekler. Aynı UUID ile tekrar çağrı ikinci altın yazmaz.
4. Haftalık 7. kazançta tekrar ödülü **%22**, 13. kazançta **%10** seviyesinde doğrulandı.
5. 100 itibar doldurulunca yeni kazanım eklenmez; mevcut zafer ve kaynak ödülü devam eder.
6. Haftanın değişimi sayaçları sıfırlar ama kalıcı rütbe ve toplanmış kaynakları silmez.
7. 12. rütbe üzerinde 13. bir ödül alınamaz.

Geçici deneme kullanıcıları/ekipman/kaynaklar geri alındı; gerçek oyuncu verisi değiştirilmedi.

## Bilinen sınırlar / sonraki işler

Bu sistem **aylar süren ilerlemeyi kurallarla mümkün ve zorunlu kılar**, fakat gerçek oyuncular üzerinde üç ay sürdürülmüş bir test anlamına gelmez. Bina dengesi, lonca / arena dengesinin tamamı otomatik olarak çözülmüş sayılmaz. 12. rütbe sonrasında da Gölge Sınırı tekrar oynanabilir ama bu sistemin kalıcı rütbesi sona erer. Yeni büyük sezon ve end-game kademeleri daha sonra eklenebilir.

**Kaynak kod:** `starfort/sql/starfort-v241-shadow-mastery-balance.sql`, `starfort/shadow-mastery-v241.js`, `starfort/shadow-mastery-v241.css`, `starfort/shadow-mastery-v241.test.mjs`.

**Yayın kriteri:** GitHub QA ve Pages başarılı olmalı, Render aynı sürüm commit'ini canlı göstermeli.
