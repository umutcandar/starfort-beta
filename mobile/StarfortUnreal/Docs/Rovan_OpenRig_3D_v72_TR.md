# STARFORT v72 — İlk GERÇEK iskeletli Rovan 3D model çıktısı

Bu belge, önceki kredi engeli olmadan farklı bir 3D yönteminin gerçek dosya oluşturduğunu kanıtlamak içindir.

## Üretilen çıktı (2026-11-08)
- İş akışı: [GitHub Actions Rovan 3D üretim çalışması](https://github.com/umutcandar/starfort-beta/actions/runs/42457436454)
- Çıktı: `STARFORT_Rovan_OpenRig_Base_v1.glb`, 33.471.420 byte
- Rapor: `rovan_3d_audit.json`, otomatik JSON/BIN incelemesiyle doğrulandı.
- **1 skin, 69 kemik, 187 animation clip, 1 GLB mesh, 20 gömülü görüntü varlığı.**
- İş kaynağı: açık kaynak [Ara 3D Gen](https://github.com/olatunde85/3d-gen), pinned `de8a4a0c36229fb7235a04d001ff928318ac43ea`, CC0 MakeHuman vücut verisi, CMU mocap hareket kayıtları.
- Workflow GitHub Actions artifact: `STARFORT_Rovan_Real3D_AnimatedBase_NotFinal` (14 gün saklanır).

## Görsel kalite ve oyun içi aktarım gerçekleri
Bu model, yüksek detaylı **hareket ettirilebilir insan temeli**dir; *STARFORT için bitmiş Kraliyet Nişancısı değildir*. Sarı/altın metal plaka zırhı, kırmızı pelerini, gerçekçi mavi yıldız enerjisi silahını ve yüz stilini sanatçının Unreal/Blender içinde üretmesi gerekiyor. Mevcut prototip kıyafeti modern taktik ekipmana daha yakındır. Bu nedenle `UStarfortHeroCombatAsset.VisualGeneration` üretim kabul sürecine kadar onaylanmaz ve canlı oyunda eski görünüm otomatik değiştirilmez.

## Yeniden üretme
`STARFORT Real Rigged Rovan 3D Prototype (CC0 MakeHuman)` Github Actions iş akışı `workflow_dispatch` ile başlatılabilir. Kod dışında ücretli servis veya fal kredisi gerekmez. Kaynak parametre dosyası: `ContentPipeline/rovan_open_rig_base.params.json`.

## Kalan zorunlu işler
Gerçekçi fantastik zırh, pelerin, foto-gerçek doku ve özel büyü silahı, mobil üç LOD, 3D modelin Unreal Skeletal Mesh/AnimBP/Socket/Montage import kontrolü, UE 5.8 compile, fiziksel iOS + Android testleri, insan görsel onayı. Bunlar olmadan prototipin oyuna otomatik aktarılması yanlış olur.
