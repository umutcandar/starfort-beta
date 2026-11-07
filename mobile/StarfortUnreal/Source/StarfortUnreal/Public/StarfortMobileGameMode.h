#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "StarfortMobileGameMode.generated.h"
/** Native-only mobile entry, without browser, WebView or streamed web game. */
UCLASS()
class STARFORTUNREAL_API AStarfortMobileGameMode : public AGameModeBase {
 GENERATED_BODY()
public: AStarfortMobileGameMode();
};
