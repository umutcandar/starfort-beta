#!/usr/bin/env python3
"""STARFORT Unreal Editor-only native level authoring.

Run inside Unreal Engine 5.8's PythonScriptPlugin / UnrealEditor-Cmd.
This uses the real Unreal Editor APIs to SAVE native .umap worlds.
No 2D image is disguised as a 3D mesh, and no primitive castle is fabricated.
It deliberately keeps blank approved-quality model slots until art is imported.

This script must NOT be executed with stock Python: the `unreal` module exists
only inside the UE5 Editor process. It never overwrites an existing map.
"""
import sys
import unreal

LEVELS = (
    ("/Game/Maps/L_StarfortVillage", "StarfortVillageGameMode"),
    ("/Game/Maps/L_RoyalGunnerStudio", "StarfortMobileGameMode"),
    ("/Game/Maps/L_StarfortBattle", "StarfortBattleGameMode"),
    ("/Game/Maps/L_StarfortAlliance", "StarfortVillageGameMode"),
)

def generate_levels():
    level = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    editor = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    assets = unreal.EditorAssetLibrary

    if not level or not editor:
        raise RuntimeError("Unreal Editor subsystems not available")
    created = []
    existing = []
    for asset, mode in LEVELS:
        if assets.does_asset_exist(asset):
            unreal.log_warning(f"STARFORT: preserving existing art-authored map {asset}")
            existing.append(asset)
            continue
        klass = unreal.load_class(None, "/Script/StarfortUnreal." + mode)
        if not klass:
            raise RuntimeError(
                f"STARFORT native GameMode is missing: {mode}. "
                "Compile the C++ project before map generation."
            )
        if not level.new_level(asset, False):
            raise RuntimeError(f"Could not create native level {asset}")
        world = editor.get_editor_world()
        if not world:
            raise RuntimeError(f"Editor world unavailable for {asset}")
        settings = world.get_world_settings()
        settings.set_editor_property("default_game_mode", klass)

        # Lighting baseline only. No fake castle/character boxes or starter
        # mannequin asset may be substituted for approved cinematic content.
        sun = actors.spawn_actor_from_class(
            unreal.DirectionalLight,
            unreal.Vector(0.0, 0.0, 600.0),
            unreal.Rotator(-38.0, -30.0, 0.0),
        )
        if sun:
            sun.set_actor_label("STARFORT_Sun_Baseline_ArtToReview")
        sky = actors.spawn_actor_from_class(
            unreal.SkyLight,
            unreal.Vector(0.0, 0.0, 50.0),
            unreal.Rotator(0.0, 0.0, 0.0),
        )
        if sky:
            sky.set_actor_label("STARFORT_Skylight_Baseline_ArtToReview")

        if not level.save_current_level():
            raise RuntimeError(f"Failed to save Unreal world: {asset}")
        created.append(asset)
        unreal.log(f"STARFORT: created real .umap level {asset} ({mode})")

    unreal.log(
        "STARFORT Native Map Report: "
        + str(len(created)) + " created; "
        + str(len(existing)) + " preserved. "
        "These scenes are PRE-ART and NOT production-ready."
    )
    if len(created) + len(existing) != len(LEVELS):
        raise RuntimeError("Incomplete native scene generation")
    return created

if __name__ == "__main__":
    try:
        generate_levels()
    except Exception as exc:
        unreal.log_error("STARFORT map generation failed: " + str(exc))
        raise
