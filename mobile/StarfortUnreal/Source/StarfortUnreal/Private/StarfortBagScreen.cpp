#include "StarfortBagScreen.h"
#include "StarfortBagCatalog.h"
#include "StarfortCraftingMaterials.h"
#include "StarfortGearEconomy.h"
#include "StarfortBagTile.h"
#include "StarfortVisualTheme.h"
#include "Blueprint/WidgetTree.h"
#include "Components/Border.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/Overlay.h"
#include "Components/SafeZone.h"
#include "Components/ScaleBox.h"
#include "Components/SizeBox.h"
#include "Components/ScrollBox.h"
#include "Components/UniformGridPanel.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "Engine/Texture2D.h"
#include "UObject/SoftObjectPath.h"

namespace StarfortBagUI
{
 static FLinearColor Gold(){return FLinearColor(.97f,.78f,.42f,1.f);}
 static FLinearColor Navy(){return FLinearColor(.025f,.052f,.11f,.98f);}
 static FLinearColor Ink(){return FLinearColor(.9f,.93f,.99f,1.f);}
 static UTextBlock* Text(UWidgetTree* T,const FString& Value,
  int32 Pt,FLinearColor Color)
 {
  UTextBlock* X=T->ConstructWidget<UTextBlock>();
  X->SetText(FText::FromString(Value));
  X->SetColorAndOpacity(FSlateColor(Color));
  FSlateFontInfo Font=X->GetFont();Font.Size=Pt;X->SetFont(Font);
  X->SetAutoWrapText(true);
  return X;
 }
 static UVerticalBox* Panel(UWidgetTree* T,UHorizontalBox* Parent,
  float Width)
 {
  USizeBox* Size=T->ConstructWidget<USizeBox>();
  Size->SetWidthOverride(Width);
  UHorizontalBoxSlot* Slot=Parent->AddChildToHorizontalBox(Size);
  Slot->SetPadding(FMargin(5.f,3.f));
  UBorder* GoldFrame=T->ConstructWidget<UBorder>();
  GoldFrame->SetBrushColor(FLinearColor(.55f,.41f,.20f,1.f));
  GoldFrame->SetPadding(FMargin(2.f));
  Size->SetContent(GoldFrame);
  UBorder* Inside=T->ConstructWidget<UBorder>();
  Inside->SetBrushColor(Navy());
  Inside->SetPadding(FMargin(12.f,10.f));
  GoldFrame->SetContent(Inside);
  UVerticalBox* Column=T->ConstructWidget<UVerticalBox>();
  Inside->SetContent(Column);
  return Column;
 }
 static USizeBox* Sized(UWidgetTree* T,UWidget* Content,float Width,float Height)
 {
  USizeBox* Box=T->ConstructWidget<USizeBox>();
  Box->SetWidthOverride(Width);
  Box->SetHeightOverride(Height);
  Box->SetContent(Content);
  return Box;
 }
 static FString Count(int64 N)
 {
  return FText::AsNumber(N).ToString();
 }
}

void UStarfortBagScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 BuildNativeLayout();
 SetWaitingForServer();
}

void UStarfortBagScreen::NativeDestruct()
{
 Verified=FStarfortProgressSummary();
 RealMaterials=FStarfortMaterialSnapshot();
 bMaterialsVerified=false;
 bMaterialFocusPending=false;
 bHasVerifiedInventory=false;
 bMutationPending=false;
 Super::NativeDestruct();
}

UStarfortBagTile* UStarfortBagScreen::MakeTile(
 const FString& Action,const FString& Label,const FString& Hint,
 const FLinearColor& Accent,bool bEnabled,bool bSelected)
{
 UStarfortBagTile* Tile=CreateWidget<UStarfortBagTile>(
  GetOwningPlayer(),UStarfortBagTile::StaticClass());
 if(!Tile) return nullptr;
 Tile->BuildTile(Action,Label,Hint,Accent,bEnabled,bSelected);
 Tile->OnActivated.AddUniqueDynamic(this,&UStarfortBagScreen::HandleTile);
 return Tile;
}

void UStarfortBagScreen::AddTitle(UVerticalBox* Box,
 const FString& Title,int32 Size,const FLinearColor& Color)
{
 if(!Box || !WidgetTree)return;
 UTextBlock* Label=StarfortBagUI::Text(WidgetTree,Title,Size,Color);
 Box->AddChildToVerticalBox(Label)->SetPadding(FMargin(4.f,4.f,4.f,8.f));
}

