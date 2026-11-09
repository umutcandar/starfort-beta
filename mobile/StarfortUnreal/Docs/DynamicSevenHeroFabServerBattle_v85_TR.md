# STARFORT v85 — Sunucunun seçtiği 3 kahraman, 7 gerçek Fab kaynağı arasından

v84'teki önemli sınır kaldırıldı: native geliştirme savaşı yalnızca **Rovan + Aldren + Lyra** üçlüsüyle sınırlı değildi diye görünse de görsel bağlayıcı aslında bu dörtlüye sabitlenmişti. v85, **gerçek kullanıcı lisanslı** tüm yedi Epic/Fab kaynak rigini (kuruluysa) tanıyarak STARFORT sunucusunun döndürdüğü **herhangi üç farklı kahraman ID'sine** göre gerçek 3D görselleri seçer. Savaş sonucu, HP, eşya, ödül, cooldown ve komutlar hâlâ **mevcut oturumlu sunucuya** aittir.

## Gerçekten neler değişti?

- `AStarfortFabVerifiedBattleBridge` artık **4 ila 7 ayrı** gerçek `SkeletalMeshActor` kaynağını kabul eder. İlk hızlı yerel test için Wraith/Rovan, Greystone/Aldren, The Fey/Lyra ve Khaimera/Doran dörtlüsü yeterlidir. Mira/Serath, Vesper/Countess ve Eira/Aurora paketlerini de ekleyince gerçek kaynak rolü 7/7 tamamlanır.
- Sunucu üçlüsündeki her ID için doğru `/Game/Paragon.../` yolu, **benzersiz full-body mesh**, gerçek iskelet ve aynı iskeleti kullanan **farklı Idle/Attack animasyonları** kontrol edilir. Eksik modeli başka kahramanın yüzüymüş gibi **göstermeyiz**.
- Üç oyuncu modelinden **ayrı bir dördüncü model**, geçici *rakip görüntüsü* olarak seçilir. Doran gerçekten oyuncu takımında ise Khaimera'yı tekrar kopyalamak yerine, takımda olmayan başka bir kaynak rig geçici rakip olur. Bu **son oyunun gerçek düşman sanatı değildir**.
- Her yeni doğrulanmış savaş odasında doğru üçlü **ön/orta/kanat** dizilişine yerleşir; kullanılmayan kaynak modeller gizlenir. Oda değişince veya çıkışta, aktörler **özgün editör konumlarına** döner; sonraki maçta önceki karakterler sahnede kalmaz.
- Gerçek `UAnimSequence::GetPlayLength()` süresi kullanılır: uzunca bir saldırı klibi 0,65 saniyede kesilip yanlış zamanda düşman saldırısına geçmez.
- `FStarfortFabDevRosterRules::ChooseUnused` C++ kuralı, **7 karakterin 35 farklı üçlü seçiminin tamamı** için derlenip çalıştırılan testte kontrol edilir.
- Sunucu doğrulaması olmayan, eski/sırasız, sahte yerel turlar için hasar, galibiyet veya saldırı üretilmez.
- **Shipping/release kalite kapısı aynen kapalı** kalır: bu gerçek kaynak Fab modelleri geliştirme içindir, STARFORT'un özgün AAA tasarımları tamamlanmış veya onaylanmış değildir.

## MacBook ile deneme (gerçek Unreal 5.8 ve kullanıcı Fab kütüphanesi gerekli)

1. En son `main` kodunu al. `mobile/StarfortUnreal/StarfortUnreal.uproject` projesini kendi **Unreal Engine 5.8 + Xcode C++ toolchain** kurulumunda derle.
2. Resmi <https://www.fab.com/> Epic hesabından ücretsiz Paragon paketlerini kendi lisanslarına göre edinip `Fab > My Library > Add to Project` ile **bu UE projesine yerel olarak ekle**. [Dört başlangıç + yedi tam paket bağlantıları](PrivateParagonSevenHeroPlaytest_v80_TR.md). Kullanıcı lisans onayı olmadan görsel kurulum başlatılmaz.
3. Unreal Editor menüsünde **Tools > Execute Python Script**: `Tools/STARFORT_7_KAHRAMAN_TARA.py`. `Saved/QA/fab_seven_private_selection_v80.json` içinde gerçek 3D SkeletalMesh yollarını gözden geçir. Lisansları gerçekten kabul ettiysen `user_confirmed_fab_license: true` ayarla. İlk dört kaynak zorunlu, diğer üçü isteğe bağlıdır.
4. **Önce `Content/Maps/L_StarfortBattle.umap` dosyanı yedekle.** İlk kez kuruluyorsa `Tools/create_native_maps.py` gerçek battle haritasını oluşturur. Sonra Unreal Editor `Tools > Execute Python Script` içinden `Tools/STARFORT_CANLI_FAB_3D_KUR.py` çalıştır. Önceden kurulmuş geçici rigler varsa üzerine yazmayı reddeder; yedeklemeden silme.
5. Gerçek sunucu hesabınla **Development Play in Editor** başlat. Gerçek bölüm aç, saldırı ve bir kahraman yeteneği kullan. `FStarfortVerifiedBattleTurn` gelince o anki sunucu kahraman üçlüsü sahneye yansıyabilir. Üç kahraman ID'sinden biri indirilen Fab paketlerinde yoksa kalite kontrolü fail-closed olarak boş görsel verir; eksik modelin oyuncu modeliymiş gibi gösterilmesini engeller.
6. Ekranda kaynak kahramanları incele ve sonucu değerlendir. Savaş videosunu veya ekran görüntüsünü Mac'te kendin kaydet; bu sohbetten senin Unreal Editor pencerene veya iPhone'una erişemiyorum.

Bu hali **nihai Android APK veya iPhone IPA değildir**. Kod kaynak testleri; motorla gerçek C++ derlemesi, assetlerin Unreal'a import edilmesi, iOS/Android Development paketi, gerçek performans, animasyon kalitesi ve cihaz testlerinin yerini tutmaz. Ücretsiz Fab paketleri sadece ilk özel görsel incelemedir. Lisansları/oyunda kullanımı Fab/Epic koşulları çerçevesinde kontrol et; modelleri ham olarak GitHub'a yeniden dağıtma.

## Kontroller

```bash
python3 mobile/StarfortUnreal/Tools/test_verified_fab_live_bridge_v84.py
python3 mobile/StarfortUnreal/Tools/test_dynamic_fab_roster_v85.py
python3 mobile/StarfortUnreal/Tools/stage_verified_fab_online_battle_v84.py --contract
```

İkinci test gerçek C++ `FStarfortFabDevRosterRules::ChooseUnused` fonksiyonunu **standalone C++ derleyicisiyle** kontrol eder; bu test bir Unreal Engine derlemesi olarak sunulmaz.
