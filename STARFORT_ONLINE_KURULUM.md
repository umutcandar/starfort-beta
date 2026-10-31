# Starfort — çevrim içi kapalı beta kurulum paketi

Bu paket **henüz yayınlanmamıştır**. Test adresi ancak hosting hesabına bağlanıp dağıtım gerçekleştiğinde oluşturulabilir.

## Render ile dağıtım

1. ChatGPT içinde önerilen **Render** bağlantısını hesabına bağla. Alternatif olarak Render panosunda hesap oluştur.
2. Yeni **özel GitHub deposu** aç; bu ZIP’in içindeki `render.yaml`, `starfort/` klasörü ve `.gitignore` dosyasını deponun kök dizinine yükle. ZIP'i doğrudan Render'a yüklemek bir Git tabanlı Web Service kurulumunun yerini tutmaz.
3. Render > **New > Blueprint** ile GitHub deposunu seç. `render.yaml` otomatik okunur.
4. **STARFORT_TEST_CODE** sorulduğunda en az 16 karakterli, tahmin edilmesi zor bir test kodu belirle. *Bu kodu depoya yazma.*
5. Dağıtım başarılıysa Render sana bir `https://...onrender.com` adresi verir; oyunu `https://...onrender.com/starfort/` üzerinden açabilirsin. Bu URL örnektir; henüz gerçek adres üretilmedi.
6. İlk bot maçı veya İttifak hesabı oluşturma sırasında kod istenir. Kod aynı oturumda korunur.

## Başlıca sınırlamalar

- Bu **kapalı test** ortamıdır, ticari oyun sunucusu değildir. Davet kodu yalnızca hesap açılmasını sınırlar; profesyonel kimlik doğrulama değildir.
- Render ücretsiz servisleri boşta kaldıktan sonra durabilir. Yeniden açılırken gecikme yaşanır ve **yerel sunucu verileri silinebilir**. Özellikle klan/hesap verileri kalıcı değildir. Kalıcılık için PostgreSQL gibi ayrı veritabanı gerekir.
- Ana köy/kahraman ilerlemesi tarayıcı localStorage'ında tutulur. Mac'teki kayıt iPhone'a kendiliğinden taşınmaz; oyunun ayarlar menüsünden kayıt yedeği al.
- Gerçek zamanlı takım savaşı tek Node süreci ve HTTP polling kullanır; ölçekli/rekabetçi prodüksiyon PvP için uygun değildir.
- Görseller hâlâ prototip kalitesindedir; çevrim içi dağıtım görsel kaliteyi artırmaz.
- Dağıtım için kaynağın özel depoda tutulmasını öneriyoruz; depoya gerçek oyuncu verisi, şifre veya kimlik anahtarı koyma.

## Manuel çalışma / bulut simülasyonu

`cd starfort && STARFORT_HOST=0.0.0.0 PORT=10000 STARFORT_TEST_CODE=GUCLU-TEST-KODUN node guild-server.mjs`

Sağlık kontrolü: `GET /api/status`.

Yerel Mac kullanımı değişmez: `BAŞLAT.command` veya `node launch-starfort.mjs`.
