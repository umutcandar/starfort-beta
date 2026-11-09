#include "StarfortFabPreviewGameMode.h"
#include "StarfortFabPreviewController.h"
#include "StarfortFabPreviewHUD.h"
#include "GameFramework/SpectatorPawn.h"

AStarfortFabPreviewGameMode::AStarfortFabPreviewGameMode()
{
 DefaultPawnClass=ASpectatorPawn::StaticClass();
 PlayerControllerClass=AStarfortFabPreviewController::StaticClass();
 HUDClass=AStarfortFabPreviewHUD::StaticClass();
}
