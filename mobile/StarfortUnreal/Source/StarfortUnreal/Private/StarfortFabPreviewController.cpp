#include "StarfortFabPreviewController.h"

#include "Animation/AnimSequence.h"
#include "Camera/CameraActor.h"
#include "Components/InputComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Engine/SkeletalMeshActor.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "InputCoreTypes.h"
#include "Kismet/GameplayStatics.h"
#include "Math/RotationMatrix.h"
#include "UObject/SoftObjectPath.h"

namespace StarfortFabPrivate
{
 static const TCHAR* const OrderedIds[]={
  TEXT("rovan"),TEXT("aldren"),TEXT("lyra"),TEXT("mira"),
  TEXT("doran"),TEXT("vesper"),TEXT("eira")
 };
 static const FKey NumberKeys[]={
  EKeys::One,EKeys::Two,EKeys::Three,EKeys::Four,
  EKeys::Five,EKeys::Six,EKeys::Seven
 };
}

AStarfortFabPreviewController::AStarfortFabPreviewController()
{
 PrimaryActorTick.bCanEverTick=true;
 bShowMouseCursor=true;
 bEnableClickEvents=true;
 // Explicitly never starts a network session or changes saved progress.
}

void AStarfortFabPreviewController::BeginPlay()
{
 Super::BeginPlay();
 if (!IsLocalController() || !GetWorld()) return;
 const FString MapName=GetWorld()->GetMapName();
 bBattleMode=MapName.Contains(TEXT("L_StarfortPrivateFabBattle_v80"));
 bPrivatePreview=bBattleMode ||
  MapName.Contains(TEXT("L_StarfortPrivateFabPlaytest_v80"));
 if (!bPrivatePreview)
 {
  UE_LOG(LogTemp,Error,TEXT("STARFORT private preview controller must NOT run in production maps"));
  return;
 }
 CaptureLocalPreviewActors();
 bWideBattleCamera=bBattleMode; // Compare all real rigs, not just a portrait.
 if (bBattleMode)
 {
  PrivateBattleStatus=FString::Printf(TEXT("Özel 3D test: %d dost, %d rakip. Hasar/ödül yok."),
    GetRealBattleAllyCount(),GetRealBattleOpponentCount());
 }
 SetInputMode(FInputModeGameAndUI());
 if (Camera.IsValid()) SetViewTarget(Camera.Get());
 if (Heroes.Num()>0)
 {
  // Rovan might not be installed yet. Start with the first REAL imported
  // hero instead of displaying a missing character as the selected model.
  for (int32 I=0;I<7;++I)
   if (Heroes[0].HeroId==StarfortFabPrivate::OrderedIds[I])
   {
    FocusHeroByIndex(I);
    if (bBattleMode) bWideBattleCamera=true;
    break;
   }
 }
 else Notice=TEXT("Önce gerçek Fab SkeletalMesh paketlerini içe aktar.");
}

void AStarfortFabPreviewController::CaptureLocalPreviewActors()
{
 Heroes.Reset();
 Camera.Reset();
 TMap<FString,FStarfortPrivatePreviewActor> Found;
 for (TActorIterator<ASkeletalMeshActor> It(GetWorld());It;++It)
 {
  ASkeletalMeshActor* Actor=*It;
  const FString Id=TagValue(Actor,TEXT("SFPREVIEW_HERO="));
  if (Id.IsEmpty()) continue;
  bool bKnown=false;
  for (const TCHAR* Allowed:StarfortFabPrivate::OrderedIds)
   if (Id==Allowed) {bKnown=true;break;}
  if (!bKnown || Found.Contains(Id) || !Actor->GetSkeletalMeshComponent() ||
      !Actor->GetSkeletalMeshComponent()->GetSkeletalMeshAsset())
  {
   UE_LOG(LogTemp,Warning,TEXT("STARFORT private preview duplicate/unknown/unrigged actor skipped"));
   continue;
  }
  FStarfortPrivatePreviewActor Slot;
  Slot.HeroId=Id;
  Slot.SourceSide=TagValue(Actor,TEXT("SFPREVIEW_SIDE="));
  Slot.Actor=Actor;
  Slot.IdleSequencePath=TagValue(Actor,TEXT("SFPREVIEW_IDLE="));
  Slot.AttackSequencePath=TagValue(Actor,TEXT("SFPREVIEW_ATTACK="));
  Found.Add(Id,Slot);
 }
 for (const TCHAR* Id:StarfortFabPrivate::OrderedIds)
  if (const FStarfortPrivatePreviewActor* Entry=Found.Find(Id))
   Heroes.Add(*Entry);
 for (TActorIterator<ACameraActor> It(GetWorld());It;++It)
  if (It->ActorHasTag(FName(TEXT("SFPREVIEW_CAMERA"))))
  {
   Camera=*It;
   break;
  }
 if (!Camera.IsValid())
  UE_LOG(LogTemp,Warning,TEXT("STARFORT private preview missing tagged CameraActor; preview navigation disabled"));
}

