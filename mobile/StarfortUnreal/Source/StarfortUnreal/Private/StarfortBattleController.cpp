#include "StarfortBattleController.h"
#include "StarfortBattleScreen.h"
#include "StarfortCampaignScreen.h"
#include "StarfortBattleStage.h"
#include "Blueprint/UserWidget.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

void AStarfortBattleController::BeginPlay()
{
 Super::BeginPlay();
 if(!IsLocalController()) return;
 if(UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if(!Online || !Online->IsSignedIn()) return; // no guest battles
 Online->OnProgressReady.AddUniqueDynamic(this,&AStarfortBattleController::ProgressReady);
 Online->OnBattleReady.AddUniqueDynamic(this,&AStarfortBattleController::TurnReady);
 Online->OnMissionResult.AddUniqueDynamic(this,&AStarfortBattleController::MissionFinished);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortBattleController::OnlineFailed);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortBattleController::SignedOut);

 if(BattleScreenClass)
 {
  BattleScreen=CreateWidget<UStarfortBattleScreen>(this,BattleScreenClass);
  if(BattleScreen)
   BattleScreen->OnActionRequested.AddUniqueDynamic(this,&AStarfortBattleController::ActionRequested);
 }
 if(CampaignScreenClass)
 {
  CampaignScreen=CreateWidget<UStarfortCampaignScreen>(this,CampaignScreenClass);
  if(CampaignScreen)
   CampaignScreen->OnStageRequested.AddUniqueDynamic(this,&AStarfortBattleController::StageRequested);
 }
 if(BattleStageClass && GetWorld())
 {
  Stage=GetWorld()->SpawnActor<AStarfortBattleStage>(BattleStageClass,
   FVector::ZeroVector,FRotator::ZeroRotator);
  if(Stage) SetViewTarget(Stage);
 }
 SetInputMode(FInputModeGameAndUI());
 bShowMouseCursor=true;
 OpenCampaign();
 RefreshBattle();
}
void AStarfortBattleController::OpenCampaign()
{
 if(BattleScreen && BattleScreen->IsInViewport()) BattleScreen->RemoveFromParent();
 if(CampaignScreen && !CampaignScreen->IsInViewport()) CampaignScreen->AddToViewport(5);
}
void AStarfortBattleController::ShowBattle()
{
 if(CampaignScreen && CampaignScreen->IsInViewport()) CampaignScreen->RemoveFromParent();
 if(BattleScreen && !BattleScreen->IsInViewport()) BattleScreen->AddToViewport(8);
}
void AStarfortBattleController::RefreshBattle()
{
 if(Online && Online->IsSignedIn())
 {
  if(CampaignScreen) CampaignScreen->SetWaitingForServer();
  if(BattleScreen) BattleScreen->SetWaitingForServer();
  Online->LoadProgress(); // a read-only RPC; never repeats an uncertain mutation
 }
}
void AStarfortBattleController::StageRequested(int32 StageId)
{
 if(Online && Online->IsSignedIn()) Online->StartStoryStage(StageId);
}
void AStarfortBattleController::ActionRequested(FString ActionId)
{
 if(Online && Online->IsSignedIn()) Online->SubmitBattleAction(ActionId);
}
void AStarfortBattleController::ProgressReady(const FStarfortProgressSummary& Progress)
{
 if(CampaignScreen) CampaignScreen->ApplyVerifiedProgress(Progress);
 if(Progress.bInMission) ShowBattle();
 else OpenCampaign();
}
void AStarfortBattleController::TurnReady(const FStarfortVerifiedBattleTurn& Turn)
{
 if(BattleScreen) BattleScreen->ApplyVerifiedTurn(Turn);
 if(Stage) Stage->PresentVerifiedTurn(Turn);
}
void AStarfortBattleController::MissionFinished(bool bWon,int32 Stars)
{
 OpenCampaign();
 if(CampaignScreen) CampaignScreen->ShowResult(bWon,Stars);
 // Reconcile XP, next-stage unlock and rewards by a read-only fetch.
 if(Online) Online->LoadProgress();
}
void AStarfortBattleController::OnlineFailed(FString SafeReason)
{
 // Server may have accepted a timed-out turn: the only safe recovery is GET.
 if(BattleScreen)
 {
  BattleScreen->SetWaitingForServer();
  if(BattleScreen->TxtBattleStatus)
   BattleScreen->TxtBattleStatus->SetText(FText::FromString(SafeReason));
 }
 if(CampaignScreen) CampaignScreen->SetWaitingForServer();
}
void AStarfortBattleController::SignedOut()
{
 if(BattleScreen) {BattleScreen->SetWaitingForServer();BattleScreen->RemoveFromParent();}
 if(CampaignScreen) {CampaignScreen->SetWaitingForServer();CampaignScreen->RemoveFromParent();}
}
