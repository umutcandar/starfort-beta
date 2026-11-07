#include "StarfortCampaignScreen.h"
#include "StarfortNativeWidgetFactory.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"

void UStarfortCampaignScreen::NativeOnInitialized()
{
 Super::NativeOnInitialized();
 FStarfortNativeWidgetFactory::BuildCampaign(this);
 StageButtons={BtnStage1,BtnStage2,BtnStage3,BtnStage4,
  BtnStage5,BtnStage6,BtnStage7,BtnStage8};
 if(BtnStage1) BtnStage1->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage1);
 if(BtnStage2) BtnStage2->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage2);
 if(BtnStage3) BtnStage3->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage3);
 if(BtnStage4) BtnStage4->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage4);
 if(BtnStage5) BtnStage5->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage5);
 if(BtnStage6) BtnStage6->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage6);
 if(BtnStage7) BtnStage7->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage7);
 if(BtnStage8) BtnStage8->OnClicked.AddUniqueDynamic(this,&UStarfortCampaignScreen::Stage8);
 SetWaitingForServer();
}
void UStarfortCampaignScreen::RefreshButtons()
{
 for(int32 Index=0;Index<StageButtons.Num();++Index)
  if(StageButtons[Index])
   StageButtons[Index]->SetIsEnabled(bVerified&&!bPending&&!bInMission&&
    Index+1<=HighestUnlocked);
}
void UStarfortCampaignScreen::SetWaitingForServer()
{
 bVerified=false; bPending=false; bInMission=false; HighestUnlocked=1;
 if(TxtStatus) TxtStatus->SetText(FText::FromString(TEXT("Hikâye sunucusu bekleniyor")));
 if(TxtStarTotal) TxtStarTotal->SetText(FText::FromString(TEXT("—")));
 if(TxtResult) TxtResult->SetText(FText::GetEmpty());
 RefreshButtons();
}
void UStarfortCampaignScreen::ApplyVerifiedProgress(const FStarfortProgressSummary& Progress)
{
 if(!Progress.bServerVerified || Progress.ClearedStages.Num()>8 ||
    Progress.StoryStars.Num()>8 || Progress.Team.Num()!=3)
 {
  SetWaitingForServer();
  return;
 }
 bVerified=true;
 bPending=false;
 bInMission=Progress.bInMission;
 HighestUnlocked=FMath::Min(8,Progress.ClearedStages.Num()+1);
 int32 TotalStars=0;
 for(const auto& Entry:Progress.StoryStars)
 {
  if(Entry.Key<1 || Entry.Key>8 || Entry.Value<1 || Entry.Value>3 ||
     !Progress.ClearedStages.Contains(Entry.Key)) { SetWaitingForServer(); return; }
  TotalStars+=Entry.Value;
 }
 if(TxtStarTotal)
  TxtStarTotal->SetText(FText::Format(FText::FromString(TEXT("{0} / 24 yıldız")),
   FText::AsNumber(TotalStars)));
 if(TxtStatus)
  TxtStatus->SetText(Progress.bInMission
   ? FText::FromString(TEXT("Devam eden sunucu savaşı"))
   : FText::FromString(TEXT("Bölüm seç · 1–3 yıldız topla")));
 RefreshButtons();
}
bool UStarfortCampaignScreen::RequestStage(int32 Stage)
{
 if(!bVerified || bPending || bInMission || Stage<1 ||
     Stage>HighestUnlocked || Stage>8) return false;
 bPending=true;
 RefreshButtons();
 if(TxtStatus) TxtStatus->SetText(FText::FromString(TEXT("Bölüm sunucuda başlatılıyor")));
 OnStageRequested.Broadcast(Stage);
 return true;
}
void UStarfortCampaignScreen::ShowResult(bool bWon,int32 Stars)
{
 if(TxtResult)
  TxtResult->SetText(bWon
   ? FText::Format(FText::FromString(TEXT("ZAFER! {0} yıldız")),
      FText::AsNumber(FMath::Clamp(Stars,1,3)))
   : FText::FromString(TEXT("Sefer sonuçlandı. Takımını geliştir.")));
}
void UStarfortCampaignScreen::Stage1(){RequestStage(1);}
void UStarfortCampaignScreen::Stage2(){RequestStage(2);}
void UStarfortCampaignScreen::Stage3(){RequestStage(3);}
void UStarfortCampaignScreen::Stage4(){RequestStage(4);}
void UStarfortCampaignScreen::Stage5(){RequestStage(5);}
void UStarfortCampaignScreen::Stage6(){RequestStage(6);}
void UStarfortCampaignScreen::Stage7(){RequestStage(7);}
void UStarfortCampaignScreen::Stage8(){RequestStage(8);}
