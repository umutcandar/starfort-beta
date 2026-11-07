#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "StarfortHeroCombatAsset.generated.h"

class USkeletalMesh;
class UStaticMesh;
class UAnimMontage;
class UNiagaraSystem;
class USoundBase;

/**
 * Art-directed, authored UE asset for ONE approved STARFORT hero.
 * The server provides the hero ID and battle action; this asset ONLY
 * determines its appearance, movement, voice and cosmetic effects.
 *
 * Art approval is human review of realism, material quality, licence,
 * device budget and animations. Bone counts alone are insufficient.
 */
UCLASS(BlueprintType)
class STARFORTUNREAL_API UStarfortHeroCombatAsset : public UPrimaryDataAsset
{
 GENERATED_BODY()

public:
 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Identity")
 FName HeroId = NAME_None;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Mesh")
 TObjectPtr<USkeletalMesh> HeroMesh;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Mesh")
 TObjectPtr<UStaticMesh> WeaponMesh;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Sockets")
 FName WeaponSocket = TEXT("weapon_r");

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Sockets")
 FName ImpactSocket = TEXT("muzzle");

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Animations")
 TObjectPtr<UAnimMontage> StrikeMontage;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Animations")
 TObjectPtr<UAnimMontage> GuardMontage;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Animations")
 TObjectPtr<UAnimMontage> FeintMontage;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Animations")
 TObjectPtr<UAnimMontage> RallyMontage;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Animations")
 TObjectPtr<UAnimMontage> SpecialMontage;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Effects")
 TObjectPtr<UNiagaraSystem> SpecialEffect;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Audio")
 TObjectPtr<USoundBase> BasicAttackSound;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Character|Audio")
 TObjectPtr<USoundBase> SpecialAttackSound;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Art Quality")
 bool bArtApprovedForMobile = false;

 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Art Quality")
 int32 AuthoredMobileLODCount = 0;

 UFUNCTION(BlueprintPure, Category="STARFORT|Quality")
 bool HasProductionReadyGeometryAndMotion() const;
};
