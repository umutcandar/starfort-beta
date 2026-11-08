#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "TimerManager.h"
#include "UObject/SoftObjectPtr.h"
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
class FStreamableHandle;
struct FStarfortVerifiedBattleTurn;

/** Server ID -> softly referenced authored hero art.
 * The seven heroes are not all pulled into mobile RAM at once.
 */
USTRUCT(BlueprintType)
struct STARFORTUNREAL_API FStarfortHeroArtEntry
{
 GENERATED_BODY()

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero Assets")
 FName HeroId = NAME_None;

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero Assets")
 TSoftObjectPtr<UStarfortHeroCombatAsset> Art;
};

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
 virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

 UFUNCTION(BlueprintCallable, Category="STARFORT|Combat")
 void PresentVerifiedTurn(const FStarfortVerifiedBattleTurn& Snapshot);

 UFUNCTION(BlueprintPure, Category="STARFORT|Combat")
 bool HasApprovedStage() const;

 /** Clear old player's 3D party and pending effects on mission end/sign-out. */
 UFUNCTION(BlueprintCallable, Category="STARFORT|Combat")
 void ClearBattlePresentation();

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

 /** Shield / rally aura attaches to each hero rig, not to the weapon muzzle. */
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroAuraFX1;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroAuraFX2;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> HeroAuraFX3;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraComponent> ConfirmedImpactFX;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<USpringArmComponent> CinemaArm;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Stage")
 TObjectPtr<UCameraComponent> CinemaCamera;

 /** Assign real licensed UStarfortHeroCombatAsset assets in a BP-derived stage. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero Assets")
 TArray<FStarfortHeroArtEntry> HeroArtCatalog;

 /** Must follow human visual signoff and physical mobile-device review. */
 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Quality")
 bool bArtApprovedForMobile = false;

 /** No shared legacy combat montages: every hero uses its own motion set. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UAnimMontage> EnemyHitMontage;

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Stage")
 TObjectPtr<UNiagaraSystem> ImpactSystem;

private:
 bool ConfigureTeam(const TArray<FString>& VerifiedTeam);
 void SetAllVisible(bool bVisible);
 void PlayVerifiedPartyAction(const FString& Action, int64 VerifiedDamage);
 void BeginCameraBeat(const FString& Action, const FString& SkilledHero);
 void PlayDelayedVerifiedImpact(uint64 PlaybackGeneration,
  FString PlaybackRoom, int32 PlaybackTurn);
 void ResetCinematicDirector();
 void BeginTeamAssetLoad(const FStarfortVerifiedBattleTurn& Snapshot);
 void OnTeamAssetsLoaded(uint64 Generation);
 bool GatherUniqueTeamArtPaths(const TArray<FString>& VerifiedTeam,
  TArray<FSoftObjectPath>& OutPaths) const;
 UStarfortHeroCombatAsset* FindApprovedHero(const FString& HeroId) const;

 FString ActiveRoomId;
 TArray<FString> ActiveTeamIds;
 UPROPERTY(Transient)
 TArray<TObjectPtr<UStarfortHeroCombatAsset>> ActiveHeroArt;
 int32 LastConfirmedTurn = -1;
 int32 LastConfirmedWave = 0;
 bool bThreeHeroTeamReady = false;

 // Actual mobile art is streamed in without stalling the game thread.
 // Each generation rejects late callbacks after a different room/account.
 TSharedPtr<FStreamableHandle> TeamLoadHandle;
 uint64 TeamLoadGeneration = 0;
 bool bTeamLoadPending = false;
 FString PendingRoomId;
 TArray<FString> PendingTeamIds;
 int32 PendingTurn = -1;
 int32 PendingWave = 0;

 // Purely cosmetic cinematography. No predicted damage, wins or loot.
 float DesiredArmLength = 1510.f;
 float DesiredFOV = 43.f;
 FVector DesiredFocus = FVector::ZeroVector;
 FRotator DesiredLook = FRotator(-15.f,-10.f,0.f);
 float CameraBeatSeconds = 0.f;
 FTimerHandle VerifiedImpactTimer;
};
