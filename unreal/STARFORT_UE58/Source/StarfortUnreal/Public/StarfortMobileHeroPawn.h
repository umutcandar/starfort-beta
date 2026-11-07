#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "StarfortMobileHeroPawn.generated.h"

class UCameraComponent;
class USpringArmComponent;
class USkeletalMeshComponent;
class USceneComponent;

/**
 * Native touch-controlled hero viewer; only a real skinned asset may be assigned.
 * Empty mesh is a visible failure, never replaced with low-poly dummy geometry.
 * Combat/economy/account authority is intentionally out of this preview pawn.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortMobileHeroPawn : public APawn
{
    GENERATED_BODY()

public:
    AStarfortMobileHeroPawn();
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Camera")
    TObjectPtr<USceneComponent> Pivot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Hero")
    TObjectPtr<USkeletalMeshComponent> HeroMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Camera")
    TObjectPtr<USpringArmComponent> SpringArm;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Camera")
    TObjectPtr<UCameraComponent> Camera;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero")
    bool bOrbitTouchEnabled = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero")
    float OrbitSensitivity = 0.16f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Camera", meta=(ClampMin="160", ClampMax="750"))
    float MinZoom = 220.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Camera", meta=(ClampMin="160", ClampMax="750"))
    float MaxZoom = 500.f;

private:
    bool bTouchWasHeld = false;
    FVector2D LastTouch = FVector2D::ZeroVector;
    float LastPinchDistance = 0.f;
};
