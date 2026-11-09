#include "StarfortFabPreviewHUD.h"
#include "StarfortFabPreviewController.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"

void AStarfortFabPreviewHUD::DrawHUD()
{
 Super::DrawHUD();
 if (!Canvas || !GEngine) return;
 const AStarfortFabPreviewController* Preview=
  Cast<AStarfortFabPreviewController>(PlayerOwner);
 if (!Preview || !Preview->IsPrivatePreview()) return;

 const float Width=static_cast<float>(Canvas->SizeX);
 const float Height=static_cast<float>(Canvas->SizeY);
 const FLinearColor Navy(0.025f,0.045f,0.10f,0.91f);
 const FLinearColor Gold(0.93f,0.75f,0.40f,1.f);
 const FLinearColor Muted(0.73f,0.79f,0.88f,1.f);
 const FLinearColor Active(0.15f,0.24f,0.38f,0.97f);
 DrawRect(Navy,8.f,8.f,FMath::Max(Width-16.f,0.f),146.f);
 DrawText(
  Preview->IsBattlePreview()?TEXT("STARFORT • 3'e 1 ÖZEL 3D SAHNE"):
   TEXT("STARFORT • YEDİ KAHRAMAN 3D GALERİ"),
  Gold,20.f,16.f,GEngine->GetMediumFont(),1.05f,false);
 DrawText(
  FString::Printf(TEXT("Yüklü gerçek Fab karakter: %d | Seçili: %s"),
    Preview->GetLoadedHeroCount(),*Preview->GetFocusedHero()),
  FLinearColor::White,20.f,47.f,GEngine->GetSmallFont(),1.0f,false);
 DrawText(TEXT("Bu sadece kaynak model önizlemesidir; STARFORT'un son kahramanları değildir."),
  Muted,20.f,67.f,GEngine->GetSmallFont(),0.90f,false);

 const TCHAR* Names[]={TEXT("1 ROVAN"),TEXT("2 ALDREN"),TEXT("3 LYRA"),
  TEXT("4 MIRA"),TEXT("5 DORAN"),TEXT("6 VESPER"),TEXT("7 EIRA")};
 const float HeroWidth=FMath::Max(35.f,(Width-40.f)/7.f);
 for (int32 I=0;I<7;++I)
 {
  const float X=20.f+I*HeroWidth;
  DrawRect(Active,X,88.f,FMath::Max(HeroWidth-4.f,31.f),44.f);
  DrawText(Names[I],FLinearColor::White,X+5.f,100.f,
   GEngine->GetSmallFont(),0.87f,false);
 }

 const float FooterY=FMath::Max(Height-76.f,160.f);
 DrawRect(Navy,8.f,FooterY-38.f,FMath::Max(Width-16.f,0.f),105.f);
 DrawText(Preview->GetPreviewNotice(),Gold,20.f,FooterY-30.f,
  GEngine->GetSmallFont(),0.93f,false);
 const TCHAR* Controls[]={
  TEXT("SPACE SALDIR"),TEXT("A SOL"),TEXT("D SAĞ"),
  TEXT("W YAKIN"),TEXT("S UZAK"),TEXT("TAB SAHNE")
 };
 const float ButtonWidth=FMath::Max(35.f,(Width-32.f)/6.f);
 for (int32 I=0;I<6;++I)
 {
  const float X=16.f+I*ButtonWidth;
  DrawRect(Active,X,FooterY,FMath::Max(ButtonWidth-5.f,30.f),56.f);
  DrawText(Controls[I],FLinearColor::White,X+7.f,FooterY+18.f,
   GEngine->GetSmallFont(),0.91f,false);
 }
 if (!Preview->FocusedHeroHasActualAttack())
  DrawText(TEXT("SEÇİLİ KARAKTER İÇİN GERÇEK SALDIRI KLİBİ YOK"),
   FLinearColor(1.f,.49f,.42f,1.f),
   20.f,FMath::Max(FooterY-58.f,158.f),
   GEngine->GetSmallFont(),0.85f,false);
}
