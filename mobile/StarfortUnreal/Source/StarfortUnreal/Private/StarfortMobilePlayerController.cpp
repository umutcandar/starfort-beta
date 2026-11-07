#include "StarfortMobilePlayerController.h"
#include "StarfortHeroScreen.h"
#include "RoyalGunnerPreviewPawn.h"
#include "Blueprint/UserWidget.h"

void AStarfortMobilePlayerController::BeginPlay()
{
 Super::BeginPlay();
 // An explicit native UMG Blueprint is required to show the hero UI.
 if (HeroScreenClass) ShowHeroScreen();
 else UE_LOG(LogTemp, Warning, TEXT("STARFORT: assign WBP_HeroScreen in BP_StarfortMobilePlayerController."));
}

void AStarfortMobilePlayerController::ShowHeroScreen()
{
 if (!HeroScreenClass || !IsLocalController()) return;
 if (!ActiveHeroScreen)
 {
  ActiveHeroScreen = CreateWidget<UStarfortHeroScreen>(this, HeroScreenClass);
  if (!ActiveHeroScreen) return;
  ActiveHeroScreen->OnFirePreviewRequested.AddDynamic(this, &AStarfortMobilePlayerController::HandleFirePreview);
  ActiveHeroScreen->OnInspectRequested.AddDynamic(this, &AStarfortMobilePlayerController::HandleInspectPreview);
  ActiveHeroScreen->OnBackRequested.AddDynamic(this, &AStarfortMobilePlayerController::HandleCloseScreen);
 }
 if (!ActiveHeroScreen->IsInViewport()) ActiveHeroScreen->AddToViewport();
 // Snapshot remains unverified until a signed-in API response is explicitly applied.
 ActiveHeroScreen->SetWaitingForServer();
}

void AStarfortMobilePlayerController::HideHeroScreen()
{
 if (ActiveHeroScreen && ActiveHeroScreen->IsInViewport())
  ActiveHeroScreen->RemoveFromParent();
}

void AStarfortMobilePlayerController::HandleFirePreview()
{
 if (ARoyalGunnerPreviewPawn* Gunner = Cast<ARoyalGunnerPreviewPawn>(GetPawn()))
  Gunner->FireEnergyCannon();
}

void AStarfortMobilePlayerController::HandleInspectPreview()
{
 if (ARoyalGunnerPreviewPawn* Gunner = Cast<ARoyalGunnerPreviewPawn>(GetPawn()))
  Gunner->ResetCamera();
}

void AStarfortMobilePlayerController::HandleCloseScreen()
{
 HideHeroScreen();
}
