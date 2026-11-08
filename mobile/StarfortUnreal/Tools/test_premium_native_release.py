"""Source-only STARFORT native release regression checks (not an Unreal compile)."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Source/StarfortUnreal"


class PremiumHeroAndReleaseTests(unittest.TestCase):
    def test_hero_asset_rejects_duplicate_motion_and_effects(self):
        header = (SOURCE / "Public/StarfortHeroCombatAsset.h").read_text(encoding="utf-8")
        cpp = (SOURCE / "Private/StarfortHeroCombatAsset.cpp").read_text(encoding="utf-8")
        ue_tests = (SOURCE / "Private/Tests/StarfortNativeAutomationTests.cpp").read_text(encoding="utf-8")
        self.assertIn("HasDistinctCombatChoreography() const", header)
        self.assertIn("TSet<const UAnimMontage*> UniqueMotions", cpp)
        self.assertIn("TSet<const UNiagaraSystem*> UniqueEffects", cpp)
        self.assertIn("UniqueMotions.Contains(Motion)", cpp)
        self.assertIn("UniqueEffects.Contains(Effect)", cpp)
        self.assertIn("HeroMesh->GetLODNum() < AuthoredMobileLODCount", cpp)
        self.assertIn("Motion->GetSkeleton() != HeroMesh->GetSkeleton()", cpp)
        self.assertIn("!HasDistinctCombatChoreography()", cpp)
        for phrase in ("Reused generic montage is rejected",
                       "Reused Niagara system is rejected",
                       "Five original motions and effects satisfy uniqueness"):
            self.assertIn(phrase, ue_tests)

    def test_team_cannot_reuse_the_same_body_or_weapon(self):
        source = (SOURCE / "Private/StarfortBattleStage.cpp").read_text(encoding="utf-8")
        for key in ("UniqueBodyMeshes.Contains(Art->HeroMesh.Get())",
                    "UniqueWeaponMeshes.Contains(Art->WeaponMesh.Get())",
                    "SeenBodies.Contains(Body)",
                    "SeenWeapons.Contains(Weapon)"):
            self.assertIn(key, source)
        self.assertIn("Snapshot.bServerVerified", source)
        self.assertIn("VerifiedDamageDealt>0", source)

    def test_dry_run_remains_honest_and_release_uses_shipping(self):
        script = ROOT / "Tools/native_mobile_build.py"
        for platform in ("android", "ios"):
            smoke = subprocess.run(
                [sys.executable, str(script), "--platform", platform,
                 "--profile", "smoke", "--dry-run"],
                text=True, capture_output=True, check=False)
            self.assertEqual(smoke.returncode, 0, smoke.stderr)
            smoke_data = json.loads(smoke.stdout)
            self.assertFalse(smoke_data["production_ready"])
            self.assertIn("-clientconfig=Development", smoke_data["command"])
            self.assertNotIn("-distribution", smoke_data["command"])

            release = subprocess.run(
                [sys.executable, str(script), "--platform", platform,
                 "--profile", "release", "--dry-run"],
                text=True, capture_output=True, check=False)
            self.assertEqual(release.returncode, 2, release.stderr)
            release_data = json.loads(release.stdout)
            self.assertFalse(release_data["production_ready"])
            self.assertTrue(release_data["missing"])
            self.assertIn("-clientconfig=Shipping", release_data["command"])
            self.assertIn("-distribution", release_data["command"])
            self.assertNotIn("-clientconfig=Development", release_data["command"])


if __name__ == "__main__":
    unittest.main()
