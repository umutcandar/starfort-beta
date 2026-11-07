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

 // Only load the hero named by the authenticated roster. The other four
 // large UE models remain soft references rather than eager map-load assets.
 // In the production UX, prefetch during the battle loading screen to
 // avoid first-use blocking on a low-memory phone.
 UStarfortHeroCombatAsset* Candidate=Match->Art.LoadSynchronous();
 if (!Candidate || Candidate->HeroId.ToString()!=HeroId ||
     !Candidate->HasProductionReadyGeometryAndMotion())
  return nullptr;
 return Candidate;
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
 for (int32 I=0;I<3;++I)
 {
  const FString& HeroId=VerifiedTeam[I];
  if (HeroId.IsEmpty() || Unique.Contains(HeroId)) return false;
  Unique.Add(HeroId);

  UStarfortHeroCombatAsset* Art=FindApprovedHero(HeroId);
  if (!Art || !Rigs[I] || !Weapons[I] || !SpecialFX[I]) return false;

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
 for (int32 I=0;I<3;++I)
 {
  if (!ActiveHeroArt[I] ||
      !ActiveHeroArt[I]->HasProductionReadyGeometryAndMotion() ||
      !Rigs[I] || !Rigs[I]->GetSkeletalMeshAsset() ||
      Rigs[I]->GetSkeletalMeshAsset()->GetRefSkeleton().GetNum()<40 ||
      !Weapons[I] || !Weapons[I]->GetStaticMesh())
   return false;
 }
 return true;
}

void AStarfortBattleStage::ClearBattlePresentation()
{
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
      {HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get()})
  if (FX) FX->SetAsset(nullptr, true);
 ActiveHeroArt.Reset();
}

void AStarfortBattleStage::BeginPlay()
{
 Super::BeginPlay();
 SetAllVisible(false);
 if (!bArtApprovedForMobile)
  UE_LOG(LogTemp,Warning,
   TEXT("STARFORT: three-hero cinematic scene has no approved production art yet."));
}

void AStarfortBattleStage::Tick(float DeltaTime)
{
 Super::Tick(DeltaTime);
 if (CinemaArm)
  CinemaArm->TargetArmLength=FMath::FInterpTo(
   CinemaArm->TargetArmLength,1510.f,DeltaTime,2.7f);
}

void AStarfortBattleStage::PlayVerifiedPartyAction(
 const FString& Action,int64 VerifiedDamage)
{
 if (!HasApprovedStage()) return;
 const bool bSkill=Action.StartsWith(TEXT("skill:"));
 const bool bAttack=Action==TEXT("strike") || Action==TEXT("feint") || bSkill;
 const FString SkilledHero=bSkill?Action.RightChop(6):TEXT("");

 USkeletalMeshComponent* Rigs[]={HeroRig.Get(),HeroRig2.Get(),HeroRig3.Get()};
 UNiagaraComponent* Effects[]={
  HeroSpecialFX1.Get(),HeroSpecialFX2.Get(),HeroSpecialFX3.Get()
 };
 for (int32 I=0;I<3;++I)
 {
  if (bSkill && ActiveTeamIds[I]!=SkilledHero) continue;

  UStarfortHeroCombatAsset* Art=ActiveHeroArt[I].Get();
  UAnimMontage* Montage=nullptr;
  if (Action==TEXT("strike")) Montage=Art->StrikeMontage;
  else if (Action==TEXT("guard")) Montage=Art->GuardMontage;
  else if (Action==TEXT("feint")) Montage=Art->FeintMontage;
  else if (Action==TEXT("rally")) Montage=Art->RallyMontage;
  else if (bSkill) Montage=Art->SpecialMontage;

  // Retain legacy director override slots for authored older battle scenes.
  // Per-hero montage takes priority: no generic animation if a hero is missing.
  if (!Montage && I==0)
  {
   if (Action==TEXT("strike")) Montage=VerifiedShotMontage;
   else if (Action==TEXT("guard")) Montage=GuardMontage;
   else if (Action==TEXT("feint")) Montage=FeintMontage;
   else if (Action==TEXT("rally")) Montage=RallyMontage;
   else if (bSkill) Montage=HeroSkillMontage;
  }

  if (Montage)
   if (UAnimInstance* Anim=Rigs[I]->GetAnimInstance())
    Anim->Montage_Play(Montage);

  USoundBase* Sound=bSkill ? Art->SpecialAttackSound.Get():
   bAttack ? Art->BasicAttackSound.Get():nullptr;
  if (Sound)
   UGameplayStatics::PlaySoundAtLocation(this,Sound,Rigs[I]->GetComponentLocation());

  // Only the selected named hero receives its own ultimate VFX.
  if (bSkill && Art->SpecialEffect && Effects[I])
   Effects[I]->Activate(true);
 }

 // The hit/impact is cosmetic and follows the server's confirmed damage.
 if (bAttack && VerifiedDamage>0)
 {
  if (ImpactSystem) ConfirmedImpactFX->Activate(true);
  if (EnemyHitMontage)
   if (UAnimInstance* EnemyAnim=EnemyRig->GetAnimInstance())
    EnemyAnim->Montage_Play(EnemyHitMontage);
  if (CinemaArm) CinemaArm->TargetArmLength=1230.f;
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

 const bool bNewRoom=Snapshot.RoomId!=ActiveRoomId;
 const bool bRosterChanged=ActiveTeamIds!=Snapshot.TeamHeroes;
 if (bNewRoom || bRosterChanged || !bThreeHeroTeamReady)
 {
  if (bNewRoom)
  {
   ActiveRoomId=Snapshot.RoomId;
   LastConfirmedTurn=-1;
   LastConfirmedWave=0;
  }
  if (!ConfigureTeam(Snapshot.TeamHeroes))
  {
   // Player can still read server combat HUD, but cinematic models are
   // deliberately hidden until all three real assets are approved.
   UE_LOG(LogTemp,Warning,
    TEXT("STARFORT: three approved hero rigs or socket assets unavailable"));
   return;
  }
  if (bNewRoom && Snapshot.Turn>0)
  {
   // Reconnecting mid-battle must not replay an old confirmed skill or hit.
   LastConfirmedTurn=Snapshot.Turn;
   LastConfirmedWave=Snapshot.Wave;
   return;
  }
 }
 if (!HasApprovedStage() || Snapshot.Turn<=LastConfirmedTurn) return;

 // A new wave widens the cinema camera; the server-owned wave switch is
 // not itself a new attack, damage number, item drop or reward.
 if (Snapshot.Wave!=LastConfirmedWave)
 {
  LastConfirmedWave=Snapshot.Wave;
  if (CinemaArm) CinemaArm->TargetArmLength=1730.f;
 }
 LastConfirmedTurn=Snapshot.Turn;
 if (Snapshot.Turn==0) return;
 const bool bServerHit=Snapshot.VerifiedDamageDealt>0;
 PlayVerifiedPartyAction(Snapshot.LastAction,
  bServerHit ? Snapshot.VerifiedDamageDealt : 0);
}
