#!/usr/bin/env python3
"""STARFORT v74 - import actual 2D cinematic hero art into Unreal 5.8.

Run this Python script from inside an Unreal Editor session after extracting
STARFORT_CinematicV1_UE5_Integration.zip into mobile/StarfortUnreal/.
The import NEVER upgrades, unlocks or changes player stats; the art is NOT a
skeletal mesh, Niagara effect or signed mobile binary.

Exact packaged destination paths are referenced by UStarfortHeroScreen:
  /Game/UI/HeroCinematicV1/T_Rovan_Splash.T_Rovan_Splash
and corresponding Portrait and Skill_01..04 for all 4 heroes.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"ContentPipeline/Incoming/HeroCinematicV1"
MANIFEST=ART.parent/"manifest.json"
DESTINATION="/Game/UI/HeroCinematicV1"
CANONICAL=("rovan","aldren","lyra","vesper")
KINDS=("splash","portrait","card","skill_01","skill_02",
       "skill_03","skill_04")

def expected_filename(hero,kind):
    return "T_"+hero.capitalize()+"_"+(
        "Skill_"+kind.split("_",1)[1] if kind.startswith("skill_")
        else kind.capitalize()
    )+".png"

def validate_package():
    """Plain Python preflight: fails without a real 28-image source package."""
    errors=[]
    if not MANIFEST.is_file():
        return ["Cinematic 2D art package not installed; see v74 guide"],[]
    try:
        doc=json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError,ValueError) as exc:
        return ["Invalid art manifest: "+str(exc)],[]
    if doc.get("art_kind")!="two_dimensional_cinematic_hero_ui" or (
        doc.get("real_3d_models") is not False):
        errors.append("Manifest must explicitly distinguish 2D UI from 3D models")
    if doc.get("hero_ids")!=list(CANONICAL):
        errors.append("Server hero IDs must remain rovan, aldren, lyra, vesper")
    rows=doc.get("assets",[])
    if not isinstance(rows,list) or len(rows)!=28:
        return errors+["Expected 28 real 2D PNG assets"],[]
    expected={(hero,kind) for hero in CANONICAL for kind in KINDS}
    seen=set()
    valid=[]
    for row in rows:
        if not isinstance(row,dict):
            errors.append("Malformed artwork row")
            continue
        hero=row.get("hero")
        kind=row.get("kind")
        pair=(hero,kind)
        if pair not in expected or pair in seen:
            errors.append("Unknown or duplicated hero/kind identity")
            continue
        seen.add(pair)
        filename=expected_filename(hero,kind)
        if row.get("file")!=filename:
            errors.append("Mismatched PNG name for "+str(pair))
            continue
        path=ART/filename
        try:
            data=path.read_bytes()
        except OSError:
            errors.append("Missing actual cinematic art: "+filename)
            continue
        if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data)<1000:
            errors.append("Not a real PNG: "+filename)
            continue
        if row.get("bytes")!=len(data) or row.get("sha256")!=hashlib.sha256(data).hexdigest():
            errors.append("Artist source file changed or corrupted: "+filename)
            continue
        if len(data)<24 or data[12:16]!=b"IHDR":
            errors.append("PNG IHDR missing: "+filename)
            continue
        width,height=struct.unpack(">II",data[16:24])
        minimum=128 if kind in {"splash","portrait","card"} else 48
        if width<minimum or height<minimum:
            errors.append("Too small for hero gallery: "+filename)
            continue
        valid.append((hero,kind,path))
    if seen!=expected:errors.append("One or more cinematic hero references are missing")
    return errors,valid

def import_art():
    errors,rows=validate_package()
    if errors:
        raise RuntimeError("STARFORT art preflight failed:\n"+"\n".join(errors))
    try:
        import unreal
    except ImportError as exc:
        raise RuntimeError("Run import inside Unreal Editor 5.8 PythonScriptPlugin") from exc
    editor_assets=unreal.EditorAssetLibrary
    tasks=[]
    imported=[]
    already=[]
    tools=unreal.AssetToolsHelpers.get_asset_tools()

    # Never overwrite artist-approved UTexture2D/Widget Blueprint files.
    for _,_,filepath in rows:
        package=DESTINATION+"/"+filepath.stem
        if editor_assets.does_asset_exist(package):
            existing=editor_assets.load_asset(package)
            if not existing or not existing.is_a(unreal.Texture2D):
                raise RuntimeError("Unexpected asset at: "+package)
            already.append(package)
            continue
        task=unreal.AssetImportTask()
        task.set_editor_property("filename",str(filepath))
        task.set_editor_property("destination_path",DESTINATION)
        task.set_editor_property("automated",True)
        task.set_editor_property("replace_existing",False)
        task.set_editor_property("save",True)
        tasks.append(task)
    if tasks:
        tools.import_asset_tasks(tasks)
    for task in tasks:
        imported.extend([str(p) for p in task.get_editor_property("imported_object_paths")])
    errors=[]
    for _,_,filepath in rows:
        package=DESTINATION+"/"+filepath.stem
        if not editor_assets.does_asset_exist(package):
            errors.append("Missing imported UTexture2D: "+package)
    result={
        "source_kind":"cinematic_2d_ui_only",
        "expected":28,
        "new_imported":len(imported),
        "existing":len(already),
        "unreal_textures_verified":not errors,
        "actual_3d_meshes_created":False,
        "gameplay_backend_modified":False,
        "errors":errors,
    }
    report=ROOT/"Saved/QA/CinematicHeroUI_Import.json"
    report.parent.mkdir(parents=True,exist_ok=True)
    report.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    unreal.log("STARFORT cinematic gallery art report: "+str(report))
    if errors:
        raise RuntimeError("Cinematic hero import incomplete: "+str(errors))
    return result

if __name__=="__main__":
    if "--check" in sys.argv:
        issues,rows=validate_package()
        print(json.dumps({"valid":not issues,"verified_sources":len(rows),
                          "errors":issues},indent=2))
        sys.exit(2 if issues else 0)
    result=import_art()
    print(json.dumps(result,indent=2))
