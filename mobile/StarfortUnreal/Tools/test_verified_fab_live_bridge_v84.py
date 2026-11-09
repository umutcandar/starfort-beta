#!/usr/bin/env python3
"""v84 genuine Fab-in-real-online-battle bridge regression checks.

Tests actual selected local-asset licensing/4 distinct references and source
invariants. These source tests do NOT substitute an Unreal 5.8 build or
an authenticated real device session; no fake server response is produced.
"""
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/"Tools"
NATIVE=ROOT/"Source/StarfortUnreal"
sys.path.insert(0,str(TOOLS))
import stage_verified_fab_online_battle_v84 as installer


class Skeleton:
    def __init__(self,name):self.path=name
    def get_path_name(self):return self.path


class UnrealObject:
    def __init__(self,name,path,skeleton=None):
        self.name=name;self.path=path;self.skeleton=skeleton
    def get_class(self):
        return types.SimpleNamespace(get_name=lambda:self.name)
    def get_editor_property(self,key):
        if key=="skeleton":return self.skeleton
        if key=="materials":return ["actual_pbr_material"]
        raise ValueError("property")
    def get_path_name(self):return self.path


class TestVerifiedFabLiveBridgeV84(unittest.TestCase):
    def test_contract_canonical_three_server_heroes_and_one_opponent(self):
        self.assertEqual(installer.ALLIES,("rovan","aldren","lyra"))
        self.assertEqual(installer.OPPONENT,"doran")
        self.assertEqual(installer.MAP,"/Game/Maps/L_StarfortBattle")
        self.assertEqual(len(set(installer.CANONICAL.values())),4)

    def test_user_license_and_each_correct_real_fab_source_are_hard_requirements(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake=Path(tmp)/"user_selection.json"
            mapping={hid:f"/Game/{pkg}/Characters/Skins/SK_{hid}"
                     for hid,pkg in installer.CANONICAL.items()}
            base={"source":"user_imported_fab_library",
                  "private_preview_only":True,
                  "user_confirmed_fab_license":True,
                  "selected_skeletal_meshes":mapping}
            original=installer.SELECTION
            try:
                installer.SELECTION=fake
                fake.write_text(json.dumps(base))
                self.assertEqual(installer.load_selection(),mapping)
                base["user_confirmed_fab_license"]=False
                fake.write_text(json.dumps(base))
                with self.assertRaisesRegex(ValueError,"user-accepted"):
                    installer.load_selection()
                base["user_confirmed_fab_license"]=True
                base["selected_skeletal_meshes"]["lyra"]="/Game/ParagonWraith/Other.SK"
                fake.write_text(json.dumps(base))
                with self.assertRaisesRegex(ValueError,"lyra"):
                    installer.load_selection()
                base["selected_skeletal_meshes"]["lyra"]="/Game/ParagonTheFey/Characters/Skins/SK_lyra"
                base["selected_skeletal_meshes"]["doran"]=mapping["rovan"]
                fake.write_text(json.dumps(base))
                with self.assertRaisesRegex(ValueError,"doran"):
                    installer.load_selection()
            finally:
                installer.SELECTION=original

    def test_real_skeletal_rig_requires_two_distinct_same_skeleton_source_clips(self):
        paths={hid:f"/Game/{pkg}/Meshes/SK_{hid}"
               for hid,pkg in installer.CANONICAL.items()}
        meshes={}
        for hid,path in paths.items():
            skeleton=Skeleton(path+"/Skeleton")
            meshes[path]=UnrealObject("SkeletalMesh",path,skeleton)
        class Lib:
            @staticmethod
            def does_asset_exist(path):return path in meshes
            @staticmethod
            def load_asset(path):return meshes.get(path)
        fake_unreal=types.SimpleNamespace(EditorAssetLibrary=Lib)
        import fab_seven_private_preview_v80 as source
        def real_clip(unreal,root,skeleton,battle=False):
            label="Attack" if battle else "Idle"
            path=root+"/Animations/"+label+"."+label
            return UnrealObject("AnimSequence",path,skeleton),path
        with patch.object(source,"find_native_clip",side_effect=real_clip):
            rows=installer.inspect_source_assets(fake_unreal,paths)
        self.assertEqual(len(rows),4)
        self.assertEqual(sum(row["opponent"] for row in rows),1)
        self.assertEqual(len(set(r["mesh_path"] for r in rows)),4)
        self.assertTrue(all(r["idle_path"]!=r["attack_path"] for r in rows))
        def fake_attack(unreal,root,skeleton,battle=False):
            return real_clip(unreal,root,skeleton,False)
        with patch.object(source,"find_native_clip",side_effect=fake_attack):
            with self.assertRaisesRegex(RuntimeError,"Distinct real native"):
                installer.inspect_source_assets(fake_unreal,paths)

    def test_development_bridge_can_only_show_actual_server_verified_turn(self):
        header=(NATIVE/"Public/StarfortFabVerifiedBattleBridge.h").read_text()
        bridge=(NATIVE/"Private/StarfortFabVerifiedBattleBridge.cpp").read_text()
        controller=(NATIVE/"Private/StarfortBattleController.cpp").read_text()
        for required in (
            "#if UE_BUILD_SHIPPING", "Turn.bServerVerified",
            "Turn.RoomId.IsEmpty()", "Turn.TeamHeroes.Num()!=3",
            "Turn.VerifiedDamageReceived>0", "Turn.Turn<=LastVerifiedTurn",
            "ActiveServerTeam!=Turn.TeamHeroes", "Turn.LastAction==TEXT(\"strike\")",
            'Turn.LastAction.StartsWith(TEXT("skill:"))',
            "Turn.TeamHeroes.Contains(SkillHero)",
            "Entry.Attack->GetSkeleton()!=Body->GetSkeleton()",
            "UniqueBodies.Contains(Body)", 'TEXT("/Game/Paragon")',
            "PlayNativeClip(Attacker,true)", "ClearReview()",
            "RestoreIdle()", "LastVerifiedTurn=Turn.Turn;",
            "if (bNewRoom)", "return;",
        ):
            self.assertIn(required,bridge)
        for required in (
            'Online->OnBattleReady.AddUniqueDynamic(this,&AStarfortBattleController::TurnReady);',
            "DevFabBridge->PresentVerifiedServerTurn(Turn);",
            "Stage->PresentVerifiedTurn(Turn);",
            "Stage->bArtApprovedForMobile",
            "DevFabBridge->IsReadyForTeam(Turn.TeamHeroes)",
            "DevFabBridge->ClearReview();",
            "#if !UE_BUILD_SHIPPING",
        ):
            self.assertIn(required,controller)
        self.assertIn("bEnableDevelopmentReview = false;",header)
        self.assertIn("TArray<FStarfortFabVerifiedArtBinding> RealFabRigs;",header)
        self.assertIn("TObjectPtr<UAnimSequence> Attack;",header)
        self.assertIn("TObjectPtr<UAnimSequence> Idle;",header)
        self.assertIn("TObjectPtr<ACameraActor> ReviewCamera;",header)
        for prohibited in (
            "SubmitBattleAction(", "StartStoryStage(",
            "OnMissionResult.Broadcast(", "VerifiedDamageDealt =",
            "VerifiedDamageReceived =",
            "GiveReward(", "GrantItem(", "SpendGold(",
            "GetSubsystem<UStarfortOnlineSubsystem>"):
            self.assertNotIn(prohibited,bridge)
        self.assertEqual(bridge.count("{"),bridge.count("}"))

    def test_staging_is_non_destructive_and_never_bypasses_release_art(self):
        script=(TOOLS/"stage_verified_fab_online_battle_v84.py").read_text()
        premium=(NATIVE/"Private/StarfortHeroCombatAsset.cpp").read_text()
        release=(TOOLS/"native_mobile_build.py").read_text()
        for marker in (
            "if not unreal.EditorAssetLibrary.does_asset_exist(MAP):",
            "STARFORT_DEV_SERVER_FAB_",
            "Production-approved stage must not get Paragon test art",
            "refuse re-stage", "user_confirmed_fab_license",
            '"/Script/StarfortUnreal.StarfortFabVerifiedBattleBridge"',
            "if not level.save_current_level():",
            '"production_art_approved":False',
        ):
            self.assertIn(marker,script)
        self.assertIn("if (!bArtApprovedForMobile",premium)
        self.assertIn("validate_premium_art.validate(require_art=True)",release)


if __name__=="__main__":
    unittest.main()
