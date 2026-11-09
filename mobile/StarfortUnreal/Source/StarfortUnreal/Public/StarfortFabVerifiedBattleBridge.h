#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "TimerManager.h"
#include "StarfortFabVerifiedBattleBridge.generated.h"

class ACameraActor;
class ASkeletalMeshActor;
class UAnimSequence;
struct FStarfortVerifiedBattleTurn;

/**
 * Real local Fab assets for visually reviewing a REAL server-authoritative
 * STARFORT battle in a Development-only build. Referenced clips are hard
 * pointers so UE's asset cooker can find them. This is NOT production art.
 */
USTRUCT(BlueprintType)
struct FStarfortFabVerifiedArtBinding
{
 GENERATED_BODY()

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 FName HeroId = NAME_None;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 bool bOpponent = false;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 TObjectPtr<ASkeletalMeshActor> Actor;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 TObjectPtr<UAnimSequence> Idle;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 TObjectPtr<UAnimSequence> Attack;
};

/**
 * Opt-in, Development-only bridge from authenticated server snapshots to
 * FOUR genuine user-imported Paragon rigs in the actual Unreal battle map.
 *
 * It NEVER sends combat commands, computes HP, grants rewards or bypasses
 * AStarfortBattleStage::HasApprovedStage() production cinematic quality.
 *
 * In Shipping builds IsReadyForTeam is always false and no real art is
 * activated. Normal accounts, battle UI and backend remain unchanged.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortFabVerifiedBattleBridge : public AActor
{
 GENERATED_BODY()

public:
 AStarfortFabVerifiedBattleBridge();

 /** Explicit consent on a locally authored Unreal map. Default false. */
 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 bool bEnableDevelopmentReview = false;

 /** Four DIFFERENT genuine human-approved Epic/Fab Paragon source assets. */
 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 TArray<FStarfortFabVerifiedArtBinding> RealFabRigs;

 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Dev Art")
 TObjectPtr<ACameraActor> ReviewCamera;

 bool IsReadyForTeam(const TArray<FString>& Team) const;

 /** Only AStarfortBattleController passes genuine OnBattleReady snapshots. */
 void PresentVerifiedServerTurn(const FStarfortVerifiedBattleTurn& Turn);

 /** On sign-out, mission result and scene teardown. */
 void ClearReview();

 ACameraActor* GetReviewCamera() const { return ReviewCamera.Get(); }

protected:
 virtual void BeginPlay() override;
 virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
 int32 FindTeamSlot(const FString& HeroId) const;
 void PlayNativeClip(int32 Slot, bool bAttack);
 void RestoreIdle();
 void PlayVerifiedEnemyCounter();
 void HideRigs(bool bHidden);
 void ClearTimers();
 bool bReviewVisible = false;
 FString ActiveRoomId;
 TArray<FString> ActiveServerTeam;
 int32 LastVerifiedTurn = -1;
 int32 OpponentIndex = INDEX_NONE;
 FTimerHandle ReturnToIdleTimer;
 FTimerHandle VerifiedEnemyCounterTimer;
};
