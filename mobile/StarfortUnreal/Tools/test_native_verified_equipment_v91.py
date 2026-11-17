#!/usr/bin/env python3
"""Native verified loadout rendering contracts; not an Unreal/device test."""
from pathlib import Path
import unittest
SRC=Path(__file__).resolve().parents[1]/"Source/StarfortUnreal"
class NativeVerifiedGear(unittest.TestCase):
 def read(self,p):return (SRC/p).read_text(encoding="utf-8")
 def test_server_is_authoritative(self):
  stage=self.read("Private/StarfortBattleStage.cpp")
  controller=self.read("Private/StarfortBattleController.cpp")
  self.assertIn("Stage->CacheVerifiedEquipment(Progress)",controller)
  self.assertLess(controller.index("Stage->CacheVerifiedEquipment(Progress)"),controller.index("if(Progress.bInMission)"))
  for v in ("Snapshot.bServerVerified","Snapshot.bInventoryVerified",
    "Snapshot.Loadouts.Find(HeroId)","Used>Snapshot.Inventory.FindRef(ItemId)",
    "VerifiedGearRoomId!=Snapshot.RoomId"):
   self.assertIn(v,stage,v)
  self.assertNotIn("SubmitProgressAction(",stage)
 def test_art_is_real_and_async(self):
  stage=self.read("Private/StarfortBattleStage.cpp")
  for v in ("RequestAsyncLoad(","GearManifest->FindGearArt(",
   "Entry->WeaponMesh.ToSoftObjectPath()","Entry->ArmorMesh.ToSoftObjectPath()",
   "Weapons[I]->SetStaticMesh(ActualWeapon)",
   "ArmorMesh->GetSkeleton()!=Art->HeroMesh->GetSkeleton()",
   "Armors[I]->SetLeaderPoseComponent(Rigs[I])",
   "VerifiedWeaponByHero.Empty()","VerifiedArmorByHero.Empty()","ActualImpactSocket","EquippedCopies.Add(ItemId,Used)"):
   self.assertIn(v,stage,v)
 def test_mapping_is_fail_closed(self):
  m=self.read("Private/StarfortEquipmentArtManifest.cpp")
  for v in ("FStarfortBagCatalog::Find(ItemId)","Slot!=Known->Slot",
    "if(Found) return nullptr","WeaponMesh.IsNull()","ArmorMesh.IsNull()"):
   self.assertIn(v,m,v)
if __name__=="__main__":unittest.main()
