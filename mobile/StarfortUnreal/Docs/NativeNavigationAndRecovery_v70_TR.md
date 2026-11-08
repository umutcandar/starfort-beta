# STARFORT Mobile v70 — Sahne geçişi, hesap değişimi ve ağ hatası onarımı

**Platform:** Unreal Engine 5.8 ile yerel iOS/Android yatay oyun. Eski web istemcisi açılmaz. Bu paket yüksek detaylı 3D karakterlerin yerine geçmez; derlenebilir yerel istemcinin hatalı durumlarını düzelten kaynak geliştirmesidir.

## Kök nedenler ve uygulanan düzeltmeler

1. **Kalıcı olaylara abonelik sızıntısı:** Köy, savaş ve kahraman PlayerController'ları `UGameInstanceSubsystem` içindeki Supabase olaylarına bağlanıyordu ancak `OpenLevel` sonrasında bağları çözülmüyordu. Üç denetleyiciye de `EndPlay` temizliği eklenerek login/progress/battle/village/route olayları ayrıldı; UMG ekranları kaldırıldı ve savaş varlığı yüklemeleri durduruldu.
2. **Giriş süresi dolduktan sonra boş ekran:** Savaş ve kahraman salonu geçersiz oturumla açılırsa artık `/Engine/Maps/Entry` içindeki yerel login ekranına dönüyor. Savaş sırasında kullanıcı çıkış yaptığında da aynı davranış uygulanıyor. Misafir/yerel kayıt oluşturulmuyor.
3. **Bağlantı hatasında kaynakların yok olması:** Köydeki son doğrulanmış altın/odun/taş/öz değerleri silinmek yerine 'güncel olmayabilir' işaretiyle salt okunur kalıyor. Bina yükseltme devre dışı; sunucu tekrar doğrulanınca etkinleştiriliyor. Bu değerler güncel sunucu bakiyesiymiş gibi sunulmuyor.
4. **Savaşta başarısız işlem sonrası kilit:** Native UMG'ye `SUNUCUYU YENİLE` butonu eklendi. Yalnızca GET eylemiyle gerçek sunucu turunu alıyor; başarılı/başarısız olabileceği belirsiz bir `mission_turn` veya yükseltmeyi yeniden göndermiyor.
5. **Sessiz biçimde reddedilen eşzamanlı komut:** Daha önce `bProgressPending` durumunda hesap işlemi hiçbir bildirim vermeden atlanıyor, buton `bCommandPending` durumunda takılabiliyordu. Artık kullanıcıya güvenli bir hata olayı dönüyor. Hesap verisi sistematik olarak yeniden okunuyor; saldırı otomatik olarak kopyalanmıyor.
6. **Geri navigasyon:** `L_StarfortVillage.umap` henüz paketlenmediyse kahraman ekranındaki Geri, gerçek yerel Engine Entry köy/hesap sahnesine dönebilir. Giriş kontrolü korunur; WebView veya hayali 3D bina açılmaz.

## Gerçek testler

- `python3 Tools/test_native_mobile.py`: kaynak ve işlev sözleşmesi regresyon testleri.
- GitHub Actions `STARFORT Native Mobile Source QA`, `Starfort QA` ve dört oyuncu regresyon işi: **kaynak/önceki oyun testidir, Unreal Editor ve telefon testi değildir**.
- `python3 Tools/run_editor_qa.py`: Unreal 5.8 Editor, gerçek C++ derlemesi ve motor-içi Automation Framework gerekir. Başarılı motor raporu yoksa gerçek Unreal testi geçmiş sayılmaz.
- Gerçek kalite ve ilk telefon kurulumu için yüksek kaliteli lisanslı rigged karakterler, doğru AnimBP/LOD/texture, authored `.umap`, UMG `.uasset`, Xcode/Android SDK ve gerçek cihaz testi hâlâ zorunlu.

## Olması gereken mobil manuel senaryolar

1. Hesap A ile köye gir, sunucu kaynaklarını doğrula; savaş sahnesine geç; hesap değiştirirken eski köy verisinin yeni savaş olayına taşınmadığını izle.
2. Wi-Fi'yi saldırı sırasında kapat; saldırıyı tekrar yollama. `SUNUCUYU YENİLE` butonuyla bağlantı gelince aynı sunucu turunu kurtar.
3. Köy yükseltmesini başlattıktan sonra ağ kopunca kaynakları salt okunur gör; sunucu yenilemesine kadar tekrar yükseltme yapama.
4. Kahraman veya savaş sahnesinde oturum süresi dolunca boş dünya yerine gerçek login ekranına dön.
5. Kalite onaylı Unreal haritaları yokken kahramandan Geri ile geçici native köy menüsüne dönebil; bu sürümün görsel köyünün tamamlandığı anlamına gelmediğini doğrula.

**Durum:** Kod değişiklikleri GitHub'a eklenmiştir; UE 5.8 derlemesi ve fiziksel telefon testleri burada yapılmamıştır. Prodüksiyon veritabanını değiştiren işlem yoktur.