FString AStarfortFabPreviewController::TagValue(
 const AActor* Actor,const FString& Prefix) const
{
 if (!Actor) return FString();
 for (const FName& Tag:Actor->Tags)
 {
  const FString Value=Tag.ToString();
  if (Value.StartsWith(Prefix))
   return Value.RightChop(Prefix.Len());
 }
 return FString();
}

FString AStarfortFabPreviewController::GetFocusedHero() const
{
 return Heroes.IsValidIndex(FocusedIndex) ?
  Heroes[FocusedIndex].HeroId.ToUpper() : TEXT("YÜKLENMİŞ KAHRAMAN YOK");
}

int32 AStarfortFabPreviewController::GetRealBattleAllyCount() const
{
 return Heroes.FilterByPredicate([](const FStarfortPrivatePreviewActor& Entry){
  return Entry.SourceSide==TEXT("ALLY") && Entry.Actor.IsValid();
 }).Num();
}

int32 AStarfortFabPreviewController::GetRealBattleOpponentCount() const
{
 return Heroes.FilterByPredicate([](const FStarfortPrivatePreviewActor& Entry){
  return Entry.SourceSide==TEXT("OPPONENT") && Entry.Actor.IsValid();
 }).Num();
}

FString AStarfortFabPreviewController::GetPrivateBattleStatus() const
{
 return bBattleMode ? PrivateBattleStatus : FString();
}

bool AStarfortFabPreviewController::FocusedHeroHasActualAttack() const
{
 return Heroes.IsValidIndex(FocusedIndex) &&
  !Heroes[FocusedIndex].AttackSequencePath.IsEmpty();
}

void AStarfortFabPreviewController::FocusHeroByIndex(int32 Index)
{
 // Number keys represent canonical roster positions, NOT whichever subset
 // happened to be imported. Missing heroes cannot move the wrong player.
 if (!bPrivatePreview || Index<0 || Index>=7) return;
 const FString TargetId=StarfortFabPrivate::OrderedIds[Index];
 const int32 Found=Heroes.IndexOfByPredicate(
  [&TargetId](const FStarfortPrivatePreviewActor& E){
   return E.HeroId==TargetId;
  });
 if (Found==INDEX_NONE)
 {
  Notice=TargetId.ToUpper()+TEXT(" henüz yerel Fab paketinden içe aktarılmadı.");
  return;
 }
 if (bPrivateSequenceActive) StopPrivateBattleSequence();
 FocusedIndex=Found;
 if (bBattleMode) bWideBattleCamera=false;
 bAttackMode=false;
 SetRealAnimation(FocusedIndex,false);
 Notice=GetFocusedHero()+
  TEXT(" — yalnızca ücretsiz kaynak model; özgün STARFORT zırhı değil.");
}

bool AStarfortFabPreviewController::SetRealAnimation(int32 Index,bool bAttack)
{
 if (!Heroes.IsValidIndex(Index)) return false;
 FStarfortPrivatePreviewActor& Entry=Heroes[Index];
 ASkeletalMeshActor* Hero=Entry.Actor.Get();
 if (!Hero) return false;
 USkeletalMeshComponent* Rig=Hero->GetSkeletalMeshComponent();
 if (!Rig || !Rig->GetSkeletalMeshAsset()) return false;
 const FString& Source=bAttack ? Entry.AttackSequencePath : Entry.IdleSequencePath;
 if (Source.IsEmpty()) return false;
 // Only editor-verified, local /Game/ AnimSequence assets may be loaded.
 if (!Source.StartsWith(TEXT("/Game/")) ||
     Source.Contains(TEXT("..")) ||
     Source.Contains(TEXT("\\"))) return false;
 UAnimSequence* Clip=Cast<UAnimSequence>(FSoftObjectPath(Source).TryLoad());
 if (!Clip || !Clip->GetSkeleton() ||
     Clip->GetSkeleton()!=Rig->GetSkeletalMeshAsset()->GetSkeleton())
 {
  UE_LOG(LogTemp,Warning,TEXT("STARFORT private preview animation/skeleton mismatch: %s"),*Source);
  return false;
 }
 Rig->PlayAnimation(Clip,!bAttack);
 return true;
}

