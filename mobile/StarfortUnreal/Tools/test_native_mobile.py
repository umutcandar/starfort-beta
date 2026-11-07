"""Static native source checks only; NOT a UE5 compile or device test."""
import json, unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
class NativeSmoke(unittest.TestCase):
 def test_engine(self):
  j=json.loads((R/"StarfortUnreal.uproject").read_text())
  self.assertEqual(j["EngineAssociation"],"5.8")
  self.assertEqual(j["Modules"][0]["Name"],"StarfortUnreal")
 def test_native_landscape(self):
  c=(R/"Config/DefaultEngine.ini").read_text()
  self.assertIn("GlobalDefaultGameMode=/Script/StarfortUnreal.StarfortMobileGameMode",c)
  self.assertIn("Orientation=Landscape",c)
  self.assertIn("bSupportsPortraitOrientation=False",c)
 def test_scene_is_rigged(self):
  h=(R/"Source/StarfortUnreal/Public/RoyalGunnerPreviewPawn.h").read_text()
  cpp=(R/"Source/StarfortUnreal/Private/RoyalGunnerPreviewPawn.cpp").read_text()
  for s in ["USkeletalMeshComponent","UAnimMontage","UNiagaraSystem","HasApprovedAssets"]:self.assertIn(s,h)
  for s in ["GetRefSkeleton().GetNum() < 40","GetInputTouchState","HeroBody->SetVisibility(false)","MuzzleFlash->Activate(true)"]:self.assertIn(s,cpp)
 def test_native_hero_hud_uses_verified_data_and_real_ui(self):
  root=R/"Source/StarfortUnreal"
  build=(root/"StarfortUnreal.Build.cs").read_text()
  header=(root/"Public/StarfortHeroScreen.h").read_text()
  source=(root/"Private/StarfortHeroScreen.cpp").read_text()
  controller=(root/"Private/StarfortMobilePlayerController.cpp").read_text()
  mode=(root/"Private/StarfortMobileGameMode.cpp").read_text()
  spec=(R/"Docs/HeroScreen_Spec.md").read_text()
  for module in ['"UMG"','"Slate"','"SlateCore"']:self.assertIn(module,build)
  for field in ['bServerVerified','TxtHeroName','BtnFirePreview','BtnUpgrade','ApplyVerifiedHero']:self.assertIn(field,header)
  self.assertIn('!NewSnapshot.bServerVerified',source)
  self.assertIn('OnUpgradeRequested.Broadcast()',source)
  self.assertIn('SetWaitingForServer()',source)
  self.assertNotIn('38,560',source)
  self.assertIn('CreateWidget<UStarfortHeroScreen>',controller)
  self.assertIn('FInputModeGameAndUI',controller)
  self.assertIn('PlayerControllerClass = AStarfortMobilePlayerController::StaticClass()',mode)
  self.assertIn('fictional placeholder',spec)
 def test_no_browser_runtime(self):
  self.assertFalse(any(R.rglob("*.html")))
  self.assertFalse(any(R.rglob("*.js")))
 def test_profiles(self):
  c=(R/"Config/DefaultDeviceProfiles.ini").read_text()
  for s in ["[iPhone DeviceProfile]","[Android_Low DeviceProfile]","[Android_High DeviceProfile]"]:self.assertIn(s,c)
if __name__=="__main__":unittest.main()