void UStarfortBagScreen::BuildNativeLayout()
{
 if(!WidgetTree || WidgetTree->RootWidget) return;
 UWidgetTree* T=WidgetTree;
 // All panels and touch controls are native Unreal widgets, not a flattened
 // image, WebView, HTML, screenshot overlay or front-end JavaScript.
 USafeZone* Safe=T->ConstructWidget<USafeZone>();
 UScaleBox* Fit=T->ConstructWidget<UScaleBox>();
 Fit->SetStretch(EStretch::ScaleToFit);
 Safe->SetContent(Fit);
 USizeBox* Landscape=T->ConstructWidget<USizeBox>();
 Landscape->SetWidthOverride(1560.f);
 Landscape->SetHeightOverride(870.f);
 Fit->SetContent(Landscape);
 UBorder* Background=T->ConstructWidget<UBorder>();
 Background->SetBrushColor(StarfortBagUI::Navy());
 Background->SetPadding(FMargin(13.f));
 Landscape->SetContent(Background);
 UVerticalBox* Page=T->ConstructWidget<UVerticalBox>();
 Background->SetContent(Page);
 WidgetTree->RootWidget=Safe;

 // Reference: upper-left STARFORT title; upper-right gold/wood/stone/essence.
 UHorizontalBox* Header=T->ConstructWidget<UHorizontalBox>();
 Page->AddChildToVerticalBox(Header)->SetPadding(FMargin(1.f,1.f,1.f,8.f));
 UTextBlock* Logo=StarfortBagUI::Text(T,TEXT("✦ STARFORT   Çanta ve Donanım"),
  31,StarfortBagUI::Gold());
 Header->AddChildToHorizontalBox(Logo)->SetSize(
  FSlateChildSize(ESlateSizeRule::Fill));
 auto AddResource=[this,T,Header](const FString& Name,UTextBlock*& Output)
 {
  UVerticalBox* Column=T->ConstructWidget<UVerticalBox>();
  Header->AddChildToHorizontalBox(Column)->SetPadding(FMargin(14.f,0.f));
  Column->AddChildToVerticalBox(StarfortBagUI::Text(
   T,Name,13,StarfortBagUI::Gold()));
  Output=StarfortBagUI::Text(T,TEXT("—"),19,StarfortBagUI::Ink());
  Column->AddChildToVerticalBox(Output);
 };
 UTextBlock* Gold=nullptr;AddResource(TEXT("✪ Altın"),Gold);TxtGold=Gold;
 UTextBlock* Wood=nullptr;AddResource(TEXT("▤ Kereste"),Wood);TxtWood=Wood;
 UTextBlock* Stone=nullptr;AddResource(TEXT("⬟ Taş"),Stone);TxtStone=Stone;
 UTextBlock* Essence=nullptr;AddResource(TEXT("✧ Yıldız Özü"),Essence);TxtEssence=Essence;

 UHorizontalBox* Main=T->ConstructWidget<UHorizontalBox>();
 UVerticalBoxSlot* BodySlot=Page->AddChildToVerticalBox(Main);
 BodySlot->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
 BodySlot->SetPadding(FMargin(0.f,0.f,0.f,7.f));

 // 1/4: selectable real owned server heroes.
 UVerticalBox* Left=StarfortBagUI::Panel(T,Main,235.f);
 AddTitle(Left,TEXT("✦ Kahramanlar"),21);
 UScrollBox* HeroesScroll=T->ConstructWidget<UScrollBox>();
 Left->AddChildToVerticalBox(HeroesScroll)->SetSize(
  FSlateChildSize(ESlateSizeRule::Fill));
 RosterColumn=T->ConstructWidget<UVerticalBox>();
 HeroesScroll->AddChild(RosterColumn);

 // 2/4: imported hero concept portrait if locally present, real stats only.
 UVerticalBox* Character=StarfortBagUI::Panel(T,Main,376.f);
 AddTitle(Character,TEXT("Aktif Kahraman"),19);
 UBorder* PortraitFrame=T->ConstructWidget<UBorder>();
 PortraitFrame->SetBrushColor(FLinearColor(.055f,.11f,.20f,1.f));
 PortraitFrame->SetPadding(FMargin(2.f));
 Character->AddChildToVerticalBox(
  StarfortBagUI::Sized(T,PortraitFrame,350.f,350.f));
 ImgHero=T->ConstructWidget<UImage>();
 PortraitFrame->SetContent(ImgHero);
 TxtHero=T->ConstructWidget<UTextBlock>();
 Character->AddChildToVerticalBox(TxtHero)->SetPadding(FMargin(4.f,9.f));
 TxtHeroLevel=T->ConstructWidget<UTextBlock>();
 Character->AddChildToVerticalBox(TxtHeroLevel)->SetPadding(FMargin(4.f,1.f));
 TxtHeroArtStatus=T->ConstructWidget<UTextBlock>();
 Character->AddChildToVerticalBox(TxtHeroArtStatus)->SetPadding(FMargin(4.f,9.f));
 TxtHeroArtStatus->SetAutoWrapText(true);
 UBorder* StatsFrame=T->ConstructWidget<UBorder>();
 StatsFrame->SetBrushColor(FLinearColor(.045f,.092f,.16f,1.f));
 StatsFrame->SetPadding(FMargin(9.f));
 Character->AddChildToVerticalBox(StatsFrame)->SetPadding(FMargin(3.f,14.f));
 TxtStats=StarfortBagUI::Text(T,TEXT("—"),16,StarfortBagUI::Ink());
 StatsFrame->SetContent(TxtStats);

 // 3/4: three equippable slots + actual grid of 19 backend item IDs.
 UVerticalBox* Equipment=StarfortBagUI::Panel(T,Main,575.f);
 AddTitle(Equipment,TEXT("✦ Aktif Kahraman Donanımı"),20);
 EquippedRow=T->ConstructWidget<UHorizontalBox>();
 Equipment->AddChildToVerticalBox(EquippedRow)->SetPadding(
  FMargin(0.f,0.f,0.f,12.f));
 AddTitle(Equipment,TEXT("Çanta"),21);
 FilterRow=T->ConstructWidget<UHorizontalBox>();
 Equipment->AddChildToVerticalBox(FilterRow)->SetPadding(
  FMargin(0.f,0.f,0.f,9.f));
 UScrollBox* ItemsScroll=T->ConstructWidget<UScrollBox>();
 Equipment->AddChildToVerticalBox(ItemsScroll)->SetSize(
  FSlateChildSize(ESlateSizeRule::Fill));
 ItemGrid=T->ConstructWidget<UUniformGridPanel>();
 ItemsScroll->AddChild(ItemGrid);

 // 4/4: selected gear details and server-backed actions.
 UVerticalBox* Details=StarfortBagUI::Panel(T,Main,305.f);
 AddTitle(Details,TEXT("Seçili Eşya"),21);
 // Scroll real recipes, set summaries and endgame star-upgrade costs
 // inside the available landscape panel, never clip buttons on small phones.
 UScrollBox* DetailsScroll=T->ConstructWidget<UScrollBox>();
 Details->AddChildToVerticalBox(DetailsScroll)->SetSize(
  FSlateChildSize(ESlateSizeRule::Fill));
 DetailColumn=T->ConstructWidget<UVerticalBox>();
 DetailsScroll->AddChild(DetailColumn);

 TxtStatus=StarfortBagUI::Text(T,
  TEXT("Sunucu eşya bilgisi bekleniyor"),14,StarfortBagUI::Gold());
 Page->AddChildToVerticalBox(TxtStatus)->SetPadding(FMargin(11.f,1.f,11.f,4.f));

 // Same six-action bottom navigation geometry as supplied concept.
 UHorizontalBox* Nav=T->ConstructWidget<UHorizontalBox>();
 Page->AddChildToVerticalBox(Nav);
 const TArray<TPair<FString,FString>> Destinations={
  {TEXT("village"),TEXT("⌂ Köy")},
  {TEXT("battle"),TEXT("⚔ Seferler")},
  {TEXT("heroes"),TEXT("✦ Kahramanlar")},
  {TEXT("bag"),TEXT("▣ Çanta")},
  {TEXT("alliance"),TEXT("⚑ İttifak")},
  {TEXT("store"),TEXT("♜ Mağaza")}
 };
 for(const auto& Destination:Destinations)
 {
  // The unavailable store action is visibly disabled, not a dead button.
  const bool bEnabled=Destination.Key!=TEXT("store") &&
   Destination.Key!=TEXT("bag");
  UStarfortBagTile* Tile=MakeTile(TEXT("nav:")+Destination.Key,
   Destination.Value,Destination.Key==TEXT("store")?
    TEXT("Sunucu entegrasyonu bekleniyor"):TEXT(""),
   Destination.Key==TEXT("bag")?StarfortBagUI::Gold():
   StarfortBagUI::Ink(),bEnabled,
   Destination.Key==TEXT("bag"));
  if(Tile)
  {
   UHorizontalBoxSlot* NavSlot=Nav->AddChildToHorizontalBox(Tile);
   NavSlot->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
   NavSlot->SetPadding(FMargin(3.f,2.f));
  }
 }
}

