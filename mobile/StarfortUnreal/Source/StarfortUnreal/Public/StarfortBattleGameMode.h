#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "StarfortBattleGameMode.generated.h"

/** Native battle map GameMode — 3D arena is an authored world actor. */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortBattleGameMode : public AGameModeBase
{
 GENERATED_BODY()
public: AStarfortBattleGameMode();
};
