#include "StarfortVillageController.h"
#include "StarfortVillageCameraPawn.h"
#include "StarfortVillageScreen.h"
#include "Blueprint/UserWidget.h"

void AStarfortVillageController::BeginPlay()
{
 Super::BeginPlay();
 if (IsLocalController()) OpenVillageScreen();
 if (AStarfortVillageCameraPawn* VillagePawn=Cast<AStarfortVillageCameraPawn>(GetPawn()))
  VillagePawn->OnBuildingSelected.AddUniqueDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
}

void AStarfortVillageController::OnPossess(APawn* InPawn)
{
 Super::OnPossess(InPawn);
 if (AStarfortVillageCameraPawn* VillagePawn=Cast<AStarfortVillageCameraPawn>(InPawn))
  VillagePawn->OnBuildingSelected.AddUniqueDynamic(this,&AStarfortVillageController::HandleBuildingTapped);
}

void AStarfortVillageController::OpenVillageScreen()
{
 if (!IsLocalController() || !VillageScreenClass) return;
 if (!ActiveVillageScreen)
 {
  ActiveVillageScreen=CreateWidget<UStarfortVillageScreen>(this,VillageScreenClass);
  if (!ActiveVillageScreen) return;
 }
 if (!ActiveVillageScreen->IsInViewport()) ActiveVillageScreen->AddToViewport();
 SetInputMode(FInputModeGameAndUI());
 bShowMouseCursor = true;
 ActiveVillageScreen->SetWaitingForServer();
}

void AStarfortVillageController::HandleBuildingTapped(FName BuildingId)
{
 if (!ActiveVillageScreen || BuildingId.IsNone()) return;
 ActiveVillageScreen->FocusBuilding(BuildingId);
 ActiveVillageScreen->RequestBuildingDetails(BuildingId);
}
