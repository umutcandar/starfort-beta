#include "StarfortVillageController.h"
#include "StarfortVillageCameraPawn.h"
#include "StarfortVillageScreen.h"
#include "StarfortLoginScreen.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortSceneRouter.h"
#include "Blueprint/UserWidget.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"

void AStarfortVillageController::BeginPlay()
{
 Super::BeginPlay();
 if (AStarfortVillageCameraPawn* VillagePawn=Cast<AStarfortVillageCameraPawn>(GetPawn()))
  VillagePawn->OnBuildingSelected.AddUniqueDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
 if (!IsLocalController()) return;
 if (UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if (!Online)
 {
  UE_LOG(LogTemp, Error, TEXT("STARFORT native online subsystem missing"));
  return;
 }
 Online->OnSignedIn.AddUniqueDynamic(this,&AStarfortVillageController::HandleSignedIn);
 Online->OnSignedOut.AddUniqueDynamic(this,&AStarfortVillageController::HandleSignedOut);
 Online->OnVillageReady.AddUniqueDynamic(this,&AStarfortVillageController::HandleVillageSnapshot);
 Online->OnFailure.AddUniqueDynamic(this,&AStarfortVillageController::HandleOnlineFailure);
 if (UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>())
  Router->OnRouteUnavailable.AddUniqueDynamic(this,&AStarfortVillageController::HandleRouteUnavailable);
 if (Online->IsSignedIn()) HandleSignedIn(Online->GetUserId());
 else OpenLoginScreen();
}
void AStarfortVillageController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
 // Online is a GameInstance subsystem and survives OpenLevel. Detaching
 // callbacks here prevents destroyed village screens from receiving combat
 // events or a future signed-in player's village data.
 if (Online)
 {
  Online->OnSignedIn.RemoveDynamic(this,&AStarfortVillageController::HandleSignedIn);
  Online->OnSignedOut.RemoveDynamic(this,&AStarfortVillageController::HandleSignedOut);
  Online->OnVillageReady.RemoveDynamic(this,&AStarfortVillageController::HandleVillageSnapshot);
  Online->OnFailure.RemoveDynamic(this,&AStarfortVillageController::HandleOnlineFailure);
 }
 if (UGameInstance* Instance=GetGameInstance())
 {
  if (UStarfortSceneRouter* Router=Instance->GetSubsystem<UStarfortSceneRouter>())
   Router->OnRouteUnavailable.RemoveDynamic(this,&AStarfortVillageController::HandleRouteUnavailable);
 }
 if (AStarfortVillageCameraPawn* Pawn=Cast<AStarfortVillageCameraPawn>(GetPawn()))
  Pawn->OnBuildingSelected.RemoveDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
 if (ActiveVillageScreen)
 {
  ActiveVillageScreen->OnUpgradeRequested.RemoveDynamic(this,&AStarfortVillageController::HandleUpgradeRequested);
  ActiveVillageScreen->OnHeroesRequested.RemoveDynamic(this,&AStarfortVillageController::HandleHeroesRequested);
  ActiveVillageScreen->OnBattlesRequested.RemoveDynamic(this,&AStarfortVillageController::HandleBattlesRequested);
  ActiveVillageScreen->OnAllianceRequested.RemoveDynamic(this,&AStarfortVillageController::HandleAllianceRequested);
  ActiveVillageScreen->OnRefreshRequested.RemoveDynamic(this,&AStarfortVillageController::RefreshVillage);
  ActiveVillageScreen->OnSignOutRequested.RemoveDynamic(this,&AStarfortVillageController::HandleLogoutRequested);
  ActiveVillageScreen->RemoveFromParent();
  ActiveVillageScreen=nullptr;
 }
 if (ActiveLoginScreen)
 {
  ActiveLoginScreen->RemoveFromParent();
  ActiveLoginScreen=nullptr;
 }
 Online=nullptr;
 Super::EndPlay(EndPlayReason);
}

