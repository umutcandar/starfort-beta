"""Review STARFORT's original GLB + editor import contract without faking an editor run."""
import ast
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
ARENA_SHA="f60553379ebc821eef57e9807a1bdb05dc6a771360f263854bc99214e0555d25"

class OriginalBattleArenaTests(unittest.TestCase):
    def test_real_original_geometry_generator_not_a_sprite(self):
        source=(ROOT/"Tools/generate_original_ash_battlefield_v79.py").read_text()
        ast.parse(source)
        for text in ("trimesh.Trimesh(", "trimesh.creation.icosphere",
                     "baseColorTexture", "normalTexture", "metallicRoughnessTexture",
                     "baked.export(str(out),file_type='glb')",
                     "'mesh_parts':len(meshes)", "'triangles':int(sum(len(m.faces)"):
            self.assertIn(text,source)
        self.assertNotIn("https://",source)
        self.assertNotIn("bArtApprovedForMobile=True",source)

    def test_fail_closed_editor_import_requires_real_glb_and_preserves_map(self):
        src=(ROOT/"Tools/import_original_ash_battlefield_v79.py").read_text()
        ast.parse(src)
        self.assertIn("EXPECTED_SHA256=\""+ARENA_SHA+"\"",src)
        for text in ("data[:4]!=b\"glTF\"", "hashlib.sha256(data).hexdigest()",
                     "replace_existing\",False", "unreal.AssetImportTask()",
                     "len(meshes)<70", "does_asset_exist(LEVEL)", "does_directory_exist(DEST)",
                     "editor.save_current_level()", "heroes_rigged_and_bound\":False",
                     "premium_mobile_art_approved\":False"):
            self.assertIn(text,src)
        self.assertNotIn("bArtApprovedForMobile=True",src)

    def test_reproducible_workflow_keeps_binary_out_of_public_source(self):
        workflow=(ROOT.parent.parent/".github/workflows/starfort-original-arena.yml").read_text()
        self.assertIn(ARENA_SHA,workflow)
        self.assertIn("actions/upload-artifact",workflow)
        self.assertIn("starfort-original-ash-arena-v79-glb",workflow)
        self.assertIn("triangles==80000",workflow)
        self.assertIn("len(meshes)==95",workflow)
        gitignore=(ROOT/".gitignore").read_text()
        self.assertIn("ContentPipeline/Incoming/",gitignore)


if __name__=="__main__":
    unittest.main()
