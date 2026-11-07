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
  self.assertIn("GlobalDefaultGameMode=/Script/StarfortUnreal.StarfortVillageGameMode",c)
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
 def test_supabase_native_account_contract(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortOnlineSubsystem.h").read_text()
  c=(root/"Private/StarfortOnlineSubsystem.cpp").read_text()
  config=(R/"Config/DefaultGame.ini").read_text()
  build=(root/"StarfortUnreal.Build.cs").read_text()
  for dep in ['"Http"','"Json"','"JsonUtilities"']:self.assertIn(dep,build)
  for x in ["UGameInstanceSubsystem","SignIn","SignOut","LoadVillage","RequestVillageUpgrade","LoadProgress",
            "OnVillageReady","OnProgressReady","OnSignedOut"]:self.assertIn(x,h)
  for path in ["/auth/v1/token?grant_type=password","/auth/v1/user",
               "/auth/v1/token?grant_type=refresh_token",
               "/rest/v1/rpc/sfb_village_api","/rest/v1/rpc/sfb_starfort_progress"]:
   self.assertIn(path,c)
  for key in ['"p_action"','"p_building"','"p_request_id"','"p_room_id"','"p_target"','"p_aux"']:
   self.assertIn(key,c)
  self.assertIn('SessionGeneration',c)
  self.assertIn('Root->TryGetStringField(TEXT("source"),Source)',c)
  self.assertIn('Out.bServerVerified=true',c)
  self.assertIn('FGuid::NewGuid()',c)
  self.assertIn('bVillagePending',c)
  self.assertIn('https://ftbbzqzgafmallrfimnt.supabase.co',config)
  self.assertIn('sb_publishable_',config)
  self.assertNotIn("service_role",config.lower())
  self.assertNotIn("service_role",c.lower())
  self.assertNotIn("UE_LOG(LogTemp, Log, TEXT(\"Bearer",c)
 def test_login_and_village_events_are_connected(self):
  root=R/"Source/StarfortUnreal"
  login=(root/"Private/StarfortLoginScreen.cpp").read_text()
  ctrl=(root/"Private/StarfortVillageController.cpp").read_text()
  h=(root/"Public/StarfortVillageController.h").read_text()
  self.assertIn('SetIsPassword(true)',login)
  self.assertIn('InputPassword->SetText(FText::GetEmpty())',login)
  self.assertIn('GetSubsystem<UStarfortOnlineSubsystem>()',ctrl)
  self.assertIn('OnSignedIn.AddUniqueDynamic',ctrl)
  self.assertIn('OnVillageReady.AddUniqueDynamic',ctrl)
  self.assertIn('OnUpgradeRequested.AddUniqueDynamic',ctrl)
  self.assertIn('Online->LoadVillage()',ctrl)
  self.assertIn('Online->RequestVillageUpgrade(BuildingId)',ctrl)
  self.assertIn('LoginScreenClass',h)
  self.assertIn('!Online->IsSignedIn()',ctrl)
 def test_native_scene_navigation_refuses_unshipped_maps(self):
  root=R/"Source/StarfortUnreal"
  router=(root/"Private/StarfortSceneRouter.cpp").read_text()
  controller=(root/"Private/StarfortVillageController.cpp").read_text()
  for requirement in ['GetSubsystem<UStarfortOnlineSubsystem>()','FPackageName::DoesPackageExist',
                      '/Game/Maps/L_StarfortVillage','/Game/Maps/L_RoyalGunnerStudio',
                      '/Game/Maps/L_StarfortBattle','/Game/Maps/L_StarfortAlliance']:
   self.assertIn(requirement,router)
  for handler in ['HandleHeroesRequested','HandleBattlesRequested','HandleAllianceRequested',
                  'HandleRouteUnavailable']:
   self.assertIn(handler,controller)
  self.assertNotIn("WebView",controller)
 def test_premium_asset_gate_is_release_blocking(self):
  import subprocess
  root=R/"ContentPipeline"
  manifest=json.loads((root/"required_premium_assets.json").read_text())
  assert len(manifest["assets"])==12
  for asset in manifest["assets"]:
   self.assertFalse(asset["mobile_reviewed"])
   self.assertFalse(asset["device_reviewed"])
  script=R/"Tools/validate_premium_art.py"
  success=subprocess.run(["python3",str(script),"--schema-only"],capture_output=True,text=True,check=False)
  self.assertEqual(success.returncode,0,success.stdout+success.stderr)
  self.assertFalse(json.loads(success.stdout)["release_ready"])
  blocked=subprocess.run(["python3",str(script),"--release"],capture_output=True,text=True,check=False)
  self.assertEqual(blocked.returncode,2,blocked.stdout+blocked.stderr)
  self.assertFalse(json.loads(blocked.stdout)["release_ready"])
 def test_real_server_campaign_and_hero_training_contract(self):
  src=R/"Source/StarfortUnreal"
  header=(src/"Public/StarfortOnlineSubsystem.h").read_text()
  cpp=(src/"Private/StarfortOnlineSubsystem.cpp").read_text()
  for key in ["ClearedStages","StoryStars","PlayerMaxHP","EnemyMaxHP",
              "MissionStartedAt","MissionId","ResultStars","OnMissionResult",
              "OnBattleReady","StartStoryStage","SubmitBattleAction","AbandonMission","TrainHero"]:
   self.assertIn(key,header)
  for action in ["mission_start","mission_turn","mission_abandon","hero"]:
   self.assertIn('TEXT("'+action+'")',cpp)
  for field in ['"cleared"','"campaignStars"','"startedAt"','"lastTurnAt"',
                '"playerMaxHp"','"enemyMaxHp"','"lastReport"','"stars"']:
   self.assertIn('TEXT('+field+')',cpp)
  for guard in ["!IsAllowedBattleAction(ActionId)","!IsAllowedHero(HeroId)",
                "Stage<1 || Stage>8","bProgressPending","Action==TEXT(\"get\")",
                "FGuid::NewGuid().ToString","LastMissionId==Snapshot.MissionId",
                "OnBattleReady.Broadcast(Battle)"]:
   self.assertIn(guard,cpp)
  self.assertNotIn("Out.ResultStars=3;",cpp)
  self.assertNotIn("OnMissionResult.Broadcast(true,3)",cpp)
  self.assertIn('if (Action!=TEXT("get")) LoadProgress();',cpp)
  self.assertNotIn("HeroHP -=",cpp)
  self.assertNotIn("EnemyHP -=",cpp)
 def test_native_campaign_level_ratings_and_battle_screen_are_connected(self):
  src=R/"Source/StarfortUnreal"
  ch=(src/"Public/StarfortCampaignScreen.h").read_text()
  cc=(src/"Private/StarfortCampaignScreen.cpp").read_text()
  controller=(src/"Private/StarfortBattleController.cpp").read_text()
  game=(src/"Private/StarfortBattleGameMode.cpp").read_text()
  for token in ["BtnStage1","BtnStage8","RequestStage","ApplyVerifiedProgress","OnStageRequested"]:
   self.assertIn(token,ch)
  for token in ["Progress.ClearedStages.Num()+1","Progress.StoryStars",
                "bPending=true","OnStageRequested.Broadcast(Stage)"]:
   self.assertIn(token,cc)
  for token in ["Online->StartStoryStage(StageId)","Online->SubmitBattleAction(ActionId)",
                "Online->LoadProgress()","Stage->PresentVerifiedTurn(Turn)",
                "CampaignScreen->ShowResult(bWon,Stars)","Online->OnSignedOut"]:
   self.assertIn(token,controller)
  self.assertIn('ASpectatorPawn::StaticClass()',game)
  self.assertIn('AStarfortBattleController::StaticClass()',game)
 def test_native_hero_panel_never_invents_attack_or_equipment_stats(self):
  src=R/"Source/StarfortUnreal"
  hero=(src/"Private/StarfortHeroScreen.cpp").read_text()
  controller=(src/"Private/StarfortMobilePlayerController.cpp").read_text()
  self.assertIn("ApplyVerifiedRosterLevel",hero)
  self.assertIn("SetWaitingForServer();",hero)
  self.assertIn("Level<1 || Level>20",hero)
  self.assertIn('TEXT("rovan")',controller)
  self.assertIn('Online->TrainHero(TEXT("rovan"))',controller)
  self.assertIn('Online->LoadProgress()',controller)
  self.assertIn('HandleOnlineError',controller)
  self.assertIn('HandleSignedOut',controller)
 def test_mission_actions_match_legacy_server_contract(self):
  source=(R.parents[1]/"starfort/account-progression.js").read_text()
  sql=(R.parents[1]/"starfort/sql/starfort-v225-account-progression.sql").read_text()
  native=(R/"Source/StarfortUnreal/Private/StarfortOnlineSubsystem.cpp").read_text()
  for action in ["mission_start","mission_turn","mission_abandon","hero"]:
   self.assertIn("'"+action+"'",source)
   self.assertIn("TEXT(\""+action+"\")",native)
  self.assertIn("sfb_starfort_progress",source)
  self.assertIn("sfb_starfort_progress",native)
  self.assertIn("p_request_id",sql)
  self.assertIn("p_action='mission_turn'",sql)
 def test_native_boot_login_without_any_widget_blueprints(self):
  src=R/"Source/StarfortUnreal"
  factory=(src/"Private/StarfortNativeWidgetFactory.cpp").read_text()
  factory_h=(src/"Public/StarfortNativeWidgetFactory.h").read_text()
  village=(src/"Private/StarfortVillageController.cpp").read_text()
  battle=(src/"Private/StarfortBattleController.cpp").read_text()
  hero=(src/"Private/StarfortMobilePlayerController.cpp").read_text()
  for widget in ("BuildLogin","BuildVillage","BuildCampaign","BuildBattle","BuildHero"):
   self.assertIn(widget+"(",factory)
   self.assertIn(widget+"(",factory_h)
  for label in ("USafeZone","UScaleBox","ScaleToFit","SelfHitTestInvisible","STARFORT",
                "InputEmail","InputPassword","BtnSignIn","BtnUpgrade","BtnHeroes",
                "BtnBattles","BtnStage8","BtnHeroSkill"):
   self.assertIn(label,factory)
  for class_name in ("UStarfortLoginScreen::StaticClass()", "UStarfortVillageScreen::StaticClass()"):
   self.assertIn(class_name,village)
  for class_name in ("UStarfortBattleScreen::StaticClass()","UStarfortCampaignScreen::StaticClass()"):
   self.assertIn(class_name,battle)
  self.assertIn("UStarfortHeroScreen::StaticClass()",hero)
  self.assertIn("SetIsPassword(true)",(src/"Private/StarfortLoginScreen.cpp").read_text())
  self.assertIn("OnRefreshRequested",village)
  self.assertIn("OnSignOutRequested",village)
  self.assertNotIn("WebView",factory)
 def test_real_editor_level_generator_is_safe_and_native(self):
  src=(R/"Tools/create_native_maps.py").read_text()
  compile(src,"create_native_maps.py","exec")
  for name in ("L_StarfortVillage","L_RoyalGunnerStudio",
               "L_StarfortBattle","L_StarfortAlliance"):
   self.assertIn(name,src)
  for word in ("LevelEditorSubsystem","new_level(","default_game_mode",
               "does_asset_exist(","save_current_level()","preserving existing"):
   self.assertIn(word,src)
  project=json.loads((R/"StarfortUnreal.uproject").read_text())
  python_plugin=next(p for p in project["Plugins"] if p["Name"]=="PythonScriptPlugin")
  self.assertTrue(python_plugin["Enabled"])
 def test_mobile_build_preflight_does_not_fabricate_release(self):
  import subprocess
  script=R/"Tools/native_mobile_build.py"
  compile(script.read_text(),"native_mobile_build.py","exec")
  for platform in ("ios","android"):
   smoke=subprocess.run(["python3",str(script),"--platform",platform,
                         "--profile","smoke","--dry-run"],capture_output=True,text=True)
   self.assertEqual(smoke.returncode,0,smoke.stdout+smoke.stderr)
   payload=json.loads(smoke.stdout)
   self.assertTrue(payload["dry_run"])
   self.assertFalse(payload["production_ready"])
   self.assertFalse(payload["editor_compiled"])
   self.assertIn("BuildCookRun",payload["command"])
   self.assertIn("/Engine/Maps/Entry"," ".join(payload["command"]))
   production=subprocess.run(["python3",str(script),"--platform",platform,
                              "--profile","release","--dry-run"],capture_output=True,text=True)
   self.assertEqual(production.returncode,2,production.stdout+production.stderr)
   blockers=json.loads(production.stdout)
   self.assertTrue(blockers["missing"])
   self.assertFalse(blockers["production_ready"])
 def test_three_wave_tactics_match_real_v255_server(self):
  src=R/"Source/StarfortUnreal"
  online_h=(src/"Public/StarfortOnlineSubsystem.h").read_text()
  online_cpp=(src/"Private/StarfortOnlineSubsystem.cpp").read_text()
  for name in ["MissionWave","MissionWaves","MissionWaveTurn",
               "LastRallyTurn","EnemyIntent","LastAction","SkillCooldownTurns"]:
   self.assertIn(name,online_h)
   self.assertIn(name,online_cpp)
  for value in ['TEXT("wave")','TEXT("waves")','TEXT("waveTurn")',
                'TEXT("enemyIntent")','TEXT("cooldowns")','TEXT("lastRallyTurn")']:
   self.assertIn(value,online_cpp)
  for safety in ["Out.Team.Contains(Entry.Key)","ReadyTurn>Turn+4",
                 "LastTurnAt<StartedAt","Out.SkillCooldownTurns.Add",
                 "Battle.LastTurnAtUnixMs=Snapshot.MissionLastTurnAt"]:
   self.assertIn(safety,online_cpp)
  sql=(R.parents[1]/"starfort/sql/starfort-v255-first-minute-combat.sql").read_text()
  for contract in ["'cooldowns'","'lastRallyTurn'","'enemyIntent'",
                   "'waveTurn'","'waves'","'mission_turn'","'skill:%'"]:
   self.assertIn(contract,sql)
 def test_three_real_hero_skills_and_enemy_intent_hud(self):
  src=R/"Source/StarfortUnreal"
  h=(src/"Public/StarfortBattleScreen.h").read_text()
  c=(src/"Private/StarfortBattleScreen.cpp").read_text()
  factory=(src/"Private/StarfortNativeWidgetFactory.cpp").read_text()
  for item in ["BtnSkill1","BtnSkill2","BtnSkill3","TxtEnemyIntent",
               "TxtWave","TxtCooldownHint","TeamHeroes","SkillCooldownTurns"]:
   self.assertIn(item,h)
  for item in ["SkillActionAt(0)","SkillActionAt(1)","SkillActionAt(2)",
               "BtnSkill2","BtnSkill3","TxtEnemyIntent","TxtWave"]:
   self.assertIn(item,factory+c)
  for item in ["IsReadyForCommand","LastRallyTurn","SkillCooldownTurns.Find",
               "IsLocalThrottleElapsed","CurrentUtcMs()","Latest.Turn+1",
               "IntentHint(NewTurn.EnemyIntent)","ShowSkillState()"]:
   self.assertIn(item,c)
  for intent in ["crush","shield","sunder","eclipse","drain","strike"]:
   self.assertIn('TEXT("'+intent+'")',c)
  self.assertIn("3D savaş ve efektler",factory)
  self.assertNotIn('BtnHeroSkill,TEXT("KAHRAMAN YETENEĞİ")',factory)
 def test_confirmed_combat_has_distinct_visual_montages(self):
  src=R/"Source/StarfortUnreal"
  h=(src/"Public/StarfortBattleStage.h").read_text()
  c=(src/"Private/StarfortBattleStage.cpp").read_text()
  for asset in ["VerifiedShotMontage","GuardMontage","FeintMontage",
                "RallyMontage","HeroSkillMontage"]:
   self.assertIn(asset,h)
   self.assertIn(asset,c)
  self.assertIn("Snapshot.LastAction",c)
  self.assertIn("Snapshot.bServerVerified",c)
  self.assertIn("Snapshot.VerifiedDamageDealt>0",c)
  self.assertIn("Snapshot.Turn<=LastConfirmedTurn",c)
  self.assertEqual(c.count("{"),c.count("}"),"unbalanced native battle stage braces")
 def test_no_browser_runtime(self):
  self.assertFalse(any(R.rglob("*.html")))
  self.assertFalse(any(R.rglob("*.js")))
 def test_profiles(self):
  c=(R/"Config/DefaultDeviceProfiles.ini").read_text()
  for s in ["[iPhone DeviceProfile]","[Android_Low DeviceProfile]","[Android_High DeviceProfile]"]:self.assertIn(s,c)
if __name__=="__main__":unittest.main()
