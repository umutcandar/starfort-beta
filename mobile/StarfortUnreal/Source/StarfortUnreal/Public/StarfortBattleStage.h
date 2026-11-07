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
class UStarfortHeroCombatAsset;
struct FStarfortVerifiedBattleTurn;

/**
 * Three REAL skeletal heroes + enemy. No procedural character substitutes.
 * The authenticated server alone chooses roster order, moves, damage and wins.
 * Unreal presents approved meshes, action-specific motion and sound only.
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

 UFUNCTION(BlueprintPure, Category="STARFORT|Combat")
 bool HasConfiguredThreeHeroTeam() const { return bThreeHeroTeamReady; }

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USceneComponent> StageRoot;

 /** Backwards-compatible lead hero: the roster is 0=HeroRig,1=HeroRig2,2=HeroRig3. */
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USkeletalMeshComponent> HeroRig;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USkeletalMeshComponent> HeroRig2;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USkeletalMeshComponent> HeroRig3;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USkeletalMeshComponent> EnemyRig;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UStaticMeshComponent> HeroWeapon;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UStaticMeshComponent> HeroWeapon2;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UStaticMeshComponent> HeroWeapon3;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroSpecialFX1;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroSpecialFX2;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroSpecialFX3;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> ConfirmedImpactFX;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USpringArmComponent> CinemaArm;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UCameraComponent> CinemaCamera;

 /** Assign real licensed UStarfortHeroCombatAsset assets in a BP-derived stage. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero Assets")
 TArray<TObjectPtr<UStarfortHeroCombatAsset>> HeroArtCatalog;

 /** Must follow human visual signoff and physical mobile-device review. */
 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Quality")
 bool bArtApprovedForMobile = false;

 /** Legacy director-level motion slots retained for existing stages; per-hero assets
  * take priority, so named skills will never use another hero's animation.
  */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> VerifiedShotMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> GuardMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> FeintMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> RallyMontage;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> HeroSkillMontage;

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> EnemyHitMontage;

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraSystem> ImpactSystem;

private:
 bool ConfigureTeam(const TArray<FString>& VerifiedTeam);
 void SetAllVisible(bool bVisible);
 void PlayVerifiedPartyAction(const FString& Action, int64 VerifiedDamage);
 UStarfortHeroCombatAsset* FindApprovedHero(const FString& HeroId) const;

 FString ActiveRoomId;
 TArray<FString> ActiveTeamIds;
 TArray<TObjectPtr<UStarfortHeroCombatAsset>> ActiveHeroArt;
 int32 LastConfirmedTurn = -1;
 int32 LastConfirmedWave = 0;
 bool bThreeHeroTeamReady = false;
};
