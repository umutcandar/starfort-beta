# STARFORT v2.33 — Sekiz Özgün Patron ve Ulaşılabilir 3 Yıldız Ustalığı

STARFORT tamamen hesap gerektirir. Bu paket misafir modunu geri getirmez.

## Bölge patronlarının gerçek mekanikleri

| Bölge | Patron yeteneği | Karşı hamle |
|---|---|---|
| Kızıl Ufuk | Kor Taşkını — ağır darbeyi kuvvetlendirir | Siper |
| Cam Çölü | Ayna Yansıması — kalkan turunda hasar yansıtır | Kahraman yeteneği |
| Göktaşı Vadisi | Göktaşı Zırhı — normal darbeleri engeller | Kahraman yeteneği |
| Diken Tacı | Kan Dikenleri — doğrudan hücuma karşılık verir | Siper |
| Mavi Kül Dağı | Kül Ayini — can emme kuvvetlenir | Güçlü kahraman yeteneği |
| Sonsuz Gece | Gece Peçesi — normal saldırıyı zayıflatır | Kahraman yeteneği |
| Fırtına Sırtı | Zincir Yıldırım — sipersiz ağır hücuma ek hasar | Siper |
| Şafak Uçurumu | Boşluk Yutumu — daha yoğun can emme | Siper |

Bu etkiler sadece ikinci perde üçüncü dalgada, yetkili PostgreSQL `sfb_starfort_progress` fonksiyonunda hesaplanır. İstemciden güç, hasar, HP veya kaynak gönderilip kabul edilmez.

Savaş ekranı, sunucudan gelen `enemyIntent` ile güncel patron yeteneğini vurgular ve uygun karşılığı önerir. %67 ve %33 can eşiklerindeki önceki safha mantığı aynen korunur.

## Çok önemli 3 yıldız adalet düzeltmesi

Eski sürümde düşmanın HP'si oyuncunun gücüne sınırsız orantılı büyüyordu; oyuncunun kahraman ve eşyaya yatırım yapması savaşı yeterince kısaltamıyordu. Artık ikinci perde HP ölçeği `min(power, 1.25 × recommendedPower)` ile sınırlı. Güç artmaya devam ederken düşman HP artışı belli sınırda durur ve 18 tur altında 3 yıldız mümkün hâle gelir. Sadece ikinci perdeye uygulanır.

Üç dalga arasında kahraman takımına gelen iyileşme ikinci perdede %24'ten %34'e çıkartıldı; ilk hikâyenin %24 oranı değişmedi. Toplam 36 tur sınırı ve sunucu ödül güvenliği devam ediyor.

## Doğru takım gücü

Savaş başlatırken PostgreSQL'in hesapladığı güç, çevrim içi bölüm ekranlarında da aynı şekilde hesaplanır: kahraman seviyesi, forge/tavern binaları, ekipman, +1–+5 büyülemeler ve üç ekipman seti katkısı. Bu, kilit ekranında yanlış güç uyarısını azaltır.

## QA

`act-two-abilities-v233.test.mjs` sekiz farklı patronu, 36 turluk deterministik taktiksel modeli, tekrar saldırı ile taktik farkını, yatırım ile hızlanan 3 yıldız kazanımını ve SQL sunucu sınırlarını denetler.

`official-power-parity-v233.test.mjs` güç projeksiyonunun başlangıç ve set bonuslarıyla eşleşmesini sınar.

Bu test modeli gerçek oturumlu 8 bölgenin uçtan uca oyuncu testi değildir. Gerçek hesabın e-posta doğrulaması, savaş API'si ve mobil tarayıcı birlikte ayrıca sınanmalıdır.

## Dağıtım

Gönderilecek kod: STARFORT v2.33. Supabase migrasyonu `starfort/sql/starfort-v233-eight-boss-abilities.sql` uygulanmıştır ve `anon` yetkisinin kapalı olduğu doğrulanmıştır. Render web servisi GitHub'daki main dalını otomatik izlediğini belirtmesine rağmen önceki sürümde kaldığı için Render dağıtımı ayrıca denetlenmelidir.
