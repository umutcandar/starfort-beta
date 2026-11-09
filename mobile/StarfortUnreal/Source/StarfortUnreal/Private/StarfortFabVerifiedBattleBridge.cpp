#include "StarfortFabVerifiedBattleBridge.h"
#include "StarfortFabDevRosterRules.h"
#include "StarfortBattleScreen.h"

#include "Animation/AnimSequence.h"
#include "Camera/CameraActor.h"
#include "Components/SkeletalMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/SkeletalMeshActor.h"
#include "Engine/World.h"
#include "TimerManager.h"
#include "Containers/Set.h"

namespace StarfortV85DevArt
{
 // Each imported free Fab actor must have the actual corresponding package.
 // The short STARFORT IDs are preserved exactly as issued by the game server.
 static FString ExpectedSourceRoot(const FString& Id)
 {
  if (Id==TEXT("rovan")) return TEXT("/Game/ParagonWraith/");
  if (Id==TEXT("aldren")) return TEXT("/Game/ParagonGreystone/");
  if (Id==TEXT("lyra")) return TEXT("/Game/ParagonTheFey/");
  if (Id==TEXT("mira")) return TEXT("/Game/ParagonSerath/");
  if (Id==TEXT("doran")) return TEXT("/Game/ParagonKhaimera/");
  if (Id==TEXT("vesper")) return TEXT("/Game/ParagonCountess/");
  if (Id==TEXT("eira")) return TEXT("/Game/ParagonAurora/");
  return FString();
 }

 static float AuthenticClipLength(const UAnimSequence* Clip)
 {
  return Clip ? FMath::Clamp(Clip->GetPlayLength(),0.35f,10.f) : 0.75f;
 }
}

AStarfortFabVerifiedBattleBridge::AStarfortFabVerifiedBattleBridge()
{
 PrimaryActorTick.bCanEverTick=false;
}

void AStarfortFabVerifiedBattleBridge::BeginPlay()
{
 Super::BeginPlay();
 OriginalActorTransforms.Reset();
 for (const FStarfortFabVerifiedArtBinding& Entry:RealFabRigs)
  OriginalActorTransforms.Add(Entry.Actor ?
   Entry.Actor->GetActorTransform() : FTransform::Identity);
 // An unverified server session must never reveal the local dev-only rigs.
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
 for (int32 I=0;I<RealFabRigs.Num();++I)
 {
  const FStarfortFabVerifiedArtBinding& Entry=RealFabRigs[I];
  if (!Entry.Actor) continue;
  // A selected TEAM hero and ONE unused source hero standing in for the
  // enemy are the only visible actors. All other imported heroes stay hidden.
  const bool bPartOfVerifiedTeam=
   ActiveServerTeam.Contains(Entry.HeroId.ToString());
  const bool bVisible=!bHidden &&
   (bPartOfVerifiedTeam || I==OpponentIndex);
  Entry.Actor->SetActorHiddenInGame(!bVisible);
 }
 bReviewVisible=!bHidden && OpponentIndex!=INDEX_NONE &&
  ActiveServerTeam.Num()==3;
}

void AStarfortFabVerifiedBattleBridge::ClearTimers()
{
 if (!GetWorld()) return;
 GetWorldTimerManager().ClearTimer(ReturnToIdleTimer);
 GetWorldTimerManager().ClearTimer(VerifiedEnemyCounterTimer);
}

void AStarfortFabVerifiedBattleBridge::RestoreOriginalFormation()
{
 if (OriginalActorTransforms.Num()!=RealFabRigs.Num()) return;
 for (int32 I=0;I<RealFabRigs.Num();++I)
  if (RealFabRigs[I].Actor)
   RealFabRigs[I].Actor->SetActorTransform(OriginalActorTransforms[I]);
}

void AStarfortFabVerifiedBattleBridge::ClearReview()
{
 ClearTimers();
 HideRigs(true);
 RestoreOriginalFormation();
 ActiveRoomId.Empty();
 ActiveServerTeam.Reset();
 LastVerifiedTurn=-1;
 OpponentIndex=INDEX_NONE;
}

int32 AStarfortFabVerifiedBattleBridge::FindTeamSlot(
 const FString& HeroId) const
{
 for (int32 I=0;I<RealFabRigs.Num();++I)
  if (RealFabRigs[I].HeroId.ToString()==HeroId)
   return I;
 return INDEX_NONE;
}

