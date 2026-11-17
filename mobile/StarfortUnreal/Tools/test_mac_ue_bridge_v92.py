#!/usr/bin/env python3
"""Tests local Mac bridge contract on normal Linux CI; no Unreal invoked."""
import importlib.util
from pathlib import Path
from unittest.mock import patch
import tempfile
import unittest
SCRIPT=Path(__file__).with_name("mac_ue_bridge.py")
spec=importlib.util.spec_from_file_location("starfort_mac_bridge",SCRIPT)
bridge=importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class BridgeSourceQA(unittest.TestCase):
    def test_project_matches_required_engine(self):
        self.assertEqual(bridge.engine_version(),"5.8")
    def test_editor_build_not_shipping_or_publish(self):
        cmd=bridge.editor_command(Path("/mock/UE_5.8"))
        self.assertEqual(cmd[1:4],["StarfortUnrealEditor","Mac","Development"])
        combined=" ".join(cmd).lower()
        for unsafe in ("shipping","buildcookrun","-distribution","-package","deploy"):
            self.assertNotIn(unsafe,combined)
    def test_local_engine_detection_without_touching_machine(self):
        with tempfile.TemporaryDirectory() as tmp:
            engine=Path(tmp)
            build=engine/"Engine/Build/BatchFiles/Mac/Build.sh"
            build.parent.mkdir(parents=True)
            build.write_text("#!/bin/sh\n",encoding="utf-8")
            self.assertEqual(bridge.locate_engine(str(engine)),engine.resolve())
    def test_missing_engine_never_asserts_success(self):
        with patch.object(bridge,"locate_engine",return_value=None):
            report=bridge.inspect("/not-installed/UE_5.8")
        self.assertFalse(report["ready_to_build"])
        self.assertFalse(report["built"])
        self.assertFalse(report["published"])
        self.assertFalse(report["packaged"])

if __name__=="__main__":
    unittest.main()
