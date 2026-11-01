# STARFORT v2.12 — Köy UX, sefer ilerlemesi ve Çanta tasarım şartnamesi

**Tarih:** 2026-11-01  
**Durum:** Plan / teknik uygulama şartnamesi — bu dosyanın eklenmesi oynanış kodunu değiştirmez.  
**Temel hedef:** 8 hikâye bölümünün birkaç ardışık tıklamayla bitirilmesini engellemek; hazırlık, donanım, taktik ve keşif döngüsünü kurmak. Gereksiz saatlik bekleme ve pay-to-win yok.

## Mevcut sistem (GitHub main incelendi)

- `starfort/rules.js` içinde 8 hikâye seferi bulunuyor; mevcut önerilen güçler: **250, 310, 380, 450, 540, 650, 780, 920**. Başlatma kuralı şu anda esas olarak önceki bölümlerin bitirilmesine dayanıyor.
- `campaignStars` ve 1–3 yıldız savaş sonu sonucu mevcut; üst sınır 24 yıldız.
- `labyrinth.js`: 16 kat, hikâye başına açılan iki kat, `state.labyrinth.cleared`, kat koruyucuları ve ödüller.
- `app.js`: Çanta'da kahraman görseli, mevcut 3 ekipman slotu, tür filtreleri, eşya kartları ve set bonusları var; sorunlar yoğun kart metinleri ve zayıf yerleşim hiyerarşisi.
- `illustrated-scene.js`: köy sürükleme, pinch/wheel zoom, yumuşak odak animasyonu mevcut; zoom aralığı şu anda 1–2.8, sürükleme algılama eşiği 6 px.
- Ana menüde Köy / Kahramanlar / Seferler / İttifak / Çanta / Mağaza var. Labirent, Seferler sayfasında açılıyor.

## 1. Köy ekranı

### Tutulacaklar
- Mevcut Yıldız Vadisi panoraması ve binaların seviye görselleri.
- Üst kaynak çubuğu: altın, kereste, taş, yıldız özü.
- Ana menüdeki altı sayfa.
- Kaledeki bina seçimi ve sağlanan klavye/dokunmatik erişilebilirlik.
- Oyun içi ödül, sefer ve üretim akışları.

### Değişiklikler
| Öğeler | v2.12 kararı |
| --- | --- |
| Köy odağı | Tek belirgin **Sıradaki Sefer** kartı; ana CTA savaş/eksik koşul |
| Bina etiketleri | Varsayılan 3 etiket: Kale, Demirhane ve seçili/üretimi hazır bina; diğerleri tıklama/yakınlaştırma/bina listesinde |
| Günlük ödül | Kompakt sandık simgesi; hazır olduğunda yalnızca küçük bildirim işareti |
| Kamera düğmeleri | Varsayılan gizli; bir “harita kontrolleri” menüsünden +/− ve etiket görünürlüğü |
| Alt menü | Sıra: Köy, Seferler, Kahramanlar, Çanta, İttifak, Mağaza. Seferler hafif vurgulu |
| Sağlam kamera | Sabit genel görünüm varsayılan; sürükleme eşiği ~10 px; odağa geçiş 220–280 ms; kaydırma dünya sınırları içinde |
| Yakınlaştırma | Öneri mobil 1–1.7, masaüstü 1–2.2 (kesin sınırlar ekran testinde ayarlanacak) |
| Ana kart | Bölüm adı, zorluk, önerilen güç, ödül ve eksik şartları; en fazla tek ana CTA |

**Kamera davranışı:** 1:1 görünümde haritayı yanlışlıkla hareket ettirmek zorlaşacak. Pinch zoom kalacak. Tıklama ile sürükleme ayırt edilecek. Daha az hareket seçeneği sistem ayarlarına saygılı kalacak.

**Sefer kartı durumları:** `hazır` → Savaşa başla; `kilitli` → eksik koşul + ilgili sayfaya yönlendirme; `aktif` → Savaşa dön; `tamamlandı` → En iyi yıldız sayısı + tekrar oyna.

## 2. Sekiz bölümün açılma / zorluk tablosu

Aşağıdaki değerler **önerilen yeni denge değerleridir**, mevcut oyunda aktif kurallar değildir. İlk iki bölüm hızlı bir eğitim olur; daha sonraki her bölüme geçiş için oyuncu en az bir oyun sistemini kullanır.

