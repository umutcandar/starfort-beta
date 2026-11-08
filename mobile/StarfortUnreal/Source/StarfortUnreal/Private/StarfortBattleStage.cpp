#include "StarfortBattleStage.h"
#include "StarfortBattleScreen.h"
#include "StarfortHeroCombatAsset.h"

#include "Animation/AnimInstance.h"
#include "Animation/AnimMontage.h"
#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "Engine/AssetManager.h"
#include "Engine/StreamableManager.h"
#include "GameFramework/SpringArmComponent.h"
#include "Kismet/GameplayStatics.h"
#include "NiagaraComponent.h"
#include "NiagaraSystem.h"
#include "Sound/SoundBase.h"
#include "Containers/Set.h"

AStarfortBattleStage::AStarfortBattleStage()
{
 PrimaryActorTick.bCanEverTick=true;
 StageRoot=CreateDefaultSubobject<USceneComponent>(TEXT("StageRoot"));
 RootComponent=StageRoot;

 // Three separate rigs form a coherent, camera-readable triangle formation.
 // They are not duplicated meshes: each slot is mapped to a server team ID.
 HeroRig=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeroRig_Leader"));
 HeroRig->SetupAttachment(StageRoot);
 HeroRig->SetRelativeLocation(FVector(-310.f,-300.f,0.f));
 HeroRig->SetRelativeRotation(FRotator(0.f,20.f,0.f));

 HeroRig2=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeroRig_Middle"));
 HeroRig2->SetupAttachment(StageRoot);
 HeroRig2->SetRelativeLocation(FVector(-480.f,0.f,0.f));
 HeroRig2->SetRelativeRotation(FRotator(0.f,12.f,0.f));

 HeroRig3=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeroRig_Flank"));
 HeroRig3->SetupAttachment(StageRoot);
 HeroRig3->SetRelativeLocation(FVector(-310.f,300.f,0.f));
 HeroRig3->SetRelativeRotation(FRotator(0.f,-8.f,0.f));

 EnemyRig=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("EnemyRig"));
 EnemyRig->SetupAttachment(StageRoot);
 EnemyRig->SetRelativeLocation(FVector(480.f,0.f,0.f));
 EnemyRig->SetRelativeRotation(FRotator(0.f,200.f,0.f));

 HeroWeapon=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HeroWeapon_Leader"));
 HeroWeapon->SetupAttachment(HeroRig);
 HeroWeapon2=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HeroWeapon_Middle"));
 HeroWeapon2->SetupAttachment(HeroRig2);
 HeroWeapon3=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HeroWeapon_Flank"));
 HeroWeapon3->SetupAttachment(HeroRig3);

 HeroSpecialFX1=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroSpecialFX_Leader"));
 HeroSpecialFX1->SetupAttachment(HeroWeapon);
 HeroSpecialFX2=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroSpecialFX_Middle"));
 HeroSpecialFX2->SetupAttachment(HeroWeapon2);
 HeroSpecialFX3=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroSpecialFX_Flank"));
 HeroSpecialFX3->SetupAttachment(HeroWeapon3);

 HeroAuraFX1=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroAuraFX_Leader"));
 HeroAuraFX1->SetupAttachment(HeroRig);
 HeroAuraFX2=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroAuraFX_Middle"));
 HeroAuraFX2->SetupAttachment(HeroRig2);
 HeroAuraFX3=CreateDefaultSubobject<UNiagaraComponent>(TEXT("HeroAuraFX_Flank"));
 HeroAuraFX3->SetupAttachment(HeroRig3);

 ConfirmedImpactFX=CreateDefaultSubobject<UNiagaraComponent>(TEXT("ConfirmedImpactFX"));
 // Real confirmed damage is shown at the enemy, not at the firing gun.
 ConfirmedImpactFX->SetupAttachment(EnemyRig);

 for (USkeletalMeshComponent* Rig:
      {HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get(),EnemyRig.Get()})
 {
  Rig->SetCollisionEnabled(ECollisionEnabled::NoCollision);
  Rig->SetCastShadow(true);
 }
 for (UStaticMeshComponent* Weapon:
      {HeroWeapon.Get(),HeroWeapon2.Get(),HeroWeapon3.Get()})
 {
  Weapon->SetCollisionEnabled(ECollisionEnabled::NoCollision);
  Weapon->SetCastShadow(true);
 }
 for (UNiagaraComponent* Effect:
      {HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get(),
       HeroAuraFX1.Get(),HeroAuraFX2.Get(),HeroAuraFX3.Get(),
       ConfirmedImpactFX.Get()})
  Effect->SetAutoActivate(false);

 CinemaArm=CreateDefaultSubobject<USpringArmComponent>(TEXT("CinemaArm"));
 CinemaArm->SetupAttachment(StageRoot);
 CinemaArm->SetRelativeRotation(FRotator(-15.f,-10.f,0.f));
 CinemaArm->TargetArmLength=1510.f;
 CinemaArm->bDoCollisionTest=false;

 CinemaCamera=CreateDefaultSubobject<UCameraComponent>(TEXT("CinemaCamera"));
 CinemaCamera->SetupAttachment(CinemaArm,USpringArmComponent::SocketName);
 CinemaCamera->FieldOfView=43.f;
}

