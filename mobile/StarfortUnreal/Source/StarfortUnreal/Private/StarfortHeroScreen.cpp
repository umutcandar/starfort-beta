#include "StarfortHeroScreen.h"
#include "StarfortNativeWidgetFactory.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "Engine/Texture2D.h"
#include "Engine/AssetManager.h"
#include "Engine/StreamableManager.h"
#include "UObject/SoftObjectPath.h"
#include "Math/UnrealMathUtility.h"

void UStarfortHeroScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 FStarfortNativeWidgetFactory::BuildHero(this);
 if (BtnInspect) BtnInspect->OnClicked.AddDynamic(this, &UStarfortHeroScreen::InspectClicked);
 if (BtnFirePreview) BtnFirePreview->OnClicked.AddDynamic(this, &UStarfortHeroScreen::FireClicked);
 if (BtnBack) BtnBack->OnClicked.AddDynamic(this, &UStarfortHeroScreen::BackClicked);
 if (BtnBag) BtnBag->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::BagClicked);
 if (BtnUpgrade) BtnUpgrade->OnClicked.AddUniqueDynamic(this, &UStarfortHeroScreen::UpgradeClicked);
 if (BtnSelectRovan) BtnSelectRovan->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::RovanClicked);
 if (BtnSelectAldren) BtnSelectAldren->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::AldrenClicked);
 if (BtnSelectLyra) BtnSelectLyra->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::LyraClicked);
 if (BtnSelectVesper) BtnSelectVesper->OnClicked.AddUniqueDynamic(this,&UStarfortHeroScreen::VesperClicked);
 SetWaitingForServer();
}

void UStarfortHeroScreen::NativeConstruct()
{
 Super::NativeConstruct();
 RefreshCinematicArt();
}

void UStarfortHeroScreen::NativeDestruct()
{
 CancelCinematicArtLoad();
 ActiveSplash=nullptr;
 ActivePortrait=nullptr;
 ActiveCard=nullptr;
 ActiveSkillIcons.Reset();
 Super::NativeDestruct();
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
void UStarfortHeroScreen::BagClicked() { OnBagRequested.Broadcast(); }
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
 bShowingHeroCard=false;
 SetWaitingForServer();
 RefreshCinematicArt();
 OnHeroSelected.Broadcast(HeroId);
 return true;
}
void UStarfortHeroScreen::RovanClicked() { SelectHero(TEXT("rovan")); }
void UStarfortHeroScreen::AldrenClicked() { SelectHero(TEXT("aldren")); }
void UStarfortHeroScreen::LyraClicked() { SelectHero(TEXT("lyra")); }
void UStarfortHeroScreen::VesperClicked() { SelectHero(TEXT("vesper")); }

void UStarfortHeroScreen::CancelCinematicArtLoad()
{
 ++CinematicArtLoadGeneration;
 if(CinematicArtLoadHandle.IsValid())
 {
  CinematicArtLoadHandle->CancelHandle();
  CinematicArtLoadHandle.Reset();
 }
}

