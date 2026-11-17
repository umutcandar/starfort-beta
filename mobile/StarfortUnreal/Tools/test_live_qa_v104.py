#!/usr/bin/env python3
"""Native Unreal Live QA source/test contract, no engine simulation."""
import ast
import pathlib
import unittest

TOOLS=pathlib.Path(__file__).resolve().parent
STUDIO=(TOOLS/'STARFORT_LIVE_STUDIO.command').read_text(encoding='utf-8')
MAC=(TOOLS/"mac_live_qa_v104.py").read_text(encoding="utf-8")
EDITOR=(TOOLS/"starfort_editor_live_v104.py").read_text(encoding="utf-8")

class LiveQAV104(unittest.TestCase):
 def test_both_editor_scripts_parse_under_plain_python(self):
  ast.parse(MAC)
  ast.parse(EDITOR)
 def test_local_epic_client_only_and_explicit_publication(self):
  for text in ("remote_execution.RemoteExecution()",
   "open_command_connection", "starfortunreal", "exec_mode=\"ExecuteFile\"",
   '"inspect", "capture", "premium", "watch"', 'args.mode not in ("watch", "studio")', "--public-preview",
   "QA_BRANCH = \"qa/starfort-editor-preview\""):
   self.assertIn(text,MAC,text)
  self.assertNotIn("subprocess.Popen(",MAC)
  self.assertNotIn("curl ",MAC)
  self.assertNotIn("eval(",MAC)
  self.assertIn('state.get("play_in_editor")',MAC)
 def test_single_click_studio_has_opt_in_public_preview(self):
  self.assertIn('if args.mode == "studio":',MAC)
  self.assertIn('state.get("capture_requested")',MAC)
  self.assertIn('state.get("public_preview_safe")',MAC)
  self.assertIn('saved.rglob("starfort_editor_scene*.png")',MAC)
  self.assertIn('capture_once("premium", args)',MAC)
  self.assertIn('read -r -p',STUDIO)
  self.assertIn('ARGS+=("--public-preview")',STUDIO)
  self.assertIn('git pull --ff-only',STUDIO)
  self.assertNotIn('git reset --hard',STUDIO)
  self.assertNotIn('git push --force',STUDIO)

 def test_screenshots_refuse_pie_and_other_levels(self):
  for text in ("is_in_play_in_editor()",
   "if report[\"play_in_editor\"]",
   "ALLOWED_LEVEL not in report[\"map_name\"]",
   "take_high_res_screenshot(", "force_game_view=True",
   "starfort_editor_scene.png", "starfort_editor_scene.json"):
   self.assertIn(text,EDITOR,text)
  self.assertNotIn("get_password",EDITOR)
  self.assertNotIn("http",EDITOR.lower())
 def test_premium_pass_is_idempotent_and_preserves_original_material(self):
  for text in ("M_StarfortCinematicStone_v104", 
   "unreal.MaterialExpressionVertexColor",
   "unreal.MaterialExpressionMultiply",
   'color.set_editor_property("const_b", 1.95)',
   "MP_EMISSIVE_COLOR", "STARFORT • PREMIUM SKY",
   "STARFORT • PREMIUM TERRAIN",
   "STARFORT • GATE BRAZIER LEFT",
   "STARFORT • GATE BRAZIER RIGHT",
   "STARFORT • PREMIUM FILL", "L_StarfortLogin_before_v104.umap",
   "if not backup.exists()", "levels.save_current_level()"):
   self.assertIn(text,EDITOR,text)
  self.assertNotIn("delete_asset(",EDITOR)
  self.assertIn("if ground_name not in known:",EDITOR)
  self.assertIn("if name in known:",EDITOR)
  self.assertIn("_ensure_environment(report)",EDITOR)

if __name__=="__main__":
 unittest.main()