void AStarfortBattleStage::SetAllVisible(bool bVisible)
{
 for (USkeletalMeshComponent* Rig:
      {HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get(),EnemyRig.Get()})
  if (Rig) Rig->SetVisibility(bVisible);
 for (UStaticMeshComponent* Weapon:
      {HeroWeapon.Get(),HeroWeapon2.Get(),HeroWeapon3.Get()})
  if (Weapon) Weapon->SetVisibility(bVisible);
 for (UNiagaraComponent* Effect:
      {HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get(),
       HeroAuraFX1.Get(),HeroAuraFX2.Get(),HeroAuraFX3.Get(),
       ConfirmedImpactFX.Get()})
 {
  if (!Effect) continue;
  if (!bVisible) Effect->DeactivateImmediate();
  Effect->SetVisibility(bVisible);
 }
}

UStarfortHeroCombatAsset* AStarfortBattleStage::FindApprovedHero(
 const FString& HeroId) const
{
 const FStarfortHeroArtEntry* Match=nullptr;
 for (const FStarfortHeroArtEntry& Entry:HeroArtCatalog)
 {
  if (Entry.HeroId.ToString()!=HeroId) continue;
  // An ambiguous duplicate ID must not silently render the wrong character.
  if (Match) return nullptr;
  Match=&Entry;
 }
 if (!Match || Match->Art.IsNull()) return nullptr;

 // Asset streaming has already completed off the game thread. Never invoke
 // LoadSynchronous while drawing a battle on a mobile GPU.
 UStarfortHeroCombatAsset* Candidate=Match->Art.Get();
 if (!Candidate || Candidate->HeroId.ToString()!=HeroId ||
     !Candidate->HasProductionReadyGeometryAndMotion())
  return nullptr;
 return Candidate;
}

bool AStarfortBattleStage::GatherUniqueTeamArtPaths(
 const TArray<FString>& VerifiedTeam, TArray<FSoftObjectPath>& OutPaths) const
{
 OutPaths.Reset();
 if (!bArtApprovedForMobile || VerifiedTeam.Num()!=3 ||
     !EnemyRig || !EnemyRig->GetSkeletalMeshAsset() ||
     EnemyRig->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<24)
  return false;
 TSet<FString> UniqueHeroes;
 for (const FString& Id : VerifiedTeam)
 {
  if (Id.IsEmpty() || UniqueHeroes.Contains(Id)) return false;
  UniqueHeroes.Add(Id);
  const FStarfortHeroArtEntry* Match=nullptr;
  for (const FStarfortHeroArtEntry& Entry : HeroArtCatalog)
  {
   if (Entry.HeroId.ToString()!=Id) continue;
   if (Match) return false; // Ambiguous duplicate ID is never rendered.
   Match=&Entry;
  }
  if (!Match || Match->Art.IsNull()) return false;
  OutPaths.AddUnique(Match->Art.ToSoftObjectPath());
 }
 return OutPaths.Num()==3;
}

