#include "StarfortNativeWidgetFactory.h"
#include "StarfortLoginScreen.h"
#include "StarfortVillageScreen.h"
#include "StarfortCampaignScreen.h"
#include "StarfortBattleScreen.h"
#include "StarfortHeroScreen.h"
#include "StarfortVisualTheme.h"

#include "Blueprint/WidgetTree.h"
#include "Blueprint/UserWidget.h"
#include "Components/Border.h"
#include "Components/Button.h"
#include "Components/EditableTextBox.h"
#include "Components/HorizontalBox.h"
#include "Components/Image.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/Overlay.h"
#include "Components/OverlaySlot.h"
#include "Components/ProgressBar.h"
#include "Components/SafeZone.h"
#include "Components/ScaleBox.h"
#include "Components/SizeBox.h"
#include "Components/Spacer.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"

namespace NativeUI
{
static UWidgetTree* GetTree(UUserWidget* Screen)
{
 return Screen && Screen->WidgetTree && !Screen->WidgetTree->RootWidget
  ? Screen->WidgetTree : nullptr;
}

static UTextBlock* MakeText(UWidgetTree* Tree,const FString& Value,int32 Size,
 FLinearColor Ink)
{
 UTextBlock* Text=Tree->ConstructWidget<UTextBlock>();
 Text->SetText(FText::FromString(Value));
 FSlateFontInfo Font=Text->GetFont();
 Font.Size=Size;
 Text->SetFont(Font);
 Text->SetColorAndOpacity(FSlateColor(Ink));
 return Text;
}
static void AddTextLine(UWidgetTree* Tree,UVerticalBox* Column,
 const FString& Value,int32 Size,FLinearColor Color)
{
 UVerticalBoxSlot* Slot=Column->AddChildToVerticalBox(
  MakeText(Tree,Value,Size,Color));
 Slot->SetPadding(FMargin(0.f,5.f));
}

static UVerticalBox* BeginPanel(UUserWidget* Screen,float Width,float Height)
{
 UWidgetTree* Tree=GetTree(Screen);
 if (!Tree) return nullptr;

 UBorder* Root=Tree->ConstructWidget<UBorder>();
 Root->SetBrushColor(UStarfortVisualTheme::DeepNavy());
 Root->SetVisibility(ESlateVisibility::SelfHitTestInvisible);
 Root->SetPadding(FMargin(8.f));

 USafeZone* Safe=Tree->ConstructWidget<USafeZone>();
 Root->SetContent(Safe);
 UOverlay* Overlay=Tree->ConstructWidget<UOverlay>();
 Safe->SetContent(Overlay);

 USizeBox* Size=Tree->ConstructWidget<USizeBox>();
 Size->SetWidthOverride(Width);
 Size->SetHeightOverride(Height);
 UBorder* Panel=Tree->ConstructWidget<UBorder>();
 Panel->SetBrushColor(UStarfortVisualTheme::PanelNavy());
 Panel->SetPadding(FMargin(22.f));
 Size->SetContent(Panel);
 // Scale-to-fit is a functional early mobile fallback; the final authored
 // HUD uses device-specific responsive zones and 48dp touch targets.
 UScaleBox* Fit=Tree->ConstructWidget<UScaleBox>();
 Fit->SetStretch(EStretch::ScaleToFit);
 Fit->SetContent(Size);
 UOverlaySlot* Slot=Overlay->AddChildToOverlay(Fit);
 Slot->SetHorizontalAlignment(HAlign_Fill);
 Slot->SetVerticalAlignment(VAlign_Fill);

 UVerticalBox* Column=Tree->ConstructWidget<UVerticalBox>();
 Panel->SetContent(Column);
 Tree->RootWidget=Root;
 return Column;
}

static UTextBlock* NamedValue(UWidgetTree* Tree,UHorizontalBox* Row,
 const FString& Label,FLinearColor Color)
{
 UTextBlock* Caption=MakeText(Tree,Label+TEXT("  "),16,
  UStarfortVisualTheme::Gold());
 UHorizontalBoxSlot* CSlot=Row->AddChildToHorizontalBox(Caption);
 CSlot->SetPadding(FMargin(5.f,4.f,0.f,4.f));
 UTextBlock* Value=MakeText(Tree,TEXT("—"),18,Color);
 UHorizontalBoxSlot* VSlot=Row->AddChildToHorizontalBox(Value);
 VSlot->SetPadding(FMargin(0.f,4.f,14.f,4.f));
 return Value;
}
static UHorizontalBox* Row(UWidgetTree* Tree,UVerticalBox* Parent)
{
 UHorizontalBox* Result=Tree->ConstructWidget<UHorizontalBox>();
 Parent->AddChildToVerticalBox(Result)->SetPadding(FMargin(0.f,8.f));
 return Result;
}
static UButton* MakeButton(UWidgetTree* Tree,const FString& Label)
{
 UButton* Btn=Tree->ConstructWidget<UButton>();
 Btn->SetBackgroundColor(UStarfortVisualTheme::Gold());
 UTextBlock* Caption=MakeText(Tree,Label,18,
  UStarfortVisualTheme::DeepNavy());
 Btn->AddChild(Caption);
 Btn->SetIsEnabled(true);
 return Btn;
}
static void ButtonRow(UWidgetTree* Tree,UHorizontalBox* Row,
 UButton*& OutButton,const FString& Label)
{
 OutButton=MakeButton(Tree,Label);
 UHorizontalBoxSlot* Slot=Row->AddChildToHorizontalBox(OutButton);
 Slot->SetPadding(FMargin(4.f,4.f));
}
static void ButtonColumn(UWidgetTree* Tree,UVerticalBox* Parent,
 UButton*& OutButton,const FString& Label)
{
 OutButton=MakeButton(Tree,Label);
 Parent->AddChildToVerticalBox(OutButton)->SetPadding(FMargin(2.f,8.f));
}
static UProgressBar* Bar(UWidgetTree* Tree,UVerticalBox* Parent,
 FLinearColor Color)
{
 UProgressBar* Result=Tree->ConstructWidget<UProgressBar>();
 Result->SetFillColorAndOpacity(Color);
 Result->SetPercent(0.f);
 Parent->AddChildToVerticalBox(Result)->SetPadding(FMargin(2.f,9.f));
 return Result;
}

static bool BeginBattleOverlay(UUserWidget* Screen,
 UVerticalBox*& Top,UVerticalBox*& Bottom)
{
 UWidgetTree* Tree=GetTree(Screen);
 if(!Tree) return false;

 // A native, transparent-center HUD: REAL Unreal scene is visible in the
 // middle instead of being covered by the previous opaque 920x650 panel.
 USafeZone* Safe=Tree->ConstructWidget<USafeZone>();
 Safe->SetVisibility(ESlateVisibility::SelfHitTestInvisible);
 UVerticalBox* Shell=Tree->ConstructWidget<UVerticalBox>();
 Safe->SetContent(Shell);

 UBorder* TopBorder=Tree->ConstructWidget<UBorder>();
 TopBorder->SetBrushColor(UStarfortVisualTheme::PanelNavy());
 TopBorder->SetPadding(FMargin(12.f,6.f));
 Top=Tree->ConstructWidget<UVerticalBox>();
 TopBorder->SetContent(Top);
 Shell->AddChildToVerticalBox(TopBorder)->SetPadding(FMargin(10.f,5.f));

 USpacer* WorldWindow=Tree->ConstructWidget<USpacer>();
 UVerticalBoxSlot* WorldSlot=Shell->AddChildToVerticalBox(WorldWindow);
 WorldSlot->SetSize(FSlateChildSize(ESlateSizeRule::Fill));

 UBorder* FooterBorder=Tree->ConstructWidget<UBorder>();
 FooterBorder->SetBrushColor(UStarfortVisualTheme::PanelNavy());
 FooterBorder->SetPadding(FMargin(12.f,6.f));
 Bottom=Tree->ConstructWidget<UVerticalBox>();
 FooterBorder->SetContent(Bottom);
 Shell->AddChildToVerticalBox(FooterBorder)->SetPadding(FMargin(10.f,5.f));

 Tree->RootWidget=Safe;
 return true;
}
}

