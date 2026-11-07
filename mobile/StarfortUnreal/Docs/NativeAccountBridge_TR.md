# STARFORT — gerçek mobil hesap, köy ve kalite kapısı

Bu paket **Unreal Engine 5.8 iOS/Android** projesi içindir. Bir web sitesi, WebView veya web sunucusunun mobil kabı değildir.

## Eklenen gerçek bağlantı

Eski web arayüzündeki `starfort/online-config.js`, `starfort/account-auth.js`, `starfort/village-authority.js` ve `starfort/account-progression.js` üzerinden mevcut sunucu sözleşmesini doğruladık.

- Tek kullanıcı kaynağı: **mevcut Supabase Auth hesabı**. Aynı `https://ftbbzqzgafmallrfimnt.supabase.co` projesi ve yalnızca publishable/anon anahtar kullanılır. Service-role/secret anahtarları mobil uygulamaya konmaz.
- `UStarfortOnlineSubsystem` oyun oturumu boyunca çalışan yerel UE `UGameInstanceSubsystem`'dir. Giriş `/auth/v1/token?grant_type=password`, ayrıca kimlik doğrulama `/auth/v1/user` ile yapılır. Süre dolduğunda refresh-token uç noktası kullanılır. API yanıtları, account ID ve şema doğrulanır; istemci ekonomik değerleri üretmez.
- Tokenlar **yalnız RAM'de** kalır. Başka kullanıcıyla giriş ve çıkış sonrasında eski HTTP cevapları session-generation kontrolüyle reddedilir. **Henüz** iOS Keychain / Android Keystore tabanlı güvenli kalıcı giriş ve Apple/Google native OAuth yok; bu yüzden uygulamayı kapattıktan sonra tekrar giriş gerekir.
- Köy okuma `POST /rest/v1/rpc/sfb_village_api` gövdesi `{p_action:'get',p_building:null,p_request_id:null,p_room_id:null}` ile yapılır; sunucunun `res.gold/wood/stone/aether`, yedi bina seviyesi, `revision`, `ok:true`, `source:'server'` alanları doğrulanır. Yalnız ondan sonra `ApplyVerifiedVillage` çağrılır.
- Bina yükseltme `p_action:'upgrade'`, doğrulanmış bina ID'si ve idempotency UUID ile aynı RPC'ye gönderilir. Ağda sonucun bilinmediği bir yükseltme **otomatik tekrar gönderilmez**. Yalnızca zararsız bir **GET** ile gerçek sunucu durumu tekrar okunur; kullanıcı yeni bir işlem yapmadan başka yükseltme yapılmaz. Bu altyapı fiyat/cooldown kararını telefonda vermez.
- Kahraman listesi `POST /rest/v1/rpc/sfb_starfort_progress` `p_action:'get'` ile alınır; yalnız gerçekten dönmüş 7 temel kahraman, seviyeleri, 3 kişilik takım ve mevcut mission HP/turn gibi alanlar okunur. RPC'nin vermediği saldırı/savunma/eşya gücü uydurulmaz; bu temel hesap özeti henüz tam kahraman kartına bağlanmadı.
- `UStarfortLoginScreen` gerçek UMG `InputEmail`, `InputPassword`, `BtnSignIn`, `TxtAuthStatus` widget isimlerini bekler, parola kutusunu temizler. Görsel Blueprint `WBP_StarfortLogin` **henüz editor içinde oluşturulmadı**.
- `AStarfortVillageController` oturum yoksa login ekranı, varsa gerçek köy GET isteği başlatır; doğrulanmış sunucu güncellemelerini mevcut yerel köy UMG ekranına aktarır. Bina geliştirme butonu aynı sunucu RPC'ye gider.
- Kahraman, savaş, ittifak butonları `UStarfortSceneRouter` üzerinden yalnız **gerçekten paketlenmiş Unreal .umap** haritalarına yönlenebilir. Haritalar yoksa başarısız durum açıkça gösterilir; sahte 2D/WebView fallback açılmaz.

## Görsel kalite ve 3D teslim kontrolü

`ContentPipeline/required_premium_assets.json` içinde **12 ayrı gerçek 3D varlık** zorunlu: Royal Gunner iskeletli kahraman, enerji topu, 2 düşman sınıfı, karargâh, kapı, surlar, kışla, çiftlik, demirhane, rasathane ve savaş alanı. Her varlık için lisans, PBR dokuları, 3+ mobil LOD ve estetik onay tutulur. Iskeletli savaşçı için animasyonlar zorunludur.

```bash
python3 Tools/validate_premium_art.py --schema-only  # sözleşme biçimi; yayına hazır anlamına gelmez
python3 Tools/validate_premium_art.py --release      # eksik varlık/cihaz testi varsa KESİN başarısız
python3 Tools/check_glb_quality.py RoyalGunner_Rigged.glb
python3 Tools/test_native_mobile.py
```

## Tamamlanması gereken iş

1. Unreal Editor 5.8 ile projeyi C++ olarak derleyip hataları düzelt.
2. Gerçek Unreal `WBP_StarfortLogin`, `WBP_VillageHUD`, `WBP_HeroScreen`, `WBP_BattleHUD` ve `L_StarfortVillage`, `L_RoyalGunnerStudio`, `L_StarfortBattle`, `L_StarfortAlliance` varlıklarını oluşturup GameMode/Controller Blueprint'lerine bağla.
3. Yüksek kaliteli Royal Gunner ve diğer varlıkları ticari kullanıma uygun lisansla üret; Unreal skeletal mesh, retarget, Niagara ve güvenli mobil cihaz LOD optimizasyonu yap. Bir konsept resmi gerçek 3D mesh olarak **gösterme**.
4. API hata, yenileme, ağ kopması ve oyuncu değiştirme akışlarını Android/iOS fiziksel cihazda doğrula. Mobil OAuth / güvenli token saklama / yetki sınırları için ayrı güvenlik incelemesi yap.
5. Gerçek savaş RPC komutlarını (`mission_start`, `mission_turn`) yeni native battle controller'a bağla; doğrulanmış olmayan hasar, yıldız veya ödül gösterme.
6. `--release` kalite kapısı ve gerçek telefon FPS testleri geçmeden APK/IPA'yı üretime hazır ilan etme.

**Durum:** Bu dalda C++ kaynak implementasyonu ve kaynak/manifest testleri var. Unreal Editor derlemesi, 3D asset ve cihaz QA yapıldığı iddia edilmiyor.
