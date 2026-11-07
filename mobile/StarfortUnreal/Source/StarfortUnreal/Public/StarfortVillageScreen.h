#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortVillageScreen.generated.h"

class UTextBlock;
class UButton;

USTRUCT(BlueprintType)
struct FStarfortVerifiedBuilding
{
 GENERATED_BODY()
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") FName BuildingId = NAME_None;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") FText Name;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int32 Level = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int32 MaxLevel = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") bool bServerAllowsUpgrade = false;
};

USTRUCT(BlueprintType)
struct FStarfortVerifiedVillage
{
 GENERATED_BODY()
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") FString VillageId;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") FText VillageName;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int64 Gold = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int64 Wood = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int64 Stone = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") int64 StarEssence = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") TArray<FStarfortVerifiedBuilding> Buildings;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Village") bool bServerVerified = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortVillageBuildingIntent, FName, BuildingId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortVillageNavigation);

/** UI only; the data adapter must validate the authenticated remote payload.
 * Button delegates are intents, never optimistic upgrades or balance mutations.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API UStarfortVillageScreen : public UUserWidget
{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void ApplyVerifiedVillage(const FStarfortVerifiedVillage& NewSnapshot);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void SetWaitingForServer();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 bool FocusBuilding(FName BuildingId);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Village")
 void RequestBuildingDetails(FName BuildingId);
 UFUNCTION(BlueprintPure, Category="STARFORT|Village")
 bool HasVerifiedVillage() const { return bHasVerifiedVillage; }

 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageBuildingIntent OnBuildingDetailRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageBuildingIntent OnUpgradeRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageNavigation OnHeroesRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageNavigation OnBattlesRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageNavigation OnAllianceRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageNavigation OnRefreshRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Village")
 FStarfortVillageNavigation OnSignOutRequested;

 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtVillageName;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtGold;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtWood;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtStone;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtStarEssence;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtBuildingName;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtBuildingLevel;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtConnectionStatus;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnUpgrade;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnHeroes;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnBattles;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnAlliance;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnRefresh;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnSignOut;

protected:
 virtual void NativeOnInitialized() override;
private:
 UFUNCTION() void UpgradeClicked();
 UFUNCTION() void HeroesClicked();
 UFUNCTION() void BattlesClicked();
 UFUNCTION() void AllianceClicked();
 UFUNCTION() void RefreshClicked();
 UFUNCTION() void SignOutClicked();
 FStarfortVerifiedVillage VerifiedSnapshot;
 FName SelectedBuildingId = NAME_None;
 bool bHasVerifiedVillage = false;
 bool bUpgradePending = false;
};
