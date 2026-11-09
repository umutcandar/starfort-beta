#!/usr/bin/env python3
"""STARFORT native iOS/Android Unreal build launcher with honest gatekeeping.

--dry-run constructs/verifies the requested BuildCookRun command without
pretending that Unreal Editor compiled or a signed app exists.
--profile smoke uses the bundled engine Entry map + native UMG fallback widgets
and is a *functional QA shell*, not the cinematic game or an App Store build.
--profile release FAILS unless authored native maps, reviewed premium art and
UMG assets are present. Physical device QA must additionally be completed.

The caller must install Unreal Engine 5.8 and each platform SDK locally.
"""
import argparse
from contextlib import contextmanager
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "StarfortUnreal.uproject"

MAPS = ["L_StarfortVillage", "L_RoyalGunnerStudio",
        "L_StarfortBattle", "L_StarfortAlliance"]
WIDGETS = ["WBP_StarfortLogin", "WBP_VillageHUD",
           "WBP_HeroScreen", "WBP_CampaignHUD", "WBP_BattleHUD"]

PRIVATE_MAPS = [
    "L_StarfortPrivateFabBattle_v80",
    "L_StarfortPrivateFabPlaytest_v80",
]
PRIVATE_BOOT = "/Game/Maps/L_StarfortPrivateFabBattle_v80"
PRIVATE_AUDIT = ROOT / "Saved/QA/Private3v1RealFabBattleAudit_v82.json"
PRIVATE_LICENSE = ROOT / "Saved/QA/fab_seven_private_selection_v80.json"
PRIVATE_COMMAND_LINE = ROOT / "UECommandLine.txt"


def validate_private_preview():
    """Fail closed: this is local, license-acknowledged 3D art testing only.

    The Editor-produced report is useful evidence, NOT proof that a packaged
    APK/IPA runs. It never authorizes a production build or overrides its gate.
    """
    errors = []
    for name in PRIVATE_MAPS:
        if not (ROOT / "Content/Maps" / (name + ".umap")).is_file():
            errors.append("Real UE Editor private 3D preview map missing: " + name)
    if not PRIVATE_LICENSE.is_file():
        errors.append("Fab selection + user license acknowledgement missing: " + str(PRIVATE_LICENSE))
    else:
        try:
            selection = json.loads(PRIVATE_LICENSE.read_text(encoding="utf-8"))
            if (selection.get("source") != "user_imported_fab_library" or
                selection.get("private_preview_only") is not True or
                selection.get("user_confirmed_fab_license") is not True):
                errors.append("Real user-accepted Fab EULAs and private-only selection required")
            selected = selection.get("selected_skeletal_meshes", {})
            if not isinstance(selected, dict) or sum(bool(p) for p in selected.values()) < 4:
                errors.append("At least four separately installed user-selected Fab rigs required")
        except (ValueError, OSError):
            errors.append("Malformed private Fab selection JSON")
    if not PRIVATE_AUDIT.is_file():
        errors.append("Run the real Unreal Editor 3v1 asset audit first: " + str(PRIVATE_AUDIT))
    else:
        try:
            proof = json.loads(PRIVATE_AUDIT.read_text(encoding="utf-8"))
            if not (
                proof.get("audit_type") == "REAL_UNREAL_EDITOR_LOCAL_PRIVATE_3V1_ONLY"
                and proof.get("interactively_reviewable_in_editor") is True
                and proof.get("real_ally_skeletal_count") == 3
                and proof.get("real_opponent_skeletal_count") == 1
                and proof.get("real_ally_attack_clip_count", 0) >= 1
                and proof.get("real_camera_count") == 1
                and proof.get("blocking_issues") == []
                and "L_StarfortPrivateFabBattle_v80" in proof.get("scene_name", "")
                and proof.get("offline_only_no_rewards_no_damage") is True
                and proof.get("produced_android_ios_game") is False
            ):
                errors.append("Stale/failed Editor QA: genuine 3v1 scene not accepted")
        except (ValueError, OSError):
            errors.append("Malformed actual Unreal Editor private 3v1 QA report")
    if PRIVATE_COMMAND_LINE.exists():
        errors.append("Existing UECommandLine.txt preserved: resolve it before private preview build")
    return errors


@contextmanager
def temporary_private_preview_startup():
    """UE 5.8 mobile command-line URL opens the real private map at launch.

    Does not modify committed GameDefaultMap, live server config or release.
    Cleanup runs even if BuildCookRun returns a nonzero result.
    """
    if PRIVATE_COMMAND_LINE.exists():
        raise RuntimeError("Will never overwrite an existing UECommandLine.txt")
    PRIVATE_COMMAND_LINE.write_text(PRIVATE_BOOT + "\n", encoding="utf-8")
    try:
        yield
    finally:
        PRIVATE_COMMAND_LINE.unlink(missing_ok=True)