void AStarfortBattleStage::BeginTeamAssetLoad(
 const FStarfortVerifiedBattleTurn& Snapshot)
{
 TArray<FSoftObjectPath> ToLoad;
 if (!GatherUniqueTeamArtPaths(Snapshot.TeamHeroes, ToLoad))
 {
  // Never keep a previous player's team selected after a failed art lookup.
  ClearBattlePresentation();
  UE_LOG(LogTemp, Warning,
   TEXT("STARFORT: awaiting licensed team rigs / enemy mesh and art approval"));
  return;
 }
 // Cancels any previous callback before announcing a different combat room.
 ClearBattlePresentation();
 PendingRoomId=Snapshot.RoomId;
 PendingTeamIds=Snapshot.TeamHeroes;
 PendingTurn=Snapshot.Turn;
 PendingWave=Snapshot.Wave;
 bTeamLoadPending=true;
 const uint64 Generation=TeamLoadGeneration;
 TeamLoadHandle=UAssetManager::GetStreamableManager().RequestAsyncLoad(
  ToLoad,
  FStreamableDelegate::CreateUObject(this,
   &AStarfortBattleStage::OnTeamAssetsLoaded,Generation));
 if (!TeamLoadHandle.IsValid() && bTeamLoadPending)
 {
  bTeamLoadPending=false;
  UE_LOG(LogTemp, Error,TEXT("STARFORT: async hero asset request failed"));
 }
}

void AStarfortBattleStage::OnTeamAssetsLoaded(uint64 Generation)
{
 // Network response, map transition or sign-out may have superseded this load.
 if (Generation!=TeamLoadGeneration || !bTeamLoadPending ||
     PendingRoomId.IsEmpty() || PendingTeamIds.Num()!=3) return;

 const FString Room=PendingRoomId;
 const TArray<FString> Team=PendingTeamIds;
 const int32 Turn=PendingTurn;
 const int32 Wave=PendingWave;
 bTeamLoadPending=false;
 if (!ConfigureTeam(Team))
 {
  ClearBattlePresentation();
  UE_LOG(LogTemp,Warning,
   TEXT("STARFORT: streaming completed but audited hero asset is incomplete"));
  return;
 }

 ActiveRoomId=Room;
 LastConfirmedTurn=Turn;
 LastConfirmedWave=Wave;
 PendingRoomId.Empty();
 PendingTeamIds.Reset();
 PendingTurn=-1;
 PendingWave=0;
 // An already completed turn must NOT replay its SFX after asynchronous load.
 UE_LOG(LogTemp,Verbose,TEXT("STARFORT: verified three-hero art stream complete"));
}

bool AStarfortBattleStage::ConfigureTeam(const TArray<FString>& VerifiedTeam)
{
 bThreeHeroTeamReady=false;
 ActiveHeroArt.Reset();
 ActiveTeamIds.Reset();
 SetAllVisible(false);

 if (!bArtApprovedForMobile || VerifiedTeam.Num()!=3 ||
     !EnemyRig || !EnemyRig->GetSkeletalMeshAsset() ||
     EnemyRig->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<24)
  return false;

 USkeletalMeshComponent* Rigs[]={HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()};
 UStaticMeshComponent* Weapons[]={HeroWeapon.Get(),HeroWeapon2.Get(),HeroWeapon3.Get()};
 UNiagaraComponent* SpecialFX[]={
  HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get()
 };
 TSet<FString> Unique;
 TSet<const USkeletalMesh*> UniqueBodyMeshes;
 TSet<const UStaticMesh*> UniqueWeaponMeshes;
 for (int32 I=0;I<3;++I)
 {
  const FString& HeroId=VerifiedTeam[I];
  if (HeroId.IsEmpty() || Unique.Contains(HeroId)) return false;
  Unique.Add(HeroId);

  UStarfortHeroCombatAsset* Art=FindApprovedHero(HeroId);
  if (!Art || !Rigs[I] || !Weapons[I] || !SpecialFX[I]) return false;
  // Two roster IDs must never hide a duplicated generic character model or weapon.
  if (UniqueBodyMeshes.Contains(Art->HeroMesh.Get()) ||
      UniqueWeaponMeshes.Contains(Art->WeaponMesh.Get()))
   return false;
  UniqueBodyMeshes.Add(Art->HeroMesh.Get());
  UniqueWeaponMeshes.Add(Art->WeaponMesh.Get());

  // Actual rig and weapon are authored Unreal assets; nothing generated from
  // primitive cubes, UI images or browser screenshots in this path.
  Rigs[I]->SetSkeletalMesh(Art->HeroMesh);
  Rigs[I]->SetAnimInstanceClass(Art->AnimInstanceClass.Get());
  Weapons[I]->SetStaticMesh(Art->WeaponMesh);
  if (!Rigs[I]->DoesSocketExist(Art->WeaponSocket) ||
      !Weapons[I]->DoesSocketExist(Art->ImpactSocket))
  {
   UE_LOG(LogTemp,Error,TEXT("STARFORT: approved rig/weapon socket missing"));
   return false;
  }
  Weapons[I]->AttachToComponent(Rigs[I],
   FAttachmentTransformRules::SnapToTargetNotIncludingScale,
   Art->WeaponSocket);
  SpecialFX[I]->AttachToComponent(Weapons[I],
   FAttachmentTransformRules::SnapToTargetNotIncludingScale,
   Art->ImpactSocket);
  SpecialFX[I]->SetAsset(Art->SpecialEffect, true);

  ActiveHeroArt.Add(Art);
  ActiveTeamIds.Add(HeroId);
 }

 bThreeHeroTeamReady=true;
 if (ImpactSystem) ConfirmedImpactFX->SetAsset(ImpactSystem, true);
 SetAllVisible(true);
 return true;
}

