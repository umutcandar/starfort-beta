#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "StarfortBattleStage.generated.h"

class USceneComponent;
class USkeletalMeshComponent;
class UStaticMeshComponent;
class USpringArmComponent;
class UCameraComponent;
class UNiagaraComponent;
class UNiagaraSystem;
class UAnimMontage;
struct FStarfortVerifiedBattleTurn;

/** Native cinematic 3D scene presenter. Cannot calculate/award combat results.
 * It renders only artist-approved rigged meshes and server-confirmed actions.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortBattleStage : public AActor
{
 GENERATED_BODY()
public:
 AStarfortBattleStage();
 virtual void BeginPlay() override;
 virtual void Tick(float DeltaTime) override;

 UFUNCTION(BlueprintCallable, Category="STARFORT|Combat")
 void PresentVerifiedTurn(const FStarfortVerifiedBattleTurn& Snapshot);
 UFUNCTION(BlueprintPure, Category="STARFORT|Combat")
 bool HasApprovedStage() const;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<USceneComponent> StageRoot;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<USkeletalMeshComponent> HeroRig;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<USkeletalMeshComponent> EnemyRig;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<UStaticMeshComponent> HeroWeapon;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<UNiagaraComponent> ConfirmedImpactFX;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<USpringArmComponent> CinemaArm;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage") TObjectPtr<UCameraComponent> CinemaCamera;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Quality") bool bArtApprovedForMobile = false;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UAnimMontage> VerifiedShotMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UAnimMontage> GuardMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UAnimMontage> FeintMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UAnimMontage> RallyMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UAnimMontage> HeroSkillMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage") TObjectPtr<UNiagaraSystem> ImpactSystem;

private:
 FString ActiveRoomId;
 int32 LastConfirmedTurn = -1;
};