| # | Bölge | Önerilen güç (mevcut) | Yeni giriş koşulu (önceki bölüm de bitmiş olmalı) | Oyunun öğrettiği / sınadığı |
| --- | --- | ---: | --- | --- |
| 1 | Kül Geçidi | 250 | Açık | Hedef seçimi, saldırı ve takım düzeni |
| 2 | Kırık Şapel | 310 | Bölüm 1 zaferi | Rakibin büyü hazırlığını kesme, Mira |
| 3 | Karaorman | 380 | Takım gücü ≥335; ≥1 kuşanılmış eşya | Ekipman ve hedef odağı |
| 4 | Demir Kapı | 450 | Takım gücü ≥405; Demirhane seviyesi ≥2 | Zırhlı düşman, boss darbesi |
| 5 | Sessiz Mahzen | 540 | Takım gücü ≥485; takımda toplam ≥3 kuşanılmış eşya | Tank/şifacı uyumu, çağırma/iyileştirme düşmanı |
| 6 | Ayaz Surları | 650 | Takım gücü ≥585; Labirent'te ≥2 kat bitmiş | Keşif, donma tehdidi, doğru set |
| 7 | Tutulma Kulesi | 780 | Takım gücü ≥695; en az **2 farklı bölümde 3 yıldız** | Enerji yönetimi ve kesme önceliği |
| 8 | Yıldızsız Taht | 920 | Takım gücü ≥825; Labirent'te ≥4 kat bitmiş; toplam ≥13 yıldız | Çok aşamalı son boss, takım koordinasyonu |

**Önemli tasarım kararları:**
- Oyuncunun sadece hızlı tıklama ile bölüm 8'e gitmesi engellenecek; fakat günlük giriş kilidi, zorunlu gerçek para, yapay bekleme veya aşırı grind olmayacak.
- Eski kayıtlarda daha önce geçilmiş seferler yeni kurallarla tekrar kilitlenmeyecek. Yeni açılacak ilk bölümden itibaren şart uygulanacak.
- Usta Seferleri ve haftalık Yıldız Yarığı ayrı modlar; ana hikâye giriş kilitlerini manipüle etmeyecek.
- Takım gücü, oyun içindeki `teamPower()` değerinden hesaplanacak; tam güç eşikleri 20+ simülasyon ve manuel oynanışla ayarlanacak.
- Eksik koşullar tek mesajda: **“Güç 385/405 • Demirhane 1/2”**. Her eksik koşul ilgili ekrana gider.
- Ekipman sayısı yalnızca **fiilen kuşanılmış ve mevcut envanterde yeri olan** eşyalardan sayılacak; çantadaki kullanılmayan eşyalar yetmeyecek.
- Her seferin düşman gücü ve mekanik eğrisi ayrıca ayarlanmalı; yalnızca HP çarpanı artırmak yetmez.

### Düşman mekanikleri

- 1: hareket/taktik eğitimi; affedici.
- 2: ilk belirgin büyü hazırlığı; kesilmezse alan hasarı.
- 3: bir öncü ve bir tehlikeli menzilli düşman; hedef önceliği.
- 4: zırhlı lider; kısa savunma fazı ve önceden gösterilen ağır darbe.
- 5: destek düşmanı, koruma ve şifa kararları.
- 6: donma/yavaşlatma tehdidi; karşı yetenek ve set seçimi.
- 7: enerji boşaltma, iki hedef arasında taktik tercih.
- 8: **3 aşamalı** boss: %100–65 standart, %65–30 ek yetenek, %30–0 tehlikeli son aşama. Her büyük saldırı önce oyuncuya gösterilir.

### Ödül ve tempo

- İlk zafer: mevcut özel düşüş + tam hikâye kaynağı; halihazırdaki tek-seferlik 3 yıldız ganimetleri korunur.
- Tekrar: kaynakların **%40'ı** (denge testine tabi); ilk zafer ekipmanı tekrar verilmez.
- En iyi yıldız derecesi saklanır; düşük derecede yeniden kazanma oyuncunun kayıtlı yıldızını düşürmez.
- Başarısız savaş mevcut kalıcı ilerlemeyi silmez.
- Günlük görev, klan ve PvP ilerleme sistemi PvE kazancının kısayolu olmamalı.
- Ücretli eşya güç avantajı PvP'ye taşınmamalı; mağaza için kozmetik öncelikli.

## 3. Çanta ekranı — uygulanabilir UI planı

**Önce gerçek çalışan 3 slot iyileştirilecek:** Silah / Zırh / Tılsım. Yüzük, miğfer, eldiven veya çizme gibi ek slotlar v2.12 kapsamına doğrudan konmayacak; önce eşyalar, istatistik ve kayıt uyumu tanımlanmalı.

### Masaüstü yerleşim (≥1100px)