bool AStarfortBattleStage::HasApprovedStage() const
{
 if (!bArtApprovedForMobile || !bThreeHeroTeamReady ||
     !ImpactSystem || !EnemyHitMontage ||
     ActiveTeamIds.Num()!=3 || ActiveHeroArt.Num()!=3 ||
     !EnemyRig || !EnemyRig->GetSkeletalMeshAsset() ||
     EnemyRig->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<24)
  return false;
 const USkeletalMeshComponent* Rigs[]={
  HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()
 };
 const UStaticMeshComponent* Weapons[]={
  HeroWeapon.Get(),HeroWeapon2.Get(),HeroWeapon3.Get()
 };
 TSet<const USkeletalMesh*> SeenBodies;
 TSet<const UStaticMesh*> SeenWeapons;
 for (int32 I=0;I<3;++I)
 {
  if (!ActiveHeroArt[I] ||
      !ActiveHeroArt[I]->HasProductionReadyGeometryAndMotion() ||
      !Rigs[I] || !Rigs[I]->GetSkeletalMeshAsset() ||
      Rigs[I]->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<40 ||
      !Weapons[I] || !Weapons[I]->GetStaticMesh())
   return false;
  const USkeletalMesh* Body=Rigs[I]->GetSkeletalMeshAsset();
  const UStaticMesh* Weapon=Weapons[I]->GetStaticMesh();
  if (SeenBodies.Contains(Body) || SeenWeapons.Contains(Weapon))
   return false;
  SeenBodies.Add(Body);
  SeenWeapons.Add(Weapon);
 }
 return true;
}

void AStarfortBattleStage::ClearBattlePresentation()
{
 if(GetWorld()) GetWorldTimerManager().ClearTimer(VerifiedImpactTimer);
 ResetCinematicDirector();
 ResetVerifiedCombatMotion();
 ++TeamLoadGeneration;
 bTeamLoadPending=false;
 if (TeamLoadHandle.IsValid())
 {
  TeamLoadHandle->CancelHandle();
  TeamLoadHandle.Reset();
 }
 PendingRoomId.Empty();
 PendingTeamIds.Reset();
 PendingTurn=-1;
 PendingWave=0;
 bThreeHeroTeamReady=false;
 ActiveRoomId.Empty();
 ActiveTeamIds.Reset();
 LastConfirmedTurn=-1;
 LastConfirmedWave=0;

 // Hide immediately, then drop the three expensive selected hero rigs.
 // No old player character remains after a different account signs in.
 SetAllVisible(false);
 for (USkeletalMeshComponent* Rig:
      {HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()})
 {
  if (!Rig) continue;
  Rig->SetAnimInstanceClass(nullptr);
  Rig->SetSkeletalMesh(nullptr);
 }
 for (UStaticMeshComponent* Weapon:
      {HeroWeapon.Get(),HeroWeapon2.Get(),HeroWeapon3.Get()})
  if (Weapon) Weapon->SetStaticMesh(nullptr);
 for (UNiagaraComponent* FX:
      {HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get(),
       HeroAuraFX1.Get(),HeroAuraFX2.Get(),HeroAuraFX3.Get()})
  if (FX) FX->SetAsset(nullptr, true);
 ActiveHeroArt.Reset();
}

