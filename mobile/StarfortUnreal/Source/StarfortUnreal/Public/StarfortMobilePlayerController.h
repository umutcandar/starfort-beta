#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortMobilePlayerController.generated.h"

class UStarfortHeroScreen;
class UStarfortBagScreen;
class UStarfortOnlineSubsystem;
struct FStarfortProgressSummary;
struct FStarfortMaterialSnapshot;

/**
 * Native iOS/Android UI host. Designer supplies WBP_HeroScreen derived from
 * UStarfortHeroScreen; uses Unreal UMG, not WebView or HTML.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortMobilePlayerController : public APlayerController
{
 GENERATED_BODY()

public:
 virtual void BeginPlay() override;
 virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
 UFUNCTION(BlueprintCallable, Category="STARFORT|Hero") void ShowHeroScreen();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Hero") void HideHeroScreen();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Bag") void ShowBagScreen();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Bag") void HideBagScreen();
 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|UI")
 TSubclassOf<UStarfortBagScreen> BagScreenClass;
 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|UI")
 TSubclassOf<UStarfortHeroScreen> HeroScreenClass;

protected:
 UPROPERTY(Transient, BlueprintReadOnly, Category="STARFORT|UI")
 TObjectPtr<UStarfortHeroScreen> ActiveHeroScreen;
 UPROPERTY(Transient, BlueprintReadOnly, Category="STARFORT|UI")
 TObjectPtr<UStarfortBagScreen> ActiveBagScreen;
 TMap<FString,int32> CachedHeroLevels;
 bool bHasVerifiedProgress=false;
 UPROPERTY(Transient) TObjectPtr<UStarfortOnlineSubsystem> Online;

 UFUNCTION() void HandleBagRequested();
 UFUNCTION() void HandleBagBack();
 UFUNCTION() void HandleBagNavigation(FString Destination);
 UFUNCTION() void HandleBagMutation(FString Action,FString Target,FString Aux);
 UFUNCTION() void HandleMaterialFocusRequested(FString FocusSlot);
 UFUNCTION() void HandleMaterialsReady(const FStarfortMaterialSnapshot& Snapshot);
 UFUNCTION() void HandleMaterialsUnavailable(FString SafeReason);
 UFUNCTION() void HandleFirePreview();
 UFUNCTION() void HandleInspectPreview();
 UFUNCTION() void HandleCloseScreen();
 UFUNCTION() void HandleUpgradeRequested();
 UFUNCTION() void HandleHeroSelection(FString HeroId);
 UFUNCTION() void HandleProgress(const FStarfortProgressSummary& Progress);
 UFUNCTION() void HandleOnlineError(FString SafeReason);
 UFUNCTION() void HandleSignedOut();
};
