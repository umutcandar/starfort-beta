#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortBagTile.generated.h"
class UButton;
class UTextBlock;
class UBorder;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortBagTileActivated,FString,Action);

/** Actual touch/clickable native UMG tile, not a screenshot button. */
UCLASS()
class STARFORTUNREAL_API UStarfortBagTile : public UUserWidget
{
 GENERATED_BODY()
public:
 void BuildTile(const FString& NewAction,const FString& Caption,
  const FString& Subtext,const FLinearColor& FrameColor,
  bool bEnabled=true,bool bSelected=false);
 UPROPERTY(BlueprintAssignable,Category="STARFORT|Bag")
 FStarfortBagTileActivated OnActivated;
protected:
 UPROPERTY(Transient) TObjectPtr<UButton> ClickTarget;
 UPROPERTY(Transient) TObjectPtr<UBorder> Frame;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> CaptionText;
 UPROPERTY(Transient) TObjectPtr<UTextBlock> SubText;
 UFUNCTION() void TileClicked();
 FString ActionToken;
};
