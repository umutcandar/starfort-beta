#!/usr/bin/env python3
"""Sanity-check Unreal Editor map generation script without using Unreal locally.
This proves only source syntax and guardrails, not creation of .umap files.
"""
import ast
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"Tools/author_ultra_login_level_v99.py"
SRC=ROOT/"Source/StarfortUnreal"

class AuthorUltraLoginV99(unittest.TestCase):
 def test_editor_script_parses(self):
  ast.parse(SCRIPT.read_text(encoding="utf-8"),filename=str(SCRIPT))
 def test_idempotent_map_creation_and_actual_material_asset_pipeline(self):
  s=SCRIPT.read_text(encoding="utf-8")
  for marker in (
   'MAP = "/Game/STARFORT/Login/L_StarfortLogin"',
   "unreal.is_editor()",
   "unreal.LevelEditorSubsystem",
   "editor.new_level(MAP, False)",
   "editor.load_level(MAP)",
   "editor.save_current_level()",
   "unreal.MaterialEditingLibrary.create_material_expression(",
   "unreal.MaterialEditingLibrary.connect_material_property(",
   "unreal.MaterialEditingLibrary.recompile_material(",
   "unreal.EditorActorSubsystem",
   "unreal.EditorAssetLibrary.does_asset_exist(",
   "spawn_actor_from_class(",
   'actor.set_editor_property("fortress_material"',
   'actor.set_editor_property("banner_material"',
   'actor.set_editor_property("ember_material"',
   "DefaultEngine_before_ultra_login.ini",
   "unreal.MaterialExpressionVertexColor",
   "M_StarfortCitadelVertexColors",
   'actor.set_editor_property("imported_citadel_mesh"',
   'actor.set_editor_property("imported_citadel_material"',
  ):
   self.assertIn(marker,s,marker)
  for forbidden in ("requests.", "http://", "https://", "os.system(", "subprocess.run("):
   self.assertNotIn(forbidden,s)
 def test_real_3d_scene_materials_are_opt_in_and_no_fake_hero(self):
  h=(SRC/"Public/StarfortLoginCinematicStage.h").read_text(encoding="utf-8")
  c=(SRC/"Private/StarfortLoginCinematicStage.cpp").read_text(encoding="utf-8")
  for marker in ("FortressMaterial", "BannerMaterial", "EmberMaterial",
                 "ImportedCitadelMesh", "ImportedCitadelMaterial"):
   self.assertIn(marker,h)
   self.assertIn(marker,c)
  self.assertIn("HasProductionReadyGeometryAndMotion()",c)
 def test_no_duplicate_stage_when_real_login_level_exists(self):
  s=(SRC/"Private/StarfortVillageController.cpp").read_text(encoding="utf-8")
  self.assertIn("TActorIterator<AStarfortLoginCinematicStage> ExistingStage(GetWorld());",s)
  self.assertIn("if(ExistingStage)",s)
  self.assertIn("ActiveLoginStage=*ExistingStage;",s)
  self.assertNotIn("for(TActorIterator<AStarfortLoginCinematicStage>",s)
  self.assertIn("if(!ActiveLoginStage)",s)
  self.assertIn("SetViewTargetWithBlend(ActiveLoginStage",s)

if __name__=="__main__":
 unittest.main()
