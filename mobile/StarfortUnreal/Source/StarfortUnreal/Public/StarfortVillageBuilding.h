#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "StarfortVillageBuilding.generated.h"

class USceneComponent;
class UStaticMeshComponent;

/** Art-authored building instance in a native 3D level.
 * The ID is a server-side reference, not a source of player level or rewards.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortVillageBuilding : public AActor
{
 GENERATED_BODY()
public:
 AStarfortVillageBuilding();
 UFUNCTION(BlueprintPure, Category="STARFORT|Village") bool HasApprovedDisplayMesh() const;
 UFUNCTION(BlueprintPure, Category="STARFORT|Village") FName GetBuildingId() const { return BuildingId; }
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village") void SetSelectionHighlight(bool bSelected);
 UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category="STARFORT|Village") FName BuildingId = NAME_None;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Art") TObjectPtr<USceneComponent> BuildingRoot;
 UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="STARFORT|Art") TObjectPtr<UStaticMeshComponent> DetailedBuildingMesh;
};
