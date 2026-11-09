#!/usr/bin/env python3
"""Import ORIGINAL STARFORT v79 GLB battlefield into an authored Unreal map.

Run only inside Unreal Engine 5.8 Editor with PythonScriptPlugin enabled.
The supplied GLB has baked world transforms and 95 textured StaticMesh parts;
placing each imported component at the origin reconstructs its scene.

This imports NO character models, marks NO art reviewed, and refuses to
overwrite an existing level, asset, or previously staged battlefield.
"""
import hashlib
import json
import struct
from pathlib import Path
import unreal
from ash_arena_scale_review_v83 import imported_arena_uniform_scale

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"ContentPipeline/Incoming/Environment/Battle/StarfortAshBattlefield_v79.glb"
DEST="/Game/Environment/StarfortAshBattlefield_v79"
LEVEL="/Game/Maps/L_StarfortBattle"
EXPECTED_SHA256="f60553379ebc821eef57e9807a1bdb05dc6a771360f263854bc99214e0555d25"
REPORT=ROOT/"Saved/QA/ash_battlefield_import_v79.json"

def require_real_glb(path):
    data=path.read_bytes()
    if len(data)<10000 or data[:4]!=b"glTF":
        raise RuntimeError("Actual 3D GLB geometry is missing; cannot stage sprites")
    magic,version,size=struct.unpack_from("<4sII",data)
    if version!=2 or size!=len(data):
        raise RuntimeError("GLB version/declared size invalid")
    digest=hashlib.sha256(data).hexdigest()
    if digest!=EXPECTED_SHA256:
        raise RuntimeError("Arena file hash mismatch; use the reviewed original GLB")
    return digest

def stage():
    digest=require_real_glb(SOURCE)
    if not unreal.EditorAssetLibrary.does_asset_exist(LEVEL):
        raise RuntimeError("Native authored battle map missing: "+LEVEL)
    if unreal.EditorAssetLibrary.does_directory_exist(DEST):
        raise RuntimeError("Arena assets already imported; no destructive reimport")
    editor=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    if not editor or not actors:
        raise RuntimeError("Unreal Editor subsystems unavailable")
    task=unreal.AssetImportTask()
    task.set_editor_property("filename",str(SOURCE))
    task.set_editor_property("destination_path",DEST)
    task.set_editor_property("automated",True)
    task.set_editor_property("replace_existing",False)
    task.set_editor_property("save",True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    paths=list(task.get_editor_property("imported_object_paths"))
    meshes=[]
    for asset_path in paths:
        asset=unreal.EditorAssetLibrary.load_asset(str(asset_path))
        if asset and isinstance(asset,unreal.StaticMesh):
            meshes.append(asset)
    if len(meshes)<70:
        raise RuntimeError(
            "Expected many actual imported rock/terrain StaticMeshes; "
            "Unreal Interchange import must be inspected before level placement")
    # Real imported mesh bounds determine whether glTF meters were converted
    # into Unreal centimeters by this machine's Interchange configuration.
    scale=imported_arena_uniform_scale(meshes)
    if not editor.load_level(LEVEL):
        raise RuntimeError("Unreal battle level cannot be opened")
    for actor in actors.get_all_level_actors():
        if actor.get_actor_label().startswith("STARFORT_AshArena_v79_"):
            raise RuntimeError("Battlefield already staged; preserve artist placement")
    for i,mesh in enumerate(meshes):
        actor=actors.spawn_actor_from_class(
            unreal.StaticMeshActor,
            unreal.Vector(0.0,0.0,0.0),
            unreal.Rotator(0.0,0.0,0.0))
        if not actor:
            raise RuntimeError("Failed to spawn an imported 3D terrain component")
        actor.static_mesh_component.set_static_mesh(mesh)
        actor.set_actor_scale3d(unreal.Vector(scale,scale,scale))
        actor.set_actor_label("STARFORT_AshArena_v79_"+str(i).zfill(3))
    if not editor.save_current_level():
        raise RuntimeError("Unable to save staged 3D battle map")
    report={
        "source_sha256":digest,
        "scene_map":LEVEL,
        "real_static_mesh_parts":len(meshes),
        "unreal_actor_uniform_scale":scale,
        "scale_verified_from_real_mesh_bounds":True,
        "new_real_3d_battlefield":True,
        "heroes_rigged_and_bound":False,
        "premium_mobile_art_approved":False,
        "unreal_editor_import_completed":True,
        "physical_device_qa":False,
    }
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    unreal.log("STARFORT: original 3D battlefield staged: "+str(REPORT))
    return report

if __name__=="__main__":
    stage()
