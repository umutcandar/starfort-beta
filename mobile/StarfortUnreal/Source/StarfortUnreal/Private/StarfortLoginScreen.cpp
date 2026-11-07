#include "StarfortLoginScreen.h"
#include "StarfortOnlineSubsystem.h"
#include "Components/Button.h"
#include "Components/EditableTextBox.h"
#include "Components/TextBlock.h"
#include "Engine/GameInstance.h"

void UStarfortLoginScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 if (InputPassword) InputPassword->SetIsPassword(true);
 if (BtnSignIn) BtnSignIn->OnClicked.AddUniqueDynamic(this,&UStarfortLoginScreen::SignInClicked);
 if (UGameInstance* Instance=GetGameInstance())
  Online=Instance->GetSubsystem<UStarfortOnlineSubsystem>();
 if (Online)
 {
  Online->OnSignedIn.AddUniqueDynamic(this,&UStarfortLoginScreen::HandleSignedIn);
  Online->OnSignedOut.AddUniqueDynamic(this,&UStarfortLoginScreen::HandleSignedOut);
  Online->OnFailure.AddUniqueDynamic(this,&UStarfortLoginScreen::HandleError);
 }
 if (TxtAuthStatus)
  TxtAuthStatus->SetText(FText::FromString(TEXT("E-posta hesabıyla giriş yap")));
}
void UStarfortLoginScreen::NativeDestruct()
{
 if (Online)
 {
  Online->OnSignedIn.RemoveDynamic(this,&UStarfortLoginScreen::HandleSignedIn);
  Online->OnSignedOut.RemoveDynamic(this,&UStarfortLoginScreen::HandleSignedOut);
  Online->OnFailure.RemoveDynamic(this,&UStarfortLoginScreen::HandleError);
 }
 Super::NativeDestruct();
}
void UStarfortLoginScreen::SignInClicked()
{
 if (!Online || !InputEmail || !InputPassword) return;
 const FString Email=InputEmail->GetText().ToString().TrimStartAndEnd();
 const FString Password=InputPassword->GetText().ToString();
 // Never retain passwords in UI after submission; do not log or cache them.
 InputPassword->SetText(FText::GetEmpty());
 if (BtnSignIn) BtnSignIn->SetIsEnabled(false);
 if (TxtAuthStatus)
  TxtAuthStatus->SetText(FText::FromString(TEXT("Giriş doğrulanıyor...")));
 Online->SignIn(Email,Password);
}
void UStarfortLoginScreen::HandleSignedIn(FString UserId)
{
 if (TxtAuthStatus)
  TxtAuthStatus->SetText(FText::FromString(TEXT("Oturum açıldı")));
 OnLoginSucceeded.Broadcast();
}
void UStarfortLoginScreen::HandleSignedOut()
{
 if (BtnSignIn) BtnSignIn->SetIsEnabled(true);
}
void UStarfortLoginScreen::HandleError(FString SafeReason)
{
 if (BtnSignIn) BtnSignIn->SetIsEnabled(true);
 if (TxtAuthStatus) TxtAuthStatus->SetText(FText::FromString(SafeReason));
}
