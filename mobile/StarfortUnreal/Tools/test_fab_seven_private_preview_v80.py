"""Private seven Fab hero preview source checks, never an Unreal Editor proof."""
import contextlib
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import fab_seven_private_preview_v80 as preview


class MockClass:
    def __init__(self,name):self.name=name
    def get_name(self):return self.name


class Mesh:
    def __init__(self,path):
        self.path=path
        self.skeleton=types.SimpleNamespace(get_path_name=lambda:"/Game/TestRig")
    def get_class(self):return MockClass("SkeletalMesh")
    def get_editor_property(self,p):
        if p=="skeleton":return self.skeleton
        if p=="materials":return ["PBR_Paint","PBR_Fabric"]
        raise ValueError(p)
    def get_path_name(self):return self.path


class Library:
    def __init__(self,mapping,preexisting=False):
        self.assets={p:Mesh(p) for p in mapping.values() if p}
        self.preexisting=preexisting
    def does_asset_exist(self,p):
        return p in self.assets or (self.preexisting and p==preview.SHOWCASE)
    def does_directory_exist(self,root):
        return any(p.lower().startswith(root.lower()+"/") for p in self.assets)
    def list_assets(self,root,recursive=True,include_folder=False):
        return [p for p in self.assets if p.startswith(root+"/")]
    def load_asset(self,path):return self.assets.get(path)


