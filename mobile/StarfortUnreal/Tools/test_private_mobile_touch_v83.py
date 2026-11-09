#!/usr/bin/env python3
"""v83 real native touch + private Fab Android/iOS build preflight.

Checks exact click/touch geometry by compiling portable C++ layout in a
minimal Unreal API stub. This is NOT an Unreal Engine build/device runtime.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import textwrap
import types
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/"Tools"
NATIVE=ROOT/"Source/StarfortUnreal"
sys.path.insert(0,str(TOOLS))
import native_mobile_build as build


class PrivateMobileTouchV83(unittest.TestCase):
    def test_shared_layout_used_by_actual_hud_and_both_touch_mouse_inputs(self):
        layout=(NATIVE/"Public/StarfortFabPreviewLayout.h").read_text()
        control=(NATIVE/"Private/StarfortFabPreviewController.cpp").read_text()
        header=(NATIVE/"Public/StarfortFabPreviewController.h").read_text()
        hud=(NATIVE/"Private/StarfortFabPreviewHUD.cpp").read_text()
        for token in (
            "FStarfortFabPreviewLayout::HitTest(",
            "FStarfortFabPreviewLayout::HeroRow(",
            "FStarfortFabPreviewLayout::BattleAction(",
            "FStarfortFabPreviewLayout::BottomAction(",
        ):
            self.assertIn(token,control+hud)
        for token in (
            "OnPreviewTouchPressed(ETouchIndex::Type FingerIndex",
            "InputComponent->BindTouch(IE_Pressed,this",
            "GetInputTouchState(FingerIndex,X,Y,bPressed)",
            "FStarfortFabPreviewLayout::HitTest(",
            "OnPreviewClick()", "HandlePreviewPointer(",
            "Now-LastPreviewPointerAt<0.12f",
            "EStarfortFabPreviewHit::TeamAttack",
            "EStarfortFabPreviewHit::EnemyAttack",
            "EStarfortFabPreviewHit::WideCamera",
        ):
            self.assertIn(token,header+control)
        for token in ("TELEFONU YATAY ÇEVİR","IsLandscape(Width,Height)",
                      "SPACE SALDIR","Q  3 KAHRAMAN","TAB SAHNE"):
            self.assertIn(token,hud)
        self.assertNotIn("UStarfortOnlineSubsystem",control)
        self.assertNotIn("SubmitBattleAction",control)
        self.assertNotIn("Health -=",control)
        self.assertEqual(control.count("{"),control.count("}"))

    def test_real_shared_hitbox_cpp_logic_on_small_and_large_landscape(self):
        if shutil.which("c++") is None:
            self.skipTest("No C++ compiler for standalone preview layout QA")
        source=r"""
