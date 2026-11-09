#include "StarfortMobilePlayerController.h"
#include "StarfortHeroScreen.h"
#include "StarfortBagScreen.h"
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
  if(GetWorld()) UGameplayStatics::OpenLevel(GetWorld(),FName(TEXT("/Engine/Maps/Entry")));
  return; // no guest hero trial
 }
 Online->OnProgressReady.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleProgress);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleOnlineError);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleSignedOut);
 ShowHeroScreen();
 bool bOpenedBag=false;
 if(UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>())
 {
  if(Router->ConsumeBagRoute())
  {
   ShowBagScreen(); // Bag issues ONE authenticated GET itself.
   bOpenedBag=true;
  }
 }
 if(!bOpenedBag)Online->LoadProgress();
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
  ActiveHeroScreen->OnBagRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleBagRequested);
  ActiveHeroScreen->OnUpgradeRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleUpgradeRequested);
  ActiveHeroScreen->OnHeroSelected.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleHeroSelection);
  ActiveHeroScreen->RemoveFromParent();
  ActiveHeroScreen=nullptr;
 }
 if(ActiveBagScreen)
 {
  ActiveBagScreen->OnBackRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleBagBack);
  ActiveBagScreen->OnNavigationRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleBagNavigation);
  ActiveBagScreen->OnMutationRequested.RemoveDynamic(this,&AStarfortMobilePlayerController::HandleBagMutation);
  ActiveBagScreen->RemoveFromParent();
  ActiveBagScreen=nullptr;
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
  ActiveHeroScreen->OnBagRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleBagRequested);
  ActiveHeroScreen->OnUpgradeRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleUpgradeRequested);
  ActiveHeroScreen->OnHeroSelected.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleHeroSelection);
 }
 if(!ActiveHeroScreen->IsInViewport()) ActiveHeroScreen->AddToViewport();
 // The old unapproved Rovan showroom model must not masquerade as the
 // redesigned cinematic character while the UI uses 2D gallery artwork.
 if(ARoyalGunnerPreviewPawn* OldGunner=Cast<ARoyalGunnerPreviewPawn>(GetPawn()))
  OldGunner->SetActorHiddenInGame(true);
 SetInputMode(FInputModeGameAndUI());
 ActiveHeroScreen->SetWaitingForServer();
}
void AStarfortMobilePlayerController::HideHeroScreen()
{
 if(ActiveHeroScreen&&ActiveHeroScreen->IsInViewport())
  ActiveHeroScreen->RemoveFromParent();
 SetInputMode(FInputModeGameOnly());
}
void AStarfortMobilePlayerController::ShowBagScreen()
{
 if(!IsLocalController() || !Online || !Online->IsSignedIn())return;
 if(!ActiveBagScreen)
 {
  TSubclassOf<UStarfortBagScreen> NativeClass=BagScreenClass;
  if(!NativeClass)NativeClass=UStarfortBagScreen::StaticClass();
  ActiveBagScreen=CreateWidget<UStarfortBagScreen>(this,NativeClass);
  if(!ActiveBagScreen)return;
  ActiveBagScreen->OnBackRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleBagBack);
  ActiveBagScreen->OnNavigationRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleBagNavigation);
  ActiveBagScreen->OnMutationRequested.AddUniqueDynamic(this,&AStarfortMobilePlayerController::HandleBagMutation);
 }
 HideHeroScreen();
 if(!ActiveBagScreen->IsInViewport())ActiveBagScreen->AddToViewport(70);
 ActiveBagScreen->SetWaitingForServer();
 SetInputMode(FInputModeGameAndUI());
 bShowMouseCursor=true;
 // Owned items, levels and resources only come from sfb_starfort_progress.
 // If a freshly authenticated snapshot exists, a new GET will reconcile it.
 if(Online)Online->LoadProgress();
}
void AStarfortMobilePlayerController::HideBagScreen()
{
 if(ActiveBagScreen && ActiveBagScreen->IsInViewport())
  ActiveBagScreen->RemoveFromParent();
}
void AStarfortMobilePlayerController::HandleBagRequested()
{
 ShowBagScreen();
}
void AStarfortMobilePlayerController::HandleBagBack()
{
 HideBagScreen();
 ShowHeroScreen();
 if(ActiveHeroScreen && bHasVerifiedProgress)
  HandleHeroSelection(ActiveHeroScreen->GetSelectedHeroId());
}
void AStarfortMobilePlayerController::HandleBagNavigation(FString Destination)
{
 if(!Online || !Online->IsSignedIn())return;
 UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>();
 if(!Router)return;
 if(Destination==TEXT("village"))Router->OpenVillage();
 else if(Destination==TEXT("battle"))Router->OpenBattle();
 else if(Destination==TEXT("alliance"))Router->OpenAlliance();
}
void AStarfortMobilePlayerController::HandleBagMutation(
 FString Action,FString Target,FString Aux)
{
 if(!Online || !Online->IsSignedIn() ||
    !ActiveBagScreen || !ActiveBagScreen->IsInViewport())return;
 if(Action==TEXT("equip"))Online->EquipGear(Target,Aux);
 else if(Action==TEXT("unequip"))Online->UnequipGear(Target,Aux);
 else if(Action==TEXT("forge"))Online->ForgeGear(Target);
 else if(Action==TEXT("enhance"))Online->EnhanceGear(Target);
 else if(Action==TEXT("ascend"))Online->AscendGear(Target);
}
void AStarfortMobilePlayerController::HandleFirePreview()
{
 // No physically-real 3D rig has passed quality approval. Do not launch the
 // previous low-fidelity Rovan muzzle FX for any redesigned hero.
 if(ActiveHeroScreen && ActiveHeroScreen->TxtHeroArtStatus)
  ActiveHeroScreen->TxtHeroArtStatus->SetText(FText::FromString(
   TEXT("Sinematik 3D savaş animasyonları henüz hazırlanmadı")));
}
void AStarfortMobilePlayerController::HandleInspectPreview()
{
 if(ActiveHeroScreen) ActiveHeroScreen->ToggleHeroArtDetail();
}
void AStarfortMobilePlayerController::HandleUpgradeRequested()
{
 if(Online && Online->IsSignedIn() && ActiveHeroScreen &&
    ActiveHeroScreen->HasVerifiedHero())
  Online->TrainHero(ActiveHeroScreen->GetSelectedHeroId());
}
void AStarfortMobilePlayerController::HandleProgress(
 const FStarfortProgressSummary& Progress)
{
 if(ActiveBagScreen && ActiveBagScreen->IsInViewport())
 {
  if(Progress.bServerVerified && Progress.bInventoryVerified)
   ActiveBagScreen->ApplyVerifiedAccount(Progress);
  else ActiveBagScreen->SetWaitingForServer();
 }
 if(!ActiveHeroScreen) return;
 bHasVerifiedProgress=Progress.bServerVerified;
 if(!bHasVerifiedProgress)
 {
  CachedHeroLevels.Empty();
  ActiveHeroScreen->SetWaitingForServer();
  return;
 }
 CachedHeroLevels=Progress.HeroLevels;
 HandleHeroSelection(ActiveHeroScreen->GetSelectedHeroId());
}

