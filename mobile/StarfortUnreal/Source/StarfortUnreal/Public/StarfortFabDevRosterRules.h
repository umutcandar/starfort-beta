#pragma once

#include "CoreMinimal.h"

/**
 * Pure deterministic selection for the LOCAL source-art reviewer.
 * The actual authenticated server chooses its three heroes; this rule
 * only picks a *different unused* imported Fab actor to stand in visually
 * for the enemy in Development. It NEVER assigns server-side factions.
 */
struct FStarfortFabDevRosterRules
{
 static int32 ChooseUnused(
  const TArray<FName>& SourceHeroIds,
  const TArray<bool>& PreferAsEnemy,
  const TArray<FString>& ServerTeam)
 {
  if (SourceHeroIds.Num()!=PreferAsEnemy.Num() ||
      SourceHeroIds.Num()<4 || ServerTeam.Num()!=3)
   return INDEX_NONE;
  int32 FirstUnused=INDEX_NONE;
  for (int32 I=0;I<SourceHeroIds.Num();++I)
  {
   const FString Id=SourceHeroIds[I].ToString();
   if (Id.IsEmpty() || ServerTeam.Contains(Id)) continue;
   if (FirstUnused==INDEX_NONE) FirstUnused=I;
   if (PreferAsEnemy[I]) return I;
  }
  return FirstUnused;
 }
};
