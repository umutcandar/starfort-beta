#!/usr/bin/env python3
"""v87: exact CURRENT live equipment economy vs proposed assets (no live grants).

C++ source is compiled under a portable CoreMinimal stub to exercise ACTUAL
FStarfortGearEconomy logic. This is NOT an Unreal Engine editor/device test.
"""
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import textwrap
import unittest

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
SOURCE=ROOT/"Source/StarfortUnreal"
CATALOG=ROOT/"ContentPipeline/equipment_future_v87.json"


class EquipmentEconomyV87(unittest.TestCase):
    def test_19_live_items_and_twelve_planned_have_distinct_ids(self):
        live=(REPO/"starfort/equipment.js").read_text()
        ids=re.findall(r"\bid:'([a-z_]+)'",live)
        self.assertEqual(len(ids),19)
        self.assertEqual(len(ids),len(set(ids)))
        future=json.loads(CATALOG.read_text())
        self.assertEqual(future["existing_live"]["items"],19)
        self.assertEqual(future["existing_live"]["full_active_team_copies"],9)
        self.assertEqual(future["existing_live"]["all_seven_heroes_full_equipment_copies"],21)
        new=future["new_items"]
        self.assertEqual(len(new),12)
        self.assertEqual(len({i["id"] for i in new}),12)
        self.assertFalse({i["id"] for i in new}&set(ids))
        self.assertEqual(
            {slot:sum(i["slot"]==slot for i in new)
              for slot in ("weapon","armor","relic")},
            {"weapon":4,"armor":4,"relic":4})
        for item in new:
            self.assertEqual(item["gameplay_state"],"design_only_not_obtainable")
            self.assertTrue(item["visual_silhouette"])
            self.assertGreaterEqual(len(item["visual_silhouette"]),65)
            self.assertTrue(item["role_fit"])
            self.assertTrue(item["proposed_unlock_source"])
            self.assertTrue(set(item["proposed_stats"]) <=
                            {"attack","hp","armor","healing"})

    def test_seven_materials_are_future_only_with_concrete_earn_sources(self):
        future=json.loads(CATALOG.read_text())
        materials=future["new_materials"]
        self.assertEqual(len(materials),7)
        self.assertEqual(len({m["id"] for m in materials}),7)
        for material in materials:
            self.assertEqual(material["gameplay_state"],"planned_not_live")
            self.assertTrue(material["silhouette"])
            self.assertTrue(material["source"])
            self.assertGreater(len(material["silhouette"]),35)
        policy=future["farming_policy_proposed"]
        self.assertIn("idempotent",policy["server_authority"])
        self.assertTrue(policy["do_not_affect_existing_story_first_clear_rewards"])
        self.assertIn("OR",policy["weekly_constellation_chart"])

    def test_preserves_real_mastery_1_to_5_and_14_week_gate(self):
        future=json.loads(CATALOG.read_text())
        upgrade=future["upgrade_policy"]
        self.assertTrue(upgrade["preserve_rank_1_to_5_costs"])
        self.assertFalse(upgrade["consume_equipment_copies"])
        self.assertEqual(upgrade["random_failure_probability"],0)
        for tier,rate in upgrade["tier_multipliers"].items():
            self.assertEqual(upgrade["mastery_totals"][tier],
                {"gold":120*55*rate,"stone":40*15*rate,
                 "aether":8*55*rate})
        asc=upgrade["ascension_recipes_future_optional"]
        self.assertEqual([x["boss_unique_weeks"] for x in asc],[2,5,9,14])
        self.assertEqual([x["rank"] for x in asc],[1,2,3,4])
        total=upgrade["ascension_fragments_total_for_rank_4"]
        for key in total:
            self.assertEqual(sum(x[key] for x in asc),total[key])
        self.assertEqual(sum(x["legacy_gold"] for x in asc),42000)
        self.assertEqual(sum(x["legacy_stone"] for x in asc),4200)
        self.assertEqual(sum(x["legacy_aether"] for x in asc),3000)

    def test_current_live_sql_forge_and_ascension_equal_read_only_cpp_codex(self):
        sql=(REPO/"starfort/sql/starfort-v255-first-minute-combat.sql").read_text()
        cpp=(SOURCE/"Private/StarfortGearEconomy.cpp").read_text()
        sqlrec=dict()
        forge=sql.split("elsif p_action='forge' then",1)[1].split("elsif p_action='ascend' then",1)[0]
        for match in re.finditer(
            r"\('([a-z_]+)','(weapon|armor|relic)',\d+,'(\{[^']+\})'::jsonb\)",forge):
            sqlrec[match.group(1)]=json.loads(match.group(3))
        self.assertEqual(len(sqlrec),12)
        cpprec={}
        for match in re.finditer(
            r'if\(Id==TEXT\("([a-z_]+)"\)\)return \{(\d+),(\d+),(\d+),(\d+),true\};',cpp):
            cpprec[match.group(1)]={k:v for k,v in zip(
                ("gold","wood","stone","aether"),
                (int(match.group(i)) for i in range(2,6))) if v}
        self.assertEqual(sqlrec,cpprec)
        self.assertIn('const int32 Required[4]={2,5,9,14}',cpp)
        self.assertIn("1400*NextRank*NextRank",cpp)
        self.assertIn("420*NextRank",cpp)
        self.assertIn("100*NextRank*NextRank",cpp)

    def test_compiles_and_executes_actual_native_current_economy_cpp(self):
        if not shutil.which("c++"):
            self.skipTest("standalone C++ compiler is unavailable")
        stub=textwrap.dedent(r"""
            #pragma once
            #include <string>
            #include <vector>
            #include <cstdio>
            #include <cstdarg>
            using int32=int;
            using TCHAR=char;
            #define TEXT(x) x
            struct FString:std::string {
              using std::string::string;
              FString(const std::string& x):std::string(x){}
              static FString Printf(const char* fmt,...){
                char buf[256];va_list args;va_start(args,fmt);
                std::vsnprintf(buf,sizeof(buf),fmt,args);
                va_end(args);return FString(buf);
              }
              template<class T> static FString Join(const T& xs,const char* delim){
                std::string result;
                for(auto& x:xs){if(!result.empty())result+=delim;result+=x;}
                return FString(result);
              }
            };
            template<class T>struct TArray:std::vector<T> {
              using std::vector<T>::vector;
              int32 Num() const{return (int32)this->size();}
              void Add(const T& x){this->push_back(x);}
            };
            struct FLinearColor {
              float r,g,b,a;
              FLinearColor(float x,float y,float z,float w):r(x),g(y),b(z),a(w){}
            };
        """)
        test_cpp=textwrap.dedent(r"""
            #include "StarfortGearEconomy.h"
            #include <cassert>
            int main(){
              auto sword=FStarfortGearEconomy::CurrentForgeCost("starbreaker");
              assert(sword.bAvailable && sword.Gold==1450 &&
                     sword.Essence==220 && sword.Stone==0);
              assert(!FStarfortGearEconomy::CurrentForgeCost("moon_watch").bAvailable);
              assert(!FStarfortGearEconomy::CurrentForgeCost("dream_weapon").bAvailable);
              auto first=FStarfortGearEconomy::NextMasteryCost("starbreaker",0);
              auto last=FStarfortGearEconomy::NextMasteryCost("starbreaker",4);
              assert(first.bAvailable && first.Gold==360 && first.Stone==120 && first.Essence==24);
              assert(last.bAvailable && last.Gold==9000 && last.Stone==600 && last.Essence==600);
              assert(!FStarfortGearEconomy::NextMasteryCost("starbreaker",5).bAvailable);
              auto rare=FStarfortGearEconomy::NextMasteryCost("iron_sword",0);
              auto epic=FStarfortGearEconomy::NextMasteryCost("ember_blade",0);
              assert(rare.Gold==120 && epic.Gold==240);
              int32 weeks=0;FStarfortGearResourceCost cost;
              assert(FStarfortGearEconomy::CurrentAscension("starbreaker",4,weeks,cost));
              assert(weeks==14 && cost.Gold==22400 && cost.Stone==1680
                     && cost.Essence==1600);
              assert(!FStarfortGearEconomy::CurrentAscension("ashes_plate",1,weeks,cost));
              assert(!FStarfortGearEconomy::CurrentAscension("starbreaker",5,weeks,cost));
              auto origin=FStarfortGearEconomy::CurrentAcquisition("moon_watch");
              assert(origin.find("3")!=std::string::npos);
              return 0;
            }
        """)
        with tempfile.TemporaryDirectory() as d:
            tmp=Path(d)
            (tmp/"CoreMinimal.h").write_text(stub)
            (tmp/"test.cpp").write_text(test_cpp)
            exe=tmp/"economy"
            proc=subprocess.run(
              ["c++","-std=c++17","-Wall","-Wextra","-Werror",
               "-I",str(tmp),"-I",str(SOURCE/"Public"),
               str(tmp/"test.cpp"),
               str(SOURCE/"Private/StarfortGearEconomy.cpp"),
               str(SOURCE/"Private/StarfortBagCatalog.cpp"),
               "-o",str(exe)],text=True,capture_output=True,timeout=45)
            self.assertEqual(proc.returncode,0,proc.stderr)
            run=subprocess.run([str(exe)],text=True,capture_output=True,timeout=15)
            self.assertEqual(run.returncode,0,run.stderr)

    def test_on_real_native_bag_current_costs_and_auth_only(self):
        src=(SOURCE/"Private/StarfortBagScreen.cpp").read_text()
        api=(SOURCE/"Private/StarfortOnlineSubsystem.cpp").read_text()
        ctrl=(SOURCE/"Private/StarfortMobilePlayerController.cpp").read_text()
        for needle in ("CurrentForgeCost(ItemId)","NextMasteryCost(ItemId,Mastery)",
                       "CurrentAcquisition(ItemId)","CurrentAscension(",
                       "Yıldız İşleme","BossSeals","DetailsScroll",
                       "bMutationPending=true","OnMutationRequested.Broadcast"):
            self.assertIn(needle,src)
        for needle in ("IsIntegerField(Root,TEXT(\"bossSeals\"),0,5000,BossWeeks)",
                       "Out.bAscensionVerified=true",
                       "SubmitProgressAction(TEXT(\"ascend\"),ItemId,TEXT(\"\"))",
                       'Action!=TEXT("ascend")',
                       'Out.Inventory.Contains(Pair.Key)'):
            self.assertIn(needle,api)
        self.assertIn('Online->AscendGear(Target)',ctrl)
        self.assertNotIn('Inventory.Add(TEXT("starbreaker"),1)',api)
        self.assertNotIn('Verified.Gold -=',src)


if __name__=="__main__":
    unittest.main()
