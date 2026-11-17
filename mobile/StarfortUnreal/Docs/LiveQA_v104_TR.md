# STARFORT v104 — Unreal Live QA + atmosfer / materyal iş akışı

Bu paket, önceki defalarca **Unreal kapat / git pull / C++ derle /
Play / ekran görüntüsü gönder** döngüsünü azaltmak için hazırlanmıştır.
UE 5.8'in **resmî Python Remote Execution** özelliğini ve Editor
screenshot API'sini kullanır. **Uzak Mac masaüstü kontrolü değildir.**

## Bir defalık ayar
1. Unreal Editor açıkken **Düzenle → Proje Ayarları → Eklentiler →
   Python → Enable Remote Execution** seçeneğini etkinleştir.
2. Multicast time-to-live **0** (yalnız yerel makine) kalsın; dış
   ağlara açılmasını istemiyoruz. Mac'in güvenlik duvarı/çoklu
   interface yapısı nedeniyle Editor keşfedilemeyebilir.
3. Giriş ekranından **Play'i durdur**; L_StarfortLogin haritası açık kalsın.

## Tek komutla premium sahne + teknik fotoğraf
\`\`\`bash
cd ~/Downloads/starfort-beta
git pull --ff-only origin feat/native-v91-verified-combat-gear
python3 mobile/StarfortUnreal/Tools/mac_live_qa_v104.py premium --ue-root "/Users/macbook/Documents/UE_5.8"
\`\`\`

**Bu komut Editor'ı kapatmaz ve C++ derlemez.** Yerel aktif Editor
sahnesine; mevcut içe aktarılmış VertexColor materyali değiştirmeden
ayrı bir M_StarfortCinematicStone_v104 materyali oluşturur. Materyalde
bir miktar renksel yükseltme, çok az yansıma/bounce etkisi ve yüksek
roughness bulunur. SkyAtmosphere/SkyLight aktörleri yalnızca yoksa
oluşturulur. Bu, birinci kalite ışık/renk düzeltmesidir; yeni bir
fotogerçekçi kale, rigli karakter ya da oyun mekaniği değildir.

Güncel sahne yedeği Saved/QA/Backups içerisine saklanır. Snapshot:
- Saved/QA/starfort_editor_scene.png
- Saved/QA/starfort_editor_scene.json

Resim, yalnızca **Play durdurulmuşken Editor'ın 3D viewport'undan**
alınır. E-posta/şifre giriş ekranını, masaüstü ve özel dosyaları
kaydetmek amacıyla tasarlanmamıştır. Screenshot API'nin gerçek Mac
Editor davranışı henüz doğrulanmamıştır.

## Benim görüntüyü Github'dan görebilmem — kullanıcı izniyle
Varsayılan olarak **ağa fotoğraf gönderilmez**.

Görüntü, özel QA dalına değil, **kamuya açık GitHub deposundaki**
\`qa/starfort-editor-preview\` dalına gönderilir. Kullanıcı bunun
herkes tarafından okunabildiğini anlamalıdır. UI/PIE görüntüleri
bilinçli olarak yasaklanmıştır.

Unreal Editor'da L_StarfortLogin haritası açık ve Play durdurulmuşken:
\`\`\`bash
python3 mobile/StarfortUnreal/Tools/mac_live_qa_v104.py capture --public-preview
\`\`\`

Bundan sonra ChatGPT, GitHub bağlantısından
\`QA/editor-preview/latest.png\` ve \`latest.json\` dosyalarını
açıp görebilir. Her değişim için tekrar ekran görüntüsü eklemene gerek
kalmaz. Gözlem tek seferlikse \`capture\`, Terminal açık kaldığı
sürece yenileme istiyorsan:
\`\`\`bash
python3 mobile/StarfortUnreal/Tools/mac_live_qa_v104.py watch --public-preview --interval 180
\`\`\`

**Not:** Bu Terminal kapatıldığında yerel izleme durur. ChatGPT
konuşma dışında kendiliğinden çalışıp görüntüyü göremez. Görseller
kamuya açık olduğu için giriş ekranı, özel belgeler ve hesap bilgileri
yayınlanmaz. İzlemekten vazgeçmek için Ctrl+C. GitHub push işlemi
için mevcut Git yetkilerin gerekir. Ayrı QA worktree Saved/QA altına
kurulur; geliştirme dalına ekran görüntüsü commit edilmez.

## Sorun çözümü
- No STARFORT editor: Unreal'da Python Remote Execution ayarı kapalı
  veya engine komut dosyası farklı yerde.
- Kayıt hatası: önce haritayı normal Editor'da kaydet; paket bunu
  ayrıca dener.
- Material compilation failure: log Save/QA'ya basılır; eski
  materyaller ve harita yedeği tutulur.
- Fotoğraf gelmiyor: Unreal Editor Output Log ve screenshot API; bunu
  gerçek Mac üzerinde test etmek gerekir.

Bu ürün, yetkisiz uzaktan ekran okuma veya sınırsız komut çalıştırma
servisi değildir. Bağlantı **yalnız aynı Mac'te** çalışır.
