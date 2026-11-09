# STARFORT v83 — Yatay telefonda özel gerçek 3D karakter testi

## Bu sürümde gerçekten değişenler

v82'nin Unreal/Fab 7 kahraman galerisinde ve 3 dost + 1 rakip önizlemesinde **gerçek telefon dokunmatik girişi** eklendi. C++ `BindTouch(IE_Pressed)` ile iOS/Android dokunuşları ve fare aynı `FStarfortFabPreviewLayout::HitTest` dikdörtgenlerini kullanır. Ekranda **7 kahraman seçimi, 3 müttefik animasyonu, rakip animasyonu, geniş kamera, tekli saldırı, dönüş, zoom ve sahne değiştirme** butonları bulunur. Yakın zamanlı taklit mouse + touch olaylarında çift komut engellenir, portre yönünde telefonu yatay çevir uyarısı çıkar. Oyun proje ayarları hâlâ landscape zorunludur.

Önceki HUD'daki üst 146 piksel + alt 240 piksel kapatan dev şeritler küçültüldü. Butonlar 44–56 ekran pikseli yüksekliğinde. **Gerçek UE5.8 Editor veya cihazda görsel kabul henüz yapılmadı**, bu yüzden farklı DPI/dokunma hedefi ve animasyon FPS ölçümleri yine şart.

### Önemli: Artık özel mobil Development paketleme profili de var

`Tools/native_mobile_build.py --profile private-preview` yalnızca kullanıcı lisansıyla yerel Unreal projesine aktarılmış iki **özel** haritayı cook eder:

- `/Game/Maps/L_StarfortPrivateFabBattle_v80` — ilk açılacak 3'e 1 gerçek Fab kaynak animasyon sahnesi
- `/Game/Maps/L_StarfortPrivateFabPlaytest_v80` — gerçek yedi kahraman galerisi

`UECommandLine.txt`, Unreal 5.8'in mobil başlangıç haritasını komut satırıyla seçme mekanizmasına göre build süresince **geçici oluşturulur** ve BuildCookRun başarılı/başarısız normal bitse de kaldırılır. Var olan kişisel `UECommandLine.txt` dosyasının üzerine asla yazılmaz. Build sırasında sistem aniden kapanırsa dosya kalabilir; bu durumda dosyayı kontrol edip temizleyene kadar **normal smoke/release paketleme de bloklanır**. `DefaultEngine.ini`, normal giriş haritası, Supabase veya canlı oyun değiştirilmez.

`private-preview` **Development build** kullanır, `Shipping` veya `-distribution` kullanmaz, çıktıyı `Saved/MobilePackages/<platform>/private-fab-preview` altına ayırır. **Mağaza sürümü değildir, online savaş değildir, etkin kullanıcı dışında test dağıtımı varsayılmaz.** Normal `smoke` ve `release` cooked map dizileri özel haritaları hiçbir zaman içermez.

## MacBook üzerinde gerçek telefon testi

