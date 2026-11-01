# STARFORT v2.22 — Köy ekonomisi ve inşaat sisteminin kökten yenilenmesi

## Problem
v2.21'de 7 bina, 8 seviye ve saniyeler içinde satın alınan yükseltmeler vardı. Dakikada 20 altın, 15 kereste, 12 taş, 3 yıldız özü üretiliyordu. Maliyet ödenince bina anında seviye atladığından bir günlük testte her yapı tamamen tamamlanabiliyordu.

## Baştan sona gelişim
- **7 binanın tamamı 20 seviye.** İlk yükseltme hızlı tanıtım (1→2). İkinci yükseltmeden (2→3) itibaren her bina bir *inşaat kuyruğuna* girer.
- **Tek inşaat ustası.** Kaynak miktarı ne olursa olsun farklı iki bina aynı anda yükseltilemez. Kaynaklar inşaat başında bir kez ödenir. Sırada bekleyen tamamlanmış inşaat önce teslim alınır.
- **Gittikçe uzayan gerçek süreler:** 2→3 üç dakika; 4→5 yirmi beş dakika; 7→8 üç saat; 8→9 beş saat; 10→11 on iki saat; 15→16 otuz yedi saat; 19→20 altmış saat. Tüm 7 bina için sadece tek usta süresinin matematiksel toplamı **75 günden fazla**; ayrıca sefer ve kaynak koşulları var. Gerçek para karşılığı süre atlama yok.
- **Gerçek ekonomi:** temel üretim altın 4/dk, kereste 3/dk, taş 2.5/dk ve yıldız özü 0.6/dk. 24 saat üretim limiti, ilk 4 saatin tam hız / sonrasında düşük hız politikası korunur. Sefer ve günlük ödüller anlamlı kalır.
- **Ustalık aşamaları:** 4→5 için 3, 7→8 için 6, 10→11 için 12, 14→15 için 18 ve 18→19 için 24 toplam hikâye yıldızı gerekiyor. Geçmiş bölümler tekrar oynanabildiğinden hiçbir eşik günlük giriş kaçırmakla kaybedilmez.
- **İlerleme ekranı:** 20 seviye iki satırda, tek usta kuyruğu, geri sayım, bitince tamamla, sefer yıldızı koşulu ve ilgili seferlere geçiş. Köy manzarasında devam eden inşaat sürekli takip edilir.

## Mevcut kayıtlar ve veri bütünlüğü
- Eski beta kayıtları ve oyuncunun daha önce açtığı 8. seviyeler silinmiyor; 8. seviyeden 20'ye devam edebilir.
- Oyun kayıt anahtarı ve battle/gear/season bilgileri değişmiyor.
- Yalnızca geçerli, tam süresi tutan ve doğru binanın doğru önceki seviyesine ait tek inşaat restore edilir.
- Başarısız başlangıç / yetersiz kaynak / yıldız kilidi / ikinci eşzamanlı işlem **hiçbir kaynak veya kaydı değiştirmez**. İnşaat bitince seviye ve bonus tek sefer uygulanır.
- Yerel saat ve localStorage sahibi olan kullanıcı kendi beta kaydını değiştirebilir; **bu mekanizma sunucu tarafından doğrulanan bir rekabetçi ekonomi değildir.** Dereceli PvP ödüllerine bağlanmaz.

## Görsel sınır
Mevcut atlas 1–8. seviyelerin fiziksel mimarisini çiziyor. 9–20 aşamaları yeni üretim, güç ve kale ustalığı seviyeleridir; bu aşamalarda hayali 9–20 mimari resimleri varmış gibi gösterilmez. Tamamlayıcı sanat çalışması başka bir sürümde üretilebilir.

## QA
Ekonominin tam üretim hesabı; 20 seviye; 75+ gün seri inşaat alt sınırı; 3 dakikalık ilk süreli yapı; ikinci usta engeli; kayıt reload'u; sahte ve bozulmuş inşaat kayıtlarını reddetme; yıldız kilitleri ve sefer bağlantıları; maliyet ve toplanmış üretimin çift harcanmaması test edilir. Mevcut savaş, sezon, kayıt, multiplayer ve Chromium kontrolleri de koşar.
