#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "StarfortFabPreviewGameMode.generated.h"

/** Offline cinematic model inspector only; never the online STARFORT game. */
UCLASS()
class STARFORTUNREAL_API AStarfortFabPreviewGameMode : public AGameModeBase
{
 GENERATED_BODY()
public:
 AStarfortFabPreviewGameMode();
};
