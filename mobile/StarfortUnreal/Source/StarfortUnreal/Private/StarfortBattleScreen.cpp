#include "StarfortBattleScreen.h"
#include "StarfortNativeWidgetFactory.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Containers/Set.h"
#include "Misc/DateTime.h"

namespace StarfortCombatUI
{
static FString IntentHint(const FString& Intent)
{
 if (Intent==TEXT("crush")) return TEXT("EZİCİ DARBE · Savunma önerilir");
 if (Intent==TEXT("shield")) return TEXT("KALKAN · Aldatma veya yetenek deneyebilirsin");
 if (Intent==TEXT("sunder")) return TEXT("ZIRH KIRMA · Aldatma ile bozabilirsin");
 if (Intent==TEXT("eclipse")) return TEXT("TUTULMA · Savunma güvenli seçim");
 if (Intent==TEXT("drain")) return TEXT("ENERJİ EMME · Canını koru");
 if (Intent==TEXT("strike")) return TEXT("NORMAL SALDIRI · Taktik seç");
 return TEXT("Düşman niyeti bilinmiyor");
}
static int64 CurrentUtcMs()
{
 const FDateTime Now=FDateTime::UtcNow();
 return Now.ToUnixTimestamp()*1000LL+Now.GetMillisecond();
}
}

void UStarfortBattleScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 FStarfortNativeWidgetFactory::BuildBattle(this);
 if (BtnStrike) BtnStrike->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::StrikeClicked);
 if (BtnGuard) BtnGuard->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::GuardClicked);
 if (BtnFeint) BtnFeint->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::FeintClicked);
 if (BtnRally) BtnRally->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::RallyClicked);
 if (BtnHeroSkill) BtnHeroSkill->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::HeroSkillClicked);
 if (BtnSkill1) BtnSkill1->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::Skill1Clicked);
 if (BtnSkill2) BtnSkill2->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::Skill2Clicked);
 if (BtnSkill3) BtnSkill3->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::Skill3Clicked);
 if (BtnRetry) BtnRetry->OnClicked.AddUniqueDynamic(this,&UStarfortBattleScreen::RetryClicked);
 SetWaitingForServer();
}
void UStarfortBattleScreen::NativeTick(const FGeometry& MyGeometry,float InDeltaTime)
{
 Super::NativeTick(MyGeometry,InDeltaTime);
 if (!bHasVerifiedTurn || bCommandPending) return;
 const bool bReady=IsLocalThrottleElapsed();
 if (bReady!=bLastThrottleReady)
 {
  bLastThrottleReady=bReady;
  RefreshButtons();
 }
 if (TxtCooldownHint)
 {
  // Client clock is only UX guidance. The authenticated server always decides.
  if (!bReady)
  {
   const int64 Left=FMath::Clamp<int64>(
    3000-(StarfortCombatUI::CurrentUtcMs()-Latest.LastTurnAtUnixMs),0,3000);
   TxtCooldownHint->SetText(FText::Format(
    FText::FromString(TEXT("Sıradaki hamle: {0} sn")),
    FText::AsNumber(static_cast<int32>((Left+999)/1000))));
  }
  else TxtCooldownHint->SetText(FText::FromString(TEXT("Hamle hazır")));
 }
}
bool UStarfortBattleScreen::IsKnownAction(const FString& ActionId) const
{
 if (ActionId==TEXT("strike") || ActionId==TEXT("guard") ||
     ActionId==TEXT("feint") || ActionId==TEXT("rally")) return true;
 if (!ActionId.StartsWith(TEXT("skill:")) || ActionId.Len()<7 ||
     ActionId.Len()>64) return false;
 for (int32 I=6;I<ActionId.Len();++I)
 {
  const TCHAR C=ActionId[I];
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
 bLastThrottleReady=true;
 const FText Dash=FText::FromString(TEXT("—"));
 if (TxtTurn) TxtTurn->SetText(Dash);
 if (TxtHeroHP) TxtHeroHP->SetText(Dash);
 if (TxtEnemyHP) TxtEnemyHP->SetText(Dash);
 if (TxtVerifiedDamage) TxtVerifiedDamage->SetText(Dash);
 if (TxtEnemyIntent) TxtEnemyIntent->SetText(Dash);
 if (TxtWave) TxtWave->SetText(Dash);
 if (TxtSkill1) TxtSkill1->SetText(Dash);
 if (TxtSkill2) TxtSkill2->SetText(Dash);
 if (TxtSkill3) TxtSkill3->SetText(Dash);
 if (TxtCooldownHint) TxtCooldownHint->SetText(Dash);
 if (TxtBattleStatus)
  TxtBattleStatus->SetText(FText::FromString(TEXT("Sunucu savaş durumu bekleniyor")));
 if (ProgressHeroHP) ProgressHeroHP->SetPercent(0.f);
 if (ProgressEnemyHP) ProgressEnemyHP->SetPercent(0.f);
 RefreshButtons();
}
bool UStarfortBattleScreen::IsLocalThrottleElapsed() const
{
 if (Latest.LastTurnAtUnixMs<=0) return true;
 const int64 Elapsed=StarfortCombatUI::CurrentUtcMs()-Latest.LastTurnAtUnixMs;
 // Untrustworthy mobile clock? Never assert readiness/restriction by the client.
 // The server's 3-second cooldown remains authoritative in either case.
 if (Elapsed<-10000 || Elapsed>86400000LL) return true;
 return Elapsed>=3000LL;
}
FString UStarfortBattleScreen::SkillActionAt(int32 Slot) const
{
 if (Slot<0 || Slot>=Latest.TeamHeroes.Num()) return TEXT("");
 return FString(TEXT("skill:"))+Latest.TeamHeroes[Slot];
}
bool UStarfortBattleScreen::IsReadyForCommand(const FString& ActionId) const
{
 if (!IsKnownAction(ActionId) ||
     !Latest.ServerAllowedActions.Contains(ActionId)) return false;
 if (ActionId==TEXT("rally") && Latest.LastRallyTurn>0 &&
     Latest.Turn+1-Latest.LastRallyTurn<4) return false;
 if (ActionId.StartsWith(TEXT("skill:")))
 {
  const FString HeroId=ActionId.RightChop(6);
  if (!Latest.TeamHeroes.Contains(HeroId)) return false;
  const int32* Next=Latest.SkillCooldownTurns.Find(HeroId);
  if (Next && *Next>Latest.Turn+1) return false;
 }
 return true;
}
void UStarfortBattleScreen::RefreshButtons()
{
 const bool bCanPlay=bHasVerifiedTurn && !bCommandPending &&
  Latest.HeroHP>0 && Latest.EnemyHP>0 && IsLocalThrottleElapsed();
 const auto Allowed=[this,bCanPlay](const FString& Action)
 {
  return bCanPlay && IsReadyForCommand(Action);
 };
 if (BtnStrike) BtnStrike->SetIsEnabled(Allowed(TEXT("strike")));
 if (BtnGuard) BtnGuard->SetIsEnabled(Allowed(TEXT("guard")));
 if (BtnFeint) BtnFeint->SetIsEnabled(Allowed(TEXT("feint")));
 if (BtnRally) BtnRally->SetIsEnabled(Allowed(TEXT("rally")));
 if (BtnHeroSkill) BtnHeroSkill->SetIsEnabled(Allowed(ActiveHeroSkill));
 if (BtnSkill1) BtnSkill1->SetIsEnabled(Allowed(SkillActionAt(0)));
 if (BtnSkill2) BtnSkill2->SetIsEnabled(Allowed(SkillActionAt(1)));
 if (BtnSkill3) BtnSkill3->SetIsEnabled(Allowed(SkillActionAt(2)));
}
void UStarfortBattleScreen::ShowSkillState()
{
 UTextBlock* Labels[]={TxtSkill1,TxtSkill2,TxtSkill3};
 for (int32 I=0;I<3;++I)
 {
  if (!Labels[I]) continue;
  const FString Hero=(I<Latest.TeamHeroes.Num())?Latest.TeamHeroes[I]:TEXT("");
  if (Hero.IsEmpty())
  {
   Labels[I]->SetText(FText::FromString(TEXT("Yetenek yok")));
   continue;
  }
  const int32* Cooldown=Latest.SkillCooldownTurns.Find(Hero);
  const int32 Wait=Cooldown?FMath::Max(0,*Cooldown-(Latest.Turn+1)):0;
  FString Info=Hero.ToUpper()+(Wait>0
    ? FString::Printf(TEXT(" · %d tur"),Wait)
    : FString(TEXT(" · HAZIR")));
  Labels[I]->SetText(FText::FromString(Info));
 }
}
void UStarfortBattleScreen::ApplyVerifiedTurn(const FStarfortVerifiedBattleTurn& NewTurn)
{
 if (!NewTurn.bServerVerified || NewTurn.RoomId.IsEmpty() || NewTurn.Turn<0 ||
     NewTurn.HeroMaxHP<=0 || NewTurn.EnemyMaxHP<=0 ||
     NewTurn.HeroHP<0 || NewTurn.HeroHP>NewTurn.HeroMaxHP ||
     NewTurn.EnemyHP<0 || NewTurn.EnemyHP>NewTurn.EnemyMaxHP ||
     NewTurn.VerifiedDamageDealt<0 || NewTurn.VerifiedDamageReceived<0 ||
     NewTurn.VerifiedDamageReceived>NewTurn.HeroMaxHP ||
     NewTurn.ServerAllowedActions.Num()>16 ||
     NewTurn.TeamHeroes.Num()!=3 || NewTurn.SkillCooldownTurns.Num()>3 ||
     NewTurn.Wave<1 || NewTurn.Waves<1 || NewTurn.Waves>3 ||
     NewTurn.Wave>NewTurn.Waves || NewTurn.WaveTurn<0 ||
     NewTurn.WaveTurn>NewTurn.Turn ||
     NewTurn.LastRallyTurn<0 || NewTurn.LastRallyTurn>NewTurn.Turn)
 {
  SetWaitingForServer();
  return;
 }
 TSet<FString> Unique;
 for (const FString& Action:NewTurn.ServerAllowedActions)
 {
  if (!IsKnownAction(Action) || Unique.Contains(Action))
  {
   SetWaitingForServer();return;
  }
  Unique.Add(Action);
 }
 TSet<FString> TeamSet;
 for (const FString& Hero:NewTurn.TeamHeroes)
 {
  if (Hero.IsEmpty() || TeamSet.Contains(Hero) ||
      !NewTurn.ServerAllowedActions.Contains(FString(TEXT("skill:"))+Hero))
  {
   SetWaitingForServer();return;
  }
  TeamSet.Add(Hero);
 }
 for (const auto& Pair:NewTurn.SkillCooldownTurns)
 {
  if (!TeamSet.Contains(Pair.Key) || Pair.Value<1 ||
      Pair.Value>NewTurn.Turn+4) {SetWaitingForServer();return;}
 }
 if (bHasVerifiedTurn && NewTurn.RoomId==Latest.RoomId &&
     NewTurn.Turn<=Latest.Turn)
 {
  UE_LOG(LogTemp,Warning,TEXT("STARFORT: stale battle turn ignored"));
  return;
 }
 Latest=NewTurn;
 bHasVerifiedTurn=true;
 bCommandPending=false;
 bLastThrottleReady=IsLocalThrottleElapsed();
 ActiveHeroSkill=SkillActionAt(0);
 if (TxtTurn)
  TxtTurn->SetText(FText::Format(FText::FromString(TEXT("Tur {0}")),
   FText::AsNumber(NewTurn.Turn)));
 if (TxtWave)
  TxtWave->SetText(FText::Format(FText::FromString(TEXT("Dalga {0}/{1}")),
   FText::AsNumber(NewTurn.Wave),FText::AsNumber(NewTurn.Waves)));
 if (TxtEnemyIntent)
  TxtEnemyIntent->SetText(FText::FromString(
   StarfortCombatUI::IntentHint(NewTurn.EnemyIntent)));
 if (TxtHeroHP) TxtHeroHP->SetText(FText::AsNumber(NewTurn.HeroHP));
 if (TxtEnemyHP) TxtEnemyHP->SetText(FText::AsNumber(NewTurn.EnemyHP));
 if (TxtVerifiedDamage)
  TxtVerifiedDamage->SetText(NewTurn.Turn>0 && NewTurn.VerifiedDamageDealt>0
   ? FText::AsNumber(NewTurn.VerifiedDamageDealt)
   : FText::FromString(TEXT("—")));
 if (TxtBattleStatus)
 {
  const FString BattleSummary=NewTurn.VerifiedDamageReceived>0
   ? FString::Printf(TEXT("Düşman karşı saldırısı: -%lld takım canı"),
       static_cast<long long>(NewTurn.VerifiedDamageReceived))
   : FString(TEXT("Sunucu hamlesi doğrulandı"));
  TxtBattleStatus->SetText(FText::FromString(BattleSummary));
 }
 if (ProgressHeroHP)
  ProgressHeroHP->SetPercent(FMath::Clamp(
   static_cast<float>(NewTurn.HeroHP)/NewTurn.HeroMaxHP,0.f,1.f));
 if (ProgressEnemyHP)
  ProgressEnemyHP->SetPercent(FMath::Clamp(
   static_cast<float>(NewTurn.EnemyHP)/NewTurn.EnemyMaxHP,0.f,1.f));
 ShowSkillState();
 RefreshButtons();
}
bool UStarfortBattleScreen::RequestAction(const FString& ActionId)
{
 if (!bHasVerifiedTurn || bCommandPending ||
     Latest.HeroHP<=0 || Latest.EnemyHP<=0 ||
     !IsKnownAction(ActionId) ||
     !Latest.ServerAllowedActions.Contains(ActionId) ||
     !IsReadyForCommand(ActionId) || !IsLocalThrottleElapsed()) return false;
 // Cosmetics do not grant a hit or reward. Server RPC validates this action.
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
void UStarfortBattleScreen::Skill1Clicked()
{
 const FString Skill=SkillActionAt(0);
 if (!Skill.IsEmpty()) RequestAction(Skill);
}
void UStarfortBattleScreen::Skill2Clicked()
{
 const FString Skill=SkillActionAt(1);
 if (!Skill.IsEmpty()) RequestAction(Skill);
}
void UStarfortBattleScreen::Skill3Clicked()
{
 const FString Skill=SkillActionAt(2);
 if (!Skill.IsEmpty()) RequestAction(Skill);
}

void UStarfortBattleScreen::RetryClicked()
{
 // Only reload the server-owned turn. Never retry a timed-out attack/upgrade.
 OnRetryRequested.Broadcast();
}
