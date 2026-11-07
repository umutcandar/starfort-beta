#include "StarfortVillageCameraPawn.h"
#include "StarfortVillageBuilding.h"
#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SpringArmComponent.h"

AStarfortVillageCameraPawn::AStarfortVillageCameraPawn()
{
 PrimaryActorTick.bCanEverTick = true;
 CameraRoot = CreateDefaultSubobject<USceneComponent>(TEXT("VillageCameraRoot"));
 RootComponent = CameraRoot;
 CameraArm = CreateDefaultSubobject<USpringArmComponent>(TEXT("IsometricCameraArm"));
 CameraArm->SetupAttachment(CameraRoot);
 CameraArm->TargetArmLength = 2200.f;
 CameraArm->SetRelativeRotation(FRotator(-57.f, -43.f, 0.f));
 CameraArm->bDoCollisionTest = false;
 VillageCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("VillageCamera"));
 VillageCamera->SetupAttachment(CameraArm, USpringArmComponent::SocketName);
 VillageCamera->FieldOfView = 38.f;
}
void AStarfortVillageCameraPawn::BeginPlay()
{
 Super::BeginPlay();
}
void AStarfortVillageCameraPawn::Tick(float DeltaSeconds)
{
 Super::Tick(DeltaSeconds);
 ReadTouchGestures();
}
void AStarfortVillageCameraPawn::SetWorldInteractionEnabled(bool bEnabled)
{
 bWorldInteractionEnabled = bEnabled;
 bSingleTouchActive = false;
 bPinchActive = false;
 DragDistance = 0.f;
}
void AStarfortVillageCameraPawn::PanByScreenDelta(float DeltaX, float DeltaY)
{
 if (!bWorldInteractionEnabled) return;
 FVector Right = VillageCamera->GetRightVector();
 FVector Forward = VillageCamera->GetForwardVector();
 Right.Z = 0.f;
 Forward.Z = 0.f;
 Right.Normalize();
 Forward.Normalize();
 const float ZoomScale = FMath::Clamp(CameraArm->TargetArmLength / 1800.f, .35f, 2.2f);
 FVector NewLocation = GetActorLocation() + ((-Right * DeltaX) + (Forward * DeltaY)) * ZoomScale;
 NewLocation.X = FMath::Clamp(NewLocation.X, -6500.f, 6500.f);
 NewLocation.Y = FMath::Clamp(NewLocation.Y, -6500.f, 6500.f);
 NewLocation.Z = GetActorLocation().Z;
 SetActorLocation(NewLocation);
}
void AStarfortVillageCameraPawn::ZoomBy(float Delta)
{
 if (!bWorldInteractionEnabled) return;
 CameraArm->TargetArmLength = FMath::Clamp(CameraArm->TargetArmLength + Delta, 900.f, 3700.f);
}
bool AStarfortVillageCameraPawn::IsWorldStagePosition(const FVector2D& Point) const
{
 const APlayerController* PC = Cast<APlayerController>(GetController());
 if (!PC) return false;
 int32 Width=0, Height=0;
 PC->GetViewportSize(Width, Height);
 // Top resource bar, left hero roster, right details and bottom nav are UI-only.
 return Width > 0 && Height > 0 &&
  Point.X > Width * .12f && Point.X < Width * .74f &&
  Point.Y > Height * .12f && Point.Y < Height * .86f;
}
void AStarfortVillageCameraPawn::TryPickBuilding(const FVector2D& Point)
{
 if (!bWorldInteractionEnabled || !IsWorldStagePosition(Point)) return;
 APlayerController* PC=Cast<APlayerController>(GetController());
 if (!PC || !GetWorld()) return;
 FVector Origin, Direction;
 if (!PC->DeprojectScreenPositionToWorld(Point.X, Point.Y, Origin, Direction)) return;
 FCollisionQueryParams Params(SCENE_QUERY_STAT(StarfortBuildingPick), true);
 Params.AddIgnoredActor(this);
 FHitResult Hit;
 if (!GetWorld()->LineTraceSingleByChannel(Hit, Origin, Origin + Direction * 80000.f, ECC_Visibility, Params))
  return;
 AStarfortVillageBuilding* Building = Cast<AStarfortVillageBuilding>(Hit.GetActor());
 if (Building && Building->HasApprovedDisplayMesh())
 {
  if (HighlightedBuilding.IsValid()) HighlightedBuilding->SetSelectionHighlight(false);
  HighlightedBuilding=Building;
  Building->SetSelectionHighlight(true);
  OnBuildingSelected.Broadcast(Building->GetBuildingId());
 }
}
void AStarfortVillageCameraPawn::ReadTouchGestures()
{
 APlayerController* PC = Cast<APlayerController>(GetController());
 if (!PC || !bWorldInteractionEnabled) return;
 float X1=0.f,Y1=0.f,X2=0.f,Y2=0.f;
 bool T1=false,T2=false;
 PC->GetInputTouchState(ETouchIndex::Touch1, X1, Y1, T1);
 PC->GetInputTouchState(ETouchIndex::Touch2, X2, Y2, T2);
 if (T1 && T2)
 {
  const float CurrentPinch = FVector2D::Distance(FVector2D(X1,Y1), FVector2D(X2,Y2));
  if (bPinchActive) ZoomBy((LastPinchDistance - CurrentPinch) * 2.1f);
  LastPinchDistance = CurrentPinch;
  bPinchActive = true;
  bSingleTouchActive = false;
  return;
 }
 if (T1)
 {
  const FVector2D Point(X1,Y1);
  if (!bSingleTouchActive)
  {
   bSingleTouchActive = true;
   TouchOrigin = Point;
   LastTouch = Point;
   DragDistance = 0.f;
  }
  else
  {
   const FVector2D Delta = Point - LastTouch;
   DragDistance = FMath::Max(DragDistance, FVector2D::Distance(Point, TouchOrigin));
   if (!bPinchActive && IsWorldStagePosition(Point) && DragDistance > 12.f)
    PanByScreenDelta(Delta.X, Delta.Y);
   LastTouch = Point;
  }
 }
 else
 {
  if (bSingleTouchActive && !bPinchActive && DragDistance <= 14.f)
   TryPickBuilding(LastTouch);
  bSingleTouchActive = false;
  bPinchActive = false;
  DragDistance = 0.f;
 }
}
