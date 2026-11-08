#!/usr/bin/env python3
"""STARFORT v77: actual high-quality Unreal/Fab 3D character staging (EDITOR ONLY).

This does NOT generate/parrot a character from a PNG and does NOT download
copyrighted Fab/Paragon source assets. The developer accepts the EULA in Fab
and imports packs locally. Once four genuine SkeletalMeshes are installed,
--scan finds them; --stage creates a NEW isolated .umap review scene with
four actual skinned characters, lights and a camera.

No gameplay, database, level, premium-signoff, damage or player account data
can be modified by this script. Never package the source Paragon packs in the
public STARFORT GitHub repo. Review stage MUST remain outside release maps.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"ContentPipeline/fab_hero_reference_v1.json"
QA=ROOT/"Saved/QA"
SCAN_REPORT=QA/"fab_character_candidates.json"
SELECTION=QA/"fab_hero_selection.json"
STAGE_REPORT=QA/"fab_character_preview_report.json"
IDS=("rovan","aldren","lyra","vesper")
REVIEW_LEVEL="/Game/Maps/L_StarfortFabCharacterReview"

def validate_manifest(doc):
    errors=[]
    heroes=doc.get("heroes",[])
    if not isinstance(heroes,list) or [x.get("hero_id") for x in heroes]!=list(IDS):
        errors.append("Four original STARFORT hero IDs must be stable")
        return errors
    if doc.get("never_redistribute_fab_sources") is not True:
        errors.append("Never commit third-party Paragon source packs")
    if doc.get("never_mark_production_approved") is not True:
        errors.append("Reference preview may never self-approve production art")
    if doc.get("requires_fab_user_eula_acceptance") is not True:
        errors.append("Only user-acquired Fab packs may be inspected")
    if doc.get("does_not_change_backend_roster") is not True:
        errors.append("Reference art may not rename or reset Supabase heroes")
    if doc.get("review_level")!=REVIEW_LEVEL:
        errors.append("Preview must be separate from gameplay maps")
    urls=set()
    roots=set()
    for h in heroes:
        url=h.get("source_url","")
        root=h.get("expected_root","")
        if not isinstance(url,str) or not url.startswith("https://www.fab.com/listings/") or url in urls:
            errors.append("Missing or repeated official Fab character listing")
        if not isinstance(root,str) or not root.startswith("/Game/Paragon") or root in roots:
            errors.append("Must use exact source-pack namespace")
        if h.get("final_approval") is not False:
            errors.append("Preview is not a new AAA STARFORT character")
        urls.add(url);roots.add(root)
    return errors

def name_score(path,hero_name):
    """Only rank candidates to help an artist choose, never auto-approve."""
    stem=path.rsplit("/",1)[-1].lower().split(".")[0]
    compact="".join(c for c in hero_name.lower() if c.isalnum())
    exact="".join(c for c in stem if c.isalnum())
    score=0
    if compact in exact:score+=9
    if "mesh" in path.lower() or stem.startswith(("sk_","skm_")):score+=4
    if "/characters/" in path.lower():score+=2
    if stem.endswith(("base","body","hero")):score+=2
    for partial in ("weapon","head","hair","face","eyes","attachment",
                    "physics","skeleton","mini","preview","lod"):
        if partial in stem:score-=12
    return score

def canonical_asset_path(value):
    if not isinstance(value,str) or not value.startswith("/Game/"):
        raise ValueError("Selection must be a real /Game Unreal asset path")
    if ".." in value or "\\" in value or ":" in value or len(value)>400:
        raise ValueError("Untrusted Unreal asset path")
    return value.strip()

def read_selected(path,manifest):
    with Path(path).open(encoding="utf-8") as fp:
        selection=json.load(fp)
    if selection.get("source")!="user_imported_fab_library" or (
        selection.get("for_art_review_only") is not True):
        raise ValueError("Cannot stage unlicensed/unreviewed meshes")
    entries=selection.get("selected_skeletal_meshes")
    if not isinstance(entries,dict) or set(entries)!=set(IDS):
        raise ValueError("Select exactly four original server hero IDs")
    output={}
    for hero in manifest["heroes"]:
        hid=hero["hero_id"]
        asset=canonical_asset_path(entries[hid])
        if not asset.lower().startswith(hero["expected_root"].lower()+"/"):
            raise ValueError(hid+" must use its own legitimately acquired Fab pack")
        if asset in output.values():raise ValueError("Duplicate rigs cannot represent four heroes")
        output[hid]=asset
    return output

def asset_candidates(unreal,doc):
    assets=unreal.EditorAssetLibrary
    report=[]
    for hero in doc["heroes"]:
        root=hero["expected_root"]
        if not assets.does_directory_exist(root):
            report.append({
                "hero_id":hero["hero_id"],
                "source_pack":hero["source_asset"],
                "found":False,
                "candidates":[],
                "issue":"Fab pack has not been added to the local Unreal project",
            })
            continue
        all_paths=assets.list_assets(root,recursive=True,include_folder=False)
        matches=[]
        for asset_path in all_paths:
            # Avoid loading tens of thousands of huge VFX/material assets.
            path=str(asset_path)
            if name_score(path,hero["source_hero_name"]) < 2:
                continue
            try:
                obj=assets.load_asset(path)
                if not obj or obj.get_class().get_name()!="SkeletalMesh":
                    continue
                mats=obj.get_editor_property("materials")
                skeleton=obj.get_editor_property("skeleton")
                if not skeleton or not mats:continue
                matches.append({
                    "path":path,
                    "name_score":name_score(path,hero["source_hero_name"]),
                    "material_slots":len(mats),
                    "skeleton":str(skeleton.get_path_name()),
                    "is_actual_skeletal_mesh":True,
                })
            except (AttributeError,RuntimeError,TypeError,ValueError):
                # Bad imported asset should not be approved by name alone.
                continue
        matches.sort(key=lambda x:(-x["name_score"],-x["material_slots"],x["path"]))
        report.append({
            "hero_id":hero["hero_id"],
            "source_pack":hero["source_asset"],
            "found":bool(matches),
            "candidates":matches[:25],
            "issue":"" if matches else "No confirmed skinned SkeletalMesh with material slots found",
        })
    return report

def scan(unreal,doc):
    QA.mkdir(parents=True,exist_ok=True)
    candidates=asset_candidates(unreal,doc)
    all_found=all(row["found"] for row in candidates)
    output={
        "purpose":"Unreal Editor 5.8 actual-content review only",
        "scanned_real_editor":True,
        "all_four_have_real_skeletal_mesh_candidates":all_found,
        "user_eula_acceptance_must_be_confirmed":True,
        "starfort_original_hero_art_approved":False,
        "candidates":candidates,
    }
    SCAN_REPORT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    template={
        "source":"user_imported_fab_library",
        "for_art_review_only":True,
        "selected_skeletal_meshes":{
            row["hero_id"]:row["candidates"][0]["path"] if row["candidates"] else ""
            for row in candidates
        },
    }
    # Art selection is a manual, one-time approval. Never overwrite artist's
    # existing selection because candidates can change between imports.
    if not SELECTION.exists():
        SELECTION.write_text(json.dumps(template,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return output

def stage(unreal,doc):
    selection=read_selected(SELECTION,doc)
    lib=unreal.EditorAssetLibrary
    imported=[]
    for hero in doc["heroes"]:
        hid=hero["hero_id"]
        path=selection[hid]
        if not lib.does_asset_exist(path):
            raise RuntimeError(hid+": real Fab SkeletalMesh is not installed: "+path)
        obj=lib.load_asset(path)
        if not obj or obj.get_class().get_name()!="SkeletalMesh":
            raise RuntimeError(hid+": selection is not actual Unreal SkeletalMesh")
        try:
            if not obj.get_editor_property("skeleton") or not obj.get_editor_property("materials"):
                raise RuntimeError(hid+": skinned mesh or surface material is missing")
        except (AttributeError,TypeError) as exc:
            raise RuntimeError(hid+": cannot audit actual mesh materials/skeleton") from exc
        imported.append((hid,obj,path))
    # Do not overwrite existing authored maps or production gameplay levels.
    if lib.does_asset_exist(REVIEW_LEVEL):
        raise RuntimeError("Reference map exists; preserving existing scene: "+REVIEW_LEVEL)
    levels=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    if not levels or not actors or not levels.new_level(REVIEW_LEVEL,False):
        raise RuntimeError("Could not create a separate Unreal art review level")
    real_actors=[]
    for i,(hid,mesh,path) in enumerate(imported):
        actor=actors.spawn_actor_from_class(
            unreal.SkeletalMeshActor,
            unreal.Vector(0.0,(i-1.5)*260.0,0.0),
            unreal.Rotator(0.0,0.0,0.0),
        )
        if not actor:
            raise RuntimeError("Unable to stage actual SkeletalMeshActor for "+hid)
        comp=actor.get_component_by_class(unreal.SkeletalMeshComponent)
        if not comp:
            raise RuntimeError("Unreal actor contains no skeletal mesh component")
        comp.set_skeletal_mesh_asset(mesh)
        comp.set_editor_property("cast_shadow",True)
        actor.set_actor_label("STARFORT_REFERENCE_ONLY_"+hid+"_NOT_FINAL")
        real_actors.append({"hero_id":hid,"asset_path":path,
                            "editor_actor":actor.get_actor_label()})
    # Genuine Unreal light/camera only, no fake hero geometry.
    sun=actors.spawn_actor_from_class(
        unreal.DirectionalLight,
        unreal.Vector(0,0,640),unreal.Rotator(-38.0,-25.0,0))
    sky=actors.spawn_actor_from_class(
        unreal.SkyLight,unreal.Vector(0,0,150),unreal.Rotator(0,0,0))
    camera=actors.spawn_actor_from_class(
        unreal.CameraActor,
        unreal.Vector(960,0,160),unreal.Rotator(-2.5,180,0))
    for obj,label in ((sun,"STARFORT_Reference_Key_Light"),
                      (sky,"STARFORT_Reference_Fill_Light"),
                      (camera,"STARFORT_Reference_Camera")):
        if obj:obj.set_actor_label(label)
    if not levels.save_current_level():
        raise RuntimeError("Failed to save actual Unreal art review .umap")
    QA.mkdir(parents=True,exist_ok=True)
    report={
        "actual_unreal_editor_scene_saved":True,
        "actual_skeletal_mesh_actors":len(real_actors),
        "scene":REVIEW_LEVEL,
        "actors":real_actors,
        "shipped_to_players":False,
        "original_starfort_character_art_completed":False,
        "Niagara_finished":False,
        "mobile_performance_approved":False,
        "licensed_raw_assets_in_public_repo":False,
        "source_pack_names_are_for_editor_review_only":True,
        "note":"Source Epic characters are only a technical/art baseline; redesign and manual license/art/device approval still required.",
    }
    STAGE_REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report

def main(argv=None):
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--scan",action="store_true")
    mode.add_argument("--stage",action="store_true")
    mode.add_argument("--contract",action="store_true")
    a=parser.parse_args(argv)
    doc=json.loads(MANIFEST.read_text(encoding="utf-8"))
    issues=validate_manifest(doc)
    if issues:
        print(json.dumps({"issues":issues,"real_unreal_assets_found":False},indent=2))
        return 2
    if a.contract:
        print(json.dumps({"valid_source_contract":True,"heroes":list(IDS),
                          "real_unreal_assets_found":False,
                          "production_approved":False},indent=2))
        return 0
    try:
        import unreal
    except ImportError:
        print("Use --scan or --stage inside Unreal Engine 5.8 Editor (PythonScriptPlugin)",file=sys.stderr)
        return 2
    result=scan(unreal,doc) if a.scan else stage(unreal,doc)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if (a.scan and result["all_four_have_real_skeletal_mesh_candidates"]) or a.stage else 2

if __name__=="__main__":
    sys.exit(main())
