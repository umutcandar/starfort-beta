#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortMobilePlayerController.generated.h"

class UStarfortHeroScreen;
class UStarfortOnlineSubsystem;
struct FStarfortProgressSummary;

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
 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|UI")
 TSubclassOf<UStarfortHeroScreen> HeroScreenClass;

protected:
 UPROPERTY(Transient, BlueprintReadOnly, Category="STARFORT|UI")
 TObjectPtr<UStarfortHeroScreen> ActiveHeroScreen;
 TMap<FString,int32> CachedHeroLevels;
 bool bHasVerifiedProgress=false;
 UPROPERTY(Transient) TObjectPtr<UStarfortOnlineSubsystem> Online;

 UFUNCTION() void HandleFirePreview();
 UFUNCTION() void HandleInspectPreview();
 UFUNCTION() void HandleCloseScreen();
 UFUNCTION() void HandleUpgradeRequested();
 UFUNCTION() void HandleHeroSelection(FString HeroId);
 UFUNCTION() void HandleProgress(const FStarfortProgressSummary& Progress);
 UFUNCTION() void HandleOnlineError(FString SafeReason);
 UFUNCTION() void HandleSignedOut();
};
