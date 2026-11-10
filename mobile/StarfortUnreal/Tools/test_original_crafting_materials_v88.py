#!/usr/bin/env python3
"""STARFORT v88: real seven-material Unreal source contract and secured loot.

The separate GitHub PostgreSQL 16 workflow actually compiles/runs the SQL
migration. This source QA compiles actual C++ catalog without pretending to
compile Unreal Engine or test on a phone.
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


class OriginalMaterialsV88(unittest.TestCase):
    def test_exact_seven_original_material_identities_match_future_catalogue(self):
        design=json.loads((ROOT/"ContentPipeline/equipment_future_v87.json").read_text())
        expected={v["id"] for v in design["new_materials"]}
        src=(SOURCE/"Private/StarfortCraftingMaterials.cpp").read_text()
        actual=set(re.findall(r'\{TEXT\("([a-z_]+)"\),TEXT\("',src))
        self.assertEqual(len(expected),7)
        self.assertEqual(actual,expected)
        sql=(REPO/"starfort/sql/starfort-v256-original-crafting-materials.sql").read_text()
        for ident in expected:
            self.assertIn(ident,sql)
            self.assertIn(ident,src)
        self.assertIn("v_mode='story'",sql)
        self.assertIn("v_mode='boss'",sql)
        self.assertIn("v_mode='rift'",sql)
        self.assertIn("v_mode='veteran'",sql)

    def test_executable_actual_cpp_catalogue(self):
        if not shutil.which("c++"):
            self.skipTest("C++ compiler unavailable")
        stub=textwrap.dedent("""
            #pragma once
            #include <string>
            #include <vector>
            using TCHAR=char;
            #define TEXT(x) x
            struct FString:std::string{
              using std::string::string;
              FString(const std::string& str):std::string(str){}
            };
            template<class T> struct TArray:std::vector<T>{
              using std::vector<T>::vector;
            };
        """)
        program=textwrap.dedent("""
            #include "StarfortCraftingMaterials.h"
            #include <cassert>
            #include <set>
            int main(){
              const auto& catalog=FStarfortCraftingMaterialCatalog::All();
              assert(catalog.size()==7);
              std::set<std::string> ids;
              for(const auto& item:catalog){
                ids.insert(item.Id);
                assert(std::string(item.Name).length()>5);
                assert(std::string(item.Shape).length()>8);
                assert(std::string(item.Source).length()>10);
              }
              assert(ids.size()==7);
              assert(FStarfortCraftingMaterialCatalog::Find("star_glass"));
              assert(FStarfortCraftingMaterialCatalog::Find("guardian_stamp"));
              assert(!FStarfortCraftingMaterialCatalog::Find("made_up_loot"));
              assert(FStarfortCraftingMaterialCatalog::IsFocus("weapon"));
              assert(FStarfortCraftingMaterialCatalog::IsFocus("armor"));
              assert(FStarfortCraftingMaterialCatalog::IsFocus("relic"));
              assert(!FStarfortCraftingMaterialCatalog::IsFocus("all"));
              return 0;
            }
        """)
        with tempfile.TemporaryDirectory() as directory:
            d=Path(directory)
            (d/"CoreMinimal.h").write_text(stub)
            (d/"test.cpp").write_text(program)
            binary=d/"craft"
            r=subprocess.run(["c++","-std=c++17","-Wall","-Wextra","-Werror",
                "-I",str(d),"-I",str(SOURCE/"Public"),
                str(d/"test.cpp"),str(SOURCE/"Private/StarfortCraftingMaterials.cpp"),
                "-o",str(binary)],capture_output=True,text=True,timeout=45)
            self.assertEqual(r.returncode,0,r.stderr)
            run=subprocess.run([str(binary)],capture_output=True,text=True,timeout=15)
            self.assertEqual(run.returncode,0,run.stderr)

    def test_real_postgres_authority_and_nonreplay_conditions(self):
        sql=(REPO/"starfort/sql/starfort-v256-original-crafting-materials.sql").read_text().lower()
        needed=(
            "security definer set search_path to ''",
            "auth.uid()",
            "p_action not in ('get','focus')",
            "old.mission is null",
            "new.mission is not null",
            "new.last_report is not distinct from old.last_report",
            "if v_mode is null or v_mode<>old.mission->>'mode'",
            "on conflict do nothing",
            "for update",
            "from public.starfort_world_boss_contribution",
            "source_type='daily_story'",
            "bucket=v_day)<3",
            "v_stage between 5 and 8 and v_stars=3",
            "v_mode='veteran' and v_stage>=5 and v_tier>=2 and v_stars=3",
            "alter table public.starfort_crafting_material_wallet enable row level security",
            "revoke all on public.starfort_crafting_material_wallet from public,anon,authenticated",
            "revoke all on public.starfort_crafting_material_awards from public,anon,authenticated",
            "grant execute on function public.sfb_crafting_materials(text,text,uuid)",
        )
        for item in needed:
            self.assertIn(item,sql)
        self.assertNotIn("create or replace function public.sfb_starfort_progress(",sql)
        self.assertNotIn("starfort_player_progress set inventory=",sql)
        self.assertNotIn("starfort_village_ledger set res=",sql)
        self.assertIn("starfort-v256-original-crafting-materials.sql",
                      (REPO/".github/workflows/starfort-crafting-materials-qa.yml").read_text())

    def test_native_materials_never_claim_or_grant_offline_items(self):
        api=(SOURCE/"Private/StarfortOnlineSubsystem.cpp").read_text()
        ui=(SOURCE/"Private/StarfortBagScreen.cpp").read_text()
        control=(SOURCE/"Private/StarfortMobilePlayerController.cpp").read_text()
        header=(SOURCE/"Public/StarfortOnlineSubsystem.h").read_text()
        for x in (
            "ParseMaterials(", "sfb_crafting_materials",
            "bMaterialsPending=true", "bMaterialsPending=false",
            "FStarfortMaterialSnapshot Data;",
            "OnMaterialsReady.Broadcast(Data)",
            "OnMaterialsUnavailable.Broadcast(",
            "StarfortOnline::IsIntegerField(Items,Entry.Id,0,100000,Count)",
            'Body->SetStringField(TEXT("p_action")',
            "FGuid::NewGuid().ToString",
        ):
            self.assertIn(x,api)
        for x in (
            'ActiveFilter==TEXT("materials")',
            'TEXT("material:")+Id', 'TEXT("focus:")+Id',
            "ApplyVerifiedMaterials(", "SetMaterialsWaiting()",
            "bMaterialsVerified && !bMaterialFocusPending",
            "OnMaterialFocusRequested.Broadcast(Id)",
            "return; // Material fragments cannot be equipped",
        ):
            self.assertIn(x,ui)
        for x in (
            "Online->LoadCraftingMaterials()",
            "Online->SetCraftingFocus(FocusSlot)",
            "OnMaterialsUnavailable.AddUniqueDynamic",
            "ActiveBagScreen->SetMaterialsWaiting()",
            "ActiveBagScreen->ApplyVerifiedMaterials(Snapshot)",
        ):
            self.assertIn(x,control)
        self.assertIn("bool bServerVerified=false;",header)
        self.assertNotIn("RealMaterials.Counts.Add(",ui)
        self.assertNotIn("Verified.Inventory.Add(",ui)
        self.assertNotIn("Verified.Gold+=",ui)
        # All mutations continue to go through authenticated server RPC.
        self.assertNotIn("AddMaterialToInventory(",api)


if __name__=="__main__":
    unittest.main()
