#!/usr/bin/env python3
"""Real Unreal Editor asset audit for the STARFORT mobile visual release gate.

Run only inside Unreal Engine 5.8 with PythonScriptPlugin. This script does
not create, import or secretly approve hero meshes. It audits the *actual*
content browser and planned 18-asset manifest, writes a machine-readable
report, and FAILS until the mobile art and levels truly exist.
"""
import json
from pathlib import Path
import unreal

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"ContentPipeline/required_premium_assets.json"
MAPPING=ROOT/"ContentPipeline/server_hero_art_mapping.json"
OUT=ROOT/"Saved/QA/editor_visual_preflight.json"

MAPS=["L_StarfortVillage","L_RoyalGunnerStudio",
      "L_StarfortBattle","L_StarfortAlliance"]
UMG=["WBP_StarfortLogin","WBP_VillageHUD",
     "WBP_HeroScreen","WBP_CampaignHUD","WBP_BattleHUD"]


def audit():
    issues=[]
    for name in MAPS:
        if not unreal.EditorAssetLibrary.does_asset_exist("/Game/Maps/"+name):
            issues.append("Native map has not been authored: "+name)
    for name in UMG:
        if not unreal.EditorAssetLibrary.does_asset_exist("/Game/UI/"+name):
            issues.append("Premium Widget Blueprint has not been authored: "+name)

    required=json.loads(MANIFEST.read_text(encoding="utf-8"))
    mapping=json.loads(MAPPING.read_text(encoding="utf-8"))
    assets=required.get("assets",[])
    if len(assets)!=18:
        issues.append("Production manifest must contain all 18 reviewed assets")
    if len(mapping.get("heroes",[]))!=7:
        issues.append("All seven server heroes must be mapped")

    for entry in mapping.get("heroes",[]):
        uid=entry["server_id"]
        path=entry["planned_uasset_path"]
        if not unreal.EditorAssetLibrary.does_asset_exist(path):
            issues.append("Missing real Unreal hero Data Asset for "+uid+": "+path)
            continue
        asset=unreal.EditorAssetLibrary.load_asset(path)
        if not asset or asset.get_class().get_name()!="StarfortHeroCombatAsset":
            issues.append("Wrong UE Data Asset type for "+uid)
            continue
        server_id=str(asset.get_editor_property("hero_id"))
        if server_id.lower()!=uid:
            issues.append("UE hero ID mismatch: expected "+uid)
        if not asset.has_production_ready_geometry_and_motion():
            issues.append("Rig, AnimBP, motion, weapon, LOD or approval missing for "+uid)

    stage_path="/Game/Blueprints/BP_StarfortBattleStage"
    if not unreal.EditorAssetLibrary.does_asset_exist(stage_path):
        issues.append("No artist-authored three-hero stage Blueprint: "+stage_path)

    # Source-level licence proofs and real physical phone acceptance remain
    # separate requirements; the Editor content database alone is insufficient.
    from validate_premium_art import validate
    source_issues,_=validate(require_art=True)
    issues.extend(source_issues)
    return {
        "engine":"Unreal 5.8",
        "editor_content_audited":True,
        "visual_release_approved":not issues,
        "required_hero_count":7,
        "required_asset_count":18,
        "issues":issues,
    }


def main():
    result=audit()
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",
                   encoding="utf-8")
    unreal.log("STARFORT Editor visual preflight report: "+str(OUT))
    if not result["visual_release_approved"]:
        for reason in result["issues"]:
            unreal.log_error("STARFORT artwork gate: "+reason)
        raise RuntimeError(
            "Real licensed art, animation, map/UMG or phone evidence is missing")
    unreal.log("STARFORT: Editor art preflight passed; still requires final on-device playtests.")


if __name__=="__main__":
    main()
