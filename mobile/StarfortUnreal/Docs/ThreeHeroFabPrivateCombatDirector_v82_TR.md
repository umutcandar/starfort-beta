# STARFORT v82 — Gerçek 3D kahramanlarla özel 3'e 1 savaş yönetmeni

## Bu turda yapılanlar

- `AStarfortFabPreviewController` artık **3 ayrı gerçek SkeletalMesh müttefik** ve **1 gerçek rakip** ayrımını, Unreal sahne aktörlerinde `SFPREVIEW_SIDE=ALLY/OPPONENT` işaretlerinden okur.
- Önceden loop'a alınmış sahte/ücretsiz animasyonlarla savaş başlatılmaz. **4 gerçek karakter boşta durma pozisyonuyla başlar.**
- `Q` basınca gerçek Paragon karakterlerinin kendi **uyumlu `AnimSequence` saldırıları** sırasıyla oynar. Aynı kaynaktan gerçek klip olmayan kahraman atlanır; ekran kaç gerçek animasyonun oynatıldığını bildirir. Hiçbir gerçek saldırı klibi yoksa başarılı gibi davranmaz.
- Gerçek iskelet animasyonuna ek olarak kahraman kontrollü ve **68 Unreal cm'yi aşmayan**, başlangıç pozisyonuna dönen küçük bir ileri hamle yapar. Sınırsız pozisyon kayması veya görünmez çarpışma hesabı yoktur.
- `E` rakibin kendi Fab saldırı klibini yalnızca mevcutsa oynatır; **oyuncunun canını azaltmaz, savaş kazanılmış gibi göstermez.**
- `B` geniş kamera (3+1 dizilişi) / seçili kahraman yakın kamerası değiştirir. Sıralı saldırıda sinematik olarak gerçek saldıran kahramana yaklaşır, dizi bitince geniş dizilişe döner.
- Savaş HUD'unda gerçek dost/rakip sayısı, oynatılan klip ve `Q/E/B` kontrolleri görünür. Yüklenmemiş karakter için sanal kostüm, loot, XP veya hasar hesabı uydurulmaz.
- Eski `SPACE` ile seçili tek kahramanın gerçek saldırısını oynatma, `1-7` seçim, `W/S` zoom, `A/D` döndürme ve `TAB` galeri / özel savaş değişikliği sürer.

Bu özellikler **yalnızca iki özel UE5.8 editör haritasında** çalışır: `L_StarfortPrivateFabPlaytest_v80` ve `L_StarfortPrivateFabBattle_v80`. Bunlar gerçek sunucudaki STARFORT savaş görevleri değildir; online hesap, Supabase, ödüller, görev başarısı, para ve HP **değiştirilmez**. Source QA, fiziksel cihaz testi veya Unreal derlemesi değildir.

## MacBook'ta nasıl test edersin?

1. Son `main` sürümünü indir. Unreal Engine 5.8 ve C++ derleyicisiyle `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını aç/derle.
2. Daha önce yapılmadıysa yedi **ücretsiz** Fab / Paragon karakterini Epic hesabında lisanslarını inceleyip kütüphaneye ekle; Unreal 5.8 `Fab > My Library > Add to Project` ile STARFORT projesine aktar. Resmî linkler: `Docs/PrivateParagonSevenHeroPlaytest_v80_TR.md`. Epic içeriği kendiliğinden indirilmiyor.
3. `Tools > Execute Python Script` üzerinden `Tools/STARFORT_7_KAHRAMAN_TARA.py` çalıştır. `Saved/QA/fab_seven_private_selection_v80.json` içindeki SkeletalMesh yollarını gözden geçir ve **yalnızca ilgili Epic/Fab lisanslarını gerçekten kabul ettiysen** `user_confirmed_fab_license=true` yap.
4. `Tools/STARFORT_7_KAHRAMAN_KUR.py` çalıştır. En az 4 gerçek rig varsa orijinal oyun haritalarına dokunmadan **7 kahraman galerisi** ve **3'e 1 önizleme haritasını** yaratır.
5. Content Browser'da `/Game/Maps/L_StarfortPrivateFabBattle_v80` aç. `Tools > Execute Python Script > Tools/STARFORT_3V1_SAVAS_KONTROL.py` çalıştır. Gerçek rig/klip, 3+1 sayısı, tek kaynak kamera, özel GameMode ve iskelet uyum kontrolünün sonucu `Saved/QA/Private3v1RealFabBattleAudit_v82.json` içine yazılır.
6. **Play in Editor** başlat. `Q` ile müttefiklerin sırayla gerçek saldırılarını, `E` ile rakibin saldırısını, `B` ile genel/özel kamera farkını gözlemle. Gerçek saldırı yoksa uyarı verir. Sahnenin görüntülerini veya kısa video kaydını inceleyerek sonraki sanat kararlarını verebilirsin.

**Önemli:** v80/v81 önizleme haritalarını daha önce kaydettiysen araç var olan haritaların üzerine yazmayı reddeder. v82 C++ değişikliği mevcut haritalarda otomatik çalışır; ancak v80'de hazırlanmış sahnede saldırıların açılışta döngüye girmesini önlemek için eski aktörlerin `AnimationData` durumunu yerel UE Editor'da Idle'a ayarla veya önizleme haritasını yedekledikten sonra yeniden oluştur.

## Özgünlük ve gerçekçi kalite

Fab/Paragon karakterleri profesyonel 3D geçici referanslardır. Örneğin Wraith, gerçek sarışın altın-mavi zırhlı Rovan değildir. Yedi özgün STARFORT kahramanının yüzleri, zırhları, silahları, mobil LOD'ları, her karakterin ayrı beş savaş animasyonu ve sinematik SFX/Niagara sistemleri halen insan kontrolü gerektirir. Yedi karakter modelini birden **orijinal tasarım tamamlandı** olarak işaretleme.

`Source/StarfortUnreal/Private/StarfortBattleStage.cpp` asıl STARFORT sunucu bağlantılı üç kahramanlı savaş sahnesi olarak ayrı durur. **v82 oraya ücretli ilerleme / yerel sahte hasar yazarak kalite kapısını atlamaz**. Gerçek prodüksiyon görselleri onaylanıp Blueprint/Montage eşleştirmeleri ve mobil test yapıldıktan sonra bu iki alanı birleştirmek gerekir.

## Doğrulama

```bash
python3 mobile/StarfortUnreal/Tools/test_private_3v1_battle_v82.py
python3 mobile/StarfortUnreal/Tools/verify_private_fab_battle_v82.py --contract
```

Bunlar lisanslı assetleri veya `.umap` üretmez. Gerçek Editor QA yalnızca `Tools/STARFORT_3V1_SAVAS_KONTROL.py` içinden çalışır. GitHub Actions testleri **kaynak/taahhüt uyumluluğunu** doğrular; UE5.8'in bilgisayarında derlenip Play-in-Editor'da çalışacağı sonucu bu testlerden çıkarılamaz.
