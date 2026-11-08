# STARFORT Mobile v69 — 3D karakter yükleme, Unreal gerçek testleri ve içerik kabul kapısı

**Platform:** Unreal Engine 5.8 — native iOS/Android, yatay. WebView, HTML ve sahte procedural kahraman kullanılmaz.

## Bu pakette uygulanan kod

- **Asenkron 3D yükleme.** Artık `AStarfortBattleStage` savaş başlarken veya oyuncu takımını değiştirirken `UAssetManager::GetStreamableManager().RequestAsyncLoad` üzerinden yalnız doğrulanmış üç kahramanın `UStarfortHeroCombatAsset` dosyalarını ister. Önceki `LoadSynchronous()` oyun iş parçacığında yaşatacağı takılmaya karşı kaldırıldı.
- **Hesap ve savaş güvenliği.** `TeamLoadGeneration` değeriyle eski yükleme callback'leri iptal edilir. Oyuncu çıkış yaparsa, yeni savaşa girerse veya varlık geçersizse önceki takım rigleri temizlenir. Asenkron yükleme süresince sunucudan daha yeni tur gelirse son tur saklanır; tamamlanmış eski hamle görselde yeniden oynatılmaz.
- **Sahne çoğaltma düzeltmesi.** Editor'da önceden yerleştirilmiş C++ savaş aktörü varken tasarımcı Blueprint sınıfı seçerse ikinci bir sahne oluşturulmaz; bulunan aktör tekrar kullanılır ve yanlış sınıfsa uyarı verilir.
- **Gerçek Unreal Automation Framework testleri.** `Source/StarfortUnreal/Private/Tests/StarfortNativeAutomationTests.cpp` üç motor-içi test ekler: 3 ayrı rig/kamera, şifresiz hesap varsayılanı ve eksik karakter kalite reddi.
- **Motor-içi QA çalıştırıcısı.** `Tools/run_editor_qa.py` UE 5.8'in kendi UnrealEditor komutuyla testleri çalıştırır ve gerçek Unreal JSON raporunda üç testin de `Success` olmasını şart koşar. `--dry-run` sürümün derlendiği iddiasında bulunmaz.
- **Gerçek asset kabul denetçisi.** `Tools/editor_visual_preflight.py` Unreal Editor içinde gerçek `.umap` haritaları, Widget Blueprint'ler ve yedi kahramanın `UStarfortHeroCombatAsset` dosyalarını kontrol eder. Ayrıca 18 kalemlik PBR/animasyon/lisans manifestini ve fiziksel telefon raporlarını doğrular. İçerik eksikse bu test **başarısız olmalıdır**.

## MacBook üzerinde test sırası

1. STARFORT GitHub `main` dalının son durumunu indir ve Mac üzerinde Unreal Engine 5.8 + Xcode'u kur.
2. `mobile/StarfortUnreal/StarfortUnreal.uproject` aç, C++ derlemesini Unreal Editor'da tamamla. Hatalar varsa ilk önce onları çöz.
3. Komut önizlemesi: `python3 Tools/run_editor_qa.py --dry-run`. Bu adım motoru çalıştırmaz.
4. Kurulu UE motorunun kökünü `UE_ROOT` ortam değişkenine ayarla. `python3 Tools/run_editor_qa.py` gerçek Unreal motor-içi testleri koşturur; sonuçlar `Saved/STARFORT_Automation` altına yazılır.
5. Editor'ün `Tools > Test Automation` bölümünde `STARFORT.Native` testlerini de görebilirsin. Gerçek cihaz veya prodüksiyon görsel kalitesinin kanıtı değildir.
6. Gerçek 3D karakter/UMG/arena varlıkları import edildikten sonra Unreal Python Script Plugin içinde `Tools/editor_visual_preflight.py` çalıştır. Lisanslı varlık/LOD/animasyon ve iOS/Android FPS onayı gelmediyse başarısız olması beklenir.
7. Gerçek bir iPhone/Android alpha paketi için `Tools/native_mobile_build.py --profile smoke` ve sonrasında fiziksel cihaza kurulum gerekir. `--dry-run` hiçbir APK/IPA oluşturmaz.

## Açık sınırlar

Bu turdaki değişiklikler C++ kaynak kodu, Unreal Editor'da çalışabilecek testler, asenkron kaynak yönetimi ve asset QA aracıdır. **Unreal Editor, Xcode/Android SDK, gerçek rigged 3D modelleri, `.uasset` UMG sahneleri ve fiziksel telefon testleri bu ortamda çalıştırılamadı.** Bu yüzden uygulanmış kod ile derlenip telefonda oynanmış oyun birbirine karıştırılmamalıdır.
