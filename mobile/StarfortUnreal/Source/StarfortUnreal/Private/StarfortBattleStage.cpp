#include "StarfortBattleStage.h"
#include "StarfortBattleScreen.h"
#include "Animation/AnimInstance.h"
#include "Animation/AnimMontage.h"
#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/SkeletalMesh.h"
#include "GameFramework/SpringArmComponent.h"
#include "NiagaraComponent.h"
#include "NiagaraSystem.h"

AStarfortBattleStage::AStarfortBattleStage()
{
 PrimaryActorTick.bCanEverTick=true;
 StageRoot=CreateDefaultSubobject<USceneComponent>(TEXT("StageRoot"));
 RootComponent=StageRoot;

 HeroRig=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeroRig"));
 HeroRig->SetupAttachment(StageRoot);
 HeroRig->SetRelativeLocation(FVector(-420.f,-130.f,0.f));
 HeroRig->SetRelativeRotation(FRotator(0.f,35.f,0.f));
 HeroRig->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 HeroRig->SetCastShadow(true);

 EnemyRig=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("EnemyRig"));
 EnemyRig->SetupAttachment(StageRoot);
 EnemyRig->SetRelativeLocation(FVector(430.f,160.f,0.f));
 EnemyRig->SetRelativeRotation(FRotator(0.f,215.f,0.f));
 EnemyRig->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 EnemyRig->SetCastShadow(true);

 HeroWeapon=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("HeroEnergyWeapon"));
 HeroWeapon->SetupAttachment(HeroRig, TEXT("weapon_r"));
 HeroWeapon->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 HeroWeapon->SetCastShadow(true);

 ConfirmedImpactFX=CreateDefaultSubobject<UNiagaraComponent>(TEXT("ConfirmedWeaponFX"));
 ConfirmedImpactFX->SetupAttachment(HeroWeapon, TEXT("muzzle"));
 ConfirmedImpactFX->SetAutoActivate(false);

 CinemaArm=CreateDefaultSubobject<USpringArmComponent>(TEXT("CinemaArm"));
 CinemaArm->SetupAttachment(StageRoot);
 CinemaArm->SetRelativeRotation(FRotator(-17.f,0.f,0.f));
 CinemaArm->TargetArmLength=1280.f;
 CinemaArm->bDoCollisionTest=false;

 CinemaCamera=CreateDefaultSubobject<UCameraComponent>(TEXT("CinemaCamera"));
 CinemaCamera->SetupAttachment(CinemaArm, USpringArmComponent::SocketName);
 CinemaCamera->FieldOfView=44.f;
}
bool AStarfortBattleStage::HasApprovedStage() const
{
 const USkeletalMesh* Hero=HeroRig ? HeroRig->GetSkeletalMeshAsset() : nullptr;
 const USkeletalMesh* Enemy=EnemyRig ? EnemyRig->GetSkeletalMeshAsset() : nullptr;
 return bArtApprovedForMobile && Hero && Enemy && HeroWeapon && HeroWeapon->GetStaticMesh() &&
  Hero->GetRefSkeleton().GetNum()>=40 && Enemy->GetRefSkeleton().GetNum()>=24;
}
void AStarfortBattleStage::BeginPlay()
{
 Super::BeginPlay();
 const bool bReady=HasApprovedStage();
 HeroRig->SetVisibility(bReady);
 EnemyRig->SetVisibility(bReady);
 HeroWeapon->SetVisibility(bReady);
 ConfirmedImpactFX->SetVisibility(bReady);
 if (bReady && ImpactSystem) ConfirmedImpactFX->SetAsset(ImpactSystem);
 if (!bReady)
  UE_LOG(LogTemp, Warning, TEXT("STARFORT battle stage: real approved meshes unavailable; no toy actors shown."));
}
void AStarfortBattleStage::Tick(float DeltaTime)
{
 Super::Tick(DeltaTime);
 CinemaArm->TargetArmLength=FMath::FInterpTo(CinemaArm->TargetArmLength,1280.f,DeltaTime,3.2f);
}
void AStarfortBattleStage::PresentVerifiedTurn(const FStarfortVerifiedBattleTurn& Snapshot)
{
 if (!HasApprovedStage() || !Snapshot.bServerVerified || Snapshot.RoomId.IsEmpty() ||
     Snapshot.Turn<0 || Snapshot.VerifiedDamageDealt<0) return;
 if (Snapshot.RoomId!=ActiveRoomId)
 {
  ActiveRoomId=Snapshot.RoomId;
  LastConfirmedTurn=-1;
 }
 if (Snapshot.Turn<=LastConfirmedTurn) return;
 const bool bValidHit=Snapshot.Turn>0 && Snapshot.VerifiedDamageDealt>0 &&
  Snapshot.HeroHP>=0 && Snapshot.EnemyHP>=0;
 LastConfirmedTurn=Snapshot.Turn;
 if (!bValidHit) return;
 // Effect follows an accepted server turn only. It never changes HP or drops.
 if (VerifiedShotMontage)
  if (UAnimInstance* Anim=HeroRig->GetAnimInstance())
   Anim->Montage_Play(VerifiedShotMontage);
 if (ImpactSystem) ConfirmedImpactFX->Activate(true);
 CinemaArm->TargetArmLength=1120.f;
}
