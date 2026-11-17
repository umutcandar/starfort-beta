#!/usr/bin/env python3
"""Regression test of native combat source contracts; not a UE5 runtime build."""
from pathlib import Path
import unittest

CPP=(Path(__file__).resolve().parents[1]/
 "Source/StarfortUnreal/Private/StarfortBattleStage.cpp")

class CombatMontageV91(unittest.TestCase):
 def test_no_duplicate_weapon_identity_gate(self):
  s=CPP.read_text(encoding="utf-8")
  self.assertIn("UniqueBodyMeshes.Contains",s)
  self.assertIn("SeenBodies.Contains",s)
  self.assertNotIn("UniqueWeaponMeshes",s)
  self.assertNotIn("SeenWeapons",s)

 def test_impact_follows_played_montage_but_damage_is_server_authoritative(self):
  s=CPP.read_text(encoding="utf-8")
  for token in (
   "Anim->Montage_Play(Montage)",
   "LongestPlayedAttackSeconds*0.42f",
   "VerifiedDamage>0",
   "Snapshot.bServerVerified",
   "VerifiedDamageReceived>0",
   "ImpactDelaySeconds,false",
   "Generation!=TeamLoadGeneration",
  ):
   self.assertIn(token,s,token)
  self.assertNotIn("VerifiedImpactTimer,HitDelegate,0.28f,false",s)
  self.assertNotIn("Inventory.Add(",s)
  self.assertNotIn("SubmitBattleAction(",s)

if __name__=="__main__":
 unittest.main()