void AStarfortBattleStage::BeginPlay()
{
 Super::BeginPlay();
 CaptureAuthoredFormation();
 SetAllVisible(false);
 if (!bArtApprovedForMobile)
  UE_LOG(LogTemp,Warning,
   TEXT("STARFORT: three-hero cinematic scene has no approved production art yet."));
}

void AStarfortBattleStage::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
 ClearBattlePresentation();
 Super::EndPlay(EndPlayReason);
}

void AStarfortBattleStage::CaptureAuthoredFormation()
{
 // Blueprint designers may place each rig differently. Never hardcode a
 // movement reset that destroys a licensed artist-authored formation.
 USkeletalMeshComponent* Rigs[]={
  HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()
 };
 for (int32 I=0;I<3;++I)
  if (Rigs[I]) HeroFormation[I]=Rigs[I]->GetRelativeLocation();
 if (EnemyRig) EnemyFormation=EnemyRig->GetRelativeLocation();
 bFormationCaptured=true;
}

void AStarfortBattleStage::ResetVerifiedCombatMotion()
{
 HeroMotionElapsed=0.f;
 HeroMotionDuration=0.f;
 EnemyMotionElapsed=0.f;
 EnemyMotionDuration=0.f;
 for (FVector& Offset:HeroMotionOffsets) Offset=FVector::ZeroVector;
 if (!bFormationCaptured) return;
 USkeletalMeshComponent* Rigs[]={
  HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()
 };
 for (int32 I=0;I<3;++I)
  if (Rigs[I]) Rigs[I]->SetRelativeLocation(HeroFormation[I]);
 if (EnemyRig) EnemyRig->SetRelativeLocation(EnemyFormation);
}

void AStarfortBattleStage::BeginVerifiedCombatMotion(
 const FString& Action,const FString& SkilledHero)
{
 if (!HasApprovedStage() || !bFormationCaptured) return;
 // Never apply additive offsets: repeated snapshots and reconnects must
 // not make a hero drift across the 3D battlefield.
 ResetVerifiedCombatMotion();
 if (Action==TEXT("strike"))
 {
  HeroMotionDuration=0.90f;
  HeroMotionOffsets[0]=FVector(82.f,-12.f,0.f);
  HeroMotionOffsets[1]=FVector(110.f,0.f,0.f);
  HeroMotionOffsets[2]=FVector(82.f,12.f,0.f);
 }
 else if (Action==TEXT("feint"))
 {
  HeroMotionDuration=0.72f;
  HeroMotionOffsets[0]=FVector(92.f,46.f,0.f);
  HeroMotionOffsets[1]=FVector(78.f,-38.f,0.f);
  HeroMotionOffsets[2]=FVector(112.f,-48.f,0.f);
 }
 else if (Action==TEXT("guard"))
 {
  HeroMotionDuration=0.65f;
  for (FVector& Offset:HeroMotionOffsets) Offset=FVector(-20.f,0.f,0.f);
 }
 else if (Action==TEXT("rally"))
 {
  HeroMotionDuration=0.85f;
  for (FVector& Offset:HeroMotionOffsets) Offset=FVector(14.f,0.f,0.f);
 }
 else if (Action.StartsWith(TEXT("skill:")))
 {
  const int32 I=ActiveTeamIds.Find(SkilledHero);
  if (I==INDEX_NONE || I>2) return;
  HeroMotionDuration=1.04f;
  // Melee champions step forward; the marksman holds their rifle position.
  const float Step=SkilledHero==TEXT("vesper") ? 154.f :
   SkilledHero==TEXT("doran") ? 110.f :
   SkilledHero==TEXT("aldren") ? 82.f :
   SkilledHero==TEXT("rovan") ? 18.f : 34.f;
  HeroMotionOffsets[I]=FVector(Step,0.f,0.f);
 }
}

