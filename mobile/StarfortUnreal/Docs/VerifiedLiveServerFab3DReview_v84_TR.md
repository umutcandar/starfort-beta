# STARFORT v84 — Gerçek sunucu savaşında ücretsiz Fab 3D karakter incelemesi

## Neler gerçek, neler geçici?

v80–83'teki **özel 3D galeri / offline 3v1 animasyon gösteriminden** farklı olarak v84, STARFORT'un mevcut oturum açma, bölüm başlatma, komut iletme, gerçek HP, yıldız, sonuç ve ödül sistemindeki **sunucudan doğrulanmış savaş turlarını** geçici dört Epic/Fab SkeletalMesh karakterine bağlayabilir.

- Yeni `AStarfortFabVerifiedBattleBridge` Unreal C++ aktörü, **yalnızca yerel Development derlemesinde**, ayrı `bEnableDevelopmentReview` seçeneği açıkken çalışır. `UE_BUILD_SHIPPING` koşuluyla Shipping'de kapatılır.
- Asıl `AStarfortBattleController` yalnızca mevcut `Online->OnBattleReady` olayı gerçekleşince, onaylı bir prodüksiyon sahnesi yoksa, bu aktöre gerçek `FStarfortVerifiedBattleTurn` gönderir.
- **Üç gerçek Paragon müttefik + bir gerçek Paragon rakip**, farklı `USkeletalMesh` modelleri, kendi iskeletleriyle uyumlu ayrı `UAnimSequence` Idle ve Attack klipleri ve gerçek Unreal kamera zorunludur.
- Bir odaya ilk kez girildiğinde (örneğin tamamlanmış 4. turdayken giriş) **saldırı yeniden oynatılmaz**, yalnızca gerçek karakter duruşu gösterilir. Yalnızca **daha yeni ve sunucu tarafından doğrulanmış** tur geldiğinde sıralama/animasyon değişir.
- `strike` ve `skill:<kahraman>` komutlarında gerçek kaynağın saldırı klibi oynayabilir; `guard`, `feint`, `rally` için uydurma saldırı animasyonu yoktur. `VerifiedDamageReceived > 0` ise rakibin gerçek saldırı klibi oynar.
- Savaş arayüzündeki HP, hasar, bölüm, ödül, galibiyet, yıldız, eşya ve yetenek bekleme süresi **yalnızca mevcut çevrimiçi sunucu akışından** gelir. Bu köprü **yeni savaş komutu göndermez**, sonuç veya para üretmez.
- Görev bitişinde, bölüm listesine dönüşte, hesap çıkışında ya da sahne kapanışında geçici modeller gizlenir/temizlenir. Prodüksiyon `AStarfortBattleStage::HasApprovedStage()` ve `UStarfortHeroCombatAsset::HasProductionReadyGeometryAndMotion()` kontrolü değişmez.

**Bu bir nihai kahraman paketi değil:** Paragon Wraith henüz bizim özgün kraliyet zırhlı Rovan modelimiz değildir. Bu yedi kahramanın özgün yüz/zırh/efektleri ve telefon kalite onayları ayrıca gereklidir. Unreal C++ kaynak testlerinin başarılı olması, otomatik olarak UE5.8 uygulamasının derlenip telefonda oynandığı anlamına gelmez.

## Mac/Unreal 5.8 kurulum ve gerçek oynanış testi

