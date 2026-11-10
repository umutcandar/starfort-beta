# STARFORT v88 — Gerçek 7 malzeme, güvenli günlük/haftalık ganimet, mobil Çanta

## Uygulanan kod / henüz dağıtılmamış kısım

Günlük ve haftalık yeni malzeme ödülleri için **canlı oyun hesabına doğrudan erişmeyen, ayrı SQL migration** hazırlandı: `starfort/sql/starfort-v256-original-crafting-materials.sql`. Bu SQL, mevcut `sfb_starfort_progress` savaş motoruna veya gerçek oyuncuların eski `inventory`, `res`, `item_upgrades`, `relic_ascensions` alanlarına müdahale ETMEZ. Sunucu şeması yayımlanana kadar aşağıdaki malzemelerin GERÇEK kazanımı kapalıdır; mobil istemci sahte envanter göstermez.

Hesap başına ayrı `starfort_crafting_material_wallet` içinde 7 tane **tamsayı** material sayacı ve `weapon|armor|relic` günlük hedef seçimi tutulur. `starfort_crafting_material_awards` ise doğrudan sunucu savaş sonucunun gün/hafta anahtarını kaydeder. Her oyuncunun hakkı birbirinden ayrıdır. `starfort_crafting_focus_requests` içinde yalnız hedef değiştirme isteğinin UUID'si ve yanıtı saklanır, aynı UUID yeniden gelirse geçmiş yanıt döner ve sonraki oyuncu tercihini geri almaz.

## Somut kazanım kuralları (sunucu güncellemesi kurulduktan sonra)

| Malzeme | Kesin kaynak | Limit |
|---|---|---|
| **Yıldız Kesiti** (`edge_sliver`) | O günün ilk 3 **gerçek hikâye zaferi**, hedef **Silah** ise | Her zafer 3; günde en çok **9** |
| **Hisar Perçini** (`ward_rivet`) | Aynı üç hikâye zaferi, hedef **Zırh** ise | Her zafer 3; günde en çok **9** |
| **Astral Lif** (`astral_fiber`) | Aynı üç hikâye zaferi, hedef **Tılsım** ise | Her zafer 3; günde en çok **9** |
| **Yıldız Camı** (`star_glass`) | Hikâye Bölüm **5–8**, en az değil **tam 3 yıldızlı** doğrulanmış galibiyet | Günde **1** |
| **Yörünge Çekirdeği** (`stellar_core`) | Mevcut **Yarık** haftalık seferinde zafer | Haftada **1** |
| **Muhafız Damgası** (`guardian_stamp`) | Dünya patronunda en az **300 gerçek katkı** kaydına bağlı o haftaki zafer | Haftada **1** |
| **Takımyıldız Levhası** (`constellation_chart`) | En az Bölüm **5**, **kademe 2+**, **3 yıldızlı** Usta Seferi zaferi | Haftada **1** |