void AStarfortBattleStage::TickVerifiedCombatMotion(float DeltaSeconds)
{
 if (!bFormationCaptured) return;
 if (HeroMotionDuration>0.f)
 {
  HeroMotionElapsed=FMath::Min(HeroMotionElapsed+
   FMath::Max(0.f,DeltaSeconds),HeroMotionDuration);
  const float Phase=HeroMotionElapsed/HeroMotionDuration;
  const float Wave=FMath::Sin(PI*Phase);
  USkeletalMeshComponent* Rigs[]={
   HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()
  };
  for (int32 I=0;I<3;++I)
   if (Rigs[I])
    Rigs[I]->SetRelativeLocation(HeroFormation[I]+HeroMotionOffsets[I]*Wave);
  if (HeroMotionElapsed>=HeroMotionDuration)
   HeroMotionDuration=0.f;
 }
 if (EnemyMotionDuration>0.f && EnemyRig)
 {
  EnemyMotionElapsed=FMath::Min(EnemyMotionElapsed+
   FMath::Max(0.f,DeltaSeconds),EnemyMotionDuration);
  const float Phase=EnemyMotionElapsed/EnemyMotionDuration;
  EnemyRig->SetRelativeLocation(EnemyFormation+
   FVector(36.f,0.f,0.f)*FMath::Sin(PI*Phase));
  if (EnemyMotionElapsed>=EnemyMotionDuration)
   EnemyMotionDuration=0.f;
 }
}

void AStarfortBattleStage::ResetCinematicDirector()
{
 DesiredArmLength=1510.f;
 DesiredFOV=43.f;
 DesiredFocus=FVector::ZeroVector;
 DesiredLook=FRotator(-15.f,-10.f,0.f);
 CameraBeatSeconds=0.f;
}

void AStarfortBattleStage::Tick(float DeltaTime)
{
 Super::Tick(DeltaTime);
 TickVerifiedCombatMotion(DeltaTime);
 if(CameraBeatSeconds>0.f)
 {
  CameraBeatSeconds=FMath::Max(0.f,CameraBeatSeconds-DeltaTime);
  if(CameraBeatSeconds==0.f) ResetCinematicDirector();
 }
 if(CinemaArm)
 {
  CinemaArm->TargetArmLength=FMath::FInterpTo(
   CinemaArm->TargetArmLength,DesiredArmLength,DeltaTime,5.f);
  CinemaArm->SetRelativeLocation(FMath::VInterpTo(
   CinemaArm->GetRelativeLocation(),DesiredFocus,DeltaTime,4.2f));
  CinemaArm->SetRelativeRotation(FMath::RInterpTo(
   CinemaArm->GetRelativeRotation(),DesiredLook,DeltaTime,3.8f));
 }
 if(CinemaCamera)
  CinemaCamera->SetFieldOfView(FMath::FInterpTo(
   CinemaCamera->FieldOfView,DesiredFOV,DeltaTime,4.f));
}

void AStarfortBattleStage::BeginCameraBeat(
 const FString& Action,const FString& SkilledHero)
{
 if(!HasApprovedStage()) return;
 // Compose focus from the authenticated team formation, not a fake event.
 const bool bSkill=Action.StartsWith(TEXT("skill:"));
 DesiredFocus=FVector(0.f,0.f,115.f);
 DesiredLook=FRotator(-12.f,-12.f,0.f);
 DesiredArmLength=1320.f;
 DesiredFOV=39.f;
 CameraBeatSeconds=1.12f;

 if(Action==TEXT("guard"))
 {
  DesiredArmLength=1400.f;
  DesiredFocus=FVector(-230.f,0.f,135.f);
  DesiredFOV=41.f;
  CameraBeatSeconds=0.96f;
 }
 else if(Action==TEXT("rally"))
 {
  DesiredArmLength=1740.f; // all three approved heroes stay on screen
  DesiredFocus=FVector(-60.f,0.f,160.f);
  DesiredFOV=45.f;
  CameraBeatSeconds=1.4f;
 }
 else if(Action==TEXT("feint"))
 {
  DesiredArmLength=1230.f;
  DesiredFocus=FVector(-120.f,-70.f,120.f);
  DesiredFOV=38.f;
 }
 else if(bSkill)
 {
  const int32 Index=ActiveTeamIds.Find(SkilledHero);
  USkeletalMeshComponent* Rigs[]={HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()};
  if(Index==INDEX_NONE || !Rigs[Index]) return;
  const FVector Caster=Rigs[Index]->GetRelativeLocation();
  DesiredFocus=FVector(
   FMath::Lerp(Caster.X,EnemyRig->GetRelativeLocation().X,0.28f),
   Caster.Y*0.66f,135.f);
  DesiredArmLength=SkilledHero==TEXT("vesper") ? 1110.f :
   SkilledHero==TEXT("rovan") ? 1260.f :
   SkilledHero==TEXT("aldren") ? 1210.f : 1370.f;
  DesiredFOV=SkilledHero==TEXT("vesper") ? 35.f : 37.f;
  CameraBeatSeconds=1.55f;
 }
}

