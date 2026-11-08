"""STARFORT v2 seven-hero real GLB structural QA. NOT an Unreal render test."""
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from validate_hero_v2_models import (
    ROOT,DESIGNS,audit_contract,audit_design,open_glb,validate_model
)


def synthetic_glb(*, rig=True, keyed=True, clips=("idle","walk","run","strike",
            "guard","feint","rally","special","hit","death")):
    """Minimal test blob: proves the parser can reject lies, not a usable hero."""
    raw=b"\x01"*8192
    prim={"mode":4,"indices":5,"material":0,
          "attributes":{"POSITION":0,"NORMAL":1,"TEXCOORD_0":2}}
    if rig:prim["attributes"].update({"JOINTS_0":3,"WEIGHTS_0":4})
    acc=[
        {"bufferView":0,"componentType":5126,"count":3,"type":"VEC3"},
        {"bufferView":0,"componentType":5126,"count":3,"type":"VEC3"},
        {"bufferView":0,"componentType":5126,"count":3,"type":"VEC2"},
        {"bufferView":0,"componentType":5123,"count":3,"type":"VEC4"},
        {"bufferView":0,"componentType":5126,"count":3,"type":"VEC4"},
        {"bufferView":0,"componentType":5123,"count":3,"type":"SCALAR"},
        {"bufferView":0,"componentType":5126,"count":2,"type":"SCALAR"},
        {"bufferView":0,"componentType":5126,"count":2,"type":"VEC3"},
    ]
    material={"pbrMetallicRoughness":{
        "baseColorTexture":{"index":0},
        "metallicRoughnessTexture":{"index":2}},
        "normalTexture":{"index":1}}
    nodes=[{} for _ in range(40)]
    nodes.append({"mesh":0,**({"skin":0} if rig else {})})
    model={
        "asset":{"version":"2.0"},
        "buffers":[{"byteLength":len(raw)}],
        "bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":len(raw)}],
        "accessors":acc,
        "nodes":nodes,
        "meshes":[{"primitives":[prim]}],
        "materials":[material],
        "textures":[{"source":i} for i in range(3)],
        "images":[{"bufferView":0,"mimeType":"image/png"} for _ in range(3)],
        "animations":[
            {"name":name,
             "channels":[{"sampler":0,"target":{"node":0,"path":"translation"}}] if keyed else [],
             "samplers":[{"input":6,"output":7}] if keyed else []}
            for name in clips
        ],
    }
    if rig:model["skins"]=[{"joints":list(range(40))}]
    js=json.dumps(model,separators=(",",":")).encode()
    js+=b" " *((-len(js))%4)
    header=b"glTF"+struct.pack("<II",2,12+8+len(js)+8+len(raw))
    return header+struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack(
        "<II",len(raw),0x004E4942)+raw


class ReplacementQuality(unittest.TestCase):
    def test_all_seven_original_ids_preserve_account_progression(self):
        manifest=json.loads(DESIGNS.read_text(encoding="utf-8"))
        self.assertEqual(audit_contract(manifest),[])
        self.assertEqual(len(manifest["heroes"]),7)
        self.assertTrue(all(h["approved"] is False for h in manifest["heroes"]))
        self.assertEqual(len(set(h["server_id"] for h in manifest["heroes"])),7)
        self.assertIn("never renamed",manifest["backend_contract"])
    def test_actual_glb_contains_keyframed_skin_and_pbr(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/"sample.glb"
            f.write_bytes(synthetic_glb())
            data,_=open_glb(f)
            tris,clips=validate_model(data,skinned=True,require_animations=[
                "idle","walk","run","strike","guard","feint","rally","special","hit","death"])
            self.assertEqual(tris,1)  # structural fake, cannot be approved as art
            self.assertEqual(len(clips),10)
    def test_static_glb_cannot_become_hero(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/"flat.glb"
            f.write_bytes(synthetic_glb(rig=False))
            data,_=open_glb(f)
            with self.assertRaisesRegex(ValueError,"rigged skeleton"):
                validate_model(data,skinned=True,require_animations=["idle"])
    def test_clip_names_without_keyframes_are_not_animations(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/"fake-motion.glb"
            f.write_bytes(synthetic_glb(keyed=False))
            data,_=open_glb(f)
            with self.assertRaisesRegex(ValueError,"keyed animations"):
                validate_model(data,skinned=True,require_animations=["strike"])
    def test_corrupt_header_and_pictures_are_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/"portrait.glb"
            f.write_bytes(b"RIFF\0\0\0\0WEBPVP8 ")
            with self.assertRaisesRegex(ValueError,"not binary GLB"):
                open_glb(f)
            blob=synthetic_glb()
            f.write_bytes(blob[:-2])
            with self.assertRaisesRegex(ValueError,"header length"):
                open_glb(f)
    def test_missing_real_models_must_block_cutover(self):
        cfg=json.loads(DESIGNS.read_text())
        with tempfile.TemporaryDirectory() as d:
            issues,counts=audit_design(cfg,Path(d))
            self.assertEqual(len(issues),28)
            self.assertEqual(counts,{})
            self.assertTrue(all("real GLB file is missing" in msg for msg in issues))
    def test_new_3d_gate_rejects_legacy_native_fallback(self):
        h=(ROOT/"Source/StarfortUnreal/Public/StarfortHeroCombatAsset.h").read_text()
        cpp=(ROOT/"Source/StarfortUnreal/Private/StarfortHeroCombatAsset.cpp").read_text()
        stage=(ROOT/"Source/StarfortUnreal/Private/StarfortBattleStage.cpp").read_text()
        self.assertIn("VisualGeneration = 0",h)
        self.assertIn("bLegacyPlaceholder = true",h)
        self.assertIn("VisualGeneration!=2",cpp)
        self.assertIn("bLegacyPlaceholder",cpp)
        self.assertIn("VisualReviewId.IsEmpty()",cpp)
        self.assertNotIn("VerifiedShotMontage",stage)
        self.assertNotIn("HeroSkillMontage",stage)


if __name__=="__main__":
    unittest.main()