void AStarfortFabPreviewController::ToggleActualAnimation()
{
 if (!bPrivatePreview || !Heroes.IsValidIndex(FocusedIndex)) return;
 const bool WantAttack=!bAttackMode;
 if (!SetRealAnimation(FocusedIndex,WantAttack))
 {
  bAttackMode=false;
  Notice=TEXT("Bu model için gerçek uyumlu ")+
   FString(WantAttack?TEXT("saldırı"):TEXT("idle"))+
   TEXT(" animasyonu bulunamadı. Sahte efekt oynatılmıyor.");
  return;
 }
 bAttackMode=WantAttack;
 Notice=GetFocusedHero()+
  (bAttackMode ? TEXT(" — özgün Fab saldırı animasyonu")
               : TEXT(" — özgün Fab duruş animasyonu"));
}

void AStarfortFabPreviewController::OrbitLeft()
{
 if (bPrivatePreview) OrbitDegrees-=18.f;
}
void AStarfortFabPreviewController::OrbitRight()
{
 if (bPrivatePreview) OrbitDegrees+=18.f;
}
void AStarfortFabPreviewController::ZoomIn()
{
 if (bPrivatePreview) CameraDistance=FMath::Clamp(CameraDistance-95.f,380.f,2200.f);
}
void AStarfortFabPreviewController::ZoomOut()
{
 if (bPrivatePreview) CameraDistance=FMath::Clamp(CameraDistance+95.f,380.f,2200.f);
}

void AStarfortFabPreviewController::TogglePrivateScene()
{
 if (!bPrivatePreview || !GetWorld()) return;
 StopPrivateBattleSequence();
 // Both levels are non-production .umaps. Never open the account/village,
 // start an RPC, or switch to the real online battle.
 const TCHAR* NewMap=bBattleMode ?
  TEXT("/Game/Maps/L_StarfortPrivateFabPlaytest_v80") :
  TEXT("/Game/Maps/L_StarfortPrivateFabBattle_v80");
 UGameplayStatics::OpenLevel(this,FName(NewMap));
}

void AStarfortFabPreviewController::UpdateCamera(float DeltaSeconds)
{
 if (!bPrivatePreview || !Camera.IsValid() ||
     !Heroes.IsValidIndex(FocusedIndex)) return;
 // The spectator pawn may possess after BeginPlay and reset the view target.
 // Keep the real authored preview CameraActor active in PIE, never main game.
 if (GetViewTarget()!=Camera.Get()) SetViewTarget(Camera.Get());
 ASkeletalMeshActor* Focus=Heroes[FocusedIndex].Actor.Get();
 if (!Focus) return;
 FVector LookAt=Focus->GetActorLocation()+FVector(0.f,0.f,138.f);
 if (bBattleMode && bWideBattleCamera)
 {
  FVector Accum=FVector::ZeroVector;
  int32 Count=0;
  for (const FStarfortPrivatePreviewActor& Entry:Heroes)
  {
   if (!Entry.Actor.IsValid() ||
       (Entry.SourceSide!=TEXT("ALLY") && Entry.SourceSide!=TEXT("OPPONENT")))
    continue;
   Accum+=Entry.Actor->GetActorLocation();
   ++Count;
  }
  if (Count>=2) LookAt=Accum/static_cast<float>(Count)+FVector(0.f,0.f,140.f);
 }
 const float Rad=FMath::DegreesToRadians(OrbitDegrees);
 const float Distance=(bBattleMode && bWideBattleCamera)
  ? FMath::Max(CameraDistance,1600.f) : CameraDistance;
 const FVector Offset(
  Distance*FMath::Cos(Rad),Distance*FMath::Sin(Rad),
  Distance*(bBattleMode && bWideBattleCamera ? 0.23f : 0.16f));
 const FVector Goal=LookAt+Offset;
 const FVector Smooth=FMath::VInterpTo(
  Camera->GetActorLocation(),Goal,FMath::Max(0.f,DeltaSeconds),6.f);
 Camera->SetActorLocationAndRotation(
  Smooth,FRotationMatrix::MakeFromX(LookAt-Smooth).Rotator());
}

