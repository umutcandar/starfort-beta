#!/usr/bin/env python3
"""Unit tests of the v77 Fab character source/stage workflow, NOT UE compilation."""
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parent))
import fab_character_review as mod


class FakeClass:
    def __init__(self,name):self.name=name
    def get_name(self):return self.name


class FakeMesh:
    def __init__(self,name,rig=True,materials=True):
        self.name=name
        self.rig=rig
        self.materials=materials
    def get_class(self):return FakeClass("SkeletalMesh")
    def get_editor_property(self,key):
        if key=="skeleton":
            return types.SimpleNamespace(get_path_name=lambda:"/Game/Skels/SK_Test") if self.rig else None
        if key=="materials":
            return ["mat1","mat2"] if self.materials else []
        raise AttributeError(key)


class FakeArt:
    def __init__(self,selection):
        self.selection=selection
        self.level_exists=False
        self.paths={path:FakeMesh(path) for path in selection.values()}
    def does_directory_exist(self,path):
        return any(asset.startswith(path+"/") for asset in self.paths)
    def list_assets(self,root,recursive=True,include_folder=False):
        return list(p for p in self.paths if p.startswith(root+"/"))
    def does_asset_exist(self,path):
        if path==mod.REVIEW_LEVEL:return self.level_exists
        return path in self.paths
    def load_asset(self,path):return self.paths.get(path)


class FakeComponent:
    def __init__(self):self.mesh=None;self.shadow=False
    def set_skeletal_mesh_asset(self,m):self.mesh=m
    def set_editor_property(self,key,value):
        if key!="cast_shadow":raise ValueError(key)
        self.shadow=value


class FakeActor:
    def __init__(self,location,rotation):
        self.component=FakeComponent()
        self.label="unnamed"
        self.location=location
    def get_component_by_class(self,c):return self.component
    def set_actor_label(self,label):self.label=label
    def get_actor_label(self):return self.label


class FakeActors:
    def __init__(self):self.actors=[]
    def spawn_actor_from_class(self,c,location,rotation):
        a=FakeActor(location,rotation);self.actors.append(a)
        return a


class FakeLevels:
    def __init__(self):self.created=[];self.saved=False
    def new_level(self,path,template):
        self.created.append(path);return True
    def save_current_level(self):
        self.saved=True;return True


class FakeEngine:
    SkeletalMeshActor=object()
    SkeletalMeshComponent=object()
    DirectionalLight=object()
    SkyLight=object()
    CameraActor=object()
    @staticmethod
    def Vector(a,b,c):return (a,b,c)
    @staticmethod
    def Rotator(a,b,c):return (a,b,c)
    def __init__(self,selection):
        self.EditorAssetLibrary=FakeArt(selection)
        self.actors=FakeActors()
        self.levels=FakeLevels()
        self.EditorActorSubsystem=FakeActors
        self.LevelEditorSubsystem=FakeLevels
    def get_editor_subsystem(self,klass):
        return self.actors if klass is FakeActors else self.levels


