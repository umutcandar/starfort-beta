# STARFORT — Mac M1 Unreal bağlantısı

Bu değişiklikler **geliştirme dalındadır**. Unreal 5.8 Editor bilgisayarın üzerinde gerçek olarak yüklü olmadıkça bu sohbet içinden çalıştırılamaz.

## 1. Hemen kullanılabilir yerel teşhis

Mac Terminal'de, `starfort-beta` deponun klasöründe:

```bash
git fetch origin
git switch feat/native-v91-verified-combat-gear
python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py diagnose
```

Komut yüklü UE 5.8'i standart Mac dizinlerinde arar, C++/Xcode durumunu kontrol eder. Sadece JSON teşhis raporu üretir. `Saved/QA/starfort_mac_unreal_bridge.json` içine yazar.

Motor başka yerdeyse:

```bash
UE_ROOT="/Unreal/kurulum/yolun/UE_5.8" python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py diagnose
```

Gerçek Editör C++ derlemesi **isteğe bağlı**:

```bash
python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py build
```

Yalnız `StarfortUnrealEditor Mac Development` hedefini derler. Paket, APK/IPA veya yayın oluşturmaz. Derleme logu yalnız Mac'te `Saved/QA/starfort_mac_unreal_build.log` konumunda tutulur.

## Güvenlik ön şartı: depo şu anda PUBLIC

GitHub'da repository visibility `public` olarak doğrulandı. Kişisel MacBook'a bağlanan bir self-hosted runner için bu önerilmez. Bu nedenle hazırlanan iş akışı `github.event.repository.private == true` olmadan **çalışmayacak** şekilde kilitlendi.

Runner kurmadan önce depoyu GitHub `Settings → General → Danger Zone → Change repository visibility` üzerinden `Private` yapın veya ayrı bir private repo + yalnız güvenilen iş akışları kullanın. Görünürlük değişikliği mevcut erişim/yayın düzenini etkileyebilir; bu işlem kullanıcı onayı olmadan yapılmadı.

## 2. GitHub'dan Mac'e güvenli bağlantı kurmak

1. GitHub'da `umutcandar/starfort-beta` deposunu aç.
2. `Settings → Actions → Runners → New self-hosted runner` ekranına gir.
3. `macOS` ve `ARM64` platformunu seç.
4. Ekrandaki **resmî GitHub komutlarını** Mac Terminal'de çalıştır. `config.sh` aşamasına `--labels starfort-unreal` etiketini ekle (veya GitHub arayüzünden runner'a aynı etiketi ata).
5. Runner'ın GitHub ekranında `Idle` / çevrimiçi olduğunu doğrula.

**Önemli güvenlik:** Tokenları, şifreleri veya Supabase servis anahtarlarını sohbete gönderme. Runner yalnız güvendiğin kodları çalıştırsın; `pull_request` işi çalıştırma. Mümkünse ayrı standart (yönetici olmayan) macOS kullanıcısı kullan.

`starfort-mac-unreal-bridge.yml` iş akışı yalnız manuel tetikleme için hazırlanmıştır. GitHub `workflow_dispatch` işlerini çalıştırabilmek için iş akışının varsayılan dalda da bulunmasını şart koşar. Bu dosya şu anda yalnız geliştirme dalında: **şimdilik GitHub arayüzünden doğrudan çalıştırılamaz**. Varsayılan dalda yalnız gerekli, incelenmiş iş akışını yayımlamak ayrı onay gerektirir. Yerel teşhis komutu hemen çalışır.

### Şu anki durum
- GitHub bağlantısı var; Mac / Unreal bağlantısı henüz etkin değil.
- UE5.8 proje kodu ve Mac Build.sh teşhisi hazırlanmış.
- Yalnız statik/bağımsız kaynak testleri çalıştı; gerçek Mac C++ derlemesi henüz çalıştırılmadı.
- Hiçbir otomatik dağıtım, APK/IPA veya üretim yayını yapılmadı.

## GERÇEK DERLEME BAŞARILI — 17 Kasım 2026

Kullanıcının MacBook M1 / Xcode 26.0 / UE5.8 üzerinde aldığı son gerçek çıktı: `built: true`, `exit_code: 0`, UBT `Result: Succeeded`. Bu GitHub CI simülasyonu değil, yerel gerçek Unreal C++ Editor target derlemesidir.

### İlk Editor açılış testi

Terminal'de:

```bash
cd ~/Downloads/starfort-beta
open -a "/Users/macbook/Documents/UE_5.8/Engine/Binaries/Mac/UnrealEditor.app" --args "$PWD/mobile/StarfortUnreal/StarfortUnreal.uproject" -log
```

Editor açıldığında `Content Browser` içerisinde varlık bulunmaması şaşırtıcı değil: projenin Git deposunda henüz gerçek `.uasset` veya `.umap` varlıklar yok. `DefaultEngine.ini` her iki harita için `/Engine/Maps/Entry` kullanıyor. `Play` (PIE) sonrası giriş widget'ı, C++ `StarfortVillageGameMode` ve `StarfortVillageController` tarafından açılmalıdır. Mevcut kod, misafir akışına geçmiyor. Giriş olursa server-backed village UI'ı kontrol edin. Gerçek kahraman/harita modelleri henüz entegre edilmedi.

Eğer Editor veya PIE hata verirse ekran görüntüsü ve en son Editor logunun son 100 satırı gerekebilir:

```bash
find "$HOME/Downloads/starfort-beta/mobile/StarfortUnreal/Saved/Logs" -maxdepth 1 -name '*.log' -print
```

Unreal C++ Editor hedefinin başarılı derlenmesi, bir mobil APK/IPA, gerçek cihaz oynanışı veya orijinal 3D görsel tamamlanması değildir.
