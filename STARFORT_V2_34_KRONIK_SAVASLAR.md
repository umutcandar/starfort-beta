# STARFORT v2.34 — Sinematik İkinci Perde ve Komutan Kroniği

Hesap zorunlu sistem devam eder. Misafir oyunu ve yerel ödül yoktur.

## Yeni savaş karşılaşmaları

8 ikinci perde bölgesinin her biri 3 operasyon içerir. Toplam 24 farklı, isimlendirilmiş düşman dalgası ve 72 ayrı düşman pozisyonu `act-two-encounters.js` dosyasında tanımlıdır. `official-combat-scene.js` (2D) ve `official-battle-bridge.js` (3D) aynı sunucu stage/wave verisini ve aynı düşman isimlerini kullanır.

8 ayrı renk paleti ve hareketli çevre parçacıkları: kor, cam, göktaşı, diken, kül, gece, fırtına ve boşluk. Patronun özel yeteneği tam savaş niyetiyle eşleştiğinde büyü aurası ile SİPER/ÖZEL YETENEK uyarısı görünür. Etkiler sadece HTML/CSS/3D gösterimidir; gerçek hasar ve galibiyet yalnızca Supabase RPC fonksiyonunda hesaplanır. `prefers-reduced-motion` hareketi azaltır.

## Komutan Kroniği — 30 kalıcı rütbe

Sunucunun `counters.win` değeri üzerine kurulur. Her rütbe `2 × rank²` doğrulanmış sefer zaferi gerektirir: ilk rütbe 2, beşinci 50, onuncu 200, yirminci 800, otuzuncu 1800 zafer. Her sandık bir kez alınabilir ve sırayla ilerler. Altın ödülü `100 + 60 × rank`, yıldız özü ödülü `5 + 3 × rank`.

`chronicle_claim` sunucu aksiyonu öncelikle kimlik, kayıt, eşik, önceki rütbe ve aynı ödülün tekrarını doğrular; sonra kaynakları aynı işlem içinde arttırır ve alınan rütbeyi `contract_claims['chronicle:N']` anahtarında kaydeder. İstemciden sahte zafer sayısı veya ödül miktarı kabul edilmez. İdempotent `p_request_id` ve `sfb_starfort_progress` yetkileri korunur; tablolara anonim erişim açılmaz. Yeni tablo veya kolon eklemek gerekmez.

## Testler ve sınırlar

`chronicle-encounters-v234.test.mjs` 24 karşılaşmanın farklı olduğunu, 2D-3D kadro uyumunu, 8 patronun işaretlerini, 30 rütbe kademesini ve sunucu ödeme korumalarını denetler. Var olan genel STARFORT test ve Chromium hesap-kilidi testleri de çalıştırılır.

Bu testler sahici bir oyuncu hesabıyla, e-posta onayından 16. bölgenin sonuna ve 1800 galibiyete kadar canlı uçtan uca oynanmış bir hesap testi **değildir**. Bu tür bir doğrulama için güvenli bir test hesabı veya ayrılmış test ortamı gerekir; var olan kişilerin hesaplarına dokunulmadı.

## Kaynak dosyalar

- `starfort/act-two-encounters.js`: 24 bölge-dalga düşman kadrosu
- `starfort/official-combat-scene.js`, `starfort/official-battle-bridge.js`: 2D/3D sahneler
- `starfort/world-combat-v226.css`: patron büyü ve atmosfer efektleri
- `starfort/commander-chronicle.js`: kronik rütbeleri, ilerleme ve sandık ekranı
- `starfort/account-expedition.js`, `starfort/app.js`, `starfort/account-progression.js`: hesap oyunu entegrasyonu
- `starfort/sql/starfort-v234-commander-chronicle.sql`: sunucu doğrulamalı kalıcı rütbe ödülleri
- `starfort/chronicle-encounters-v234.test.mjs`: regresyon testleri

Önce Supabase'de yeni RPC dağıtıldı ve anonim EXECUTE kapalı olduğu teyit edildi. GitHub Pages ve Render dağıtımları commit bazında ayrıca doğrulanmalıdır. Render oto dağıtım ayarı açık olmasına rağmen daha önce commitleri kendiliğinden yüklemiyordu; gerektiğinde tek manuel dağıtım yapılır.
