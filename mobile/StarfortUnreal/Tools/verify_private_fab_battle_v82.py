#!/usr/bin/env python3
"""Real Unreal Editor 5.8 audit of the isolated STARFORT private 3v1 scene.

Use --contract outside UE; --verify only inside the Editor with the special
L_StarfortPrivateFabBattle_v80 level opened. Never accesses credentials/RPCs,
does not create assets or approve shipping. Only user-licensed existing Fab
meshes and their genuine SAME-SKELETON imported AnimSequence clips count.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/"Saved/QA"
OUT=QA/"Private3v1RealFabBattleAudit_v82.json"
EXPECTED="L_StarfortPrivateFabBattle_v80"
NAMES=frozenset(("rovan","aldren","lyra","mira","doran","vesper","eira"))
SIDES=frozenset(("ALLY","OPPONENT"))
PREFIX="/Game/Paragon"


def tags_of(actor):
    return [str(x) for x in actor.get_editor_property("tags")]


def tag_value(actor,prefix):
    values=[t[len(prefix):] for t in tags_of(actor) if t.startswith(prefix)]
    if len(values)!=1:
        raise ValueError("Missing or duplicate persisted tag "+prefix)
    return values[0]


def verify_referenced_animation(unreal,asset_path,rig_skeleton):
    if not asset_path:
        return "none"
    if not asset_path.startswith(PREFIX) or ".." in asset_path or "\\" in asset_path:
        return "unsafe_animation_asset_path"
    if not unreal.EditorAssetLibrary.does_asset_exist(asset_path):
        return "missing_animation_asset"
    clip=unreal.EditorAssetLibrary.load_asset(asset_path)
    if not clip or clip.get_class().get_name()!="AnimSequence":
        return "not_real_anim_sequence"
    skeleton=clip.get_editor_property("skeleton")
    if not skeleton or not rig_skeleton or (
            skeleton.get_path_name()!=rig_skeleton.get_path_name()):
        return "wrong_skeleton"
    return "valid_same_skeleton_anim_sequence"


def audit_scene(unreal,actors,map_name,game_mode_name):
    errors=[]
    rows=[]
    if EXPECTED not in map_name:
        errors.append("Open the exact private 3v1 Unreal map, not a production map")
    if "StarfortFabPreviewGameMode" not in game_mode_name:
        errors.append("Wrong GameMode: private review must never authenticate or reward players")
    cameras=0
    for actor in actors:
        tags=tags_of(actor)
        if "SFPREVIEW_CAMERA" in tags:
            if actor.get_class().get_name()!="CameraActor":
                errors.append("Preview camera tag does not reference actual CameraActor")
            else:
                cameras+=1
        if not any(t.startswith("SFPREVIEW_HERO=") for t in tags):
            continue
        hero=tag_value(actor,"SFPREVIEW_HERO=")
        side=tag_value(actor,"SFPREVIEW_SIDE=")
        idle_path=tag_value(actor,"SFPREVIEW_IDLE=")
        attack_path=tag_value(actor,"SFPREVIEW_ATTACK=")
        if hero not in NAMES or side not in SIDES:
            errors.append("Unrecognized hero ID or battle side: "+hero+" "+side)
        if actor.get_class().get_name()!="SkeletalMeshActor":
            errors.append("Actor is not a real SkeletalMeshActor: "+hero)
            continue
        component=actor.get_component_by_class(unreal.SkeletalMeshComponent)
        if component is None:
            errors.append("No skeletal rig component: "+hero)
            continue
        mesh=component.get_skeletal_mesh_asset()
        if not mesh:
            errors.append("No genuine imported Fab mesh: "+hero)
            continue
        mesh_path=mesh.get_path_name()
        if not mesh_path.startswith(PREFIX):
            errors.append("A real user-acquired Fab mesh from /Game/Paragon* required: "+hero)
            continue
        skeleton=mesh.get_editor_property("skeleton")
        if not skeleton or not mesh.get_editor_property("materials"):
            errors.append("Real material/rig missing: "+hero)
            continue
        idle_result=verify_referenced_animation(unreal,idle_path,skeleton)
        attack_result=verify_referenced_animation(unreal,attack_path,skeleton)
        if idle_path and idle_result!="valid_same_skeleton_anim_sequence":
            errors.append("Bad idle for "+hero+": "+idle_result)
        if attack_path and attack_result!="valid_same_skeleton_anim_sequence":
            errors.append("Bad attack for "+hero+": "+attack_result)
        rows.append({
            "hero_id":hero,"source_side":side,"real_skeletal_mesh":mesh_path,
            "rig_skeleton":skeleton.get_path_name(),
            "real_idle_clip":idle_path if idle_result=="valid_same_skeleton_anim_sequence" else None,
            "real_attack_clip":attack_path if attack_result=="valid_same_skeleton_anim_sequence" else None,
        })
    allies=[row for row in rows if row["source_side"]=="ALLY"]
    enemies=[row for row in rows if row["source_side"]=="OPPONENT"]
    attacks=sum(bool(row["real_attack_clip"]) for row in allies)
    if len(allies)!=3 or len(enemies)!=1:
        errors.append("Real 3v1 requires exactly 3 skinned allies + 1 skinned opponent")
    if len(set(row["hero_id"] for row in rows))!=len(rows):
        errors.append("One original roster ID per real character actor")
    if len(set(row["real_skeletal_mesh"] for row in rows))!=len(rows):
        errors.append("Distinct real source meshes required for each of the four fighters")
    if cameras!=1:
        errors.append("Exactly one tagged real camera required")
    if attacks<1:
        errors.append("No real, same-skeleton ally attack clips: cannot demonstrate actual 3D action")
    result={
        "audit_type":"REAL_UNREAL_EDITOR_LOCAL_PRIVATE_3V1_ONLY",
        "scene_name":map_name,"game_mode":game_mode_name,
        "real_ally_skeletal_count":len(allies),
        "real_opponent_skeletal_count":len(enemies),
        "real_ally_attack_clip_count":attacks,
        "real_camera_count":cameras,
        "interactively_reviewable_in_editor":not errors,
        "verified_actual_editor_state":True,
        "produced_android_ios_game":False,
        "server_authoritative_starfort_battle_tested":False,
        "offline_only_no_rewards_no_damage":True,
        "characters":rows,"blocking_issues":errors,
    }
    return result


def main(argv=None):
    p=argparse.ArgumentParser()
    a=p.add_mutually_exclusive_group(required=True)
    a.add_argument("--contract",action="store_true")
    a.add_argument("--verify",action="store_true")
    args=p.parse_args(argv)
    if args.contract:
        print(json.dumps({"private_3v1_level":EXPECTED,
            "real_UE_editor_audited":False,"production_approved":False,
            "min_genuine_allies":3,"min_genuine_opponents":1,
            "real_animation_skeleton_audit":True}))
        return 0
    try:
        import unreal
    except ImportError:
        print("Run --verify INSIDE UE5.8 Editor, not desktop Python",file=sys.stderr)
        return 2
    editor=unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
    actors=unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    if editor is None or actors is None or not editor.get_editor_world():
        raise RuntimeError("Real Unreal Editor world required")
    world=editor.get_editor_world()
    mode=world.get_world_settings().get_editor_property("default_game_mode")
    mode_name=str(mode.get_name()) if mode else "none"
    report=audit_scene(unreal,actors.get_all_level_actors(),world.get_name(),mode_name)
    QA.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    for issue in report["blocking_issues"]:
        unreal.log_error("STARFORT Private3v1 v82: "+issue)
    unreal.log("STARFORT private local editor 3v1 QA report: "+str(OUT))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if report["interactively_reviewable_in_editor"] else 2

if __name__=="__main__":
    sys.exit(main())