void AStarfortBattleStage::PlayDelayedVerifiedImpact(
 uint64 PlaybackGeneration,FString PlaybackRoom,int32 PlaybackTurn)
{
 // A late hit may never leak into a new room/account or duplicate an old turn.
 if(PlaybackGeneration!=TeamLoadGeneration ||
    ActiveRoomId!=PlaybackRoom || LastConfirmedTurn!=PlaybackTurn ||
    !HasApprovedStage())
  return;
 if(ImpactSystem && ConfirmedImpactFX)
  ConfirmedImpactFX->Activate(true);
 // Enemy recoil, sound and hit montage are triggered by a strictly
 // positive server-confirmed hit; no locally predicted enemy health.
 EnemyMotionElapsed=0.f;
 EnemyMotionDuration=0.44f;
 if (ConfirmedEnemyImpactSound && EnemyRig)
  UGameplayStatics::PlaySoundAtLocation(
   this,ConfirmedEnemyImpactSound,EnemyRig->GetComponentLocation());
 if(EnemyHitMontage && EnemyRig)
  if(UAnimInstance* EnemyAnim=EnemyRig->GetAnimInstance())
   EnemyAnim->Montage_Play(EnemyHitMontage);
}

void AStarfortBattleStage::PlayVerifiedPartyAction(
 const FString& Action,int64 VerifiedDamage)
{
 if (!HasApprovedStage()) return;
 const bool bSkill=Action.StartsWith(TEXT("skill:"));
 const bool bAttack=Action==TEXT("strike") || Action==TEXT("feint") || bSkill;
 const FString SkilledHero=bSkill?Action.RightChop(6):TEXT("");
 if(!bSkill && Action!=TEXT("strike") && Action!=TEXT("guard") &&
    Action!=TEXT("feint") && Action!=TEXT("rally"))
  return; // Never synthesize cinematic beats for an unknown server action.

 // Skill hero must be in the actual authenticated roster. Otherwise ignore
 // the action rather than playing every hero's ultimate or invented damage.
 if(bSkill && !ActiveTeamIds.Contains(SkilledHero)) return;
 BeginCameraBeat(Action,SkilledHero);
 BeginVerifiedCombatMotion(Action,SkilledHero);

 USkeletalMeshComponent* Rigs[]={HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()};
 UNiagaraComponent* WeaponFX[]={
  HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get()
 };
 UNiagaraComponent* AuraFX[]={
  HeroAuraFX1.Get(),HeroAuraFX2.Get(),HeroAuraFX3.Get()
 };
 for (int32 I=0;I<3;++I)
 {
  if (bSkill && ActiveTeamIds[I]!=SkilledHero) continue;

  UStarfortHeroCombatAsset* Art=ActiveHeroArt[I].Get();
  if(!Art || !Rigs[I]) continue;
  UAnimMontage* Montage=nullptr;
  UNiagaraSystem* WeaponSystem=nullptr;
  UNiagaraSystem* AuraSystem=nullptr;
  if(Action==TEXT("strike"))
  {
   Montage=Art->StrikeMontage;
   WeaponSystem=Art->StrikeEffect;
  }
  else if(Action==TEXT("guard"))
  {
   Montage=Art->GuardMontage;
   AuraSystem=Art->GuardEffect;
  }
  else if(Action==TEXT("feint"))
  {
   Montage=Art->FeintMontage;
   WeaponSystem=Art->FeintEffect;
  }
  else if(Action==TEXT("rally"))
  {
   Montage=Art->RallyMontage;
   AuraSystem=Art->RallyEffect;
  }
  else if(bSkill)
  {
   Montage=Art->SpecialMontage;
   WeaponSystem=Art->SpecialEffect;
  }

  // Only bespoke, approved motion; never fall back to a shared mannequin
  // animation or use 2D concept art as world geometry.
  if(Montage)
   if(UAnimInstance* Anim=Rigs[I]->GetAnimInstance())
    Anim->Montage_Play(Montage);

  if(WeaponFX[I])
  {
   WeaponFX[I]->DeactivateImmediate();
   if(WeaponSystem)
   {
    WeaponFX[I]->SetAsset(WeaponSystem,true);
    WeaponFX[I]->Activate(true);
   }
  }
  if(AuraFX[I])
  {
   AuraFX[I]->DeactivateImmediate();
   if(AuraSystem)
   {
    AuraFX[I]->SetAsset(AuraSystem,true);
    AuraFX[I]->Activate(true);
   }
  }

  USoundBase* Sound=bSkill ? Art->SpecialAttackSound.Get():
   bAttack ? Art->BasicAttackSound.Get():nullptr;
  if(Sound)
   UGameplayStatics::PlaySoundAtLocation(this,Sound,Rigs[I]->GetComponentLocation());
 }

 if(GetWorld()) GetWorldTimerManager().ClearTimer(VerifiedImpactTimer);
 // The 0.28s delay is cosmetic only; attack results always come from the
 // verified RPC, and late callbacks are invalidated on turn/room changes.
 if(bAttack && VerifiedDamage>0 && GetWorld())
 {
  const uint64 PlaybackGeneration=TeamLoadGeneration;
  const FString PlaybackRoom=ActiveRoomId;
  const int32 PlaybackTurn=LastConfirmedTurn;
  const FTimerDelegate HitDelegate=FTimerDelegate::CreateUObject(this,
   &AStarfortBattleStage::PlayDelayedVerifiedImpact,
   PlaybackGeneration,PlaybackRoom,PlaybackTurn);
  GetWorldTimerManager().SetTimer(
   VerifiedImpactTimer,HitDelegate,0.28f,false);
 }
}

