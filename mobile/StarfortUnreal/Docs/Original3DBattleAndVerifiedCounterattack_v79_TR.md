# STARFORT v79 — Gerçek 3B savaş alanı / onaylanmış hasara bağlı sinematik savaş

## Bu pakette gerçekten üretilen dosya

- STARFORT'un özgün, prosedürel olarak modellenmiş **Kül Savaş Alanı** GLB dosyası; doğrudan 3B mesh ve gömülü PBR renk/normal/metalik-pürüzlülük dokuları içerir.
- Gerçek 3B yapı: **95 ayrı parça, 80.000 üçgen**, yaklaşık 3 MB; merkezde üç kahraman ve bir düşman için görüşü açık saha, kenarlarda düzensiz kayalar, yıkık bazalt sütunlar ve molozlar.
- Kaynak: `Tools/generate_original_ash_battlefield_v79.py`. GitHub Actions `STARFORT Original 3D Ash Arena GLB` çalışması aynı model dosyasını tekrar üretir ve indirme artifaktı olarak saklar.
- Dosya adı: `StarfortAshBattlefield_v79.glb`; SHA-256: `f60553379ebc821eef57e9807a1bdb05dc6a771360f263854bc99214e0555d25`.
- Bu çevre **gerçek 3B arazi**, ama Unreal Editor'da henüz sanat yönetimi ve fiziksel telefon testlerinden geçmedi; **rigged kahraman değildir**. Mobil sürümün tamamlandığı iddiası oluşturmaz.

## Kodda değişen savaş sistemi

1. `AStarfortBattleStage::CaptureAuthoredFormation` sanatçının sahneye yerleştirdiği kahraman/düşman başlangıç pozisyonlarını saklar.
2. Sunucudan doğrulanmış `strike`, `guard`, `feint`, `rally` ve `skill:hero_id` aksiyonları kendi Unreal SkeletalMesh montajları/FX ile birlikte çarpışmasız **3B ileri hamle, yan kaçış veya mevzi koruma hareketi** oynatır. Her harekette başlangıç pozisyonuna döner; sınırsız drift yok.
3. `UStarfortOnlineSubsystem` yalnızca **aynı görevde iki ardışık doğrulanmış sunucu HP snapshot'ı** arasındaki düşüşten `VerifiedDamageReceived` çıkarır. Yeni hesap, yeni görev, bağlantı kopması veya bilinmeyen önceki snapshot nedeniyle asla saldırı uydurmaz.
4. Takım canı gerçekten azaldığında, önceden doğrulanmış oyuncu saldırısı efektinden sonra **0,76 sn** gecikmeli, benzersiz `EnemyAttackMontage`, `EnemyAttackSystem` ve `EnemyAttackSound` ile düşmanın karşı hamlesi gösterilir. Zamanlayıcı oda/turn/yükleme generation anahtarı ve sign-out temizliği ile korunur.
5. `UStarfortBattleScreen` doğrulanmış hasar varsa gerçekten düşen takım HP'sini bildirir; HP, zafer, drop, eşya ve ekonomiyi cihaz hesaplamaz.
6. Düşmanın attack/hit animasyonunu veya Niagara efektini aynı şeye bağlamak prodüksiyon 3B onayını geçmez. Gerçek skeleton uyumu ve daha önceki v78 kahraman mesh/LOD benzersizliği şarttır.

## Unreal 5.8 Editor entegrasyonu

Önce `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını gerçek Unreal Engine 5.8 Editor'da C++ toolchain ile açıp derle. Kaynak doğrulama CI'sı bunu yapmaz.

Sırasıyla:

1. GitHub Actions **STARFORT Original 3D Ash Arena GLB** çalışmasındaki `starfort-original-ash-arena-v79-glb` artifaktını ya da üretilmiş dosyayı al.
2. `StarfortAshBattlefield_v79.glb` dosyasını `mobile/StarfortUnreal/ContentPipeline/Incoming/Environment/Battle/` dizinine koy. `Incoming/` Git'e gönderilmez.
3. Unreal Editor Python Console/Editor Utility ile **bir kez** `Tools/create_native_maps.py` çalıştır; mevcut haritalara dokunmaz. Sonra `Tools/import_original_ash_battlefield_v79.py` çalıştır. Gerçek Interchange GLB importu başarılı ve en az 70 mesh görülmeden haritaya herhangi bir şey eklemez; önceki haritayı kopyalamaz veya eski içeriği silmez.
4. Son olarak yedi **gerçek, lisansça temiz, v2 onaylı skinned kahramanı**, animasyonları, ayrı silah ve Niagara/SFX varlıkları `BP_StarfortBattleStage` ve `UStarfortHeroCombatAsset` içine yerleştir. Bir düşman için ayrı Attack/Hit montaj, FX ve ses bağla.
5. `Tools/editor_visual_preflight.py`, `Tools/run_editor_qa.py`, gerçek Android/iOS paketleme ve cihaz oynanışını tamamlamadan `bArtApprovedForMobile` durumunu açma.

Bir üretim sunucusu, WebView veya HTML savaş sahnesi oluşturulmaz. Unreal .umap ve .uasset dosyaları **bu oturumda yerel Editor olmadığı için import edilmiş gibi gösterilmez**.

## Şu an eksik olanlar

- Yedi orijinal AAA yüz, zırh ve silah için gerçek rigged üretim. Bu oturumdaki ücretli Tripo H3.1 modeli isteği, bağlı fal.ai hesabında bakiye olmadığı için reddedildi; GLB kahraman çıktısı yok.
- Başka seçenek Epic Fab lisanslı, yerel olarak kullanıcı hesabından edinilecek başlangıç meshleri; v77 `Tools/fab_character_review.py` mevcut. Kaynakları GitHub'da kamuya açık yeniden dağıtma.
- Unreal 5.8 C++/Editor runtime, BP animasyon ataması, ses/efekt art, AAB/IPA ve fiziksel mobil QA.

## Tekrarlanabilir kontroller

```bash
python3 mobile/StarfortUnreal/Tools/test_native_mobile.py
python3 mobile/StarfortUnreal/Tools/test_verified_battle_motion_v79.py
python3 mobile/StarfortUnreal/Tools/test_original_battlefield_v79.py
python3 mobile/StarfortUnreal/Tools/generate_original_ash_battlefield_v79.py --out StarfortAshBattlefield_v79.glb
```

İlk üçü Unreal kurmadan kodun temel güvenlik/kaynak sözleşmesini inceler. Sonuncusu bağımlılıkları (`numpy scipy trimesh Pillow`) kurulu bir Python ortamında **gerçek orijinal GLB** üretir; yedi 3B kahraman yaratmaz.
