#include "StarfortMobilePlayerController.h"
#include "StarfortHeroScreen.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortSceneRouter.h"
#include "RoyalGunnerPreviewPawn.h"
#include "Blueprint/UserWidget.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"

void AStarfortMobilePlayerController::BeginPlay()
{
 Super::BeginPlay();
 if(!IsLocalController()) return;
 if(UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if(!Online || !Online->IsSignedIn()) return; // no guest hero trial
 Online->OnProgressReady.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleProgress);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleOnlineError);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleSignedOut);
 if(HeroScreenClass)
 {
  ShowHeroScreen();
  Online->LoadProgress();
 }
 else UE_LOG(LogTemp,Warning,TEXT("STARFORT: supply native WBP_HeroScreen in PlayerController Blueprint."));
}

void AStarfortMobilePlayerController::ShowHeroScreen()
{
 if(!HeroScreenClass || !IsLocalController() || !Online || !Online->IsSignedIn()) return;
 if(!ActiveHeroScreen)
 {
  ActiveHeroScreen=CreateWidget<UStarfortHeroScreen>(this,HeroScreenClass);
  if(!ActiveHeroScreen) return;
  ActiveHeroScreen->OnFirePreviewRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleFirePreview);
  ActiveHeroScreen->OnInspectRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleInspectPreview);
  ActiveHeroScreen->OnBackRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleCloseScreen);
  ActiveHeroScreen->OnUpgradeRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleUpgradeRequested);
 }
 if(!ActiveHeroScreen->IsInViewport()) ActiveHeroScreen->AddToViewport();
 SetInputMode(FInputModeGameAndUI());
 ActiveHeroScreen->SetWaitingForServer();
}
void AStarfortMobilePlayerController::HideHeroScreen()
{
 if(ActiveHeroScreen&&ActiveHeroScreen->IsInViewport())
  ActiveHeroScreen->RemoveFromParent();
 SetInputMode(FInputModeGameOnly());
}
void AStarfortMobilePlayerController::HandleFirePreview()
{
 if(ARoyalGunnerPreviewPawn* Gunner=Cast<ARoyalGunnerPreviewPawn>(GetPawn()))
  Gunner->FireEnergyCannon(); // showroom only; NEVER applies remote damage
}
void AStarfortMobilePlayerController::HandleInspectPreview()
{
 if(ARoyalGunnerPreviewPawn* Gunner=Cast<ARoyalGunnerPreviewPawn>(GetPawn()))
  Gunner->ResetCamera();
}
void AStarfortMobilePlayerController::HandleUpgradeRequested()
{
 if(Online&&Online->IsSignedIn()) Online->TrainHero(TEXT("rovan"));
}
void AStarfortMobilePlayerController::HandleProgress(const FStarfortProgressSummary& Progress)
{
 if(!ActiveHeroScreen) return;
 const int32* Level=Progress.HeroLevels.Find(TEXT("rovan"));
 if(!Progress.bServerVerified || !Level)
 {
  ActiveHeroScreen->SetWaitingForServer();
  return;
 }
 // Do not manufacture attack, defence, shard or rarity values from level.
 ActiveHeroScreen->ApplyVerifiedRosterLevel(TEXT("rovan"),*Level);
}
void AStarfortMobilePlayerController::HandleOnlineError(FString SafeReason)
{
 if(ActiveHeroScreen)
 {
  ActiveHeroScreen->SetWaitingForServer();
  if(ActiveHeroScreen->TxtConnectionStatus)
   ActiveHeroScreen->TxtConnectionStatus->SetText(FText::FromString(SafeReason));
 }
}
void AStarfortMobilePlayerController::HandleSignedOut()
{
 if(ActiveHeroScreen) ActiveHeroScreen->SetWaitingForServer();
 HideHeroScreen();
}
void AStarfortMobilePlayerController::HandleCloseScreen()
{
 HideHeroScreen();
 if(UGameInstance* Instance=GetGameInstance())
  if(UStarfortSceneRouter* Router=Instance->GetSubsystem<UStarfortSceneRouter>())
   Router->OpenVillage();
}