1. Kaynak kodun en son `main` sürümünü al. Unreal Engine 5.8 ve Mac için C++ toolchain/Xcode gerekir. `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını açıp C++ derle. Bu adımı ChatGPT GitHub Actions kaynak testi gerçekleştiremez.
2. 7 ücretsiz Epic/Fab Paragon paketini Epic hesabından **lisanslarını gerçekten kabul ettikten sonra** `Fab > My Library > Add to Project` ile proje içine indir. Gerekiyorsa en az 4 farklı kaynak rig ile başlayabilirsin. Resmi Fab bağlantıları: `Docs/PrivateParagonSevenHeroPlaytest_v80_TR.md`.
3. Editor `Tools > Execute Python Script`: `Tools/STARFORT_7_KAHRAMAN_TARA.py`; `Saved/QA/fab_seven_private_selection_v80.json` dosyasında doğru `SkeletalMesh` seçimlerini kontrol et. Lisansları kabul ettiysen `user_confirmed_fab_license=true` yaz.
4. `Tools/STARFORT_7_KAHRAMAN_KUR.py` ile mevcut haritayı ezmeden iki gerçek `.umap` oluştur. Önceden oluşturulduysa ikisini de var olan özgün hâliyle korur; yeniden yaratmak için önce elle yedeklemen gerekir.
5. `L_StarfortPrivateFabBattle_v80` sahnesini Editor'da aç. `Tools/STARFORT_3V1_SAVAS_KONTROL.py` ile **3 ayrı gerçek müttefik / 1 rakip, en az bir uyumlu saldırı klibi, tek kamera ve özel GameMode** kontrolünü gerçekleştir. `Saved/QA/Private3v1RealFabBattleAudit_v82.json` başarılı raporu olmadan yerel mobil test paketine izin verilmez.
6. Projenin içinden aşağıdaki terminal komutlarıyla ön kontrolü yap. `UE_ROOT`, kendi kurulu **gerçek** Unreal 5.8 dizinin olmalı. Unreal/Mac kurulumuna göre yol farklıdır.

```bash
cd mobile/StarfortUnreal
export UE_ROOT="/Users/Shared/Epic Games/UE_5.8"
python3 Tools/native_mobile_build.py --platform ios --profile private-preview --dry-run
```

7. Komutun `missing: []` olduğunu **gerçek varlıklar bilgisayarında bulunduğu zaman** doğrularsan, Xcode ile iOS Development signing/provisioning sağlandıktan sonra:

```bash
python3 Tools/native_mobile_build.py --platform ios --profile private-preview
```

8. Android için Android SDK/NDK, Java ve Unreal'ın kurulum gereksinimleri sağlandıktan sonra:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME=$(/usr/libexec/java_home)
python3 Tools/native_mobile_build.py --platform android --profile private-preview --dry-run
python3 Tools/native_mobile_build.py --platform android --profile private-preview
```

Bu script sadece **BuildCookRun** çağırır, telefonuna kendiliğinden yükleme/deploy yapmaz ve başarılı APK/IPA oluşturduğunu **çalıştırmadan önce söylemez**. Oluşan paketi Unreal Editor/Android Studio/Xcode üzerinden kendi cihazına yükleyip gerçek dokunma ve GPU/FPS denemesini yapmak gerekir. Platform SDK veya Epic/Fab indirmesi ChatGPT tarafından uzaktan yapılmadı.

## Ekran kontrolleri

| Alan | Dokunma/tıklama işlevi |
|---|---|
| Üstteki 7 ad | Yerel gerçek 3D kaynak kahramanı seç |
| Q — 3 KAHRAMAN | 3 gerçek ally rig üzerinde varsa ayrı ayrı gerçek klip oynat |
| E — RAKİP | Rakibin varsa gerçek saldırı animasyonu |
| B — KAMERA | Tüm dörtlü ve tek kahraman yakın çekimi |
| SPACE — SALDIR | Seçili kahramanın yalnızca mevcut gerçek klibini oynat |
| A / D | Kamera sağa/sola |
| W / S | Kamera yakın/uzak |
| TAB — SAHNE | Özel galeri ve 3'e 1 sahne arasında geç |

**Bu ekran canlı STARFORT görev ve savaş mekaniğinin yerine geçmez**; gerçek hasar/galibiyet/yıldız/ödül üretmez. Mobil release için `Tools/validate_premium_art.py --release`, özgün STARFORT 3D kahramanlar, optimizasyon, 7 ayrı varlık, Unreal derlemesi ve cihaz testleri ayrı, zorunlu kalite kontrolleri olarak kalır.

## Kaynak ve paket profili testleri

```bash
python3 Tools/test_private_mobile_touch_v83.py
python3 Tools/test_private_3v1_battle_v82.py
python3 Tools/native_mobile_build.py --platform ios --profile private-preview --dry-run
```

İlk iki test kaynak ve yerleşim algoritmasını, üçüncüsü **gerçek** yerel kurulum ön gereksinimlerini denetler. **Bu ortamda Unreal / fiziksel iPhone olmadığı için gerçek IPA/APK veya ekran görüntüsü hazır değil.**
