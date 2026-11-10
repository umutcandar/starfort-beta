#pragma once
#include "CoreMinimal.h"

/** V88 seven original collectable materials. Descriptions specify REAL
 * completed mission triggers proposed for deployment, not client RNG.
 * Wallet values always come from authenticated server response only.
 */
struct FStarfortCraftingMaterialInfo
{
 const TCHAR* Id;
 const TCHAR* Name;
 const TCHAR* Source;
 const TCHAR* Shape;
 const TCHAR* Rarity;
 const TCHAR* Family;
};
struct FStarfortCraftingMaterialCatalog
{
 static const TArray<FStarfortCraftingMaterialInfo>& All();
 static const FStarfortCraftingMaterialInfo* Find(const FString& Id);
 static bool IsFocus(const FString& Value);
};
