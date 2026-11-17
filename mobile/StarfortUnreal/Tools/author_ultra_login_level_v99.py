#!/usr/bin/env python3
"""One-time Unreal Editor 5.8 authoring: original material assets + login map.

This script must run INSIDE Unreal's PythonScriptPlugin, not in Homebrew Python.
Never publishes, downloads, overwrites an existing level or installs assets.
Creates the actual native /Game/STARFORT/Login/L_StarfortLogin map locally.
"""
from pathlib import Path
import json
import unreal

MAP = "/Game/STARFORT/Login/L_StarfortLogin"
MATERIAL_ROOT = "/Game/STARFORT/Login/Materials"
REPORT_NAME = "starfort_ultra_login_authoring.json"


def make_material(name: str, tint: tuple[float, float, float, float],
                  roughness: float, emissive: bool = False):
    """Construct authored UE material graphs; no third-party textures are needed."""
    target = MATERIAL_ROOT + "/" + name
    if unreal.EditorAssetLibrary.does_asset_exist(target):
        existing = unreal.EditorAssetLibrary.load_asset(target)
        if not isinstance(existing, unreal.Material):
            raise RuntimeError("Asset path occupied by non-Material: " + target)
        return existing, False

    tools = unreal.AssetToolsHelpers.get_asset_tools()
    material = tools.create_asset(
        name, MATERIAL_ROOT, unreal.Material, unreal.MaterialFactoryNew())
    if not material:
        raise RuntimeError("Material creation failed: " + target)

    color = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionVectorParameter, -380, -20)
    color.set_editor_property("parameter_name", unreal.Name("StarfortTint"))
    color.set_editor_property("default_value", unreal.LinearColor(*tint))
    if not unreal.MaterialEditingLibrary.connect_material_property(
        color, "", unreal.MaterialProperty.MP_BASE_COLOR):
        raise RuntimeError("Color input not connected: " + name)
    rough = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionConstant, -360, 200)
    rough.set_editor_property("r", roughness)
    unreal.MaterialEditingLibrary.connect_material_property(
        rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    if emissive:
        unreal.MaterialEditingLibrary.connect_material_property(
            color, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)

    unreal.MaterialEditingLibrary.recompile_material(material)
    if not unreal.EditorAssetLibrary.save_loaded_asset(material):
        raise RuntimeError("Unable to save material: " + target)
    return material, True


def ensure_map() -> tuple[object, bool]:
    editor = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    if not editor:
        raise RuntimeError("LevelEditorSubsystem unavailable outside the UE Editor")

    if unreal.EditorAssetLibrary.does_asset_exist(MAP):
        if not editor.load_level(MAP):
            raise RuntimeError("Could not open existing login map; unchanged")
        return editor, False

    if not editor.new_level(MAP, False):
        raise RuntimeError("Could not create /Game/STARFORT/Login/L_StarfortLogin")
    return editor, True


def ensure_stage(materials):
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    if not actors:
        raise RuntimeError("EditorActorSubsystem unavailable")
    candidate = getattr(unreal, "StarfortLoginCinematicStage", None)
    if candidate is None:
        raise RuntimeError("Native C++ StarfortLoginCinematicStage missing: compile Editor first")

    for actor in actors.get_all_level_actors():
        if isinstance(actor, candidate):
            return actor, False

    actor = actors.spawn_actor_from_class(
        candidate, unreal.Vector(0, 0, 0), unreal.Rotator(0, 0, 0))
    if actor is None:
        raise RuntimeError("Could not place native cinematic stage")

    actor.set_actor_label("STARFORT • CINEMATIC LOGIN CAMERA + FORTRESS")
    actor.set_editor_property("fortress_material", materials["stone"])
    actor.set_editor_property("banner_material", materials["banner"])
    actor.set_editor_property("ember_material", materials["ember"])
    return actor, True


def set_local_boot_map():
    """Only switch after the Unreal level was actually saved successfully."""
    config_file = Path(unreal.Paths.project_config_dir()) / "DefaultEngine.ini"
    if not config_file.is_file():
        return "Config file absent; Editor map created but startup map unchanged"
    old = config_file.read_text(encoding="utf-8")
    new = old
    new = new.replace("GameDefaultMap=/Engine/Maps/Entry",
                      "GameDefaultMap=" + MAP)
    new = new.replace("EditorStartupMap=/Engine/Maps/Entry",
                      "EditorStartupMap=" + MAP)
    if new == old:
        return "Config already points elsewhere; preserved existing map overrides"
    backup = Path(unreal.Paths.project_saved_dir()) / "QA" / "DefaultEngine_before_ultra_login.ini"
    backup.parent.mkdir(parents=True, exist_ok=True)
    if not backup.exists():
        backup.write_text(old, encoding="utf-8")
    config_file.write_text(new, encoding="utf-8")
    return "Local project startup and Editor map set to " + MAP


def main():
    if not unreal.is_editor():
        raise RuntimeError("Only safe to run in the Unreal Editor")
    stone, stone_new = make_material("M_StarfortMoonstone",
        (.055, .072, .12, 1), .88)
    banner, banner_new = make_material("M_StarfortBanners",
        (.27, .035, .055, 1), .64)
    ember, ember_new = make_material("M_StarfortEmbers",
        (1.0, .25, .03, 1), .38, True)
    editor, created = ensure_map()
    actor, spawned = ensure_stage({
        "stone": stone, "banner": banner, "ember": ember
    })
    if not editor.save_current_level():
        raise RuntimeError("Map was not saved; startup ini intentionally untouched")

    status = set_local_boot_map()
    report = {
        "map": MAP,
        "new_map_created": created,
        "native_stage_added": spawned,
        "material_created": {
            "stone": stone_new, "banner": banner_new, "ember": ember_new
        },
        "startup": status,
        "source": "Real UE5.8 Editor Python; no generated hero/audio",
        "published": False,
        "mobile_packaged": False
    }
    out = Path(unreal.Paths.project_saved_dir()) / "QA" / REPORT_NAME
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    unreal.log("STARFORT LOGIN MAP AUTHORED: " + json.dumps(report))
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