void UStarfortHeroScreen::RefreshCinematicArt()
{
 // The cinematic PNGs are 2D gallery art, not 3D skeletal meshes.
 // Loading seven high-resolution textures synchronously when switching
 // characters could stall the main game thread on low-memory phones.
 CancelCinematicArtLoad();
 ActiveSplash=nullptr;
 ActivePortrait=nullptr;
 ActiveCard=nullptr;
 ActiveSkillIcons.Reset();
 if(ImgHeroSplash) ImgHeroSplash->SetBrushFromTexture(nullptr);
 if(ImgHeroPortrait) ImgHeroPortrait->SetBrushFromTexture(nullptr);
 for(UImage* Image:{ImgSkill1.Get(),ImgSkill2.Get(),ImgSkill3.Get(),ImgSkill4.Get()})
  if(Image) Image->SetBrushFromTexture(nullptr);
 if(TxtHeroArtStatus)
  TxtHeroArtStatus->SetText(FText::FromString(
   TEXT("Kahraman görselleri yükleniyor · 2D konsept")));

 const FString Base=TEXT("/Game/UI/HeroCinematicV1/");
 const FString Id=SelectedHeroId.Left(1).ToUpper()+SelectedHeroId.Mid(1);
 const FString Prefix=TEXT("T_")+Id;
 TArray<FSoftObjectPath> RequestedAssets;
 auto MakePath=[&Base](const FString& AssetName)
 {
  return FSoftObjectPath(Base+AssetName+TEXT(".")+AssetName);
 };
 RequestedAssets.Add(MakePath(Prefix+TEXT("_Splash")));
 RequestedAssets.Add(MakePath(Prefix+TEXT("_Portrait")));
 RequestedAssets.Add(MakePath(Prefix+TEXT("_Card")));
 for(int32 I=1;I<=4;++I)
  RequestedAssets.Add(MakePath(
   FString::Printf(TEXT("%s_Skill_%02d"),*Prefix,I)));
 const uint64 Generation=CinematicArtLoadGeneration;
 const FString HeroId=SelectedHeroId;
 CinematicArtLoadHandle=UAssetManager::GetStreamableManager().RequestAsyncLoad(
  RequestedAssets,FStreamableDelegate::CreateUObject(this,
   &UStarfortHeroScreen::OnCinematicArtLoaded,Generation,HeroId));
 if(!CinematicArtLoadHandle.IsValid() && TxtHeroArtStatus)
  TxtHeroArtStatus->SetText(FText::FromString(
   TEXT("Unreal görsel yüklemesi başlatılamadı")));
}

void UStarfortHeroScreen::OnCinematicArtLoaded(
 uint64 RequestGeneration,FString RequestedHeroId)
{
 // Another account/character/level may have arrived during asset streaming.
 if(RequestGeneration!=CinematicArtLoadGeneration ||
    RequestedHeroId!=SelectedHeroId)
  return;
 const FString Base=TEXT("/Game/UI/HeroCinematicV1/");
 const FString Id=SelectedHeroId.Left(1).ToUpper()+SelectedHeroId.Mid(1);
 const FString Prefix=TEXT("T_")+Id;
 auto Resolve=[&Base](const FString& Name)
 {
  return Cast<UTexture2D>(
   FSoftObjectPath(Base+Name+TEXT(".")+Name).ResolveObject());
 };
 ActiveSplash=Resolve(Prefix+TEXT("_Splash"));
 ActivePortrait=Resolve(Prefix+TEXT("_Portrait"));
 ActiveCard=Resolve(Prefix+TEXT("_Card"));
 if(ImgHeroSplash) ImgHeroSplash->SetBrushFromTexture(
  bShowingHeroCard&&ActiveCard?ActiveCard.Get():ActiveSplash.Get(),true);
 if(ImgHeroPortrait) ImgHeroPortrait->SetBrushFromTexture(ActivePortrait,true);
 UImage* Images[]={ImgSkill1.Get(),ImgSkill2.Get(),ImgSkill3.Get(),ImgSkill4.Get()};
 ActiveSkillIcons.Reset();
 int32 LoadedIcons=0;
 for(int32 I=0;I<4;++I)
 {
  UTexture2D* Texture=Resolve(
   FString::Printf(TEXT("%s_Skill_%02d"),*Prefix,I+1));
  if(Texture)
  {
   ActiveSkillIcons.Add(Texture);
   ++LoadedIcons;
  }
  if(Images[I]) Images[I]->SetBrushFromTexture(Texture,true);
 }
 if(TxtHeroArtStatus)
  TxtHeroArtStatus->SetText(FText::FromString(
   ActiveSplash && ActivePortrait && ActiveCard && LoadedIcons==4
   ? TEXT("Sinematik 2D sanat yüklendi · 3D model değildir")
   : TEXT("Kahraman görselleri eksik · 28 PNG Unreal'a import edilmeli")));
}

void UStarfortHeroScreen::ToggleHeroArtDetail()
{
 if(!ActiveSplash || !ActiveCard || !ImgHeroSplash) return;
 bShowingHeroCard=!bShowingHeroCard;
 ImgHeroSplash->SetBrushFromTexture(
  bShowingHeroCard?ActiveCard.Get():ActiveSplash.Get(),true);
 if(TxtHeroArtStatus)
  TxtHeroArtStatus->SetText(FText::FromString(
   bShowingHeroCard ? TEXT("Kahraman kartı · sinematik 2D konsept")
                    : TEXT("Tam boy kahraman görseli · 3D model değil")));
}
