#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortCampaignScreen.generated.h"

class UButton;
class UTextBlock;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortStageRequested, int32, Stage);

/** Eight-chapter server-owned campaign UI. Never invents stars or stage unlocks.
 * Native UMG Widget Blueprint supplies the premium gold/navy graphics.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API UStarfortCampaignScreen : public UUserWidget
{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintCallable,Category="STARFORT|Campaign")
 void ApplyVerifiedProgress(const FStarfortProgressSummary& Progress);
 UFUNCTION(BlueprintCallable,Category="STARFORT|Campaign")
 void SetWaitingForServer();
 UFUNCTION(BlueprintCallable,Category="STARFORT|Campaign")
 void ShowResult(bool bWon,int32 Stars);
 UFUNCTION(BlueprintCallable,Category="STARFORT|Campaign")
 bool RequestStage(int32 Stage);

 UPROPERTY(BlueprintAssignable,Category="STARFORT|Campaign")
 FStarfortStageRequested OnStageRequested;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UTextBlock> TxtStatus;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UTextBlock> TxtStarTotal;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UTextBlock> TxtResult;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage1;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage2;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage3;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage4;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage5;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage6;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage7;
 UPROPERTY(meta=(BindWidgetOptional),BlueprintReadOnly) TObjectPtr<UButton> BtnStage8;
protected:
 virtual void NativeOnInitialized() override;
private:
 UFUNCTION() void Stage1(); UFUNCTION() void Stage2();
 UFUNCTION() void Stage3(); UFUNCTION() void Stage4();
 UFUNCTION() void Stage5(); UFUNCTION() void Stage6();
 UFUNCTION() void Stage7(); UFUNCTION() void Stage8();
 void RefreshButtons();
 bool bVerified=false;
 bool bPending=false;
 bool bInMission=false;
 int32 HighestUnlocked=1;
 TArray<TObjectPtr<UButton>> StageButtons;
};
