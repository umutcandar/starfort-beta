#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortBattleController.generated.h"

class UStarfortBattleScreen;
class UStarfortCampaignScreen;
class AStarfortBattleStage;

/** Real native battle/campaign flow. No local reward simulation. */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortBattleController : public APlayerController
{
 GENERATED_BODY()
public:
 virtual void BeginPlay() override;
 UPROPERTY(EditDefaultsOnly,BlueprintReadWrite,Category="STARFORT|Screens")
 TSubclassOf<UStarfortBattleScreen> BattleScreenClass;
 UPROPERTY(EditDefaultsOnly,BlueprintReadWrite,Category="STARFORT|Screens")
 TSubclassOf<UStarfortCampaignScreen> CampaignScreenClass;
 UPROPERTY(EditDefaultsOnly,BlueprintReadWrite,Category="STARFORT|Combat")
 TSubclassOf<AStarfortBattleStage> BattleStageClass;
 UFUNCTION(BlueprintCallable,Category="STARFORT|Battle")
 void OpenCampaign();
 UFUNCTION(BlueprintCallable,Category="STARFORT|Battle")
 void RefreshBattle();

private:
 UPROPERTY(Transient) TObjectPtr<UStarfortOnlineSubsystem> Online;
 UPROPERTY(Transient) TObjectPtr<UStarfortBattleScreen> BattleScreen;
 UPROPERTY(Transient) TObjectPtr<UStarfortCampaignScreen> CampaignScreen;
 UPROPERTY(Transient) TObjectPtr<AStarfortBattleStage> Stage;
 UFUNCTION() void StageRequested(int32 StageId);
 UFUNCTION() void ActionRequested(FString ActionId);
 UFUNCTION() void ProgressReady(const FStarfortProgressSummary& Progress);
 UFUNCTION() void TurnReady(const FStarfortVerifiedBattleTurn& Turn);
 UFUNCTION() void MissionFinished(bool bWon,int32 Stars);
 UFUNCTION() void OnlineFailed(FString SafeReason);
 UFUNCTION() void SignedOut();
 void ShowBattle();
};
