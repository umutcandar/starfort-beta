# STARFORT v81 — Etkileşimli gerçek Fab kahraman testi (UE5.8 / Mac)

**Hedef:** Yedi ücretsiz Epic/Fab Paragon SkeletalMesh temelini, gerçek Unreal Engine editörü içinde kalite kontrol için görüp tıklayarak inceleyebilmek. Bu, STARFORT hesaplı savaşının yerine geçen bir demo ya da App Store'a çıkacak mobil uygulama **değildir**.

## Gerçekten yapılan v81 geliştirmesi

- Native C++ `AStarfortFabPreviewController` yalnızca `L_StarfortPrivateFabPlaytest_v80` veya `L_StarfortPrivateFabBattle_v80` haritasında çalışır.
- `AStarfortFabPreviewHUD` ekranın üst kısmına yedi **orijinal STARFORT kahraman ID** butonu, alt kısmına interaktif kamera/animasyon kontrolleri çizer.
- `AStarfortFabPreviewGameMode` yalnızca ayrı özel test haritasına bağlanır: SpectatorPawn, bu kontrolcü ve HUD. **Online subsystem, RPC, gerçek HP veya ödül çağrısı yok**.
- Model aktörlerinin gerçek `SkeletalMesh` ve uyumlu `AnimSequence` referansları editörde `Actor.Tags` olarak saklanır. Görüntü, portre/sprite/mannequin fallback'i kullanmaz.
- SPACE / SALDIR butonu sadece gerçek animasyon kaydı varsa oynatır. Paket yalnızca Idle barındırıyorsa saldırı simüle edilmez ve ekranda uyarı çıkar.
- Kamera, sahnede seçilen modelin çevresinde düzgün geçişli döner; orijinal PBR arena dosyası v80'de olduğu gibi isteğe bağlıdır.

## Kurulum

1. Epic Games/Fab sayfalarından yedi ücretsiz karakteri **kendi lisanslarını okuyup onaylayarak** kütüphaneye ekle. Unreal 5.8 Editor'da `Fab > My Library > Add to Project` üzerinden **STARFORT projesinin içine** aktar. Referans modelleri GitHub'a yükleme. Resmî bağlantılar: `Docs/PrivateParagonSevenHeroPlaytest_v80_TR.md`.
2. Mac'te `mobile/StarfortUnreal/StarfortUnreal.uproject` dosyasını Unreal Engine 5.8 ile aç. **C++ kaynaklarını derle:** v81'de üç yeni Unreal sınıfı var; C++ derlenmediyse harita kurulumu hata verip durur.
3. Editor `Tools > Execute Python Script`: `mobile/StarfortUnreal/Tools/STARFORT_7_KAHRAMAN_TARA.py`. `Saved/QA/fab_seven_private_scan_v80.json` raporunu kontrol et.
4. Gerçek Fab lisanslarını kabul ettiysen, `Saved/QA/fab_seven_private_selection_v80.json` içindeki `user_confirmed_fab_license` alanını `true` yap; önerilen meshlerin gerçekten tam gövde olduğunu doğrula. En az dört farklı kaynak skeletli model şart.
5. `Tools > Execute Python Script`: `mobile/StarfortUnreal/Tools/STARFORT_7_KAHRAMAN_KUR.py`. Model/animasyonlar gerçek ise iki yeni `.umap` harita, özel GameMode, kamera, ışık ve aktör etiketleri kaydedilir.
6. Content Browser'da `/Game/Maps/L_StarfortPrivateFabPlaytest_v80` haritasını açıp **Play in Editor** başlat; komut ekranı gelir. Battle için `/Game/Maps/L_StarfortPrivateFabBattle_v80` haritasına geç veya TAB kullan.

`v80` haritasını zaten oluşturduysan mevcut harita **üzerine yazılmaz**; özel haritalar mevcutsa hata vererek durur. Eski haritanı yedekleyip bizzat kaldırma/yeniden adlandırma işlemini yaptıktan sonra v81 tarama-kurulumunu tekrar başlatabilir veya mevcut haritayı tasarımcı olarak düzenleyebilirsin.

## Mac klavye / tıklama kontrolleri

| Kontrol | Eylem |
|---|---|
| `1`–`7` veya üstteki kahraman adı | Rovan, Aldren, Lyra, Mira, Doran, Vesper, Eira arasında geç |
| `SPACE` / `SALDIR` | Gerçek compatible Attack/Cast varsa oynat; tekrar basınca varsa gerçek Idle klibine dön |
| `A` ve `D` | Kamera sol/sağ 18 derece döner |
| `W` ve `S` | Kamera zoom: 380–2200 Unreal cm aralığı |
| `TAB` / `SAHNE` | 7 kahraman galerisi ↔ 3'e 1 özel savaş dizilişi |

Tek bir kahramanın gerçek Attack klibi yoksa onu **varmış gibi göstermez**. Galerie ve savaş sahnelerinde kullanılan görseller **Paragon kaynak görünümü** olarak kalır; örneğin sarışın, altın zırhlı Rovan henüz üretilmiş değildir.

## Kalite ve güvenlik

Bu etkileşimli haritalar normal `native_mobile_build.py` harita paketleme listesine eklenmez. Oyun ekonomisi, görev ve Supabase hesapları değişmez. Kaç kahramanın gerçekten import edilebildiği, görseller ve oynatılan animasyonlar sadece kullanıcının lisanslı Fab dosyaları yerel Unreal Editor'a yüklüyse doğrulanabilir. **Bu kod GitHub'da kaynak testlerinden geçti diye UE5.8 C++ derlemesi veya gerçek Mac/iPhone çalışma testi yapıldı anlamına gelmez.**

Kaynak testi:

```bash
python3 mobile/StarfortUnreal/Tools/test_fab_seven_private_preview_v80.py
python3 mobile/StarfortUnreal/Tools/test_fab_interactive_preview_v81.py
```
