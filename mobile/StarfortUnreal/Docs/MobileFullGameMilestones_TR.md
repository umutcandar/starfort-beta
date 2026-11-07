# STARFORT — tam mobil oyuna geçiş kabul planı

Bu belge, tüm sistemleri eksiksiz geliştirme hedefini parçalara ayıran **gerçek teslim kriterleri** içerir. Amaç iOS ve Android'e özel Unreal Engine 5.8 yatay oyun; web istemcisi yeni uygulamanın içinde bulunmaz. Var olan Supabase oyuncu hesapları, ilerlemeler ve ekonomisi korunur.

## Bu pakette kodlanan bölüm (native C++)

1. **Hikâye seferleri:** 1–8 aşamalı sunucu onaylı bölüm başlatma (`mission_start`), savaştan çıkma (`mission_abandon`), izin verilen hamleleri gönderme (`mission_turn`).
2. **Savaş kontrolü:** `AStarfortBattleGameMode`, `AStarfortBattleController`, `UStarfortBattleScreen`, `AStarfortBattleStage` ile yerel sahneye bağlanan gerçek isteği sunucuya gönderme; yanıt doğrulanmadan HP veya ödül değiştirmeme.
3. **Yıldız sistemi:** Sunucudaki `cleared` ve `campaignStars` alanlarını kontrol edip 8 bölümün 1–3 yıldızını gösteren `UStarfortCampaignScreen` veri/etkileşim altyapısı.
4. **Kahraman eğitimi:** Gerçek Rovan seviyesi ve `hero` RPC; sunucunun vermediği saldırı/defans/eşya gücü değerlerini ekranda uydurmama.
5. **Güvenli tekrarlama:** İşlem başına UUID, tek uçan mutasyon, önceki/giden yanlış turdan hasar uydurmama, başarısız isteği yeni kimlikle tekrar göndermek yerine `get` ile sunucu durumunu doğrulama.
6. **Hesap uyumu:** Aynı mevcut Supabase Auth/Village/Progress hesapları; misafir ve yerel ödül modu yok.

## Eksiksiz oyun için zorunlu kalanlar (henüz yapılmadı)

| Sistem | Çıkış kriteri |
| --- | --- |
| Görsel sahneler | Unreal Editor içinde gerçek `.umap` köy, kahraman salonu, savaş, ittifak; kamera ve UMG widget Blueprint'leri hazırlanmış |
| Kahramanlar | Royal Gunner dahil tüm kahramanların yüksek kaliteli lisanslı dokulu 3D skinned modelleri, rig, PBR materyaller, animasyon, kaliteli yüzler |
| Savaş oynanışı | Nişan alma, hareket, yapay zekâ, savaş formasyonu, özel yetenekler, hasar, vuruş geri bildirimi, boss safhaları, 1–3 yıldız ve ödül ekranı gerçek cihazda test edilmiş |
| Köy ve kale | 3D yapılar, yükseltme görselleri, bina dokuları, kaynak ve inşaat zamanlayıcısı, gerçek sunucu sunumu |
| Envanter | Ekipman yuvaları, çanta, eşya düşürme, güçlendirme, sunucu takas/ekonomi tutarlılığı, iki cihaz eşitleme |
| Sosyal/ittifak | İttifak oluşturma/katılma/ayrılma, chat, ortak savaş, erişim yetkileri, çevrim içi oyuncu yaşam döngüsü |
| Sefer ve uzun oyun | 8'den sonrası, tekrar oynanabilir görevler, zamanlanmış etkinlikler, haftalık boss, sezon puanı, ödül dengeleme |
| Mağaza | iOS StoreKit ve Android Play Billing; sunucuda doğrulanan satın alma, iade, abonelik ve çocuk güvenliği düzenleri |
| Küresel çıkış | 14+ dilin tüm mobil menülerde ve ses/metinde kontrolü; yerelleştirilmiş yasal metinler, bölgesel fiyatlar |
| Güvenlik | iOS Keychain/Android Keystore, yenilenebilir giriş, Apple/Google native OAuth, token yenileme, cihaz ve oturum değişimi testleri |
| Ses ve erişilebilirlik | Hareket/saldırı SFX, VO, müzik lisansları, altyazı, titreşim, ekran okuyucu, efekt azaltma ayarları |
| Performans | iPhone ve Android düşük/orta/yüksek modellerde gerçek 30/60fps, GPU bellek, pil, ısınma, internet kopması testleri |
| Yayın | Unreal 5.8 C++ derlemesi, imzalı IPA/APK/AAB, TestFlight/Play kapalı test, crash raporu, uygulama mağazası onayları |

### Kesin kalite kuralı
Tasarım görseli çalışan 3D model diye sunulmaz. Sadece statik kaynak testleri geçen proje mobilde oynanabilir diye ilan edilmez. `Tools/validate_premium_art.py --release` öncesinde gerçek lisanslı varlıklar, mobil LOD ve fiziksel cihaz ölçümleri gerekir. Bu geçiş tamamlanana kadar eski web oyuncu verileri silinmez.

### Gerçek oyun içi veri sözleşmesi
`starfort/account-progression.js` ve `starfort/sql/starfort-v225-account-progression.sql` mevcut sunucu sözleşmelerinin referanslarıdır. Mobil istekler yalnız `p_action`, `p_target`, `p_aux`, `p_request_id` gönderir; hasar, HP, ekipman veya para istemciden gönderilmez. Sunucu reddederse kullanıcıya doğrulama/hata gösterilir.

**Şu anki durum:** Native kaynak kodu ilerliyor; Unreal Editor derlemesi, dokulu modeller, gerçek `.uasset` ekranlar ve telefon testi tamamlanmadı.