bool FStarfortNativeWidgetFactory::BuildLogin(UStarfortLoginScreen* Screen)
{
 UWidgetTree* Tree=NativeUI::GetTree(Screen);
 if(!Tree) return false; // Art-authored widget takes precedence.
 UVerticalBox* Column=NativeUI::BeginPanel(Screen,560.f,410.f);
 if (!Column) return false;
 NativeUI::AddTextLine(Tree,Column,TEXT("STARFORT"),40,
  UStarfortVisualTheme::Gold());
 NativeUI::AddTextLine(Tree,Column,
  TEXT("KRALLIĞINA GİRİŞ YAP"),20,FLinearColor::White);
 NativeUI::AddTextLine(Tree,Column,
  TEXT("Unreal Engine · iOS / Android · gerçek hesap"),15,
  UStarfortVisualTheme::EnergyBlue());

 Screen->InputEmail=Tree->ConstructWidget<UEditableTextBox>();
 Screen->InputEmail->SetHintText(FText::FromString(TEXT("E-posta adresin")));
 Column->AddChildToVerticalBox(Screen->InputEmail)->SetPadding(FMargin(2.f,12.f));

 Screen->InputPassword=Tree->ConstructWidget<UEditableTextBox>();
 Screen->InputPassword->SetHintText(FText::FromString(TEXT("Şifre")));
 Screen->InputPassword->SetIsPassword(true);
 Column->AddChildToVerticalBox(Screen->InputPassword)->SetPadding(FMargin(2.f,10.f));

 NativeUI::ButtonColumn(Tree,Column,Screen->BtnSignIn,TEXT("HESABIMA GİR"));
 Screen->TxtAuthStatus=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtAuthStatus->SetColorAndOpacity(
  FSlateColor(FLinearColor::White));
 Column->AddChildToVerticalBox(Screen->TxtAuthStatus)->SetPadding(FMargin(2.f,12.f));
 NativeUI::AddTextLine(Tree,Column,
  TEXT("Misafir modu yok · ilerleme sunucuda korunur"),13,
  FLinearColor(0.70f,0.74f,0.80f,1.f));
 return true;
}

