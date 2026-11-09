#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortFabPreviewController.generated.h"

class ASkeletalMeshActor;
class ACameraActor;
class UAnimSequence;

/** One genuine user-imported Fab skeletal actor, NEVER a saved STARFORT hero. */
struct FStarfortPrivatePreviewActor
{
 FString HeroId;
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

 // Native HUD click targets and keyboard shortcuts share the same actions.
 void FocusHeroByIndex(int32 Index);
 void ToggleActualAnimation();
 void OrbitLeft();
 void OrbitRight();
 void ZoomIn();
 void ZoomOut();
 void TogglePrivateScene();

private:
 void OnNumberPressed(FKey Key);
 void OnPreviewClick();
 void CaptureLocalPreviewActors();
 FString TagValue(const AActor* Actor, const FString& Prefix) const;
 bool SetRealAnimation(int32 Index, bool bAttack);
 void UpdateCamera(float DeltaSeconds);

 bool bPrivatePreview = false;
 bool bBattleMode = false;
 bool bAttackMode = false;
 int32 FocusedIndex = 0;
 float OrbitDegrees = 0.f;
 float CameraDistance = 850.f;
 FString Notice = TEXT("Yalnızca yerel Unreal görsel testidir.");
 TArray<FStarfortPrivatePreviewActor> Heroes;
 TWeakObjectPtr<ACameraActor> Camera;
};
