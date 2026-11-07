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
 def test_village_is_native_three_d_and_touch_first(self):
  root=R/"Source/StarfortUnreal"
  camera=(root/"Private/StarfortVillageCameraPawn.cpp").read_text()
  building=(root/"Private/StarfortVillageBuilding.cpp").read_text()
  mode=(root/"Private/StarfortVillageGameMode.cpp").read_text()
  controller=(root/"Private/StarfortVillageController.cpp").read_text()
  for token in ["GetInputTouchState", "DeprojectScreenPositionToWorld", "LineTraceSingleByChannel", "ZoomBy", "PanByScreenDelta", "IsWorldStagePosition"]:
   self.assertIn(token,camera)
  for token in ["bArtApprovedForMobile", "GetStaticMesh()", "SetRenderCustomDepth"]:
   self.assertIn(token,building)
  self.assertIn("DefaultPawnClass=AStarfortVillageCameraPawn::StaticClass()",mode)
  self.assertIn("PlayerControllerClass=AStarfortVillageController::StaticClass()",mode)
  self.assertIn("CreateWidget<UStarfortVillageScreen>",controller)
  self.assertIn("RequestBuildingDetails(BuildingId)",controller)
 def test_village_upgrades_remain_authoritative(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortVillageScreen.h").read_text()
  c=(root/"Private/StarfortVillageScreen.cpp").read_text()
  for token in ["bServerVerified", "bServerAllowsUpgrade", "OnUpgradeRequested", "TxtStarEssence"]:
   self.assertIn(token,h)
  for token in ["!NewSnapshot.bServerVerified", "bUpgradePending", "OnUpgradeRequested.Broadcast", "SetWaitingForServer()", "KnownIds"]:
   self.assertIn(token,c)
  self.assertNotIn("gold +=",c.lower())
 def test_battle_action_is_only_server_requested(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortBattleScreen.h").read_text()
  c=(root/"Private/StarfortBattleScreen.cpp").read_text()
  for token in ["ServerAllowedActions", "VerifiedDamageDealt", "OnActionRequested", "BtnHeroSkill"]:
   self.assertIn(token,h)
  for token in ["NewTurn.Turn<=Latest.Turn","!IsKnownAction(ActionId)", "bCommandPending=true", "OnActionRequested.Broadcast(ActionId)", "Latest.ServerAllowedActions.Contains(ActionId)"]:
   self.assertIn(token,c)
  self.assertNotIn("HeroHP -=",c)
  self.assertNotIn("EnemyHP -=",c)
 def test_battle_stage_needs_real_rig_and_confirmed_hit(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortBattleStage.h").read_text()
  c=(root/"Private/StarfortBattleStage.cpp").read_text()
  self.assertIn("USkeletalMeshComponent",h)
  self.assertIn("bArtApprovedForMobile",h)
  for token in ["HasApprovedStage()", "Snapshot.bServerVerified", "LastConfirmedTurn", "VerifiedDamageDealt>0", "Montage_Play", "ConfirmedImpactFX->Activate(true)"]:
   self.assertIn(token,c)
 def test_global_premium_style_tokens_are_shared(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortVisualTheme.h").read_text()
  c=(root/"Private/StarfortVisualTheme.cpp").read_text()
  for color in ["Gold","DeepNavy","PanelNavy","EnergyBlue","Crimson"]:
   self.assertIn(color+"()",h)
   self.assertIn(color+"()",c)
  self.assertIn("MinimumTouchTargetDp()",c)
 def test_real_editor_assets_and_api_are_not_misrepresented(self):
  spec=(R/"Docs/VillageBattle_VisualAndNativeContract.md").read_text()
  for phrase in ["not cryptographic verification","Not yet present","Widget Blueprints","Unreal Editor","Android/iOS"]:
   self.assertIn(phrase,spec)
 def test_no_browser_runtime(self):
  self.assertFalse(any(R.rglob("*.html")))
  self.assertFalse(any(R.rglob("*.js")))
 def test_profiles(self):
  c=(R/"Config/DefaultDeviceProfiles.ini").read_text()
  for s in ["[iPhone DeviceProfile]","[Android_Low DeviceProfile]","[Android_High DeviceProfile]"]:self.assertIn(s,c)
if __name__=="__main__":unittest.main()
