#include "StarfortVillageGameMode.h"
#include "StarfortVillageCameraPawn.h"
#include "StarfortVillageController.h"

AStarfortVillageGameMode::AStarfortVillageGameMode()
{
 DefaultPawnClass=AStarfortVillageCameraPawn::StaticClass();
 PlayerControllerClass=AStarfortVillageController::StaticClass();
}
