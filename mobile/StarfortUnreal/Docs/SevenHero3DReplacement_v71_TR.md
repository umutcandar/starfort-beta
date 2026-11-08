# STARFORT v71 — Yedi kahramanın 3D görsel yenileme planı ve güvenli değiştirme hattı

**Karar:** Oyuncunun beğendiği Kraliyet Nişancısı ekranındaki ışık, metal, yüz, zırh ve silah standardı yeni kahraman sanat yönetimi çizgisidir. Eski 2D resimler, sprite hareketleri veya basit/kemiksiz GLB dosyaları **Unreal kahramanı sayılmaz**. Bu revizyon görünümü yeniler, oyun hesabını ve ilerlemesini sıfırlamaz.

## Yapılan işler (gerçek kaynak kodu ve araçlar)

- `ContentPipeline/hero_redesign_v2.json`: özgün yedi kahramanın yüzü, zırhı, renkleri, silahı, boyu, silüeti, özel efekt tasarımı ve model teslim sözleşmesi.
- `UStarfortHeroCombatAsset`: **VisualGeneration == 2**, `bLegacyPlaceholder == false`, boş olmayan bağımsız `VisualReviewId`, lisanslı/sanat onaylı rig, AnimBP, beş ayrılmış aksiyon montajı, silah, efekt, ses ve LOD koşulları.
- `AStarfortBattleStage`: her karakterin kendi `Art->StrikeMontage/GuardMontage/FeintMontage/RallyMontage/SpecialMontage` hareketi kullanılır. Önceki *paylaşılan jenerik montaj fallback* kaldırıldı.
- `Tools/validate_hero_v2_models.py`: kaydedilmiş gerçek `.glb` dosyalarının binary geometry, 40+ rig joint, JOINTS/WEIGHTS vertex data, index/mesh, 10 adlandırılmış **gerçek keyframe** animasyon, gömülü PBR base/normal/metallic-roughness texture ve üç farklı LOD geometrisini denetler. Ayrı gerçek silah modeli ister.
- `Tools/stage_hero_v2_in_unreal.py`: dosyalar mevcut ve doğrulanmışsa Unreal 5.8'in gerçek GLB import sistemiyle v2 staging klasörüne import hazırlar. **Üretim kahramanlarını otomatik değiştirmez veya hesaptaki kahramanları silmez;** onaysız içerik etkinleşmez.
- `server_hero_art_mapping.json` ve 18 varlıklı `required_premium_assets.json` yeni nesle geçti. Artık eski 2D portre/sprite görseli yeni native premium kahraman yerine kullanılamaz.

## Yeni kahraman kadrosu

| Sunucu kimliği (değişmeyecek) | Yeni 3D görünüm | Silah / savaş ifadesi |
|---|---|---|
| `aldren` | Kül Muhafızı, yıpranmış ağır siyah demir ve bronz zırh | Kalkan-kılıç, yıldız koruma bariyeri |
| `lyra` | Gümüş saçlı Yıldız Dokuyucu, lacivert işlemeli cübbe | Turkuaz kristal asa, takımyıldızı büyüsü |
| `rovan` | **Kraliyet Nişancısı**, gerçekçi altın/mavi zırh, kırmızı pelerin | Mavi yıldız enerjili uzun nişancı tüfeği |
| `mira` | Ay Rahibesi, filigranlı fildişi-gümüş kıyafet | Ay ışığı mühürü, takım iyileştirme efekti |
| `doran` | Demir Yemin, bakır sakallı yıpranmış demir savaşçı | İki elli savaş baltası, çift darbe |
| `vesper` | Gölge Düellocusu, bordo deri ve koyu zincir zırh | İkiz kıvrık hançer, dumanlı hızlı saldırı |
| `eira` | Kutup Kâhini, kızıl örgü saç, lacivert kürklü kuzey cübbesi | Buz kristalli asa, ayaz çemberi |

**Sunucu tarafındaki mevcut kimlikler korunur.** Karakterin beceri gücü, bölümlerden açılma sırası, seviye, satın alma, envanter ve ödül sunucuda kalır. Rovan'ın `rovan` ID'si, görünümde Kraliyet Nişancısı olduğunda da aynıdır. Bu kozmetik yeniden tasarım, hasar formülünü değiştirmez.

## Bir kahramanın kabul edileceği gerçek teslim dosyaları

Örnek Rovan için beklenen **gerçek dosyalar**:

```text
ContentPipeline/Incoming/Heroes/v2/rovan/
  rovan_body_LOD0.glb   # Full body, en az 40 skinned bone, 10 keyframed animasyon
  rovan_body_LOD1.glb   # Aynı kimliğin düşürülmüş detaylı iskeletli LOD'u
  rovan_body_LOD2.glb   # Mobil düşük GPU LOD'u
  rovan_weapon.glb      # Ayrı 3D silah geometrisi, gerçek PBR texture
```

Aynı düzen diğer altı kahraman için de zorunludur. Kontrol aracı modelin görsel gerçekçiliğini **değerlendiremez**; uygun doku ve eklem sayısı yüksek olsa bile insan onayı ve telefonda performans gerekir. Eski WebP portreler bu kontrolü geçemez.

## Deneme / import

```bash
cd mobile/StarfortUnreal
python3 Tools/test_hero_v2_models.py
python3 Tools/validate_hero_v2_models.py --contract-only  # SADECE sözleşme; kahraman yapıldığı anlamına gelmez
python3 Tools/validate_hero_v2_models.py                  # Gerçek GLB eksikse hata ile biter
python3 Tools/stage_hero_v2_in_unreal.py --dry-run         # Gerçek modeller olmadan import başlamaz
```

Gerçek 3D modeller üretildikten sonra Unreal Editor 5.8'in Python Console/Script Plugin'i içinden `Tools/stage_hero_v2_in_unreal.py --apply` çalıştırılır. Import edilen modeller sonraki aşamada SkeletalMesh/AnimBP, kurulan LOD, Montage, `UStarfortHeroCombatAsset` ve `BP_StarfortBattleStage` içerisine bağlanır. Varlıklar görsel onaydan geçmeden `bLegacyPlaceholder` kapatılıp `VisualReviewId` verilmez. Eski web portreleri sadece web oyuncusunu bozmamak için ayrı arşiv olarak durur; yeni native 3D varlık olarak içe alınmaz.

## Güncel üretim engeli

Bağlı fal.ai 3D kütüphanesi boş. Önceki ücretli 3D üretim denemesi **yetersiz kredi** nedeniyle çalışmadı; bu oturumda yeni ücretli 3D model çıktısı oluşmadı. Ayrıca çalıştığım ortamda Unreal Editor, Blender, rigging/retargeting ve fiziksel iOS/Android test cihazı mevcut değil. Bu paket **yedi orijinal 3D tasarım sözleşmesi, gerçek dosya kabul testi, Unreal import hazırlığı ve legacy'nin native görsel fallback'inden çıkarılmasıdır; yedi bitmiş 3D model değildir.**

Resmî teknik referans: Unreal Engine 5.8'in GLB/glTF/FBX Interchange ve FBX animasyon ithalat boru hattı. GLB ithalatından sonra animasyon retarget ve materyal slotlarının Unreal Editor içinde kontrol edilmesi gerekir.
