# STARFORT v77 — Gerçek AAA 3D karakterlerin Unreal Editor inceleme sahnesi

## Bu kez düşük kaliteli otomatik manken kullanmıyoruz

Epic'in gerçek Unreal SkeletalMesh, AnimBP, FX ve hareket döngülerini içeren ücretsiz Paragon karakterlerini başlangıç kalite kaynakları olarak değerlendirdik. Rovan için Wraith, Aldren için Greystone, Lyra için The Fey, Vesper için Countess seçildi. Bunlar STARFORT'un özgün tasarımlarının bitmiş karşılığı değildir. Özellikle Wraith maskeli bilim-kurgu karakteri olduğundan Rovan'ın sarışın yüzü, altın-mavi işlemeli zırhı, kırmızı pelerini ve enerji silahı özgün olarak yeniden yapılmalıdır.

## Dört resmi Fab bağlantısı

- Rovan için Wraith: https://www.fab.com/listings/17e0840f-8651-4933-bd6d-211a34b1dd17
- Aldren için Greystone: https://www.fab.com/listings/122fd7bf-6f12-4304-a930-cccbbacdaebc
- Lyra için The Fey: https://www.fab.com/listings/9afbcde6-4a14-4018-95c3-2f3a2e1da858
- Vesper için Countess: https://www.fab.com/listings/0bf014eb-f2ed-4029-adda-81a855eb5220

## Mac/PC Unreal Editor 5.8 kullanımı

1. Yukarıdaki dört Fab sayfasında Epic hesabınla Kütüphaneme ekle seçeneğini kullan, geçerli EULA'yı gözden geçir ve kabul et. Bu işlemi ChatGPT hesabın adına yapmadı.
2. Güncel STARFORT deposunu indir. Unreal Engine 5.8 Editor'da mobile/StarfortUnreal/StarfortUnreal.uproject projesini aç.
3. Fab Unreal Editor entegrasyonundan dört paketi kendi yerel projene Add to Project ile ekle. Beklenen Content klasörleri: ParagonWraith, ParagonGreystone, ParagonTheFey, ParagonCountess. Başka klasör kullanılmışsa ContentPipeline/fab_hero_reference_v1.json içindeki expected_root ile eşleştir.
4. Unreal Editor Python Console üzerinden aşağıdaki komutla gerçek mesh taramasını çalıştır:

```python
import runpy, sys
sys.argv=['fab_character_review.py','--scan']
runpy.run_path('Tools/fab_character_review.py',run_name='__main__')
```

5. Saved/QA/fab_character_candidates.json içinde her karaktere ait gerçek SkeletalMesh ve materyal adları görünür. Saved/QA/fab_hero_selection.json içindeki önerileri inceleyip saç, kafa veya silah yerine tam gövdeli modeli seç.
6. Aynı konsolda aşağıdaki komutla ayrı inceleme haritası oluştur:

```python
import runpy, sys
sys.argv=['fab_character_review.py','--stage']
runpy.run_path('Tools/fab_character_review.py',run_name='__main__')
```

7. /Game/Maps/L_StarfortFabCharacterReview haritasını aç. Kaynak gerçekten kurulmuşsa dört ayrı skinned SkeletalMeshActor, ışıklar ve kamera olacak. Önceden mevcut haritanın üzerine yazılmaz. Saved/QA/fab_character_preview_report.json raporu gerçek sonucu gösterir.

## Şu an ne hazır, ne eksik?

HAZIR: Lisanslı kaynak dizinini arama, gerçek 3D SkeletalMesh/materyal tespiti, seçilen dört mesh ile bağımsız UE Editor haritası oluşturma, kalite raporu, git kaynak-lisans güvenliği ve testler.

EKSİK: Epic hesabında EULA kabulü ve dört 3D assetin yerel Unreal projeye yüklenmesi. Bu oturumda Epic hesabını kullanmadık; dolayısıyla dört gerçek karakter henüz STARFORT .uasset içeriğine eklenmedi. Gerçek Unreal derlemesi, animasyon uyarlaması, özgün STARFORT silah/zırh/kaplama/efekt üretimi, mobil LOD ve gerçek iOS/Android testi de yapılmadı.

## Telif ve kalite

Paragon karakterlerinin ham source assetleri herkese açık GitHub deposuna yüklenmemelidir. Fab Standard License, uygun projede ticari kullanım ve uyarlamaya izin verebilir fakat standalone yeniden dağıtıma izin vermez. STARFORT oyununda Paragon marka adını reklam ya da oyun ismi olarak kullanma. Kaynak ürünlerin NoAI işaretini gözeterek assetleri generatif modele girdi yapma. Yerel Editor içinde incelenebilir.

mobile/StarfortUnreal/.gitignore üçüncü taraf Content/Paragon*/ ve diğer kaynak dizinlerini dışlar. Tools/audit_public_asset_hygiene.py CI üzerinden ayrıca takip edilen dosyaları denetler. Oyun sunucusunda rovan, aldren, lyra, vesper kimlikleri, seviyeler, satın almalar ve güç dengesi hiç değiştirilmez.

Bu inceleme haritası nihai savaş haritası değildir. UStarfortHeroCombatAsset üzerindeki eski kalite kapısı sıkı biçimde korunur; onaysız Paragon kaynakları orijinal STARFORT 3D karakteri olarak canlı oyuna alınmaz.

Referanslar: https://dev.epicgames.com/documentation/fab/purchasing-and-downloading-assets-in-fab ve https://www.fab.com/eula
