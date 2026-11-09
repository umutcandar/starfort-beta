#include "StarfortBagTile.h"
#include "Blueprint/WidgetTree.h"
#include "Components/Button.h"
#include "Components/Border.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"

void UStarfortBagTile::BuildTile(
 const FString& NewAction,const FString& Caption,const FString& Subtext,
 const FLinearColor& FrameColor,bool bEnabled,bool bSelected)
{
 ActionToken=NewAction;
 if(!WidgetTree || WidgetTree->RootWidget) return;
 ClickTarget=WidgetTree->ConstructWidget<UButton>();
 ClickTarget->SetBackgroundColor(
  bSelected?FrameColor:FLinearColor(.045f,.095f,.18f,1.f));
 ClickTarget->SetIsEnabled(bEnabled);
 ClickTarget->OnClicked.AddUniqueDynamic(this,&UStarfortBagTile::TileClicked);
 Frame=WidgetTree->ConstructWidget<UBorder>();
 Frame->SetPadding(FMargin(7.f,7.f));
 Frame->SetBrushColor(bSelected?FLinearColor(.21f,.16f,.08f,.97f)
                                 :FLinearColor(.025f,.044f,.095f,.97f));
 ClickTarget->AddChild(Frame);
 UVerticalBox* Column=WidgetTree->ConstructWidget<UVerticalBox>();
 Frame->SetContent(Column);
 CaptionText=WidgetTree->ConstructWidget<UTextBlock>();
 CaptionText->SetText(FText::FromString(Caption));
 CaptionText->SetColorAndOpacity(FSlateColor(
  bEnabled?FrameColor:FLinearColor(.5f,.54f,.61f,1.f)));
 FSlateFontInfo Font=CaptionText->GetFont();
 Font.Size=16;
 CaptionText->SetFont(Font);
 Column->AddChildToVerticalBox(CaptionText);
 SubText=WidgetTree->ConstructWidget<UTextBlock>();
 SubText->SetText(FText::FromString(Subtext));
 SubText->SetColorAndOpacity(FSlateColor(
  bEnabled?FLinearColor(.82f,.86f,.9f,1.f):
    FLinearColor(.48f,.52f,.59f,1.f)));
 FSlateFontInfo SmallFont=SubText->GetFont();
 SmallFont.Size=12;
 SubText->SetFont(SmallFont);
 Column->AddChildToVerticalBox(SubText)->SetPadding(FMargin(0.f,5.f,0.f,0.f));
 WidgetTree->RootWidget=ClickTarget;
}
void UStarfortBagTile::TileClicked()
{
 if(!ActionToken.IsEmpty()) OnActivated.Broadcast(ActionToken);
}
