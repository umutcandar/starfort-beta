#!/usr/bin/env python3
"""Regression checks for failures from actual Unreal Engine 5.8 Apple UBT logs.
The tests are static contracts and do NOT claim a real Unreal build.
"""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"

class UE58ActualMacCompilerIssuesV95(unittest.TestCase):
 def src(self,path): return (ROOT/path).read_text(encoding="utf-8")
 def test_skeletal_actor_header_matches_ue58(self):
  for name in ("StarfortFabPreviewController.cpp",
               "StarfortFabVerifiedBattleBridge.cpp"):
   with self.subTest(name=name):
    source=self.src("Private/"+name)
    self.assertIn('#include "Animation/SkeletalMeshActor.h"',source)
    self.assertNotIn('#include "Engine/SkeletalMeshActor.h"',source)
 def test_bag_dynamic_multicast_function_signature_matches_delegate(self):
  tile=self.src("Public/StarfortBagTile.h")
  header=self.src("Public/StarfortBagScreen.h")
  code=self.src("Private/StarfortBagScreen.cpp")
  self.assertIn("DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortBagTileActivated,FString,Action)",tile)
  self.assertIn("UFUNCTION() void HandleTile(FString ActionToken);",header)
  self.assertIn("void UStarfortBagScreen::HandleTile(FString Token)",code)
  self.assertIn("OnActivated.AddUniqueDynamic(this,&UStarfortBagScreen::HandleTile)",code)
  self.assertNotIn("HandleTile(const FString&",header+code)
 def test_grid_spacing_uses_uniform_grid_panel_api(self):
  code=self.src("Private/StarfortBagScreen.cpp")
  self.assertIn('ItemGrid->SetSlotPadding(FMargin(3.f,3.f));',code)
  self.assertIn('ItemGrid->AddChildToUniformGrid(Tile,VisibleIndex/4,VisibleIndex%4);',code)
  self.assertNotIn("->SetPadding(FMargin(3.f,3.f))",code)
  self.assertNotIn("UniformGridSlot.h",code)
 def test_streamable_header_is_included_not_misdeclared(self):
  code=self.src("Public/StarfortHeroScreen.h")
  self.assertIn('#include "Engine/StreamableManager.h"',code)
  self.assertNotIn("class FStreamableHandle;",code)
  self.assertNotIn("struct FStreamableHandle;",code)
  stage=self.src("Public/StarfortBattleStage.h")
  self.assertIn("struct FStreamableHandle;",stage)
  self.assertNotIn("class FStreamableHandle;",stage)

if __name__=="__main__":unittest.main()
