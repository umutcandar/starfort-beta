#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "StarfortFabPreviewHUD.generated.h"

/** Keyboard and mouse-only Editor art-review HUD, never a gameplay overlay. */
UCLASS()
class STARFORTUNREAL_API AStarfortFabPreviewHUD : public AHUD
{
 GENERATED_BODY()
public:
 virtual void DrawHUD() override;
};
