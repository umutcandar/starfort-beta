#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "RoyalGunnerPreviewPawn.generated.h"

class USceneComponent;
class USkeletalMeshComponent;
class UStaticMeshComponent;
class UNiagaraComponent;
class UNiagaraSystem;
class USpringArmComponent;
class UCameraComponent;
class UAnimMontage;

/** Real skeletal hero inspector on iOS/Android (native UE scene).
 * Quality gate deliberately rejects non-skinned or incomplete placeholders.
 * Visual only. No local combat rewards or fabricated server-side progression.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API ARoyalGunnerPreviewPawn : public APawn
{
 GENERATED_BODY()
public:
 ARoyalGunnerPreviewPawn();
 virtual void BeginPlay() override;
 virtual void Tick(float DeltaSeconds) override;
 virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

 UFUNCTION(BlueprintCallable, Category="STARFORT|Showroom") void FireEnergyCannon();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Showroom") void ResetCamera();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Showroom") void Orbit(float HorizontalDelta);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Showroom") void Zoom(float Delta);
 UFUNCTION(BlueprintPure, Category="STARFORT|Quality")
 bool HasApprovedAssets() const { return bAssetsReady; }

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<USceneComponent> SceneRoot;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<USkeletalMeshComponent> HeroBody;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<UStaticMeshComponent> RoyalCannon;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<UNiagaraComponent> MuzzleFlash;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<USpringArmComponent> CameraArm;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Components")
 TObjectPtr<UCameraComponent> ShowcaseCamera;

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Animation")
 TObjectPtr<UAnimMontage> ShotMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Effects")
 TObjectPtr<UNiagaraSystem> MuzzleSystem;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Rig")
 FName WeaponSocketName = TEXT("weapon_r");
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Rig")
 FName MuzzleSocketName = TEXT("muzzle");

protected:
 void OrbitAxis(float Value);
 void ZoomAxis(float Value);
 void UpdateTouchInput();
private:
 bool bAssetsReady = false;
 bool bHadTouch = false;
 bool bHadPinch = false;
 FVector2D LastTouch = FVector2D::ZeroVector;
 float LastPinchDistance = 0.f;
};
