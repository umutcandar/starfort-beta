# STARFORT v80 — Mac / Unreal 5.8 ücretsiz Paragon özel test kurulumu

Bu paket **senin özel görsel testin** içindir. Yedi yüksek kaliteli, ücretsiz Epic/Fab Paragon SkeletalMesh'ini gerçek Unreal Editor sahnesinde sergiler. **Kamuya açık sürüm, hazır mobil APK, STARFORT'a ait özgün yedi kahraman veya gerçek çevrimiçi savaş olduğu anlamına gelmez.** Kendi hesabını değiştirmeden, kredi harcamadan, lisanslı modelleri internete yeniden yüklemeden kaliteyi görmeye yarar.

## Adım 1 — Epic hesabında ücretsiz paketleri projeye ekle

Aşağıdaki gerçek Epic Games Fab sayfalarında **Free** ve **Unreal Engine** formatı bulunur. Epic'e giriş yapıp ürünlerin lisanslarını okuyarak kabul et, **Add to My Library** ve ardından Unreal Editor 5.8'de **Window > Fab > My Library > Add to Project** yap. Epic/Fab bağlantısı ChatGPT ortamında yetkilendirilmediği için bu satın alma/lisans kabul ve gerçek yerel indirme işlemlerini kullanıcı kendisi yapar.

| STARFORT test kimliği | Fab kaynak modeli | Resmî ücretsiz adres | Beklenen Unreal dizini |
|---|---|---|---|
| Rovan | Wraith | https://www.fab.com/listings/17e0840f-8651-4933-bd6d-211a34b1dd17 | `/Game/ParagonWraith` |
| Aldren | Greystone | https://www.fab.com/listings/122fd7bf-6f12-4304-a930-cccbbacdaebc | `/Game/ParagonGreystone` |
| Lyra | The Fey | https://www.fab.com/listings/9afbcde6-4a14-4018-95c3-2f3a2e1da858 | `/Game/ParagonTheFey` |
| Mira | Serath | https://www.fab.com/listings/522b6160-15ab-492b-a2b0-c09f9bb5f6e6 | `/Game/ParagonSerath` |
| Doran | Khaimera | https://www.fab.com/listings/e7c665c1-8c13-42f0-9152-0753008853d7 | `/Game/ParagonKhaimera` |
| Vesper | Countess | https://www.fab.com/listings/0bf014eb-f2ed-4029-adda-81a855eb5220 | `/Game/ParagonCountess` |
| Eira | Aurora | https://www.fab.com/listings/918456eb-4c36-4346-9be2-8986e25c9a0b | `/Game/ParagonAurora` |

Bu kaynakların görünümleri, STARFORT'un özgün konseptiyle birebir aynı değildir: örneğin Wraith gerçek sarışın Rovan değil; Serath ay rahibesi görünümü, Khaimera da Doran'ın insan savaşçı tasarımı değil. İlk özel testte grafik, iskelet, animasyon ve sahne ölçeği incelenir; **son ürünün yeni yüz/zırh/silah çalışmaları halen gerekir.**

## Adım 2 — Mac'te projeyi aç

