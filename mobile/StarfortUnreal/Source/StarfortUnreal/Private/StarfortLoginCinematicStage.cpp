#include "StarfortLoginCinematicStage.h"
#include "StarfortHeroCombatAsset.h"
#include "Camera/CameraComponent.h"
#include "Components/SceneComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/AudioComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/PointLightComponent.h"
#include "Engine/StaticMesh.h"
#include "Engine/SkeletalMesh.h"
#include "Animation/AnimInstance.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"
#include "Materials/MaterialInterface.h"
#include "UObject/ConstructorHelpers.h"

AStarfortLoginCinematicStage::AStarfortLoginCinematicStage()
{
 PrimaryActorTick.bCanEverTick=true;
 StageRoot=CreateDefaultSubobject<USceneComponent>(TEXT("StarfortCinematicRoot"));
 RootComponent=StageRoot;
 CinematicCamera=CreateDefaultSubobject<UCameraComponent>(TEXT("LoginCinematicCamera"));
 CinematicCamera->SetupAttachment(StageRoot);
 // Establish the whole citadel silhouette rather than cropping battlements.
 CameraOrigin=FVector(-4200.f,-2950.f,1850.f);
 CameraRotation=(FVector(220.f,0.f,800.f)-CameraOrigin).Rotation();
 CinematicCamera->SetRelativeLocation(CameraOrigin);
 CinematicCamera->SetRelativeRotation(CameraRotation);
 CinematicCamera->SetFieldOfView(58.f);

 ImportedCitadel=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("OriginalCitadel"));
 ImportedCitadel->SetupAttachment(StageRoot);
 ImportedCitadel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 ImportedCitadel->SetCastShadow(false);
 ImportedCitadel->SetVisibility(false);
 FeaturedHero=CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("FeaturedHero"));
 FeaturedHero->SetupAttachment(StageRoot);
 FeaturedHero->SetRelativeLocation(FVector(-660.f,470.f,50.f));
 FeaturedHero->SetRelativeRotation(FRotator(0.f,-55.f,0.f));
 FeaturedHero->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 FeaturedHero->SetVisibility(false);
 FeaturedWeapon=CreateDefaultSubobject<UStaticMeshComponent>(TEXT("FeaturedWeapon"));
 FeaturedWeapon->SetupAttachment(FeaturedHero);
 FeaturedWeapon->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 FeaturedWeapon->SetVisibility(false);

 MoonLight=CreateDefaultSubobject<UDirectionalLightComponent>(TEXT("Moonlight"));
 MoonLight->SetupAttachment(StageRoot);
 MoonLight->SetRelativeRotation(FRotator(-45.f,-50.f,0.f));
 MoonLight->SetIntensity(4.0f);
 MoonLight->SetLightColor(FLinearColor(0.66f,0.73f,0.88f,1.f));
 MoonLight->SetCastShadows(false); // intentional mobile budget

 TorchLightA=CreateDefaultSubobject<UPointLightComponent>(TEXT("WestFlame"));
 TorchLightA->SetupAttachment(StageRoot);
 TorchLightA->SetRelativeLocation(FVector(-430.f,-470.f,410.f));
 TorchLightA->SetIntensity(3500.f);
 TorchLightA->SetAttenuationRadius(920.f);
 TorchLightA->SetLightColor(FLinearColor(1.f,0.38f,0.12f,1.f));
 TorchLightA->SetCastShadows(false);
 TorchLightB=CreateDefaultSubobject<UPointLightComponent>(TEXT("EastFlame"));
 TorchLightB->SetupAttachment(StageRoot);
 TorchLightB->SetRelativeLocation(FVector(-430.f,470.f,410.f));
 TorchLightB->SetIntensity(3500.f);
 TorchLightB->SetAttenuationRadius(920.f);
 TorchLightB->SetLightColor(FLinearColor(1.f,0.42f,0.15f,1.f));
 TorchLightB->SetCastShadows(false);

 // One broad non-shadowing fill, not another realtime shadow pass on mobile.
 FortressFillLight=CreateDefaultSubobject<UPointLightComponent>(TEXT("CitadelFacadeFill"));
 FortressFillLight->SetupAttachment(StageRoot);
 FortressFillLight->SetRelativeLocation(FVector(2800.f,-1250.f,2200.f));
 FortressFillLight->SetIntensity(95000.f);
 FortressFillLight->SetAttenuationRadius(8000.f);
 FortressFillLight->SetLightColor(FLinearColor(0.77f,0.84f,1.f,1.f));
 FortressFillLight->SetCastShadows(false);

 GroundFog=CreateDefaultSubobject<UExponentialHeightFogComponent>(TEXT("GroundMist"));
 GroundFog->SetupAttachment(StageRoot);
 GroundFog->SetFogDensity(0.011f);
 GroundFog->SetFogInscatteringColor(FLinearColor(0.06f,0.085f,0.16f,1.f));

 static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(
  TEXT("/Engine/BasicShapes/Cube.Cube"));
 if(Cube.Succeeded()) CubePrimitive=Cube.Object;
 static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(
  TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
 if(Cylinder.Succeeded()) CylinderPrimitive=Cylinder.Object;
}

