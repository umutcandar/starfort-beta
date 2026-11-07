#include "RoyalGunnerPreviewPawn.h"
#include "Camera/CameraComponent.h"
#include "Components/InputComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"
#include "NiagaraComponent.h"
#include "NiagaraSystem.h"
#include "Animation/AnimInstance.h"
#include "Animation/AnimMontage.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "Math/UnrealMathUtility.h"

ARoyalGunnerPreviewPawn::ARoyalGunnerPreviewPawn()
{
 PrimaryActorTick.bCanEverTick = true;
 AutoPossessPlayer = EAutoReceiveInput::Player0;
 SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
 RootComponent = SceneRoot;
 HeroBody = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeroSkinnedMesh"));
 HeroBody->SetupAttachment(SceneRoot);
 HeroBody->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 HeroBody->SetCastShadow(true);

 RoyalCannon = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("RoyalCannon"));
 RoyalCannon->SetupAttachment(HeroBody, TEXT("weapon_r"));
 RoyalCannon->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 RoyalCannon->SetCastShadow(true);

 MuzzleFlash = CreateDefaultSubobject<UNiagaraComponent>(TEXT("CannonMuzzleFX"));
 MuzzleFlash->SetupAttachment(RoyalCannon, TEXT("muzzle"));
 MuzzleFlash->SetAutoActivate(false);

 CameraArm = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraArm"));
 CameraArm->SetupAttachment(SceneRoot);
 CameraArm->TargetArmLength = 430.f;
 CameraArm->SetRelativeRotation(FRotator(-8.f,25.f,0.f));
 CameraArm->SetRelativeLocation(FVector(0.f,0.f,120.f));
 CameraArm->bDoCollisionTest = false;

 ShowcaseCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("ShowcaseCamera"));
 ShowcaseCamera->SetupAttachment(CameraArm, USpringArmComponent::SocketName);
 ShowcaseCamera->FieldOfView = 35.f;
}

void ARoyalGunnerPreviewPawn::BeginPlay()
{
 Super::BeginPlay();
 bAssetsReady = HeroBody->GetSkeletalMeshAsset() != nullptr
  && RoyalCannon->GetStaticMesh() != nullptr;
 if (!bAssetsReady)
 {
  UE_LOG(LogTemp, Error, TEXT("STARFORT native asset gate: hero and gun missing. Reject low-poly placeholder."));
  HeroBody->SetVisibility(false);
  RoyalCannon->SetVisibility(false);
  MuzzleFlash->SetVisibility(false);
  return;
 }
 const USkeletalMesh* Mesh = HeroBody->GetSkeletalMeshAsset();
 if (!Mesh || Mesh->GetRefSkeleton().GetNum() < 40
     || !HeroBody->DoesSocketExist(WeaponSocketName))
 {
  bAssetsReady = false;
  HeroBody->SetVisibility(false);
  RoyalCannon->SetVisibility(false);
  MuzzleFlash->SetVisibility(false);
  UE_LOG(LogTemp, Error, TEXT("STARFORT native asset gate: skeleton or weapon socket failed."));
  return;
 }
 RoyalCannon->AttachToComponent(HeroBody, FAttachmentTransformRules::SnapToTargetNotIncludingScale, WeaponSocketName);
 if (RoyalCannon->DoesSocketExist(MuzzleSocketName))
  MuzzleFlash->AttachToComponent(RoyalCannon, FAttachmentTransformRules::SnapToTargetNotIncludingScale, MuzzleSocketName);
 if (MuzzleSystem) MuzzleFlash->SetAsset(MuzzleSystem, true);
}

void ARoyalGunnerPreviewPawn::Tick(float DeltaSeconds)
{
 Super::Tick(DeltaSeconds);
 UpdateTouchInput();
}

void ARoyalGunnerPreviewPawn::SetupPlayerInputComponent(UInputComponent* Input)
{
 Super::SetupPlayerInputComponent(Input);
 check(Input);
 Input->BindAxis(TEXT("HeroOrbit"), this, &ARoyalGunnerPreviewPawn::OrbitAxis);
 Input->BindAxis(TEXT("HeroZoom"), this, &ARoyalGunnerPreviewPawn::ZoomAxis);
 Input->BindAction(TEXT("HeroFire"), IE_Pressed, this, &ARoyalGunnerPreviewPawn::FireEnergyCannon);
}

void ARoyalGunnerPreviewPawn::Orbit(float Delta)
{
 const FRotator Old=CameraArm->GetRelativeRotation();
 CameraArm->SetRelativeRotation(FRotator(Old.Pitch,Old.Yaw + FMath::Clamp(Delta,-30.f,30.f),0.f));
}
void ARoyalGunnerPreviewPawn::Zoom(float Delta)
{
 CameraArm->TargetArmLength=FMath::Clamp(CameraArm->TargetArmLength+Delta,250.f,850.f);
}
void ARoyalGunnerPreviewPawn::ResetCamera()
{
 CameraArm->SetRelativeRotation(FRotator(-8.f,25.f,0.f));
 CameraArm->TargetArmLength=430.f;
}
void ARoyalGunnerPreviewPawn::OrbitAxis(float Value)
{
 if(FMath::Abs(Value)>KINDA_SMALL_NUMBER) Orbit(Value*1.8f);
}
void ARoyalGunnerPreviewPawn::ZoomAxis(float Value)
{
 if(FMath::Abs(Value)>KINDA_SMALL_NUMBER) Zoom(-Value*42.f);
}
void ARoyalGunnerPreviewPawn::UpdateTouchInput()
{
 APlayerController* PC=Cast<APlayerController>(GetController());
 if(!PC)return;
 float X1=0.f,Y1=0.f,X2=0.f,Y2=0.f;
 bool T1=false,T2=false;
 PC->GetInputTouchState(ETouchIndex::Touch1,X1,Y1,T1);
 PC->GetInputTouchState(ETouchIndex::Touch2,X2,Y2,T2);
 if(T1&&T2)
 {
  const float Distance=FVector2D::Distance(FVector2D(X1,Y1),FVector2D(X2,Y2));
  if(bHadPinch) Zoom((LastPinchDistance-Distance)*2.f);
  LastPinchDistance=Distance;bHadPinch=true;bHadTouch=false;
 }
 else if(T1)
 {
  if(bHadTouch) Orbit((X1-LastTouch.X)*.25f);
  LastTouch=FVector2D(X1,Y1);bHadTouch=true;bHadPinch=false;
 }
 else {bHadTouch=false;bHadPinch=false;}
}
void ARoyalGunnerPreviewPawn::FireEnergyCannon()
{
 // Visual-only: approved server damage cannot be created by this local input.
 if(!bAssetsReady||!ShotMontage)return;
 if(UAnimInstance* Anim=HeroBody->GetAnimInstance())
 {
  Anim->Montage_Play(ShotMontage);
  if(MuzzleSystem)MuzzleFlash->Activate(true);
 }
}
