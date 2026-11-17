#!/usr/bin/env python3
"""UE 5.8 source compatibility contract from an actual Mac UBT failure log.
Source validation, NOT a substitute for compiling in UE5.8.
"""
import re
import unittest
from pathlib import Path

TARGETS = Path(__file__).resolve().parents[1] / "Source"

class Unreal58TargetRules(unittest.TestCase):
    def test_both_targets_use_ue58_defaults_and_header_order(self):
        for name in ("StarfortUnrealEditor.Target.cs", "StarfortUnreal.Target.cs"):
            with self.subTest(target=name):
                content = (TARGETS / name).read_text(encoding="utf-8")
                self.assertIn("DefaultBuildSettings = BuildSettingsVersion.V7;", content)
                self.assertIn("IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_8;", content)
                self.assertNotIn("BuildSettingsVersion.V5", content)
                self.assertNotIn("TargetBuildEnvironment.Unique", content)
                self.assertNotIn("bOverrideBuildEnvironment", content)
                self.assertEqual(content.count("{"), content.count("}"))
                self.assertTrue(re.search(r"Type\s*=\s*TargetType\.(?:Editor|Game)", content))
    def test_targets_keep_runtime_module(self):
        for name in ("StarfortUnrealEditor.Target.cs", "StarfortUnreal.Target.cs"):
            content = (TARGETS / name).read_text(encoding="utf-8")
            self.assertIn('ExtraModuleNames.Add("StarfortUnreal")', content)

if __name__ == "__main__":
    unittest.main()
