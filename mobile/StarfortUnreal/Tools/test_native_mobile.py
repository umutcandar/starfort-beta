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
  self.assertEqual(len(manifest["assets"]),18)
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
  self.assertIn('ActiveHeroScreen->GetSelectedHeroId()',controller)
  self.assertIn('Online->TrainHero(ActiveHeroScreen->GetSelectedHeroId())',controller)
  self.assertIn("bHasVerifiedProgress",controller)
  self.assertIn("CachedHeroLevels",controller)
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
  for old_generic in ["VerifiedShotMontage","HeroSkillMontage"]:
   self.assertNotIn(old_generic,h)
   self.assertNotIn(old_generic,c)
  for action in ["StrikeMontage","GuardMontage","FeintMontage",
                 "RallyMontage","SpecialMontage"]:
   self.assertIn("Art->"+action,c)
  self.assertIn("ActiveTeamIds[I]!=SkilledHero",c)
  self.assertIn("Snapshot.LastAction",c)
  self.assertIn("Snapshot.bServerVerified",c)
  self.assertIn("Snapshot.VerifiedDamageDealt>0",c)
  self.assertIn("Snapshot.Turn<=LastConfirmedTurn",c)
  self.assertEqual(c.count("{"),c.count("}"),"unbalanced native battle stage braces")
 def test_three_distinct_mobile_hero_assets_are_required(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortHeroCombatAsset.h").read_text()
  cpp=(root/"Private/StarfortHeroCombatAsset.cpp").read_text()
  for item in ["UPrimaryDataAsset","HeroId","HeroMesh","WeaponMesh",
               "StrikeMontage","GuardMontage","FeintMontage","RallyMontage",
               "SpecialMontage","SpecialEffect","BasicAttackSound",
               "SpecialAttackSound","bArtApprovedForMobile","AuthoredMobileLODCount"]:
   self.assertIn(item,h)
  for guard in ["bArtApprovedForMobile","AuthoredMobileLODCount < 3",
                "GetRefSkeleton().GetNum() < 40","StrikeMontage && GuardMontage",
                "RallyMontage && SpecialMontage"]:
   self.assertIn(guard,cpp)
  manifest=json.loads((R/"ContentPipeline/required_premium_assets.json").read_text())
  hero_ids={"hero_aldren","hero_lyra","royal_gunner","hero_mira",
            "hero_doran","hero_vesper","hero_eira"}
  records={x["key"]:x for x in manifest["assets"]}
  self.assertEqual(len(records),18)
  self.assertTrue(hero_ids.issubset(records))
  for key in hero_ids:
   self.assertEqual(records[key]["bones"],40)
   self.assertGreaterEqual(records[key]["min_lods"],3)
   self.assertTrue({"strike","guard","feint","rally","special"}.issubset(
    set(records[key]["animations"])))
   self.assertIsNone(records[key]["source_file"])
   self.assertFalse(records[key]["mobile_reviewed"])
  mapping=json.loads((R/"ContentPipeline/server_hero_art_mapping.json").read_text())
  self.assertEqual(len(mapping["heroes"]),7)
  self.assertEqual(len(set(mapping["server_authoritative_roster"])),7)
  self.assertEqual(mapping["stage_components"],["HeroRig","HeroRig2","HeroRig3"])
  self.assertTrue(all(not x["artist_approved"] for x in mapping["heroes"]))
  self.assertEqual(set(mapping["server_authoritative_roster"]),
   {x["server_id"] for x in mapping["heroes"]})
 def test_three_hero_unreal_stage_uses_exact_verified_party_order(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortBattleStage.h").read_text()
  cpp=(root/"Private/StarfortBattleStage.cpp").read_text()
  for name in ["HeroRig","HeroRig2","HeroRig3","HeroWeapon","HeroWeapon2",
               "HeroWeapon3","HeroSpecialFX1","HeroSpecialFX2",
               "HeroSpecialFX3","HeroArtCatalog","EnemyRig","CinemaArm",
               "HasConfiguredThreeHeroTeam","ConfigureTeam","FindApprovedHero"]:
   self.assertIn(name,h)
  for token in ["Snapshot.TeamHeroes","ActiveTeamIds!=Snapshot.TeamHeroes",
                "ConfigureTeam(Team)","VerifiedTeam.Num()!=3",
                "Unique.Contains(HeroId)","FindApprovedHero(HeroId)",
                "HasProductionReadyGeometryAndMotion()",
                "Rigs[I]->SetSkeletalMesh(Art->HeroMesh)",
                "Weapons[I]->SetStaticMesh(Art->WeaponMesh)",
                "DoesSocketExist(Art->WeaponSocket)","DoesSocketExist(Art->ImpactSocket)",
                "Art->SpecialMontage","ActiveTeamIds[I]!=SkilledHero",
                "VerifiedDamage>0","ConfirmedImpactFX->Activate(true)",
                "LastConfirmedTurn=Snapshot.Turn","OnTeamAssetsLoaded(uint64 Generation)"]:
   self.assertIn(token,cpp)
  self.assertIn("SetAllVisible(false);",cpp)
  self.assertIn("LastConfirmedWave",cpp)
  self.assertEqual(cpp.count("{"),cpp.count("}"),"unbalanced native stage braces")
 def test_cinematic_3d_center_is_not_blocked_by_opaque_qa_panel(self):
  root=R/"Source/StarfortUnreal"
  factory=(root/"Private/StarfortNativeWidgetFactory.cpp").read_text()
  begin=factory.index("bool FStarfortNativeWidgetFactory::BuildBattle(")
  end=factory.index("bool FStarfortNativeWidgetFactory::BuildHero(",begin)
  battle=factory[begin:end]
  self.assertIn("BeginBattleOverlay",factory)
  self.assertIn("USpacer",factory)
  self.assertIn("FSlateChildSize(ESlateSizeRule::Fill)",factory)
  self.assertIn("Tree->RootWidget=Safe",factory)
  self.assertNotIn("BeginPanel(Screen",battle)
  self.assertIn("BeginBattleOverlay(Screen,Top,Bottom)",battle)
  self.assertIn("Screen->TxtEnemyHP",battle)
  self.assertIn("Screen->BtnHeroSkill",battle)
  controller=(root/"Private/StarfortBattleController.cpp").read_text()
  self.assertIn("AStarfortBattleStage::StaticClass()",controller)
  self.assertIn("TActorIterator<AStarfortBattleStage>",controller)
  self.assertIn("SetViewTarget(Stage)",controller)
  editor=(R/"Tools/create_native_maps.py").read_text()
  self.assertIn("StarfortBattleStage",editor)
  self.assertIn("spawn_actor_from_class(",editor)
 def test_mobile_soft_reference_anim_blueprint_and_roster_cleanup(self):
  root=R/"Source/StarfortUnreal"
  asset_h=(root/"Public/StarfortHeroCombatAsset.h").read_text()
  asset_cpp=(root/"Private/StarfortHeroCombatAsset.cpp").read_text()
  stage_h=(root/"Public/StarfortBattleStage.h").read_text()
  stage_cpp=(root/"Private/StarfortBattleStage.cpp").read_text()
  controller=(root/"Private/StarfortBattleController.cpp").read_text()
  for token in ["TSubclassOf<UAnimInstance> AnimInstanceClass","SpecialEffect",
                "BasicAttackSound","SpecialAttackSound"]:
   self.assertIn(token,asset_h)
  for token in ["!AnimInstanceClass","SpecialEffect &&",
                "BasicAttackSound && SpecialAttackSound"]:
   self.assertIn(token,asset_cpp)
  for token in ["FStarfortHeroArtEntry","TSoftObjectPtr<UStarfortHeroCombatAsset>",
                "TArray<FStarfortHeroArtEntry> HeroArtCatalog",
                "ClearBattlePresentation"]:
   self.assertIn(token,stage_h)
  for token in ["Match->Art.IsNull()","Match->Art.Get()",
                "SetAnimInstanceClass(Art->AnimInstanceClass.Get())",
                "ClearBattlePresentation()","ActiveHeroArt.Reset()",
                "SetSkeletalMesh(nullptr)","SetStaticMesh(nullptr)"]:
   self.assertIn(token,stage_cpp)
  self.assertGreaterEqual(controller.count("Stage->ClearBattlePresentation()"),3)
 def test_mobile_art_loading_is_async_not_a_game_thread_freeze(self):
  src=R/"Source/StarfortUnreal"
  h=(src/"Public/StarfortBattleStage.h").read_text()
  c=(src/"Private/StarfortBattleStage.cpp").read_text()
  controller=(src/"Private/StarfortBattleController.cpp").read_text()
  for marker in ["TeamLoadHandle","TeamLoadGeneration",
                 "BeginTeamAssetLoad","OnTeamAssetsLoaded",
                 "bTeamLoadPending","PendingTeamIds","PendingTurn",
                 "EndPlay(const EEndPlayReason::Type EndPlayReason)"]:
   self.assertIn(marker,h)
  for marker in ["RequestAsyncLoad(","FStreamableDelegate::CreateUObject(",
                 "UAssetManager::GetStreamableManager()",
                 "Match->Art.Get()","CancelHandle()",
                 "Generation!=TeamLoadGeneration","PendingTurn=Snapshot.Turn",
                 "PendingWave=Snapshot.Wave","LastConfirmedTurn=Turn",
                 "ClearBattlePresentation()","ConfigureTeam(Team)"]:
   self.assertIn(marker,c)
  self.assertNotIn("LoadSynchronous()",c)
  self.assertIn("ExactPreferredStage ? ExactPreferredStage : FirstPlacedStage",controller)
  self.assertIn("ExistingStages>1",controller)
 def test_real_unreal_editor_automation_tests_exist(self):
  src=R/"Source/StarfortUnreal/Private/Tests/StarfortNativeAutomationTests.cpp"
  c=src.read_text()
  for test in ["STARFORT.Native.Art.StrictHeroAssetGate",
               "STARFORT.Native.Battle.ThreeSkeletalRigsAndCamera",
               "STARFORT.Native.Battle.ServerOnlyDefaults"]:
   self.assertIn(test,c)
  for important in ["IMPLEMENT_SIMPLE_AUTOMATION_TEST(",
                    "WITH_DEV_AUTOMATION_TESTS","HeroRig2","HeroRig3",
                    "HasProductionReadyGeometryAndMotion",
                    "HasApprovedStage","IsSignedIn()"]:
   self.assertIn(important,c)
  self.assertEqual(c.count("{"),c.count("}"))
 def test_editor_automation_runner_checks_real_reports_not_fake_green(self):
  import runpy
  import subprocess
  runner=R/"Tools/run_editor_qa.py"
  compile(runner.read_text(encoding="utf-8"),str(runner),"exec")
  namespace=runpy.run_path(str(runner))
  required=namespace["REQUIRED"]
  self.assertEqual(len(required),3)
  check=namespace["report_result"]
  good={
   "succeeded":3,"succeededWithWarnings":0,
   "failed":0,"notRun":0,"inProcess":0,
   "tests":[{"fullTestPath":path,"state":"Success","errors":0}
            for path in sorted(required)],
  }
  self.assertEqual(check(good),[])
  bad=dict(good)
  bad["tests"]=good["tests"][:-1]
  self.assertTrue(check(bad),"Missing editor test must fail validation")
  bad=dict(good)
  bad["failed"]=1
  self.assertTrue(check(bad),"Failed engine test must fail validation")
  bad=dict(good)
  bad["tests"]=[dict(item) for item in good["tests"]]
  bad["tests"][0]["state"]="Fail"
  self.assertTrue(check(bad),"Failed result must fail")
  dry=subprocess.run(["python3",str(runner),"--dry-run"],
                     capture_output=True,text=True,check=False)
  self.assertEqual(dry.returncode,0,dry.stdout+dry.stderr)
  plan=json.loads(dry.stdout)
  self.assertFalse(plan["real_unreal_editor_verified"])
  self.assertIn("Automation RunTest STARFORT.Native;Quit",
                " ".join(plan["command"]))
  self.assertIn("-ReportExportPath="," ".join(plan["command"]))
 def test_unreal_editor_visual_audit_requires_18_real_assets(self):
  script=R/"Tools/editor_visual_preflight.py"
  c=script.read_text(encoding="utf-8")
  compile(c,str(script),"exec")  # Test syntax without fabricating Unreal Editor.
  for expected in ["import unreal","EditorAssetLibrary.does_asset_exist",
                   "has_production_ready_geometry_and_motion()",
                   "from validate_premium_art import validate",
                   "validate(require_art=True)",
                   "visual_release_approved","WBP_BattleHUD",
                   "L_StarfortBattle","required_asset_count",
                   "raise RuntimeError("]:
   self.assertIn(expected,c)
  self.assertIn("editor_content_audited",c)
  self.assertIn("server_hero_art_mapping.json",c)
 def test_map_transitions_detach_gameinstance_event_delegates(self):
  root=R/"Source/StarfortUnreal"
  controllers={
   "Village":("StarfortVillageController","OnVillageReady","OnSignedIn","OnFailure"),
   "Battle":("StarfortBattleController","OnBattleReady","OnProgressReady","OnSignedOut"),
   "Hero":("StarfortMobilePlayerController","OnProgressReady","OnFailure","OnSignedOut"),
  }
  for role,(name,*events) in controllers.items():
   h=(root/"Public"/(name+".h")).read_text()
   c=(root/"Private"/(name+".cpp")).read_text()
   self.assertIn("EndPlay(const EEndPlayReason::Type EndPlayReason) override",h,role)
   self.assertIn("::EndPlay(const EEndPlayReason::Type EndPlayReason)",c,role)
   self.assertIn("Super::EndPlay(EndPlayReason)",c,role)
   for event in events:
    self.assertIn(event+".RemoveDynamic(this,",c,role+" "+event)
   self.assertIn("RemoveFromParent();",c,role)
  village=(root/"Private/StarfortVillageController.cpp").read_text()
  self.assertIn("OnRouteUnavailable.RemoveDynamic",village)
  self.assertIn("OnBuildingSelected.RemoveDynamic",village)
  battle=(root/"Private/StarfortBattleController.cpp").read_text()
  self.assertIn("Stage->ClearBattlePresentation()",battle)
  hero=(root/"Private/StarfortMobilePlayerController.cpp").read_text()
  self.assertIn("OnFirePreviewRequested.RemoveDynamic",hero)
 def test_network_failure_keeps_verified_village_read_only(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortVillageScreen.h").read_text()
  screen=(root/"Private/StarfortVillageScreen.cpp").read_text()
  controller=(root/"Private/StarfortVillageController.cpp").read_text()
  self.assertIn("MarkReadOnlyUntilRefresh",h)
  start=screen.index("void UStarfortVillageScreen::MarkReadOnlyUntilRefresh(")
  end=screen.index("void UStarfortVillageScreen::ApplyVerifiedVillage(",start)
  stale=screen[start:end]
  self.assertIn("bHasVerifiedVillage=false;",stale)
  self.assertIn("BtnUpgrade->SetIsEnabled(false)",stale)
  self.assertIn("güncel olmayabilir",stale)
  self.assertNotIn("VerifiedSnapshot =",stale)
  self.assertNotIn("TxtGold->SetText(",stale)
  self.assertNotIn("TxtWood->SetText(",stale)
  self.assertIn("MarkReadOnlyUntilRefresh(SafeReason)",controller)
 def test_manual_combat_retry_only_issues_server_read(self):
  root=R/"Source/StarfortUnreal"
  screen_h=(root/"Public/StarfortBattleScreen.h").read_text()
  screen=(root/"Private/StarfortBattleScreen.cpp").read_text()
  controller=(root/"Private/StarfortBattleController.cpp").read_text()
  factory=(root/"Private/StarfortNativeWidgetFactory.cpp").read_text()
  for symbol in ["OnRetryRequested","BtnRetry","RetryClicked"]:
   self.assertIn(symbol,screen_h)
  self.assertIn("OnRetryRequested.Broadcast()",screen)
  self.assertIn("BtnRetry->OnClicked.AddUniqueDynamic",screen)
  self.assertIn("OnRetryRequested.AddUniqueDynamic(this,&AStarfortBattleController::RefreshBattle)",controller)
  self.assertIn("OnRetryRequested.RemoveDynamic(this,&AStarfortBattleController::RefreshBattle)",controller)
  self.assertIn("Screen->BtnRetry",factory)
  self.assertIn("SUNUCUYU YENİLE",factory)
  beginning=controller.index("void AStarfortBattleController::RefreshBattle()")
  ending=controller.index("void AStarfortBattleController::StageRequested(",beginning)
  block=controller[beginning:ending]
  self.assertIn("Online->LoadProgress()",block)
  self.assertNotIn("SubmitBattleAction",block)
 def test_expired_account_returns_native_login_and_village_smoke_fallback(self):
  root=R/"Source/StarfortUnreal"
  router=(root/"Private/StarfortSceneRouter.cpp").read_text()
  hero=(root/"Private/StarfortMobilePlayerController.cpp").read_text()
  battle=(root/"Private/StarfortBattleController.cpp").read_text()
  entry='FName(TEXT("/Engine/Maps/Entry"))'
  self.assertIn(entry,router)
  self.assertIn(entry,hero)
  self.assertIn(entry,battle)
  self.assertIn("FPackageName::DoesPackageExist(VillageMap)",router)
  self.assertIn("OnRouteUnavailable.Broadcast",router)
  online=(root/"Private/StarfortOnlineSubsystem.cpp").read_text()
  self.assertIn("Önceki hesap işlemi devam ediyor",online)
  self.assertIn("Fail(TEXT(",online)
 def test_four_hero_cinematic_gallery_uses_real_server_roster(self):
  root=R/"Source/StarfortUnreal"
  h=(root/"Public/StarfortHeroScreen.h").read_text()
  c=(root/"Private/StarfortHeroScreen.cpp").read_text()
  ch=(root/"Public/StarfortMobilePlayerController.h").read_text()
  cc=(root/"Private/StarfortMobilePlayerController.cpp").read_text()
  factory=(root/"Private/StarfortNativeWidgetFactory.cpp").read_text()
  for hero in ["Rovan","Aldren","Lyra","Vesper"]:
   self.assertIn("BtnSelect"+hero,h)
   self.assertIn("BtnSelect"+hero,factory)
   self.assertIn('TEXT("'+hero.lower()+'")',c)
  for symbol in ["OnHeroSelected","ImgHeroSplash","ImgHeroPortrait",
                 "ImgSkill1","ImgSkill2","ImgSkill3","ImgSkill4",
                 "ActiveCard","ToggleHeroArtDetail","GetSelectedHeroId"]:
   self.assertIn(symbol,h)
  for marker in ["RefreshCinematicArt()","T_Rovan","T_",
                 "RequestAsyncLoad(","Sinematik 2D","SetBrushFromTexture",
                 "OnHeroSelected.Broadcast(HeroId)","bShowingHeroCard"]:
   self.assertIn(marker if marker!="T_Rovan" else "T_",c)
  for marker in ["CachedHeroLevels=Progress.HeroLevels",
                 "HandleHeroSelection(ActiveHeroScreen->GetSelectedHeroId())",
                 "CachedHeroLevels.Find(HeroId)",
                 "Online->TrainHero(ActiveHeroScreen->GetSelectedHeroId())",
                 "OnHeroSelected.AddUniqueDynamic",
                 "OnHeroSelected.RemoveDynamic"]:
   self.assertIn(marker,cc)
  self.assertIn("bHasVerifiedProgress=false;",cc)
  self.assertIn("CachedHeroLevels.Empty();",cc)
  self.assertIn("SetActorHiddenInGame(true)",cc)
  self.assertIn('TEXT("3D YAKINDA")',factory)
  self.assertIn("BtnFirePreview->SetIsEnabled(false)",factory)
  self.assertIn("TObjectPtr<UButton>& OutButton",factory)
  self.assertNotIn('Online->TrainHero(TEXT("rovan"))',cc)
  self.assertNotIn("Gunner->FireEnergyCannon();",cc)
 def test_import_cinematic_art_fails_closed_before_unreal_editor(self):
  import runpy
  src=R/"Tools/import_cinematic_hero_ui.py"
  body=src.read_text(encoding="utf-8")
  compile(body,str(src),"exec")
  module=runpy.run_path(str(src))
  self.assertEqual(module["CANONICAL"],("rovan","aldren","lyra","vesper"))
  self.assertEqual(len(module["KINDS"]),7)
  self.assertEqual(module["expected_filename"]("rovan","splash"),
   "T_Rovan_Splash.png")
  self.assertEqual(module["expected_filename"]("vesper","skill_04"),
   "T_Vesper_Skill_04.png")
  issues,rows=module["validate_package"]()
  self.assertTrue(issues)
  self.assertEqual(rows,[])
  for check in ["hashlib.sha256(data).hexdigest()",
                "unreal.AssetImportTask()","replace_existing",
                "import_asset_tasks(tasks)",
                "source_kind","cinematic_2d_ui_only",
                "actual_3d_meshes_created"]:
   self.assertIn(check,body)
  cfg=(R/"Config/DefaultGame.ini").read_text()
  self.assertIn('/Game/UI/HeroCinematicV1',cfg)
  self.assertIn('DirectoriesToAlwaysCook',cfg)
 def test_mobile_cinematic_gallery_does_not_block_on_texture_load(self):
  src=R/"Source/StarfortUnreal"
  h=(src/"Public/StarfortHeroScreen.h").read_text()
  c=(src/"Private/StarfortHeroScreen.cpp").read_text()
  for marker in ["NativeConstruct() override","NativeDestruct() override",
                 "CinematicArtLoadHandle","CinematicArtLoadGeneration",
                 "OnCinematicArtLoaded","CancelCinematicArtLoad"]:
   self.assertIn(marker,h)
  for marker in ["UAssetManager::GetStreamableManager().RequestAsyncLoad(",
                 "FStreamableDelegate::CreateUObject(",
                 "Generation!=CinematicArtLoadGeneration",
                 "RequestedHeroId!=SelectedHeroId",
                 "CinematicArtLoadHandle->CancelHandle()",
                 "ActiveSkillIcons.Reset()","ResolveObject()",
                 "bShowingHeroCard&&ActiveCard","LoadedIcons==4"]:
   self.assertIn(marker,c)
  self.assertNotIn(".TryLoad()",c)
  self.assertNotIn("LoadSynchronous()",c)
  self.assertIn("Sinematik 2D",c)
 def test_cinematic_installer_rejects_fake_corrupt_or_overwrite(self):
  import runpy
  source=R/"Tools/install_cinematic_hero_art.py"
  body=source.read_text(encoding="utf-8")
  compile(body,str(source),"exec")
  module=runpy.run_path(str(source))
  self.assertEqual(len(module["CANONICAL"]),4)
  self.assertEqual(len(module["KINDS"]),7)
  self.assertEqual(module["expected_name"]("rovan","skill_03"),
   "T_Rovan_Skill_03.png")
  self.assertEqual(module["expected_name"]("vesper","card"),
   "T_Vesper_Card.png")
  self.assertIn("hashlib.sha256(data)",body)
  self.assertIn("os.replace(name,out)",body)
  self.assertIn("Missing art files:",body)
  self.assertIn("Different existing artwork would be overwritten",body)
  self.assertIn("real_3d_models_created",body)
 def test_sinematik_ue_battle_camera_and_verified_impact(self):
  base=R/"Source/StarfortUnreal"
  stage=(base/"Private/StarfortBattleStage.cpp").read_text()
  header=(base/"Public/StarfortBattleStage.h").read_text()
  combat_h=(base/"Public/StarfortHeroCombatAsset.h").read_text()
  gate=(base/"Private/StarfortHeroCombatAsset.cpp").read_text()
  for name in ["StrikeEffect","GuardEffect","FeintEffect","RallyEffect",
               "SpecialEffect"]:
   self.assertIn(name,combat_h)
   self.assertIn(name,gate)
   self.assertIn("Art->"+name,stage)
  for field in ["HeroAuraFX1","HeroAuraFX2","HeroAuraFX3",
                "DesiredArmLength","DesiredFocus","DesiredLook",
                "DesiredFOV","VerifiedImpactTimer","CameraBeatSeconds"]:
   self.assertIn(field,header)
   self.assertIn(field,stage)
  for marker in ["BeginCameraBeat(Action,SkilledHero)",
                 "UAssetManager::GetStreamableManager().RequestAsyncLoad(",
                 "FMath::VInterpTo(","FMath::RInterpTo(",
                 "FMath::FInterpTo(","ClearTimer(VerifiedImpactTimer)",
                 "PlaybackGeneration!=TeamLoadGeneration",
                 "ActiveRoomId!=PlaybackRoom",
                 "LastConfirmedTurn!=PlaybackTurn",
                 "FTimerDelegate::CreateUObject(this",
                 "VerifiedDamage>0","0.28f,false",
                 "ConfirmedImpactFX->Activate(true)"]:
   self.assertIn(marker,stage)
  # The hit must be scheduled, not fired immediately on the input command.
  start=stage.index("void AStarfortBattleStage::PlayVerifiedPartyAction(")
  end=stage.index("void AStarfortBattleStage::PresentVerifiedTurn(",start)
  action=stage[start:end]
  self.assertNotIn("ConfirmedImpactFX->Activate(true)",action)
  self.assertIn("SetTimer(",action)
  self.assertIn("if(bSkill && !ActiveTeamIds.Contains(SkilledHero)) return;",action)
  self.assertIn("if (bSkill && ActiveTeamIds[I]!=SkilledHero) continue;",action)
  self.assertNotIn("VerifiedShotMontage",action)
  self.assertNotIn("LoadSynchronous()",action)
 def test_no_browser_runtime(self):
  self.assertFalse(any(R.rglob("*.html")))
  self.assertFalse(any(R.rglob("*.js")))
 def test_profiles(self):
  c=(R/"Config/DefaultDeviceProfiles.ini").read_text()
  for s in ["[iPhone DeviceProfile]","[Android_Low DeviceProfile]","[Android_High DeviceProfile]"]:self.assertIn(s,c)
if __name__=="__main__":unittest.main()