class TestSevenFabPrivatePreview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc=json.loads(preview.MANIFEST.read_text(encoding="utf-8"))
        cls.paths={
            h["hero_id"]:h["expected_root"]+
                "/Characters/Heroes/"+h["source_hero_name"].replace(" ","")+
                "/Meshes/SK_"+h["source_hero_name"].replace(" ","")
            for h in cls.doc["heroes"]
        }

    def test_all_seven_verified_fab_sources_in_original_roster(self):
        self.assertEqual(preview.validate_contract(self.doc),[])
        self.assertEqual(tuple(h["hero_id"] for h in self.doc["heroes"]),preview.IDS)
        self.assertEqual(len({h["expected_root"] for h in self.doc["heroes"]}),7)
        self.assertTrue(all(h["source_url"].startswith("https://www.fab.com/listings/") for h in self.doc["heroes"]))
        self.assertTrue(all(h["final_approval"] is False for h in self.doc["heroes"]))

    def test_unlicensed_or_production_preview_bypass_rejected(self):
        obj=json.loads(json.dumps(self.doc))
        obj["never_redistribute_fab_sources"]=False
        self.assertTrue(preview.validate_contract(obj))
        obj=json.loads(json.dumps(self.doc))
        obj["battle_level"]="/Game/Maps/L_StarfortBattle"
        self.assertTrue(preview.validate_contract(obj))
        with self.assertRaises(ValueError):
            preview.canonical_path("/Game/Unapproved/Shared/SK_1",self.doc["heroes"][0]["expected_root"])
        with self.assertRaises(ValueError):
            preview.canonical_path("/Game/ParagonWraith/../cheat",self.doc["heroes"][0]["expected_root"])

    def test_requires_real_install_and_manual_eula_acknowledgement(self):
        data={"source":"user_imported_fab_library","private_preview_only":True,
              "user_confirmed_fab_license":False,
              "selected_skeletal_meshes":dict(self.paths)}
        lib=Library(self.paths)
        unreal=types.SimpleNamespace(EditorAssetLibrary=lib)
        with self.assertRaisesRegex(ValueError,"Confirm individual Fab EULAs"):
            preview.accepted_meshes(unreal,self.doc,data)
        data["user_confirmed_fab_license"]=True
        loaded=preview.accepted_meshes(unreal,self.doc,data)
        self.assertEqual(len(loaded),7)
        self.assertTrue(all(mesh.get_class().get_name()=="SkeletalMesh" for mesh,path in loaded.values()))

    def test_missing_art_cannot_turn_into_placeholder_or_fake_four_player_fight(self):
        data={"source":"user_imported_fab_library","private_preview_only":True,
              "user_confirmed_fab_license":True,
              "selected_skeletal_meshes":dict(self.paths)}
        for h in preview.IDS[2:]:
            data["selected_skeletal_meshes"][h]=""
        lib=Library(self.paths)
        unreal=types.SimpleNamespace(EditorAssetLibrary=lib)
        with self.assertRaisesRegex(RuntimeError,"At least 4"):
            preview.accepted_meshes(unreal,self.doc,data)
        data["selected_skeletal_meshes"]["lyra"]=self.paths["lyra"]
        data["selected_skeletal_meshes"]["vesper"]=self.paths["vesper"]
        lib.assets.pop(self.paths["vesper"])
        with self.assertRaisesRegex(RuntimeError,"Imported model missing"):
            preview.accepted_meshes(unreal,self.doc,data)

    def test_scan_writes_only_local_qa_and_preserves_existing_eula_choice(self):
        unreal=types.SimpleNamespace(EditorAssetLibrary=Library(self.paths))
        with tempfile.TemporaryDirectory() as td:
            saved=(preview.QA,preview.SCAN,preview.SELECTION)
            try:
                preview.QA=Path(td)
                preview.SCAN=Path(td)/"scan.json"
                preview.SELECTION=Path(td)/"selected.json"
                with patch.object(preview,"mesh_candidates",
                                  side_effect=lambda engine,h:[{"path":self.paths[h["hero_id"]],"score":9}]):
                    result=preview.inspect(unreal,self.doc)
                self.assertEqual(result["found_count"],7)
                self.assertFalse(result["actual_private_scene_created"])
                selected=json.loads(preview.SELECTION.read_text(encoding="utf-8"))
                self.assertFalse(selected["user_confirmed_fab_license"])
                self.assertEqual(selected["selected_skeletal_meshes"],self.paths)
                selected["user_confirmed_fab_license"]=True
                selected["selected_skeletal_meshes"]["rovan"]="/Game/ParagonWraith/MY_CHOICE"
                preview.SELECTION.write_text(json.dumps(selected),encoding="utf-8")
                with patch.object(preview,"mesh_candidates",
                                  side_effect=lambda engine,h:[{"path":self.paths[h["hero_id"]],"score":9}]):
                    preview.inspect(unreal,self.doc)
                selected=json.loads(preview.SELECTION.read_text(encoding="utf-8"))
                self.assertTrue(selected["user_confirmed_fab_license"])
                self.assertEqual(selected["selected_skeletal_meshes"]["rovan"],"/Game/ParagonWraith/MY_CHOICE")
            finally:
                preview.QA,preview.SCAN,preview.SELECTION=saved

    def test_staging_only_creates_two_separate_editor_maps_not_actual_quests(self):
        unreal=types.SimpleNamespace(EditorAssetLibrary=Library(self.paths))
        selected={"source":"user_imported_fab_library","private_preview_only":True,
                  "user_confirmed_fab_license":True,"selected_skeletal_meshes":dict(self.paths)}
        with tempfile.TemporaryDirectory() as td:
            saved=(preview.QA,preview.SELECTION,preview.REPORT)
            try:
                preview.QA=Path(td);preview.SELECTION=Path(td)/"selected.json";preview.REPORT=Path(td)/"report.json"
                preview.SELECTION.write_text(json.dumps(selected),encoding="utf-8")
                created=[]
                def create(ue,doc,chosen,battle,arena):
                    created.append(battle)
                    return {"path":preview.BATTLE if battle else preview.SHOWCASE,
                            "actual_skinned_character_actors":[{"hero_id":"rovan"}]}
                with patch.object(preview,"available_original_arena",return_value=[]):
                    with patch.object(preview,"new_private_map",side_effect=create):
                        report=preview.stage(unreal,self.doc)
                self.assertEqual(created,[False,True])
                self.assertEqual(report["native_editor_maps_created"],2)
                self.assertEqual(report["real_fab_skeletal_heroes"],7)
                self.assertFalse(report["real_ue_mobile_apk_created"])
                self.assertFalse(report["real_online_battle_played"])
                self.assertFalse(report["production_quality_approved"])
                unreal.EditorAssetLibrary.preexisting=True
                created.clear()
                with patch.object(preview,"available_original_arena",return_value=[]):
                    with patch.object(preview,"new_private_map",side_effect=create):
                        with self.assertRaisesRegex(RuntimeError,"Refuse to overwrite"):
                            preview.stage(unreal,self.doc)
                self.assertEqual(created,[])
            finally:
                preview.QA,preview.SELECTION,preview.REPORT=saved

    def test_idle_animation_serialized_and_pie_camera_not_a_production_map(self):
        source=(HERE/"fab_seven_private_preview_v80.py").read_text(encoding="utf-8")
        for text in (
            "component.override_animation_data(clip,is_looping=True,is_playing=True)",
            "unreal.SkeletalMeshActor", "unreal.CameraActor",
            '"/Script/StarfortUnreal.StarfortFabPreviewGameMode"', "user_confirmed_fab_license",
            "L_StarfortPrivateFabPlaytest_v80",
            "L_StarfortPrivateFabBattle_v80",
        ):
            self.assertIn(text,source)
        self.assertNotIn("bArtApprovedForMobile=True",source)
        self.assertNotIn("OnMissionResult.Broadcast(",source)
        self.assertNotIn("UGameplayStatics::OpenLevel",source)
        self.assertNotIn("https://api.fab.com",source)

    def test_private_maps_not_sneaked_into_mobile_shipping_cooking(self):
        build=(HERE/"native_mobile_build.py").read_text(encoding="utf-8")
        project=(preview.ROOT/"Config/DefaultEngine.ini").read_text(encoding="utf-8")
        for asset in ("L_StarfortPrivateFabBattle_v80","L_StarfortPrivateFabPlaytest_v80"):
            self.assertNotIn(asset,build)
            self.assertNotIn(asset,project)


if __name__=="__main__":
    unittest.main()
