#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortVillageController.generated.h"

class UStarfortVillageScreen;

/** Native local camera/HUD coordination. Data comes later from the authenticated API adapter.
 * World taps request building details; neither the camera nor the HUD grants upgrades.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortVillageController : public APlayerController
{
 GENERATED_BODY()
public:
 virtual void BeginPlay() override;
 virtual void OnPossess(APawn* InPawn) override;
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village") void OpenVillageScreen();
 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|Village")
 TSubclassOf<UStarfortVillageScreen> VillageScreenClass;
 UFUNCTION(BlueprintPure, Category="STARFORT|Village")
 UStarfortVillageScreen* GetVillageScreen() const { return ActiveVillageScreen; }

private:
 UPROPERTY(Transient) TObjectPtr<UStarfortVillageScreen> ActiveVillageScreen;
 UFUNCTION() void HandleBuildingTapped(FName BuildingId);
};
