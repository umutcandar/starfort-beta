# STARFORT Mobile v75 — Tek komutla gerçek görsel kurulumu ve donmadan karakter seçimi

## Bu pakette gerçekten yapılan

- **28 gerçek PNG**: Önceden oluşturduğumuz sinematik Rovan/Aldren/Lyra/Vesper illüstrasyonları, portreleri, kartları ve 16 beceri ikonundan oluşan v74 ZIP'in bütünlüğü kontrol edildi. Kaynak görseller **2D**'dir; 3D model/animasyon değillerdir.
- **Yeni Mac/Windows kurulum betiği:** `Tools/install_cinematic_hero_art.py` tüm ZIP'i okumadan Unreal projesine yazmaz; 28 dosyanın kimliğini, resmin PNG chunk CRC değerlerini, bütünlük SHA-256 değerini, gerçek IHDR/IEND içeriklerini ve boyutlarını doğrular. Kaynak ZIP içinde beklenmeyen yol, yinelenmiş dosya, symlink veya başka sanatçının mevcut dosyasını değiştirme girişimi reddedilir.
- **Asenkron Unreal yüklemesi:** `UStarfortHeroScreen` artık her karakter geçişinde 7 yüksek çözünürlüklü `UTexture2D` varlığını `UAssetManager::GetStreamableManager().RequestAsyncLoad` ile yüklemeyi ister. Önceki `TryLoad()` ana iş parçacığı yükleme yöntemi kaldırıldı.
- **Gecikmiş animasyon/görsel güvenliği:** Karakter değiştirilir veya ekran kapanırsa önceki isteğin sonucu yeni kahramanın üzerine gelmez. Yükleme generation ID ile iptal edilir. Tam yüklenmeyen görseller için açık '28 PNG Unreal'a import edilmeli' durum mesajı gösterilir.
- **Oyuncu ilerlemesi:** Supabase ID'leri ve hero level/training işlemleri aynen kalır. Yeni skin/portre hiçbir kahramanı açmaz veya bedava XP/para vermez.
- **Gerçek 3D konusundaki açık sınır:** Unreal'daki 3D karakter modelleri henüz sinematik seviyede hazırlanmış değildir. Bu 2D resimleri 3D mesh diye sunmuyoruz.

## İki komut ve Editor ile kurulum

Önce GitHub'daki en güncel STARFORT `main` dalını MacBook'a indir. Daha önce teslim edilen `STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip` dosyasını **Downloads** klasörüne koy.

```bash
cd /STARFORT_DEPO_KONUMU/mobile/StarfortUnreal
python3 Tools/install_cinematic_hero_art.py
python3 Tools/import_cinematic_hero_ui.py --check
```

İlk komut dosyayı `~/Downloads` içinden otomatik bulur; ikinci komut gerçekten 28 resmin doğru yerde olduğunu onaylar. ZIP başka klasördeyse `--zip /dosyanın/tam/yolu.zip` kullanabilirsin. Sadece doğrulama için ilk komuta `--check-only` ekleyebilirsin.

Ardından Unreal Engine 5.8 Editor içinde `Tools/import_cinematic_hero_ui.py` çalıştırılmalı: `Content Browser > /Game/UI/HeroCinematicV1` içinde 28 **gerçek Texture2D** oluşmalı. Sonrasında Unreal C++ derlemesi, mobil cooker ve gerçek hesapla cihaz testi gerekiyor. Bu işlemler bu ortamda yapılmadı.

## Test ve geri dönüş

- CI `test_cinematic_hero_install.py`: orijinal ZIP'e benzer 28 resim setini yükler; CRC bozukluğu, eksik dosya, dışarı kaçan zip yolu ve farklı mevcut resim varsa işlemi reddeder.
- CI `test_native_mobile.py`: 2D sanatın asenkron yüklendiğini, değişen kahramanın eski callback'inin gösterilmediğini, gecikmiş asset sonuçlarının iptal edildiğini doğrular.
- Test sonrası yol `/Game/UI/HeroCinematicV1` ve motor gerçek `.uasset` dosyaları oluşmadıysa hiçbir 'oyunda görüntüler kesin açıldı' iddiası yoktur.

**Sonraki gerçek görsel üretimi:** Profesyonel onaylı tam gövdeli skinned PBR 3D kahraman modelleri, karaktere özgü AnimBP ve Unreal Niagara sistemleri üretim/dış kaynak gerektirir. Bunlar 2D texture importuyla elde edilmez.
