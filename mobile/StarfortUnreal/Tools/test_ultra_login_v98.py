#!/usr/bin/env python3
"""Source contracts for the actual native Unreal 3D login vertical slice.
Not a UE compiler, Editor visual or phone render test.
"""
import unittest
from pathlib import Path
SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"
def read(p): return (SRC/p).read_text(encoding="utf-8")

class UltraLoginV98(unittest.TestCase):
 def test_environment_uses_real_unreal_world(self):
  stage=read("Private/StarfortLoginCinematicStage.cpp")
  for token in ("CreateDefaultSubobject<UCameraComponent>",
   "CreateDefaultSubobject<UExponentialHeightFogComponent>",
   "CreateDefaultSubobject<UDirectionalLightComponent>",
   "CreateDefaultSubobject<UPointLightComponent>",
   'TEXT("/Engine/BasicShapes/Cube.Cube")',
   "RegisterComponent()","Part(TEXT(","BuildFortress()",
   "CinematicCamera->SetRelativeLocation","SetFogDensity("):
   self.assertIn(token,stage,token)
  self.assertNotIn("Inventory.Add(",stage)
  self.assertNotIn("CreateWidget",stage)
 def test_fails_closed_for_unapproved_character_and_empty_audio(self):
  stage=read("Private/StarfortLoginCinematicStage.cpp")
  header=read("Public/StarfortLoginCinematicStage.h")
  for token in ("ApprovedFeaturedHero","OpeningAmbience","HasApprovedHero()"):
   self.assertIn(token,header,token)
  for token in ("HasProductionReadyGeometryAndMotion()",
                "if(HasApprovedHero())",
                "if(OpeningAmbience)",
                "PlayingAmbience->Stop()"):
   self.assertIn(token,stage,token)
  self.assertNotIn("bLegacyPlaceholder=false",stage)
 def test_camera_lifecycle_bound_to_unauthenticated_login(self):
  ctrl=read("Private/StarfortVillageController.cpp")
  header=read("Public/StarfortVillageController.h")
  for token in ("BeginCinematicLogin()","LeaveCinematicLogin()",
   "SetViewTargetWithBlend(ActiveLoginStage",
   "SetViewTargetWithBlend(Pawn",
   "if(bSpawnedLoginStage)",
   "ActiveLoginStage->SetLifeSpan(1.2f)",
   "ActiveLoginStage->Destroy()"):
   self.assertIn(token,ctrl,token)
  self.assertIn('MapName.Contains(TEXT("Entry"))',ctrl)
  self.assertIn("TActorIterator<AStarfortLoginCinematicStage>",ctrl)
  self.assertIn("TSubclassOf<AStarfortLoginCinematicStage> LoginStageClass",header)
 def test_minimal_overlay_reveals_account_form_only_on_click(self):
  ui=read("Private/StarfortNativeWidgetFactory.cpp")
  login=read("Private/StarfortLoginScreen.cpp")
  header=read("Public/StarfortLoginScreen.h")
  i=ui.index("bool FStarfortNativeWidgetFactory::BuildLogin(")
  j=ui.index("bool FStarfortNativeWidgetFactory::BuildVillage(",i)
  body=ui[i:j]
  for token in ("Screen->BtnOpenLogin",
   "Screen->BtnCloseLogin",
   "FormSize->SetVisibility(ESlateVisibility::Collapsed)",
   "Screen->LoginFormPanel=FormSize",
   "KRALLIĞA GİR"):
   self.assertIn(token,body)
  self.assertNotIn("BeginPanel(Screen",body)
  for token in ("OpenLoginFormClicked()","CloseLoginFormClicked()",
   "BtnOpenLogin->OnClicked.AddUniqueDynamic",
   "Online->SignIn(Email,Password)",
   "InputPassword->SetText(FText::GetEmpty())"):
   self.assertIn(token,login)
  self.assertIn("TObjectPtr<UWidget> LoginFormPanel",header)
  self.assertNotIn("guest",body.lower())
if __name__=="__main__":unittest.main()