int32 AStarfortFabVerifiedBattleBridge::ChooseUnusedEnemyRig(
 const TArray<FString>& Team) const
{
 // Actor identities stay stable across joins and mobile respawns.
 // Doran (or any other source rig) can be a REAL server ally; one unused
 // imported actor is then repurposed only as a temporary enemy appearance.
 TArray<FName> Ids;
 TArray<bool> PreferAsEnemy;
 for (const FStarfortFabVerifiedArtBinding& Entry:RealFabRigs)
 {
  Ids.Add(Entry.HeroId);
  PreferAsEnemy.Add(Entry.bOpponent);
 }
 return FStarfortFabDevRosterRules::ChooseUnused(
  Ids,PreferAsEnemy,Team);
}

bool AStarfortFabVerifiedBattleBridge::IsReadyForTeam(
 const TArray<FString>& Team) const
{
#if UE_BUILD_SHIPPING
 // Temporary free reference character art must never become retail hero art.
 return false;
#else
 if (!bEnableDevelopmentReview || !GetWorld() ||
     Team.Num()!=3 || RealFabRigs.Num()<4 || RealFabRigs.Num()>7 ||
     !ReviewCamera || ReviewCamera->GetWorld()!=GetWorld())
  return false;
 TSet<FString> UniqueTeam;
 TSet<FName> UniqueBindingIds;
 TSet<const USkeletalMesh*> UniqueBodies;
 TSet<const ASkeletalMeshActor*> UniqueActors;
 for (const FString& Hero:Team)
 {
  if (StarfortV85DevArt::ExpectedSourceRoot(Hero).IsEmpty() ||
      UniqueTeam.Contains(Hero)) return false;
  UniqueTeam.Add(Hero);
 }
 for (const FStarfortFabVerifiedArtBinding& Entry:RealFabRigs)
 {
  const FString Id=Entry.HeroId.ToString();
  const FString Root=StarfortV85DevArt::ExpectedSourceRoot(Id);
  if (Root.IsEmpty() || UniqueBindingIds.Contains(Entry.HeroId) ||
      !Entry.Actor || !Entry.Idle || !Entry.Attack ||
      Entry.Idle==Entry.Attack)
   return false;
  UniqueBindingIds.Add(Entry.HeroId);
  if (Entry.Actor->GetWorld()!=GetWorld() ||
      UniqueActors.Contains(Entry.Actor.Get())) return false;
  UniqueActors.Add(Entry.Actor.Get());
  const USkeletalMeshComponent* Rig=Entry.Actor->GetSkeletalMeshComponent();
  if (!Rig || !Rig->GetSkeletalMeshAsset()) return false;
  const USkeletalMesh* Body=Rig->GetSkeletalMeshAsset();
  if (!Body->GetPathName().StartsWith(Root) ||
      Body->GetRefSkeleton().GetNum()<24 ||
      UniqueBodies.Contains(Body) || !Body->GetSkeleton() ||
      !Entry.Idle->GetPathName().StartsWith(Root) ||
      !Entry.Attack->GetPathName().StartsWith(Root) ||
      Entry.Idle->GetSkeleton()!=Body->GetSkeleton() ||
      Entry.Attack->GetSkeleton()!=Body->GetSkeleton())
   return false;
  UniqueBodies.Add(Body);
 }
 for (const FString& Hero:Team)
  if (FindTeamSlot(Hero)==INDEX_NONE) return false;
 const int32 Enemy=ChooseUnusedEnemyRig(Team);
 return Enemy!=INDEX_NONE &&
   !Team.Contains(RealFabRigs[Enemy].HeroId.ToString());
#endif
}

void AStarfortFabVerifiedBattleBridge::PositionCurrentFormation()
{
#if !UE_BUILD_SHIPPING
 if (ActiveServerTeam.Num()!=3 || OpponentIndex==INDEX_NONE ||
     !IsReadyForTeam(ActiveServerTeam)) return;
 RestoreOriginalFormation(); // Avoid drift across different hero teams.
 const FVector Origin=GetActorLocation();
 const FVector Positions[3]={
  FVector(-320.f,-300.f,0.f),
  FVector(-470.f,0.f,0.f),
  FVector(-320.f,300.f,0.f)
 };
 for (int32 I=0;I<3;++I)
 {
  const int32 Slot=FindTeamSlot(ActiveServerTeam[I]);
  if (RealFabRigs.IsValidIndex(Slot) && RealFabRigs[Slot].Actor)
   RealFabRigs[Slot].Actor->SetActorLocationAndRotation(
    Origin+Positions[I],FRotator(0.f,12.f,0.f));
 }
 if (RealFabRigs.IsValidIndex(OpponentIndex) &&
     RealFabRigs[OpponentIndex].Actor)
  RealFabRigs[OpponentIndex].Actor->SetActorLocationAndRotation(
   Origin+FVector(480.f,0.f,0.f),FRotator(0.f,180.f,0.f));
#endif
}

