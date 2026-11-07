#pragma once
#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StarfortLoginScreen.generated.h"

class UEditableTextBox;
class UTextBlock;
class UButton;
class UStarfortOnlineSubsystem;

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortLoginSucceeded);

/** Native email/account-only sign-in. No guest, trial or local save account.
 * A UMG Widget Blueprint must provide the actual premium layout and fields.
 */
UCLASS(Blueprintable)
class STARFORTUNREAL_API UStarfortLoginScreen : public UUserWidget
{
 GENERATED_BODY()
public:
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Auth")
 FStarfortLoginSucceeded OnLoginSucceeded;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly)
 TObjectPtr<UEditableTextBox> InputEmail;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly)
 TObjectPtr<UEditableTextBox> InputPassword;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly)
 TObjectPtr<UTextBlock> TxtAuthStatus;
 UPROPERTY(meta=(BindWidgetOptional), BlueprintReadOnly)
 TObjectPtr<UButton> BtnSignIn;

protected:
 virtual void NativeOnInitialized() override;
 virtual void NativeDestruct() override;
private:
 UPROPERTY(Transient) TObjectPtr<UStarfortOnlineSubsystem> Online;
 UFUNCTION() void SignInClicked();
 UFUNCTION() void HandleSignedIn(FString UserId);
 UFUNCTION() void HandleSignedOut();
 UFUNCTION() void HandleError(FString SafeReason);
};
