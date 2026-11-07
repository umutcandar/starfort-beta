#pragma once
#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "StarfortVisualTheme.generated.h"

/** Shared native UMG colour tokens matching the approved Royal Gunner visual direction.
 * Art assets and authored Widget Blueprints remain separate from this C++ contract.
 */
UCLASS()
class STARFORTUNREAL_API UStarfortVisualTheme : public UBlueprintFunctionLibrary
{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor Gold();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor DeepNavy();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor PanelNavy();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor EnergyBlue();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor Crimson();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static FLinearColor VerifiedPositive();
 UFUNCTION(BlueprintPure, Category="STARFORT|Style") static float MinimumTouchTargetDp();
};
