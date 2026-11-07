#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortHeroScreen.generated.h"

class UButton;
class UTextBlock;
class UProgressBar;

/**
 * Read-only display snapshot from the authenticated STARFORT backend.
 * Never generate currency/HP/levels from client state.
 */
USTRUCT(BlueprintType)
struct FStarfortHeroSnapshot
{
 GENERATED_BODY()

 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") FString HeroId;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") FText DisplayName;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") FText Rarity;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int32 Level = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int32 MaxLevel = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int64 Attack = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int64 Defense = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int64 MaxHP = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int32 Speed = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int32 OwnedShards = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") int32 RequiredShards = 0;
 UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="STARFORT|Hero") bool bServerVerified = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortHeroScreenEvent);

/** Native Unreal UMG interface for a landscape iOS/Android hero inspection screen.
 * The hero viewport is a real UE camera/rig; this class overlays data/control widgets.
 * Attach a real Widget Blueprint inheriting this type (assets are not shipped yet).
 */
UCLASS(BlueprintType, Blueprintable)
class STARFORTUNREAL_API UStarfortHeroScreen : public UUserWidget
{
 GENERATED_BODY()

public:
 UFUNCTION(BlueprintCallable, Category="STARFORT|Hero") void ApplyVerifiedHero(const FStarfortHeroSnapshot& NewSnapshot);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Hero") void SetWaitingForServer();
 UFUNCTION(BlueprintPure, Category="STARFORT|Hero") bool HasVerifiedHero() const { return bHasVerifiedHero; }

 UPROPERTY(BlueprintAssignable, Category="STARFORT|Hero") FStarfortHeroScreenEvent OnInspectRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Hero") FStarfortHeroScreenEvent OnFirePreviewRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Hero") FStarfortHeroScreenEvent OnBackRequested;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Hero") FStarfortHeroScreenEvent OnUpgradeRequested;

 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtHeroName;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtRarity;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtLevel;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtAttack;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtDefense;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtHealth;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtSpeed;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtShardCount;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UTextBlock> TxtConnectionStatus;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UProgressBar> ProgressShards;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnInspect;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnFirePreview;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnBack;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly) TObjectPtr<UButton> BtnUpgrade;

protected:
 virtual void NativeOnInitialized() override;

private:
 UFUNCTION() void InspectClicked();
 UFUNCTION() void FireClicked();
 UFUNCTION() void BackClicked();
 UFUNCTION() void UpgradeClicked();
 UPROPERTY(Transient) bool bHasVerifiedHero = false;
};
