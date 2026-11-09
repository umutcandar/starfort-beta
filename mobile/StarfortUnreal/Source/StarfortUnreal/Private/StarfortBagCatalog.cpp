#include "StarfortBagCatalog.h"

const TArray<FStarfortBagItemInfo>& FStarfortBagCatalog::All()
{
 static const TArray<FStarfortBagItemInfo> Entries={
  {TEXT("iron_sword"),TEXT("Yemin Kılıcı"),TEXT("weapon"),TEXT("common"),TEXT(""),
   TEXT("Hisarın muhafızlarına verilen çelik kılıç."),4,0,0,0,1},
  {TEXT("ward_mail"),TEXT("Muhafız Zırhı"),TEXT("armor"),TEXT("common"),TEXT(""),
   TEXT("Hafif levhalarla güçlendirilmiş zırh."),0,30,3,0,1},
  {TEXT("lunar_charm"),TEXT("Ay Mührü"),TEXT("relic"),TEXT("common"),TEXT("moon"),
   TEXT("Şifayı güçlendiren ay mührü."),0,8,0,6,1},
  {TEXT("ember_blade"),TEXT("Kor Kılıcı"),TEXT("weapon"),TEXT("epic"),TEXT("ember"),
   TEXT("Yıldız ateşinde dövülmüş kılıç."),10,0,0,0,2},
  {TEXT("warden_plate"),TEXT("Hisar Levhası"),TEXT("armor"),TEXT("epic"),TEXT(""),
   TEXT("Ağır muhafız zırhı."),0,65,7,0,2},
  {TEXT("star_lens"),TEXT("Yıldız Merceği"),TEXT("relic"),TEXT("epic"),TEXT(""),
   TEXT("Yıldız ışığını savaşta ve şifada kullanan mercek."),5,0,0,8,2},
  {TEXT("royal_blade"),TEXT("Şafak Yaran"),TEXT("weapon"),TEXT("legendary"),TEXT("dawn"),
   TEXT("Krallığın kayıp ustalarının kılıcı."),17,0,0,0,4},
  {TEXT("aegis"),TEXT("Son Siper"),TEXT("armor"),TEXT("legendary"),TEXT(""),
   TEXT("Hisarın en güçlü savunma zırhı."),0,110,12,0,4},
  {TEXT("moonheart"),TEXT("Ayın Kalbi"),TEXT("relic"),TEXT("legendary"),TEXT(""),
   TEXT("Canı ve iyileştirmeyi artıran kadim kristal."),0,35,0,14,4},
  {TEXT("grave_seal"),TEXT("Mahzen Ruh Mührü"),TEXT("relic"),TEXT("epic"),TEXT(""),
   TEXT("Sessiz Mahzen sefer ganimeti."),0,26,0,8,0},
  {TEXT("eclipse_edge"),TEXT("Tutulma Kılıcı"),TEXT("weapon"),TEXT("legendary"),TEXT(""),
   TEXT("Tutulma Kulesi'nin eşsiz ganimeti."),15,0,0,0,0},
  {TEXT("moon_watch"),TEXT("Ay Siperi"),TEXT("armor"),TEXT("epic"),TEXT("moon"),
   TEXT("Kusursuz sefer mühründen gelen ay zırhı."),0,45,6,0,0},
  {TEXT("ember_guard"),TEXT("Kor Lejyonu Zırhı"),TEXT("armor"),TEXT("epic"),TEXT("ember"),
   TEXT("Üç yıldızlı sefer ödülü."),0,50,5,0,0},
  {TEXT("dawn_relic"),TEXT("Şafak Yemini"),TEXT("relic"),TEXT("legendary"),TEXT("dawn"),
   TEXT("Şafak muhafızlarının kadim tılsımı."),0,20,0,7,0},
  {TEXT("star_spear"),TEXT("Ayışığı Mızrağı"),TEXT("weapon"),TEXT("legendary"),TEXT("moon"),
   TEXT("Dördüncü kusursuz sefer ganimeti."),11,0,0,0,0},
  {TEXT("dawn_guard"),TEXT("Şafak Muhafızı Levhası"),TEXT("armor"),TEXT("legendary"),TEXT("dawn"),
   TEXT("Kraliyet zırhı sefer ganimeti."),0,70,6,0,0},
  {TEXT("starbreaker"),TEXT("Yıldızkıran Kılıç"),TEXT("weapon"),TEXT("legendary"),TEXT("dawn"),
   TEXT("Yıldız Muhafızı ustalarının ışıkla işlediği kılıç."),28,0,0,0,6},
  {TEXT("ashes_plate"),TEXT("Küllerin Zırhı"),TEXT("armor"),TEXT("legendary"),TEXT("ember"),
   TEXT("Alevin sınavından geçmiş mavi çelik zırh."),0,150,14,0,5},
  {TEXT("guardian_seal"),TEXT("Koruyucu Mühür"),TEXT("relic"),TEXT("legendary"),TEXT("dawn"),
   TEXT("Kadim yıldızın nöbet yeminini taşıyan tılsım."),0,35,0,17,5}
 };
 return Entries;
}

const FStarfortBagItemInfo* FStarfortBagCatalog::Find(const FString& ItemId)
{
 for (const FStarfortBagItemInfo& Entry:All())
  if (ItemId==Entry.Id) return &Entry;
 return nullptr;
}

bool FStarfortBagCatalog::IsSlot(const FString& Slot)
{
 return Slot==TEXT("weapon") || Slot==TEXT("armor") ||
  Slot==TEXT("relic");
}

bool FStarfortBagCatalog::IsHero(const FString& HeroId)
{
 for (const TCHAR* Id:{
  TEXT("aldren"),TEXT("lyra"),TEXT("rovan"),TEXT("mira"),
  TEXT("doran"),TEXT("vesper"),TEXT("eira")})
  if (HeroId==Id) return true;
 return false;
}

FLinearColor FStarfortBagCatalog::RarityColor(const TCHAR* Rarity)
{
 const FString Key(Rarity);
 if(Key==TEXT("legendary"))return FLinearColor(.98f,.78f,.33f,1.f);
 if(Key==TEXT("epic"))return FLinearColor(.73f,.49f,.96f,1.f);
 return FLinearColor(.41f,.66f,.9f,1.f);
}
FString FStarfortBagCatalog::SlotLabel(const FString& Slot)
{
 if (Slot==TEXT("weapon")) return TEXT("Silah");
 if (Slot==TEXT("armor")) return TEXT("Zırh");
 if (Slot==TEXT("relic")) return TEXT("Tılsım");
 return TEXT("Eşya");
}