FString UStarfortBagScreen::DisplayHero(const FString& Id) const
{
 if(Id==TEXT("aldren"))return TEXT("Aldren");
 if(Id==TEXT("lyra"))return TEXT("Lyra");
 if(Id==TEXT("rovan"))return TEXT("Rovan");
 if(Id==TEXT("mira"))return TEXT("Mira");
 if(Id==TEXT("doran"))return TEXT("Doran");
 if(Id==TEXT("vesper"))return TEXT("Vesper");
 if(Id==TEXT("eira"))return TEXT("Eira");
 return TEXT("—");
}
FString UStarfortBagScreen::DisplayRole(const FString& Id) const
{
 if(Id==TEXT("aldren"))return TEXT("Kül Muhafızı");
 if(Id==TEXT("lyra"))return TEXT("Yıldız Dokuyucu");
 if(Id==TEXT("rovan"))return TEXT("Kraliyet Nişancısı");
 if(Id==TEXT("mira"))return TEXT("Ay Rahibesi");
 if(Id==TEXT("doran"))return TEXT("Demir Yemin");
 if(Id==TEXT("vesper"))return TEXT("Gölge Düellocusu");
 if(Id==TEXT("eira"))return TEXT("Kutup Kâhini");
 return TEXT("");
}

FString UStarfortBagScreen::CurrentlyWorn(const FString& Slot) const
{
 const FStarfortBagLoadout* Loadout=Verified.Loadouts.Find(SelectedHeroId);
 return Loadout?Loadout->ForSlot(Slot):FString();
}
int32 UStarfortBagScreen::UsedCopies(const FString& ItemId) const
{
 int32 Count=0;
 const FStarfortBagItemInfo* Info=FStarfortBagCatalog::Find(ItemId);
 if(!Info)return 0;
 for(const auto& Entry:Verified.Loadouts)
  if(Entry.Value.ForSlot(Info->Slot)==ItemId)++Count;
 return Count;
}
void UStarfortBagScreen::ShowHeroArt()
{
 if(!ImgHero || !TxtHeroArtStatus)return;
 // Only locally imported actual Unreal Texture2D is rendered, never a
 // generated screenshot pretending to be a live 3D rig.
 const FString Id=SelectedHeroId.Left(1).ToUpper()+SelectedHeroId.Mid(1);
 const FString Name=TEXT("T_")+Id+TEXT("_Splash");
 const FString Path=TEXT("/Game/UI/HeroCinematicV1/")+Name+TEXT(".")+Name;
 UTexture2D* Texture=Cast<UTexture2D>(FSoftObjectPath(Path).TryLoad());
 ImgHero->SetBrushFromTexture(Texture,true);
 TxtHeroArtStatus->SetText(FText::FromString(
  Texture?TEXT("Kahraman konsept resmi · gerçek 3D model değildir"):
   TEXT("3D kahraman/portre Unreal'a aktarılınca burada görünecek")));
}

