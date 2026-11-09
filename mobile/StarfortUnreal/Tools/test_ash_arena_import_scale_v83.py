#!/usr/bin/env python3
"""Original PBR 3D arena imported-size checks; no Unreal Editor is claimed."""
from pathlib import Path
import sys
import types
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"Tools"))
from ash_arena_scale_review_v83 import imported_arena_uniform_scale


def mock_arena(width,height=16.6,count=95):
    def mesh(w,h):
        extent=types.SimpleNamespace(x=w/2,y=h/2,z=1)
        bounds=types.SimpleNamespace(box_extent=extent)
        return types.SimpleNamespace(get_bounds=lambda:bounds)
    return [mesh(width,height)]+[mesh(0.4,0.5) for _ in range(count-1)]


class AshArenaImportSizeV83(unittest.TestCase):
    def test_true_meters_convert_to_cm_once(self):
        self.assertEqual(imported_arena_uniform_scale(mock_arena(23,16.6)),100.0)
        self.assertEqual(imported_arena_uniform_scale(mock_arena(24,17.0)),100.0)

    def test_interchange_auto_converted_cm_must_not_scale_twice(self):
        self.assertEqual(imported_arena_uniform_scale(mock_arena(2300,1660)),1.0)

    def test_reject_fake_tiny_or_huge_or_non_finite_geometry(self):
        for width in (1.0,180.0,300.0,5500.0,float("nan"),float("inf")):
            with self.subTest(width=width):
                with self.assertRaises(ValueError):
                    imported_arena_uniform_scale(mock_arena(width))
        with self.assertRaises(ValueError):
            imported_arena_uniform_scale(mock_arena(23,16.6,count=2))

    def test_arena_is_scaled_in_both_true_private_and_real_game_stage(self):
        private=(ROOT/"Tools/fab_seven_private_preview_v80.py").read_text()
        original=(ROOT/"Tools/import_original_ash_battlefield_v79.py").read_text()
        for source in (private,original):
            self.assertIn("imported_arena_uniform_scale",source)
            self.assertIn("actor.set_actor_scale3d(unreal.Vector(scale,scale,scale))",source)
            self.assertNotIn("actor.set_actor_scale3d(unreal.Vector(100,100,100))",source)
        self.assertIn("scale_verified_from_real_mesh_bounds",original)


if __name__=="__main__":
    unittest.main()