GitHub `main` dalını al ve `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını Unreal Engine 5.8 Editor'da aç. İstersen aynı dizindeki `STARFORT_PARAGON_ONIZLE_MAC.command` dosyasını aç: bu yardımcı proje dosyasını açar ve iki Editor komutunun yolunu gösterir, **Epic indirmelerini yapmaz**.

Mac'te Unreal derleyicileri/SDK'ları yüklenmediyse proje önce UE5.8'in C++ build adımına ihtiyaç duyacaktır. Dosyayı açmak derlemenin veya mobil paketin gerçekleştiği anlamına gelmez.

## Adım 3 — İki tıklama ile gerçek 3D galeri + savaş dizilişi

Unreal Editor menüsünde **Tools > Execute Python Script**:

1. `mobile/StarfortUnreal/Tools/STARFORT_7_KAHRAMAN_TARA.py` — yerel gerçek SkeletalMesh'leri ve mümkünse PBR materyal/iskeletlerini arar. Eksikleri `Saved/QA/fab_seven_private_scan_v80.json` raporuna yazar; gerçek modeli kendisi icat etmez.
2. En az **4 model** bulunduğunda `Saved/QA/fab_seven_private_selection_v80.json` dosyasında seçilen tam gövde SkeletalMesh yollarını kontrol et. **Fab'deki ilgili lisansları bizzat kabul ettiysen** `"user_confirmed_fab_license": true` yaz. Bu açık onay olmadan sahne oluşturulmaz.
3. `mobile/StarfortUnreal/Tools/STARFORT_7_KAHRAMAN_KUR.py` — gerçekten yüklü en az 4 farklı SkeletalMesh varsa iki yeni, ayrı **Unreal .umap** sahnesini oluşturur:
   - `/Game/Maps/L_StarfortPrivateFabPlaytest_v80`: yüklü 4–7 3D kahramanın yan yana incelenebileceği galeri.
   - `/Game/Maps/L_StarfortPrivateFabBattle_v80`: sunucu ekonomisine dokunmayan **3 dost vs 1 düşman** animasyon/pozisyon gösterimi. Mümkünse gerçek Paragon attack/cast AnimSequence'leri, bulunmazsa gerçek idle animasyonu oynar.
4. Haritayı Content Browser'dan aç, **Play in Editor** ile 3D karakterleri incele. Kamera otomatik açılmazsa `STFT_PRIVATE_CAMERA_BATTLE` aktörüne sağ tıklayıp **Pilot** seç. Gerçek animasyon klipleri ilgili paketler mevcutsa görünür.

**Orijinal STARFORT 3D arazi (isteğe bağlı):** Önceki turda üretilen ve SHA-256 ile doğrulanan `StarfortAshBattlefield_v79.glb` dosyasını `ContentPipeline/Incoming/Environment/Battle/` altına koyarsan önizleme aracı dosyanın hash'ini kontrol eder, gerçek Unreal StaticMesh olarak import eder ve iki özel test sahnesine yerleştirir. Dosya yoksa gerçek Paragon karakter sahnesi yine oluşturulur fakat özgün arazi olmadan gösterilir.

Kod ayrıca yerel veriler için `Saved/QA/fab_seven_private_preview_v80.json` raporu üretir. Bu dizin Git dışında kalır.

## Testin gerçek sınırları

- Bu, **görsel Editor önizlemesi ve animasyon testidir**, henüz telefona kurulabilir oynanış APK/IPA değildir.
- Görsel döngüler **gerçek karşılıklı savaş sonucu veya oyuncu hasarı üretmez**. Savaş dengesi, HP, item, ödül, satın alma ve ilerleme gerçek sunucu sisteminin dışında kalır.
- Mevcut canlı `L_StarfortBattle`, `L_StarfortVillage` vb. haritalar **üzerine yazılmaz**. Aynı private haritalar zaten varsa işlem yeniden yazmayı reddeder.
- Kamuya açık GitHub'da Fab/Paragon ham `.uasset` dosyaları tutulmaz; `Content/Paragon*/` ve `ContentPipeline/Incoming/` gitignore kuralları korunur.
- Renk, yüz ve zırh özgünleştirmesi, mobil LOD, güçlü gerçek efekt/ses sahneleri, UE Editor native compile ve fiziksel iOS/Android testleri yapılmadan **v80 kesinlikle çıkışa hazır diye etiketlenmez**.
- Epic/Fab model lisanslarını özellikle ürün sayfasında yeniden kontrol et. Fab ürünlerinin özel lisansı/yayıncısı ve izinleri farklı olabilir. Paragon ticari ismini oyunun reklamında veya isminde kullanma.

## Kaynak doğrulama (Unreal kurulu olmasa da)

```bash
python3 mobile/StarfortUnreal/Tools/fab_seven_private_preview_v80.py --contract
python3 mobile/StarfortUnreal/Tools/test_fab_seven_private_preview_v80.py
```

Bu testler model indirmez, `.uasset` üretmez ve gerçek Editor'ın kurulup çalıştığını doğrulamaz.
