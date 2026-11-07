#!/usr/bin/env python3
"""Honest STARFORT premium mobile art gate.

--schema-only verifies the asset delivery contract without claiming any art exists.
--release fails until licensed assets, review metadata, multi-LOD and the mobile
device signoff are present. A structural pass never proves photorealistic quality.
"""
import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"ContentPipeline/required_premium_assets.json"
REQUIRED={"royal_gunner","royal_energy_cannon","enemy_raider","enemy_caster",
          "castle_keep","castle_gate","castle_wall","castle_barracks",
          "castle_farm","castle_forge","castle_observatory","battle_arena"}
KINDS={"rigged_character","weapon","environment"}
CHANNELS={"base_color","normal","metallic_roughness","emissive"}
SAFE_EXT={".glb",".gltf",".fbx",".uasset"}

def validate(require_art=False):
    manifest=json.loads(MANIFEST.read_text(encoding="utf-8"))
    errors=[]
    if manifest.get("schema_version")!=1: errors.append("Unknown asset manifest version")
    if manifest.get("engine")!="Unreal Engine 5.8": errors.append("Engine mismatch")
    if set(manifest.get("platforms",[]))!={"iOS","Android"}: errors.append("Must target native iOS and Android")
    assets=manifest.get("assets")
    if not isinstance(assets,list): return ["No assets array"],0
    ids=[a.get("key") for a in assets if isinstance(a,dict)]
    if len(ids)!=len(set(ids)) or set(ids)!=REQUIRED: errors.append("Missing/duplicate production asset IDs")
    for a in assets:
        if not isinstance(a,dict): errors.append("Malformed asset");continue
        key=str(a.get("key",""))
        kind=a.get("kind")
        if kind not in KINDS: errors.append(f"{key}: unknown asset kind")
        if int(a.get("min_lods",0))<3: errors.append(f"{key}: need >= 3 authored mobile LODs")
        if not {"base_color","normal","metallic_roughness"}.issubset(set(a.get("material_channels",[]))):
            errors.append(f"{key}: not a proper PBR material")
        if not set(a.get("material_channels",[])).issubset(CHANNELS):
            errors.append(f"{key}: invalid channel")
        if kind=="rigged_character":
            if int(a.get("bones",0))<(40 if key=="royal_gunner" else 24):
                errors.append(f"{key}: insufficient rig")
            clips=set(a.get("animations",[]))
            if not {"idle","hit","death"}.issubset(clips) or (key=="royal_gunner" and not {"aim","fire","run","special"}.issubset(clips)):
                errors.append(f"{key}: missing animation clips")
        elif "bones" in a or "animations" in a:
            errors.append(f"{key}: non-character must not masquerade as a rig")
        file=a.get("source_file")
        if file is not None:
            if not isinstance(file,str) or file.startswith(("/","\\","~")) or ".." in Path(file).parts:
                errors.append(f"{key}: source must be a relative in-project asset path")
            elif Path(file).suffix.lower() not in SAFE_EXT:
                errors.append(f"{key}: source format not supported")
        if require_art:
            if not file or not (ROOT/file).is_file():
                errors.append(f"{key}: required mesh/model asset not supplied")
            if not a.get("license_id"): errors.append(f"{key}: source licence/provenance missing")
            if a.get("mobile_reviewed") is not True: errors.append(f"{key}: art director mobile approval missing")
            if a.get("device_reviewed") is not True: errors.append(f"{key}: device profile review missing")
    if require_art:
        report=ROOT/"ContentPipeline/device_acceptance.json"
        if not report.is_file():
            errors.append("Physical-device profile report missing")
        else:
            evidence=json.loads(report.read_text(encoding="utf-8"))
            if len(evidence.get("devices",[]))<2:
                errors.append("Require at least one iOS and one Android device")
            if not {"ios","android"}.issubset({d.get("platform","").lower() for d in evidence.get("devices",[])}):
                errors.append("Missing iOS or Android device evidence")
            if any(float(d.get("p10_fps",0))<27 for d in evidence.get("devices",[])):
                errors.append("Sustained low-percentile FPS failed quality floor")
    return errors,len(assets)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--schema-only",action="store_true",help="Validate manifest only, does not approve release")
    parser.add_argument("--release",action="store_true",help="Require actual reviewed files and device report")
    args=parser.parse_args()
    errors,count=validate(require_art=bool(args.release))
    print(json.dumps({"assets":count,"mode":"release" if args.release else "contract-only",
                      "ok":not errors,"release_ready":bool(args.release) and not errors,
                      "issues":errors},ensure_ascii=False,indent=2))
    raise SystemExit(0 if not errors else 2)
