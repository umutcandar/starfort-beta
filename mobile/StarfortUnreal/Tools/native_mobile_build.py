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


def validate(platform_name, profile, require_toolchain=True):
    errors = []
    project = json.loads(PROJECT.read_text(encoding="utf-8"))
    if project.get("EngineAssociation") != "5.8":
        errors.append("Unreal Engine association must be 5.8")
    if platform_name not in {"ios", "android"}:
        errors.append("Unsupported mobile platform")
    if profile not in {"smoke", "release"}:
        errors.append("Unsupported build profile")

    if profile == "release":
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
    if profile == "smoke":
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
           "-clientconfig=Development",
           "-target=StarfortUnreal",
           "-build", "-cook", "-stage", "-package", "-archive",
           "-archivedirectory=" + str(ROOT / "Saved/MobilePackages" / platform_name),
           "-map=" + maps, "-unattended", "-utf8output"]
    return cmd, run_uat


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", choices=("ios", "android"), required=True)
    parser.add_argument("--profile", choices=("smoke", "release"), default="smoke")
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
        "command": cmd,
        "missing": errors,
        "notice": "Dry-run is NOT an APK/IPA, Unreal compile, or physical device test."
    }, indent=2, ensure_ascii=False))
    if errors:
        return 2
    if args.dry_run:
        return 0
    return subprocess.call(cmd, cwd=ROOT)


if __name__ == "__main__":
    sys.exit(main())
