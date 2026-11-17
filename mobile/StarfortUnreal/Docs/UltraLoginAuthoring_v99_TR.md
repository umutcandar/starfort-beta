# STARFORT gerçek Unreal harita/3D materyal oluşturucu v99

Bu araç Unreal Editor 5.8'in PythonScriptPlugin ortamı içinde çalıştırılır.
Normal terminal Python'u değil, Unreal içindeki Python interpreter gerekir.

Bağımsız kaynak depomuz, şimdiye dek umap/uasset içermiyordu. Bu script,
MacBook üzerinde gerçek bir /Game/STARFORT/Login/L_StarfortLogin.umap
ve üç özgün temel Unreal materyal varlığı (M_StarfortMoonstone,
M_StarfortBanners, M_StarfortEmbers) oluşturur; tek adet native
AStarfortLoginCinematicStage aktörünü haritaya yerleştirir.

Oluşturma aşaması tekrar çalıştırılırsa mevcut harita/materyalleri silmez.
Bu, Unreal Editor'ın gerçek asset yazma sürecidir; ChatGPT bu ortamdan
kullanıcının Mac'inde koşan Editor'a bağlanıp scripti kendisi çalıştıramaz.

ÖNEMLİ: Bu özgün materyaller, kale modelinin fotogerçekçi olduğunu
göstermez. Sahne hâlâ built-in primitive bazlı 3D greybox'tır. Gerçek
lisanslı kale, skeletal hero, animasyon, Niagara VFX ve müzik ayrı
içerik üretimi gerektirir.

## Kullanım
1. Unreal Editor'ı aç, Play modunda olma.
2. Önce GitHub v99 dalını çek ve Mac UE C++ Editor target build komutunu
   başarıyla çalıştır.
3. Unreal Editor menüsünden Tools → Execute Python Script ile
   mobile/StarfortUnreal/Tools/author_ultra_login_level_v99.py dosyasını
   seç. Script mevcut Editor haritanı değiştireceği için önce kaydet.
4. Scriptin sonunda Unreal açıkken Login haritası ve Stage aktörü World
   Outliner'da görünebilir; PIE açıp 3D sahne ve butonu kontrol et.
5. Generated Content/STARFORT/Login/L_StarfortLogin.umap ve Materials
   altındaki yeni uasset'ler yalnız Mac dosyalarındadır. Proje .gitignore
   genel Content'ı engellemez; bunlar arzu edilirse lisans kontrolünden
   sonra geliştirici dalına ayrıca commit edilmelidir.
6. Script yerel Config/DefaultEngine.ini içindeki GameDefaultMap ve
   EditorStartupMap ayarlarını oluşturduğu haritaya çevirir. Önceki
   ayar Saved/QA/DefaultEngine_before_ultra_login.ini içine yedeklenir.
   Script başarısız olursa varsayılan harita değiştirilmez.

Kaynak testi: Tools/test_ultra_login_authoring_v99.py
Mac Unreal Editor Python çalıştırma testi bu sohbette yapılmadı.

## Özgün 3D kale GLB aktarımı

ChatGPT tarafından üretilen STARFORT_OriginalCitadel_Combined_v1.glb dosyasını Downloads klasörüne veya mobile/StarfortUnreal/ContentPipeline/Incoming klasörüne koy. Bu dosya tek bir static mesh ve 3D vertex renkleri içerir. Sonra Unreal Editor içinde yazar aracı çalıştırıldığında GLB, /Game/STARFORT/Login/Meshes altına alınır; M_StarfortCitadelVertexColors materyali ile aktörün ImportedCitadelMesh ve ImportedCitadelMaterial alanlarına bağlanır. Bu dosya yoksa veya UE importer yoksa 3D greybox devrede kalır; sahte model yaratılmaz. Import sonrası Unreal'da farklı ölçek gerekiyorsa aktör ImportedCitadel bileşeni üzerinden ölçülmelidir. Bu süreç Mac'te hâlâ test bekliyor.
