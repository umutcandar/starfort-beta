#!/usr/bin/env python3
"""v86 real native UMG bag: backend catalogue parity and source-flow checks.

This verifies actual immutable C++ catalogue with a portable C++ compiler and
asserts the UMG/server RPC wiring. Not a UE5.8 editor/device render test.
"""
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
SOURCE=ROOT/"Source/StarfortUnreal"


def read(relative):
    return (SOURCE/relative).read_text(encoding="utf-8")


class NativeBagInventoryV86(unittest.TestCase):
    def test_equipment_catalog_matches_actual_existing_server_supported_inventory(self):
        js=(REPO/"starfort/equipment.js").read_text(encoding="utf-8")
        cpp=read("Private/StarfortBagCatalog.cpp")
        js_ids=set(re.findall(r"\bid:'([a-z_]+)'",js))
        cpp_ids=set(re.findall(r'\{TEXT\("([a-z_]+)"\),TEXT\("',cpp))
        self.assertEqual(js_ids,cpp_ids)
        self.assertIn("starbreaker",cpp_ids)
        self.assertIn("ashes_plate",cpp_ids)
        self.assertIn("guardian_seal",cpp_ids)
        self.assertEqual(len(cpp_ids),19)
        self.assertIn('TEXT("Yıldızkıran Kılıç")',cpp)
        self.assertIn('TEXT("Küllerin Zırhı")',cpp)
        self.assertIn('TEXT("Koruyucu Mühür")',cpp)

    def test_native_static_item_catalogue_real_cpp_compiles_and_runs(self):
        if not shutil.which("c++"):
            self.skipTest("no standalone C++ compiler")
        header=textwrap.dedent("""
            #pragma once
            #include <string>
            #include <vector>
            using int32=int;
            using TCHAR=char;
            #define TEXT(x) x
            struct FString:std::string {
              using std::string::string;
              FString(const std::string& s):std::string(s){}
            };
            template<typename T> struct TArray:std::vector<T> {
              using std::vector<T>::vector;
              int32 Num() const{return static_cast<int32>(this->size());}
            };
            struct FLinearColor {
              float r,g,b,a;
              FLinearColor(float rr,float gg,float bb,float aa):r(rr),g(gg),b(bb),a(aa){}
            };
        """)
        cpp=textwrap.dedent("""
            #include "StarfortBagCatalog.h"
            #include <cassert>
            int main() {
              const auto& all=FStarfortBagCatalog::All();
              assert(all.Num()==19);
              const auto* sword=FStarfortBagCatalog::Find("starbreaker");
              assert(sword && sword->Attack==28 && sword->ForgeLevel==6);
              assert(FStarfortBagCatalog::Find("eclipse_edge")->ForgeLevel==0);
              assert(FStarfortBagCatalog::Find("ashes_plate")->Armor==14);
              assert(FStarfortBagCatalog::Find("guardian_seal")->Healing==17);
              assert(FStarfortBagCatalog::Find("fake_purchase")==nullptr);
              assert(FStarfortBagCatalog::IsSlot("relic"));
              assert(!FStarfortBagCatalog::IsSlot("gold"));
              assert(FStarfortBagCatalog::IsHero("aldren"));
              assert(!FStarfortBagCatalog::IsHero("guest"));
              return 0;
            }
        """)
        with tempfile.TemporaryDirectory() as temp:
            tmp=Path(temp)
            (tmp/"CoreMinimal.h").write_text(header,encoding="utf-8")
            (tmp/"test.cpp").write_text(cpp,encoding="utf-8")
            app=tmp/"bag-catalog"
            compiled=subprocess.run(
              ["c++","-std=c++17","-Wall","-Wextra","-Werror",
               "-I",str(tmp),"-I",str(SOURCE/"Public"),
               str(tmp/"test.cpp"),str(SOURCE/"Private/StarfortBagCatalog.cpp"),
               "-o",str(app)],
               capture_output=True,text=True,timeout=40)
            self.assertEqual(compiled.returncode,0,compiled.stderr)
            executed=subprocess.run([str(app)],capture_output=True,text=True,timeout=12)
            self.assertEqual(executed.returncode,0,executed.stderr)

    def test_actual_gear_actions_are_same_server_authoritative_rpc(self):
        native=read("Private/StarfortOnlineSubsystem.cpp")
        decl=read("Public/StarfortOnlineSubsystem.h")
        sql=(REPO/"starfort/sql/starfort-v255-first-minute-combat.sql").read_text()
        for verb in ("equip","unequip","forge","enhance"):
            self.assertIn('Action!=TEXT("'+verb+'")',native)
            self.assertIn("'"+verb+"'",sql)
        for name in ("EquipGear","UnequipGear","ForgeGear","EnhanceGear"):
            self.assertIn("UStarfortOnlineSubsystem::"+name,native)
            self.assertIn("void "+name+"(",decl)
        self.assertIn('"/rest/v1/rpc/sfb_starfort_progress"',native)
        self.assertIn("FGuid::NewGuid().ToString",native)
        self.assertIn("OnProgressReady.Broadcast(Snapshot)",native)
        self.assertIn("if (Action!=TEXT(\"get\")) LoadProgress();",native)
        self.assertNotIn("Inventory.Add(TEXT(\"starbreaker\"),1)",native)

    def test_server_inventory_and_equipment_validation_never_fake_ownership(self):
        native=read("Private/StarfortOnlineSubsystem.cpp")
        for key in ("inventory","loadouts","itemUpgrades","res","buildings"):
            self.assertIn('HasTypedField<EJson::Object>(TEXT("'+key+'"))',native)
        for phrase in ("IsIntegerField(Inv,*Pair.Key,1,20,Count)",
                       "IsIntegerField(Upgrades,*Pair.Key,0,5,Level)",
                       "NewCount>Out.Inventory.FindRef(ItemId)",
                       "Out.HeroLevels.Contains(HeroPair.Key)",
                       "Out.bInventoryVerified=true",
                       'Action!=TEXT("equip")', 'Action!=TEXT("unequip")'):
            self.assertIn(phrase,native)
        # A missing backend gear projection does not poison login/progression,
        # but the new Bag remains explicitly disabled, not populated with
        # the reference image's 284700 fake gold.
        self.assertIn("if(bBagPresent)",native)
        self.assertIn("bInventoryVerified = false;",read("Public/StarfortOnlineSubsystem.h"))

    def test_actual_native_four_column_umg_reference_layout_not_flat_screenshot(self):
        screen=read("Private/StarfortBagScreen.cpp")
        tile=read("Private/StarfortBagTile.cpp")
        for marker in (
            "UHorizontalBox* Main", "Aktif Kahraman",
            "Kahramanlar", "Çanta ve Donanım", "Seçili Eşya",
            "EquippedRow", "ItemGrid", "FilterRow", "RosterColumn",
            "Çıkar", "Kuşan", "Üret", "Geliştir",
            "StarfortBagUI::Panel(T,Main,235.f)",
            "StarfortBagUI::Panel(T,Main,376.f)",
            "StarfortBagUI::Panel(T,Main,575.f)",
            "StarfortBagUI::Panel(T,Main,305.f)",
            "CreateWidget<UStarfortBagTile>",
            "OnMutationRequested.Broadcast(Action,Target,Aux)",
            "bMutationPending=true",
            "GetOwningPlayer()", "UScrollBox",
            'TEXT("nav:")+Destination.Key',
        ):
            self.assertIn(marker,screen)
        self.assertIn("ClickTarget->OnClicked.AddUniqueDynamic",tile)
        self.assertIn("OnActivated.Broadcast(ActionToken)",tile)
        self.assertNotIn("<img",screen)
        self.assertNotIn("<canvas",screen)
        self.assertNotIn("WebView",screen.split("All panels")[1])
        self.assertNotIn("284.700",screen)
        self.assertNotIn("47.960",screen)

    def test_navigation_from_village_and_hero_cleans_up_on_signout(self):
        router=read("Private/StarfortSceneRouter.cpp")
        village=read("Private/StarfortVillageController.cpp")
        controller=read("Private/StarfortMobilePlayerController.cpp")
        for marker in (
            "OpenBag()", "ConsumeBagRoute()",
            "bBagRouteRequested=false", "OpenHeroHall()"):
            self.assertIn(marker,router)
        self.assertIn("Router->OpenBag()",village)
        self.assertIn("ActiveVillageScreen->OnBagRequested.AddUniqueDynamic",village)
        self.assertIn("ActiveHeroScreen->OnBagRequested.AddUniqueDynamic",controller)
        self.assertIn("CreateWidget<UStarfortBagScreen>",controller)
        self.assertIn("ActiveBagScreen->ApplyVerifiedAccount(Progress)",controller)
        self.assertIn("ActiveBagScreen->ShowServerFailure(SafeReason)",controller)
        self.assertIn("ActiveBagScreen->SetWaitingForServer()",controller)
        self.assertIn("Online->EquipGear(Target,Aux)",controller)
        self.assertIn("Online->UnequipGear(Target,Aux)",controller)
        self.assertIn("Online->ForgeGear(Target)",controller)
        self.assertIn("Online->EnhanceGear(Target)",controller)
        self.assertIn("HideBagScreen();",controller)
        self.assertIn("ActiveBagScreen->RemoveFromParent()",controller)


if __name__=="__main__":
    unittest.main()
