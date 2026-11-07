#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "StarfortVillageCameraPawn.generated.h"

class USceneComponent;
class USpringArmComponent;
class UCameraComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortBuildingSelection, FName, BuildingId);

/** Native touch-first isometric camera: drag to pan, pinch to zoom, tap to inspect.
 * Selection produces only a building ID; all upgrades/rewards are server-owned.
 * Input is constrained to the unoccluded centre of the mobile viewport.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortVillageCameraPawn : public APawn
{
 GENERATED_BODY()
public:
 AStarfortVillageCameraPawn();
 virtual void Tick(float DeltaSeconds) override;
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void PanByScreenDelta(float DeltaX, float DeltaY);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void ZoomBy(float Delta);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void SetWorldInteractionEnabled(bool bEnabled);
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortBuildingSelection OnBuildingSelected;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Village")
 TObjectPtr<USceneComponent> CameraRoot;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Village")
 TObjectPtr<USpringArmComponent> CameraArm;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Village")
 TObjectPtr<UCameraComponent> VillageCamera;

protected:
 virtual void BeginPlay() override;

private:
 void ReadTouchGestures();
 void TryPickBuilding(const FVector2D& ScreenPosition);
 bool IsWorldStagePosition(const FVector2D& ScreenPosition) const;
 bool bWorldInteractionEnabled = true;
 bool bSingleTouchActive = false;
 bool bPinchActive = false;
 FVector2D LastTouch = FVector2D::ZeroVector;
 FVector2D TouchOrigin = FVector2D::ZeroVector;
 float DragDistance = 0.f;
 float LastPinchDistance = 0.f;
};
