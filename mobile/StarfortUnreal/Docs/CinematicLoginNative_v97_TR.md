# STARFORT — Giriş ekranı yenileme v97

**Kaynak:** 17.11.2026 tarihli, kullanıcı tarafından paylaşılan Mac Unreal Editor PIE giriş ekranı görüntüsü.

## Neyi değiştirdik?
- Başlangıçta `560×410` formun tam pencereye büyütülmesinden kaynaklanan dev metinler ve varsayılan açık gri giriş kutuları kaldırıldı.
- `1600×900` yatay tasarım yüzeyi, USafeZone, UScaleBox ScaleToFit ve 2 sütun kullanıldı.
- Solda Starfort kimliği: özgün tipografik amblem, koyu gece tonu, altın vurgular, güçlü başlık ve kısa tanıtım.
- Sağda çerçeveli komutan portalı: açık etiketli e-posta/şifre alanları, Slate stilinde daha koyu giriş kutuları, 67 px dokunma yüksekliği, 76 px giriş eylemi, durum/hata mesajları.
- Var olan `UStarfortLoginScreen` pointer alanları, `OnClicked`, gerçek `Online->SignIn` akışı, şifrenin submit sonrası temizlenmesi, giriş hatalarının gösterilmesi değişmedi.
- Yeni `test_cinematic_native_login_v97.py` GitHub kaynak CI'ında. Editor görünümü ve macOS derlemesi **henüz** ayrıca doğrulanmalıdır.

**Görsel sınır:** Kod ile oluşturulmuş native 2D UMG açılışıdır. Gerçek, özgün 3D kaleler/kahramanlar, sinematik arka plan videosu veya Unreal materyalleri henüz bu depoda yoktur. Bu yüzden yeni ekranı yayın kalitesinde 3D sahne diye sunmuyoruz.

## Mac üzerinde doğrulama
```bash
cd ~/Downloads/starfort-beta
git pull --ff-only origin feat/native-v91-verified-combat-gear
python3 mobile/StarfortUnreal/Tools/mac_ue_bridge.py build --ue-root "/Users/macbook/Documents/UE_5.8"
grep -nE 'error:|fatal error:|Error:|Result:' mobile/StarfortUnreal/Saved/QA/starfort_mac_unreal_build.log | head -n 100
```

Sonra Unreal Editor içinde PIE'yi durdurup tekrar Play yapın. Mevcut açık Editor oturumunda yeni C++ derlemesi için Editor'ı yeniden başlatmak gerekebilir; hot reload'a güvenmeyin. Giriş panelinin 16:9 ölçekte taşmadan görünmesini, şifre gizlemeyi, hata metnini ve gerçek oturum açmayı test edin.
