#pragma once
#include "CoreMinimal.h"

/** Display-only CURRENT LIVE server recipes. The actual Supabase RPC
 * validates all purchases and spends. Planned fragment drops are excluded.
 */
struct FStarfortGearResourceCost
{
 int32 Gold=0;
 int32 Wood=0;
 int32 Stone=0;
 int32 Essence=0;
 bool bAvailable=false;
 FString ToTurkishLabel() const;
};

struct FStarfortGearEconomy
{
 static FStarfortGearResourceCost CurrentForgeCost(const FString& ItemId);
 static FStarfortGearResourceCost NextMasteryCost(
  const FString& ItemId,int32 CurrentRank);
 static FString CurrentAcquisition(const FString& ItemId);
 static bool CurrentAscension(const FString& ItemId,
  int32 NextRank,int32& RequiredUniqueBossWeeks,
  FStarfortGearResourceCost& OutCost);
};
