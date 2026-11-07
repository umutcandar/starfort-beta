# STARFORT Mobile v68 — Üç kahramanlı sinematik savaş

**Platform:** Unreal Engine 5.8; yatay iOS ve Android, tamamen native. Mevcut web oyunu mobil uygulamanın görüntüleyicisi değildir.

## Kaynak koduna eklenen gerçek işlevler

- AStarfortBattleStage artık HeroRig, HeroRig2 ve HeroRig3 adlı üç bağımsız SkeletalMeshComponent içerir. Her karakterin ayrı silahı, Niagara özel efekti ve sahnedeki pozisyonu vardır. Karşıda EnemyRig bulunur.
- Kahramanların kimlikleri yalnızca sunucudan gelen FStarfortVerifiedBattleTurn.TeamHeroes dizisinin sırasından alınır. Yerel karakter oluşturma, ücretsiz kahraman veya sahte hasar yoktur.
- UStarfortHeroCombatAsset sınıfı her kahramanın ayrı animasyon ve silah modelini tutar. strike, guard, feint, rally ve special montajları ve FX/temel/özel sesleri için bağımsız alanlar vardır.
- Sunucunun onayladığı skill:rovan yalnızca Rovan'ın riginde özel yetenek oynatır; skill:lyra yalnızca Lyra'da oynar. Tüm ekibe etki eden sıradan komutlar, her kahramanın kendi montajını kullanır.
- Hasar VFX'i yalnız doğrulanmış tur ve doğrulanmış hasar için çalışır. Sunucu sonuçları değişmeden kalır.
- Yeni dalgada kamera genişler; onaylı darbede yaklaşır; sonra normal kadraja döner. Yüksek kalite onayı eksikse görsel sahne boş kalır, ucuz küp/manneken gösterilmez.
- Orta alanı şeffaf yerel UMG savaş arayüzü, gerçek 3D mekânı kapatmaz. Üstte can ve düşman niyeti, altta saldırı ve üç kahramanın özel yeteneği vardır.
- Bağlantı yeniden kurulduğunda eski bir tur veya beceri animasyonu tekrar oynatılmaz.
- Art-directed stage aktörü varsa BattleController onu kullanır; yoksa varsayılan native stage yaratır. create_native_maps.py savaşı düzenlemek için haritaya gerçek C++ stage yerleştirir.
- native_mobile_build.py smoke profilinde var olan gerçek .umap dosyalarını paketlemeye dahil eder. Derleme aracı kurulmadan .apk/.ipa üretildiği iddia edilmez.

## Gerekli yedi gerçek kahraman

| Sunucu ID | Planlanan Unreal Data Asset |
| --- | --- |
| aldren | DA_Hero_Aldren |
| lyra | DA_Hero_Lyra |
| rovan | DA_Hero_Rovan — Kraliyet Nişancısı |
| mira | DA_Hero_Mira |
| doran | DA_Hero_Doran |
| vesper | DA_Hero_Vesper |
| eira | DA_Hero_Eira |

ContentPipeline/server_hero_art_mapping.json planlanan Unreal varlık yollarını listeler. Bunlar gerçek dosyalar DEĞİL. 18 ögeye genişletilen ContentPipeline/required_premium_assets.json tüm yedi kahramanı, enerji topunu, iki düşmanı ve sekiz kale/çevre varlığını içerir.

## Unreal Editor'a gerçek içerik bağlama

1. Unreal Engine 5.8 içinde gerçek C++ derlemesini yap. Source QA bunun yerine geçmez.
2. Lisanslı ve sanat yönetimi tarafından onaylanan gerçek 3D mesh ile texture/PBR materyalleri içe aktar. Rovan'ın yüzü, altın işlemeli zırhı, kırmızı pelerini ve mavi enerji silahı onaylanmış konsept referansının kalitesinde olmalı.
3. Her kahraman için UStarfortHeroCombatAsset türünde Data Asset oluştur; HeroId alanını sunucu kimliği ile birebir eşleştir; HeroMesh, WeaponMesh, WeaponSocket ve ImpactSocket alanlarını gerçek Unreal varlıklarıyla doldur.
4. Her karakterin AnimBP'sinde aim, strike, guard, feint, rally, special, hit, death animasyonları ve montage slotlarını doğru rig ile kur. Silahın weapon_r ve muzzle socket isimleri gerçekten bulunmalı.
5. BP_StarfortBattleStage içinde HeroArtCatalog listesine yedi asset'i ekle. EnemyRig, EnemyHitMontage, ImpactSystem ve gerçek arena çevre modellerini bağla. Asset'ler onaylı değilse bArtApprovedForMobile false kalsın.
6. Sahne haritasına artist-authored stage koy ve BattleController'ın BattleStageClass alanını buna göre ayarla. Sahte primitive 3D kale/adam kullanılmasın.
7. Gerçek WBP_BattleHUD ile mobil güvenli alan, yatay telefon oranları, okunabilir beceri ve can göstergeleri üret. Mevcut yerel UMG yalnızca QA fallback'tir.
8. Her kahraman ve tüm üçlü takım kombinasyonlarında dalga geçişi, cooldown, hasar, özel yetenek ve yeniden giriş senaryolarını gerçek iPhone/Android cihazlarında test et.

## Önemli teslim sınırı

Bu paket C++ kaynakları, şeffaf UMG QA arayüzü, veri asset tanımı, kalite kapıları ve Editor sahne betiğidir. Gerçek yüksek detaylı skinned 3D modeller, .uasset animasyon ve müzik/VO dosyaları henüz üretilmedi. Unreal Editor ile C++ derleme ve telefon kurulumu yapılmadı. Testlerin yeşil olması AAA 3D görsellerin hazır olduğu anlamına gelmez.

## Mobil bellek ve güvenli hesap geçişi

- HeroArtCatalog, yedi büyük kahraman modelini doğrudan belleğe almak yerine HeroId + TSoftObjectPtr<UStarfortHeroCombatAsset> eşleştirmesi tutar. Sunucunun seçtiği üç kahraman dışındaki asset'ler savaş açılışında yüklenmez.
- Data Asset içindeki AnimInstanceClass gerçek skeleton ile uyumlu bir Anim Blueprint olmak zorundadır; aksi halde Montage_Play görünür animasyon üretmeyebilir. Savaş başlamadan önce üç varlık yüklenirken oluşabilecek takılmayı önlemek için üretim sürümünde asenkron yükleme ve giriş yükleme ekranı eklenmelidir. Bu pakette ilk kullanım LoadSynchronous ile çalışır; performans ölçülmeden kusursuz olduğu iddia edilmez.
- Bir savaş sona erdiğinde, köy/sefer ekranına dönüldüğünde veya hesap değiştirildiğinde ClearBattlePresentation eski üç karakteri, silahları ve efektleri temizler. Başka hesaba ait kahramanlar ekranda kalmaz.
- Blueprint Stage üzerinden her bir HeroArtCatalog satırına hem Server ID (aldren, lyra, rovan, mira, doran, vesper, eira), hem Soft Asset referansını ata. Uygun ID ile olmayan, duplikasyon olan veya gerçek AnimBP bulunmayan varlık reddedilir.
- Bu kalite kapısı tek başına modelin gerçekçiliğini ölçmez; yüksek poligonlu bir oyuncak da yapısal testlerden geçebilir. İnsan görsel onayı ve gerçek telefon kalite kontrolü zorunludur.