bool AStarfortLoginCinematicStage::HasApprovedHero() const
{
 return ApprovedFeaturedHero && ApprovedFeaturedHero->HasProductionReadyGeometryAndMotion();
}

void AStarfortLoginCinematicStage::SyncImportedCitadelMesh()
{
 if(!ImportedCitadel) return;

 if(!ImportedCitadelMesh)
 {
  ImportedCitadel->SetStaticMesh(nullptr);
  ImportedCitadel->SetVisibility(false);
  return; // No authored model yet: runtime can use the greybox fortress.
 }

 // Editor construction MUST render the real imported asset, not only BeginPlay.
 ImportedCitadel->SetStaticMesh(ImportedCitadelMesh);
 // The first STARFORT GLB has Z-up vertex geometry but glTF specifies
 // Y-up. Interchange converted glTF Z into a sideways Unreal axis: this
 // explains the sideways towers observed in the real Mac PIE screenshot.
 // Correct orientation BEFORE measuring the footprint or aiming the camera.
 ImportedCitadel->SetRelativeRotation(ImportedCitadelRotation);
 const FBox LocalBounds=ImportedCitadelMesh->GetBoundingBox();
 const FBox UprightBounds=LocalBounds.TransformBy(FTransform(ImportedCitadelRotation));
 const FVector UprightSize=UprightBounds.GetSize();
 const FVector UprightCenter=UprightBounds.GetCenter();
 const double LongestAxis=FMath::Max3(UprightSize.X,UprightSize.Y,UprightSize.Z);
 const double ArtScale=LongestAxis>1.0
  ? FMath::Clamp(3446.0/LongestAxis,0.001,100.0) : 1.0;
 ImportedCitadel->SetRelativeScale3D(FVector(ArtScale));
 ImportedCitadel->SetRelativeLocation(FVector(
  -UprightCenter.X*ArtScale,-UprightCenter.Y*ArtScale,-UprightBounds.Min.Z*ArtScale));
 // The gate is on the original model's +X face. Approach from that side,
 // slightly oblique, to show the entrance and towers instead of the blank rear.
 const double Span=FMath::Max(UprightSize.X,UprightSize.Y)*ArtScale;
 const double Height=UprightSize.Z*ArtScale;
 if(Span>100.0)
 {
  const FVector Target(0.0,0.0,Height*0.44);
  CameraOrigin=FVector(Span*1.82,-Span*0.67,Height*1.04);
  CameraRotation=(Target-CameraOrigin).Rotation();
  CinematicCamera->SetRelativeLocation(CameraOrigin);
  CinematicCamera->SetRelativeRotation(CameraRotation);
  // Direct the single existing shadowless moon key onto the visible facade.
  MoonLight->SetRelativeRotation(CameraRotation);
  // A broad, non-shadowcasting camera-side fill keeps dark PBR stone legible.
  FortressFillLight->SetRelativeLocation(FVector(Span*0.75,-Span*0.35,Height*0.72));
 }
 if(ImportedCitadelMaterial)
  ImportedCitadel->SetMaterial(0,ImportedCitadelMaterial);
 ImportedCitadel->SetVisibility(true);
}

void AStarfortLoginCinematicStage::OnConstruction(const FTransform& Transform)
{
 Super::OnConstruction(Transform);
 SyncImportedCitadelMesh();
}

