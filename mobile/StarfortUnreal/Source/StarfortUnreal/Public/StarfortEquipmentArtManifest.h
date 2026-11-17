#pragma once
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "UObject/SoftObjectPtr.h"
#include "StarfortEquipmentArtManifest.generated.h"

class UStaticMesh;
class USkeletalMesh;

/** Cosmetic art for an EXISTING server-approved weapon or armor item ID. */
USTRUCT(BlueprintType)
struct STARFORTUNREAL_API FStarfortShowcaseGearArt
{
 GENERATED_BODY()
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 FName ItemId=NAME_None;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 FName Slot=NAME_None;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 TSoftObjectPtr<UStaticMesh> WeaponMesh;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 TSoftObjectPtr<USkeletalMesh> ArmorMesh;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 FName AttachmentSocket=TEXT("weapon_r");
 /** Socket on this exact weapon mesh used by authored projectile / impact VFX. */
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Equipment")
 FName ImpactSocket=TEXT("muzzle");
};

/** One art catalog can be shared by Hero Hall and the native battle stage.
 * It has no authority over item ownership, crafting, attacks or battle results.
 */
UCLASS(BlueprintType)
class STARFORTUNREAL_API UStarfortEquipmentArtManifest : public UDataAsset
{
 GENERATED_BODY()
public:
 UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="STARFORT|Equipment")
 TArray<FStarfortShowcaseGearArt> Entries;

 /** Never loads assets synchronously; caller must stream returned soft assets. */
 const FStarfortShowcaseGearArt* FindGearArt(
  const FString& ItemId,const FString& Slot) const;
};
