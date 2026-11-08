#!/usr/bin/env python3
"""Stage seven NEW authentic 3D GLB characters inside Unreal Engine 5.8.

Run with --dry-run using ordinary Python, or with --apply INSIDE Unreal Editor
PythonScriptPlugin after real skinned meshes, LODs, weapons, textures and
animations have been generated. Imports into isolated /Game/Characters/Heroes/v2
staging folders; NEVER deletes legacy assets, rewrites server IDs, invents
meshes, changes GameModes or silently activates an unreviewed rig.

The designer still must assemble proper skeletal LODs, AnimBP/montages,
licences and UStarfortHeroCombatAsset properties, then pass on-device QA.
"""
import argparse
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"Tools"))
from validate_hero_v2_models import audit_design, audit_contract

def build_plan():
    cfg=json.loads((ROOT/"ContentPipeline/hero_redesign_v2.json").read_text(encoding="utf-8"))
    issues=audit_contract(cfg)
    errors,counts=audit_design(cfg)
    issues+=errors
    plan=[]
    for entry in cfg["heroes"]:
        sid=entry["server_id"]
        for purpose,filename in entry["files"].items():
            source=ROOT/entry["source_dir"]/filename
            plan.append({
                "hero_id":sid,
                "source":str(source),
                "destination":"/Game/Characters/Heroes/v2/"+sid,
                "type":purpose,
            })
    return issues,counts,plan

def editor_import(plan):
    import unreal
    tools=unreal.AssetToolsHelpers.get_asset_tools()
    lib=unreal.EditorAssetLibrary
    tasks=[]
    for item in plan:
        destination=item["destination"]
        filename=Path(item["source"])
        if not filename.is_file():
            raise RuntimeError("3D source vanished before import: "+str(filename))
        # Never use replace_existing: existing art must be reviewed and
        # reimported under a new revision rather than silently overwritten.
        task=unreal.AssetImportTask()
        task.set_editor_property("filename",str(filename))
        task.set_editor_property("destination_path",destination)
        task.set_editor_property("automated",True)
        task.set_editor_property("save",True)
        task.set_editor_property("replace_existing",False)
        tasks.append(task)

    # Interchange GLB importer is provided by Unreal 5.8. If any import fails,
    # retain staging assets for inspection but do NOT enable them in battle.
    tools.import_asset_tasks(tasks)
    report=[]
    failures=[]
    for index,task in enumerate(tasks):
        paths=list(task.get_editor_property("imported_object_paths"))
        paths=[str(p) for p in paths if lib.does_asset_exist(str(p))]
        report.append({"hero_id":plan[index]["hero_id"],
                       "kind":plan[index]["type"],
                       "assets":paths})
        if not paths:
            failures.append(plan[index]["source"])
    report_path=ROOT/"Saved/QA/staged_v2_hero_models.json"
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps({
        "status":"staged_not_activated",
        "visual_generation":2,
        "imported":report,
        "failed":failures,
        "production_approved":False,
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if failures:
        raise RuntimeError("Some real GLB assets could not be imported: "+str(failures))
    return report

def main(argv=None):
    p=argparse.ArgumentParser()
    p.add_argument("--dry-run",action="store_true")
    p.add_argument("--apply",action="store_true")
    a=p.parse_args(argv)
    if a.apply and a.dry_run:
        p.error("--apply and --dry-run are exclusive")
    errors,counts,plan=build_plan()
    print(json.dumps({
        "visual_generation":2,
        "hero_count":7,
        "source_count":len(plan),
        "real_3d_files_valid":not errors,
        "production_approved":False,
        "planned_imports":plan,
        "mesh_counts":counts,
        "errors":errors,
        "note":"No old source, player progress or production Unreal asset is deleted."
    },ensure_ascii=False,indent=2))
    if errors:return 2
    if not a.apply:return 0
    try:
        editor_import(plan)
    except ImportError as exc:
        print("Run --apply only inside Unreal Engine 5.8 Editor PythonScriptPlugin",file=sys.stderr)
        return 2
    return 0

if __name__=="__main__":
    sys.exit(main())
