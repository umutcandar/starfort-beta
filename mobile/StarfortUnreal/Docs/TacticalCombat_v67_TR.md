# STARFORT Mobil — Taktik Savaş Arayüzü v67

**Mobil hedef:** Unreal Engine 5.8, iOS ve Android, yatay ekran. Bu değişiklikler web oyununu yeniden oluşturmuyor; var olan **sunucu tarafından hesaplanan savaş kurallarını** yerel Unreal C++/UMG ekranına aktarıyor.

## Sorun
Önceki native savaş ekranında "saldır, savun, aldat, toparla" ve **tek bir kahraman yeteneği** vardı. Sunucu ise v2.55'te zaten üç dalga, düşmanın hazırlanan hamlesi, takımın üç kahramanının ayrı yetenekleri ve cooldown mekaniklerini tutuyor. Kullanıcıya görünmedikleri için tuşların farkı anlaşılamıyordu.

## Bu pakette gerçek C++ kodu

- `UStarfortOnlineSubsystem::ParseProgress`: Sunucunun `mission.wave`, `waves`, `waveTurn`, `enemyIntent`, `lastAction`, `lastRallyTurn` ve `cooldowns` alanlarını sınırları ve veri türleriyle doğrular. Eski tek-dalga kayıtlar bu alanları içermese de açılabilir. Başka takım üyesine ait cooldown veya imkânsız dalga sayıları reddedilir.
- `FStarfortVerifiedBattleTurn`: Sunucudan gelen üçlü kahraman takımı, cooldownlar, beklenen düşman hamlesi, dalga numarası ve son eylem. **Hasar, karakter güçleri veya yıldızlar istemcide hesaplanmaz.**
- `UStarfortBattleScreen`: Üç kahraman için ayrı buton ve `skill:heroId` kimliği; `turn+1` ile yetenek yenilenme denetimi; dört tur beklemeli `rally`; sunucu tarihine göre üç saniyelik yalnızca UX amaçlı bekleme; eski veya tekrarlı savaş turunun reddi. Saldırı ve savunma kararları gerçek düşman niyetine göre ipuçları gösterir.
- `FStarfortNativeWidgetFactory`: Yerel UMG mobil QA ekranında "DALGA", "DÜŞMAN NİYETİ", 3 ayrı kahraman yeteneği ve bekleme durumu. Blueprint gerçek sanat ekranı geldiğinde bu geçici arayüzün yerini alır.
- `AStarfortBattleStage`: "strike", "guard", "feint", "rally" ve `skill:hero` için **ayrı animation montage yuvaları**. Yalnızca onaylanmış yeni sunucu turu üzerinde gerçek 3D karakter rigine bağlanabilir. Bilinmeyen eylem için saldırı animasyonu uydurmaz. Eşya, animasyon ve Niagara efektinin **gerçek içerik dosyaları henüz mevcut değil**.

## Oyuncu açısından oynanış farkı

| Sunucu düşman niyeti | Native ekranda gösterilen ipucu |
| --- | --- |
| `crush` | Ezici darbe → Savunma önerilir |
| `shield` | Kalkan → Aldatma veya yetenek önerilir |
| `sunder` | Zırh kırma → Aldatma önerilir |
| `eclipse` | Tutulma → Savunma güvenli seçenek |
| `drain` | Enerji emme → Canı korumaya odaklan |
| `strike` | Normal saldırı → Oyuncunun taktik seçimi |

Bu öneriler otomatik savaş kararı değil, açıklayıcı ipuçlarıdır. Sonuçları Supabase SQL `starfort/sql/starfort-v255-first-minute-combat.sql` hesaplar. Sunucu 3 saniyelik hamle aralığını ve cooldownları hâlâ tek başına doğrular. Telefon saatinin yanlış olması güvenilir hasar yaratmaz.

## Gerçek mobil ön izleme için gerekli

1. Unreal Editor 5.8 C++ compile, authored `L_StarfortBattle.umap`, `WBP_BattleHUD` ve native battle GameMode bağlantısı.
2. Güzel yüzlü/skinned 3D kahramanlar; her biri için idle/walk/aim/fire/guard/feint/rally/special/hit/death animasyonları.
3. Mobile GPU için materyal/LOD optimizasyonu, ışıklar, saldırı ve isabet efektleri, UI safe area, ses ve titreşim.
4. iOS/Android fiziksel cihaz ve gerçek Supabase hesabıyla 3 dalga, 3 skill, cooldown, ağ kaybı/yenileme, sonuç ve ödül uçtan uca testi.

**Dürüst durum:** Bu pakette native mantık ve UMG/C++ arayüz kaynakları geliştirildi. Unreal Editor ile derleme veya gerçek telefon üzerinde oynanabilir AAA savaş gösterimi yapılmadı. CI kaynak testi geçmesi, gerçek cihaz performansına eşdeğer değildir.
