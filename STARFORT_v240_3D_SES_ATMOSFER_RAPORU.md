# STARFORT v2.40 — Patronların Gerçek 3D Modelleri, Seslendirmeler ve Atmosfer

**3 Kasım 2026 — v2.40 yayın teknik notları**

## 1. Gerçek 3D patron modelleri ve hareket (oyun içi uygulama)

Gölge Sınırı'ndaki dört patron için, **WebGL2 ile perspektif projeksiyonlu, derinlik testli gerçek 3D geometri** ve zamanla hareket eden özgün gövde parçaları oluşturuldu. Dışarıdan ücretli model, telifli varlık veya izlenmeyen shader indirmesi yoktur.

- **Diken Nöbetçisi:** köklerden gövde, dikenler, boynuzlar, hareketli dallar, ışık halkası.
- **Oyuk Siren:** hayaletimsi koni gövde, baş, sekiz hareketli uzuv, dönen gelgit halkaları.
- **Kül Fırtınası:** taş/alev gövdesi, boynuz, sekizgen siluet, alev sivri uçlar, bağımsız kollar ve pençeler.
- **Tutulma Hükümdarı:** zırhlı gövde, pelerin, taç, dolaşan yıldız parçaları, tutulma halkası.

Gövde parçaları farklı yörünge, salınım, eğilme ve ölçeklenme kurallarıyla canlandırılır. Dalga 3'te sahne güçlenir; Tutulma patronu düşük canla parlama bonusu alır. Bu yapı 3 uzamsal boyutta geometri + **zamanla hareket** olduğu için pazarlama anlamında “4D hissiyatı” sunabilir. **Dört uzamsal boyutlu gerçek bir model değildir.** Kullanıcının sorusuna teknik karşılığı çalışan animasyonlu WebGL 3D modeldir.

- Varsayılan **3D model** seçimi; kontrol tuşuyla her an hafif **2D çizime** dönülebilir.
- WebGL2 yoksa veya grafik bağlamı kaybolursa v2.39 özgün SVG illüstrasyon güvenli yedektir.
- Ekrandan çıkışta animasyon kaynakları, GPU buffer'ları ve ses döngüleri temizlenir.
- Dar mobil ekranlarda çözünürlük sınırı ve daha az atmosfer parçacığı uygulanır; sistemin hareket azaltma ayarı dikkate alınır.

**Dosyalar:** `shadow-boss-3d-v240.js`, `shadow-cinematic-v240.css`, `shadow-frontier-v238.js`.

## 2. Darbe, savunma, iyileştirme ve aşama efektleri

`shadowCombatEffects(previous,serverReply,action)`, oyuncunun **sunucu RPC'sinin doğruladığı** önceki/sonraki savaş kayıtlarından olay üretir: saldırı, ağır darbe, kalkan kırma, savunma, özel yetenek, iyileştirme, can emme, yeni dalga, öfkelenme ve zafer. Görsel/işitsel efektler hiçbir zaman oyuncunun HP'sini, hasarı, kaynaklarını, ganimetini veya yıldızını değiştirmez. İki farklı dalga arasındaki HP farkından hayali hasar üretilmez.

Patron bölgelerinde 13 adet, deterministik yerleşimli, çevreye göre renkli atmosfer parçacığı; savaş hamlesinde kısa ekran titreşimi ve efekt işareti bulunur. Güçlü hareket hassasiyeti olan oyuncular için `prefers-reduced-motion` animasyonları kaldırır.

## 3. Dört patronun Türkçe replikleri

Her patronun **giriş, ikinci safha, özel saldırı ve yenilgi** repliği var. Ses, tarayıcının işletim sistemindeki **Türkçe konuşma sentezi (SpeechSynthesis)** ile, ancak kullanıcı hem **Ses** hem **Seslendirme** seçeneklerini açarsa seslendirilir. Varsa `tr` dili seçilir; cihazda Türkçe ses bulunmuyorsa sonuç tarayıcıya bağlıdır. Ekranda aynı metin altyazı olarak gösterilir.

Bu kayıtlar **profesyonel insan ses dosyası veya yapay zekâ ile üretilmiş indirilebilir stüdyo dosyası değildir.** Bu teslim edilen uygulama tarayıcıya bağlı TTS seslendirmesidir; ayrıca gerçek WAV/OGG replik kaydı üretmek ileriki iştir.

Savaş için tamamen özgün WebAudio sentezli efektler: ağır vuruş, kalkan, kalkan kırma, can emme, şifa, faz değişimi, zafer, mağlubiyet. Dört patronun her birinde farklı frekanslarla çok yumuşak, özgün ambient motif döngüsü bulunur. Müzik veya ses dosyası dış servisten indirilmez. Varsayılan sessizlik, isteğe bağlı açma/kapatma, çıkışta ses iptali kuralları korunur.

**Dosya:** `shadow-battle-director-v240.js`.

## 4. Güvenlik, ilerleme ve ekonomik denge

Bu sürüm savaşın matematiğini veya ödül oranlarını değiştirmez; gerçek savaş aynı `sfb_shadow_api` üzerinden çalışır. Oyuncu hesabı ile premium ödeme sistemi ayrıdır, ücretli zafer/bonus eklenmez. Gönderilen hamle yalnızca `start`, `turn`, `abandon` gibi sunucu işlevleridir. WebGL ve ses katmanı salt görüntü/ses üretir.

**Uzun vadeli ekonomi, daha fazla zorluk kademesi, farklı haftalık patron kuralları ve sezon ilerleme dengesi bu sürümde tamamlanmadı.** İlerleme paketini yalnızca görsel sistemin üzerine körlemesine oturtmamak için ayrı ve doğrulanabilir sunucu geçişi olarak ele almak gerekir.

## 5. QA kabul ölçütleri

- Node: dört farklı gerçek 3D rig, üç boyutlu mesh elemanları, geometrinin doğrudan gerçek WebGL2 vertex buffer ve shader'a aktarılması.
- Node: gerçek sunucu savaş kaydından efekti güvenli türetme, olay tekrarında yanlış hasar göstermeme, sadece doğrulanmış raporun kullanılmasını sağlama.
- Node: replikler, TTS'nin isteğe bağlılığı, dört ortam parçacığı ve 2D kalite seçimi.
- Chromium: hesap girişi sonrası 3D canvas + 2D SVG yedeği, 3 kontrol düğmesi, seslendirme altyazısı, mobil uyumluluk, saldırı ve zafer ekranı.
- Önceki 434 gameplay/QA testi yeni sürümden sonra da geçmeli.
- GitHub QA ve Pages başarılı; Render aynı GitHub commit üzerinde **live** olduğunda yayında denebilir.

## Sonraki geliştirme

Uzun vadeli ekonomi ve sefer zorluk kademelerinin güvenli sunucu tarafı, tekrarlanabilir ödüllerin kontrollü güçlenmesi, haftalık ileri seviye mücadeleler ve geniş takım dizilimi testleri. Profesyonel kaydedilmiş patron sesleri, hareketli yüz/konuşma animasyonları ve daha ayrıntılı tekstürlü modeller ayrı üretim varlıkları gerektirir.
