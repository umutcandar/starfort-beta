#!/usr/bin/env python3
"""Unreal Editor 5.8: stage REAL user-licensed Paragon models for server battle.

This adds a strictly Development-only visual review bridge to the existing
L_StarfortBattle with unchanged authoritative StarfortBattleGameMode.
Only local user-accepted Epic/Fab assets with distinct SAME-SKELETON
AnimSequence idle + attack clips may be referenced. No fake HP, rewards,
login, or production bArtApproved flag is written. Refuse overwrite.
"""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/"Saved/QA"
SELECTION=QA/"fab_seven_private_selection_v80.json"
REPORT=QA/"verified_fab_server_art_review_v84.json"
MAP="/Game/Maps/L_StarfortBattle"
ALLIES=("rovan","aldren","lyra")
OPPONENT="doran"
CANONICAL={
 "rovan":"ParagonWraith",
 "aldren":"ParagonGreystone",
 "lyra":"ParagonTheFey",
 "doran":"ParagonKhaimera",
}


def load_selection():
    if not SELECTION.is_file():
        raise RuntimeError("Run v80 Fab scan + accept actual EULAs first")
    doc=json.loads(SELECTION.read_text(encoding="utf-8"))
    if (doc.get("source")!="user_imported_fab_library" or
        doc.get("private_preview_only") is not True or
        doc.get("user_confirmed_fab_license") is not True):
        raise ValueError("Cannot stage 3D models without explicit user-accepted Epic/Fab EULAs")
    mapping=doc.get("selected_skeletal_meshes")
    if not isinstance(mapping,dict):
        raise ValueError("No real Fab SkeletalMesh selection")
    for hid,namespace in CANONICAL.items():
        path=mapping.get(hid,"")
        if (not isinstance(path,str) or
            not path.lower().startswith(("/Game/"+namespace+"/").lower()) or
            ".." in path or "\\" in path or ":" in path):
            raise ValueError("Missing / wrong real licensed Paragon source mesh for "+hid)
    if len({mapping[h] for h in CANONICAL})!=4:
        raise ValueError("Four different real Fab source meshes required")
    return {h:mapping[h] for h in CANONICAL}


def property_any(obj,keys,value):
    last=None
    for key in keys:
        try:
            obj.set_editor_property(key,value)
            return key
        except (RuntimeError,AttributeError,TypeError,ValueError) as err:
            last=err
    raise RuntimeError("Unreal Editor property cannot be set "+
                       str(keys)+" "+str(last))


def inspect_source_assets(unreal,selected):
    from fab_seven_private_preview_v80 import find_native_clip
    rows=[]
    for hid in (*ALLIES,OPPONENT):
        path=selected[hid]
        library=unreal.EditorAssetLibrary
        if not library.does_asset_exist(path):
            raise RuntimeError("Genuine imported Fab mesh missing: "+path)
        mesh=library.load_asset(path)
        if not mesh or mesh.get_class().get_name()!="SkeletalMesh":
            raise RuntimeError("Expected REAL full-body UE SkeletalMesh: "+path)
        skeleton=mesh.get_editor_property("skeleton")
        if not skeleton or not mesh.get_editor_property("materials"):
            raise RuntimeError("Real rig and PBR materials required for "+hid)
        root="/Game/"+CANONICAL[hid]
        idle,idle_path=find_native_clip(unreal,root,skeleton,battle=False)
        attack,attack_path=find_native_clip(unreal,root,skeleton,battle=True)
        if (not idle or not attack or
            idle_path==attack_path or
            not any(k in attack_path.rsplit("/",1)[-1].lower()
                    for k in ("attack","shoot","fire","slash","cast","ability"))):
            raise RuntimeError("Distinct real native same-rig idle and attack missing: "+hid)
        if (idle.get_editor_property("skeleton").get_path_name()!=skeleton.get_path_name()
            or attack.get_editor_property("skeleton").get_path_name()!=skeleton.get_path_name()):
            raise RuntimeError("Imported animation skeleton mismatch: "+hid)
        rows.append({"id":hid,"body":mesh,"idle":idle,"attack":attack,
                     "mesh_path":path,"idle_path":idle_path,
                     "attack_path":attack_path,"opponent":hid==OPPONENT})
    if len({r["mesh_path"] for r in rows})!=4:
        raise RuntimeError("Unique actual actor rig meshes required")
    return rows


