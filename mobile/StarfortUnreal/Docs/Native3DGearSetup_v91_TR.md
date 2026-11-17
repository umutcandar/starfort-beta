# STARFORT v91 — Native 3D ekipman ve savaş entegrasyonu

Bu dal hazır bir Unreal .umap veya 3D model içermez. Unreal Engine 5.8 ortamında **gerçek, yasal olarak kullanılabilir** SkeletalMesh, AnimBP, AnimMontage ve Niagara sanat varlıkları kurulmadan görsel sonuç oluşmaz.

## Editör kurulumu
1. `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını UE5.8 Editor + C++ toolchain ile açın ve önce gerçek proje derlemesini tamamlayın. Kaynak CI, UBT/UHT'nin yerine geçmez.
2. `UStarfortHeroCombatAsset` türevi bir DataAsset oluşturun. Gerçek kahraman `HeroId` ile eşleşmeli; kendi animasyonları, etkileri, sesleri, 3+ LOD'u ve lisans / mobil sanat incelemesi olmadan production kalite kapısından geçmez.
3. `UStarfortEquipmentArtManifest` DataAsset oluşturun. Her entry için **sadece sunucuda mevcut** `ItemId` ve `weapon` / `armor` slotunu belirtin. `WeaponMesh`, karakterin `AttachmentSocket` (ör. `weapon_r`) bağlantısı ve **silaha özgü** `ImpactSocket` (ör. `muzzle` veya kılıç için uygun bir özel socket) doğru tanımlanmalı. Zırh gerçek `SkeletalMesh` olmalı ve kahramanla aynı Skeleton'u kullanmalı.
4. Sefer sahnesine `AStarfortBattleStage` türevi BP yerleştirip `HeroArtCatalog` ile `GearManifest` alanını doldurun; gerçek düşman rig, VFX, hit / counterattack montajları ve kamera parametreleri editörde atanmalıdır.
5. Gerçek, oturum açmış test hesabıyla görev başlatın. `sfb_starfort_progress` sunucudan inventory/loadouts ve mission döndürmelidir. Sahne sonradan değişen oynanış verilerini yerelde üretmez; kullanıcıya ait olmayan eşya eklemez.
6. Aynı envanterde 2 kopya varsa iki kahramanın aynı item görselini kullanmasına izin verilir; kopya sayısı veya görsel eşleşme uyuşmazsa sahne, farklı item göstermeyi reddeder.
7. İki fiziksel Android/iOS cihazda gerçek oynanış, animasyon penceresi, performans, döndürme/ekipman değişimi ve oturum kapanışından sonra eski varlık temizliği test edilmeden release etmeyin.

**Durum:** Kod ve GitHub kaynak/test QA geliştirildi; gerçek UE Editor derlemesi ve cihaz testi henüz yapılmadı. Kahraman salonu hâlâ 2D; bu dalın 3D ekipman akışı şu an yalnızca gerçek savaş sahnesine bağlıdır. Önceki v89/v90 yerel arşivleri ayrıca saklıdır.
