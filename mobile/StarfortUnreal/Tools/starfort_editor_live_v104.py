#!/usr/bin/env python3
"""Executed INSIDE a running UE5.8 Editor via Epic Python remote_execution.

No remote server, no GitHub/API access. Never captures a playing/login UI;
captures only the approved login-level EDITOR art viewport.
"""
from pathlib import Path
import json
import shutil
import traceback
import unreal

ALLOWED_LEVEL = "L_StarfortLogin"
ART_ROOT = "/Game/STARFORT/Login/Materials"
MAT_NAME = "M_StarfortCinematicStone_v104"
OUT = Path(unreal.Paths.project_saved_dir()) / "QA"
IMG = OUT / "starfort_editor_scene.png"
REPORT = OUT / "starfort_editor_scene.json"


def _subsystem(cls):
    obj = unreal.get_editor_subsystem(cls)
    if obj is None:
        raise RuntimeError("Unreal Editor subsystem unavailable: " + str(cls))
    return obj


def _stage():
    for actor in _subsystem(unreal.EditorActorSubsystem).get_all_level_actors():
        if "StarfortLoginCinematicStage" in actor.get_class().get_name():
            return actor
    raise RuntimeError("No native StarfortLoginCinematicStage in this level")


def _premium_material():
    asset_path = ART_ROOT + "/" + MAT_NAME
    if unreal.EditorAssetLibrary.does_asset_exist(asset_path):
        material = unreal.EditorAssetLibrary.load_asset(asset_path)
        if not isinstance(material, unreal.Material):
            raise RuntimeError("Premium material path occupied by incompatible asset")
        return material, False
    material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        MAT_NAME, ART_ROOT, unreal.Material, unreal.MaterialFactoryNew())
    if not material:
        raise RuntimeError("Failed creating premium material")

    # Non-destructive asset: original vertex-color material is not edited.
    lib = unreal.MaterialEditingLibrary
    vertex = lib.create_material_expression(
        material, unreal.MaterialExpressionVertexColor, -560, 0)
    color = lib.create_material_expression(
        material, unreal.MaterialExpressionMultiply, -250, -80)
    color.set_editor_property("const_b", 1.95)
    lib.connect_material_expressions(vertex, "RGB", color, "A")
    lib.connect_material_property(color, "", unreal.MaterialProperty.MP_BASE_COLOR)

    # Extremely subtle bounce/emissive prevents imported dark vertex colors
    # from disappearing on mobile; this is NOT a fabricated PBR texture.
    bounce = lib.create_material_expression(
        material, unreal.MaterialExpressionMultiply, -250, 170)
    bounce.set_editor_property("const_b", .14)
    lib.connect_material_expressions(vertex, "RGB", bounce, "A")
    lib.connect_material_property(
        bounce, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)

    rough = lib.create_material_expression(
        material, unreal.MaterialExpressionConstant, -270, 350)
    rough.set_editor_property("r", .82)
    lib.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    lib.recompile_material(material)
    if not unreal.EditorAssetLibrary.save_loaded_asset(material):
        raise RuntimeError("Unable to save new material")
    return material, True


def _ensure_atmosphere(report):
    """Only spawn light, world background. No destructive geometry edits."""
    subsystem = _subsystem(unreal.EditorActorSubsystem)
    actors = subsystem.get_all_level_actors()
    for label, cls_name in (("STARFORT • PREMIUM SKY", "SkyAtmosphere"),
                            ("STARFORT • PREMIUM FILL", "SkyLight")):
        existing = next((a for a in actors if a.get_actor_label() == label), None)
        if existing:
            report["atmosphere"].append({"actor": label, "created": False})
            continue
        cls = getattr(unreal, cls_name, None)
        if cls is None:
            report["warnings"].append(cls_name + " class unavailable")
            continue
        try:
            instance = subsystem.spawn_actor_from_class(
                cls, unreal.Vector(0, 0, 0), unreal.Rotator(0, 0, 0))
            if instance:
                instance.set_actor_label(label)
                if cls_name == "SkyLight":
                    components = instance.get_components_by_class(
                        unreal.SkyLightComponent)
                    if components:
                        components[0].set_editor_property("intensity", 1.5)
                report["atmosphere"].append({"actor": label, "created": True})
        except Exception as exc:
            report["warnings"].append("Atmosphere " + cls_name + ": " + str(exc))


def _backup_level():
    src = (Path(unreal.Paths.project_content_dir()) / "STARFORT" /
           "Login" / "L_StarfortLogin.umap")
    if not src.is_file():
        return "level source not found; backup skipped"
    backup = OUT / "Backups" / "L_StarfortLogin_before_v104.umap"
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        shutil.copy2(src, backup)
    return str(backup)


def main(mode="capture"):
    OUT.mkdir(parents=True, exist_ok=True)
    report = {
        "editor_only": True, "play_in_editor": False,
        "map_name": "", "stage_found": False,
        "material_path": None, "atmosphere": [],
        "warnings": [], "capture_requested": False,
        "public_preview_safe": False,
    }
    try:
        levels = _subsystem(unreal.LevelEditorSubsystem)
        report["play_in_editor"] = bool(levels.is_in_play_in_editor())
        if report["play_in_editor"]:
            raise RuntimeError("PIE running: STOP Play before art-only capture")
        level = levels.get_current_level()
        report["map_name"] = str(level.get_name()) if level else ""
        if ALLOWED_LEVEL not in report["map_name"]:
            raise RuntimeError("Refusing changes/capture outside L_StarfortLogin")
        actor = _stage()
        report["stage_found"] = True
        report["stage_actor"] = actor.get_actor_label()
        mesh = actor.get_editor_property("imported_citadel_mesh")
        report["imported_mesh_name"] = mesh.get_name() if mesh else None
        if mode == "premium":
            # Backup even on repeated runs; do not overwrite an earlier backup.
            if not levels.save_current_level():
                raise RuntimeError("Could not save current level before backup")
            report["backup"] = _backup_level()
            material, created = _premium_material()
            actor.set_editor_property("imported_citadel_material", material)
            report["material_created"] = created
            _ensure_atmosphere(report)
            if not levels.save_current_level():
                raise RuntimeError("Could not save polished level")
        current_material = actor.get_editor_property("imported_citadel_material")
        report["material_path"] = (
            current_material.get_path_name() if current_material else None)

        # Position EDITOR viewport at the actual native stage camera; no UI.
        for camera in actor.get_components_by_class(unreal.CameraComponent):
            key = levels.get_active_viewport_config_key()
            levels.set_level_viewport_camera_info(
                camera.get_world_location(), camera.get_world_rotation(), key)
            levels.editor_set_game_view(True, key)
            break

        if mode != "inspect":
            unreal.AutomationLibrary.take_high_res_screenshot(
                1280, 720, str(IMG), force_game_view=True)
            report["capture_requested"] = True
            report["public_preview_safe"] = True
    except Exception as exc:
        report["error"] = str(exc)
        report["traceback"] = traceback.format_exc(limit=3)
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                      encoding="utf-8")
    print("STARFORT_EDITOR_QA=" + json.dumps(report, ensure_ascii=False))
    if "error" in report:
        raise RuntimeError(report["error"])
    return report


if __name__ == "__main__":
    main()
