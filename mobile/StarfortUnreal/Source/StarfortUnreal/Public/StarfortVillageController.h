#pragma once
#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StarfortVillageScreen.h"
#include "StarfortVillageController.generated.h"

class UStarfortLoginScreen;
class UStarfortOnlineSubsystem;

/** Native local camera/HUD coordination connected to the real account-only
 * Supabase RPC adapter. No guest/local rewards or web-player rendering.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API AStarfortVillageController : public APlayerController
{
 GENERATED_BODY()
public:
 virtual void BeginPlay() override;
 virtual void OnPossess(APawn* InPawn) override;

 UFUNCTION(BlueprintCallable, Category="STARFORT|Village") void OpenVillageScreen();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Auth") void OpenLoginScreen();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village") void RefreshVillage();

 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|UI")
 TSubclassOf<UStarfortVillageScreen> VillageScreenClass;
 UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="STARFORT|UI")
 TSubclassOf<UStarfortLoginScreen> LoginScreenClass;

 UFUNCTION(BlueprintPure, Category="STARFORT|Village")
 UStarfortVillageScreen* GetVillageScreen() const { return ActiveVillageScreen; }

private:
 UPROPERTY(Transient) TObjectPtr<UStarfortVillageScreen> ActiveVillageScreen;
 UPROPERTY(Transient) TObjectPtr<UStarfortLoginScreen> ActiveLoginScreen;
 UPROPERTY(Transient) TObjectPtr<UStarfortOnlineSubsystem> Online;

 UFUNCTION() void HandleBuildingTapped(FName BuildingId);
 UFUNCTION() void HandleSignedIn(FString UserId);
 UFUNCTION() void HandleSignedOut();
 UFUNCTION() void HandleVillageSnapshot(const FStarfortVerifiedVillage& Snapshot);
 UFUNCTION() void HandleUpgradeRequested(FName BuildingId);
 UFUNCTION() void HandleOnlineFailure(FString SafeReason);
 UFUNCTION() void HandleHeroesRequested();
 UFUNCTION() void HandleBattlesRequested();
 UFUNCTION() void HandleAllianceRequested();
 UFUNCTION() void HandleRouteUnavailable(FString SafeReason);
 UFUNCTION() void HandleLogoutRequested();
};
