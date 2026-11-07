#include "StarfortVillageController.h"
#include "StarfortVillageCameraPawn.h"
#include "StarfortVillageScreen.h"
#include "StarfortLoginScreen.h"
#include "StarfortOnlineSubsystem.h"
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
 if (Online->IsSignedIn()) HandleSignedIn(Online->GetUserId());
 else OpenLoginScreen();
}
void AStarfortVillageController::OnPossess(APawn* InPawn)
{
 Super::OnPossess(InPawn);
 if (AStarfortVillageCameraPawn* VillagePawn=Cast<AStarfortVillageCameraPawn>(InPawn))
  VillagePawn->OnBuildingSelected.AddUniqueDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
}
void AStarfortVillageController::OpenLoginScreen()
{
 if (!IsLocalController() || !LoginScreenClass) return;
 if (!ActiveLoginScreen)
  ActiveLoginScreen=CreateWidget<UStarfortLoginScreen>(this,LoginScreenClass);
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
 if (!IsLocalController() || !Online || !Online->IsSignedIn() || !VillageScreenClass)
  return;
 if (!ActiveVillageScreen)
 {
  ActiveVillageScreen=CreateWidget<UStarfortVillageScreen>(this,VillageScreenClass);
  if (!ActiveVillageScreen) return;
  ActiveVillageScreen->OnUpgradeRequested.AddUniqueDynamic(
   this,&AStarfortVillageController::HandleUpgradeRequested);
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
