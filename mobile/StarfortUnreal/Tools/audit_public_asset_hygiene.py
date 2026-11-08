#!/usr/bin/env python3
"""Refuse shipping raw third-party Fab/Paragon packs in public git history.

Check *tracked paths* rather than all local files: a developer may have packs
installed legally on their machine, but must not upload those source files
as a separate redistribution. The local Content/Paragon*/ folder is allowed
and intentionally ignored by git.
"""
import json
from pathlib import Path
import re
import subprocess
import sys

PROJECT=Path(__file__).resolve().parents[1]
REPO=PROJECT.parents[1]
PROTECTED_PATTERNS=(
    re.compile(r"^mobile/StarfortUnreal/Content/Paragon[^/]*(?:/|$)",re.I),
    re.compile(r"^mobile/StarfortUnreal/Content/Fab(?:/|$)",re.I),
    re.compile(r"^mobile/StarfortUnreal/Content/Marketplace(?:/|$)",re.I),
    re.compile(r"^mobile/StarfortUnreal/ContentPipeline/Incoming(?:/|$)",re.I),
)

def audit_tracked(paths):
    return [path for path in paths
            if any(pattern.search(path.replace("\\","/")) for pattern in PROTECTED_PATTERNS)]

def main():
    try:
        output=subprocess.run(
            ["git","ls-files","-z"],cwd=REPO,
            check=True,capture_output=True,
        ).stdout
    except (OSError,subprocess.CalledProcessError) as error:
        print(json.dumps({"ok":False,"error":"Git tracked file list unavailable: "+str(error)}))
        return 2
    names=[x.decode("utf-8") for x in output.split(b"\x00") if x]
    bad=audit_tracked(names)
    print(json.dumps({
        "public_repository_redistribution_guard":not bad,
        "tracked_files_scanned":len(names),
        "blocked_paths":bad,
        "note":"An artist's EULA-accepted Fab assets may exist locally, not in this public repo.",
    },ensure_ascii=False,indent=2))
    return 2 if bad else 0

if __name__=="__main__":
    sys.exit(main())
