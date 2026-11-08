#include "StarfortMobilePlayerController.h"
#include "StarfortHeroScreen.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortSceneRouter.h"
#include "RoyalGunnerPreviewPawn.h"
#include "Blueprint/UserWidget.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"

void AStarfortMobilePlayerController::BeginPlay()
{
 Super::BeginPlay();
 if(!IsLocalController()) return;
 if(UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if(!Online || !Online->IsSignedIn())
 {
  if(GetWorld()) UGameplayStatics::OpenLevel(GetWorld(),TEXT("/Engine/Maps/Entry"));
  return; // no guest hero trial
 }
 Online->OnProgressReady.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleProgress);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleOnlineError);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleSignedOut);
 ShowHeroScreen();
 Online->LoadProgress();
}

void AStarfortMobilePlayerController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
 if (Online)
 {
  Online->OnProgressReady.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleProgress);
  Online->OnFailure.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleOnlineError);
  Online->OnSignedOut.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleSignedOut);
 }
 if (ActiveHeroScreen)
 {
  ActiveHeroScreen->OnFirePreviewRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleFirePreview);
  ActiveHeroScreen->OnInspectRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleInspectPreview);
  ActiveHeroScreen->OnBackRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleCloseScreen);
  ActiveHeroScreen->OnUpgradeRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleUpgradeRequested);
  ActiveHeroScreen->RemoveFromParent();
  ActiveHeroScreen=nullptr;
 }
 Online=nullptr;
 Super::EndPlay(EndPlayReason);
}

void AStarfortMobilePlayerController::ShowHeroScreen()
{
 if(!IsLocalController() || !Online || !Online->IsSignedIn()) return;
 if(!ActiveHeroScreen)
 {
  TSubclassOf<UStarfortHeroScreen> NativeClass=HeroScreenClass;
  if(!NativeClass) NativeClass=UStarfortHeroScreen::StaticClass();
  ActiveHeroScreen=CreateWidget<UStarfortHeroScreen>(this,NativeClass);
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
 if(GetWorld()) UGameplayStatics::OpenLevel(GetWorld(),TEXT("/Engine/Maps/Entry"));
}
void AStarfortMobilePlayerController::HandleCloseScreen()
{
 HideHeroScreen();
 if(UGameInstance* Instance=GetGameInstance())
  if(UStarfortSceneRouter* Router=Instance->GetSubsystem<UStarfortSceneRouter>())
   Router->OpenVillage();
}