void AStarfortFabPreviewController::Tick(float DeltaSeconds)
{
 Super::Tick(DeltaSeconds);
 TickPrivateBattleSequence(DeltaSeconds);
 UpdateCamera(DeltaSeconds);
}

void AStarfortFabPreviewController::OnNumberPressed(FKey Key)
{
 for (int32 I=0;I<7;++I)
  if (Key==StarfortFabPrivate::NumberKeys[I])
  {
   FocusHeroByIndex(I);
   return;
  }
}

void AStarfortFabPreviewController::OnPreviewClick()
{
 if (!bPrivatePreview) return;
 int32 Width=0,Height=0;
 float MouseX=0.f,MouseY=0.f;
 GetViewportSize(Width,Height);
 if (Width<=0 || Height<=0 || !GetMousePosition(MouseX,MouseY)) return;
 // Same units/positions used by AStarfortFabPreviewHUD. No hitboxes for
 // actual gameplay currency or progression, only art/animation review.
 const float SlotW=FMath::Max(35.f,(Width-40.f)/7.f);
 if (MouseY>=88.f && MouseY<=132.f)
 {
  const int32 Slot=FMath::FloorToInt((MouseX-20.f)/SlotW);
  if (MouseX>=20.f && Slot>=0 && Slot<7)
   FocusHeroByIndex(Slot);
  return;
 }
 if (bBattleMode && MouseY>=Height-174.f && MouseY<=Height-134.f)
 {
  // Private tactical buttons are deliberately isolated from paid gameplay.
  const float WidthPerAction=FMath::Max(35.f,(Width-40.f)/3.f);
  const int32 Action=FMath::FloorToInt((MouseX-20.f)/WidthPerAction);
  if (MouseX>=20.f && Action>=0 && Action<3)
  {
   if (Action==0) QueueThreeHeroAttackPreview();
   else if (Action==1) PlayOpponentAnimationPreview();
   else ToggleWideBattleCamera();
  }
  return;
 }
 if (MouseY<Height-76.f || MouseY>Height-20.f) return;
 const float ButtonW=FMath::Max(35.f,(Width-32.f)/6.f);
 const int32 Button=FMath::FloorToInt((MouseX-16.f)/ButtonW);
 if (MouseX<16.f || Button<0 || Button>=6) return;
 switch(Button)
 {
  case 0: ToggleActualAnimation();break;
  case 1: OrbitLeft();break;
  case 2: OrbitRight();break;
  case 3: ZoomIn();break;
  case 4: ZoomOut();break;
  case 5: TogglePrivateScene();break;
 }
}

void AStarfortFabPreviewController::StopPrivateBattleSequence()
{
 if (Heroes.IsValidIndex(ActivePreviewAttackIndex))
 {
  if (ASkeletalMeshActor* Actor=Heroes[ActivePreviewAttackIndex].Actor.Get())
   Actor->SetActorLocation(ActiveAttackStartPosition);
  // A missing idle is honestly left missing; never inject a mannequin.
  SetRealAnimation(ActivePreviewAttackIndex,false);
 }
 PendingPrivateAttackIndices.Reset();
 ActivePreviewAttackIndex=INDEX_NONE;
 ActiveAttackElapsed=0.f;
 ActiveAttackDuration=0.f;
 bPrivateSequenceActive=false;
 if (bBattleMode) bWideBattleCamera=true;
}