def stage_in_editor(unreal,selected):
    if not unreal.EditorAssetLibrary.does_asset_exist(MAP):
        raise RuntimeError("Create real /Game/Maps/L_StarfortBattle with Tools/create_native_maps.py first")
    level=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    if not level or not actors:
        raise RuntimeError("Native real Unreal Editor subsystems required")
    bridge_class=unreal.load_class(None,
        "/Script/StarfortUnreal.StarfortFabVerifiedBattleBridge")
    if not bridge_class:
        raise RuntimeError("Build STARFORT v84 C++ with UE5.8 before using this tool")
    # Resolve all user-owned assets before touching the level.
    rows=inspect_source_assets(unreal,selected)
    if not level.load_level(MAP):
        raise RuntimeError("Cannot open native server-backed battle map")
    existing=actors.get_all_level_actors()
    for a in existing:
        label=a.get_actor_label()
        if (label.startswith("STARFORT_DEV_SERVER_FAB_") or
            a.get_class().get_name()=="StarfortFabVerifiedBattleBridge"):
            raise RuntimeError("Preserve existing private bridge & real models; refuse re-stage")
        if a.get_class().get_name()=="StarfortBattleStage":
            review_flag=None
            for property_name in ("art_approved_for_mobile",
                                  "b_art_approved_for_mobile",
                                  "bArtApprovedForMobile"):
                try:
                    review_flag=a.get_editor_property(property_name)
                    break
                except (AttributeError,ValueError,RuntimeError):
                    continue
            if review_flag is None:
                raise RuntimeError("Cannot read native production art approval; refuse staging")
            if review_flag:
                raise RuntimeError("Production-approved stage must not get Paragon test art")
    created=[]
    bindings=[]
    for i,row in enumerate(rows):
        hid=row["id"]
        x,y=(-370.0,(-1.0+i)*320.0) if not row["opponent"] else (480.0,0.0)
        actor=actors.spawn_actor_from_class(unreal.SkeletalMeshActor,
            unreal.Vector(x,y,0),unreal.Rotator(0.0,180.0 if row["opponent"] else 0.0,0.0))
        if not actor:raise RuntimeError("Could not place real Fab rig "+hid)
        rig=actor.get_component_by_class(unreal.SkeletalMeshComponent)
        if rig is None:raise RuntimeError("Unreal SkeletalMeshComponent missing")
        rig.set_skeletal_mesh_asset(row["body"])
        rig.override_animation_data(row["idle"],is_looping=True,is_playing=True)
        actor.set_actor_label("STARFORT_DEV_SERVER_FAB_"+hid.upper())
        created.append(actor)
        item=unreal.StarfortFabVerifiedArtBinding()
        property_any(item,("hero_id","heroId"),unreal.Name(hid))
        property_any(item,("opponent","b_opponent","bOpponent"),row["opponent"])
        property_any(item,("actor","Actor"),actor)
        property_any(item,("idle","Idle"),row["idle"])
        property_any(item,("attack","Attack"),row["attack"])
        bindings.append(item)
    cam=actors.spawn_actor_from_class(unreal.CameraActor,
        unreal.Vector(1700.0,0.0,450.0),unreal.Rotator(-10.0,180.0,0.0))
    if not cam:raise RuntimeError("Could not create real server battle review camera")
    cam.set_actor_label("STARFORT_DEV_SERVER_FAB_CINEMA")
    bridge=actors.spawn_actor_from_class(bridge_class,
        unreal.Vector(0.0,0.0,0.0),unreal.Rotator(0.0,0.0,0.0))
    if not bridge:raise RuntimeError("Could not place real C++ bridge actor")
    property_any(bridge,("real_fab_rigs","realFabRigs"),bindings)
    property_any(bridge,("review_camera","reviewCamera"),cam)
    property_any(bridge,("enable_development_review",
                         "b_enable_development_review",
                         "bEnableDevelopmentReview"),True)
    bridge.set_actor_label("STARFORT_DEV_SERVER_FAB_VERIFIED_BRIDGE")
    if not level.save_current_level():
        raise RuntimeError("Could not save real authored online battle .umap")
    report={
        "real_unreal_editor_completed":True,
        "visual_reference_only":True,
        "development_only":True,
        "production_art_approved":False,
        "actual_licensed_paragon_bodies":4,
        "server_battle_map":MAP,
        "online_gameplay_compiled_on_device":False,
        "real_device_tested":False,
        "no_art_source_binary_published_to_github":True,
        "bindings":[{"hero_id":r["id"],"mesh":r["mesh_path"],
                     "idle":r["idle_path"],"attack":r["attack_path"],
                     "opponent":r["opponent"]} for r in rows],
    }
    QA.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",
                      encoding="utf-8")
    return report


def main(argv=None):
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("--contract",action="store_true")
    parser.add_argument("--stage",action="store_true")
    args=parser.parse_args(argv)
    if args.contract:
        print(json.dumps({"stage":MAP,"initial_team":ALLIES,
            "opponent":OPPONENT,"actual_imports":False,
            "requires_real_user_licensed_fab":True,"development_only":True}))
        return 0
    if not args.stage:parser.error("Use --contract or --stage")
    selected=load_selection()
    try:
        import unreal
    except ImportError:
        print("Only a REAL Unreal 5.8 Editor can stage user licensed hero assets",
              file=sys.stderr)
        return 2
    print(json.dumps(stage_in_editor(unreal,selected),indent=2,ensure_ascii=False))
    return 0


if __name__=="__main__":
    sys.exit(main())