void AStarfortBattleStage::PresentVerifiedTurn(
 const FStarfortVerifiedBattleTurn& Snapshot)
{
 if (!Snapshot.bServerVerified || Snapshot.RoomId.IsEmpty() ||
     Snapshot.Turn<0 || Snapshot.VerifiedDamageDealt<0 ||
     Snapshot.TeamHeroes.Num()!=3 || Snapshot.Wave<1 ||
     Snapshot.Waves<1 || Snapshot.Wave>Snapshot.Waves)
  return;

 // Never play the current server turn while a large rig/texture is loading.
 // Instead keep the latest snapshot index, so joining mid-fight cannot
 // replay an old attack when streaming completes.
 if (bTeamLoadPending)
 {
  if (PendingRoomId==Snapshot.RoomId && PendingTeamIds==Snapshot.TeamHeroes)
  {
   if (Snapshot.Turn>=PendingTurn)
   {
    PendingTurn=Snapshot.Turn;
    PendingWave=Snapshot.Wave;
   }
   return;
  }
  BeginTeamAssetLoad(Snapshot); // New room/account invalidates old stream.
  return;
 }

 const bool bNewRoom=Snapshot.RoomId!=ActiveRoomId;
 const bool bRosterChanged=ActiveTeamIds!=Snapshot.TeamHeroes;
 if (bNewRoom || bRosterChanged || !bThreeHeroTeamReady)
 {
  BeginTeamAssetLoad(Snapshot);
  return; // OnTeamAssetsLoaded only configures audited rigs. No replay.
 }
 if (!HasApprovedStage() || Snapshot.Turn<=LastConfirmedTurn) return;

 // A new wave widens the cinema camera; the server-owned wave switch is
 // not itself a new attack, damage number, item drop or reward.
 if (Snapshot.Wave!=LastConfirmedWave)
 {
  LastConfirmedWave=Snapshot.Wave;
  DesiredArmLength=1730.f;
  DesiredFOV=45.f;
  DesiredFocus=FVector::ZeroVector;
  CameraBeatSeconds=1.1f;
 }
 LastConfirmedTurn=Snapshot.Turn;
 if (Snapshot.Turn==0) return;
 const bool bServerHit=Snapshot.VerifiedDamageDealt>0;
 PlayVerifiedPartyAction(Snapshot.LastAction,
  bServerHit ? Snapshot.VerifiedDamageDealt : 0);
}
