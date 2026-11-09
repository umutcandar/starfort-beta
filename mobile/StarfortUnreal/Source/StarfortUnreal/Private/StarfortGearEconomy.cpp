#include "StarfortGearEconomy.h"
#include "StarfortBagCatalog.h"

FString FStarfortGearResourceCost::ToTurkishLabel() const
{
 if(!bAvailable)return TEXT("Reçete yok");
 TArray<FString> P;
 if(Gold>0)P.Add(FString::Printf(TEXT("%d Altın"),Gold));
 if(Wood>0)P.Add(FString::Printf(TEXT("%d Kereste"),Wood));
 if(Stone>0)P.Add(FString::Printf(TEXT("%d Taş"),Stone));
 if(Essence>0)P.Add(FString::Printf(TEXT("%d Yıldız Özü"),Essence));
 return FString::Join(P,TEXT(" · "));
}

FStarfortGearResourceCost FStarfortGearEconomy::CurrentForgeCost(const FString& Id)
{
 // These twelve EXACT recipes are already live in sfb_starfort_progress.
 if(Id==TEXT("iron_sword"))return {90,25,0,0,true};
 if(Id==TEXT("ward_mail"))return {110,0,35,0,true};
 if(Id==TEXT("lunar_charm"))return {100,0,0,15,true};
 if(Id==TEXT("ember_blade"))return {260,0,0,30,true};
 if(Id==TEXT("warden_plate"))return {280,0,100,0,true};
 if(Id==TEXT("star_lens"))return {230,0,0,45,true};
 if(Id==TEXT("royal_blade"))return {650,0,0,80,true};
 if(Id==TEXT("aegis"))return {700,0,220,0,true};
 if(Id==TEXT("moonheart"))return {650,0,0,100,true};
 if(Id==TEXT("starbreaker"))return {1450,0,0,220,true};
 if(Id==TEXT("ashes_plate"))return {1250,0,390,0,true};
 if(Id==TEXT("guardian_seal"))return {1100,0,0,185,true};
 return {};
}

FStarfortGearResourceCost FStarfortGearEconomy::NextMasteryCost(
 const FString& ItemId,int32 CurrentRank)
{
 const FStarfortBagItemInfo* Item=FStarfortBagCatalog::Find(ItemId);
 if(!Item || CurrentRank<0 || CurrentRank>=5)return {};
 const FString Rarity(Item->Rarity);
 const int32 Mult=Rarity==TEXT("legendary")?3:
  Rarity==TEXT("epic")?2:1;
 const int32 Next=CurrentRank+1;
 return {120*Next*Next*Mult,0,40*Next*Mult,
  8*Next*Next*Mult,true};
}

FString FStarfortGearEconomy::CurrentAcquisition(const FString& Id)
{
 // Only actual, deterministic live-server sources, no invented chances.
 if(Id==TEXT("iron_sword")||Id==TEXT("ward_mail"))
  return TEXT("Başlangıç Çantası · Demirhane 1");
 if(Id==TEXT("lunar_charm"))
  return TEXT("Hikâye Bölüm 1 ilk zaferi · Demirhane 1");
 if(Id==TEXT("ember_blade"))
  return TEXT("Hikâye Bölüm 2 ilk zaferi · Demirhane 2");
 if(Id==TEXT("warden_plate"))
  return TEXT("Hikâye Bölüm 3 ilk zaferi · Demirhane 2");
 if(Id==TEXT("star_lens"))
  return TEXT("Hikâye Bölüm 4 ilk zaferi · Demirhane 2");
 if(Id==TEXT("grave_seal"))
  return TEXT("Hikâye Bölüm 5 ilk zaferi · Üretilemez");
 if(Id==TEXT("royal_blade"))
  return TEXT("Hikâye Bölüm 6 ilk zaferi · Demirhane 4");
 if(Id==TEXT("eclipse_edge"))
  return TEXT("Hikâye Bölüm 7 ilk zaferi · Üretilemez");
 if(Id==TEXT("moonheart"))
  return TEXT("Hikâye Bölüm 8 ilk zaferi · Demirhane 4");
 if(Id==TEXT("moon_watch"))
  return TEXT("1. farklı 3 yıldızlı hikâye bölümü · Üretilemez");
 if(Id==TEXT("ember_guard"))
  return TEXT("2. farklı 3 yıldızlı bölüm · Haftalık patron rotasyonu");
 if(Id==TEXT("dawn_relic"))
  return TEXT("3. farklı 3 yıldızlı bölüm · Üretilemez");
 if(Id==TEXT("star_spear"))
  return TEXT("4. farklı 3 yıldızlı bölüm · Haftalık patron rotasyonu");
 if(Id==TEXT("dawn_guard"))
  return TEXT("5. farklı 3 yıldızlı bölüm · Üretilemez");
 if(Id==TEXT("aegis"))
  return TEXT("Demirhane 4");
 if(Id==TEXT("starbreaker"))
  return TEXT("Demirhane 6 · Haftalık patron rotasyonu");
 if(Id==TEXT("ashes_plate"))
  return TEXT("Demirhane 5");
 if(Id==TEXT("guardian_seal"))
  return TEXT("Demirhane 5 · Haftalık patron rotasyonu");
 return TEXT("Mevcut sunucu kaynağı bilinmiyor");
}

bool FStarfortGearEconomy::CurrentAscension(
 const FString& ItemId,int32 NextRank,int32& Weeks,
 FStarfortGearResourceCost& OutCost)
{
 Weeks=0;
 OutCost={};
 if(NextRank<1 || NextRank>4 ||
    (ItemId!=TEXT("ember_guard") &&
     ItemId!=TEXT("star_spear") &&
     ItemId!=TEXT("guardian_seal") &&
     ItemId!=TEXT("starbreaker")))return false;
 const int32 Required[4]={2,5,9,14};
 Weeks=Required[NextRank-1];
 OutCost={1400*NextRank*NextRank,0,
  420*NextRank,100*NextRank*NextRank,true};
 return true;
}
