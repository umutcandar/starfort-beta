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