bool FStarfortNativeWidgetFactory::BuildVillage(UStarfortVillageScreen* Screen)
{
 UWidgetTree* Tree=NativeUI::GetTree(Screen);
 if (!Tree) return false;
 UVerticalBox* Column=NativeUI::BeginPanel(Screen,880.f,520.f);
 if (!Column) return false;
 NativeUI::AddTextLine(Tree,Column,TEXT("STARFORT  ·  KRALLIĞIM"),31,
  UStarfortVisualTheme::Gold());

 Screen->TxtVillageName=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtVillageName->SetColorAndOpacity(FSlateColor(FLinearColor::White));
 Column->AddChildToVerticalBox(Screen->TxtVillageName)->SetPadding(FMargin(3.f,6.f));

 UHorizontalBox* Resources=NativeUI::Row(Tree,Column);
 Screen->TxtGold=NativeUI::NamedValue(Tree,Resources,TEXT("ALTIN"),
  FLinearColor::White);
 Screen->TxtWood=NativeUI::NamedValue(Tree,Resources,TEXT("ODUN"),
  FLinearColor::White);
 Screen->TxtStone=NativeUI::NamedValue(Tree,Resources,TEXT("TAŞ"),
  FLinearColor::White);
 Screen->TxtStarEssence=NativeUI::NamedValue(Tree,Resources,TEXT("ÖZ"),
  UStarfortVisualTheme::EnergyBlue());

 NativeUI::AddTextLine(Tree,Column,
  TEXT("3D KALE SAHNESİ"),24,UStarfortVisualTheme::Gold());
 NativeUI::AddTextLine(Tree,Column,
  TEXT("Onaylı yüksek kaliteli kale modelleri henüz eklenmedi."),17,
  FLinearColor(0.76f,0.79f,0.87f,1.f));
 NativeUI::AddTextLine(Tree,Column,
  TEXT("Bu sürüm, gerçek hesap ve menü işlevlerini test etmek içindir."),15,
  FLinearColor(0.76f,0.79f,0.87f,1.f));

 UHorizontalBox* BuildInfo=NativeUI::Row(Tree,Column);
 Screen->TxtBuildingName=NativeUI::NamedValue(Tree,BuildInfo,
  TEXT("BİNA"),FLinearColor::White);
 Screen->TxtBuildingLevel=NativeUI::NamedValue(Tree,BuildInfo,
  TEXT("SEVİYE"),FLinearColor::White);

 UHorizontalBox* Upgrades=NativeUI::Row(Tree,Column);
 NativeUI::ButtonRow(Tree,Upgrades,Screen->BtnUpgrade,TEXT("BİNAYI GELİŞTİR"));
 UHorizontalBox* Nav=NativeUI::Row(Tree,Column);
 NativeUI::ButtonRow(Tree,Nav,Screen->BtnHeroes,TEXT("KAHRAMANLAR"));
 NativeUI::ButtonRow(Tree,Nav,Screen->BtnBattles,TEXT("SEFERLER"));
 NativeUI::ButtonRow(Tree,Nav,Screen->BtnAlliance,TEXT("İTTİFAK"));
 UHorizontalBox* AccountActions=NativeUI::Row(Tree,Column);
 NativeUI::ButtonRow(Tree,AccountActions,Screen->BtnRefresh,TEXT("KÖYÜ YENİLE"));
 NativeUI::ButtonRow(Tree,AccountActions,Screen->BtnSignOut,TEXT("ÇIKIŞ YAP"));
 Screen->TxtConnectionStatus=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtConnectionStatus->SetColorAndOpacity(
  FSlateColor(UStarfortVisualTheme::EnergyBlue()));
 Column->AddChildToVerticalBox(Screen->TxtConnectionStatus)->SetPadding(FMargin(2.f,14.f));
 return true;
}

