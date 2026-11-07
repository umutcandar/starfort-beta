#include "StarfortMobileHeroPawn.h"

#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Engine/Engine.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"

AStarfortMobileHeroPawn::AStarfortMobileHeroPawn()
{
    PrimaryActorTick.bCanEverTick = true;
    AutoPossessPlayer = EAutoReceiveInput::Player0;
    Pivot = CreateDefaultSubobject<USceneComponent>(TEXT("Pivot"));
    SetRootComponent(Pivot);

    HeroMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HighFidelitySkeletalHero"));
    HeroMesh->SetupAttachment(Pivot);
    HeroMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    HeroMesh->SetCastShadow(true);

    SpringArm = CreateDefaultSubobject<USpringArmComponent>(TEXT("HeroViewArm"));
    SpringArm->SetupAttachment(Pivot);
    SpringArm->TargetArmLength = 350.f;
    SpringArm->bDoCollisionTest = false;
    SpringArm->SetRelativeRotation(FRotator(-8.f, 0.f, 0.f));

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("HeroViewCamera"));
    Camera->SetupAttachment(SpringArm, USpringArmComponent::SocketName);
    Camera->FieldOfView = 36.f;
}

void AStarfortMobileHeroPawn::BeginPlay()
{
    Super::BeginPlay();
    // Deliberately no block-geometry fallback. A polished asset must be imported and assigned.
    if (!HeroMesh->GetSkeletalMeshAsset())
    {
        UE_LOG(LogTemp, Error, TEXT("STARFORT: Missing approved skeletal hero mesh. Import a production character before shipping."));
#if !UE_BUILD_SHIPPING
        if (GEngine)
        {
            GEngine->AddOnScreenDebugMessage(-1, 12.0f, FColor::Red,
                TEXT("STARFORT: 3D hero asset missing - production model required"));
        }
#endif
    }
}

void AStarfortMobileHeroPawn::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (!bOrbitTouchEnabled) return;

    APlayerController* PC = Cast<APlayerController>(GetController());
    if (!PC) return;

    float X1=0.f, Y1=0.f, X2=0.f, Y2=0.f;
    bool Pressed1=false, Pressed2=false;
    PC->GetInputTouchState(ETouchIndex::Touch1, X1, Y1, Pressed1);
    PC->GetInputTouchState(ETouchIndex::Touch2, X2, Y2, Pressed2);

    if (!Pressed1)
    {
        bTouchWasHeld = false;
        LastPinchDistance = 0.f;
        return;
    }
    if (!bTouchWasHeld)
    {
        LastTouch = FVector2D(X1, Y1);
        bTouchWasHeld = true;
    }
    const FVector2D Current(X1, Y1);
    if (Pressed2)
    {
        const float Distance = FVector2D::Distance(Current, FVector2D(X2, Y2));
        if (LastPinchDistance > 1.f && Distance > 1.f)
        {
            const float Ratio = LastPinchDistance / Distance;
            SpringArm->TargetArmLength = FMath::Clamp(
                SpringArm->TargetArmLength * Ratio, MinZoom, MaxZoom);
        }
        LastPinchDistance = Distance;
    }
    else
    {
        LastPinchDistance = 0.f;
        const float DeltaX = Current.X - LastTouch.X;
        HeroMesh->AddLocalRotation(FRotator(0.f, DeltaX * OrbitSensitivity, 0.f));
    }
    LastTouch = Current;
}
