#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "InputCoreTypes.h"
#include "StarfortFabPreviewController.generated.h"

class ASkeletalMeshActor;
class ACameraActor;
class UAnimSequence;

/** One genuine user-imported Fab skeletal actor, NEVER a saved STARFORT hero. */
struct FStarfortPrivatePreviewActor
{
 FString HeroId;
 FString SourceSide; // ALLY / OPPONENT / GALLERY; editor-authored tag, not player team data.
 TWeakObjectPtr<ASkeletalMeshActor> Actor;
 FString IdleSequencePath;
 FString AttackSequencePath;
};

/**
 * Editor-only private visual inspector. Only activated by the explicitly
 * authored /Game/Maps/L_StarfortPrivateFab* preview worlds.
 * This class NEVER constructs game damage, rewards, purchases or Supabase RPCs.
 */
UCLASS()
class STARFORTUNREAL_API AStarfortFabPreviewController : public APlayerController
{
 GENERATED_BODY()
public:
 AStarfortFabPreviewController();
 virtual void BeginPlay() override;
 virtual void Tick(float DeltaSeconds) override;
 virtual void SetupInputComponent() override;

 bool IsPrivatePreview() const { return bPrivatePreview; }
 bool IsBattlePreview() const { return bBattleMode; }
 int32 GetLoadedHeroCount() const { return Heroes.Num(); }
 FString GetFocusedHero() const;
 bool FocusedHeroHasActualAttack() const;
 FString GetPreviewNotice() const { return Notice; }
 FString GetPrivateBattleStatus() const;
 bool IsPrivateBattleSequenceActive() const { return bPrivateSequenceActive; }
 bool IsWideBattleCamera() const { return bWideBattleCamera; }
 int32 GetRealBattleAllyCount() const;
 int32 GetRealBattleOpponentCount() const;

 // Native HUD click targets and keyboard shortcuts share the same actions.
 void FocusHeroByIndex(int32 Index);
 void ToggleActualAnimation();
 void OrbitLeft();
 void OrbitRight();
 void ZoomIn();
 void ZoomOut();
 void TogglePrivateScene();
 /** Private battle actions use ONLY imported same-skeleton Fab clips.
     No damage, HP, drops, currency, or server actions are performed. */
 void QueueThreeHeroAttackPreview();
 void PlayOpponentAnimationPreview();
 void ToggleWideBattleCamera();

private:
 void OnNumberPressed(FKey Key);
 void OnPreviewClick();
 void OnPreviewTouchPressed(ETouchIndex::Type FingerIndex, FVector TouchLocation);
 void HandlePreviewPointer(float ScreenX,float ScreenY);
 void CaptureLocalPreviewActors();
 FString TagValue(const AActor* Actor, const FString& Prefix) const;
 bool SetRealAnimation(int32 Index, bool bAttack);
 void UpdateCamera(float DeltaSeconds);
 void TickPrivateBattleSequence(float DeltaSeconds);
 void StartNextPrivateAttack();
 void StopPrivateBattleSequence();

 bool bPrivatePreview = false;
 bool bBattleMode = false;
 bool bAttackMode = false;
 bool bWideBattleCamera = false;
 bool bPrivateSequenceActive = false;
 TArray<int32> PendingPrivateAttackIndices;
 int32 ActivePreviewAttackIndex = INDEX_NONE;
 FVector ActiveAttackStartPosition = FVector::ZeroVector;
 float ActiveAttackElapsed = 0.f;
 float ActiveAttackDuration = 0.f;
 int32 CompletedPrivateAttackCount = 0;
 FString PrivateBattleStatus = TEXT("3 kahraman - 1 rakip; yalnızca animasyon gösterimi.");
 int32 FocusedIndex = 0;
 float OrbitDegrees = 0.f;
 float CameraDistance = 850.f;
 float LastPreviewPointerAt = -1000.f;
 FString Notice = TEXT("Yalnızca yerel Unreal görsel testidir.");
 TArray<FStarfortPrivatePreviewActor> Heroes;
 TWeakObjectPtr<ACameraActor> Camera;
};
