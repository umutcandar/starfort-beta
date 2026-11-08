#!/usr/bin/env python3
"""Run genuine Unreal Engine 5.8 STARFORT editor automation tests.

Source-only GitHub QA cannot compile Unreal code. This runner must execute
*inside a machine with Unreal Engine 5.8 installed*. Unlike static asserts,
the final pass gate requires an exported Unreal automation JSON report with
three specific test paths marked Success. Dry-run never claims a pass.
"""
import argparse
import json
import os
from pathlib import Path
import platform
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT/"StarfortUnreal.uproject"
REQUIRED={
    "STARFORT.Native.Art.StrictHeroAssetGate",
    "STARFORT.Native.Battle.ThreeSkeletalRigsAndCamera",
    "STARFORT.Native.Battle.ServerOnlyDefaults",
}


def editor_executable(engine_root):
    system=platform.system()
    if system=="Darwin":
        return engine_root/"Engine/Binaries/Mac/UnrealEditor"
    if system=="Windows":
        return engine_root/"Engine/Binaries/Win64/UnrealEditor-Cmd.exe"
    return engine_root/"Engine/Binaries/Linux/UnrealEditor-Cmd"


def get_command(engine_root, report_dir):
    return [
        str(editor_executable(engine_root)),
        str(PROJECT),
        "-unattended",
        "-nosplash",
        "-nop4",
        "-nullrhi",
        "-log",
        "-ExecCmds=Automation RunTest STARFORT.Native;Quit",
        "-ReportExportPath="+str(report_dir),
    ]


def report_result(data):
    if not isinstance(data,dict):
        return ["Automation report is not a JSON object"]
    errors=[]
    tests=data.get("tests")
    if not isinstance(tests,list):
        return ["Automation report lacks tests array"]
    matching={}
    for test in tests:
        if not isinstance(test,dict):
            errors.append("Malformed test entry")
            continue
        path=test.get("fullTestPath")
        if path in REQUIRED:
            if path in matching:
                errors.append("Duplicate test result: "+str(path))
            matching[path]=test
    missing=REQUIRED-set(matching)
    for name in sorted(missing):
        errors.append("Missing real Unreal test: "+name)
    for name,test in matching.items():
        if test.get("state")!="Success" or test.get("errors",0)!=0:
            errors.append(name+" did not pass: "+str(test.get("state")))
    for key in ("failed","notRun","inProcess"):
        if data.get(key)!=0:
            errors.append("Unreal summary not clean: "+key)
    if data.get("succeeded",0)<len(REQUIRED):
        errors.append("Unreal summary contains too few succeeded tests")
    return errors


def verify_report(report_dir):
    # Unreal normally exports index.json with its HTML; allow another
    # single top-level JSON filename for minor engine packaging variations.
    files=[report_dir/"index.json"] if (report_dir/"index.json").is_file() else list(report_dir.glob("*.json"))
    if len(files)!=1:
        return ["Missing or ambiguous real Unreal automation JSON report"]
    try:
        data=json.loads(files[0].read_text(encoding="utf-8"))
    except (ValueError,OSError) as exc:
        return ["Automation JSON cannot be parsed: "+str(exc)]
    return report_result(data)


def main(argv=None):
    parser=argparse.ArgumentParser()
    parser.add_argument("--dry-run",action="store_true")
    parser.add_argument("--verify-report",type=Path,default=None,
                        help="Validate a previously exported Unreal JSON report")
    args=parser.parse_args(argv)
    if args.verify_report is not None:
        errs=verify_report(args.verify_report)
        print(json.dumps({"real_unreal_editor_verified":not errs,
                         "errors":errs},indent=2))
        return 0 if not errs else 2

    root=Path(os.environ.get("UE_ROOT","/__STARFORT_MISSING_UE_5_8__"))
    report=ROOT/"Saved/STARFORT_Automation"
    command=get_command(root,report)
    print(json.dumps({"dry_run":args.dry_run,
                      "command":command,
                      "real_unreal_editor_verified":False,
                      "expected_tests":sorted(REQUIRED)},indent=2))
    if args.dry_run:
        return 0
    binary=editor_executable(root)
    if not binary.is_file():
        print("ERROR: Install Unreal Engine 5.8, set UE_ROOT, and compile project first.",file=sys.stderr)
        return 2
    if not PROJECT.is_file():
        print("ERROR: STARFORT .uproject not found.",file=sys.stderr)
        return 2
    # A previous green JSON must not be reused to approve a newly changed build.
    if report.exists():
        import shutil
        shutil.rmtree(report)
    report.mkdir(parents=True,exist_ok=True)
    code=subprocess.call(command,cwd=ROOT)
    if code!=0:
        print("ERROR: Unreal Editor automation process failed.",file=sys.stderr)
        return code
    errors=verify_report(report)
    if errors:
        print(json.dumps({"real_unreal_editor_verified":False,"errors":errors},indent=2))
        return 2
    print(json.dumps({"real_unreal_editor_verified":True,"tests":sorted(REQUIRED)},indent=2))
    return 0


if __name__=="__main__":
    sys.exit(main())
