#include "StarfortHeroScreen.h"
#include "StarfortNativeWidgetFactory.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "Engine/Texture2D.h"
#include "UObject/SoftObjectPath.h"
#include "Math/UnrealMathUtility.h"

void UStarfortHeroScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 FStarfortNativeWidgetFactory::BuildHero(this);
 if (BtnInspect) BtnInspect->OnClicked.AddDynamic(this, &UStarfortHeroScreen::InspectClicked);
 if (BtnFirePreview) BtnFirePreview->OnClicked.AddDynamic(this, &UStarfortHeroScreen::FireClicked);
 if (BtnBack) BtnBack->OnClicked.AddDynamic(this, &UStarfortHeroScreen::BackClicked);
 if (BtnUpgrade) BtnUpgrade->OnClicked.AddUniqueDynamic(this, &UStarfortHeroScreen::UpgradeClicked);
 if (BtnSelectRovan) BtnSelectRovan->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::RovanClicked);
 if (BtnSelectAldren) BtnSelectAldren->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::AldrenClicked);
 if (BtnSelectLyra) BtnSelectLyra->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::LyraClicked);
 if (BtnSelectVesper) BtnSelectVesper->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::VesperClicked);
 RefreshCinematicArt();
 SetWaitingForServer();
}

void UStarfortHeroScreen::SetWaitingForServer()
{
 bHasVerifiedHero = false;
 bUpgradePending = false;
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

void UStarfortHeroScreen::ApplyVerifiedRosterLevel(const FString& HeroId,int32 Level)
{
 // The current authenticated progress RPC supplies hero level, NOT attack,
 // defense, rarity, shard count or detailed stats. Never invent those.
 if(HeroId!=SelectedHeroId || Level<1 || Level>20)
 {
  SetWaitingForServer();return;
 }
 SetWaitingForServer();
 bHasVerifiedHero=true;
 const TMap<FString,FString> Names={
  {TEXT("rovan"),TEXT("Rovan · Kraliyet Nişancısı")},
  {TEXT("aldren"),TEXT("Aldren · Kül Muhafızı")},
  {TEXT("lyra"),TEXT("Lyra · Yıldız Dokuyucu")},
  {TEXT("vesper"),TEXT("Vesper · Gölge Düellocusu")},
  {TEXT("mira"),TEXT("Mira")},
  {TEXT("doran"),TEXT("Doran")},
  {TEXT("eira"),TEXT("Eira")}
 };
 const FString* Name=Names.Find(HeroId);
 if(!Name) {SetWaitingForServer();return;}
 if(TxtHeroName) TxtHeroName->SetText(FText::FromString(*Name));
 if(TxtLevel)
  TxtLevel->SetText(FText::Format(FText::FromString(TEXT("Seviye {0} / 20")),
   FText::AsNumber(Level)));
 if(TxtConnectionStatus)
  TxtConnectionStatus->SetText(FText::FromString(TEXT("Sunucu kahramanı doğrulandı")));
 if(BtnUpgrade) BtnUpgrade->SetIsEnabled(Level<20);
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
 bUpgradePending = false;
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
 if (bHasVerifiedHero && !bUpgradePending)
 {
  bUpgradePending=true;
  if(BtnUpgrade) BtnUpgrade->SetIsEnabled(false);
  OnUpgradeRequested.Broadcast();
 }
}

bool UStarfortHeroScreen::SelectHero(const FString& HeroId)
{
 // Cosmetic selection is local, but level/train is always server-owned.
 // Never invent access to an unowned character.
 if(HeroId!=TEXT("rovan") && HeroId!=TEXT("aldren") &&
    HeroId!=TEXT("lyra") && HeroId!=TEXT("vesper") &&
    HeroId!=TEXT("mira") && HeroId!=TEXT("doran") &&
    HeroId!=TEXT("eira")) return false;
 if(SelectedHeroId==HeroId) return true;
 SelectedHeroId=HeroId;
 SetWaitingForServer();
 RefreshCinematicArt();
 OnHeroSelected.Broadcast(HeroId);
 return true;
}
void UStarfortHeroScreen::RovanClicked() { SelectHero(TEXT("rovan")); }
void UStarfortHeroScreen::AldrenClicked() { SelectHero(TEXT("aldren")); }
void UStarfortHeroScreen::LyraClicked() { SelectHero(TEXT("lyra")); }
void UStarfortHeroScreen::VesperClicked() { SelectHero(TEXT("vesper")); }

void UStarfortHeroScreen::RefreshCinematicArt()
{
 // These are 2D concept/splash textures for the hero gallery only.
 // This MUST NOT be used as a mesh in the 3D battle scene.
 ActiveSplash=nullptr;
 ActivePortrait=nullptr;
 if(ImgHeroSplash) ImgHeroSplash->SetBrushFromTexture(nullptr);
 if(ImgHeroPortrait) ImgHeroPortrait->SetBrushFromTexture(nullptr);
 const FString Base=TEXT("/Game/UI/HeroCinematicV1/");
 const FString Id=SelectedHeroId.Left(1).ToUpper()+SelectedHeroId.Mid(1);
 const FString SplashName=TEXT("T_")+Id+TEXT("_Splash");
 const FString PortraitName=TEXT("T_")+Id+TEXT("_Portrait");
 const FSoftObjectPath SplashPath(Base+SplashName+TEXT(".")+SplashName);
 const FSoftObjectPath PortraitPath(Base+PortraitName+TEXT(".")+PortraitName);
 ActiveSplash=Cast<UTexture2D>(SplashPath.TryLoad());
 ActivePortrait=Cast<UTexture2D>(PortraitPath.TryLoad());
 if(ActiveSplash && ImgHeroSplash) ImgHeroSplash->SetBrushFromTexture(ActiveSplash,true);
 if(ActivePortrait && ImgHeroPortrait) ImgHeroPortrait->SetBrushFromTexture(ActivePortrait,true);
 if(TxtHeroArtStatus)
  TxtHeroArtStatus->SetText(FText::FromString(
   ActiveSplash ? TEXT("Sinematik 2D kahraman görseli · 3D model değildir")
                : TEXT("Sinematik görsel henüz Unreal'a import edilmedi")));
}
