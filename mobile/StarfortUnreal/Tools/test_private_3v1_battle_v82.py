#!/usr/bin/env python3
"""v82 private Fab 3v1: actual scene contract and source-only fake Editor tests.

These don't replace a real UE5.8 compilation or a real imported Epic asset.
"""
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

TOOLS=Path(__file__).resolve().parent
ROOT=TOOLS.parent
sys.path.insert(0,str(TOOLS))
import verify_private_fab_battle_v82 as qa
import fab_seven_private_preview_v80 as stage


class Named:
    def __init__(self,n):self.n=n
    def get_name(self):return self.n


class Skeleton:
    def __init__(self,path):self.path=path
    def get_path_name(self):return self.path


class Asset:
    def __init__(self,asset_path,cls="SkeletalMesh",skeletal_path="/Game/ParagonShared/Skeleton"):
        self.path=asset_path;self.cls=cls;self.skeleton=Skeleton(skeletal_path)
    def get_path_name(self):return self.path
    def get_class(self):return Named(self.cls)
    def get_editor_property(self,key):
        if key=="skeleton":return self.skeleton
        if key=="materials":return ["PBR1","PBR2"]
        raise AttributeError(key)


class MockActor:
    def __init__(self,cls,tags,mesh=None):
        self.cls=cls;self.tags=tags;self.mesh=mesh
    def get_editor_property(self,name):
        assert name=="tags"
        return self.tags
    def get_class(self):return Named(self.cls)
    def get_component_by_class(self,klass):
        if self.cls=="SkeletalMeshActor":
            return types.SimpleNamespace(get_skeletal_mesh_asset=lambda:self.mesh)
        return None


def rig_actor(hid,side,suffix,attack=True):
    root="/Game/Paragon"+suffix
    return MockActor("SkeletalMeshActor",[
        "SFPREVIEW_HERO="+hid,"SFPREVIEW_SIDE="+side,
        "SFPREVIEW_IDLE="+root+"/Idle.Idle",
        "SFPREVIEW_ATTACK="+(root+"/Attack.Attack" if attack else ""),
    ],Asset(root+"/Mesh.SK_"+suffix,skeletal_path=root+"/SK_Skeleton"))


def factory(attack=True):
    actors=[
        rig_actor("rovan","ALLY","Wraith",attack),
        rig_actor("aldren","ALLY","Greystone",attack),
        rig_actor("lyra","ALLY","TheFey",attack),
        rig_actor("doran","OPPONENT","Khaimera",attack),
        MockActor("CameraActor",["SFPREVIEW_CAMERA"]),
    ]
    library={}
    for actor in actors:
        if actor.cls!="SkeletalMeshActor":continue
        for tag in actor.tags:
            if tag.startswith(("SFPREVIEW_IDLE=","SFPREVIEW_ATTACK=")):
                path=tag.split("=",1)[1]
                if path:library[path]=Asset(path,cls="AnimSequence",
                    skeletal_path=actor.mesh.skeleton.path)
    class Lib:
        @staticmethod
        def does_asset_exist(path):return path in library
        @staticmethod
        def load_asset(path):return library.get(path)
    unreal=types.SimpleNamespace(EditorAssetLibrary=Lib,
                                  SkeletalMeshComponent=object())
    return unreal,actors,library


