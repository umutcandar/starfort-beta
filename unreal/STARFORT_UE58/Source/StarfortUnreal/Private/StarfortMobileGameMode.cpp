#include "StarfortMobileGameMode.h"
#include "StarfortMobileHeroPawn.h"

AStarfortMobileGameMode::AStarfortMobileGameMode()
{
    DefaultPawnClass = AStarfortMobileHeroPawn::StaticClass();
}
