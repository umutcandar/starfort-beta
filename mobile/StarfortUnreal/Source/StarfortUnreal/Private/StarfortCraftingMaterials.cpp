#include "StarfortCraftingMaterials.h"

const TArray<FStarfortCraftingMaterialInfo>&
FStarfortCraftingMaterialCatalog::All()
{
 static const TArray<FStarfortCraftingMaterialInfo> Values={
  {TEXT("edge_sliver"),TEXT("Yıldız Kesiti"),
   TEXT("Günlük ilk 3 doğrulanmış hikâye galibiyeti (Silah hedefi): her zaferde 3"),
   TEXT("Beşgen kırık keski, içinde mavi yıldız damarı"),TEXT("common"),TEXT("weapon")},
  {TEXT("ward_rivet"),TEXT("Hisar Perçini"),
   TEXT("Günlük ilk 3 doğrulanmış hikâye galibiyeti (Zırh hedefi): her zaferde 3"),
   TEXT("İki metalden altıgen perçin; yedi kule damgası"),TEXT("common"),TEXT("armor")},
  {TEXT("astral_fiber"),TEXT("Astral Lif"),
   TEXT("Günlük ilk 3 doğrulanmış hikâye galibiyeti (Tılsım hedefi): her zaferde 3"),
   TEXT("Boşlukta ayrışmış üç ince ışıklı astral dokuma şeridi"),TEXT("common"),TEXT("relic")},
  {TEXT("star_glass"),TEXT("Yıldız Camı"),
   TEXT("Günlük ilk uygun Bölüm 5–8 üç yıldızlı hikâye zaferi: 1"),
   TEXT("Altı kollu iç yansımalı koyu safir optik prizma"),TEXT("rare"),TEXT("all")},
  {TEXT("stellar_core"),TEXT("Yörünge Çekirdeği"),
   TEXT("Haftanın ilk kazanılan Yarık seferi: 1"),
   TEXT("Kırık küre çevresinde üç açık halkalı mavi enerji çekirdeği"),
   TEXT("epic"),TEXT("all")},
  {TEXT("guardian_stamp"),TEXT("Muhafız Damgası"),
   TEXT("Haftanın ilk doğrulanmış dünya patronu galibiyeti: 1"),
   TEXT("Yedi asimetrik köşeli ağır metal ve damgalanmış yıldız"),
   TEXT("legendary"),TEXT("all")},
  {TEXT("constellation_chart"),TEXT("Takımyıldız Levhası"),
   TEXT("Haftanın ilk 3★ Bölüm 5–8 Kademe 2+ Usta Seferi: 1"),
   TEXT("Yedi kale yıldızından oluşan kırık bronz rota levhası"),
   TEXT("legendary"),TEXT("set")}
 };
 return Values;
}

const FStarfortCraftingMaterialInfo*
FStarfortCraftingMaterialCatalog::Find(const FString& Id)
{
 for(const auto& Item:All())if(Id==Item.Id)return &Item;
 return nullptr;
}

bool FStarfortCraftingMaterialCatalog::IsFocus(const FString& Value)
{
 return Value==TEXT("weapon") || Value==TEXT("armor") ||
  Value==TEXT("relic");
}