void AStarfortFabPreviewController::StartNextPrivateAttack()
{
 ActivePreviewAttackIndex=INDEX_NONE;
 while (PendingPrivateAttackIndices.Num()>0)
 {
  const int32 Next=PendingPrivateAttackIndices[0];
  PendingPrivateAttackIndices.RemoveAt(0);
  if (!Heroes.IsValidIndex(Next) || !Heroes[Next].Actor.IsValid() ||
      !SetRealAnimation(Next,true))
  {
   UE_LOG(LogTemp,Warning,TEXT("STARFORT private 3v1: missing/invalid genuine attack clip"));
   continue;
  }
  ActivePreviewAttackIndex=Next;
  FocusedIndex=Next;
  bWideBattleCamera=false;
  bAttackMode=false; // This is a choreographed test, not the solo UI toggle.
  ActiveAttackStartPosition=Heroes[Next].Actor->GetActorLocation();
  UAnimSequence* Clip=Cast<UAnimSequence>(
   FSoftObjectPath(Heroes[Next].AttackSequencePath).TryLoad());
  ActiveAttackDuration=FMath::Clamp(
   Clip ? Clip->GetPlayLength() : 1.f,0.5f,3.4f);
  ActiveAttackElapsed=0.f;
  PrivateBattleStatus=Heroes[Next].HeroId.ToUpper()+
   TEXT(": gerçek Fab saldırı klibi oynatılıyor (hasar yok).");
  return;
 }
 bPrivateSequenceActive=false;
 bWideBattleCamera=true;
 PrivateBattleStatus=CompletedPrivateAttackCount>0
  ? FString::Printf(TEXT("%d gerçek saldırı klibi gösterildi. HP/ödül değişmedi."),
      CompletedPrivateAttackCount)
  : TEXT("Gerçek uyumlu saldırı animasyonu yüklenemedi.");
}

void AStarfortFabPreviewController::QueueThreeHeroAttackPreview()
{
 if (!bPrivatePreview || !bBattleMode) return;
 if (bPrivateSequenceActive)
 {
  PrivateBattleStatus=TEXT("Önce mevcut gerçek animasyon dizisi tamamlanmalı.");
  return;
 }
 if (GetRealBattleAllyCount()!=3 || GetRealBattleOpponentCount()!=1)
 {
  PrivateBattleStatus=TEXT("3 ayrı gerçek dost ve 1 gerçek rakip modeli gerekli.");
  return;
 }
 PendingPrivateAttackIndices.Reset();
 CompletedPrivateAttackCount=0;
 // The authored formation, not the full gallery roster, determines allies.
 for (int32 I=0;I<Heroes.Num();++I)
  if (Heroes[I].SourceSide==TEXT("ALLY") && Heroes[I].Actor.IsValid() &&
      !Heroes[I].AttackSequencePath.IsEmpty())
   PendingPrivateAttackIndices.Add(I);
 if (PendingPrivateAttackIndices.Num()==0)
 {
  PrivateBattleStatus=TEXT("Üç dostta da gerçek uyumlu saldırı AnimSequence yok.");
  return;
 }
 const int32 Attacks=PendingPrivateAttackIndices.Num();
 bPrivateSequenceActive=true;
 StartNextPrivateAttack();
 if (bPrivateSequenceActive && Attacks<3)
  Notice=FString::Printf(
   TEXT("Yalnızca %d/3 dostun gerçek saldırı klibi var; diğerleri atlanıyor."),
   Attacks);
}

void AStarfortFabPreviewController::PlayOpponentAnimationPreview()
{
 if (!bPrivatePreview || !bBattleMode) return;
 if (bPrivateSequenceActive)
 {
  PrivateBattleStatus=TEXT("Önce mevcut gerçek animasyon dizisi tamamlanmalı.");
  return;
 }
 int32 Opponent=INDEX_NONE;
 for (int32 I=0;I<Heroes.Num();++I)
  if (Heroes[I].SourceSide==TEXT("OPPONENT") && Heroes[I].Actor.IsValid())
  {
   if (Opponent!=INDEX_NONE)
   {
    PrivateBattleStatus=TEXT("Birden fazla rakip var: önizleme durduruldu.");
    return;
   }
   Opponent=I;
  }
 if (Opponent==INDEX_NONE || Heroes[Opponent].AttackSequencePath.IsEmpty())
 {
  PrivateBattleStatus=TEXT("Rakibin gerçek saldırı klibi mevcut değil.");
  return;
 }
 PendingPrivateAttackIndices.Reset();
 PendingPrivateAttackIndices.Add(Opponent);
 bPrivateSequenceActive=true;
 StartNextPrivateAttack();
}

