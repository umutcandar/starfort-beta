#include "StarfortBattleController.h"
#include "StarfortBattleScreen.h"
#include "StarfortCampaignScreen.h"
#include "StarfortBattleStage.h"
#include "Blueprint/UserWidget.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "Kismet/GameplayStatics.h"

void AStarfortBattleController::BeginPlay()
{
 Super::BeginPlay();
 if(!IsLocalController()) return;
 if(UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if(!Online || !Online->IsSignedIn())
 {
  // Directly opened stages and expired sessions must never show an
  // empty world with no controls. Return to the native account-only entry.
  if(GetWorld()) UGameplayStatics::OpenLevel(GetWorld(),FName(TEXT("/Engine/Maps/Entry")));
  return;
 }
 Online->OnProgressReady.AddUniqueDynamic(this,&AStarfortBattleController::ProgressReady);
 Online->OnBattleReady.AddUniqueDynamic(this,&AStarfortBattleController::TurnReady);
 Online->OnMissionResult.AddUniqueDynamic(this,&AStarfortBattleController::MissionFinished);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortBattleController::OnlineFailed);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortBattleController::SignedOut);

 // Blueprint layouts override the native QA bootstrap widgets when available.
 TSubclassOf<UStarfortBattleScreen> NativeBattle=BattleScreenClass;
 if (!NativeBattle) NativeBattle=UStarfortBattleScreen::StaticClass();
 BattleScreen=CreateWidget<UStarfortBattleScreen>(this,NativeBattle);
 if(BattleScreen)
  BattleScreen->OnActionRequested.AddUniqueDynamic(this,&AStarfortBattleController::ActionRequested);

 TSubclassOf<UStarfortCampaignScreen> NativeCampaign=CampaignScreenClass;
 if (!NativeCampaign) NativeCampaign=UStarfortCampaignScreen::StaticClass();
 CampaignScreen=CreateWidget<UStarfortCampaignScreen>(this,NativeCampaign);
 if(CampaignScreen)
  CampaignScreen->OnStageRequested.AddUniqueDynamic(this,&AStarfortBattleController::StageRequested);
 // A level-placed, artist-authored battle stage wins. Otherwise create a
 // native C++ stage so missing Widget Blueprints do not leave a blank camera.
 // The stage itself refuses toy/unapproved meshes and stays empty until art.
 if (GetWorld())
 {
  UClass* Desired=BattleStageClass
   ? BattleStageClass.Get() : AStarfortBattleStage::StaticClass();
  AStarfortBattleStage* FirstPlacedStage=nullptr;
  AStarfortBattleStage* ExactPreferredStage=nullptr;
  int32 ExistingStages=0;
  for (TActorIterator<AStarfortBattleStage> It(GetWorld());It;++It)
  {
   ++ExistingStages;
   if (!FirstPlacedStage) FirstPlacedStage=*It;
   if (It->IsA(Desired)) ExactPreferredStage=*It;
  }
  // A generated .umap can contain the bare C++ stage while a designer
  // subsequently assigns a BP subclass. Never spawn a second renderer
  // over that existing scene: the duplicate camera/FX is a real mobile bug.
  Stage=ExactPreferredStage ? ExactPreferredStage : FirstPlacedStage;
  if (!Stage)
   Stage=GetWorld()->SpawnActor<AStarfortBattleStage>(Desired,
    FVector::ZeroVector,FRotator::ZeroRotator);
  else if (BattleStageClass && !ExactPreferredStage)
   UE_LOG(LogTemp,Warning,
    TEXT("STARFORT: authored stage exists but is not the selected BP class; replace the placed stage instead of duplicating it."));
  if (ExistingStages>1)
   UE_LOG(LogTemp,Error,
    TEXT("STARFORT: multiple battle stage actors found in map; keep only one."));
  if (Stage) SetViewTarget(Stage);
 }
 SetInputMode(FInputModeGameAndUI());
 bShowMouseCursor=true;
 OpenCampaign();
 RefreshBattle();
}
void AStarfortBattleController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
 // A persistent GameInstance must never keep notifying an old level actor.
 if (Online)
 {
  Online->OnProgressReady.RemoveDynamic(this,&AStarfortBattleController::ProgressReady);
  Online->OnBattleReady.RemoveDynamic(this,&AStarfortBattleController::TurnReady);
  Online->OnMissionResult.RemoveDynamic(this,&AStarfortBattleController::MissionFinished);
  Online->OnFailure.RemoveDynamic(this,&AStarfortBattleController::OnlineFailed);
  Online->OnSignedOut.RemoveDynamic(this,&AStarfortBattleController::SignedOut);
 }
 if (BattleScreen)
 {
  BattleScreen->OnActionRequested.RemoveDynamic(this,&AStarfortBattleController::ActionRequested);
  BattleScreen->RemoveFromParent();
  BattleScreen=nullptr;
 }
 if (CampaignScreen)
 {
  CampaignScreen->OnStageRequested.RemoveDynamic(this,&AStarfortBattleController::StageRequested);
  CampaignScreen->RemoveFromParent();
  CampaignScreen=nullptr;
 }
 if (Stage)
 {
  Stage->ClearBattlePresentation();
  Stage=nullptr;
 }
 Online=nullptr;
 Super::EndPlay(EndPlayReason);
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
 else
 {
  if(Stage) Stage->ClearBattlePresentation();
  OpenCampaign();
 }
}
void AStarfortBattleController::TurnReady(const FStarfortVerifiedBattleTurn& Turn)
{
 if(BattleScreen) BattleScreen->ApplyVerifiedTurn(Turn);
 if(Stage) Stage->PresentVerifiedTurn(Turn);
}
void AStarfortBattleController::MissionFinished(bool bWon,int32 Stars)
{
 if(Stage) Stage->ClearBattlePresentation();
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
 if(Stage) Stage->ClearBattlePresentation();
 if(BattleScreen) {BattleScreen->SetWaitingForServer();BattleScreen->RemoveFromParent();}
 if(CampaignScreen) {CampaignScreen->SetWaitingForServer();CampaignScreen->RemoveFromParent();}
 // On token expiration the player must see login rather than a dead arena.
 if(GetWorld()) UGameplayStatics::OpenLevel(GetWorld(),TEXT("/Engine/Maps/Entry"));
}
