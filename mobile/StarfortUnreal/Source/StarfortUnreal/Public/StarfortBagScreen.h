#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortOnlineSubsystem.h"
#include "StarfortBagScreen.generated.h"

class UTextBlock;
class UImage;
class UHorizontalBox;
class UVerticalBox;
class UUniformGridPanel;
class UScrollBox;
class UStarfortBagTile;

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortBagGoBack);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortBagNavigate,FString,Destination);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(
 FStarfortBagMutation,FString,Action,FString,HeroOrItemId,FString,ItemOrSlot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(
 FStarfortMaterialFocusRequested,FString,FocusSlot);

/** Fully interactive landscape Unreal UMG inventory; uses genuine server
 * inventory, hero loadouts, resources and idempotent RPCs, never image text
 * values or a web-based shell. Actual hero art texture is optional local UE
 * content until the Mac Fab/authoring pipeline is installed.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API UStarfortBagScreen : public UUserWidget
{
 GENERATED_BODY()
public:
 UPROPERTY(BlueprintAssignable,Category="STARFORT|Bag") FStarfortBagGoBack OnBackRequested;
 UPROPERTY(BlueprintAssignable,Category="STARFORT|Bag") FStarfortBagNavigate OnNavigationRequested;
 UPROPERTY(BlueprintAssignable,Category="STARFORT|Bag") FStarfortBagMutation OnMutationRequested;
 UPROPERTY(BlueprintAssignable,Category="STARFORT|Materials")
 FStarfortMaterialFocusRequested OnMaterialFocusRequested;

 UFUNCTION(BlueprintCallable,Category="STARFORT|Bag") void ApplyVerifiedAccount(
  const FStarfortProgressSummary& Snapshot);
 UFUNCTION(BlueprintCallable,Category="STARFORT|Bag") void SetWaitingForServer();
 UFUNCTION(BlueprintCallable,Category="STARFORT|Materials")
 void ApplyVerifiedMaterials(const FStarfortMaterialSnapshot& Snapshot);
 UFUNCTION(BlueprintCallable,Category="STARFORT|Materials")
 void SetMaterialsWaiting();
 UFUNCTION(BlueprintCallable,Category="STARFORT|Materials")
 void ShowMaterialsUnavailable(const FString& SafeReason);
 UFUNCTION(BlueprintCallable,Category="STARFORT|Bag") void ShowServerFailure(const FString& Reason);
 UFUNCTION(BlueprintPure,Category="STARFORT|Bag") bool HasRealInventory() const {
  return bHasVerifiedInventory;
 }
 UFUNCTION() void HandleTile(const FString& ActionToken);

protected:
 virtual void NativeOnInitialized() override;
 virtual void NativeDestruct() override;

private:
 void BuildNativeLayout();
 void Refresh();
 UStarfortBagTile* MakeTile(const FString& Action,const FString& Label,
  const FString& Hint,const FLinearColor& Accent,
  bool bEnabled=true,bool bSelected=false);
 void AddTitle(UVerticalBox* Box,const FString& Title,int32 Size=19,
  const FLinearColor& Color=FLinearColor(.94f,.77f,.42f,1.f));
 FString DisplayHero(const FString& Id) const;
 FString DisplayRole(const FString& Id) const;
 FString CurrentlyWorn(const FString& Slot) const;
 int32 UsedCopies(const FString& ItemId) const;
 void ShowHeroArt();

 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtGold;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtWood;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtStone;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtEssence;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtHero;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtHeroLevel;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtHeroArtStatus;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtStats;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> TxtStatus;
 UPROPERTY(Transient) TObjectPtr<UImage> ImgHero;
 UPROPERTY(Transient) TObjectPtr<UVerticalBox> RosterColumn;
 UPROPERTY(Transient) TObjectPtr<UHorizontalBox> EquippedRow;
 UPROPERTY(Transient) TObjectPtr<UHorizontalBox> FilterRow;
 UPROPERTY(Transient) TObjectPtr<UUniformGridPanel> ItemGrid;
 UPROPERTY(Transient) TObjectPtr<UVerticalBox> DetailColumn;

 FStarfortProgressSummary Verified;
 FStarfortMaterialSnapshot RealMaterials;
 FString MaterialsStatus=TEXT("Malzemeler sunucuda doğrulanmadı");
 FString SelectedMaterialId=TEXT("edge_sliver");
 bool bMaterialsVerified=false;
 bool bMaterialFocusPending=false;
 FString SelectedHeroId=TEXT("aldren");
 FString SelectedItemId=TEXT("starbreaker");
 FString ActiveFilter=TEXT("all");
 bool bHasVerifiedInventory=false;
 bool bMutationPending=false;
};
