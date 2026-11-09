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
 FocusedIndex=Found;
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
 ASkeletalMeshActor* Focus=Heroes[FocusedIndex].Actor.Get();
 if (!Focus) return;
 const FVector LookAt=Focus->GetActorLocation()+FVector(0.f,0.f,138.f);
 const float Rad=FMath::DegreesToRadians(OrbitDegrees);
 const FVector Offset(
  CameraDistance*FMath::Cos(Rad),CameraDistance*FMath::Sin(Rad),
  CameraDistance*0.16f);
 const FVector Goal=LookAt+Offset;
 const FVector Smooth=FMath::VInterpTo(
  Camera->GetActorLocation(),Goal,FMath::Max(0.f,DeltaSeconds),6.f);
 Camera->SetActorLocationAndRotation(
  Smooth,FRotationMatrix::MakeFromX(LookAt-Smooth).Rotator());
}

void AStarfortFabPreviewController::Tick(float DeltaSeconds)
{
 Super::Tick(DeltaSeconds);
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
 InputComponent->BindKey(EKeys::LeftMouseButton,IE_Pressed,
  this,&AStarfortFabPreviewController::OnPreviewClick);
}