void UStarfortBagScreen::SetMaterialsWaiting()
{
 RealMaterials=FStarfortMaterialSnapshot();
 bMaterialsVerified=false;
 bMaterialFocusPending=false;
 MaterialsStatus=TEXT("Malzemeler için sunucu yanıtı bekleniyor");
 Refresh();
}
void UStarfortBagScreen::ApplyVerifiedMaterials(
 const FStarfortMaterialSnapshot& Snapshot)
{
 if(!Snapshot.bServerVerified ||
    !FStarfortCraftingMaterialCatalog::IsFocus(Snapshot.FocusSlot) ||
    Snapshot.Counts.Num()!=FStarfortCraftingMaterialCatalog::All().Num())
 {
  ShowMaterialsUnavailable(TEXT("Malzeme yanıtı doğrulanamadı"));
  return;
 }
 for(const auto& Entry:FStarfortCraftingMaterialCatalog::All())
 {
  const int32* Count=Snapshot.Counts.Find(Entry.Id);
  if(!Count || *Count<0 || *Count>100000)
  {
   ShowMaterialsUnavailable(TEXT("Malzeme adedi doğrulanamadı"));
   return;
  }
 }
 RealMaterials=Snapshot;
 bMaterialsVerified=true;
 bMaterialFocusPending=false;
 MaterialsStatus=TEXT("Parça adetleri ve hedef türü gerçek hesap sunucusundan geldi");
 Refresh();
}
void UStarfortBagScreen::ShowMaterialsUnavailable(const FString& SafeReason)
{
 // Missing optional migration must not break existing verified equipment.
 RealMaterials=FStarfortMaterialSnapshot();
 bMaterialsVerified=false;
 bMaterialFocusPending=false;
 MaterialsStatus=SafeReason;
 Refresh();
}
void UStarfortBagScreen::SetWaitingForServer()
{
 Verified=FStarfortProgressSummary();
 bHasVerifiedInventory=false;
 bMutationPending=false;
 if(TxtStatus)TxtStatus->SetText(FText::FromString(
  TEXT("Çanta: sunucudan doğrulanmış envanter bekleniyor")));
 Refresh();
}
void UStarfortBagScreen::ApplyVerifiedAccount(
 const FStarfortProgressSummary& Snapshot)
{
 if(!Snapshot.bServerVerified || !Snapshot.bInventoryVerified)
 {
  SetWaitingForServer();
  return;
 }
 Verified=Snapshot;
 bHasVerifiedInventory=true;
 bMutationPending=false;
 if(!Verified.HeroLevels.Contains(SelectedHeroId))
 {
  for(const TCHAR* Candidate:{
   TEXT("aldren"),TEXT("mira"),TEXT("rovan"),TEXT("lyra"),
   TEXT("doran"),TEXT("vesper"),TEXT("eira")})
   if(Verified.HeroLevels.Contains(Candidate))
   {
    SelectedHeroId=Candidate;
    break;
   }
 }
 if(TxtStatus)TxtStatus->SetText(FText::FromString(
  TEXT("Kuşanma ve üretim sunucu tarafından doğrulanır")));
 Refresh();
}
void UStarfortBagScreen::ShowServerFailure(const FString& Reason)
{
 // Failed economic mutation must NEVER show locally-equipped ownership.
 bMutationPending=false;
 bHasVerifiedInventory=false;
 if(TxtStatus)TxtStatus->SetText(FText::FromString(
  TEXT("Sunucu doğrulaması gerekli: ")+Reason));
 Refresh();
}