```text
┌──────────────────┬───────────────────────┬────────────────────────┐
│ KAHRAMAN SEÇİMİ  │    KAHRAMAN GÖRSELİ   │   KULLANILAN EKİPMAN   │
│ Aldren / Lyra... │       [Aldren]        │   ⚔ Silah  [eşya]      │
│                  │  Can / Saldırı / Güç  │   ⛨ Zırh   [eşya]      │
│                  │  Önce → Sonra bonus   │   ✦ Tılsım [eşya]      │
├──────────────────┴───────────────────────┴────────────────────────┤
│ ÇANTAM         [Tümü] [Silah] [Zırh] [Tılsım] [Set] [Üretim]      │
├────────────┬────────────┬────────────┬────────────┬──────────────┤
│ [Eşya] ×1 │ [Eşya] ×2 │ [Eşya] ×1 │  [boş]     │   [boş]     │
│ Destansı  │ Efsanevi  │ Nadir     │             │             │
├────────────┴────────────┴────────────┴────────────┴──────────────┤
│ SEÇİLEN EŞYA: Adı · Etkisi · Set etkisi · [Kuşan] / [Çıkar]       │
└──────────────────────────────────────────────────────────────────┘
```

### Mobil yerleşim
1. Üstte seçili kahramanın portresi, ismi ve toplam gücü.
2. Hemen altında üç büyük, dokunulabilir slot.
3. Altında 2 sütunlu kare eşya ızgarası.
4. Eşyaya dokununca alttan açılan detay paneli; kapatmadan bir başka eşya seçilebilir.
5. Ekipman değişince saldırı, can, zırh, şifa ve **set bonusu farkı** gösterilir.

### Eşya kartı: minimum bilgi
- Gerçek öğe simgesi/illüstrasyonu (silah, zırh, tılsım şekilleri ayırt edilecek).
- Nadirlik: Nadir = nötr çelik; Destansı = mor; Efsanevi = altın.
- Elde edilen kopya sayısı; takılıysa kahraman adı; kilitli/özel düşüş ayrımı.
- Kartta uzun açıklamalar ve ikişer düğme yok; tek dokunuşla **eşya detay paneli**.
- Detayda: istatistik karşılaştırması, set parçası sayısı (ör. 1/2), set bonusu, kaynak maliyeti, kuşan/çıkar/üret.
- **Üretim** ayrı filtrede; kazanılmış eşyalar ve eşyalar için tarif listesi birbirine karışmasın.
- Boş slotlar görsel olarak boş kalsın; eşya varmış gibi görünmesin.

### Etkileşim ve veri kuralları
- Eşyaya tıklamak tek başına kuşanma yapmaz; oyuncu `Kuşan` der.
- Bir eşyanın tek fiziksel kopyası iki kahramanda aynı anda kullanılamaz (mevcut kural korunur).
- Dövüş aktifken değişiklik yapılamaz.
- Kaydetme ve geri yüklemede `inventory`, `loadouts`, `campaignStars` ve `labyrinth` geriye uyumlu olmalı.
- Set bonusu yalnızca aynı kahramanın iki uygun parçasına uygulanmalı.

## 4. Uygulama sırası

1. `stage-access.js` saf kurallar modülü: `getStageRequirements(state,stageId)` ve `canEnterStage(state,stageId)`; ana kurallar dosyasında da başlatma kontrolü.
2. Özel düşman yeteneği/fazı ve tekrar ödül indirimi; mevcut maç/testler kırılmadan.
3. Köy HUD sadeleştirmesi; kamera ve etiket mantığı + mobil testi.
4. Yeni Çanta 3 panelli tasarım; mevcut `equipment.js` mantığı korunarak.
5. Kaynak üretimi ile kazanma hızının dengesini oynanış simülasyonu ve gerçek dokunmatik testlerle düzeltme.

## 5. Kabul kriterleri

- Yeni hesap, gereken hazırlığı yapmadan bölüm 3+ açamaz; koşulları tamamlayınca açabilir.
- Eski hesapların bitirdiği bölümler kaybolmaz; eski kayıtlar açılır.
- Gereksinimler yalnızca arayüzde değil, `startBattle` ve `startLiveBattle` tarafında da uygulanır.
- Tekrar zaferi benzersiz ekipmanı çoğaltmaz.
- 3 yıldız ve labirent koşulları birbiriyle döngüsel kilit oluşturmaz.
- 360×800, 390×844 mobil ve 1366×768 masaüstü kontrol edilir.
- Eşya filtreleri, takma/çıkarma, kopya sayıları, set bonusu, savaş kilidi ve kayıt geri yüklemesi test edilir.
- `npm run qa:all` ve tarayıcı görsel kontrolü yeşil olmalı; test geçmeden canlıya alınmaz.

> **Kapsam bildirimi:** Bu dosya v2.12 için tasarım/uygulama planıdır; özelliklerin koda geçirildiği ya da yayınlandığı anlamına gelmez.
