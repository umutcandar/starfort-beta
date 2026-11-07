#include "StarfortHeroScreen.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Math/UnrealMathUtility.h"

void UStarfortHeroScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 if (BtnInspect) BtnInspect->OnClicked.AddDynamic(this, &UStarfortHeroScreen::InspectClicked);
 if (BtnFirePreview) BtnFirePreview->OnClicked.AddDynamic(this, &UStarfortHeroScreen::FireClicked);
 if (BtnBack) BtnBack->OnClicked.AddDynamic(this, &UStarfortHeroScreen::BackClicked);
 if (BtnUpgrade) BtnUpgrade->OnClicked.AddDynamic(this, &UStarfortHeroScreen::UpgradeClicked);
 SetWaitingForServer();
}

void UStarfortHeroScreen::SetWaitingForServer()
{
 bHasVerifiedHero = false;
 // Do not present fabricated numbers while the server snapshot is absent.
 const FText Placeholder=FText::FromString(TEXT("—"));
 if (TxtHeroName) TxtHeroName->SetText(FText::FromString(TEXT("Kahraman yükleniyor")));
 if (TxtRarity) TxtRarity->SetText(Placeholder);
 if (TxtLevel) TxtLevel->SetText(Placeholder);
 if (TxtAttack) TxtAttack->SetText(Placeholder);
 if (TxtDefense) TxtDefense->SetText(Placeholder);
 if (TxtHealth) TxtHealth->SetText(Placeholder);
 if (TxtSpeed) TxtSpeed->SetText(Placeholder);
 if (TxtShardCount) TxtShardCount->SetText(Placeholder);
 if (TxtConnectionStatus) TxtConnectionStatus->SetText(FText::FromString(TEXT("Sunucu doğrulaması bekleniyor")));
 if (ProgressShards) ProgressShards->SetPercent(0.f);
 if (BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
}

void UStarfortHeroScreen::ApplyVerifiedHero(const FStarfortHeroSnapshot& NewSnapshot)
{
 if (!NewSnapshot.bServerVerified || NewSnapshot.HeroId.IsEmpty() ||
     NewSnapshot.Level < 0 || NewSnapshot.MaxLevel <= 0 ||
     NewSnapshot.Level > NewSnapshot.MaxLevel ||
     NewSnapshot.Attack < 0 || NewSnapshot.Defense < 0 ||
     NewSnapshot.MaxHP < 0 || NewSnapshot.Speed < 0 ||
     NewSnapshot.OwnedShards < 0 || NewSnapshot.RequiredShards < 0)
 {
  UE_LOG(LogTemp, Warning, TEXT("STARFORT: rejected invalid/unverified hero snapshot"));
  SetWaitingForServer();
  return;
 }
 bHasVerifiedHero = true;
 if (TxtHeroName) TxtHeroName->SetText(NewSnapshot.DisplayName);
 if (TxtRarity) TxtRarity->SetText(NewSnapshot.Rarity);
 if (TxtLevel)
  TxtLevel->SetText(FText::Format(FText::FromString(TEXT("Lv. {0} / {1}")),
   FText::AsNumber(NewSnapshot.Level), FText::AsNumber(NewSnapshot.MaxLevel)));
 if (TxtAttack) TxtAttack->SetText(FText::AsNumber(NewSnapshot.Attack));
 if (TxtDefense) TxtDefense->SetText(FText::AsNumber(NewSnapshot.Defense));
 if (TxtHealth) TxtHealth->SetText(FText::AsNumber(NewSnapshot.MaxHP));
 if (TxtSpeed) TxtSpeed->SetText(FText::AsNumber(NewSnapshot.Speed));
 if (TxtShardCount)
  TxtShardCount->SetText(FText::Format(FText::FromString(TEXT("{0} / {1}")),
   FText::AsNumber(NewSnapshot.OwnedShards),
   FText::AsNumber(NewSnapshot.RequiredShards)));
 if (TxtConnectionStatus)
  TxtConnectionStatus->SetText(FText::FromString(TEXT("Sunucu verisi doğrulandı")));
 if (ProgressShards)
  ProgressShards->SetPercent(NewSnapshot.RequiredShards > 0
   ? FMath::Clamp(static_cast<float>(NewSnapshot.OwnedShards) /
       static_cast<float>(NewSnapshot.RequiredShards),0.f,1.f) : 0.f);
 if (BtnUpgrade)
  BtnUpgrade->SetIsEnabled(NewSnapshot.Level < NewSnapshot.MaxLevel
   && NewSnapshot.RequiredShards > 0
   && NewSnapshot.OwnedShards >= NewSnapshot.RequiredShards);
}

void UStarfortHeroScreen::InspectClicked() { OnInspectRequested.Broadcast(); }
void UStarfortHeroScreen::FireClicked() { OnFirePreviewRequested.Broadcast(); }
void UStarfortHeroScreen::BackClicked() { OnBackRequested.Broadcast(); }
void UStarfortHeroScreen::UpgradeClicked()
{
 // Caller must perform an authenticated server request; no local level change.
 if (bHasVerifiedHero) OnUpgradeRequested.Broadcast();
}
