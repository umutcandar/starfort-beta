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

## Doğrulanan başarı (17 Kasım 2026)
Gerçek Apple ARM64 Unreal 5.8 Mac Editor C++ derlemesi kullanıcı tarafından doğrulandı: `built: true`, `exit_code: 0`, `Result: Succeeded`. İlgili GitHub commit: `bc232f84d5b484448945dc8d4f73080c010dd6c8`. Bu doğrulama 3D sahnenin görsel kalite onayı veya Editor Python harita oluşturma testinin geçtiği anlamına gelmez.

### Sıradaki güvenli sıra
1. Editor tamamen kapalıyken Mac terminalden `open -a "/Users/macbook/Documents/UE_5.8/Engine/Binaries/Mac/UnrealEditor.app" --args "$PWD/mobile/StarfortUnreal/StarfortUnreal.uproject"` ile uygulamayı açın (öncesinde `cd ~/Downloads/starfort-beta`).
2. `Play` ile kodun kendi oluşturduğu runtime 3D kale/krallığa giriş ekranını kontrol edin, kamera görüntüsünü kaydedin.
3. Kaleyi GLB olarak kullanacaksanız `STARFORT_OriginalCitadel_Combined_v1.glb` dosyasını Mac'in `~/Downloads/` klasörüne indirin; henüz orada olduğu doğrulanmadı.
4. PIE'yi durdurun ve Tools → Execute Python Script ile `mobile/StarfortUnreal/Tools/author_ultra_login_level_v99.py` komut dosyasını çalıştırın. Unreal PythonScriptPlugin gerekebilir. Yeni map ve materyal varlıklarının gerçek sonucu ancak Editor log ve Content Browser ile doğrulanabilir.
5. Otomatik harita scripti başarısız olursa hata mesajını gönderin; Python API sürümüne göre düzeltilebilir. Script önceki map ayarını otomatik yedeklemeye çalışır, fakat yine de Editor'da açık işleri kaydedin.

## GLB metre/santimetre güvenli aktarım (v100)
STARFORT_OriginalCitadel_Combined_v1.glb dosyasının Unreal 5.8'e uygun kaynak sürümünü kullan. Kaynak modelin amaçlanan sahne boyu yaklaşık 34,46 m genişlik, 29,43 m derinlik ve 25,37 m yüksekliktir. Standart glTF metre birimi için mesh koordinatları metre olarak hazırlanmalıdır. Unreal içe aktarırken bunları santimetreye dönüştürür. Sahne aktörünün yeni C++ kodu ImportedCitadelMesh ölçülerini okuyup en uzun ekseni yaklaşık 3446 cm olacak şekilde normalize eder. Eski dosyayı kullanırsan da görüntünün yüz kat büyümesine karşı koruma vardır; ancak kaynak modeldeki doku/mesh kalitesi bundan değişmez. Model henüz Unreal'a alınmadıysa /Game/.../L_StarfortLogin map üretim komut dosyasını Editor'da çalıştırman gerekir.
