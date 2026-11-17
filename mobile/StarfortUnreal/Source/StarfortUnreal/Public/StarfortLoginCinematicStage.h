#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "StarfortLoginCinematicStage.generated.h"

class USceneComponent;
class UCameraComponent;
class USkeletalMeshComponent;
class UStaticMeshComponent;
class UStaticMesh;
class USoundBase;
class UAudioComponent;
class UDirectionalLightComponent;
class UPointLightComponent;
class UExponentialHeightFogComponent;
class UStarfortHeroCombatAsset;
class UMaterialInterface;

/**
 * Art-independent FIRST-PASS 3D environment behind the native login HUD.
 * Replaces a blank Entry world. Its modular cube fortress is a greybox,
 * NOT approved production art. Original asset-driven meshes can replace it.
 * No client session, inventory, currency or quest logic lives here.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortLoginCinematicStage : public AActor
{
 GENERATED_BODY()
public:
 AStarfortLoginCinematicStage();
 virtual void OnConstruction(const FTransform& Transform) override;
 virtual void BeginPlay() override;
 virtual void Tick(float DeltaSeconds) override;
 virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Login|Camera")
 TObjectPtr<UCameraComponent> CinematicCamera;

 /** Assign only an original reviewed hero asset from the Unreal Editor. */
 UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="STARFORT|Login|Art")
 TObjectPtr<UStarfortHeroCombatAsset> ApprovedFeaturedHero;

 /** Optional licensed/original looping audio; never auto-fetch remote media. */
 UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="STARFORT|Login|Audio")
 TObjectPtr<USoundBase> OpeningAmbience;
 /** Optional original game-owned static environment, replacing greybox blocks. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Art")
 TObjectPtr<UStaticMesh> ImportedCitadelMesh;

 /** The v1 GLB was authored Z-up despite glTF's Y-up convention.
  * Unreal imported the original tower axis sideways. Actual PIE screenshots
  * prove that +90 degrees rolled the towers downward. -90 is the correction
  * for this *specific* v1 asset; properly oriented future GLBs should use 0. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Art")
 FRotator ImportedCitadelRotation=FRotator(0.f,0.f,-90.f);

 /** Material must use VertexColor to preserve original fortress facade palette. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Art")
 TObjectPtr<UMaterialInterface> ImportedCitadelMaterial;

 /** Procedural stage surfaces can use original materials created in Editor. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Materials")
 TObjectPtr<UMaterialInterface> FortressMaterial;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Materials")
 TObjectPtr<UMaterialInterface> BannerMaterial;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Login|Materials")
 TObjectPtr<UMaterialInterface> EmberMaterial;

 UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="STARFORT|Login|Quality")
 bool bEnableGreyboxFortress=true;

 UFUNCTION(BlueprintPure, Category="STARFORT|Login|Art")
 bool HasApprovedHero() const;

private:
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<USceneComponent> StageRoot;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<USkeletalMeshComponent> FeaturedHero;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UStaticMeshComponent> ImportedCitadel;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UStaticMeshComponent> FeaturedWeapon;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UDirectionalLightComponent> MoonLight;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UPointLightComponent> TorchLightA;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UPointLightComponent> TorchLightB;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UPointLightComponent> FortressFillLight;
 UPROPERTY(VisibleAnywhere, Category="STARFORT|Login")
 TObjectPtr<UExponentialHeightFogComponent> GroundFog;
 UPROPERTY(Transient)
 TObjectPtr<UAudioComponent> PlayingAmbience;
 UPROPERTY(Transient)
 TArray<TObjectPtr<UStaticMeshComponent>> BuiltArchitecture;
 UPROPERTY(Transient)
 TObjectPtr<UStaticMeshComponent> BannerA;
 UPROPERTY(Transient)
 TObjectPtr<UStaticMeshComponent> BannerB;
 UPROPERTY(Transient)
 TObjectPtr<UStaticMesh> CubePrimitive;
 UPROPERTY(Transient)
 TObjectPtr<UStaticMesh> CylinderPrimitive;

 float Elapsed=0.f;
 FVector CameraOrigin=FVector::ZeroVector;
 FRotator CameraRotation=FRotator::ZeroRotator;
 void SyncImportedCitadelMesh();
 void BuildFortress();
 UStaticMeshComponent* Part(const TCHAR* Label,const FVector& Pos,
  const FVector& Scale,bool bCylinder=false);
};