void UStarfortBagScreen::Refresh()
{
 if(!WidgetTree || !RosterColumn || !EquippedRow ||
    !ItemGrid || !FilterRow || !DetailColumn) return;
 using namespace StarfortBagUI;
 for(UTextBlock* Resource:{TxtGold.Get(),TxtWood.Get(),
                          TxtStone.Get(),TxtEssence.Get()})
  if(Resource)Resource->SetText(FText::FromString(TEXT("—")));
 if(bHasVerifiedInventory)
 {
  TxtGold->SetText(FText::FromString(Count(Verified.Gold)));
  TxtWood->SetText(FText::FromString(Count(Verified.Wood)));
  TxtStone->SetText(FText::FromString(Count(Verified.Stone)));
  TxtEssence->SetText(FText::FromString(Count(Verified.StarEssence)));
 }
 RosterColumn->ClearChildren();
 const TCHAR* Order[]={
  TEXT("aldren"),TEXT("mira"),TEXT("rovan"),TEXT("lyra"),
  TEXT("doran"),TEXT("vesper"),TEXT("eira")};
 for(const TCHAR* Name:Order)
 {
  const FString HeroId(Name);
  const bool bOwned=bHasVerifiedInventory &&
   Verified.HeroLevels.Contains(HeroId);
  const FString Hint=bOwned?DisplayRole(HeroId)+TEXT(" · Sv. ")+
   FString::FromInt(Verified.HeroLevels.FindRef(HeroId)):
   TEXT("Henüz açılmadı");
  UStarfortBagTile* Tile=MakeTile(TEXT("hero:")+HeroId,
   DisplayHero(HeroId),Hint,Gold(),bOwned,SelectedHeroId==HeroId);
  if(Tile)RosterColumn->AddChildToVerticalBox(Tile)->SetPadding(FMargin(0,4.f));
 }
 if(TxtHero)TxtHero->SetText(FText::FromString(DisplayHero(SelectedHeroId)));
 if(TxtHeroLevel)TxtHeroLevel->SetText(FText::FromString(
  bHasVerifiedInventory && Verified.HeroLevels.Contains(SelectedHeroId)?
  DisplayRole(SelectedHeroId)+TEXT(" • Seviye ")+
   FString::FromInt(Verified.HeroLevels.FindRef(SelectedHeroId)) :
  TEXT("Kahraman verisi bekleniyor")));
 ShowHeroArt();
 EquippedRow->ClearChildren();
 int32 Attack=0,Hp=0,Armor=0,Healing=0;
 for(const TCHAR* SlotId:{TEXT("weapon"),TEXT("armor"),TEXT("relic")})
 {
  const FString Slot(SlotId),Worn=CurrentlyWorn(Slot);
  const FStarfortBagItemInfo* Item=FStarfortBagCatalog::Find(Worn);
  if(Item){Attack+=Item->Attack;Hp+=Item->Health;
           Armor+=Item->Armor;Healing+=Item->Healing;}
  UStarfortBagTile* Tile=MakeTile(TEXT("slot:")+Slot,
   FStarfortBagCatalog::SlotLabel(Slot),
   Item?FString(Item->Label):TEXT("Boş yuva"),
   Item?FStarfortBagCatalog::RarityColor(Item->Rarity):Gold(),
   bHasVerifiedInventory,!Worn.IsEmpty() && Worn==SelectedItemId);
  if(Tile)
  {
   UHorizontalBoxSlot* E=EquippedRow->AddChildToHorizontalBox(Tile);
   E->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
   E->SetPadding(FMargin(3.f));
  }
 }
 if(TxtStats)
  TxtStats->SetText(FText::FromString(bHasVerifiedInventory?
   FString::Printf(
    TEXT("Donanım bonusları\n⚔ Saldırı +%d\n♡ Can +%d\n⛨ Zırh +%d\n✦ Şifa +%d\n\nToplam güç: sunucu statı bekleniyor"),
    Attack,Hp,Armor,Healing):
   TEXT("Saldırı —\nCan —\nZırh —\nŞifa —\n\nSunucu doğrulaması bekleniyor")));
 FilterRow->ClearChildren();
 const TPair<FString,FString> Filters[]={
  {TEXT("all"),TEXT("Tümü")},{TEXT("weapon"),TEXT("Silah")},
  {TEXT("armor"),TEXT("Zırh")},{TEXT("relic"),TEXT("Tılsım")},
  {TEXT("set"),TEXT("Set")},{TEXT("owned"),TEXT("Sahip")},
   {TEXT("materials"),TEXT("Malzemeler")}};
 for(const auto& Filter:Filters)
 {
  UStarfortBagTile* Tile=MakeTile(TEXT("filter:")+Filter.Key,
   Filter.Value,TEXT(""),Gold(),true,ActiveFilter==Filter.Key);
  if(Tile)
  {
   UHorizontalBoxSlot* Slot=FilterRow->AddChildToHorizontalBox(Tile);
   Slot->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
   Slot->SetPadding(FMargin(2.f));
  }
 }
 ItemGrid->ClearChildren();
 if(ActiveFilter==TEXT("materials"))
 {
  int32 MatIdx=0;
  for(const auto& Entry:FStarfortCraftingMaterialCatalog::All())
  {
   const FString Id(Entry.Id);
   const FString CountLabel=bMaterialsVerified?
    FString::Printf(TEXT("×%d · sunucu"),RealMaterials.Counts.FindRef(Id)):
    TEXT("Henüz aktifleştirilmedi");
   UStarfortBagTile* Tile=MakeTile(TEXT("material:")+Id,Entry.Name,
    CountLabel,FStarfortBagCatalog::RarityColor(Entry.Rarity),true,
    SelectedMaterialId==Id);
   if(Tile)ItemGrid->AddChildToUniformGrid(Tile,MatIdx/3,MatIdx%3)
     ->SetPadding(FMargin(3.f,5.f));
   ++MatIdx;
  }
  DetailColumn->ClearChildren();
  const FStarfortCraftingMaterialInfo* Selected=
   FStarfortCraftingMaterialCatalog::Find(SelectedMaterialId);
  if(Selected)
  {
   AddTitle(DetailColumn,Selected->Name,21,Gold());
   AddTitle(DetailColumn,FString(TEXT("Şekli: "))+Selected->Shape,
    14,Ink());
   AddTitle(DetailColumn,FString(TEXT("Kazanım: "))+Selected->Source,
    14,Ink());
   AddTitle(DetailColumn,bMaterialsVerified?
     FString::Printf(TEXT("Gerçek çanta: ×%d"),
      RealMaterials.Counts.FindRef(SelectedMaterialId)):
     TEXT("Sunucudan doğrulanmış parça adedi yok"),16,Gold());
  }
  AddTitle(DetailColumn,MaterialsStatus,13,Ink());
  AddTitle(DetailColumn,TEXT("Günlük parça hedefi"),17,Gold());
  for(const TCHAR* FocusId:{TEXT("weapon"),TEXT("armor"),TEXT("relic")})
  {
   const FString Id(FocusId);
   const FString Label=Id==TEXT("weapon")?TEXT("Silah · Yıldız Kesiti"):
    Id==TEXT("armor")?TEXT("Zırh · Hisar Perçini"):
     TEXT("Tılsım · Astral Lif");
   UStarfortBagTile* Tile=MakeTile(TEXT("focus:")+Id,Label,
    Id==RealMaterials.FocusSlot?TEXT("Seçili günlük hedef"):
     TEXT("Sonraki doğrulanmış hikâye galibiyeti"),
    Gold(),bMaterialsVerified && !bMaterialFocusPending,
    bMaterialsVerified && Id==RealMaterials.FocusSlot);
   if(Tile)DetailColumn->AddChildToVerticalBox(Tile)
    ->SetPadding(FMargin(2.f,4.f));
  }
  return; // Material fragments cannot be equipped or sold as owned gear.
 }
 int32 VisibleIndex=0;
 for(const FStarfortBagItemInfo& Entry:FStarfortBagCatalog::All())
 {
  const FString Id(Entry.Id);
  if(ActiveFilter!=TEXT("all") &&
     !(ActiveFilter==Entry.Slot ||
       (ActiveFilter==TEXT("owned")&&Verified.Inventory.FindRef(Id)>0) ||
       (ActiveFilter==TEXT("set")&&FString(Entry.SetId).Len()>0))) continue;
  const int32 Qty=bHasVerifiedInventory?Verified.Inventory.FindRef(Id):0;
  const FString CountLabel=Qty>0?TEXT("×")+FString::FromInt(Qty):
   TEXT("Kilitli · Üret / Sefer");
  UStarfortBagTile* Tile=MakeTile(TEXT("item:")+Id,
   Entry.Label,CountLabel,FStarfortBagCatalog::RarityColor(Entry.Rarity),
   true,SelectedItemId==Id);
  if(Tile)
   ItemGrid->AddChildToUniformGrid(Tile,VisibleIndex/4,VisibleIndex%4)
    ->SetPadding(FMargin(3.f,3.f));
  ++VisibleIndex;
 }
 DetailColumn->ClearChildren();
 const FStarfortBagItemInfo* Info=FStarfortBagCatalog::Find(SelectedItemId);
 if(!Info)return;
 AddTitle(DetailColumn,Info->Label,22,
  FStarfortBagCatalog::RarityColor(Info->Rarity));
 AddTitle(DetailColumn,
  FString(Info->Rarity)==TEXT("legendary")?TEXT("✦ Efsanevi") :
  FString(Info->Rarity)==TEXT("epic")?TEXT("✧ Destansı") :
   TEXT("Nadir"),
  16,FStarfortBagCatalog::RarityColor(Info->Rarity));
 AddTitle(DetailColumn,FStarfortBagCatalog::SlotLabel(Info->Slot)+
  TEXT("  ·  ")+Info->Description,15,Ink());
 const FString ItemId(Info->Id);
 const int32 Qty=Verified.Inventory.FindRef(ItemId);
 const int32 Mastery=Verified.ItemUpgrades.FindRef(ItemId);
 AddTitle(DetailColumn,
  FString::Printf(TEXT("⚔ Saldırı +%d\n♡ Can +%d\n⛨ Zırh +%d\n✦ Şifa +%d"),
   Info->Attack,Info->Health,Info->Armor,Info->Healing),16,Gold());
 if(FString(Info->SetId).Len()>0)
 {
  int32 SetCount=0;
  for(const TCHAR* SlotId:{TEXT("weapon"),TEXT("armor"),TEXT("relic")})
  {
   const FStarfortBagItemInfo* Worn=FStarfortBagCatalog::Find(
    CurrentlyWorn(SlotId));
   if(Worn && FString(Worn->SetId)==Info->SetId)++SetCount;
  }
  AddTitle(DetailColumn,
   FString::Printf(TEXT("✦ Set bonusu: %d / 2"),SetCount),16,Gold());
 }
 AddTitle(DetailColumn,
  FString::Printf(TEXT("Çantada: %d · Boşta: %d\nUstalık: +%d / 5"),
   Qty,FMath::Max(0,Qty-UsedCopies(ItemId)),Mastery),14,Ink());
 // Only game-verified acquisition paths and actual current live prices.
 AddTitle(DetailColumn,
  TEXT("Elde Edilme: ")+FStarfortGearEconomy::CurrentAcquisition(ItemId),
  14,Ink());
 const bool bCanMutate=bHasVerifiedInventory && !Verified.bInMission &&
  Verified.HeroLevels.Contains(SelectedHeroId) && !bMutationPending;
 const bool bWorn=CurrentlyWorn(Info->Slot)==ItemId;
 const bool bFree=Qty>UsedCopies(ItemId) || bWorn;
 const FString PrimaryAction=bWorn?
  TEXT("unequip:")+FString(Info->Slot):TEXT("equip:")+ItemId;
 UStarfortBagTile* Primary=MakeTile(PrimaryAction,
  bWorn?TEXT("Çıkar"):TEXT("Kuşan"),
  bWorn?TEXT("Sunucudan çıkar"):TEXT("Sunucudan kuşan"),
  Gold(),bCanMutate && bFree);
 if(Primary)DetailColumn->AddChildToVerticalBox(Primary)
  ->SetPadding(FMargin(3.f,7.f));
 if(Info->ForgeLevel>0)
 {
  const FStarfortGearResourceCost Recipe=
   FStarfortGearEconomy::CurrentForgeCost(ItemId);
  const bool bCanAfford=Recipe.bAvailable &&
   Verified.Gold>=Recipe.Gold &&
   Verified.Wood>=Recipe.Wood &&
   Verified.Stone>=Recipe.Stone &&
   Verified.StarEssence>=Recipe.Essence;
  const bool bCanForge=bCanMutate && Verified.ForgeLevel>=Info->ForgeLevel
   && Qty<20 && bCanAfford;
  UStarfortBagTile* Forge=MakeTile(TEXT("forge:")+ItemId,
   TEXT("Üret"),
   FString::Printf(TEXT("Demirhane %d · "),Info->ForgeLevel)+
    Recipe.ToTurkishLabel(),
   Gold(),bCanForge);
  if(Forge)DetailColumn->AddChildToVerticalBox(Forge)
   ->SetPadding(FMargin(3.f,6.f));
 }
 if(Qty>0)
 {
  const FStarfortGearResourceCost NextCost=
   FStarfortGearEconomy::NextMasteryCost(ItemId,Mastery);
  const bool bMasteryAfford=NextCost.bAvailable &&
   Verified.Gold>=NextCost.Gold &&
   Verified.Stone>=NextCost.Stone &&
   Verified.StarEssence>=NextCost.Essence;
  UStarfortBagTile* Upgrade=MakeTile(TEXT("enhance:")+ItemId,
   FString::Printf(TEXT("Geliştir · Ustalık +%d"),FMath::Min(5,Mastery+1)),
   NextCost.bAvailable?NextCost.ToTurkishLabel():
    TEXT("Ustalık +5 tamamlandı"),
   Gold(),bCanMutate && Mastery<5 && bMasteryAfford);
  if(Upgrade)DetailColumn->AddChildToVerticalBox(Upgrade)
   ->SetPadding(FMargin(3.f,6.f));
 }
 int32 WeeksRequired=0;
 FStarfortGearResourceCost StarCost;
 const int32 StarRank=Verified.RelicAscensions.FindRef(ItemId);
 if(FStarfortGearEconomy::CurrentAscension(
     ItemId,StarRank+1,WeeksRequired,StarCost))
 {
  const bool bCanAscend=bCanMutate && Mastery>=5 &&
   Verified.bAscensionVerified &&
   Verified.BossSeals>=WeeksRequired &&
   Verified.Gold>=StarCost.Gold &&
   Verified.Stone>=StarCost.Stone &&
   Verified.StarEssence>=StarCost.Essence;
  UStarfortBagTile* Star=MakeTile(TEXT("ascend:")+ItemId,
   FString::Printf(TEXT("Yıldız İşleme %d/4"),StarRank+1),
   FString::Printf(TEXT("%d farklı hafta patronu · "),WeeksRequired)+
    StarCost.ToTurkishLabel(),
   Gold(),bCanAscend);
  if(Star)DetailColumn->AddChildToVerticalBox(Star)
   ->SetPadding(FMargin(3.f,7.f));
 }
 if(Verified.bInMission)
  AddTitle(DetailColumn,TEXT("Savaş sürerken ekipman değişmez."),
   14,FLinearColor(.92f,.49f,.42f,1.f));
}

