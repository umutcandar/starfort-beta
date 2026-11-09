#!/usr/bin/env python3
"""v85: compile/run actual pure UE roster rules with C++ CoreMinimal stub.

This verifies the REAL C++ selection code without pretending to compile
Unreal Engine, ship APK/IPA or download Epic/Fab 3D content.
"""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/"Tools"
sys.path.insert(0,str(TOOLS))
import stage_verified_fab_online_battle_v84 as installer


class GenuineFabSevenRosterTest(unittest.TestCase):
    def test_rig_catalog_matches_user_license_manifest_and_real_server_ids(self):
        manifest=json.loads((ROOT/"ContentPipeline/fab_seven_private_preview_v80.json").read_text())
        sources={h["hero_id"]:h["expected_root"][6:] for h in manifest["heroes"]}
        self.assertEqual(set(sources),set(installer.CANONICAL))
        self.assertEqual(sources,installer.CANONICAL)
        self.assertEqual(len(set(sources.values())),7)
        self.assertEqual(installer.ALLIES,("rovan","aldren","lyra"))
        self.assertEqual(installer.OPPONENT,"doran")

    def test_four_to_seven_user_owned_fab_meshes_may_be_staged(self):
        paths={h:"/Game/"+pkg+"/Meshes/SK_"+h
               for h,pkg in installer.CANONICAL.items()}
        required={h:paths[h] for h in (*installer.ALLIES,installer.OPPONENT)}
        settings={"source":"user_imported_fab_library",
                  "private_preview_only":True,
                  "user_confirmed_fab_license":True,
                  "selected_skeletal_meshes":dict(required)}
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"selection.json"
            old=installer.SELECTION
            try:
                installer.SELECTION=path
                for n in range(4,8):
                    picks=dict(required)
                    for key in ("mira","vesper","eira")[:n-4]:
                        picks[key]=paths[key]
                    settings["selected_skeletal_meshes"]=picks
                    path.write_text(json.dumps(settings))
                    self.assertEqual(installer.load_selection(),picks)
                settings["selected_skeletal_meshes"]["eira"]="/Game/ParagonWraith/Wrong"
                path.write_text(json.dumps(settings))
                with self.assertRaisesRegex(ValueError,"eira"):
                    installer.load_selection()
                settings["selected_skeletal_meshes"]["eira"]=""
                path.write_text(json.dumps(settings))
                self.assertEqual(len(installer.load_selection()),6)
                settings["selected_skeletal_meshes"]["doran"]=""
                path.write_text(json.dumps(settings))
                with self.assertRaisesRegex(ValueError,"doran"):
                    installer.load_selection()
                settings["user_confirmed_fab_license"]=False
                path.write_text(json.dumps(settings))
                with self.assertRaisesRegex(ValueError,"user-accepted"):
                    installer.load_selection()
            finally:
                installer.SELECTION=old

    def test_native_cpp_choose_unused_rig_for_every_three_of_seven(self):
        if not shutil.which("c++"):
            self.skipTest("C++ compiler unavailable: cannot compile local C++ selection rules")
        stub=textwrap.dedent("""
        #pragma once
        #include <string>
        #include <vector>
        using int32=int;
        constexpr int32 INDEX_NONE=-1;
        struct FString {
          std::string s;
          FString()=default;
          FString(const char* p):s(p){}
          explicit FString(std::string v):s(v){}
          bool IsEmpty() const {return s.empty();}
          bool operator==(const FString& o) const{return s==o.s;}
        };
        struct FName {
          std::string s;
          FName(const char* p):s(p){}
          FName()=default;
          FString ToString() const{return FString(s);}
        };
        template <typename T> struct TArray:std::vector<T> {
          using std::vector<T>::vector;
          int32 Num() const{return static_cast<int32>(this->size());}
          bool Contains(const FString& v) const {
            for(const auto& x:*this)if(x==v)return true;
            return false;
          }
          void Add(const T& v){this->push_back(v);}
        };
        """)
        cpp=textwrap.dedent("""
        #include "StarfortFabDevRosterRules.h"
        #include <cassert>
        #include <array>
        int main() {
          const std::array<const char*,7> names={
            "rovan","aldren","lyra","mira","doran","vesper","eira"
          };
          TArray<FName> ids;
          TArray<bool> prefs;
          for(int i=0;i<7;++i){ids.Add(FName(names[i]));prefs.Add(i==4);}
          int combinations=0;
          for(int a=0;a<7;++a) for(int b=a+1;b<7;++b)
            for(int c=b+1;c<7;++c) {
              TArray<FString> team{names[a],names[b],names[c]};
              const int selected=FStarfortFabDevRosterRules::ChooseUnused(ids,prefs,team);
              assert(selected>=0 && selected<7);
              assert(selected!=a && selected!=b && selected!=c);
              if(a!=4 && b!=4 && c!=4)assert(selected==4);
              else {
                int first=0;
                while(first==a || first==b || first==c)++first;
                assert(selected==first);
              }
              ++combinations;
            }
          assert(combinations==35);
          // Existing 4-rig real Fab configuration remains compatible.
          TArray<FName> four{"rovan","aldren","lyra","doran"};
          TArray<bool> flags{false,false,false,true};
          assert(FStarfortFabDevRosterRules::ChooseUnused(
            four,flags,TArray<FString>{"rovan","aldren","lyra"})==3);
          // Doran can itself be server-selected, with an unused real 3D
          // character serving as the temporary enemy visual.
          assert(FStarfortFabDevRosterRules::ChooseUnused(
            four,flags,TArray<FString>{"aldren","lyra","doran"})==0);
          assert(FStarfortFabDevRosterRules::ChooseUnused(
            four,flags,TArray<FString>{"doran","lyra","rovan"})==1);
          assert(FStarfortFabDevRosterRules::ChooseUnused(
            four,TArray<bool>{false},TArray<FString>{"rovan","aldren","lyra"})
             ==INDEX_NONE);
          return 0;
        }
        """)
        with tempfile.TemporaryDirectory() as td:
            tmp=Path(td)
            (tmp/"CoreMinimal.h").write_text(stub)
            (tmp/"check.cpp").write_text(cpp)
            output=tmp/"check"
            compilation=subprocess.run([
                "c++","-std=c++17","-Wall","-Wextra","-Werror",
                "-I",str(tmp),"-I",str(ROOT/"Source/StarfortUnreal/Public"),
                str(tmp/"check.cpp"),"-o",str(output)],
                capture_output=True,text=True,timeout=40)
            self.assertEqual(compilation.returncode,0,
                             compilation.stdout+compilation.stderr)
            execution=subprocess.run([str(output)],capture_output=True,text=True,timeout=15)
            self.assertEqual(execution.returncode,0,
                             execution.stdout+execution.stderr)

    def test_real_development_bridge_validates_team_and_formation_cleanup(self):
        source=(ROOT/"Source/StarfortUnreal/Private/StarfortFabVerifiedBattleBridge.cpp").read_text()
        header=(ROOT/"Source/StarfortUnreal/Public/StarfortFabVerifiedBattleBridge.h").read_text()
        controller=(ROOT/"Source/StarfortUnreal/Private/StarfortBattleController.cpp").read_text()
        for needle in (
            "RealFabRigs.Num()<4", "RealFabRigs.Num()>7",
            "ChooseUnusedEnemyRig(Turn.TeamHeroes)",
            "FStarfortFabDevRosterRules::ChooseUnused(",
            "ActiveServerTeam.Contains(Entry.HeroId.ToString())",
            "I==OpponentIndex", "RestoreOriginalFormation()",
            "PositionCurrentFormation()", "OriginalActorTransforms",
            "UniqueBindingIds.Contains(Entry.HeroId)",
            "UniqueBodies.Contains(Body)",
            "UniqueTeam.Contains(Hero)",
            "FindTeamSlot(Hero)==INDEX_NONE",
            "if (Turn.Turn<=LastVerifiedTurn) return;",
            "Turn.VerifiedDamageReceived>0",
            "StarfortV85DevArt::AuthenticClipLength(",
            "#if UE_BUILD_SHIPPING",
            "RestoreIdle();",
        ):
            self.assertIn(needle,source+header)
        self.assertIn("Online->OnBattleReady.AddUniqueDynamic",controller)
        self.assertIn("DevFabBridge->PresentVerifiedServerTurn(Turn);",controller)
        self.assertNotIn("SubmitBattleAction(",source)
        self.assertNotIn("OnMissionResult.Broadcast",source)
        self.assertNotIn("GiveReward(",source)
        self.assertEqual(source.count("{"),source.count("}"))


if __name__=="__main__":
    unittest.main()
