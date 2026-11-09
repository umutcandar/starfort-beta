#!/usr/bin/env python3
"""STARFORT v81 private Fab inspector regressions: source-only, NOT UE compilation."""
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/"Tools"
NATIVE=ROOT/"Source/StarfortUnreal"
sys.path.insert(0,str(TOOLS))
import fab_seven_private_preview_v80 as preview


class FakeRig:
    def __init__(self):
        self.asset=None
        self.anim=None
    def set_skeletal_mesh_asset(self,mesh):
        self.asset=mesh
    def set_editor_property(self,key,value):
        assert key=="cast_shadow" and value is True
    def override_animation_data(self,clip,is_looping,is_playing):
        assert is_looping and is_playing
        self.anim=clip


class FakeActor:
    def __init__(self):
        self.rig=FakeRig()
        self.tags=None
        self.label=None
    def get_component_by_class(self,klass):
        return self.rig
    def set_editor_property(self,k,v):
        assert k=="tags"
        self.tags=v
    def set_actor_label(self,label):
        self.label=label
    def get_actor_label(self):
        return self.label


class FakeSpawn:
    def __init__(self):
        self.actor=FakeActor()
    def spawn_actor_from_class(self,klass,position,rotation):
        return self.actor


class TestInteractiveFabPreview(unittest.TestCase):
    def read(self,p):
        return (NATIVE/p).read_text(encoding="utf-8")

    def test_native_preview_only_binds_keyboard_mouse_not_online_economy(self):
        cpp=self.read("Private/StarfortFabPreviewController.cpp")
        h=self.read("Public/StarfortFabPreviewController.h")
        for token in (
            "SFPREVIEW_HERO=", "SFPREVIEW_IDLE=", "SFPREVIEW_ATTACK=",
            "SFPREVIEW_CAMERA", "TActorIterator<ASkeletalMeshActor>",
            "FSoftObjectPath(Source).TryLoad()", "Clip->GetSkeleton()",
            "Rig->PlayAnimation(Clip,!bAttack)",
            "L_StarfortPrivateFabPlaytest_v80",
            "L_StarfortPrivateFabBattle_v80",
            "GetWorld()->GetMapName()", "if (!bPrivatePreview)",
            "IE_Pressed", "EKeys::SpaceBar", "EKeys::Tab",
            "EKeys::LeftMouseButton", "ToggleActualAnimation()",
            "GetMousePosition", "FMath::VInterpTo",
            "StarfortFabPrivate::NumberKeys",
        ):
            self.assertIn(token,cpp)
        for old in (
            "SubmitBattleAction", "OnMissionResult", "UStarfortOnlineSubsystem",
            "VerifiedDamageDealt=", "FGuid::NewGuid()", "FHttpModule",
            "LoadProgress", "StartStoryStage", "ServerAllowedActions"):
            self.assertNotIn(old,cpp)
        self.assertIn("struct FStarfortPrivatePreviewActor",h)
        self.assertIn("TWeakObjectPtr<ASkeletalMeshActor>",h)
        self.assertEqual(cpp.count("{"),cpp.count("}"))

    def test_hud_and_gamemode_are_editor_review_not_retail_game(self):
        hud=self.read("Private/StarfortFabPreviewHUD.cpp")
        mode=self.read("Private/StarfortFabPreviewGameMode.cpp")
        for token in ("DrawHUD()", "GetFocusedHero()", "GetLoadedHeroCount()",
                      "GetPreviewNotice()", "SPACE SALDIR", "TAB SAHNE",
                      "DORAN", "ROVAN", "VESPER"):
            self.assertIn(token,hud)
        for token in ("ASpectatorPawn::StaticClass()",
                      "AStarfortFabPreviewController::StaticClass()",
                      "AStarfortFabPreviewHUD::StaticClass()"):
            self.assertIn(token,mode)
        self.assertNotIn("AStarfortBattleController",mode)
        self.assertNotIn("AStarfortVillageController",mode)
        self.assertNotIn("GetSubsystem<UStarfortOnlineSubsystem>",mode)
        self.assertEqual(hud.count("{"),hud.count("}"))

    def test_real_native_animation_paths_are_attached_to_actual_actor_tags(self):
        source=(TOOLS/"fab_seven_private_preview_v80.py").read_text()
        for token in (
            "SFPREVIEW_HERO=", "SFPREVIEW_SIDE=",
            "SFPREVIEW_IDLE=", "SFPREVIEW_ATTACK=",
            'unreal.Name("SFPREVIEW_CAMERA")',
            '"/Script/StarfortUnreal.StarfortFabPreviewGameMode"',
            "verified_native_attack_clip", "verified_native_idle_clip",
            "attack_candidate!=idle_path",
        ):
            self.assertIn(token,source)
        self.assertNotIn("GameModeBase.static_class()",source)
        self.assertNotIn("bArtApprovedForMobile=True",source)

        mock_unreal=types.SimpleNamespace(
            SkeletalMeshActor=object(),
            SkeletalMeshComponent=object(),
            Vector=lambda *xs:xs,
            Rotator=lambda *xs:xs,
            Name=lambda value:value,
        )
        real_mesh=types.SimpleNamespace(
            get_editor_property=lambda name: object() if name=="skeleton" else None,
            get_path_name=lambda:"/Game/ParagonWraith/SK_Wraith",
        )
        spawn=FakeSpawn()
        idle=(object(),"/Game/ParagonWraith/Idle.Idle")
        attack=(object(),"/Game/ParagonWraith/Attack.Attack")
        def find(ue,root,skeleton,battle=False):
            return attack if battle else idle
        with patch.object(preview,"find_native_clip",side_effect=find):
            data=preview.make_actor(mock_unreal,spawn,"rovan",real_mesh,
                "/Game/ParagonWraith",(0,0,0),(0,0,0),"GALLERY")
        self.assertEqual(data["verified_native_attack_clip"],attack[1])
        self.assertEqual(data["verified_native_idle_clip"],idle[1])
        self.assertEqual(spawn.actor.tags,[
            "SFPREVIEW_HERO=rovan", "SFPREVIEW_SIDE=GALLERY",
            "SFPREVIEW_IDLE="+idle[1], "SFPREVIEW_ATTACK="+attack[1],
        ])
        self.assertIs(spawn.actor.rig.anim,idle[0])

        with patch.object(preview,"find_native_clip",
                          side_effect=lambda ue,root,skeleton,battle=False:idle):
            data=preview.make_actor(mock_unreal,spawn,"rovan",real_mesh,
                "/Game/ParagonWraith",(0,0,0),(0,0,0),"ALLY",battle=True)
        self.assertIsNone(data["verified_native_attack_clip"])
        self.assertEqual(spawn.actor.tags[-1],"SFPREVIEW_ATTACK=")
        self.assertIs(spawn.actor.rig.anim,idle[0])

    def test_private_maps_cannot_accidentally_enter_shipping_maps(self):
        source=(TOOLS/"native_mobile_build.py").read_text()
        config=(ROOT/"Config/DefaultEngine.ini").read_text()
        for private in ("L_StarfortPrivateFabBattle_v80",
                        "L_StarfortPrivateFabPlaytest_v80"):
            self.assertNotIn(private,source)
            self.assertNotIn(private,config)
        original=ROOT/"ContentPipeline/fab_seven_private_preview_v80.json"
        doc=json.loads(original.read_text())
        self.assertTrue(doc["non_shipping"])
        self.assertTrue(doc["source_assets_must_be_acquired_by_user"])
        self.assertTrue(doc["never_mark_production_approved"])

if __name__=="__main__":
    unittest.main()
