# STARFORT — Ultra Login 3D v98

## Kodlandı
AStarfortLoginCinematicStage, mevcut Engine Entry dünyasının içinde gerçek Unreal 3D kale, sur, kule, kamera, sis, ay ışığı ve iki meşale ışığı oluşturur. Kamera düşük hızda hareket eder. Bu kod gerçek 3D renderdır, UI içine resim yapıştırma değildir.

VillageController, giriş ekranı açıkken bu kamerayı açar, başarılı oturumda köy kamerasına geçer ve arka plan aktörünü temizler. Oturum kapanınca girişe döner.

LoginScreen artık tek bir KRALLIĞA GİR düğmesiyle başlar. Şifre ve e-posta paneli yalnızca tıklanınca açılır; geri düğmesi şifreyi temizler. Supabase account-only giriş işleyişi değişmez.

3D aktör, istenirse Unreal Editor içerisinde Blueprint ile özelleştirilebilir. ApprovedFeaturedHero yalnızca HasProductionReadyGeometryAndMotion kontrolü geçen, gerçek, onaylı SkeletalMesh + AnimBP içeren karakteri gösterir. OpeningAmbience alanına lisansı temiz USoundBase bağlanırsa ambiyans çalar. Aksi takdirde uydurma karakter veya ses yaratılmaz.

## Sanat varlıkları hâlâ gerekiyor
GitHub projesinde henüz UE umap ve uasset dosyaları yok. Stage içindeki built-in Cube/Cylinder mimarisi gerçek 3D GREYBOX, bitmiş premium kale sanatı değildir. Orijinal kale, ağaç, bayrak, taş materyali, skeletal hero, animasyon, VFX, müzik ve mobil LOD varlıkları ayrı üretim ve UE Editor import gerektirir.

Hedef yollar:
- /Game/STARFORT/Login/L_StarfortLogin — Unreal Editor'da gerçek map
- /Game/STARFORT/Login/BP_StarfortLoginCinematicStage — AStarfortLoginCinematicStage alt sınıfı
- /Game/STARFORT/Characters/DA_ApprovedFeaturedHero — HeroCombatAsset
- /Game/STARFORT/Audio/SC_LoginAmbience — özgün/lisanslı ses

Mevcut DefaultEngine.ini, olmayan umap'i yüklememek için Engine Entry kullanır. Bu hâliyle PIE içinde yeni kale aktörü runtime spawn edilir.

## Mac M1 ilk test
1. Unreal Editor'ı tamamen kapat.
2. Terminal:

    cd ~/Downloads/starfort-beta
    git pull --ff-only origin feat/native-v91-verified-combat-gear
    python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py build --ue-root "/Users/macbook/Documents/UE_5.8"

3. Derleme succeeded olursa Unreal Editor açıp Play'e bas.
4. Gerçek 3D kale, sis ve KRALLIĞA GİR beklenir. Butona tıklayınca kimlik formu açılmalı. Gerçek hesapla giriş sonrasında köy kamerasına dönmeli.
5. C++ hata varsa Saved/QA/starfort_mac_unreal_build.log dosyasının error/Result satırlarına bak.

Kaynak CI başarılı olsa bile Mac UE5.8 gerçek derleme ve yeni PIE görseli bu commit için henüz doğrulanmadı.