void AStarfortFabPreviewController::ToggleWideBattleCamera()
{
 if (!bPrivatePreview || !bBattleMode || bPrivateSequenceActive) return;
 bWideBattleCamera=!bWideBattleCamera;
 PrivateBattleStatus=bWideBattleCamera ?
  TEXT("Geniş kamera: 3 dost + 1 rakip, yalnızca görsel test.") :
  TEXT("Yakın kamera: seçili gerçek model.");
}

void AStarfortFabPreviewController::TickPrivateBattleSequence(float DeltaSeconds)
{
 if (!bPrivatePreview || !bBattleMode || !bPrivateSequenceActive ||
     !Heroes.IsValidIndex(ActivePreviewAttackIndex)) return;
 ASkeletalMeshActor* Attacker=Heroes[ActivePreviewAttackIndex].Actor.Get();
 if (!Attacker)
 {
  StopPrivateBattleSequence();
  PrivateBattleStatus=TEXT("Gerçek saldırı aktörü sahneden kayboldu.");
  return;
 }
 ActiveAttackElapsed+=FMath::Clamp(DeltaSeconds,0.f,0.10f);
 const float Progress=FMath::Clamp(
  ActiveAttackElapsed/FMath::Max(ActiveAttackDuration,0.5f),0.f,1.f);
 FVector Target=ActiveAttackStartPosition+Attacker->GetActorForwardVector()*250.f;
 for (const FStarfortPrivatePreviewActor& Enemy:Heroes)
  if (Enemy.SourceSide==
       (Heroes[ActivePreviewAttackIndex].SourceSide==TEXT("ALLY")
        ? TEXT("OPPONENT") : TEXT("ALLY")) && Enemy.Actor.IsValid())
  {
   Target=Enemy.Actor->GetActorLocation();
   break;
  }
 // Bounded positional anticipation: authentic skeletal attack animation
 // remains the only striking motion, with no fabricated hit or recoil VFX.
 const FVector Forward=(Target-ActiveAttackStartPosition).GetSafeNormal2D();
 const float Step=FMath::Sin(PI*Progress)*FMath::Min(68.f,
  FVector::Dist2D(ActiveAttackStartPosition,Target)*0.08f);
 Attacker->SetActorLocation(ActiveAttackStartPosition+Forward*Step);
 if (Progress>=1.f)
 {
  Attacker->SetActorLocation(ActiveAttackStartPosition);
  SetRealAnimation(ActivePreviewAttackIndex,false);
  StartNextPrivateAttack();
 }
}

void AStarfortFabPreviewController::SetupInputComponent()
{
 Super::SetupInputComponent();
 if (!InputComponent) return;
 for (const FKey& Key:StarfortFabPrivate::NumberKeys)
  InputComponent->BindKey(
   Key,IE_Pressed,this,&AStarfortFabPreviewController::OnNumberPressed);
 InputComponent->BindKey(EKeys::SpaceBar,IE_Pressed,
  this,&AStarfortFabPreviewController::ToggleActualAnimation);
 InputComponent->BindKey(EKeys::A,IE_Pressed,
  this,&AStarfortFabPreviewController::OrbitLeft);
 InputComponent->BindKey(EKeys::D,IE_Pressed,
  this,&AStarfortFabPreviewController::OrbitRight);
 InputComponent->BindKey(EKeys::W,IE_Pressed,
  this,&AStarfortFabPreviewController::ZoomIn);
 InputComponent->BindKey(EKeys::S,IE_Pressed,
  this,&AStarfortFabPreviewController::ZoomOut);
 InputComponent->BindKey(EKeys::Tab,IE_Pressed,
  this,&AStarfortFabPreviewController::TogglePrivateScene);
 InputComponent->BindKey(EKeys::Q,IE_Pressed,
  this,&AStarfortFabPreviewController::QueueThreeHeroAttackPreview);
 InputComponent->BindKey(EKeys::E,IE_Pressed,
  this,&AStarfortFabPreviewController::PlayOpponentAnimationPreview);
 InputComponent->BindKey(EKeys::B,IE_Pressed,
  this,&AStarfortFabPreviewController::ToggleWideBattleCamera);
 InputComponent->BindKey(EKeys::LeftMouseButton,IE_Pressed,
  this,&AStarfortFabPreviewController::OnPreviewClick);
}
