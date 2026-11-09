#include "StarfortFabPreviewHUD.h"
#include "StarfortFabPreviewController.h"
#include "StarfortFabPreviewLayout.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"

void AStarfortFabPreviewHUD::DrawHUD()
{
 Super::DrawHUD();
 if (!Canvas || !GEngine) return;
 const AStarfortFabPreviewController* Preview=
  Cast<AStarfortFabPreviewController>(PlayerOwner);
 if (!Preview || !Preview->IsPrivatePreview()) return;

 const int32 Width=Canvas->SizeX;
 const int32 Height=Canvas->SizeY;
 const FLinearColor Navy(0.025f,0.045f,0.10f,0.92f);
 const FLinearColor Gold(0.93f,0.75f,0.40f,1.f);
 const FLinearColor Muted(0.73f,0.79f,0.88f,1.f);
 const FLinearColor Active(0.15f,0.24f,0.38f,0.95f);
 const FLinearColor White=FLinearColor::White;

 if (!FStarfortFabPreviewLayout::IsLandscape(Width,Height))
 {
  DrawRect(Navy,8.f,8.f,FMath::Max(Width-16.f,0.f),90.f);
  DrawText(TEXT("STARFORT 3D TEST: TELEFONU YATAY ÇEVİR"),
   Gold,16.f,30.f,GEngine->GetMediumFont(),0.94f,false);
  return;
 }

 const FStarfortFabPreviewRect Header=FStarfortFabPreviewLayout::Banner(Width);
 DrawRect(Navy,Header.X,Header.Y,Header.Width,Header.Height);
 DrawText(
  Preview->IsBattlePreview()?TEXT("STARFORT 3D • 3v1 ÖZEL SAHNE"):
   TEXT("STARFORT 3D • 7 KAHRAMAN"),
  Gold,16.f,17.f,GEngine->GetSmallFont(),1.08f,false);
 DrawText(
  FString::Printf(TEXT("Yüklü: %d | Seçili: %s"),
   Preview->GetLoadedHeroCount(),*Preview->GetFocusedHero()),
  White,FMath::Max(Width*0.51f,280.f),19.f,
  GEngine->GetSmallFont(),0.90f,false);

 const TCHAR* Names[]={TEXT("1 ROVAN"),TEXT("2 ALDREN"),TEXT("3 LYRA"),
  TEXT("4 MIRA"),TEXT("5 DORAN"),TEXT("6 VESPER"),TEXT("7 EIRA")};
 for (int32 I=0;I<7;++I)
 {
  const FStarfortFabPreviewRect Box=FStarfortFabPreviewLayout::HeroRow(Width,I);
  DrawRect(Active,Box.X,Box.Y,Box.Width,Box.Height);
  DrawText(Names[I],White,Box.X+5.f,Box.Y+12.f,
   GEngine->GetSmallFont(),0.86f,false);
 }
 DrawText(TEXT("Gerçek Fab referans modeli • STARFORT son tasarımı değil"),
  Muted,16.f,108.f,GEngine->GetSmallFont(),0.80f,false);

 if (Preview->IsBattlePreview())
 {
  const float StatusY=static_cast<float>(Height)-157.f;
  DrawRect(Navy,8.f,StatusY-6.f,FMath::Max(Width-16.f,0.f),32.f);
  DrawText(
   FString::Printf(TEXT("%d gerçek dost / %d gerçek rakip • HP ve ödül yok"),
    Preview->GetRealBattleAllyCount(),Preview->GetRealBattleOpponentCount()),
   Muted,16.f,StatusY,GEngine->GetSmallFont(),0.90f,false);
  DrawText(Preview->GetPrivateBattleStatus(),Gold,16.f,StatusY+16.f,
   GEngine->GetSmallFont(),0.86f,false);

  const TCHAR* BattleControls[]={
   TEXT("Q  3 KAHRAMAN"),TEXT("E  RAKİP ANİMASYONU"),
   TEXT("B  GENİŞ/YAKIN KAMERA")
  };
  for (int32 I=0;I<3;++I)
  {
   const FStarfortFabPreviewRect Box=
    FStarfortFabPreviewLayout::BattleAction(Width,Height,I);
   DrawRect(Active,Box.X,Box.Y,Box.Width,Box.Height);
   DrawText(BattleControls[I],White,Box.X+7.f,Box.Y+15.f,
    GEngine->GetSmallFont(),0.90f,false);
  }
 }

 const FString Notice=Preview->GetPreviewNotice();
 DrawText(Notice,Gold,16.f,
  static_cast<float>(Height)-(Preview->IsBattlePreview()?175.f:97.f),
  GEngine->GetSmallFont(),0.83f,false);

 const TCHAR* Controls[]={
  TEXT("SPACE SALDIR"),TEXT("A SOL"),TEXT("D SAĞ"),
  TEXT("W YAKIN"),TEXT("S UZAK"),TEXT("TAB SAHNE")
 };
 for (int32 I=0;I<6;++I)
 {
  const FStarfortFabPreviewRect Box=
   FStarfortFabPreviewLayout::BottomAction(Width,Height,I);
  DrawRect(Active,Box.X,Box.Y,Box.Width,Box.Height);
  DrawText(Controls[I],White,Box.X+6.f,Box.Y+20.f,
   GEngine->GetSmallFont(),0.88f,false);
 }

 if (!Preview->FocusedHeroHasActualAttack())
  DrawText(TEXT("SEÇİLİ KAHRAMAN: GERÇEK SALDIRI KLİBİ YOK"),
   FLinearColor(1.f,0.49f,0.42f,1.f),16.f,
   static_cast<float>(Height)-
    (Preview->IsBattlePreview()?197.f:120.f),
   GEngine->GetSmallFont(),0.82f,false);
}