class FabStaging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc=json.loads(mod.MANIFEST.read_text(encoding="utf-8"))
        cls.selection={h["hero_id"]:
            h["expected_root"]+"/Characters/Heroes/"+h["source_hero_name"].replace(" ","")+
            "/Meshes/SK_"+h["source_hero_name"].replace(" ","")+".SK_"+h["source_hero_name"].replace(" ","")
            for h in cls.doc["heroes"]}

    def test_original_hero_ids_and_license_boundaries(self):
        self.assertEqual(mod.validate_manifest(self.doc),[])
        self.assertEqual(tuple(x["hero_id"] for x in self.doc["heroes"]),mod.IDS)
        self.assertTrue(self.doc["requires_fab_user_eula_acceptance"])
        self.assertTrue(self.doc["never_redistribute_fab_sources"])
        self.assertTrue(self.doc["never_mark_production_approved"])
        self.assertFalse(any(h["final_approval"] for h in self.doc["heroes"]))

    def test_suggested_candidates_are_actual_skeletal_meshes(self):
        engine=FakeEngine(self.selection)
        rows=mod.asset_candidates(engine,self.doc)
        self.assertEqual(len(rows),4)
        for row in rows:
            self.assertTrue(row["found"],row)
            self.assertEqual(len(row["candidates"]),1)
            self.assertTrue(row["candidates"][0]["is_actual_skeletal_mesh"])
            self.assertEqual(row["candidates"][0]["material_slots"],2)
        engine.EditorAssetLibrary.paths[next(iter(self.selection.values()))]=FakeMesh(
            "corrupt",rig=False)
        rows=mod.asset_candidates(engine,self.doc)
        self.assertFalse(rows[0]["found"])

    def test_scan_never_approves_rigs_and_writes_local_not_repo(self):
        engine=FakeEngine(self.selection)
        with tempfile.TemporaryDirectory() as td:
            old=(mod.QA,mod.SCAN_REPORT,mod.SELECTION)
            try:
                mod.QA=Path(td)
                mod.SCAN_REPORT=Path(td)/"candidates.json"
                mod.SELECTION=Path(td)/"selection.json"
                result=mod.scan(engine,self.doc)
                self.assertTrue(result["scanned_real_editor"])
                self.assertTrue(result["all_four_have_real_skeletal_mesh_candidates"])
                self.assertFalse(result["starfort_original_hero_art_approved"])
                selection=json.loads(mod.SELECTION.read_text())
                self.assertTrue(selection["for_art_review_only"])
                self.assertEqual(selection["selected_skeletal_meshes"],self.selection)
                mod.SELECTION.write_text("custom reviewer choice")
                mod.scan(engine,self.doc)
                self.assertEqual(mod.SELECTION.read_text(),"custom reviewer choice")
            finally:
                mod.QA,mod.SCAN_REPORT,mod.SELECTION=old

    def test_stage_creates_real_four_skeletal_mesh_actors_only(self):
        engine=FakeEngine(self.selection)
        with tempfile.TemporaryDirectory() as td:
            old=(mod.QA,mod.SELECTION,mod.STAGE_REPORT)
            try:
                mod.QA=Path(td)
                mod.SELECTION=Path(td)/"selection.json"
                mod.STAGE_REPORT=Path(td)/"preview.json"
                mod.SELECTION.write_text(json.dumps({
                    "source":"user_imported_fab_library",
                    "for_art_review_only":True,
                    "selected_skeletal_meshes":self.selection,
                }))
                report=mod.stage(engine,self.doc)
                self.assertTrue(report["actual_unreal_editor_scene_saved"])
                self.assertEqual(report["actual_skeletal_mesh_actors"],4)
                self.assertEqual(len(engine.actors.actors),7)
                self.assertTrue(engine.levels.saved)
                self.assertEqual(engine.levels.created,[mod.REVIEW_LEVEL])
                for actor in engine.actors.actors[:4]:
                    self.assertTrue(actor.label.startswith("STARFORT_REFERENCE_ONLY_"))
                    self.assertIsNotNone(actor.component.mesh)
                    self.assertTrue(actor.component.shadow)
                self.assertFalse(report["original_starfort_character_art_completed"])
                self.assertFalse(report["shipped_to_players"])
                self.assertFalse(report["licensed_raw_assets_in_public_repo"])
            finally:
                mod.QA,mod.SELECTION,mod.STAGE_REPORT=old

    def test_existing_artist_world_is_never_overwritten(self):
        engine=FakeEngine(self.selection)
        engine.EditorAssetLibrary.level_exists=True
        with tempfile.TemporaryDirectory() as td:
            old=mod.SELECTION
            try:
                mod.SELECTION=Path(td)/"selected.json"
                mod.SELECTION.write_text(json.dumps({
                    "source":"user_imported_fab_library",
                    "for_art_review_only":True,
                    "selected_skeletal_meshes":self.selection,
                }))
                with self.assertRaisesRegex(RuntimeError,"preserving existing scene"):
                    mod.stage(engine,self.doc)
                self.assertEqual(engine.levels.created,[])
            finally:
                mod.SELECTION=old

    def test_stage_never_pretends_four_unimported_hero_models_exist(self):
        engine=FakeEngine(self.selection)
        del engine.EditorAssetLibrary.paths[self.selection["rovan"]]
        with tempfile.TemporaryDirectory() as td:
            old=mod.SELECTION
            try:
                mod.SELECTION=Path(td)/"selected.json"
                mod.SELECTION.write_text(json.dumps({
                    "source":"user_imported_fab_library",
                    "for_art_review_only":True,
                    "selected_skeletal_meshes":self.selection,
                }))
                with self.assertRaisesRegex(RuntimeError,"not installed"):
                    mod.stage(engine,self.doc)
            finally:
                mod.SELECTION=old

    def test_public_repo_guards_raw_fab_asset_paths(self):
        from audit_public_asset_hygiene import audit_tracked
        protected=[
            "mobile/StarfortUnreal/Content/ParagonWraith/Characters/Heroes/Wraith/SK_Wraith.uasset",
            "mobile/StarfortUnreal/Content/Fab/Heroes/paid_character.uasset",
            "mobile/StarfortUnreal/Content/Marketplace/AnotherHero.uasset",
            "mobile/StarfortUnreal/ContentPipeline/Incoming/HeroCinematicV1/T_Rovan_Splash.png",
        ]
        self.assertEqual(audit_tracked(protected),protected)
        safe=[
            "mobile/StarfortUnreal/ContentPipeline/fab_hero_reference_v1.json",
            "mobile/StarfortUnreal/Tools/fab_character_review.py",
            "mobile/StarfortUnreal/Content/Characters/Heroes/OriginalSTARFORT.uasset",
        ]
        self.assertEqual(audit_tracked(safe),[])
        source=(mod.ROOT/".gitignore").read_text()
        for rule in ("Content/Paragon*/","Content/Fab*/","Content/Marketplace*/",
                     "ContentPipeline/Incoming/"):
            self.assertIn(rule,source)

    def test_refuse_wrong_pack_or_unsafe_asset_path(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"selection.json"
            sample=dict(self.selection)
            sample["vesper"]=self.selection["rovan"]
            path.write_text(json.dumps({
                "source":"user_imported_fab_library",
                "for_art_review_only":True,
                "selected_skeletal_meshes":sample,
            }))
            with self.assertRaisesRegex(ValueError,"own legitimately acquired Fab pack"):
                mod.read_selected(path,self.doc)
            self.assertRaises(ValueError,mod.canonical_asset_path,
                              "../../Game/Hero/Skeletal")


if __name__=="__main__":
    unittest.main()