class PrivateBattleV82(unittest.TestCase):
    def test_real_four_skeletal_rigs_and_authoritative_no_damage_boundary(self):
        unreal,actors,_=factory()
        actual=qa.audit_scene(unreal,actors,
            "/Game/Maps/L_StarfortPrivateFabBattle_v80",
            "StarfortFabPreviewGameMode")
        self.assertTrue(actual["interactively_reviewable_in_editor"],actual)
        self.assertEqual(actual["real_ally_skeletal_count"],3)
        self.assertEqual(actual["real_opponent_skeletal_count"],1)
        self.assertEqual(actual["real_ally_attack_clip_count"],3)
        self.assertEqual(actual["real_camera_count"],1)
        self.assertFalse(actual["server_authoritative_starfort_battle_tested"])
        self.assertFalse(actual["produced_android_ios_game"])
        self.assertTrue(actual["offline_only_no_rewards_no_damage"])

    def test_no_fake_3v1_when_missing_clip_or_warrior(self):
        unreal,actors,library=factory(attack=False)
        result=qa.audit_scene(unreal,actors,qa.EXPECTED,"StarfortFabPreviewGameMode")
        self.assertFalse(result["interactively_reviewable_in_editor"])
        self.assertEqual(result["real_ally_attack_clip_count"],0)
        self.assertTrue(any("No real" in e for e in result["blocking_issues"]))
        unreal,actors,lib=factory()
        del actors[0]
        result=qa.audit_scene(unreal,actors,qa.EXPECTED,"StarfortFabPreviewGameMode")
        self.assertFalse(result["interactively_reviewable_in_editor"])
        self.assertTrue(any("exactly 3" in e for e in result["blocking_issues"]))

    def test_no_prereview_access_to_production_map_or_gamemode(self):
        unreal,actors,_=factory()
        for map_name,mode in [
            ("L_StarfortBattle","StarfortFabPreviewGameMode"),
            (qa.EXPECTED,"StarfortBattleGameMode"),
            ("L_StarfortVillage","StarfortVillageGameMode"),
        ]:
            result=qa.audit_scene(unreal,actors,map_name,mode)
            self.assertFalse(result["interactively_reviewable_in_editor"])

    def test_duplicate_skin_and_mismatched_original_animation_are_rejected(self):
        unreal,actors,library=factory()
        actors[1].mesh=actors[0].mesh
        report=qa.audit_scene(unreal,actors,qa.EXPECTED,"StarfortFabPreviewGameMode")
        self.assertFalse(report["interactively_reviewable_in_editor"])
        self.assertTrue(any("Distinct real source meshes" in x for x in report["blocking_issues"]))
        unreal,actors,library=factory()
        clip_path=qa.tag_value(actors[0],"SFPREVIEW_ATTACK=")
        library[clip_path].skeleton=Skeleton("/Game/EvilDifferentSkeleton")
        report=qa.audit_scene(unreal,actors,qa.EXPECTED,"StarfortFabPreviewGameMode")
        self.assertFalse(report["interactively_reviewable_in_editor"])
        self.assertTrue(any("wrong_skeleton" in x for x in report["blocking_issues"]))

    def test_real_attacks_are_not_looping_on_stage_load(self):
        class FakeComponent:
            def __init__(self):self.clip=None
            def set_skeletal_mesh_asset(self,asset):self.mesh=asset
            def set_editor_property(self,name,val):pass
            def override_animation_data(self,clip,is_looping,is_playing):
                self.clip=clip
                self.assertion=(is_looping,is_playing)
        class FakeActor:
            def __init__(self):
                self.comp=FakeComponent();self.tags=[]
            def get_component_by_class(self,k):return self.comp
            def set_editor_property(self,k,v):self.tags=v
            def set_actor_label(self,value):self.label=value
            def get_actor_label(self):return self.label
        actor=FakeActor()
        ue=types.SimpleNamespace(SkeletalMeshActor=object(),SkeletalMeshComponent=object(),
             Vector=lambda *xs:xs,Rotator=lambda *xs:xs,Name=lambda name:name)
        spawner=types.SimpleNamespace(spawn_actor_from_class=lambda klass,loc,rot:actor)
        mesh=types.SimpleNamespace(
            get_editor_property=lambda key:"/Game/ParagonWraith/Skeleton",
            get_path_name=lambda:"/Game/ParagonWraith/SK_Wraith")
        idle=object();attack=object()
        with patch.object(stage,"find_native_clip",
              side_effect=lambda unreal,root,skel,battle=False:
               (attack,"/Game/ParagonWraith/Attack.Attack") if battle else
               (idle,"/Game/ParagonWraith/Idle.Idle")):
            row=stage.make_actor(ue,spawner,"rovan",mesh,
                 "/Game/ParagonWraith",(0,0,0),(0,0,0),"ALLY",battle=True)
        self.assertIs(actor.comp.clip,idle)
        self.assertEqual(actor.comp.assertion,(True,True))
        self.assertEqual(row["verified_native_attack_clip"],
                         "/Game/ParagonWraith/Attack.Attack")

    def test_genuine_clips_drive_private_sequence_not_online_hp(self):
        source=(ROOT/"Source/StarfortUnreal/Private/StarfortFabPreviewController.cpp").read_text()
        hud=(ROOT/"Source/StarfortUnreal/Private/StarfortFabPreviewHUD.cpp").read_text()
        header=(ROOT/"Source/StarfortUnreal/Public/StarfortFabPreviewController.h").read_text()
        for token in (
            "QueueThreeHeroAttackPreview()", "PlayOpponentAnimationPreview()",
            "ToggleWideBattleCamera()", "EKeys::Q", "EKeys::E", "EKeys::B",
            'Entry.SourceSide==TEXT("ALLY")', 'Entry.SourceSide==TEXT("OPPONENT")',
            "GetPlayLength()", "CompletedPrivateAttackCount",
            "FMath::Sin(PI*Progress)", "Attacker->SetActorLocation(ActiveAttackStartPosition)",
            "bPrivateSequenceActive", "GetRealBattleAllyCount()!=3",
            "GetRealBattleOpponentCount()!=1", "FMath::VInterpTo",
        ):
            self.assertIn(token,source+header)
        for key in ("Q  3 KAHRAMAN","E  RAKİP ANİMASYONU",
                    "B  GENİŞ/YAKIN KAMERA","GetPrivateBattleStatus"):
            self.assertIn(key,hud)
        for prohibited in (
            "RequestMissionReward", "VerifiedDamageDealt=",
            "OnMissionResult.Broadcast(", "SubmitBattleAction(",
            "LoadProgress()", "UStarfortOnlineSubsystem",
            "TriggerPurchase", "CreateSession", "WalletBalance"):
            self.assertNotIn(prohibited,source)
        self.assertEqual(source.count("{"),source.count("}"))

    def test_not_cooked_into_mobile_distribution(self):
        import native_mobile_build as builds
        for profile in ("smoke","release"):
            cmd,_=builds.build_command(Path("/UE"),"android",profile)
            cooked=next(arg for arg in cmd if arg.startswith("-map="))
            self.assertNotIn(qa.EXPECTED,cooked)
            self.assertNotIn("L_StarfortPrivateFabBattle_v80",cooked)
        private_cmd,_=builds.build_command(Path("/UE"),"android","private-preview")
        self.assertIn("L_StarfortPrivateFabBattle_v80"," ".join(private_cmd))
        self.assertNotIn("-distribution",private_cmd)
        self.assertIn("non_shipping",str(stage.MANIFEST.read_text()))


if __name__=="__main__":
    unittest.main()
