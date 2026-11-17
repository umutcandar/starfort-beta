#!/usr/bin/env python3
"""Regression contracts based on real Unreal 5.8 Mac build failures.
Source-only checks: NOT a UBT/UHT or macOS runtime build.
"""
from pathlib import Path
import unittest

SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"

class UE58CompilerErrorsV96(unittest.TestCase):
 def test_no_mismatched_streamable_tag_in_any_native_header(self):
  headers=list(SRC.rglob("*.h"))
  self.assertGreater(len(headers),20)
  for path in headers:
   with self.subTest(header=path.name):
    self.assertNotIn("class FStreamableHandle;",path.read_text(encoding="utf-8"))
  stage=(SRC/"Public/StarfortBattleStage.h").read_text(encoding="utf-8")
  self.assertIn("struct FStreamableHandle;",stage)
  hero=(SRC/"Public/StarfortHeroScreen.h").read_text(encoding="utf-8")
  self.assertIn('#include "Engine/StreamableManager.h"',hero)
 def test_grid_uses_panel_padding_and_keeps_4_column_inventory(self):
  code=(SRC/"Private/StarfortBagScreen.cpp").read_text(encoding="utf-8")
  self.assertIn("ItemGrid->SetSlotPadding(FMargin(3.f,3.f));",code)
  self.assertIn("ItemGrid->AddChildToUniformGrid(Tile,VisibleIndex/4,VisibleIndex%4);",code)
  self.assertNotIn("->SetPadding(FMargin(3.f,3.f))",code)
  self.assertNotIn("UniformGridSlot.h",code)
 def test_inventory_stays_server_verified(self):
  code=(SRC/"Private/StarfortBagScreen.cpp").read_text(encoding="utf-8")
  for token in ("Verified.Inventory.FindRef(Id)","bHasVerifiedInventory","Verified.bInMission"):
   self.assertIn(token,code)
  self.assertNotIn("Inventory.Add(",code)

if __name__=="__main__":
 unittest.main()
