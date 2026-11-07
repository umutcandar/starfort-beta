#include "StarfortBattleGameMode.h"
#include "StarfortBattleController.h"
#include "GameFramework/SpectatorPawn.h"

AStarfortBattleGameMode::AStarfortBattleGameMode()
{
 DefaultPawnClass=ASpectatorPawn::StaticClass();
 PlayerControllerClass=AStarfortBattleController::StaticClass();
}
