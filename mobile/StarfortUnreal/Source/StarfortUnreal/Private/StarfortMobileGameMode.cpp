#include "StarfortMobileGameMode.h"
#include "RoyalGunnerPreviewPawn.h"
#include "StarfortMobilePlayerController.h"
AStarfortMobileGameMode::AStarfortMobileGameMode() {
 DefaultPawnClass = ARoyalGunnerPreviewPawn::StaticClass();
 PlayerControllerClass = AStarfortMobilePlayerController::StaticClass();
}
