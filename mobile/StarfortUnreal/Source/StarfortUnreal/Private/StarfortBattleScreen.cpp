#include "StarfortBattleScreen.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Containers/Set.h"

void UStarfortBattleScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 if (BtnStrike) BtnStrike->OnClicked.AddDynamic(this, &UStarfortBattleScreen::StrikeClicked);
 if (BtnGuard) BtnGuard->OnClicked.AddDynamic(this, &UStarfortBattleScreen::GuardClicked);
 if (BtnFeint) BtnFeint->OnClicked.AddDynamic(this, &UStarfortBattleScreen::FeintClicked);
 if (BtnRally) BtnRally->OnClicked.AddDynamic(this, &UStarfortBattleScreen::RallyClicked);
 if (BtnHeroSkill) BtnHeroSkill->OnClicked.AddDynamic(this, &UStarfortBattleScreen::HeroSkillClicked);
 SetWaitingForServer();
}
bool UStarfortBattleScreen::IsKnownAction(const FString& ActionId) const
{
 if (ActionId == TEXT("strike") || ActionId == TEXT("guard") ||
     ActionId == TEXT("feint") || ActionId == TEXT("rally")) return true;
 if (!ActionId.StartsWith(TEXT("skill:")) || ActionId.Len() < 7 || ActionId.Len()>64) return false;
 for (int32 i=6; i<ActionId.Len(); ++i)
 {
  const TCHAR C=ActionId[i];
  if (!FChar::IsAlnum(C) && C!=TEXT('_') && C!=TEXT('-')) return false;
 }
 return true;
}
void UStarfortBattleScreen::SetWaitingForServer()
{
 bHasVerifiedTurn=false;
 bCommandPending=false;
 ActiveHeroSkill.Empty();
 Latest=FStarfortVerifiedBattleTurn();
 const FText Dash=FText::FromString(TEXT("—"));
 if (TxtTurn) TxtTurn->SetText(Dash);
 if (TxtHeroHP) TxtHeroHP->SetText(Dash);
 if (TxtEnemyHP) TxtEnemyHP->SetText(Dash);
 if (TxtVerifiedDamage) TxtVerifiedDamage->SetText(Dash);
 if (TxtBattleStatus)
  TxtBattleStatus->SetText(FText::FromString(TEXT("Sunucu savaş durumu bekleniyor")));
 if (ProgressHeroHP) ProgressHeroHP->SetPercent(0.f);
 if (ProgressEnemyHP) ProgressEnemyHP->SetPercent(0.f);
 RefreshButtons();
}
void UStarfortBattleScreen::ApplyVerifiedTurn(const FStarfortVerifiedBattleTurn& NewTurn)
{
 if (!NewTurn.bServerVerified || NewTurn.RoomId.IsEmpty() || NewTurn.Turn<0 ||
     NewTurn.HeroMaxHP<=0 || NewTurn.EnemyMaxHP<=0 ||
     NewTurn.HeroHP<0 || NewTurn.HeroHP>NewTurn.HeroMaxHP ||
     NewTurn.EnemyHP<0 || NewTurn.EnemyHP>NewTurn.EnemyMaxHP ||
     NewTurn.VerifiedDamageDealt<0 || NewTurn.ServerAllowedActions.Num()>16)
 {
  SetWaitingForServer();
  return;
 }
 TSet<FString> Unique;
 for (const FString& Action : NewTurn.ServerAllowedActions)
 {
  if (!IsKnownAction(Action) || Unique.Contains(Action))
  {
   SetWaitingForServer();
   return;
  }
  Unique.Add(Action);
 }
 if (bHasVerifiedTurn && NewTurn.RoomId==Latest.RoomId && NewTurn.Turn<=Latest.Turn)
 {
  UE_LOG(LogTemp, Warning, TEXT("STARFORT: stale battle turn ignored"));
  return;
 }
 Latest=NewTurn;
 bHasVerifiedTurn=true;
 bCommandPending=false;
 ActiveHeroSkill.Empty();
 for (const FString& Action:NewTurn.ServerAllowedActions)
  if (Action.StartsWith(TEXT("skill:"))) { ActiveHeroSkill=Action; break; }
 if (TxtTurn) TxtTurn->SetText(FText::Format(FText::FromString(TEXT("Tur {0}")),FText::AsNumber(NewTurn.Turn)));
 if (TxtHeroHP) TxtHeroHP->SetText(FText::AsNumber(NewTurn.HeroHP));
 if (TxtEnemyHP) TxtEnemyHP->SetText(FText::AsNumber(NewTurn.EnemyHP));
 if (TxtVerifiedDamage)
  TxtVerifiedDamage->SetText(NewTurn.Turn>0 && NewTurn.VerifiedDamageDealt>0
   ? FText::AsNumber(NewTurn.VerifiedDamageDealt) : FText::FromString(TEXT("—")));
 if (TxtBattleStatus) TxtBattleStatus->SetText(FText::FromString(TEXT("Sunucu turu doğrulandı")));
 if (ProgressHeroHP)
  ProgressHeroHP->SetPercent(FMath::Clamp(static_cast<float>(NewTurn.HeroHP)/NewTurn.HeroMaxHP,0.f,1.f));
 if (ProgressEnemyHP)
  ProgressEnemyHP->SetPercent(FMath::Clamp(static_cast<float>(NewTurn.EnemyHP)/NewTurn.EnemyMaxHP,0.f,1.f));
 RefreshButtons();
}
void UStarfortBattleScreen::RefreshButtons()
{
 const auto Allowed=[this](const TCHAR* Action) {
  return bHasVerifiedTurn && !bCommandPending &&
   Latest.HeroHP>0 && Latest.EnemyHP>0 &&
   Latest.ServerAllowedActions.Contains(FString(Action));
 };
 if (BtnStrike) BtnStrike->SetIsEnabled(Allowed(TEXT("strike")));
 if (BtnGuard) BtnGuard->SetIsEnabled(Allowed(TEXT("guard")));
 if (BtnFeint) BtnFeint->SetIsEnabled(Allowed(TEXT("feint")));
 if (BtnRally) BtnRally->SetIsEnabled(Allowed(TEXT("rally")));
 if (BtnHeroSkill)
  BtnHeroSkill->SetIsEnabled(!ActiveHeroSkill.IsEmpty() && Allowed(*ActiveHeroSkill));
}
bool UStarfortBattleScreen::RequestAction(const FString& ActionId)
{
 if (!bHasVerifiedTurn || bCommandPending || Latest.HeroHP<=0 ||
     Latest.EnemyHP<=0 || !IsKnownAction(ActionId) ||
     !Latest.ServerAllowedActions.Contains(ActionId)) return false;
 // This only requests an authenticated action. No client-authoritative hit occurs.
 bCommandPending=true;
 RefreshButtons();
 if (TxtBattleStatus)
  TxtBattleStatus->SetText(FText::FromString(TEXT("Sunucu hamlesi bekleniyor")));
 OnActionRequested.Broadcast(ActionId);
 return true;
}
void UStarfortBattleScreen::StrikeClicked() { RequestAction(TEXT("strike")); }
void UStarfortBattleScreen::GuardClicked() { RequestAction(TEXT("guard")); }
void UStarfortBattleScreen::FeintClicked() { RequestAction(TEXT("feint")); }
void UStarfortBattleScreen::RallyClicked() { RequestAction(TEXT("rally")); }
void UStarfortBattleScreen::HeroSkillClicked()
{
 if (!ActiveHeroSkill.IsEmpty()) RequestAction(ActiveHeroSkill);
}