void UStarfortBagScreen::HandleTile(const FString& Token)
{
 if(Token.StartsWith(TEXT("nav:")))
 {
  const FString Dest=Token.RightChop(4);
  if(Dest==TEXT("heroes"))OnBackRequested.Broadcast();
  else if(Dest!=TEXT("bag") && Dest!=TEXT("store"))
   OnNavigationRequested.Broadcast(Dest);
  return;
 }
 if(Token.StartsWith(TEXT("filter:")))
 {
  const FString F=Token.RightChop(7);
  if(F==TEXT("all")||F==TEXT("weapon")||F==TEXT("armor")||
     F==TEXT("relic")||F==TEXT("set")||F==TEXT("owned")||
     F==TEXT("materials"))
  {ActiveFilter=F;Refresh();}
  return;
 }
 if(Token.StartsWith(TEXT("material:")))
 {
  const FString Id=Token.RightChop(9);
  if(FStarfortCraftingMaterialCatalog::Find(Id))
  {
   SelectedMaterialId=Id;
   ActiveFilter=TEXT("materials");
   Refresh();
  }
  return;
 }
 if(Token.StartsWith(TEXT("focus:")))
 {
  const FString Id=Token.RightChop(6);
  if(!bMaterialsVerified || bMaterialFocusPending ||
     !FStarfortCraftingMaterialCatalog::IsFocus(Id))return;
  if(Id==RealMaterials.FocusSlot)return;
  bMaterialFocusPending=true;
  MaterialsStatus=TEXT("Hedef sunucu tarafından kaydediliyor…");
  Refresh();
  OnMaterialFocusRequested.Broadcast(Id);
  return;
 }
 if(Token.StartsWith(TEXT("hero:")))
 {
  const FString Id=Token.RightChop(5);
  if(bHasVerifiedInventory && Verified.HeroLevels.Contains(Id) &&
     FStarfortBagCatalog::IsHero(Id))
  {SelectedHeroId=Id;Refresh();}
  return;
 }
 if(Token.StartsWith(TEXT("item:")))
 {
  const FString Id=Token.RightChop(5);
  if(FStarfortBagCatalog::Find(Id)){SelectedItemId=Id;Refresh();}
  return;
 }
 if(Token.StartsWith(TEXT("slot:")))
 {
  const FString Slot=Token.RightChop(5);
  const FString Worn=CurrentlyWorn(Slot);
  if(!Worn.IsEmpty() && FStarfortBagCatalog::Find(Worn))
  {SelectedItemId=Worn;Refresh();}
  return;
 }
 if(!bHasVerifiedInventory || bMutationPending || Verified.bInMission ||
    !Verified.HeroLevels.Contains(SelectedHeroId)) return;
 FString Action,Target,Aux;
 if(Token.StartsWith(TEXT("equip:")))
 {
  const FString Id=Token.RightChop(6);
  const FStarfortBagItemInfo* Item=FStarfortBagCatalog::Find(Id);
  if(!Item || (Verified.Inventory.FindRef(Id)<=UsedCopies(Id) &&
      CurrentlyWorn(Item->Slot)!=Id)) return;
  Action=TEXT("equip");Target=SelectedHeroId;Aux=Id;
 }
 else if(Token.StartsWith(TEXT("unequip:")))
 {
  const FString Slot=Token.RightChop(8);
  if(!FStarfortBagCatalog::IsSlot(Slot) ||
     CurrentlyWorn(Slot).IsEmpty()) return;
  Action=TEXT("unequip");Target=SelectedHeroId;Aux=Slot;
 }
 else if(Token.StartsWith(TEXT("forge:")))
 {
  const FString Id=Token.RightChop(6);
  const FStarfortBagItemInfo* Item=FStarfortBagCatalog::Find(Id);
  if(!Item || Item->ForgeLevel<=0 ||
     Verified.ForgeLevel<Item->ForgeLevel ||
     Verified.Inventory.FindRef(Id)>=20) return;
  Action=TEXT("forge");Target=Id;
 }
 else if(Token.StartsWith(TEXT("enhance:")))
 {
  const FString Id=Token.RightChop(8);
  const FStarfortGearResourceCost Cost=
   FStarfortGearEconomy::NextMasteryCost(
    Id,Verified.ItemUpgrades.FindRef(Id));
  if(!Cost.bAvailable || Verified.Inventory.FindRef(Id)<=0 ||
     Verified.Gold<Cost.Gold || Verified.Stone<Cost.Stone ||
     Verified.StarEssence<Cost.Essence) return;
  Action=TEXT("enhance");Target=Id;
 }
 else if(Token.StartsWith(TEXT("ascend:")))
 {
  const FString Id=Token.RightChop(7);
  const int32 Rank=Verified.RelicAscensions.FindRef(Id)+1;
  int32 Weeks=0;
  FStarfortGearResourceCost Cost;
  if(!Verified.bAscensionVerified ||
     !FStarfortGearEconomy::CurrentAscension(Id,Rank,Weeks,Cost) ||
     Verified.Inventory.FindRef(Id)<=0 ||
     Verified.ItemUpgrades.FindRef(Id)<5 ||
     Verified.BossSeals<Weeks ||
     Verified.Gold<Cost.Gold || Verified.Stone<Cost.Stone ||
     Verified.StarEssence<Cost.Essence) return;
  Action=TEXT("ascend");Target=Id;
 }
 else return;
 bMutationPending=true; // NEVER optimistically equip/spend resources.
 if(TxtStatus)TxtStatus->SetText(FText::FromString(
  TEXT("Ekipman işlemi sunucuda doğrulanıyor…")));
 Refresh();
 OnMutationRequested.Broadcast(Action,Target,Aux);
}
