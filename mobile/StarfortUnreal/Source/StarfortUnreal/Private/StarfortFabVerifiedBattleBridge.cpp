#include "StarfortFabVerifiedBattleBridge.h"
#include "StarfortBattleScreen.h"

#include "Animation/AnimSequence.h"
#include "Camera/CameraActor.h"
#include "Components/SkeletalMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/SkeletalMeshActor.h"
#include "Engine/World.h"
#include "TimerManager.h"
#include "Containers/Set.h"

AStarfortFabVerifiedBattleBridge::AStarfortFabVerifiedBattleBridge()
{
 PrimaryActorTick.bCanEverTick=false;
}

void AStarfortFabVerifiedBattleBridge::BeginPlay()
{
 Super::BeginPlay();
 // No character becomes visible until a validated server turn arrives.
 HideRigs(true);
}

void AStarfortFabVerifiedBattleBridge::EndPlay(
 const EEndPlayReason::Type EndPlayReason)
{
 ClearReview();
 Super::EndPlay(EndPlayReason);
}

void AStarfortFabVerifiedBattleBridge::HideRigs(bool bHidden)
{
 for (const FStarfortFabVerifiedArtBinding& Entry:RealFabRigs)
  if (Entry.Actor) Entry.Actor->SetActorHiddenInGame(bHidden);
 bReviewVisible=!bHidden;
}

void AStarfortFabVerifiedBattleBridge::ClearTimers()
{
 if (GetWorld())
 {
  GetWorldTimerManager().ClearTimer(ReturnToIdleTimer);
  GetWorldTimerManager().ClearTimer(VerifiedEnemyCounterTimer);
 }
}

void AStarfortFabVerifiedBattleBridge::ClearReview()
{
 ClearTimers();
 HideRigs(true);
 ActiveRoomId.Empty();
 ActiveServerTeam.Reset();
 LastVerifiedTurn=-1;
 OpponentIndex=INDEX_NONE;
}

int32 AStarfortFabVerifiedBattleBridge::FindTeamSlot(
 const FString& HeroId) const
{
 for (int32 I=0;I<RealFabRigs.Num();++I)
  if (!RealFabRigs[I].bOpponent &&
      RealFabRigs[I].HeroId.ToString()==HeroId)
   return I;
 return INDEX_NONE;
}

bool AStarfortFabVerifiedBattleBridge::IsReadyForTeam(
 const TArray<FString>& Team) const
{
#if UE_BUILD_SHIPPING
 // A privately licensed visual reference must NEVER become retail hero art.
 return false;
#else
 if (!bEnableDevelopmentReview || !GetWorld() ||
     Team.Num()!=3 || RealFabRigs.Num()!=4 || !ReviewCamera)
  return false;

 TSet<FString> UniqueServerIds;
 TSet<FName> UniqueBindingIds;
 TSet<const USkeletalMesh*> UniqueBodies;
 TSet<const ASkeletalMeshActor*> UniqueActors;
 int32 Allies=0,Enemies=0;
 for (const FString& Hero:Team)
 {
  if (Hero.IsEmpty() || UniqueServerIds.Contains(Hero)) return false;
  UniqueServerIds.Add(Hero);
 }
 for (const FStarfortFabVerifiedArtBinding& Entry:RealFabRigs)
 {
  if (Entry.HeroId.IsNone() || UniqueBindingIds.Contains(Entry.HeroId) ||
      !Entry.Actor || !Entry.Idle || !Entry.Attack)
   return false;
  UniqueBindingIds.Add(Entry.HeroId);
  if (Entry.Actor->GetWorld()!=GetWorld() ||
      UniqueActors.Contains(Entry.Actor.Get()))
   return false;
  UniqueActors.Add(Entry.Actor.Get());
  USkeletalMeshComponent* Rig=Entry.Actor->GetSkeletalMeshComponent();
  if (!Rig || !Rig->GetSkeletalMeshAsset() ||
      Rig->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<24)
   return false;
  const USkeletalMesh* Body=Rig->GetSkeletalMeshAsset();
  if (!Body->GetPathName().StartsWith(TEXT("/Game/Paragon")) ||
      UniqueBodies.Contains(Body) || !Body->GetSkeleton() ||
      Entry.Idle->GetSkeleton()!=Body->GetSkeleton() ||
      Entry.Attack->GetSkeleton()!=Body->GetSkeleton() ||
      Entry.Idle==Entry.Attack)
   return false;
  UniqueBodies.Add(Body);
  if (Entry.bOpponent)
   ++Enemies;
  else
  {
   if (!UniqueServerIds.Contains(Entry.HeroId.ToString())) return false;
   ++Allies;
  }
 }
 return Allies==3 && Enemies==1 && UniqueServerIds.Num()==3 &&
  ReviewCamera->GetWorld()==GetWorld();
#endif
}