bool FStarfortNativeWidgetFactory::BuildCampaign(UStarfortCampaignScreen* Screen)
{
 UWidgetTree* Tree=NativeUI::GetTree(Screen);
 if(!Tree) return false;
 UVerticalBox* Column=NativeUI::BeginPanel(Screen,820.f,520.f);
 if(!Column) return false;
 NativeUI::AddTextLine(Tree,Column,TEXT("STARFORT  ·  SEFER HARİTASI"),
  29,UStarfortVisualTheme::Gold());

 Screen->TxtStarTotal=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtStarTotal->SetColorAndOpacity(
  FSlateColor(UStarfortVisualTheme::EnergyBlue()));
 Column->AddChildToVerticalBox(Screen->TxtStarTotal)->SetPadding(FMargin(5.f,4.f));

 UHorizontalBox* First=NativeUI::Row(Tree,Column);
 NativeUI::ButtonRow(Tree,First,Screen->BtnStage1,TEXT("I"));
 NativeUI::ButtonRow(Tree,First,Screen->BtnStage2,TEXT("II"));
 NativeUI::ButtonRow(Tree,First,Screen->BtnStage3,TEXT("III"));
 NativeUI::ButtonRow(Tree,First,Screen->BtnStage4,TEXT("IV"));
 UHorizontalBox* Second=NativeUI::Row(Tree,Column);
 NativeUI::ButtonRow(Tree,Second,Screen->BtnStage5,TEXT("V"));
 NativeUI::ButtonRow(Tree,Second,Screen->BtnStage6,TEXT("VI"));
 NativeUI::ButtonRow(Tree,Second,Screen->BtnStage7,TEXT("VII"));
 NativeUI::ButtonRow(Tree,Second,Screen->BtnStage8,TEXT("VIII"));

 Screen->TxtResult=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtResult->SetColorAndOpacity(FSlateColor(UStarfortVisualTheme::Gold()));
 Column->AddChildToVerticalBox(Screen->TxtResult)->SetPadding(FMargin(4.f,15.f));
 Screen->TxtStatus=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtStatus->SetColorAndOpacity(FSlateColor(FLinearColor::White));
 Column->AddChildToVerticalBox(Screen->TxtStatus)->SetPadding(FMargin(4.f,10.f));
 return true;
}

