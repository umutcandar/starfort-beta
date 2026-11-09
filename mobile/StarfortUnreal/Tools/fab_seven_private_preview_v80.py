#!/usr/bin/env python3
"""STARFORT v80: real user-acquired Fab character preview, Unreal Editor only.

--contract runs in ordinary Python. --scan and --stage MUST run inside the UE
Editor Python plugin. No HTTP download, no fake/AI-generated character and
no production quality/retail release bypass. The editor maps are deliberately
not included in any app cooking list.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "ContentPipeline/fab_seven_private_preview_v80.json"
QA = ROOT / "Saved/QA"
SCAN = QA / "fab_seven_private_scan_v80.json"
SELECTION = QA / "fab_seven_private_selection_v80.json"
REPORT = QA / "fab_seven_private_preview_v80.json"
SHOWCASE = "/Game/Maps/L_StarfortPrivateFabPlaytest_v80"
BATTLE = "/Game/Maps/L_StarfortPrivateFabBattle_v80"
IDS = ("rovan", "aldren", "lyra", "mira", "doran", "vesper", "eira")
GAME_MAPS = {"L_StarfortVillage", "L_StarfortBattle", "L_StarfortAlliance", "L_RoyalGunnerStudio"}


def validate_contract(doc):
    problems = []
    heroes = doc.get("heroes", [])
    if doc.get("schema_version") != 1 or doc.get("purpose") != "PRIVATE_UNREAL_EDITOR_3D_REVIEW_ONLY":
        problems.append("Bad private preview schema/purpose")
    if [h.get("hero_id") for h in heroes] != list(IDS):
        problems.append("Seven canonical server IDs are required, with stable order")
    if any(doc.get(k) is not True for k in (
        "independent_of_server_accounts", "no_fabricated_real_player_progress",
        "source_assets_must_be_acquired_by_user", "never_redistribute_fab_sources",
        "never_mark_production_approved", "non_shipping")):
        problems.append("Private licensing/account/release safety conditions missing")
    if doc.get("level") != SHOWCASE or doc.get("battle_level") != BATTLE:
        problems.append("Two isolated preview maps required")
    urls, roots = set(), set()
    for hero in heroes:
        url,root = hero.get("source_url",""),hero.get("expected_root","")
        if (not url.startswith("https://www.fab.com/listings/") or url in urls
                or not root.startswith("/Game/Paragon") or root in roots
                or hero.get("final_approval") is not False):
            problems.append("Incorrect/missing licensed source or art review boundary")
        urls.add(url);roots.add(root)
    return problems


def canonical_path(value, root):
    if not isinstance(value,str) or not value.startswith("/Game/"):
        raise ValueError("Actual /Game/ Unreal SkeletalMesh path required")
    if not value.lower().startswith(root.lower()+"/") or any(c in value for c in ("\\","..",":","\n")):
        raise ValueError("Selection must belong to this hero's own imported Fab pack")
    if len(value)>450:raise ValueError("Oversized Unreal asset path")
    return value


def mesh_candidates(unreal, hero):
    lib=unreal.EditorAssetLibrary
    folder=hero["expected_root"]
    if not lib.does_directory_exist(folder):
        return []
    from fab_character_review import name_score
    paths=lib.list_assets(folder, recursive=True, include_folder=False)
    candidates=[]
    # Score first; do not load unnecessary multi-GB textures, audio or VFX.
    for item in paths:
        p=str(item)
        score=name_score(p,hero["source_hero_name"])
        if score<2:continue
        try:
            obj=lib.load_asset(p)
            if not obj or obj.get_class().get_name()!="SkeletalMesh":
                continue
            skeleton=obj.get_editor_property("skeleton")
            materials=obj.get_editor_property("materials")
            if not skeleton or not materials:continue
            candidates.append({
                "path":p,"score":score,
                "skeleton":str(skeleton.get_path_name()),
                "materials":len(materials),
                "real_skeletal_mesh":True,
            })
        except (RuntimeError,AttributeError,TypeError,ValueError):
            continue
    candidates.sort(key=lambda x:(-x["score"],-x["materials"],x["path"]))
    return candidates[:12]


def inspect(unreal, doc):
    QA.mkdir(parents=True, exist_ok=True)
    results=[]
    suggested={}
    for hero in doc["heroes"]:
        candidates=mesh_candidates(unreal,hero)
        results.append({
            "hero_id":hero["hero_id"],"source":hero["source_hero_name"],
            "found_real_skeletal_mesh":bool(candidates),
            "candidates":candidates,
            "issue":"" if candidates else "Fab pack/compatible full-body skinned asset missing in local UE project",
        })
        suggested[hero["hero_id"]]=candidates[0]["path"] if candidates else ""
    report={
        "run_inside_real_unreal_editor":True,
        "found_count":sum(bool(x["candidates"]) for x in results),
        "hero_count":len(IDS),
        "missing":[r["hero_id"] for r in results if not r["candidates"]],
        "license_confirmed_by_tool":False,
        "actual_private_scene_created":False,
        "characters_reworked_into_final_starfort_heroes":False,
        "candidates":results,
    }
    SCAN.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    # Preserve user-selected meshes and manually confirmed EULA status.
    if SELECTION.exists():
        selected=json.loads(SELECTION.read_text(encoding="utf-8"))
        chosen=selected.get("selected_skeletal_meshes",{})
    else:
        selected={"source":"user_imported_fab_library",
                  "private_preview_only":True,
                  "user_confirmed_fab_license":False,
                  "selected_skeletal_meshes":{}}
        chosen=selected["selected_skeletal_meshes"]
    for hid,p in suggested.items():
        if not chosen.get(hid):
            chosen[hid]=p
    SELECTION.write_text(json.dumps(selected,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return report


def accepted_meshes(unreal, doc, selected):
    if (selected.get("source")!="user_imported_fab_library" or
            selected.get("private_preview_only") is not True or
            selected.get("user_confirmed_fab_license") is not True):
        raise ValueError("Confirm individual Fab EULAs in Epic account, then set user_confirmed_fab_license=true")
    choices=selected.get("selected_skeletal_meshes")
    if not isinstance(choices,dict) or set(choices)!=set(IDS):
        raise ValueError("All seven canonical hero keys must exist in selected_skeletal_meshes")
    imported={}
    used=set()
    for hero in doc["heroes"]:
        hid=hero["hero_id"]
        path=choices[hid]
        if not path:continue
        canonical_path(path,hero["expected_root"])
        if path in used:raise ValueError("Never reuse a selected full-body mesh")
        used.add(path)
        if not unreal.EditorAssetLibrary.does_asset_exist(path):
            raise RuntimeError("Imported model missing from this Unreal project: "+path)
        obj=unreal.EditorAssetLibrary.load_asset(path)
        if not obj or obj.get_class().get_name()!="SkeletalMesh":
            raise RuntimeError("Not a real skinned UE SkeletalMesh: "+path)
        if not obj.get_editor_property("skeleton") or not obj.get_editor_property("materials"):
            raise RuntimeError("Unrigged/no PBR material character: "+path)
        imported[hid]=(obj,path)
    if len(imported)<4:
        raise RuntimeError("At least 4 different real Fab SkeletalMeshes required to preview 3v1 battle; found "+str(len(imported)))
    return imported


def find_native_clip(unreal, source_root, skeleton, battle=False):
    lib=unreal.EditorAssetLibrary
    paths=lib.list_assets(source_root,recursive=True,include_folder=False)
    # Loop a real imported attack/cast clip in the private 3v1 preview if one
    # is compatible. Fallback to a real idle, never to a procedural mannequin.
    desired=("attack","shoot","fire","slash","cast","ability") if battle else ("idle",)
    ranked=sorted((str(p) for p in paths
                   if any(term in str(p).rsplit("/",1)[-1].lower() for term in desired)),
                  key=lambda p:(0 if "attack" in p.rsplit("/",1)[-1].lower() else 1,len(p)))
    if battle and not ranked:
        return find_native_clip(unreal,source_root,skeleton,battle=False)
    for path in ranked[:60]:
        try:
            obj=lib.load_asset(path)
            if obj and obj.get_class().get_name() in ("AnimSequence","AnimSequenceBase") and (
                str(obj.get_editor_property("skeleton").get_path_name())==str(skeleton.get_path_name())):
                return obj,path
        except (RuntimeError,AttributeError,ValueError,TypeError):
            continue
    if battle:
        return find_native_clip(unreal,source_root,skeleton,battle=False)
    return None,None


def make_actor(unreal,actors,hero,mesh,root,location,rotation,tag,battle=False):
    actor=actors.spawn_actor_from_class(unreal.SkeletalMeshActor,
        unreal.Vector(*location),unreal.Rotator(*rotation))
    if not actor:raise RuntimeError("Could not spawn genuine hero actor: "+hero)
    component=actor.get_component_by_class(unreal.SkeletalMeshComponent)
    if not component:raise RuntimeError("SkeletalMeshActor has no skinned mesh component")
    component.set_skeletal_mesh_asset(mesh)
    component.set_editor_property("cast_shadow",True)
    clip,clip_path=find_native_clip(unreal,root,mesh.get_editor_property("skeleton"),battle=battle)
    if clip:
        # UE5.8 serialized real AnimationSequence; NOT a fabricated damage/event.
        component.override_animation_data(clip,is_looping=True,is_playing=True)
    actor.set_actor_label("STARFORT_PRIVATE_TEST_"+tag+"_"+hero.upper()+"_REFERENCE_ONLY")
    return {"hero_id":hero,"actor":actor.get_actor_label(),
            "full_body_skeletal_mesh":str(mesh.get_path_name()),
            "verified_native_clip":clip_path,
            "battle_animation_demonstration_only":bool(battle)}


def light_camera(unreal,actors,battle):
    for klass,pos,rot,label in (
        (unreal.DirectionalLight,(100,-300,1100),(-40,-30,0),"STFT_PRIVATE_SUN"),
        (unreal.SkyLight,(0,0,350),(0,0,0),"STFT_PRIVATE_SKY"),
        (unreal.CameraActor,(1650,0,380),(-7,180,0),"STFT_PRIVATE_CAMERA")):
        actor=actors.spawn_actor_from_class(klass,unreal.Vector(*pos),unreal.Rotator(*rot))
        if not actor:raise RuntimeError("Could not author preview camera/lighting")
        actor.set_actor_label(label+("_BATTLE" if battle else "_GALLERY"))
        if klass is unreal.CameraActor:
            try:
                actor.set_editor_property("auto_activate_for_player",unreal.AutoReceiveInput.PLAYER_0)
            except (AttributeError,RuntimeError):
                unreal.log_warning("Select and pilot the scene CameraActor manually in PIE")


def new_private_map(unreal,doc,loaded,battle):
    level=unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    scene_path=BATTLE if battle else SHOWCASE
    if unreal.EditorAssetLibrary.does_asset_exist(scene_path):
        raise RuntimeError("Existing artist preview map preserved: "+scene_path)
    if not level or not actors or not level.new_level(scene_path,False):
        raise RuntimeError("Cannot create real UE .umap for private preview "+scene_path)
    # Standalone spectator GameMode: no Supabase actions, purchases, staged XP
    # or user-account progress are sent from these review-only worlds.
    world=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    if world:
        mode=unreal.GameModeBase.static_class()
        world.get_world_settings().set_editor_property("default_game_mode",mode)
    placed=[]
    if battle:
        frontline=[hid for hid in ("aldren","rovan","lyra","vesper","mira","eira") if hid in loaded][:3]
        enemy="doran" if "doran" in loaded else next(h for h in loaded if h not in frontline)
        for i,hid in enumerate(frontline):
            mesh,path=loaded[hid]
            placed.append(make_actor(unreal,actors,hid,mesh,doc["roots"][hid],
                (-390,(i-1)*280,0),(0,12,0),"ALLY",battle=True))
        enemy_mesh,path=loaded[enemy]
        placed.append(make_actor(unreal,actors,enemy,enemy_mesh,doc["roots"][enemy],
            (490,0,0),(0,190,0),"OPPONENT",battle=True))
    else:
        for i,hero in enumerate(doc["heroes"]):
            hid=hero["hero_id"]
            if hid not in loaded:continue
            mesh,path=loaded[hid]
            placed.append(make_actor(unreal,actors,hid,mesh,hero["expected_root"],
                (0,(i-3)*230,0),(0,0,0),"GALLERY"))
    light_camera(unreal,actors,battle)
    if not level.save_current_level():raise RuntimeError("Real Unreal .umap save failed")
    return {"path":scene_path,"actual_skinned_character_actors":placed}


def stage(unreal,doc):
    QA.mkdir(parents=True,exist_ok=True)
    # Fail before modifying any level when EULAs, meshes, or maps are missing.
    if not SELECTION.exists():
        inspect(unreal,doc)
    data=json.loads(SELECTION.read_text(encoding="utf-8"))
    chosen=accepted_meshes(unreal,doc,data)
    for path in (SHOWCASE,BATTLE):
        if unreal.EditorAssetLibrary.does_asset_exist(path):
            raise RuntimeError("Refuse to overwrite existing private preview scene: "+path)
    runtime_doc=dict(doc)
    runtime_doc["roots"]={h["hero_id"]:h["expected_root"] for h in doc["heroes"]}
    scenes=[
        new_private_map(unreal,runtime_doc,chosen,False),
        new_private_map(unreal,runtime_doc,chosen,True),
    ]
    report={
        "run_inside_real_unreal_editor":True,
        "native_editor_maps_created":len(scenes),
        "real_fab_skeletal_heroes":len(chosen),
        "missing_reference_ids":[hid for hid in IDS if hid not in chosen],
        "scenes":scenes,
        "real_online_battle_played":False,
        "fake_hero_stats_created":False,
        "real_ue_mobile_apk_created":False,
        "production_quality_approved":False,
        "only_for_private_editor_test":True,
    }
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report


def main(argv=None):
    parser=argparse.ArgumentParser()
    m=parser.add_mutually_exclusive_group(required=True)
    m.add_argument("--contract",action="store_true")
    m.add_argument("--scan",action="store_true")
    m.add_argument("--stage",action="store_true")
    args=parser.parse_args(argv)
    doc=json.loads(MANIFEST.read_text(encoding="utf-8"))
    errors=validate_contract(doc)
    if errors:
        print(json.dumps({"errors":errors},ensure_ascii=False))
        return 2
    if args.contract:
        print(json.dumps({"canonical_seven_heroes":list(IDS),"licensed_assets_downloaded":False,
             "offline_demo_ready":False,"contract_valid":True},ensure_ascii=False))
        return 0
    try:import unreal
    except ImportError:
        print("Run --scan / --stage inside REAL UE5.8 Editor PythonScriptPlugin",file=sys.stderr)
        return 2
    report=inspect(unreal,doc) if args.scan else stage(unreal,doc)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if args.stage or report["found_count"]>=4 else 2


if __name__=="__main__":
    raise SystemExit(main())
