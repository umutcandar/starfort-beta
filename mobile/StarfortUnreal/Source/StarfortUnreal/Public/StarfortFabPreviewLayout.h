#pragma once

#include "CoreMinimal.h"

/**
 * STARFORT v83 private Fab/Paragon review overlay geometry.
 *
 * All hit targets are shared between the HUD drawing code and the desktop
 * mouse/physical phone touch input handlers. No UMG widget/extra assets,
 * WebView, online requests, or simulated server state are created.
 *
 * Coordinates are in the PlayerController viewport pixel space. This layout
 * is a *landscape* private visual prototype, not production mobile gameplay.
 */
struct FStarfortFabPreviewRect
{
 float X=0.f;
 float Y=0.f;
 float Width=0.f;
 float Height=0.f;

 bool Contains(float PointX,float PointY) const
 {
  return PointX>=X && PointY>=Y &&
   PointX<X+Width && PointY<Y+Height;
 }
};

enum class EStarfortFabPreviewHit : uint8
{
 None,
 Hero1,Hero2,Hero3,Hero4,Hero5,Hero6,Hero7,
 TeamAttack,EnemyAttack,WideCamera,
 SoloAttack,OrbitLeft,OrbitRight,ZoomIn,ZoomOut,OtherScene
};

struct FStarfortFabPreviewLayout
{
 static bool IsLandscape(int32 Width,int32 Height)
 {
  return Width>Height && Width>=320 && Height>=240;
 }

 static float SideMargin(int32 Width)
 {
  return FMath::Clamp(Width*0.015f,8.f,20.f);
 }

 static FStarfortFabPreviewRect Banner(int32 Width)
 {
  return {8.f,8.f,FMath::Max(Width-16.f,0.f),38.f};
 }

 static FStarfortFabPreviewRect HeroRow(int32 Width,int32 Index)
 {
  const float Margin=SideMargin(Width);
  const float Button=(Width-2.f*Margin)/7.f;
  return {Margin+Index*Button,55.f,Button-4.f,44.f};
 }

 static FStarfortFabPreviewRect BattleAction(int32 Width,int32 Height,int32 Index)
 {
  const float Margin=SideMargin(Width);
  const float Button=(Width-2.f*Margin)/3.f;
  return {Margin+Index*Button,static_cast<float>(Height)-124.f,Button-5.f,46.f};
 }

 static FStarfortFabPreviewRect BottomAction(int32 Width,int32 Height,int32 Index)
 {
  const float Margin=SideMargin(Width);
  const float Button=(Width-2.f*Margin)/6.f;
  return {Margin+Index*Button,static_cast<float>(Height)-69.f,Button-5.f,56.f};
 }

 static EStarfortFabPreviewHit HitTest(
  float X,float Y,int32 Width,int32 Height,bool bBattle)
 {
  if (!IsLandscape(Width,Height) || !FMath::IsFinite(X) ||
      !FMath::IsFinite(Y) || X<0.f || Y<0.f ||
      X>=Width || Y>=Height) return EStarfortFabPreviewHit::None;

  for (int32 I=0;I<7;++I)
   if (HeroRow(Width,I).Contains(X,Y))
    return static_cast<EStarfortFabPreviewHit>(
     static_cast<uint8>(EStarfortFabPreviewHit::Hero1)+I);

  if (bBattle)
  {
   for (int32 I=0;I<3;++I)
    if (BattleAction(Width,Height,I).Contains(X,Y))
     return static_cast<EStarfortFabPreviewHit>(
      static_cast<uint8>(EStarfortFabPreviewHit::TeamAttack)+I);
  }

  for (int32 I=0;I<6;++I)
   if (BottomAction(Width,Height,I).Contains(X,Y))
    return static_cast<EStarfortFabPreviewHit>(
     static_cast<uint8>(EStarfortFabPreviewHit::SoloAttack)+I);

  return EStarfortFabPreviewHit::None;
 }
};
