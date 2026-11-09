#pragma once
#include "CoreMinimal.h"

/** Immutable human-readable item catalogue keyed by IDs already supported by
 * sfb_starfort_progress. Ownership, enhancements and equipment NEVER originate
 * here: they are authenticated account fields only.
 */
struct FStarfortBagItemInfo
{
 const TCHAR* Id;
 const TCHAR* Label;
 const TCHAR* Slot; // weapon/armor/relic
 const TCHAR* Rarity; // common/epic/legendary
 const TCHAR* SetId; // moon/ember/dawn or empty
 const TCHAR* Description;
 int32 Attack;
 int32 Health;
 int32 Armor;
 int32 Healing;
 int32 ForgeLevel; // 0 = exclusive reward; no forge
};

struct FStarfortBagCatalog
{
 static const TArray<FStarfortBagItemInfo>& All();
 static const FStarfortBagItemInfo* Find(const FString& ItemId);
 static bool IsSlot(const FString& Slot);
 static bool IsHero(const FString& HeroId);
 static FLinearColor RarityColor(const TCHAR* Rarity);
 static FString SlotLabel(const FString& Slot);
};
