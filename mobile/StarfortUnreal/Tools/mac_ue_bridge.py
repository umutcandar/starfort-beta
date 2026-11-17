#!/usr/bin/env python3
"""STARFORT Mac bridge: inspect locally or compile a Development Editor target.
Never downloads packages, cooks, signs, publishes, or uploads anything.
"""
import argparse
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "StarfortUnreal.uproject"
REPORT = ROOT / "Saved/QA/starfort_mac_unreal_bridge.json"
LOG = ROOT / "Saved/QA/starfort_mac_unreal_build.log"

def engine_version():
    return str(json.loads(PROJECT.read_text(encoding="utf-8"))["EngineAssociation"])

def candidate_paths(manual=None):
    if manual:
        yield Path(manual).expanduser()
    if os.environ.get("UE_ROOT"):
        yield Path(os.environ["UE_ROOT"]).expanduser()
    for folder in (Path("/Users/Shared/Epic Games"), Path("/Applications/Epic Games"),
                   Path.home() / "Epic Games"):
        yield folder / "UE_5.8"

def locate_engine(manual=None):
    if engine_version() != "5.8":
        return None
    for path in candidate_paths(manual):
        if (path / "Engine/Build/BatchFiles/Mac/Build.sh").is_file():
            return path.resolve()
    return None

def editor_command(engine):
    return [str(engine / "Engine/Build/BatchFiles/Mac/Build.sh"),
            "StarfortUnrealEditor", "Mac", "Development",
            "-Project=" + str(PROJECT), "-WaitMutex", "-NoHotReloadFromIDE"]

def inspect(manual=None):
    engine=locate_engine(manual)
    mac=platform.system()=="Darwin"
    clang=shutil.which("clang++") if mac else None
    xb=shutil.which("xcodebuild") if mac else None
    xcode=""
    if xb:
        try:
            res=subprocess.run([xb,"-version"],text=True,capture_output=True,timeout=15)
            if res.returncode==0:
                xcode=res.stdout.strip()
        except (OSError,subprocess.TimeoutExpired):
            pass
    issues=[]
    if not mac:
        issues.append("A Mac with Unreal 5.8 is required for real compilation.")
    if not engine:
        issues.append("Unreal Engine 5.8 Mac Build.sh not found; set UE_ROOT.")
    if mac and not clang:
        issues.append("clang++ missing; install/select Xcode.")
    if mac and not xcode:
        issues.append("Full Xcode not available or not selected.")
    return {
        "project":str(PROJECT),"engine_association":engine_version(),
        "engine_root":str(engine) if engine else None,
        "os":platform.system(),"arch":platform.machine(),
        "xcode":xcode,"clang":bool(clang),"issues":issues,
        "ready_to_build":not issues,
        "build_command":editor_command(engine) if engine else None,
        "built":False,"packaged":False,"published":False,
    }

def save(report):
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    temp=REPORT.with_suffix(".tmp")
    temp.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    temp.replace(REPORT)

def main(argv=None):
    ap=argparse.ArgumentParser()
    ap.add_argument("mode",choices=("diagnose","build"))
    ap.add_argument("--ue-root",help="UE_5.8 installation directory")
    a=ap.parse_args(argv)
    report=inspect(a.ue_root)
    report["mode"]=a.mode
    report["generated_utc"]=datetime.now(timezone.utc).isoformat()
    if a.mode=="diagnose" or not report["ready_to_build"]:
        save(report)
        print(json.dumps(report,ensure_ascii=False,indent=2))
        return 0 if report["ready_to_build"] else 2
    LOG.parent.mkdir(parents=True,exist_ok=True)
    with LOG.open("w",encoding="utf-8") as stream:
        try:
            result=subprocess.run(report["build_command"],cwd=ROOT,
                                  stdout=stream,stderr=subprocess.STDOUT,
                                  text=True,check=False)
            rc=result.returncode
        except OSError as exc:
            report["launch_error"]=str(exc)
            rc=127
    report["built"]=rc==0
    report["exit_code"]=rc
    report["local_log"]=str(LOG)
    save(report)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return rc

if __name__=="__main__":
    sys.exit(main())
