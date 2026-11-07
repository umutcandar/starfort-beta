#include "StarfortVillageScreen.h"
#include "StarfortNativeWidgetFactory.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Containers/Set.h"

void UStarfortVillageScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 FStarfortNativeWidgetFactory::BuildVillage(this);
 if (BtnUpgrade) BtnUpgrade->OnClicked.AddDynamic(this,&UStarfortVillageScreen::UpgradeClicked);
 if (BtnHeroes) BtnHeroes->OnClicked.AddDynamic(this,&UStarfortVillageScreen::HeroesClicked);
 if (BtnBattles) BtnBattles->OnClicked.AddDynamic(this,&UStarfortVillageScreen::BattlesClicked);
 if (BtnAlliance) BtnAlliance->OnClicked.AddDynamic(this,&UStarfortVillageScreen::AllianceClicked);
 if (BtnRefresh) BtnRefresh->OnClicked.AddUniqueDynamic(this,&UStarfortVillageScreen::RefreshClicked);
 if (BtnSignOut) BtnSignOut->OnClicked.AddUniqueDynamic(this,&UStarfortVillageScreen::SignOutClicked);
 SetWaitingForServer();
}

void UStarfortVillageScreen::SetWaitingForServer()
{
 bHasVerifiedVillage = false;
 bUpgradePending = false;
 SelectedBuildingId = NAME_None;
 VerifiedSnapshot = FStarfortVerifiedVillage();
 const FText Empty = FText::FromString(TEXT("—"));
 if (TxtVillageName) TxtVillageName->SetText(FText::FromString(TEXT("Köy yükleniyor")));
 if (TxtGold) TxtGold->SetText(Empty);
 if (TxtWood) TxtWood->SetText(Empty);
 if (TxtStone) TxtStone->SetText(Empty);
 if (TxtStarEssence) TxtStarEssence->SetText(Empty);
 if (TxtBuildingName) TxtBuildingName->SetText(Empty);
 if (TxtBuildingLevel) TxtBuildingLevel->SetText(Empty);
 if (TxtConnectionStatus)
  TxtConnectionStatus->SetText(FText::FromString(TEXT("Sunucu doğrulaması bekleniyor")));
 if (BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
}

void UStarfortVillageScreen::ApplyVerifiedVillage(const FStarfortVerifiedVillage& NewSnapshot)
{
 if (!NewSnapshot.bServerVerified || NewSnapshot.VillageId.IsEmpty() ||
   NewSnapshot.Gold<0 || NewSnapshot.Wood<0 || NewSnapshot.Stone<0 ||
   NewSnapshot.StarEssence<0 || NewSnapshot.Buildings.Num()>512)
 {
  UE_LOG(LogTemp, Warning, TEXT("STARFORT rejected invalid/unverified village payload"));
  SetWaitingForServer();
  return;
 }
 TSet<FName> KnownIds;
 for (const FStarfortVerifiedBuilding& Building : NewSnapshot.Buildings)
 {
  if (Building.BuildingId.IsNone() || KnownIds.Contains(Building.BuildingId) ||
      Building.Level<0 || Building.MaxLevel<1 || Building.Level>Building.MaxLevel)
  {
   SetWaitingForServer();
   return;
  }
  KnownIds.Add(Building.BuildingId);
 }
 VerifiedSnapshot=NewSnapshot;
 bHasVerifiedVillage=true;
 bUpgradePending=false;
 if (TxtVillageName) TxtVillageName->SetText(NewSnapshot.VillageName);
 if (TxtGold) TxtGold->SetText(FText::AsNumber(NewSnapshot.Gold));
 if (TxtWood) TxtWood->SetText(FText::AsNumber(NewSnapshot.Wood));
 if (TxtStone) TxtStone->SetText(FText::AsNumber(NewSnapshot.Stone));
 if (TxtStarEssence) TxtStarEssence->SetText(FText::AsNumber(NewSnapshot.StarEssence));
 if (TxtConnectionStatus)
  TxtConnectionStatus->SetText(FText::FromString(TEXT("Köy sunucuyla eşitlendi")));
 const FName PreviousBuilding=SelectedBuildingId;
 SelectedBuildingId=NAME_None;
 if (!PreviousBuilding.IsNone()) FocusBuilding(PreviousBuilding);
 if (SelectedBuildingId.IsNone())
 {
  if (TxtBuildingName) TxtBuildingName->SetText(FText::FromString(TEXT("Bina seç")));
  if (TxtBuildingLevel) TxtBuildingLevel->SetText(FText::FromString(TEXT("—")));
  if (BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
 }
}

bool UStarfortVillageScreen::FocusBuilding(FName BuildingId)
{
 if (!bHasVerifiedVillage || BuildingId.IsNone()) return false;
 for (const FStarfortVerifiedBuilding& Building : VerifiedSnapshot.Buildings)
 {
  if (Building.BuildingId!=BuildingId) continue;
  SelectedBuildingId=BuildingId;
  if (TxtBuildingName) TxtBuildingName->SetText(Building.Name);
  if (TxtBuildingLevel)
   TxtBuildingLevel->SetText(FText::Format(FText::FromString(TEXT("Seviye {0}/{1}")),
    FText::AsNumber(Building.Level), FText::AsNumber(Building.MaxLevel)));
  if (BtnUpgrade)
   BtnUpgrade->SetIsEnabled(!bUpgradePending && Building.bServerAllowsUpgrade && Building.Level<Building.MaxLevel);
  return true;
 }
 SelectedBuildingId=NAME_None;
 if (TxtBuildingName) TxtBuildingName->SetText(FText::FromString(TEXT("Bina verisi bekleniyor")));
 if (TxtBuildingLevel) TxtBuildingLevel->SetText(FText::FromString(TEXT("—")));
 if (BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
 return false;
}

void UStarfortVillageScreen::RequestBuildingDetails(FName BuildingId)
{
 if (!BuildingId.IsNone()) OnBuildingDetailRequested.Broadcast(BuildingId);
}
void UStarfortVillageScreen::UpgradeClicked()
{
 if (!bHasVerifiedVillage || bUpgradePending || SelectedBuildingId.IsNone()) return;
 for (const FStarfortVerifiedBuilding& Building:VerifiedSnapshot.Buildings)
 {
  if (Building.BuildingId==SelectedBuildingId &&
      Building.bServerAllowsUpgrade && Building.Level<Building.MaxLevel)
  {
   // Authorization and costs are ALWAYS checked again by the remote server.
   bUpgradePending = true;
   if (BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
   OnUpgradeRequested.Broadcast(SelectedBuildingId);
   return;
  }
 }
}
void UStarfortVillageScreen::HeroesClicked() { OnHeroesRequested.Broadcast(); }
void UStarfortVillageScreen::BattlesClicked() { OnBattlesRequested.Broadcast(); }
void UStarfortVillageScreen::AllianceClicked() { OnAllianceRequested.Broadcast(); }

void UStarfortVillageScreen::RefreshClicked() { OnRefreshRequested.Broadcast(); }
void UStarfortVillageScreen::SignOutClicked() { OnSignOutRequested.Broadcast(); }
