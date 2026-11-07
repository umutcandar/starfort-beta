#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "StarfortVillageGameMode.generated.h"

/** Map-specific native village entry, separate from Royal Gunner preview GameMode. */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortVillageGameMode : public AGameModeBase
{
 GENERATED_BODY()
public:
 AStarfortVillageGameMode();
};