Günlük/haftalık sınırlar **UTC tarihleri** ve ISO hafta numarasıyla belirlenir (takvim/gece yarısı kaynaklı sürprizleri UI'da açık göstermek gerekir). Günlük ilk üç zafer, toplam üç hakkı paylaşır; oyuncu ilkini Silah, ikincisini Zırh olarak seçerse kazanımlar seçili türe dağıtılır. Diğer kaynakların garantisi ayrı ayrı işler. **Her bir ilerleme garantili**: sandıktan rastgele %0,1 ihtimal yoktur. Gerçek savaş kaydı oluşmadan ödül dağıtılmaz. Savaş kaybı, terk, aynı sonuç tekrar/aynı HTTP isteği, normal hesap yenilemesi, eşya işlemi veya diğer oyuncunun zaferi ödül veremez. Haklar daha önce bitmiş hikâye bölümlerine geriye dönük verilmez.

**Önemli denge kararı:** v87'de labirent için yeni haftalık sözleşme TASARIMI vardı ama sunucuda o mod yoktu. Bu sürümde onun yerine, zaten canlı olan **haftalık Yarık** ödülünü kullandık. Levha için ittifak üyeliğine zorlamadık; gerçek tek oyunculu zor Usta Seferi yeterli. İttifakla eşdeğer haftalık görev ileride ilave edilebilir.

## Mevcut ekonomi güvenle korunuyor

İlk +5 ustalık: Nadir 6.600 Altın/600 Taş/440 Öz, Destansı 13.200/1.200/880, Efsanevi 19.800/1.800/1.320. +4 yıldız işleme için gereken **2/5/9/14 farklı hafta** ve mevcut altın/taş/öz maliyetleri **DEĞİŞMEDİ**. Yeni malzemeler şimdilik yalnızca güvenli oyuncu hesabına kazanılır; **v87'de tasarlanan ek 70/26/8/6/1 parça tüketimleri henüz canlı reçete değildir**. Oyuncular yeni kaynak biriktirebilir ancak bu aşamada yeni para/ücret, zorunlu malzeme veya otomatik efsanevi eşya kazanımı yok. 12 yeni silah/zırh/tılsım türü de **halen 3D tasarım sözleşmesi**, oynanabilir model veya server item'ı değildir.

## Gerçek mobil oyun içi kullanım

v88 C++ ile native `Çanta > Malzemeler` sekmesini ve `Yıldız Kesiti / Hisar Perçini / Astral Lif / Cam / Çekirdek / Damga / Levha` kartlarını ekler. Her kartta **özgün şekil tanımı**, gerçek dağıtım kaynağı ve ancak `sfb_crafting_materials` RPC'den doğrulanmış parça sayısı gösterilir. Kullanıcı Silah/Zırh/Tılsım hedefini seçtiğinde bu seçim gerçek sunucuya UUID ile kaydedilir; UI başarı olmadan hedefi yerelde değiştirilmiş gibi çizmez. Sunucu yanıtı gelmezse sadece Malzemeler durumu geçersiz olur: **mevcut 19 eşyalı kuşanma/çıkartma/demirhane ekranı çalışmaya devam eder**.

Normal oyuncu mobil hesap kimliği ile Supabase JWT kullanılır; servis rolü anahtarı veya gizli token oyuna girmez. Hesap değişimi/oturum kapanışında malzemeler sıfırlanır, önceki oyuncunun cüzdanı yeni oyuncuya gösterilmez.

## Güvenlik ve test

Migration üç ayrı şema tablosunu `ENABLE ROW LEVEL SECURITY` ile açar; `public/anon/authenticated` rollerine doğrudan SELECT/UPDATE/INSERT/DELETE hakkı verilmez. Ödüller yalnız **server-side AFTER UPDATE OF last_report** tetikleyicisinden doğar; burada `OLD.mission` mevcut, `NEW.mission` bitmiş, `NEW.last_report.won=true`, mod/bölüm doğrulaması ve benzersiz ödül kaydı istenir. Aynı oyuncuda gün/hafta hakkı cüzdan satır kilidiyle seri hâle getirilir. İstemci yalnızca `get` ve günlük hedef seçimi `focus` RPC'lerini çağırabilir; kendi malzeme adedini yollayamaz.

`.github/workflows/starfort-crafting-materials-qa.yml` gerçek ama **geçici PostgreSQL 16** üzerinde migration'ı çalıştırır; kaynak C++ testleri `Tools/test_original_crafting_materials_v88.py` komutuyla çalışır. Testler 3/3 günlük hak, 1/1 haftalık damga/çekirdek/levha, 3 yıldız şartı, yenilgi, tekrar gönderim, farklı hesap, UUID idempotency, RLS ve gerçek C++ malzeme tanımlarını kontrol eder.

**Sınır:** GitHub'ın Postgres ve C++ kaynak QA'sı, Unreal Engine 5.8 editor derlemesi, gerçek 3D model importu veya iPhone/Android gameplay testi değildir. Bu çalışma 3D malzeme mesh'i üretmedi; v87 özgün model ve ikon sanat şartnameleri saklanıyor.

### Dağıtım sırası

1. Ana dala PR incelemesi + kaynak QA + geçici Postgres 16 testleri;
2. Yetkili Supabase üzerinden **tek migration**, yeni tablo/trigger/RPC salt-okunur varlık kontrolü; herhangi bir oyuncu malzemesi elle artırılmayacak;
3. Kullanıcı MacBook'a Unreal 5.8 yükleyince gerçek native UMG Çanta'yı açarak test;
4. Sonraki paket: kazanılmış parçaların ayrı güvenli reçetelerde **harcanması** ve özgün 12 eşyanın sunucuya katılması; bu adım eski +5 ve +4 kayıtlarına geriye dönük bedel çıkarmaz.

### Referans

`mobile/StarfortUnreal/ContentPipeline/equipment_future_v87.json` özgün 3D siluetler ve önerilen gelecekteki tüketim miktarlarıdır; onları çalışan `.uasset` veya uygulanmış server ödülü gibi yorumlama.
