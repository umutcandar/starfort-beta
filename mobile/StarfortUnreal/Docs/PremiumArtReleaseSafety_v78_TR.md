# STARFORT v78 — Native AAA karakter çeşitliliği ve gerçek mobil çıkış kapısı

**Durum:** Bu paket kod ve test düzenlemesidir; Unreal Editor derlemesi, Epic/Fab varlık aktarımı, gerçek iOS/Android cihaz testleri ve mağaza yayını değildir. Eski web prototipi mobil ürünün yerini almaz.

## Kaynakta uygulanan değişiklikler

1. `UStarfortHeroCombatAsset::HasDistinctCombatChoreography()` beş sunucu hareketi için **beş ayrı** Unreal AnimMontage ve **beş ayrı** NiagaraSystem kontrol eder. Birden çok tuşa aynı animasyonu bağlamak artık onaydan geçmez.
2. `HasProductionReadyGeometryAndMotion()` görsel onay işareti veya beyan edilen LOD sayısını tek başına yeterli görmez: gerçek `USkeletalMesh::GetLODNum()`, en az 40 kemik, geçerli skeletal mesh skeleton'u ve her animasyonun o skeleton'a bağlı olması zorunlu.
3. `AStarfortBattleStage` üç kahramanın kimliklerinin yanında gerçek gövde meshlerinin ve silah meshlerinin de benzersiz olmasını ister; sahne çalışma sırasında değiştirilirse `HasApprovedStage()` tekrar kontrol eder. Bu tercih, STARFORT'un aynı jenerik kahramanın üç kopyası gibi görünmesini engellemek içindir.
4. Paketleme aracı `smoke` için `Development`, `release` için `Shipping` + `-distribution` üretir. Release hâlâ eksik gerçek haritalar, UMG ve sanat varlıkları karşısında **bilinçli olarak başarısız** olur; imza ve fiziksel cihaz doğrulaması bundan ayrıdır.
5. Unreal otomasyon testleri aynı montaj ve Niagara sisteminin iki beceriye atanmasını sınar; CI ayrıca statik kod ve paketleme regresyonlarını çalıştırır.

## Doğrulama

Kaynak testleri (Unreal kurulumu gerektirmez):

```bash
python3 mobile/StarfortUnreal/Tools/test_native_mobile.py
python3 mobile/StarfortUnreal/Tools/test_premium_native_release.py
```

Native Unreal Editor otomasyon testi, Unreal Engine 5.8 ve C++ derlemesi gerektirir:

```bash
cd mobile/StarfortUnreal
UE_ROOT="/path/to/UE_5.8" python3 Tools/run_editor_qa.py
```

Paketleme kontrolü (uygulama üretmez):

```bash
cd mobile/StarfortUnreal
python3 Tools/native_mobile_build.py --platform android --profile release --dry-run
```

Beklenen mevcut sonuç **exit code 2** ve eksik orijinal sanat/harita/UMG listesi. Bunu yeşil yapabilmek için her karakterin orijinal, lisansça uygun ve Unreal'a gerçekten aktarılmış rig, zırh, silah, hareket, Niagara, ses ve mobil LOD dosyaları gerekir.

## Yayımlamayı engelleyen gerçek bağımlılıklar

- Dört önerilmiş Fab başlangıç paketinin Epic hesabında lisans kabulü ve Editor'a aktarımı; STARFORT'a özgü görünüm, silah ve zırhın ayrıca sanat üretimi (yedi karakter için).
- Gerçek Unreal Editor içerik raporu `Tools/editor_visual_preflight.py`; gerçek animasyonlar ile bütün 3D karakter/sahnelerin görsel incelemesi.
- Android ve iOS Shipping derlemesi, kod imzası, paket açılışı, 3D sahne oynanışı, ısınma/FPS/bellek değerlendirmesi ve gerçek oturum/ittifak/savaş akışının fiziksel cihaz kabul testi.

**Yasak:** Eksik varlığı geçmek için sahte model, eski 2D sprite veya elle `art_approved=true` yazmak. GitHub'a ayrı Fab/Epic kaynak assetlerini redistribüe etmek. Kullanıcı hesabı, hero ID, satın almalar ve sunucuda doğrulanan ekonomi bu değişikliklerde korunur.