void AStarfortLoginCinematicStage::BeginPlay()
{
 Super::BeginPlay();
 SyncImportedCitadelMesh();
 if(!ImportedCitadelMesh && bEnableGreyboxFortress)
  BuildFortress();
 if(HasApprovedHero())
 {
  FeaturedHero->SetSkeletalMesh(ApprovedFeaturedHero->HeroMesh);
  FeaturedHero->SetAnimInstanceClass(ApprovedFeaturedHero->AnimInstanceClass.Get());
  FeaturedHero->SetVisibility(true);
  if(ApprovedFeaturedHero->WeaponMesh &&
     FeaturedHero->DoesSocketExist(ApprovedFeaturedHero->WeaponSocket))
  {
   FeaturedWeapon->SetStaticMesh(ApprovedFeaturedHero->WeaponMesh);
   FeaturedWeapon->AttachToComponent(FeaturedHero,
    FAttachmentTransformRules::SnapToTargetNotIncludingScale,
    ApprovedFeaturedHero->WeaponSocket);
   FeaturedWeapon->SetVisibility(true);
  }
 }
 // Playing ambient music is opt-in: it requires a commercially usable cue.
 if(OpeningAmbience)
  PlayingAmbience=UGameplayStatics::SpawnSound2D(this,OpeningAmbience);
}

UStaticMeshComponent* AStarfortLoginCinematicStage::Part(
 const TCHAR* Label,const FVector& Pos,const FVector& Scale,bool bCylinder)
{
 UStaticMesh* Mesh=bCylinder ? CylinderPrimitive.Get() : CubePrimitive.Get();
 if(!Mesh) return nullptr;
 UStaticMeshComponent* Component=NewObject<UStaticMeshComponent>(this);
 if(!Component) return nullptr;
 Component->SetupAttachment(StageRoot);
 Component->SetStaticMesh(Mesh);
 if(Label && FCString::Strstr(Label,TEXT("Banner")) && BannerMaterial)
  Component->SetMaterial(0,BannerMaterial);
 else if(Label && FCString::Strstr(Label,TEXT("TorchFlame")) && EmberMaterial)
  Component->SetMaterial(0,EmberMaterial);
 else if(FortressMaterial)
  Component->SetMaterial(0,FortressMaterial);
 Component->SetRelativeLocation(Pos);
 Component->SetRelativeScale3D(Scale);
 Component->SetMobility(EComponentMobility::Movable);
 Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
 Component->SetCastShadow(false);
 Component->RegisterComponent();
 BuiltArchitecture.Add(Component);
 return Component;
}