bool FStarfortNativeWidgetFactory::BuildBattle(UStarfortBattleScreen* Screen)
{
 UWidgetTree* Tree=NativeUI::GetTree(Screen);
 if(!Tree) return false;
 UVerticalBox* Top=nullptr;
 UVerticalBox* Bottom=nullptr;
 if(!NativeUI::BeginBattleOverlay(Screen,Top,Bottom)) return false;

 UHorizontalBox* Header=NativeUI::Row(Tree,Top);
 Screen->TxtWave=NativeUI::NamedValue(Tree,Header,TEXT("DALGA"),
  UStarfortVisualTheme::Gold());
 Screen->TxtTurn=NativeUI::NamedValue(Tree,Header,TEXT("TUR"),
  UStarfortVisualTheme::EnergyBlue());
 Screen->TxtVerifiedDamage=NativeUI::NamedValue(Tree,Header,TEXT("HASAR"),
  FLinearColor::White);
 Screen->TxtEnemyIntent=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtEnemyIntent->SetColorAndOpacity(
  FSlateColor(UStarfortVisualTheme::Crimson()));
 Top->AddChildToVerticalBox(Screen->TxtEnemyIntent)->SetPadding(FMargin(4.f,3.f));
 UHorizontalBox* Health=NativeUI::Row(Tree,Top);
 Screen->TxtHeroHP=NativeUI::NamedValue(Tree,Health,TEXT("KAHRAMAN"),
  FLinearColor::White);
 Screen->TxtEnemyHP=NativeUI::NamedValue(Tree,Health,TEXT("DÜŞMAN"),
  FLinearColor::White);
 Screen->ProgressHeroHP=NativeUI::Bar(Tree,Top,
  UStarfortVisualTheme::EnergyBlue());
 Screen->ProgressEnemyHP=NativeUI::Bar(Tree,Top,
  UStarfortVisualTheme::Crimson());

 NativeUI::AddTextLine(Tree,Bottom,
  TEXT("TAKTİK KOMUTLAR · Düşman niyetine göre karar ver"),16,
  UStarfortVisualTheme::Gold());
 UHorizontalBox* Actions=NativeUI::Row(Tree,Bottom);
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnStrike,TEXT("SALDIRI"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnGuard,TEXT("SAVUNMA"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnFeint,TEXT("ALDATMA"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnRally,TEXT("TOPARLANMA"));

 NativeUI::AddTextLine(Tree,Bottom,
  TEXT("ÜÇ KAHRAMAN · HER BİRİNİN ÖZEL YETENEĞİ"),16,
  UStarfortVisualTheme::Gold());
 UHorizontalBox* Skills=NativeUI::Row(Tree,Bottom);
 NativeUI::ButtonRow(Tree,Skills,Screen->BtnHeroSkill,TEXT("1. YETENEK"));
 NativeUI::ButtonRow(Tree,Skills,Screen->BtnSkill2,TEXT("2. YETENEK"));
 NativeUI::ButtonRow(Tree,Skills,Screen->BtnSkill3,TEXT("3. YETENEK"));
 UHorizontalBox* Labels=NativeUI::Row(Tree,Bottom);
 Screen->TxtSkill1=NativeUI::NamedValue(Tree,Labels,TEXT("1"),
  FLinearColor::White);
 Screen->TxtSkill2=NativeUI::NamedValue(Tree,Labels,TEXT("2"),
  FLinearColor::White);
 Screen->TxtSkill3=NativeUI::NamedValue(Tree,Labels,TEXT("3"),
  FLinearColor::White);

 UHorizontalBox* Status=NativeUI::Row(Tree,Bottom);
 Screen->TxtCooldownHint=NativeUI::NamedValue(Tree,Status,TEXT("HAMLE"),
  UStarfortVisualTheme::EnergyBlue());
 Screen->TxtBattleStatus=NativeUI::NamedValue(Tree,Status,TEXT("SUNUCU"),
  FLinearColor::White);
 NativeUI::ButtonRow(Tree,Status,Screen->BtnRetry,TEXT("SUNUCUYU YENİLE"));
 NativeUI::AddTextLine(Tree,Bottom,
  TEXT("3D savaş ve efektler için onaylı yüksek kaliteli modeller gerekir."),
  12,FLinearColor(0.73f,0.77f,0.83f,1.f));
 return true;
}

bool FStarfortNativeWidgetFactory::BuildHero(UStarfortHeroScreen* Screen)
{
 UWidgetTree* Tree=NativeUI::GetTree(Screen);
 if(!Tree) return false; // A premium authored WBP takes precedence.
 UVerticalBox* Page=NativeUI::BeginPanel(Screen,1120.f,680.f);
 if(!Page) return false;
 NativeUI::AddTextLine(Tree,Page,TEXT("STARFORT · SİNEMATİK KAHRAMANLAR"),
  29,UStarfortVisualTheme::Gold());

 // Four visually distinct characters using their existing backend IDs.
 UHorizontalBox* Roster=NativeUI::Row(Tree,Page);
 NativeUI::ButtonRow(Tree,Roster,Screen->BtnSelectRovan,TEXT("ROVAN"));
 NativeUI::ButtonRow(Tree,Roster,Screen->BtnSelectAldren,TEXT("ALDREN"));
 NativeUI::ButtonRow(Tree,Roster,Screen->BtnSelectLyra,TEXT("LYRA"));
 NativeUI::ButtonRow(Tree,Roster,Screen->BtnSelectVesper,TEXT("VESPER"));

 UHorizontalBox* Body=Tree->ConstructWidget<UHorizontalBox>();
 Page->AddChildToVerticalBox(Body);

 // This is an actual imported Unreal UI texture, NOT a 3D character rig.
 UBorder* ArtFrame=Tree->ConstructWidget<UBorder>();
 ArtFrame->SetBrushColor(FLinearColor(0.035f,0.055f,0.09f,1.f));
 ArtFrame->SetPadding(FMargin(4.f));
 USizeBox* ArtBox=Tree->ConstructWidget<USizeBox>();
 ArtBox->SetWidthOverride(330.f);
 ArtBox->SetHeightOverride(390.f);
 UHorizontalBoxSlot* ArtSlot=Body->AddChildToHorizontalBox(ArtBox);
 ArtSlot->SetPadding(FMargin(0.f,4.f,18.f,4.f));
 ArtBox->SetContent(ArtFrame);
 UScaleBox* ArtScale=Tree->ConstructWidget<UScaleBox>();
 ArtScale->SetStretch(EStretch::ScaleToFit);
 ArtFrame->SetContent(ArtScale);
 Screen->ImgHeroSplash=Tree->ConstructWidget<UImage>();
 Screen->ImgHeroSplash->SetVisibility(ESlateVisibility::SelfHitTestInvisible);
 ArtScale->SetContent(Screen->ImgHeroSplash);

 UVerticalBox* Right=Tree->ConstructWidget<UVerticalBox>();
 UHorizontalBoxSlot* RightSlot=Body->AddChildToHorizontalBox(Right);
 RightSlot->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
 UHorizontalBox* Identity=NativeUI::Row(Tree,Right);
 USizeBox* PortraitSize=Tree->ConstructWidget<USizeBox>();
 PortraitSize->SetWidthOverride(82.f);
 PortraitSize->SetHeightOverride(82.f);
 UHorizontalBoxSlot* PortraitSlot=Identity->AddChildToHorizontalBox(PortraitSize);
 PortraitSlot->SetPadding(FMargin(0.f,0.f,16.f,0.f));
 Screen->ImgHeroPortrait=Tree->ConstructWidget<UImage>();
 PortraitSize->SetContent(Screen->ImgHeroPortrait);

 Screen->TxtHeroName=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtHeroName->SetColorAndOpacity(FSlateColor(UStarfortVisualTheme::Gold()));
 Identity->AddChildToHorizontalBox(Screen->TxtHeroName)->SetPadding(FMargin(0.f,16.f));

 UHorizontalBox* Stats=NativeUI::Row(Tree,Right);
 Screen->TxtLevel=NativeUI::NamedValue(Tree,Stats,TEXT("SEVİYE"),
  UStarfortVisualTheme::EnergyBlue());
 Screen->TxtRarity=NativeUI::NamedValue(Tree,Stats,TEXT("NADİRLİK"),
  FLinearColor::White);
 UHorizontalBox* Combat=NativeUI::Row(Tree,Right);
 Screen->TxtAttack=NativeUI::NamedValue(Tree,Combat,TEXT("SALDIRI"),
  FLinearColor::White);
 Screen->TxtDefense=NativeUI::NamedValue(Tree,Combat,TEXT("SAVUNMA"),
  FLinearColor::White);
 UHorizontalBox* More=NativeUI::Row(Tree,Right);
 Screen->TxtHealth=NativeUI::NamedValue(Tree,More,TEXT("CAN"),
  FLinearColor::White);
 Screen->TxtSpeed=NativeUI::NamedValue(Tree,More,TEXT("HIZ"),
  FLinearColor::White);
 Screen->TxtShardCount=NativeUI::NamedValue(Tree,NativeUI::Row(Tree,Right),
  TEXT("PARÇA"),FLinearColor::White);
 Screen->ProgressShards=NativeUI::Bar(Tree,Right,
  UStarfortVisualTheme::EnergyBlue());

 NativeUI::AddTextLine(Tree,Right,
  TEXT("ÖZEL YETENEK SANATI · Savaş gücü sunucudan doğrulanır"),
  14,UStarfortVisualTheme::Gold());
 UHorizontalBox* Skills=NativeUI::Row(Tree,Right);
 Screen->ImgSkill1=Tree->ConstructWidget<UImage>();
 Screen->ImgSkill2=Tree->ConstructWidget<UImage>();
 Screen->ImgSkill3=Tree->ConstructWidget<UImage>();
 Screen->ImgSkill4=Tree->ConstructWidget<UImage>();
 for(UImage* Image: {Screen->ImgSkill1.Get(),Screen->ImgSkill2.Get(),
                     Screen->ImgSkill3.Get(),Screen->ImgSkill4.Get()})
 {
  USizeBox* Box=Tree->ConstructWidget<USizeBox>();
  Box->SetWidthOverride(65.f);
  Box->SetHeightOverride(65.f);
  Box->SetContent(Image);
  Skills->AddChildToHorizontalBox(Box)->SetPadding(FMargin(0.f,0.f,12.f,0.f));
 }
 UHorizontalBox* Actions=NativeUI::Row(Tree,Right);
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnInspect,TEXT("İNCELE"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnFirePreview,TEXT("ÖNİZLE"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnUpgrade,TEXT("EĞİT"));
 NativeUI::ButtonRow(Tree,Actions,Screen->BtnBack,TEXT("GERİ"));

 Screen->TxtConnectionStatus=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtConnectionStatus->SetColorAndOpacity(FSlateColor(FLinearColor::White));
 Right->AddChildToVerticalBox(Screen->TxtConnectionStatus)->SetPadding(FMargin(2.f,7.f));
 Screen->TxtHeroArtStatus=Tree->ConstructWidget<UTextBlock>();
 Screen->TxtHeroArtStatus->SetColorAndOpacity(
  FSlateColor(FLinearColor(0.74f,0.8f,0.9f,1.f)));
 Right->AddChildToVerticalBox(Screen->TxtHeroArtStatus)->SetPadding(FMargin(2.f,4.f));
 return true;
}