#include "StarfortFabPreviewLayout.h"
#include <cassert>
int main() {
  for (const int W : {844, 1920}) {
    const int H=(W==844?390:1080);
    assert(FStarfortFabPreviewLayout::IsLandscape(W,H));
    for (int i=0;i<7;++i) {
      auto R=FStarfortFabPreviewLayout::HeroRow(W,i);
      assert(R.Width>40 && R.Height>=44);
      assert(FStarfortFabPreviewLayout::HitTest(
        R.X+R.Width/2,R.Y+R.Height/2,W,H,true)==
        static_cast<EStarfortFabPreviewHit>(
          static_cast<int>(EStarfortFabPreviewHit::Hero1)+i));
    }
    for (int i=0;i<3;++i) {
      auto R=FStarfortFabPreviewLayout::BattleAction(W,H,i);
      assert(R.Height>=44);
      assert(FStarfortFabPreviewLayout::HitTest(
         R.X+R.Width/2,R.Y+R.Height/2,W,H,true)==
         static_cast<EStarfortFabPreviewHit>(
           static_cast<int>(EStarfortFabPreviewHit::TeamAttack)+i));
      assert(FStarfortFabPreviewLayout::HitTest(
         R.X+R.Width/2,R.Y+R.Height/2,W,H,false)==
         EStarfortFabPreviewHit::None);
    }
    for (int i=0;i<6;++i) {
      auto R=FStarfortFabPreviewLayout::BottomAction(W,H,i);
      assert(R.Height>=44);
      assert(FStarfortFabPreviewLayout::HitTest(
         R.X+R.Width/2,R.Y+R.Height/2,W,H,true)==
         static_cast<EStarfortFabPreviewHit>(
           static_cast<int>(EStarfortFabPreviewHit::SoloAttack)+i));
    }
    assert(FStarfortFabPreviewLayout::HitTest(-1,30,W,H,true)==
        EStarfortFabPreviewHit::None);
    assert(FStarfortFabPreviewLayout::HitTest(W+5,30,W,H,true)==
        EStarfortFabPreviewHit::None);
    assert(FStarfortFabPreviewLayout::HitTest(5,5,W,H,true)==
        EStarfortFabPreviewHit::None);
    assert(FStarfortFabPreviewLayout::HitTest(20,56,H,W,true)==
        EStarfortFabPreviewHit::None);
  }
}
"""
        mock_header=textwrap.dedent("""
            #pragma once
            #include <cstdint>
            #include <cmath>
            #include <initializer_list>
            using int32=int;
            using uint8=std::uint8_t;
            struct FMath {
                static float Clamp(float x,float a,float b) {
                    return x<a?a:(x>b?b:x);
                }
                template <typename T> static T Max(T a,T b){return a>b?a:b;}
                static bool IsFinite(float x){return std::isfinite(x);}
            };
        """)
        with tempfile.TemporaryDirectory() as td:
            directory=Path(td)
            (directory/"CoreMinimal.h").write_text(mock_header)
            (directory/"private_hit_test.cpp").write_text(source)
            out=directory/"geometry_test"
            result=subprocess.run(
                ["c++","-std=c++17","-Wall","-Wextra","-Werror",
                 "-I",str(directory),"-I",str(NATIVE/"Public"),
                 str(directory/"private_hit_test.cpp"),"-o",str(out)],
                capture_output=True,text=True,timeout=40)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            execute=subprocess.run([str(out)],capture_output=True,text=True,timeout=15)
            self.assertEqual(execute.returncode,0,execute.stdout+execute.stderr)

    def with_fake_private_editor(self,root):
        (root/"Content/Maps").mkdir(parents=True)
        for name in build.PRIVATE_MAPS:
            (root/"Content/Maps"/(name+".umap")).write_bytes(b"REAL-UE-TEST-MOCK")
        for rel in (
          "Source/StarfortUnreal/Private/StarfortFabPreviewController.cpp",
          "Source/StarfortUnreal/Private/StarfortFabPreviewGameMode.cpp",
          "Source/StarfortUnreal/Private/StarfortFabPreviewHUD.cpp",
        ):
            p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text("compile-on-real-UE")
        (root/"StarfortUnreal.uproject").write_text(json.dumps({"EngineAssociation":"5.8"}))
        path=root/"Saved/QA"
        path.mkdir(parents=True)
        (path/"fab_seven_private_selection_v80.json").write_text(json.dumps({
            "source":"user_imported_fab_library",
            "private_preview_only":True,
            "user_confirmed_fab_license":True,
            "selected_skeletal_meshes":{
                "aldren":"/Game/ParagonGreystone/SK_1",
                "rovan":"/Game/ParagonWraith/SK_2",
                "lyra":"/Game/ParagonTheFey/SK_3",
                "doran":"/Game/ParagonKhaimera/SK_4",
            },
        }))
        (path/"Private3v1RealFabBattleAudit_v82.json").write_text(json.dumps({
            "audit_type":"REAL_UNREAL_EDITOR_LOCAL_PRIVATE_3V1_ONLY",
            "interactively_reviewable_in_editor":True,
            "real_ally_skeletal_count":3,
            "real_opponent_skeletal_count":1,
            "real_ally_attack_clip_count":3,
            "real_camera_count":1,
            "scene_name":"L_StarfortPrivateFabBattle_v80",
            "blocking_issues":[],
            "offline_only_no_rewards_no_damage":True,
            "produced_android_ios_game":False,
        }))

    def test_private_iOS_android_preview_requires_local_eula_and_real_editor_evidence(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            with patch.multiple(build,
                ROOT=root,PROJECT=root/"StarfortUnreal.uproject",
                PRIVATE_COMMAND_LINE=root/"UECommandLine.txt",
                PRIVATE_LICENSE=root/"Saved/QA/fab_seven_private_selection_v80.json",
                PRIVATE_AUDIT=root/"Saved/QA/Private3v1RealFabBattleAudit_v82.json"):
                self.with_fake_private_editor(root)
                errors,_=build.validate("ios","private-preview",require_toolchain=False)
                self.assertEqual(errors,[],errors)
                errors,_=build.validate("android","private-preview",require_toolchain=False)
                self.assertEqual(errors,[],errors)
                for platform in ("ios","android"):
                    cmd,_=build.build_command(root/"FakeUE",platform,"private-preview")
                    command=" ".join(cmd)
                    self.assertIn("-clientconfig=Development",command)
                    self.assertNotIn("-distribution",command)
                    self.assertIn("L_StarfortPrivateFabBattle_v80",command)
                    self.assertIn("L_StarfortPrivateFabPlaytest_v80",command)
                    self.assertNotIn("L_StarfortVillage",command)
                    self.assertNotIn("L_StarfortBattle+",command)
                    self.assertIn("private-fab-preview",command)
                with build.temporary_private_preview_startup():
                    self.assertEqual(
                        (root/"UECommandLine.txt").read_text().strip(),
                        build.PRIVATE_BOOT)
                self.assertFalse((root/"UECommandLine.txt").exists())
                # Even a failed Unreal build must clean the temporary startup.
                with self.assertRaisesRegex(RuntimeError,"synthetic"):
                    with build.temporary_private_preview_startup():
                        raise RuntimeError("synthetic build failure")
                self.assertFalse((root/"UECommandLine.txt").exists())
                (root/"UECommandLine.txt").write_text("user-set-existing-arguments")
                with self.assertRaisesRegex(RuntimeError,"never overwrite"):
                    with build.temporary_private_preview_startup():
                        pass
                self.assertEqual((root/"UECommandLine.txt").read_text(),
                                 "user-set-existing-arguments")

    def test_empty_private_art_or_failed_real_editor_audit_blocks_packaging(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            with patch.multiple(build,
                ROOT=root,PROJECT=root/"StarfortUnreal.uproject",
                PRIVATE_COMMAND_LINE=root/"UECommandLine.txt",
                PRIVATE_LICENSE=root/"Saved/QA/fab_seven_private_selection_v80.json",
                PRIVATE_AUDIT=root/"Saved/QA/Private3v1RealFabBattleAudit_v82.json"):
                self.with_fake_private_editor(root)
                local=root/"Saved/QA/fab_seven_private_selection_v80.json"
                info=json.loads(local.read_text())
                info["user_confirmed_fab_license"]=False
                local.write_text(json.dumps(info))
                errors=build.validate_private_preview()
                self.assertTrue(any("EULAs" in e for e in errors))
                info["user_confirmed_fab_license"]=True
                local.write_text(json.dumps(info))
                qa=root/"Saved/QA/Private3v1RealFabBattleAudit_v82.json"
                proof=json.loads(qa.read_text())
                proof["blocking_issues"]=["Missing real animation"]
                qa.write_text(json.dumps(proof))
                errors=build.validate_private_preview()
                self.assertTrue(any("Stale/failed Editor QA" in e for e in errors))

    def test_private_mobile_preview_cannot_bypass_release_gate(self):
        src=(TOOLS/"native_mobile_build.py").read_text()
        self.assertIn('profile == "release"',src)
        self.assertIn("validate_premium_art.validate(require_art=True)",src)
        self.assertIn("temporary_private_preview_startup()",src)
        self.assertIn("UECommandLine.txt",src)
        self.assertIn('profile == "private-preview"',src)
        self.assertNotIn("bArtApprovedForMobile=True",src)


if __name__=="__main__":
    unittest.main()
