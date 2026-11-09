# STARFORT v86 — Görsel referanstaki Çanta ve Donanım ekranının GERÇEK mobil UMG uygulaması

## Bu bir resim değil, oyun ekranı

Kullanıcının gönderdiği 16:9 STARFORT konsepti referans alınarak `mobile/StarfortUnreal/Source/StarfortUnreal/` içine **C++ ile çalışan gerçek Unreal UMG ekranı** eklendi. HTML/CSS/WebView, düzleştirilmiş ekran görüntüsü veya tıklanmayan dekoratif panel kullanılmıyor. Gerçek bileşenler: `UStarfortBagScreen`, `UStarfortBagTile`, `FStarfortBagCatalog`, `UStarfortOnlineSubsystem`, `AStarfortMobilePlayerController`.

**Yerleşim:** Üstte STARFORT ve gerçek sunucu Altın/Kereste/Taş/Yıldız Özü, solda yedi kahraman arasından **yalnızca açılmış olanların** seçimi, ortada kahraman için gerçek Unreal Texture2D varlık yeri ve **sunucuya ait** seviye/kuşanılan eşya bonusları, sağ ortada **Silah/Zırh/Tılsım** yuvaları, altındaki kaydırılabilir gerçek katalog (19 eşya türü) ve kategori filtreleri, en sağda seçili eşyanın nadirlik/stats/set bilgisi ve **Kuşan/Çıkar/Üret/Geliştir** butonları. Altta gerçek Köy/Seferler/Kahramanlar/Çanta/İttifak gezinme komutları; mağaza sunucu entegrasyonu olmayan bir eylem olarak dürüstçe devre dışı. Çanta açıkken canlı gerçek oyuncu haritası (Level) değiştirilmez.

Ekran **tıklanabilir**: her eşya/filtre/hero/yuvanın UMG event'i var. Filtre eşya türünü, kahraman gerçek sahip olunan karakteri, seçili item sağ detayları değiştirir; gerçek 3D veya 2D sanat dosyası kurulmadıysa görüntü **sahte varlık/uydurulmuş eşyalarla** doldurulmaz.

## Gerçek hesap: hazır Supabase RPC zaten var

`sfb_starfort_progress` mevcut server fonksiyonu şu alanları döndürür: `heroes`, `inventory`, `loadouts`, `itemUpgrades`, `res`, `buildings`. Erişilebilir Supabase projesinde şema/işlemler **salt okunur sorguyla** kontrol edildi; `equip`, `unequip`, `forge`, `enhance` server eylemleri var. Bu teslimat için **hiçbir kullanıcı hesabı değiştirilmedi**.

Eski Unreal istemcisi bu mevcut verileri atmaktaydı. v86 artık `ParseProgress` sırasında eşyaları ve yuvayı **güvenilir kopya adetleriyle** doğrular; bir eşyanın sahibi dışında başka iki kahramanda aynı tek kopya kuşanılırsa sunucu yanıtını reddeder. Dört ayrı gerçek RPC butonu:

- **Kuşan** → `p_action=equip`, `p_target=gerçek kahraman ID`, `p_aux=eşya ID`.
- **Çıkar** → `p_action=unequip`, `p_target=gerçek kahraman ID`, `p_aux=weapon|armor|relic`.
- **Üret** → `p_action=forge`, `p_target=eşya ID`; demirhane seviyesi, kaynak bedeli, savaşa girilmiş olması ve maksimum stok **sunucuda** denetlenir.
- **Geliştir** → `p_action=enhance`, `p_target=eşya ID`; oyun kaydı ve +5 ustalık limiti **sunucuda** denetlenir.

**Kritik:** Butona dokununca istatistikler, kaynaklar, sahiplik ve ekipman **yerel olarak değişmez**. Yalnızca `OnProgressReady` ile gelen doğrulanmış sunucu yanıtından sonra yenilenir. İşlem sürerken tekrar basılamaz; hata halinde güvenli durum gösterilir ve gerçek sunucu kaydı yeniden okunur. Giriş yapılmadığında, görev sürerken veya envanter projeksiyonu yokken ekonomik eylemler devre dışıdır. Örnek görseldeki 284.700 altın, 47.960 güç, +14 kılıç vb. sayılar **oyuncunun gerçek verisi gibi gösterilmez**.

Görseldeki istenen `Yıldızkıran Kılıç`, `Küllerin Zırhı`, `Koruyucu Mühür` mevcut sistemde zaten gerçek ürün ID'leridir (`starbreaker`, `ashes_plate`, `guardian_seal`). Bunları uydurup hesaba vermek yerine sunucudan sahip olunan kopyalarla gösteririz.

## Nasıl açılır?

Geliştirme kodu Unreal 5.8'de derlendikten sonra:
1. Hesapla giriş yap → Köy menüsünden **ÇANTA** → Çanta ve Donanım.
2. Ya da Kahramanlar ekranından **ÇANTA VE DONANIM**.
3. Soldan gerçek açılmış kahramanı seç, alt eşyaları **Tümü/Silah/Zırh/Tılsım/Set/Sahip** ile filtrele. Bir item'e dokununca sağda gerçek özellikler görünür; sahip olunan, boşta duran item'e **Kuşan** diyerek sunucudan güncellenmesini bekle.
4. Sağdaki **Çıkar** ve **Üret/Geliştir** eylemleri de sunucu işlemleridir. Görev sırasında kapalıdır.
5. Alttaki **Kahramanlar, Köy, Seferler, İttifak** gerçekten sahne geçişi ister. Kapalı mağaza butonu çalışıyormuş gibi görünmez.

İlk normal C++ screen, ekran tasarımına yakın bir **lacivert/altın 4 panel temeli** oluşturur. Eklenen 2D kahraman sanatı `/Game/UI/HeroCinematicV1/T_<Hero>_Splash` import edilirse ortada görüntülenir; bu, gerçek SkeletalMesh olmadığından 3D etiketi kullanılmaz. Verilen referanstaki tam fotogerçekçi zırh, eşya ikonları, bezeme çerçeveler, kale görseli ve animasyonlar **ayrı UE sanat varlıkları olarak henüz import edilmedi**. Bu nedenle bitmiş ekranın görsel olarak **piksel piksel birebir** olduğunu iddia etmiyoruz.

**Son gerçek aşama:** Kullanıcı M1 MacBook'a Unreal Engine 5.8'i kurunca bu kaynak UE Editor'da derlenecek, görsel UI sprite/atlasları import edilecek, gerçek 3D hero aktörleri varsa UI karakter sahnesine bağlanacak ve gerçek iOS/Android yatay çözünürlük/çentik/dokunma kontrolünden geçirilecek. Şu an GitHub kaynak kodu, gerçek C++ Unreal derlemesi veya kurulabilir IPA/APK demek değildir.

## Geliştirici testi

```bash
python3 mobile/StarfortUnreal/Tools/test_native_bag_equipment_v86.py
```

C++ katalog testi, 19 gerçek item ID'sinin mevcut oyun kataloğuyla uyuştuğunu karşılaştırır; sınırlı bir C++ stub ile gerçek `StarfortBagCatalog.cpp` derlenir, 4 gerçek RPC'nin ve iki native navigasyon girişinin kodu kontrol edilir. **Unreal Engine çalıştırılarak GUI testi yapıldı anlamına gelmez.**