void AStarfortMobilePlayerController::HandleHeroSelection(FString HeroId)
{
 if(!ActiveHeroScreen) return;
 const int32* Level=bHasVerifiedProgress ? CachedHeroLevels.Find(HeroId) : nullptr;
 if(!Online || !Online->IsSignedIn() || !Level)
 {
  ActiveHeroScreen->SetWaitingForServer();
  if(ActiveHeroScreen->TxtConnectionStatus)
   ActiveHeroScreen->TxtConnectionStatus->SetText(FText::FromString(
    TEXT("Bu kahraman için doğrulanmış seviye kaydı yok")));
  return;
 }
 // Selection NEVER unlocks a hero, creates local levels, grants items or
 // changes purchases. Backend RPC is authoritative for any training.
 ActiveHeroScreen->ApplyVerifiedRosterLevel(HeroId,*Level);
}
void AStarfortMobilePlayerController::HandleOnlineError(FString SafeReason)
{
 if(ActiveBagScreen && ActiveBagScreen->IsInViewport())
  ActiveBagScreen->ShowServerFailure(SafeReason);
 if(ActiveHeroScreen)
 {
  ActiveHeroScreen->SetWaitingForServer();
  if(ActiveHeroScreen->TxtConnectionStatus)
   ActiveHeroScreen->TxtConnectionStatus->SetText(FText::FromString(SafeReason));
 }
}
void AStarfortMobilePlayerController::HandleSignedOut()
{
 bHasVerifiedProgress=false;
 CachedHeroLevels.Empty();
 if(ActiveHeroScreen) ActiveHeroScreen->SetWaitingForServer();
 if(ActiveBagScreen) ActiveBagScreen->SetWaitingForServer();
 HideBagScreen();
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
