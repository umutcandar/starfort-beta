# STARFORT v2.36 — Yıldız Hazinesi, Kozmetik Dolap ve Sezon Yolu
**2 Kasım 2026**. E-posta/alan adı/ödeme kuruluşu henüz seçilmediğinden, aşağıdaki sistemler ödeme etkinleştirilmeden çalışır.

## Gerçekten uygulanmış olanlar

1. **Hesaba bağlı premium cüzdan:** `starfort_premium_wallet`, başlangıç 0 kristal, negatif bakiye yasak; sunucu kilidiyle atomik düşüm ve işlem sürümü. Oyuncu kaynak dosyasından veya yerel kayıt üzerinden kristal üretemez.
2. **Kalıcı koleksiyon:** `starfort_premium_owned`, her üründen en fazla 1. Her ürün yalnızca kendi türünün yuvasına kuşanılabilir. Koşulsuz/eşyasız kuşanma engellenir.
3. **8 kozmetik ürün:** Kale: Kutup Işığı/ Kor (200'er kristal); pelerin: Yıldız/ Gölge (160); sancak: Kraliyet/Astral (120); zafer izi: Altın/Göksel (140). Renk, çerçeve, arma ve zafer vurgularıdır. Savaş hasarı, kaynak üretimi, inşaat süresi, PvP eşleştirme gücü **değişmez**.
4. **Aylık ücretsiz Sezon Yolu:** Ay bazlı (`YYYY-MM`) hesap başlangıcı, sunucuda doğrulanmış galibiyet sayacı. İlgili ayda ilk sezon erişiminden sonra **2/5/10/18** kazanılmış galibiyette Öncü Sancağı, İzci Pelerini, Şafak Hisarı, Takımyıldızı Zaferi. Birer kez alınır; sezon ödülü kuşanımı ve envanterdeki sahiplik kalıcıdır.
5. **Satın alma harcaması:** Oyun içi kristal ile katalog ürünü satın almak için `sfb_premium_api('purchase',item,uuid)`. Fiyatı ve envanter adını **SQL belirler**, JSON istemcisinden fiyat kabul etmez. Replay/tekil ürün/row lock/insufficient funds testleri vardır.
6. **API güvenliği:** Premium tablolarında RLS etkin, `anon` ve `authenticated` doğrudan tablo yetkileri kapalı; yalnızca izinli hesap RPC eylemleri; kişiye özel `auth.uid()`, kalıcı işlem ID'si, 0 kristal başlangıcı, maksimum kristal limiti.
7. **Hazırlanmış ama etkin olmayanlar:** Kristal paketleri 100/500/1200, VIP 30 gün (kozmetik hesap çerçevesi), premium sezon bileti; ödeme olay defteri `starfort_premium_events`. Dış ödeme kuruluşu yoktur; premium fulfillment RPC **kasıtlı olarak her zaman hata verir**; bütün gerçek para butonları pasiftir.

## Kritik ayrım: Neler henüz *hazır değil*?

- Gerçek para için satıcı hesabı, ödeme altyapısı, TL fiyat ve vergiler, imzalı webhook/ödeme doğrulaması, iade/itiraz/yükleme-geri-alma (chargeback) ve işlem mutabakatı.
- Şu an **gerçek ödeme alınamaz**, kristal kullanıcı tarafından yüklenemez, VIP ve ücretli sezona üye olunamaz. Fiyatlar yalnızca **oyun içi kristal** cinsindedir; TL fiyat belirlenmemiştir.
- Ücretli üyeliklerin periyodik yenileme/iptal ve geriye dönük iade mekanizmaları yoktur. VIP ve premium geçici ürünler prototip olarak görünür ama satılmaz.
- Efsanevi PvE güç veren ekipmanlar eski mağazada yalnızca **tasarım konseptleri** olarak gösterilir, satın alma yolu yoktur. PvP üstünlüğü satılmamalı.

## Ödeme sağlayıcısı seçilince yapılacak güvenli aktivasyon sırası

1. Alan adı + işlem e-postası + ödeme satıcı hesabı ve zorunlu müşteri bilgilendirmeleri.
2. İstemci değil, güvenilir Node/Edge sunucusunda checkout session yaratma. Para tutarı, TL birimi ve ürünün özgün kimliği sunucuda kilitlenmeli.
3. Ödeme sağlayıcısının **belgelenmiş imzasını doğrulayan webhook**; kullanıcı bağlantısından gelen `paid=true` alanı asla geçerli sayılmamalı. Sipariş kayıtları, ödeme tutarı/birim ve tekrarlanan event ID tam doğrulanmalı.
4. Doğrulanmış ödeme olayını yalnızca sunucu kimliğiyle veritabanına yazma, tekil event ile tam bir kez ürün yükleme, başarısız event otomatik yeniden deneme ve mutabakat.
5. İade/chargeback: satın alınan şey kullanılmış olsa bile negatif bakiye yaratarak haksız silme yapmayan, kilitleme/geri alma politikasını belirleyen idari süreç. `payment_id`, `customer_id`, `provider`, `refund_id` tekrar korumaları.
6. Staging: gerçek ödeme almayan sağlayıcı sandbox'ında başarı/başarısız/tekrar/sahte webhook/iade senaryoları, sonra sınırlı beta ve sorunsuz kontrol sonrası açılış.
7. Yalnızca güvenlik ve ödeme testleri bitince oyun içerisindeki `paymentsEnabled` ve ilgili checkout davranışını aç.

**Asla** Render/GitHub istemci HTML/JS dosyasına provider secret, service role key veya özel webhook anahtarı eklenmemeli.

## Kalite kanıtı

- `npm run qa:game`: `premium-store-v236.test.mjs` + mevcut oyun testleri.
- Chrome `scripts/reference-browser-qa.mjs`: sentetik Supabase yanıtlarıyla giriş, sezon ödülü, ödeme kilidi, 390px düzen. Gerçek ödeme simülasyonu olarak lanse edilmemeli.
- Veritabanında gerçek `sfb_premium_api` ile, `BEGIN/ROLLBACK` kullanılan bir defalık test: sıfır bakiye satın alma, sahte ödeme, ücretsiz aşama zaman kilidi, 4 geçerli ödül, ekipman kuşanma, aynı UUID replay; ek olarak geçici 500 kristal **test fixture** ile doğru ücret düşme ve çift ürün engeli. Hiçbir hesaba kalıcı test parası yüklenmedi.

## Devam geliştirme sırası

1. VIP ve premium sezon için özel kozmetik ödüllerin gerçekten görsel olarak uygulanması, yük durumları ve satın alma sonrası iade.
2. Ekonomiyi sanal para enflasyonuna karşı sınırlandırma, yeni oyuncu için sezon hedeflerinin ulaşılabilirliği.
3. Çevrim içi topluluk sistemlerinin Supabase Auth ile tam birleştirilmesi ve uzun süreli oyuncu yük testleri.
4. Ödeme sağlayıcısı belirlendiğinde bu dosyada belirtilen ödeme/audit/iadeyi kapatma süreci.