void AStarfortFabVerifiedBattleBridge::PlayNativeClip(
 int32 Slot,bool bAttack)
{
#if !UE_BUILD_SHIPPING
 if (!bReviewVisible || !RealFabRigs.IsValidIndex(Slot)) return;
 const FStarfortFabVerifiedArtBinding& Entry=RealFabRigs[Slot];
 if (!Entry.Actor ||
     (Slot!=OpponentIndex &&
      !ActiveServerTeam.Contains(Entry.HeroId.ToString()))) return;
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
  if (I==OpponentIndex ||
      ActiveServerTeam.Contains(RealFabRigs[I].HeroId.ToString()))
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
   &AStarfortFabVerifiedBattleBridge::RestoreIdle,
   StarfortV85DevArt::AuthenticClipLength(
    RealFabRigs[OpponentIndex].Attack),false);
#endif
}

void AStarfortFabVerifiedBattleBridge::PresentVerifiedServerTurn(
 const FStarfortVerifiedBattleTurn& Turn)
{
#if UE_BUILD_SHIPPING
 return;
#else
 // This function receives only OnBattleReady's validated authenticated
 // snapshot; no local request/HP/reward is ever generated by this actor.
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
  ClearReview(); // Never show a mismatched previously verified team.
  return;
 }
 const bool bNewRoom=ActiveRoomId!=Turn.RoomId ||
  ActiveServerTeam!=Turn.TeamHeroes;
 if (bNewRoom)
 {
  // Joining an in-progress battle never replays a completed server turn.
  ClearReview();
  ActiveRoomId=Turn.RoomId;
  ActiveServerTeam=Turn.TeamHeroes;
  OpponentIndex=ChooseUnusedEnemyRig(Turn.TeamHeroes);
  LastVerifiedTurn=Turn.Turn;
  PositionCurrentFormation();
  HideRigs(false);
  RestoreIdle();
  return;
 }
 if (Turn.Turn<=LastVerifiedTurn) return; // Duplicated/out-of-order result.
 LastVerifiedTurn=Turn.Turn;
 ClearTimers();
 HideRigs(false);
 RestoreIdle();
 if (Turn.Turn==0) return;

 int32 Attacker=INDEX_NONE;
 if (Turn.LastAction.StartsWith(TEXT("skill:")))
 {
  const FString SkillHero=Turn.LastAction.RightChop(6);
  if (Turn.TeamHeroes.Contains(SkillHero))
   Attacker=FindTeamSlot(SkillHero);
 }
 else if (Turn.LastAction==TEXT("strike"))
  Attacker=FindTeamSlot(Turn.TeamHeroes[0]);
 // GUARD / FEINT / RALLY have no dedicated source clip in this dev pass:
 // playing a fake attack here would misrepresent actual combat quality.
 float AllyAnimationSeconds=0.f;
 if (Attacker!=INDEX_NONE)
 {
  PlayNativeClip(Attacker,true);
  AllyAnimationSeconds=StarfortV85DevArt::AuthenticClipLength(
   RealFabRigs[Attacker].Attack);
  if (GetWorld())
   GetWorldTimerManager().SetTimer(ReturnToIdleTimer,this,
    &AStarfortFabVerifiedBattleBridge::RestoreIdle,
    AllyAnimationSeconds,false);
 }
 // Enemy attacks are cosmetics only, triggered by authenticated HP deltas.
 if (Turn.VerifiedDamageReceived>0 && GetWorld())
 {
  const float Delay=Attacker!=INDEX_NONE ? AllyAnimationSeconds+0.06f : 0.08f;
  GetWorldTimerManager().SetTimer(VerifiedEnemyCounterTimer,this,
   &AStarfortFabVerifiedBattleBridge::PlayVerifiedEnemyCounter,
   Delay,false);
 }
#endif
}