def validate(platform_name, profile, require_toolchain=True):
    errors = []
    project = json.loads(PROJECT.read_text(encoding="utf-8"))
    if project.get("EngineAssociation") != "5.8":
        errors.append("Unreal Engine association must be 5.8")
    if platform_name not in {"ios", "android"}:
        errors.append("Unsupported mobile platform")
    if profile not in {"smoke", "release", "private-preview"}:
        errors.append("Unsupported build profile")
    if profile in {"smoke", "release"} and PRIVATE_COMMAND_LINE.is_file():
        if "StarfortPrivateFab" in PRIVATE_COMMAND_LINE.read_text(
                encoding="utf-8", errors="replace"):
            errors.append("Private UECommandLine.txt found; remove it before regular builds")

    if profile == "private-preview":
        errors.extend(validate_private_preview())
        for rel in ("Source/StarfortUnreal/Private/StarfortFabPreviewController.cpp",
                    "Source/StarfortUnreal/Private/StarfortFabPreviewGameMode.cpp",
                    "Source/StarfortUnreal/Private/StarfortFabPreviewHUD.cpp"):
            if not (ROOT / rel).is_file():
                errors.append("Native private 3D touch preview source missing: " + rel)
    elif profile == "release":
        for stem in MAPS:
            if not (ROOT / "Content/Maps" / (stem + ".umap")).is_file():
                errors.append("Real Unreal map missing: " + stem)
        for stem in WIDGETS:
            if not (ROOT / "Content/UI" / (stem + ".uasset")).is_file():
                errors.append("Authored premium UMG widget missing: " + stem)
        import validate_premium_art
        art_errors, _ = validate_premium_art.validate(require_art=True)
        errors.extend(art_errors)
    else:
        # A working smoke build is only the account / server UI skeleton.
        required = ["Source/StarfortUnreal/Private/StarfortLoginScreen.cpp",
                    "Source/StarfortUnreal/Private/StarfortNativeWidgetFactory.cpp",
                    "Source/StarfortUnreal/Private/StarfortVillageController.cpp"]
        for rel in required:
            if not (ROOT / rel).is_file():
                errors.append("Missing native smoke bootstrap source: " + rel)

    engine_dir = Path(os.environ.get("UE_ROOT", "/__STARFORT_NO_UNREAL_INSTALL__"))
    if require_toolchain:
        if not engine_dir.is_dir():
            errors.append("UE_ROOT must point to installed Unreal Engine 5.8")
        if platform_name == "ios":
            if platform.system() != "Darwin":
                errors.append("iOS packaging requires macOS + Xcode")
            if not shutil.which("xcodebuild"):
                errors.append("Xcode tools unavailable")
        else:
            if not os.environ.get("ANDROID_HOME") and not os.environ.get("ANDROID_SDK_ROOT"):
                errors.append("Android SDK not configured")
            if not os.environ.get("JAVA_HOME"):
                errors.append("Java SDK not configured")
    return errors, engine_dir


def build_command(engine_dir, platform_name, profile):
    run_uat = engine_dir / "Engine/Build/BatchFiles" / (
        "RunUAT.command" if platform.system() == "Darwin" else
        "RunUAT.bat" if platform.system() == "Windows" else "RunUAT.sh"
    )
    if profile == "private-preview":
        # Explicit ONLY privately user-acquired Fab gallery + 3v1 UE maps.
        # The default login/village/live battle maps are NOT cooked here.
        maps = "+".join("/Game/Maps/" + name for name in PRIVATE_MAPS)
    elif profile == "smoke":
        # Always boot the account/login test map; when the Editor has saved
        # actual .umap scenes, include them in the package so the player can
        # actually navigate to hero hall, three-hero battle and alliance.
        # Without those assets, the smoke APK remains UI-only by design.
        cooking = ["/Engine/Maps/Entry"]
        for name in MAPS:
            if (ROOT / "Content/Maps" / (name + ".umap")).is_file():
                cooking.append("/Game/Maps/" + name)
        maps = "+".join(cooking)
    else:
        maps = "+".join("/Game/Maps/" + name for name in MAPS)
    cmd = [str(run_uat), "BuildCookRun",
           "-project=" + str(PROJECT), "-noP4",
           "-platform=" + ("IOS" if platform_name == "ios" else "Android"),
           "-clientconfig=" + ("Shipping" if profile == "release" else "Development"),
           "-target=StarfortUnreal",
           "-build", "-cook", "-stage", "-package", "-archive",
           "-archivedirectory=" + str(
               ROOT / "Saved/MobilePackages" / platform_name /
               ("private-fab-preview" if profile == "private-preview" else "game")),
           "-map=" + maps, "-unattended", "-utf8output"]
    if profile == "release":
        # Actual store builds must use Shipping and distribution signing.
        # Art/Editor/device verification remains mandatory independently.
        cmd.append("-distribution")
    return cmd, run_uat


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", choices=("ios", "android"), required=True)
    parser.add_argument("--profile", choices=("smoke", "release", "private-preview"), default="smoke")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate sources/manifest and print the plan; do not invoke Unreal")
    args = parser.parse_args(argv)

    errors, engine_dir = validate(args.platform, args.profile,
                                  require_toolchain=not args.dry_run)
    cmd, run_uat = build_command(engine_dir, args.platform, args.profile)
    if not args.dry_run and not run_uat.is_file():
        errors.append("RunUAT not found: " + str(run_uat))

    print(json.dumps({
        "platform": args.platform, "profile": args.profile,
        "dry_run": args.dry_run,
        "editor_compiled": False if args.dry_run else None,
        "production_ready": False,
        "private_preview_only": args.profile == "private-preview",
        "private_boot_map": PRIVATE_BOOT if args.profile == "private-preview" else None,
        "mobile_touch_enabled_in_source": args.profile == "private-preview",
        "command": cmd,
        "missing": errors,
        "notice": "Dry-run is NOT an APK/IPA, Unreal compile, or physical device test."
    }, indent=2, ensure_ascii=False))
    if errors:
        return 2
    if args.dry_run:
        return 0
    if args.profile == "private-preview":
        # Unreal documentation: mobile builds read URL startup overrides from
        # the project's temporary UECommandLine.txt, not only from cooked map
        # lists. The source config is untouched, and this file is always
        # restored/removed after a normal or failing BuildCookRun.
        with temporary_private_preview_startup():
            return subprocess.call(cmd, cwd=ROOT)
    return subprocess.call(cmd, cwd=ROOT)


if __name__ == "__main__":
    sys.exit(main())