1. GitHub `main` dalındaki `mobile/StarfortUnreal` projesini **gerçek UE5.8** ve Xcode C++ toolchain ile açıp derle.
2. Epic hesabından ilgili ücretsiz Paragon Wraith, Greystone, The Fey ve Khaimera paketlerini lisanslarını **gerçekten okuyup kabul ederek** Unreal projesine ekle. Resmi Fab bağlantıları `Docs/PrivateParagonSevenHeroPlaytest_v80_TR.md` içinde. Modellere erişim/indirme benim GitHub kaynak işlemlerimle otomatik yapılmadı.
3. Unreal Editor `Tools > Execute Python Script` üzerinden `Tools/STARFORT_7_KAHRAMAN_TARA.py` çalıştır. `Saved/QA/fab_seven_private_selection_v80.json` içinde dört gerçek kaynak `SkeletalMesh` yolunun doğru olduğundan emin ol; gerçek Epic/Fab lisanslarını kabul ettiysen `user_confirmed_fab_license=true` yaz.
4. Gerçek `/Game/Maps/L_StarfortBattle` henüz yoksa önce `Tools/create_native_maps.py` ile native köy/kahraman/savaş/ittifak haritalarını oluştur. **Mevcut `.umap` sahnelerini yedekle**; script üretilmiş canlı battle level'a geliştirici referans modeli ekleyecek.
5. Unreal Editor `Tools > Execute Python Script` içinde `Tools/STARFORT_CANLI_FAB_3D_KUR.py` çalıştır. Bu script, **Aldren/Greystone, Lyra/The Fey, Rovan/Wraith** için gerçek 3 ayrı animasyonlu rig, **Doran/Khaimera** için rakip, kamera ve opt-in C++ köprüsünü seviyeye **bir kez** yerleştirir. Yüklü animasyonlar/skeletonlar uyumsuzsa veya eski bir kurulum varsa durur; görsel açıdan tamamlama iddiası üretmez. Yazdığı yerel rapor: `Saved/QA/verified_fab_server_art_review_v84.json`.
6. **Play in Editor** ya da Mac/Android/iOS **Development smoke** paketinden kendi hesabınla giriş yap; mevcut oyun üzerinden sefer/bölüm başlat, gerçek sunucu savaşını dene. Savaşın gerçek üç kahraman takımı *Aldren + Lyra + Rovan* ise ve online oturum doğrulanmışsa köprü 3D kaynak karakterleri gösterebilir. Sunucu farklı takım gönderiyorsa bağlayıcı **yanlış üçlüyü göstermez**; proje haritasındaki yerel `RealFabRigs` takımı gerçek seçilen takıma göre düzenlenmelidir.
7. 3D ekranda gerçek hasarı online savaş HUD'undan takip et. Rutin güvenlik testleri: tekrar gönderilen eski turda animasyon tekrarı yok, farklı hesaba geçince önceki karakter kayboluyor, savaş bitince modeller gizleniyor, server bağlantısı kesilince hasar/galibiyet uydurulmuyor.

### Yalnızca yerel Development smoke (Unreal Editor/SDK ve sahne kurulumu sonrası)

```bash
cd mobile/StarfortUnreal
python3 Tools/native_mobile_build.py --platform ios --profile smoke --dry-run
# Engine 5.8, Xcode, gerçek .umap ve imzalama hazır olduğunda:
python3 Tools/native_mobile_build.py --platform ios --profile smoke
```

Android SDK mevcutsa aynı komutta `--platform android` kullanılabilir. Smoke profili mevcut real native battle level'ı sadece gerçekten `.umap` ise cook eder; normal `Entry` girişinden gerçek STARFORT arayüzüyle oynama akışını korur. **Bu ortamda** Epic/Fab model varlıkları, gerçek UE5.8, imzalanmış IPA/APK, iPhone bağlantısı ve fiziksel oyun testleri yok. Bu aşamanın geçtiğini iddia etmek yanlış olur.

### Kesin kalite sınırı

- **Shipping sürümünde** köprü aktifleştirilemez; server-linked production battle her zaman bağımsız `bArtApprovedForMobile`, özgün zırh ve beş ayrı animasyon/efekt kalite kontrollerini gerektirir.
- Bu prosedür **başkalarıyla modelleri dağıtma izni** sağlamaz. Lisansların özel dağıtım, ticari oyun ve Unreal kullanım şartlarını Fab/Epic üzerinden ayrıca kontrol et.
- Bu kaynak kod, gerçek kaynak modeller geldiğinde "savaş mekanizmasını gerçek 3D sahnede deneyelim" basamağını kısaltır; **son oyunun AAA görüntüsü veya telefon performansı henüz doğrulanmış değildir**.

## Kaynak testi

```bash
python3 Tools/test_verified_fab_live_bridge_v84.py
python3 Tools/stage_verified_fab_online_battle_v84.py --contract
```

Bu iki komut yerel makinedeki Epic varlıklarını indirmez, `.uasset` oluşturmaz ve Unreal derlemesi yapmaz. Gerçek Editor kurulumu yalnızca Unreal içindeki `STARFORT_CANLI_FAB_3D_KUR.py` adımıyla gerçekleşir.
