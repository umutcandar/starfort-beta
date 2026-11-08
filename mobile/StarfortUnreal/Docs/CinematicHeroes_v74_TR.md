# STARFORT Mobile v74 — Dört sinematik kahramanı gerçek UMG ekrana bağlama

**Önemli sınır:** Bu güncelleme, Rovan / Aldren / Lyra / Vesper'in **gerçekten oluşturulmuş PNG görsellerini** kahraman seçimi, tam-boy sunum, portre, kart ve 16 beceri ikonu için Unreal UMG sistemine bağlar. 2D illüstrasyonlardan `.glb`, `.fbx`, UE SkeletalMesh, AnimBP, çalışan Niagara efekti veya iOS/Android uygulaması üretildiği iddia edilmez.

## Oyunda değişen yerel kaynak kodu

- `UStarfortHeroScreen`: yalnız Rovan gösteren önceki QA paneli yerine **dört seçilebilir kahraman**; tam-boy `ImgHeroSplash`, `ImgHeroPortrait`, dört `ImgSkill*` ve kart ayrıntı görüntüsü. `İncele` gerçek 2D kart ile tam-boy görsel arasında geçiş yapar. Widget Blueprint olmadan da C++ UMG temel görünümü açılabilir.
- `AStarfortMobilePlayerController`: seçim için `OnHeroSelected` olayını dinler, yalnız doğrulanmış `FStarfortProgressSummary::HeroLevels` verisini gösterir. `TrainHero(SelectedHeroId)` eğitimini gerçekten seçili karaktere gönderir; para, XP, güç veya seviye üretmez. Çıkışta eski hesap önbelleği sıfırlanır.
- **Eski düşük kaliteli model kaldırılmadı ama gösterilmesi kapatıldı**: Onaylanmamış Rovan showroom mankeni kahraman seçimi sırasında gizlenir. Görsel paneldeki **3D Yakında** düğmesi bilinçli şekilde devre dışıdır; gerçekçi Unreal rig/animasyon dosyası eksikken gerçek savaşçı varmış gibi davranmaz.
- `Config/DefaultGame.ini`: soft object path'ler runtime'da oluşturulduğu için, import edilmiş `/Game/UI/HeroCinematicV1` klasörünü mobil cook işlemine dahil eder.
- `Tools/import_cinematic_hero_ui.py`: 28 kaynak PNG'yi byte uzunluğu, SHA-256, gerçek PNG imzası ve boyutlarıyla kontrol eder; yalnız Unreal Editor içinde `/Game/UI/HeroCinematicV1` klasörüne `UTexture2D` olarak aktarır. Eski varlıkların üzerine yazmaz.
- Yeni dört kahramanın kimlikleri (`rovan, aldren, lyra, vesper`) önceki Supabase hesap kayıtlarıyla aynıdır. Diğer üç kayıt (`mira, doran, eira`) silinmez veya sıfırlanmaz; bu pakette yeni sinematik görselleri henüz yoktur.

## Gerçek görselleri MacBook'ta Unreal'a ekleme

GitHub kaynak kodu **PNG byte'larını içermez**: `.png`'ler ayrı hazırlanan `STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip` dosyasında, 28 görsel ve SHA manifestiyle teslim edilir. Bu sayede mevcut GitHub geliştirici kodu ve fotoğraf dosyaları ayrılır; sanat kaybı veya lisanssız varlık değişimi yaşanmaz.

1. GitHub `main` dalındaki en güncel STARFORT projesini `git pull` ile bilgisayarına al.
2. `STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip` arşivini `mobile/StarfortUnreal/` klasörünün **içine** aç; sonunda `ContentPipeline/Incoming/HeroCinematicV1/T_Rovan_Splash.png` ve `ContentPipeline/Incoming/manifest.json` bulunmalı.
3. Normal terminalde `cd mobile/StarfortUnreal` ve `python3 Tools/import_cinematic_hero_ui.py --check` komutunu çalıştır. `valid: true`, `verified_sources: 28` görmelisin. Bu yalnız PNG doğrulamasıdır, Unreal import'u değildir.
4. `StarfortUnreal.uproject` dosyasını **Unreal Engine 5.8 Editor** ile açıp C++ sınıflarını derle. `Tools > Execute Python Script` üzerinden `Tools/import_cinematic_hero_ui.py` çalıştır.
5. Content Browser'da `/Game/UI/HeroCinematicV1/` içinde 28 adet `T_Rovan_Splash`, `T_Aldren_Portrait`, `T_Lyra_Card`, `T_Vesper_Skill_04` vb. `UTexture2D` dosyaları görünmelidir.
6. Auth ile giriş yapıp Köy > Kahramanlar'a git. Rovan, Aldren, Lyra veya Vesper'i seç; sinematik 2D portre ve yetenek ikonlarını kontrol et. Seviye/eğitim için gerçek sunucu hesabı gerekir. `3D Yakında` düğmesinin kapalı olması normal.
7. Üretim için hâlâ profesyonel **iskeletli/animasyonlu 3D karakterler, .umap çevre, UMG BP, GPU optimizasyonu, Unreal C++ build ve fiziksel iPhone/Android testleri** gerekiyor.

## Test listesi

- Dört buton, ilgili `OnHeroSelected` sunucu ID'si ve doğru full-body/card/splash/16 skill ikon yolu
- Yeni hesapta sunucudan doğrulanmayan level/güç **görünmemesi**
- Rovan dışında herhangi bir kahramana basıldığında **Rovan tüfeğinin yanlış karakter adıyla ateşlememesi**
- Yalnız seçilen kahramanın kendi ilerlemesinde eğitim isteği
- Sunucu bağlantısı kesilince sahte değer göstermemesi
- Login/logout ve hesap değişimi sonrası eski seviye önbelleğinin silinmesi
- Eski ucuz 3D mankenin yeni 2D görselin arkasında görünmemesi
- Onaylı 3D rig olmadan release kalite kapısının geçmemesi

**GitHub CI statik Python kaynak denetimidir; Unreal Editor'da çalıştırılmış test veya APK/IPA kurulumu değildir.** Buna rağmen PNG dosyaları ile kaynak kodundaki tam `Texture2D` yolları artık birebir eşleştirilmiştir.