void AStarfortVillageController::OnPossess(APawn* InPawn)
{
 Super::OnPossess(InPawn);
 if (AStarfortVillageCameraPawn* VillagePawn=Cast<AStarfortVillageCameraPawn>(InPawn))
  VillagePawn->OnBuildingSelected.AddUniqueDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
}
void AStarfortVillageController::OpenLoginScreen()
{
 if (!IsLocalController()) return;
 if (!ActiveLoginScreen)
 {
  TSubclassOf<UStarfortLoginScreen> NativeClass=LoginScreenClass;
  if (!NativeClass) NativeClass=UStarfortLoginScreen::StaticClass();
  ActiveLoginScreen=CreateWidget<UStarfortLoginScreen>(this,NativeClass);
 }
 if (ActiveLoginScreen && !ActiveLoginScreen->IsInViewport())
 {
  ActiveLoginScreen->AddToViewport(90);
  SetInputMode(FInputModeUIOnly());
  bShowMouseCursor=true;
  if (AStarfortVillageCameraPawn* Pawn=Cast<AStarfortVillageCameraPawn>(GetPawn()))
   Pawn->SetWorldInteractionEnabled(false);
 }
}
void AStarfortVillageController::OpenVillageScreen()
{
 if (!IsLocalController() || !Online || !Online->IsSignedIn())
  return;
 if (!ActiveVillageScreen)
 {
  TSubclassOf<UStarfortVillageScreen> NativeClass=VillageScreenClass;
  if (!NativeClass) NativeClass=UStarfortVillageScreen::StaticClass();
  ActiveVillageScreen=CreateWidget<UStarfortVillageScreen>(this,NativeClass);
  if (!ActiveVillageScreen) return;
  ActiveVillageScreen->OnUpgradeRequested.AddUniqueDynamic(
   this,&AStarfortVillageController::HandleUpgradeRequested);
  ActiveVillageScreen->OnHeroesRequested.AddUniqueDynamic(this,&AStarfortVillageController::HandleHeroesRequested);
  ActiveVillageScreen->OnBattlesRequested.AddUniqueDynamic(this,&AStarfortVillageController::HandleBattlesRequested);
  ActiveVillageScreen->OnAllianceRequested.AddUniqueDynamic(this,&AStarfortVillageController::HandleAllianceRequested);
  ActiveVillageScreen->OnRefreshRequested.AddUniqueDynamic(this,&AStarfortVillageController::RefreshVillage);
  ActiveVillageScreen->OnSignOutRequested.AddUniqueDynamic(this,&AStarfortVillageController::HandleLogoutRequested);
 }
 if (!ActiveVillageScreen->IsInViewport()) ActiveVillageScreen->AddToViewport();
 SetInputMode(FInputModeGameAndUI());
 bShowMouseCursor=true;
 if (AStarfortVillageCameraPawn* Pawn=Cast<AStarfortVillageCameraPawn>(GetPawn()))
  Pawn->SetWorldInteractionEnabled(true);
 ActiveVillageScreen->SetWaitingForServer();
}
void AStarfortVillageController::RefreshVillage()
{
 if (Online && Online->IsSignedIn())
 {
  if (ActiveVillageScreen) ActiveVillageScreen->SetWaitingForServer();
  Online->LoadVillage();
 }
}
void AStarfortVillageController::HandleSignedIn(FString UserId)
{
 if (ActiveLoginScreen && ActiveLoginScreen->IsInViewport())
  ActiveLoginScreen->RemoveFromParent();
 OpenVillageScreen();
 RefreshVillage();
 // Reuse the original account progression RPC; future hero roster UI subscribes
 // to the resulting OnProgressReady event rather than fabricating stats.
 if (Online) Online->LoadProgress();
}
void AStarfortVillageController::HandleSignedOut()
{
 if (ActiveVillageScreen)
 {
  ActiveVillageScreen->SetWaitingForServer();
  ActiveVillageScreen->RemoveFromParent();
 }
 OpenLoginScreen();
}
void AStarfortVillageController::HandleVillageSnapshot(const FStarfortVerifiedVillage& Snapshot)
{
 if (ActiveVillageScreen) ActiveVillageScreen->ApplyVerifiedVillage(Snapshot);
}
void AStarfortVillageController::HandleOnlineFailure(FString SafeReason)
{
 // A failed upgrade must never optimistically level the building or deduct
 // currency. Force a fresh GET before allowing another mutation.
 if (ActiveVillageScreen) ActiveVillageScreen->SetWaitingForServer();
 UE_LOG(LogTemp, Warning, TEXT("STARFORT native request rejected; awaiting explicit refresh"));
}
void AStarfortVillageController::HandleBuildingTapped(FName BuildingId)
{
 if (!Online || !Online->IsSignedIn() || !ActiveVillageScreen || BuildingId.IsNone()) return;
 ActiveVillageScreen->FocusBuilding(BuildingId);
 ActiveVillageScreen->RequestBuildingDetails(BuildingId);
}
void AStarfortVillageController::HandleUpgradeRequested(FName BuildingId)
{
 if (!Online || !Online->IsSignedIn() || BuildingId.IsNone()) return;
 Online->RequestVillageUpgrade(BuildingId);
}

void AStarfortVillageController::HandleHeroesRequested()
{
 if (UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>())
  Router->OpenHeroHall();
}
void AStarfortVillageController::HandleBattlesRequested()
{
 if (UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>())
  Router->OpenBattle();
}
void AStarfortVillageController::HandleAllianceRequested()
{
 if (UStarfortSceneRouter* Router=GetGameInstance()->GetSubsystem<UStarfortSceneRouter>())
  Router->OpenAlliance();
}
void AStarfortVillageController::HandleRouteUnavailable(FString SafeReason)
{
 if (ActiveVillageScreen && ActiveVillageScreen->TxtConnectionStatus)
  ActiveVillageScreen->TxtConnectionStatus->SetText(FText::FromString(SafeReason));
}

void AStarfortVillageController::HandleLogoutRequested()
{
 if (Online) Online->SignOut();
}
