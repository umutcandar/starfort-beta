#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "StarfortSceneRouter.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortRouteUnavailable, FString, SafeReason);

/** Native level router for the village, hero hall and combat arena.
 * Prevents navigating to missing .umap assets. No WebView/HTML fallback.
 */
UCLASS(Config=Game)
class STARFORTUNREAL_API UStarfortSceneRouter : public UGameInstanceSubsystem
{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintCallable, Category="STARFORT|Navigation") bool OpenVillage();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Navigation") bool OpenHeroHall();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Navigation") bool OpenBag();
 /** Consumed by the actual native hero hall controller once, never persisted. */
 bool ConsumeBagRoute();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Navigation") bool OpenBattle();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Navigation") bool OpenAlliance();
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Navigation")
 FStarfortRouteUnavailable OnRouteUnavailable;
private:
 bool bBagRouteRequested=false;
 bool OpenIfInstalled(const FString& MapPath);
};
