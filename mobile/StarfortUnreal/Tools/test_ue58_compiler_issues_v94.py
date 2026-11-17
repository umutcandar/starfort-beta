#!/usr/bin/env python3
"""Contracts following real UE5.8 Mac compilation diagnostics. Not Unreal compilation."""
from pathlib import Path
import unittest

SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"
class UE58MacErrors(unittest.TestCase):
 def test_shared_json_keys_convert_explicitly_before_fstring_use(self):
  source=(SRC/"Private/StarfortOnlineSubsystem.cpp").read_text(encoding="utf-8")
  for marker in ("Known.Contains(FString(*Field.Key))",
   "ParseInt(FString(*Entry.Key),Stage)",
   "Out.Team.Contains(FString(*Entry.Key))",
   "Out.SkillCooldownTurns.Add(FString(*Entry.Key)",
   "Out.Inventory.Add(FString(*Pair.Key)",
   "Out.ItemUpgrades.Add(FString(*Pair.Key)",
   "Out.HeroLevels.Contains(FString(*HeroPair.Key))",
   "Out.Loadouts.Add(FString(*HeroPair.Key)",
   "FStarfortBagCatalog::IsSlot(FString(*SlotPair.Key))",
   "Out.RelicAscensions.Add(FString(*Pair.Key)"):
   self.assertIn(marker,source,marker)
  for old in ("Out.Team.Contains(Entry.Key)",
   "Out.Inventory.Add(Pair.Key", "Out.Loadouts.Add(HeroPair.Key",
   "FStarfortBagCatalog::IsSlot(SlotPair.Key)"):
   self.assertNotIn(old,source,old)
  self.assertIn("Out.bServerVerified=true",source)
 def test_native_ui_gc_owned_button_reference(self):
  source=(SRC/"Private/StarfortNativeWidgetFactory.cpp").read_text(encoding="utf-8")
  self.assertIn("TObjectPtr<UButton>& OutButton,const FString& Label)",source)
  self.assertNotIn("UButton*& OutButton",source)
  self.assertIn("OutButton.Get()",source)
 def test_struct_forward_declaration_matches_unreal(self):
  source=(SRC/"Public/StarfortHeroScreen.h").read_text(encoding="utf-8")
  self.assertIn('#include "Engine/StreamableManager.h"',source)
  self.assertNotIn("class FStreamableHandle;",source)
if __name__=="__main__":
 unittest.main()
