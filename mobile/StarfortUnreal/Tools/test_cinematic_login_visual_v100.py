#!/usr/bin/env python3
"""Source-level regressions for visual bugs in real Mac Unreal PIE screenshots.
Static source checks only. Actual UMG layout/render must be reviewed on Mac.
"""
import unittest
from pathlib import Path

SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"
UI=(SRC/"Private/StarfortNativeWidgetFactory.cpp").read_text(encoding="utf-8")
BEGIN=UI.index("bool FStarfortNativeWidgetFactory::BuildLogin(")
END=UI.index("bool FStarfortNativeWidgetFactory::BuildVillage(",BEGIN)
LOGIN=UI[BEGIN:END]
STAGE=(SRC/"Private/StarfortLoginCinematicStage.cpp").read_text(encoding="utf-8")

class NativeLoginVisualV100(unittest.TestCase):
 def test_title_and_buttons_cannot_wrap_to_multiple_lines(self):
  self.assertIn('Out->SetAutoWrapText(false);',LOGIN)
  self.assertIn('Text(TEXT("STARFORT"),46,Gold)',LOGIN)
  self.assertIn('BrandWidth->SetWidthOverride(675.f)',LOGIN)
  self.assertIn('Text(TEXT("KRALLIĞA GİR"),25,Midnight)',LOGIN)
  self.assertIn('Text(TEXT("HESABIMA GİR"),22,Midnight)',LOGIN)
  self.assertNotIn('TEXT("S T A R F O R T")',LOGIN)
  self.assertNotIn('TEXT("KRALLIĞA GİR      →")',LOGIN)
  self.assertNotIn('TEXT("HESABIMA GİR     →")',LOGIN)
 def test_card_and_teaser_have_explicit_widths_and_status_wrap(self):
  for item in (
   'TeaserWidth->SetWidthOverride(615.f)',
   'FormSize->SetWidthOverride(515.f)',
   'FormSize->SetHeightOverride(700.f)',
   'Subtitle->SetAutoWrapText(true)',
   'Subtitle->SetWrapTextAt(420.f)',
   'Screen->TxtAuthStatus->SetAutoWrapText(true)',
   'Screen->TxtAuthStatus->SetWrapTextAt(430.f)',
   'Screen->LoginFormPanel=FormSize',
  ):
   self.assertIn(item,LOGIN,item)
  self.assertNotIn('SetHeightOverride(615.f)',LOGIN)
 def test_citadel_camera_shows_full_stage_not_extreme_closeup(self):
  self.assertIn('CameraOrigin=FVector(-4200.f,-2950.f,1850.f)',STAGE)
  self.assertIn('CinematicCamera->SetFieldOfView(58.f)',STAGE)
  self.assertNotIn('CameraOrigin=FVector(-2340.f,-1510.f,1060.f)',STAGE)
 def test_glb_import_is_scale_normalized_for_ue_centimeters(self):
  self.assertIn("ImportedCitadelMesh->GetBoundingBox().GetSize()",STAGE)
  self.assertIn("FMath::Clamp(3446.0/LongestAxis,0.001,100.0)",STAGE)
  self.assertIn("ImportedCitadel->SetRelativeScale3D(FVector(ArtScale));",STAGE)
 def test_real_authenticated_ui_integrity_remains(self):
  for item in ('Screen->InputEmail','Screen->InputPassword',
   'Screen->BtnOpenLogin','Screen->BtnSignIn','Screen->TxtAuthStatus',
   'FormSize->SetVisibility(ESlateVisibility::Collapsed)',
   'Tree->RootWidget=Root'):
   self.assertIn(item,LOGIN,item)
  self.assertNotIn('CreateGuest',LOGIN)
  self.assertNotIn('AutoLogin',LOGIN)

if __name__=="__main__":
 unittest.main()
