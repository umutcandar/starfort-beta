# STARFORT Mobile v76 — Sinematik savaş yönetmeni, özgün Niagara ve doğrulanmış darbeler

## Bu pakette yapılan gerçek C++ değişiklikleri

Artık `AStarfortBattleStage`, **yalnızca Supabase sunucusunun doğruladığı sıradaki aksiyonlara** göre her kahramanın ayrı montajını, sesini, silah/koruma Niagara efektini ve kamera açısını yönetir.

| Sunucu aksiyonu | İskelet animasyonu | Efektin doğru bağlantı noktası | Kamera davranışı |
|---|---|---|---|
| `strike` | Kahramana özel `StrikeMontage` | Silah soketinde `StrikeEffect` | Kısa saldırı yakınlaşması |
| `guard` | `GuardMontage` | Kahraman iskeletinde `GuardEffect` | Kalkanı gösteren daha geniş kadraj |
| `feint` | `FeintMontage` | Silah soketinde `FeintEffect` | Çevik açı değişimi |
| `rally` | `RallyMontage` | Kahraman iskeletinde `RallyEffect` | Üç kahramanı aynı karede gösterir |
| `skill:<sunucu_kahraman_id>` | **Yalnız** o kahramanın `SpecialMontage` | O kahramanın silah soketinde `SpecialEffect` | Kahramana özel lens ve kadraj |

- `HeroAuraFX1/2/3` eklenmiştir. Kalkan / destek, düşmanın ya da kahramanın silah ağzında yanlış konumlanmaz; kahraman iskeletine bağlanır.
- `BeginCameraBeat` uzaklık, kamera dönüklüğü, bakış odağı ve FOV değerlerini Unreal `FInterpTo/VInterpTo/RInterpTo` ile yumuşak değiştirir.
- **Rovan** uzun menzilli nişancının sahnesinde 1260 cm kamera kolu; **Aldren** koruma/özel yeteneğinde 1210 cm, **Vesper** hızlı dövüşte 1110 cm; diğerlerinde sahnenin okunabilirliğini koruyan daha geniş kadraj. Bunlar hedef tasarım değerleridir; gerçek cihazdaki görüntü henüz gözlemlenmedi.
- Darbe FX'i artık her saldırı düğmesinde anında patlamaz: doğrulanmış `VerifiedDamageDealt>0` için **0,28 saniyelik kozmetik zamanlama** yapılır. Odaya/hesaba veya yeni tura geçilirse kuyruktaki darbe iptal olur. Sunucu tarafından doğrulanmayan darbe, öldürme, HP düşüşü veya ödül yerelde yaratılmaz.
- `AStarfortBattleStage::ClearBattlePresentation` hem tamamlanmamış hero stream'ini hem de gecikmiş darbe timer'ını iptal eder, 3 rig/weapon/aura efektini gizler; başka hesabın saldırısı sahneye taşınmaz.
- Oyun dışından veya backend'den gelen tanınmayan aksiyon isimleri sinematik hareket tetikleyemez. Eski ortak animasyon fallback'i yoktur.

## 7 kahramanın tamamı için hangi özgün Niagara assetleri hazırlanmalı?

| Kahraman ID | Saldırı | Savunma | Aldatma | Destek | Özel yetenek |
|---|---|---|---|---|---|
| `rovan` | Mavi yıldız mermi izi | Mavi koruyucu enerji | Kısa namlu parıltısı | Altın nişan halkası | Parlak mavi hassas uzun atış |
| `aldren` | Ağır kılıç kıvılcımı | Altın çokgen kalkan küresi | Kalkan yana açı | Çember halinde koruma | Genişleyen yıldız kalesi |
| `lyra` | Turkuaz kozmos kıvılcımı | Yıldız perdesi | Kaygan ışık illüzyonu | Takım çevresi astral halka | Çok katmanlı takımyıldız büyüsü |
| `mira` | Ay gümüşü mühür | İnci beyazı ay kubbesi | Ay gölgesi | İyileştirici hilal halkası | Ay ışığı iyileştirme alanı |
| `doran` | Demir kıvılcımları | Kızıl örs bariyeri | Kül savurma | Savaş çığlığı kıvılcımları | Alevli çift balta |
| `vesper` | Mor hançer izi | Dar gölge bariyeri | Duman geçiş izi | Mor hız halkası | Çift bıçaklı gölge patlaması |
| `eira` | Buz parçacığı | Buz kristali kalkanı | Donmuş yankı | Soğuk yıldız girdabı | Kutup buz çemberi |

Bunlar **sanat üretim gereksinimleri**, mevcut `.uasset` varlıkları değildir. `UStarfortHeroCombatAsset` artık `StrikeEffect`, `GuardEffect`, `FeintEffect`, `RallyEffect`, `SpecialEffect` ve önceki tüm premium koşulları **gerçek `UNiagaraSystem` nesneleri olarak** arar. Lisanssız veya eksik assete rağmen `bArtApprovedForMobile` açılsa bile `HasProductionReadyGeometryAndMotion` false döner.

## Sınırlar ve doğrulama

- **Henüz yeni 3D kahraman rig, UMG Blueprint, Niagara `.uasset`, sahne `.umap` veya tamamlanmış uygulama yoktur.** Bunları otomatik üretmiş gibi göstermiyoruz.
- Motor/cihaz testi burada çalıştırılamadığı için v76 testleri **kaynak sözleşme denetimleridir**. Unreal 5.8 Editor içindeki gerçek derleme, AnimBP/AnimMontage, timeline ve frame time incelemesi gereklidir.
- `python3 mobile/StarfortUnreal/Tools/test_native_mobile.py` içinde `test_sinematik_ue_battle_camera_and_verified_impact` özel efekt ayrımını, kamera hareket hesaplarını, oda/tur doğrulama zincirini ve sıfır hasarda efekt tetiklenmemesini statik olarak kontrol eder.
- Önceki karakter 2D illüstrasyonları seçim ekranında kullanılabilir ama **3D avatarın yerine geçmez**.

## Sonraki gerçek üretim aşaması

1. Artist onaylı gerçekçi `aldren,lyra,rovan,mira,doran,vesper,eira` skinned `.uasset` karakterleri, LOD/materyal/soketleri ve ayrı silah modelini Unreal 5.8'e aktar.
2. Her karakter için yukarıdaki beş ayrı Niagara sistemi, AnimBP ve action montage üret; `DA_Hero_<Name>` gerçek Data Assetlerine bağla.
3. Gerçek Unreal Editor visual preflight ve fiziksel iOS/Android GPU/memory/cinematic quality testleri başarılı olursa onayları etkinleştir.