void AStarfortLoginCinematicStage::BuildFortress()
{
 // Built-in primitive kit ensures an actual 3D setting, even with NO imported
 // .umap or .uasset. This is deliberately an atmospheric architectural blockout.
 if(!CubePrimitive) return;
 Part(TEXT("StoneCauseway"),FVector(-850.f,0.f,-55.f),FVector(29.f,24.f,1.0f));
 Part(TEXT("Bridge"),FVector(-1240.f,0.f,5.f),FVector(12.f,3.2f,.6f));
 Part(TEXT("CastlePlatform"),FVector(380.f,0.f,75.f),FVector(19.f,16.f,1.5f));

 // Curtain walls leave a central arched dark gate and wide keep beyond.
 for(int Side:{-1,1})
 {
  const float S=float(Side);
  Part(TEXT("Curtain"),FVector(-120.f,S*535.f,310.f),FVector(3.0f,7.4f,6.2f));
  Part(TEXT("CurtainCap"),FVector(-150.f,S*535.f,660.f),FVector(3.9f,7.6f,.5f));
  Part(TEXT("Tower"),FVector(-185.f,S*1030.f,465.f),
       FVector(3.4f,3.4f,10.0f),CylinderPrimitive!=nullptr);
  Part(TEXT("TowerLip"),FVector(-185.f,S*1030.f,990.f),
       FVector(4.2f,4.2f,.6f),CylinderPrimitive!=nullptr);
  Part(TEXT("TowerSpire"),FVector(-185.f,S*1030.f,1120.f),
       FVector(1.8f,1.8f,2.4f),CylinderPrimitive!=nullptr);
  // A few bold merlons read better on mobile than hundreds of small meshes.
  for(int Battlement=0;Battlement<5;++Battlement)
   Part(TEXT("Battlement"),
    FVector(-168.f,S*(270.f+Battlement*132.f),724.f),
    FVector(1.3f,0.72f,1.0f));
  Part(TEXT("GatePier"),FVector(-300.f,S*188.f,335.f),FVector(2.f,.95f,7.f));
  Part(TEXT("TorchBracket"),FVector(-440.f,S*345.f,345.f),FVector(.8f,.8f,.35f));
  Part(TEXT("TorchFlame"),FVector(-440.f,S*345.f,395.f),FVector(.40f,.40f,.65f),
       CylinderPrimitive!=nullptr);
  Part(TEXT("BannerPole"),FVector(-340.f,S*650.f,660.f),FVector(.25f,.25f,4.f),
       CylinderPrimitive!=nullptr);
  UStaticMeshComponent* Banner=Part(TEXT("Banner"),
    FVector(-348.f,S*650.f,605.f),FVector(.2f,1.25f,2.f));
  if(Side<0) BannerA=Banner; else BannerB=Banner;
 }
 // Keep, battlements, and vertical spires establish a believable silhouette.
 Part(TEXT("InnerKeep"),FVector(710.f,0.f,655.f),FVector(6.0f,6.6f,11.f));
 Part(TEXT("KeepTop"),FVector(680.f,0.f,1245.f),FVector(7.f,7.4f,.7f));
 for(int Side:{-1,1})
 {
  const float S=float(Side);
  Part(TEXT("InnerTower"),FVector(420.f,S*630.f,685.f),
    FVector(3.f,3.f,13.f),CylinderPrimitive!=nullptr);
  Part(TEXT("InnerTowerCap"),FVector(420.f,S*630.f,1370.f),
    FVector(3.7f,3.7f,.65f),CylinderPrimitive!=nullptr);
 }
 Part(TEXT("CentralSpire"),FVector(860.f,0.f,1450.f),FVector(2.1f,2.1f,4.4f),
      CylinderPrimitive!=nullptr);
 for(int Index=0;Index<8;++Index)
  Part(TEXT("KeepCrenel"),FVector(370.f,(-3.5f+float(Index))*158.f,1315.f),
    FVector(1.1f,.72f,1.2f));

 // Foreground masonry silhouettes frame the scene without creating a fake hero.
 for(int Side:{-1,1})
 {
  Part(TEXT("ForegroundRock"),FVector(-1300.f,float(Side)*1110.f,40.f),
    FVector(3.3f,5.1f,2.2f));
  Part(TEXT("ForegroundColumn"),FVector(-1320.f,float(Side)*900.f,280.f),
    FVector(1.4f,1.4f,5.8f),CylinderPrimitive!=nullptr);
 }
}

void AStarfortLoginCinematicStage::Tick(float DeltaSeconds)
{
 Super::Tick(DeltaSeconds);
 Elapsed+=FMath::Clamp(DeltaSeconds,0.f,.08f);
 // Deliberate sub-degree cinematic drift, not an unbounded orbit/phone drain.
 CinematicCamera->SetRelativeLocation(
  CameraOrigin+FVector(0.f,FMath::Sin(Elapsed*.11f)*23.f,
    FMath::Sin(Elapsed*.17f)*12.f));
 CinematicCamera->SetRelativeRotation(CameraRotation+
  FRotator(0.f,FMath::Sin(Elapsed*.13f)*.5f,0.f));
 TorchLightA->SetIntensity(3400.f+FMath::Sin(Elapsed*4.7f)*160.f);
 TorchLightB->SetIntensity(3500.f+FMath::Sin(Elapsed*4.2f+1.6f)*140.f);
 if(BannerA) BannerA->SetRelativeRotation(
  FRotator(0.f,FMath::Sin(Elapsed*1.2f)*3.f,0.f));
 if(BannerB) BannerB->SetRelativeRotation(
  FRotator(0.f,FMath::Sin(Elapsed*1.1f+1.f)*3.f,0.f));
}

void AStarfortLoginCinematicStage::EndPlay(
 const EEndPlayReason::Type EndPlayReason)
{
 if(PlayingAmbience)
 {
  PlayingAmbience->Stop();
  PlayingAmbience=nullptr;
 }
 Super::EndPlay(EndPlayReason);
}
