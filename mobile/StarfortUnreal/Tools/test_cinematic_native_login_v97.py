#!/usr/bin/env python3
"""Static 5.8 native UMG login composition regression tests.
Does not claim to screenshot or open Unreal Editor.
"""
import unittest
from pathlib import Path

SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"
FACTORY=SRC/"Private/StarfortNativeWidgetFactory.cpp"
LOGIN=SRC/"Private/StarfortLoginScreen.cpp"
HDR=SRC/"Public/StarfortLoginScreen.h"

class PremiumLoginV97(unittest.TestCase):
 def test_login_is_transparent_landscape_with_staged_sign_in_and_safe_scaling(self):
  source=FACTORY.read_text(encoding="utf-8")
  start=source.index("bool FStarfortNativeWidgetFactory::BuildLogin(")
  end=source.index("bool FStarfortNativeWidgetFactory::BuildVillage(",start)
  body=source[start:end]
  for text in ('SetWidthOverride(1600.f)','SetHeightOverride(900.f)',
   'SetStretch(EStretch::ScaleToFit)','USafeZone','UOverlay',
   'SetVisibility(ESlateVisibility::Collapsed)',
   'Screen->LoginFormPanel=FormSize',
   'SetHeightOverride(65.f)','SetHeightOverride(76.f)',
   'TAHT SENİ BEKLİYOR','KRALLIĞA GİR','KOMUTAN GİRİŞİ'):
   self.assertIn(text,body,text)
  self.assertNotIn('BeginPanel(Screen,560.f,410.f)',body)
  self.assertEqual(body.count("{"),body.count("}"))

 def test_dark_fields_protect_password_and_keep_exact_widget_pointers(self):
  source=FACTORY.read_text(encoding="utf-8")
  start=source.index("bool FStarfortNativeWidgetFactory::BuildLogin(")
  end=source.index("bool FStarfortNativeWidgetFactory::BuildVillage(",start)
  body=source[start:end]
  for marker in ('Screen->InputEmail','Screen->InputPassword',
   'Input->SetIsPassword(bPassword)', 'Style.BackgroundImageNormal.TintColor',
   'Input->SetWidgetStyle(Style)','Screen->BtnSignIn',
   'Screen->BtnOpenLogin','Screen->BtnCloseLogin','Screen->LoginFormPanel',
   'Screen->TxtAuthStatus', 'Tree->RootWidget=Root'):
   self.assertIn(marker,body,marker)
  for forbidden in ('Misafir olarak','DEMO GİRİŞ','localhost:3000','WidgetBlueprint'):
   self.assertNotIn(forbidden,body)
  login=LOGIN.read_text(encoding="utf-8")
  header=HDR.read_text(encoding="utf-8")
  self.assertIn('BtnSignIn->OnClicked.AddUniqueDynamic',login)
  self.assertIn('InputPassword->SetText(FText::GetEmpty())',login)
  self.assertIn('Online->SignIn(Email,Password)',login)
  self.assertIn('OnLoginSucceeded.Broadcast()',login)
  self.assertIn('TObjectPtr<UButton> BtnSignIn;',header)

 def test_unrelated_village_combat_factories_unchanged(self):
  source=FACTORY.read_text(encoding="utf-8")
  for token in ('BuildVillage(UStarfortVillageScreen* Screen)',
    'BuildCampaign(UStarfortCampaignScreen* Screen)',
    'BuildBattle(UStarfortBattleScreen* Screen)',
    'BuildHero(UStarfortHeroScreen* Screen)'):
   self.assertIn(token,source)
if __name__=="__main__":unittest.main()