void AStarfortFabVerifiedBattleBridge::PlayNativeClip(
 int32 Slot,bool bAttack)
{
#if !UE_BUILD_SHIPPING
 if (!RealFabRigs.IsValidIndex(Slot)) return;
 const FStarfortFabVerifiedArtBinding& Entry=RealFabRigs[Slot];
 if (!Entry.Actor) return;
 USkeletalMeshComponent* Rig=Entry.Actor->GetSkeletalMeshComponent();
 if (!Rig || !Rig->GetSkeletalMeshAsset()) return;
 UAnimSequence* Clip=bAttack?Entry.Attack.Get():Entry.Idle.Get();
 if (!Clip || Clip->GetSkeleton()!=
     Rig->GetSkeletalMeshAsset()->GetSkeleton()) return;
 Rig->PlayAnimation(Clip,!bAttack);
#endif
}

void AStarfortFabVerifiedBattleBridge::RestoreIdle()
{
#if !UE_BUILD_SHIPPING
 if (!bReviewVisible) return;
 for (int32 I=0;I<RealFabRigs.Num();++I)
  PlayNativeClip(I,false);
#endif
}

void AStarfortFabVerifiedBattleBridge::PlayVerifiedEnemyCounter()
{
#if !UE_BUILD_SHIPPING
 if (!bReviewVisible || !RealFabRigs.IsValidIndex(OpponentIndex))
  return;
 PlayNativeClip(OpponentIndex,true);
 if (GetWorld())
  GetWorldTimerManager().SetTimer(ReturnToIdleTimer,this,
   &AStarfortFabVerifiedBattleBridge::RestoreIdle,0.75f,false);
#endif
}

void AStarfortFabVerifiedBattleBridge::PresentVerifiedServerTurn(
 const FStarfortVerifiedBattleTurn& Turn)
{
#if UE_BUILD_SHIPPING
 return;
#else
 // In particular, the THREE hero IDs and non-decreasing turn cannot come
 // from a manually authored fake local attack animation.
 if (!Turn.bServerVerified || Turn.RoomId.IsEmpty() ||
     Turn.Turn<0 || Turn.TeamHeroes.Num()!=3 ||
     Turn.HeroMaxHP<=0 || Turn.EnemyMaxHP<=0 ||
     Turn.HeroHP<0 || Turn.HeroHP>Turn.HeroMaxHP ||
     Turn.EnemyHP<0 || Turn.EnemyHP>Turn.EnemyMaxHP ||
     Turn.VerifiedDamageDealt<0 || Turn.VerifiedDamageReceived<0 ||
     Turn.Wave<1 || Turn.Waves<1 || Turn.Wave>Turn.Waves)
  return;

 if (!IsReadyForTeam(Turn.TeamHeroes))
 {
  ClearReview(); // Don't leave a previous user's source rigs on screen.
  return;
 }
 const bool bNewRoom=ActiveRoomId!=Turn.RoomId ||
  ActiveServerTeam!=Turn.TeamHeroes;
 if (bNewRoom)
 {
  ClearReview();
  ActiveRoomId=Turn.RoomId;
  ActiveServerTeam=Turn.TeamHeroes;
 }
 // Reject duplicate/delayed turns and never replay old combat animation.
 if (Turn.Turn<=LastVerifiedTurn) return;

 LastVerifiedTurn=Turn.Turn;
 ClearTimers();
 HideRigs(false);
 RestoreIdle();
 if (Turn.Turn==0) return; // First snapshot: preview the real four rigs.

 int32 Attacker=INDEX_NONE;
 // The verified action is used only for cosmetic selection:
 // the authoritative HP and damage remain in UStarfortBattleScreen.
 if (Turn.LastAction.StartsWith(TEXT("skill:")))
 {
  const FString SkillHero=Turn.LastAction.RightChop(6);
  if (Turn.TeamHeroes.Contains(SkillHero))
   Attacker=FindTeamSlot(SkillHero);
 }
 else if (Turn.LastAction==TEXT("strike"))
  Attacker=FindTeamSlot(Turn.TeamHeroes[0]);

 if (Attacker!=INDEX_NONE)
 {
  PlayNativeClip(Attacker,true);
  if (GetWorld()) GetWorldTimerManager().SetTimer(
   ReturnToIdleTimer,this,&AStarfortFabVerifiedBattleBridge::RestoreIdle,
   0.65f,false);
 }
 // Enemy animation is allowed ONLY after a server-verified reduction of the
 // party's actual HP. Guard/feint/rally with no clip remains a real idle.
 if (Turn.VerifiedDamageReceived>0 && GetWorld())
 {
  const float Delay=Attacker!=INDEX_NONE ? 0.78f : 0.08f;
  GetWorldTimerManager().SetTimer(VerifiedEnemyCounterTimer,this,
   &AStarfortFabVerifiedBattleBridge::PlayVerifiedEnemyCounter,
   Delay,false);
 }
#endif
}
