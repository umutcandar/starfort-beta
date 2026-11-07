# STARFORT Mobile — ilk GERÇEK açılış / test paketi (v66)

**Hedef:** Unreal Engine 5.8, iOS ve Android için yatay modda çalışan yerel uygulama. Bu paket HTML, WebView veya 2D konsept görselini oyun diye göstermiyor.

## Bu pakette gerçek kod olarak eklenenler

- **Başlangıç:** `Config/DefaultEngine.ini` artık engine'in `Entry` sahnesinde `AStarfortVillageGameMode` ile başlıyor. Önceki varsayılan boş Royal Gunner önizlemesi değil.
- **UMG QA arayüzü:** `FStarfortNativeWidgetFactory`, stilize altın/lacivert yerel UMG giriş, köy, kahraman, sekiz bölümlük kampanya ve savaş panellerini gerçek butonlarla oluşturuyor. Görsel Unreal Widget Blueprint'ler mevcutsa onları değiştirmiyor; yalnız eksik olduklarında basit işlevsel ilk-test ekranını üretir.
- **Hesap:** `UStarfortLoginScreen` mevcut Supabase e-posta kimliğini kullanır, parolayı UI'den hemen temizler. Misafir seçeneği sunmaz.
- **Köy:** `AStarfortVillageController` artık özel WBP olmadan `UStarfortLoginScreen` ve `UStarfortVillageScreen` oluşturabilir. Sunucudan okunan kaynak seviyeleri gösterilir, `KÖYÜ YENİLE` ve `ÇIKIŞ YAP` tuşları çalışmak üzere bağlanır.
- **Navigasyon:** Kahraman/sefer/ittifak butonları **yalnız gerçek Unreal `.umap`** varsa yerel Level Router ile açılır; yoksa kullanıcıya açık hata gösterir, eski web ekranına düşmez.
- **Gerçek `.umap` üretimi:** `Tools/create_native_maps.py`, Unreal Editor PythonScriptPlugin içinde dört yerel harita oluşturur, her harita için doğru C++ GameMode'u ayarlar ve kaydeder. Var olan sanat içerikli haritaların üzerine yazmaz. Sadece temel ortam aydınlatması koyar, sahte lego kale veya manken eklemez.
- **Android/iOS derleme aracı:** `Tools/native_mobile_build.py`. Smoke profili gerçek kaynağı derlemek için BuildCookRun komutu üretir; Release profili eksik onaylı sanatı, haritaları, UMG asset'lerini ve cihaz testlerini reddeder. `--dry-run` yalnız planı doğrular, .apk veya .ipa oluşturmaz.

## Unreal Editor'da sırasıyla

1. Mac/Windows/Linux üstünde **Unreal Engine 5.8** ve Unreal C++ derleme araçlarını kurun. iOS paketi için Mac + Xcode; Android için SDK/NDK/JDK gerekir.
2. GitHub deposundaki `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını Unreal Editor 5.8 ile açın; C++ sınıflarının gerçek derlemesini çalıştırın.
3. İlk işlevsel testi Editor'da **Play** ile yapın. Varsayılan `/Engine/Maps/Entry` haritasında yerel STARFORT hesap girişi görünmelidir. Sunucudan kaynak okuma, yenileme, çıkış ve hesap değişimi doğrulanabilir. **Bu kalite sürümü değildir.**
4. Yerel haritaları üretmek için Unreal Editor Python Console'da `exec(open('/ABSOLUTE/PATH/TO/mobile/StarfortUnreal/Tools/create_native_maps.py',encoding='utf-8').read())` çalıştırın veya Editör `-ExecutePythonScript` mekanizmasını kullanın. Bu işlem yalnız Unreal Editor içinde geçerlidir; normal Mac Terminal Python'u `unreal` modülünü bulamaz.
5. Dört haritayı Editor'da açın ve arayüzü, kamera/player spawn, yerel geçişleri test edin. Gerçek sinematik 3D modeller ve Widget Blueprint'ler ayrı ithal edilmeli/oluşturulmalıdır.
6. Doğrulanmış real asset kaynaklarını `Content/Maps`, `Content/UI` ve manifest yollarına taşıyıp `Tools/validate_premium_art.py --release` kalite kapısını geçmeden üretim paketi hazırlamayın.

## Derleme komutları

Mac Terminal'den, `mobile/StarfortUnreal` içinde:

```bash
# Motorun kurulu gerçek yolunu gir; aşağıdaki sadece örnek yoldur.
export UE_ROOT='/Users/Shared/Epic Games/UE_5.8'

# Yalnız komut ve önkoşul kontrolü; henüz uygulama üretmez.
python3 Tools/native_mobile_build.py --platform ios --profile smoke --dry-run
python3 Tools/native_mobile_build.py --platform android --profile smoke --dry-run

# UE, Xcode / Android SDK ve ilgili imzalama kurulduktan sonra:
python3 Tools/native_mobile_build.py --platform ios --profile smoke
python3 Tools/native_mobile_build.py --platform android --profile smoke
```

Android için `ANDROID_HOME` (veya `ANDROID_SDK_ROOT`) ve `JAVA_HOME` ortam değişkenleri gerekir. iOS gerçek cihaz kurulumu için ayrıca Apple Developer imzalama/provisioning adımları tamamlanmalıdır.

**Smoke ≠ oynanabilir tam oyun:** Bu paket gerçek kayıttan gelen köy/ilerleme verilerini gösterebilen işlevsel QA kabuğudur. Royal Gunner'ın beğenilen yüksek detaylı 3D konsepti, savaş sahneleri, kaleler, ses, mağaza, ittifak, görsel UMG Blueprint'leri ve App Store/TestFlight hazır sürümü bu pakette bulunmaz. Paketlenmiş dosya ve fiziksel cihaz testi burada yapılmadı.

## Kaliteyi dürüst raporlama

GitHub Actions şu aşamada Python statik testlerini, geçmiş web oyununun senaryolarını ve script sözdizimini kontrol eder. Unreal Editor derleme aracı mevcut otomasyon ortamında kurulu olmadığından **C++ derlemesi ve iOS/Android grafik performansı doğrulanmış değildir**. Bu dökümanın veya QA ekranının varlığı oyunun tamamlandığı anlamına gelmez.
