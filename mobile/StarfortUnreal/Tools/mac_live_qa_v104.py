#!/usr/bin/env python3
"""STARFORT local Mac ↔ Unreal Editor QA bridge, no engine rebuild required.

Uses Epic's existing Python Remote Execution client on loopback.
No browser/webview and NO inbound internet server. Pictures only of the
Editor viewport while PIE is STOPPED. Publication is explicit and PUBLIC.
Never captures desktop, login credentials, user documents or WhatsApp.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

PROJECT = Path(__file__).resolve().parents[1]
REPO = PROJECT.parents[1]
TOOLS = Path(__file__).resolve().parent
EDITOR_SCRIPT = TOOLS / "starfort_editor_live_v104.py"
QA = PROJECT / "Saved" / "QA"
IMAGE = QA / "starfort_editor_scene.png"
REPORT = QA / "starfort_editor_scene.json"
QA_BRANCH = "qa/starfort-editor-preview"
QA_WORKTREE = QA / "preview-git-worktree"


def engine_root(manual):
    root = Path(manual or os.environ.get("UE_ROOT") or
                "/Users/macbook/Documents/UE_5.8").expanduser()
    module = (root / "Engine/Plugins/Experimental/PythonScriptPlugin/"
              "Content/Python/remote_execution.py")
    if not module.is_file():
        raise RuntimeError("UE 5.8 Python remote_execution.py missing: " + str(module))
    return module


def editor_call(mode, ue_root):
    path = engine_root(ue_root).parent
    sys.path.insert(0, str(path))
    try:
        import remote_execution
    finally:
        sys.path.remove(str(path))
    conn = remote_execution.RemoteExecution()
    conn.start()
    try:
        deadline = time.monotonic() + 7.0
        nodes = []
        while time.monotonic() < deadline:
            nodes = [n for n in conn.remote_nodes
                     if "starfortunreal" in str(n.get("project_name", "")).lower()]
            if nodes:
                break
            time.sleep(.25)
        if not nodes:
            raise RuntimeError(
                "STARFORT Unreal Editor isn't advertising remote Python. "
                "Enable Project Settings > Plugins > Python > Enable Remote Execution; "
                "use localhost/loopback (TTL 0) and leave the Editor open.")
        if len(nodes) != 1:
            raise RuntimeError("Multiple STARFORT editors found; close duplicate sessions")
        conn.open_command_connection(nodes[0]["node_id"])
        # Execute only a local, pinned project script. No remotely provided
        # command, URL, token or user input is evaluated as Python source.
        cmd = "import runpy; runpy.run_path({!r})['main']({!r})".format(
            str(EDITOR_SCRIPT), mode)
        result = conn.run_command(cmd, unattended=True, exec_mode="ExecuteFile")
        if not result.get("success", False):
            limited = str(result.get("output", []))[-1900:]
            raise RuntimeError("Unreal Python command failed: " + limited)
        return result
    finally:
        try:
            conn.close_command_connection()
        except Exception:
            pass
        conn.stop()


def git(*args, cwd=REPO, check=True, input_text=None):
    return subprocess.run(["git", *args], cwd=str(cwd), text=True,
                          input=input_text, capture_output=True,
                          check=check, timeout=50)


def ensure_preview_worktree():
    """Keeps screenshots off the development branch and out of its commits."""
    if (QA_WORKTREE / ".git").exists():
        return
    QA_WORKTREE.parent.mkdir(parents=True, exist_ok=True)
    ref = git("ls-remote", "--heads", "origin", QA_BRANCH)
    if ref.stdout.strip():
        git("fetch", "origin", QA_BRANCH)
        git("worktree", "add", "--track", "-b", QA_BRANCH,
            str(QA_WORKTREE), "origin/" + QA_BRANCH)
    else:
        git("worktree", "add", "-b", QA_BRANCH, str(QA_WORKTREE), "HEAD")


def publish_preview():
    """Opt-in only; QA branch in the PUBLIC repo is visible to everyone."""
    if not IMAGE.is_file() or not REPORT.is_file():
        raise RuntimeError("No completed safe Editor capture to publish")
    state = json.loads(REPORT.read_text(encoding="utf-8"))
    if state.get("play_in_editor") or not state.get("editor_only", False):
        raise RuntimeError("Publication refused: capture wasn't Editor-only")
    if "L_StarfortLogin" not in state.get("map_name", ""):
        raise RuntimeError("Publication refused: not the approved login map")
    ensure_preview_worktree()
    dst = QA_WORKTREE / "QA" / "editor-preview"
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(IMAGE, dst / "latest.png")
    shutil.copy2(REPORT, dst / "latest.json")
    git("add", "QA/editor-preview/latest.png", "QA/editor-preview/latest.json",
        cwd=QA_WORKTREE)
    if not git("diff", "--cached", "--quiet", cwd=QA_WORKTREE,
               check=False).returncode:
        return {"published": False, "reason": "unchanged"}
    git("-c", "user.name=STARFORT QA Bridge",
        "-c", "user.email=starfort-qa@users.noreply.github.com",
        "commit", "-m", "qa: latest local Unreal login art preview",
        cwd=QA_WORKTREE)
    git("push", "-u", "origin", QA_BRANCH, cwd=QA_WORKTREE)
    return {"published": True, "branch": QA_BRANCH,
            "url": "https://github.com/umutcandar/starfort-beta/tree/" +
                   QA_BRANCH + "/QA/editor-preview"}


def capture_once(mode, args):
    QA.mkdir(parents=True, exist_ok=True)
    previous = IMAGE.stat().st_mtime_ns if IMAGE.is_file() else -1
    editor_call(mode, args.ue_root)
    # Editor screenshots are scheduled on the next engine frame.
    deadline = time.monotonic() + 17
    if mode == "inspect":
        if not REPORT.is_file():
            raise RuntimeError("Editor didn't create its QA JSON report")
    else:
        while time.monotonic() < deadline:
            if (IMAGE.is_file() and IMAGE.stat().st_mtime_ns > previous
                    and IMAGE.stat().st_size > 10_000):
                break
            time.sleep(.35)
        else:
            raise RuntimeError(
                "Unreal accepted the command but no completed PNG arrived; "
                "see Unreal Output Log and Saved/QA")
    state = json.loads(REPORT.read_text(encoding="utf-8"))
    if state.get("error"):
        raise RuntimeError("Unreal reported: " + state["error"])
    result = {"editor_connected": True, "mode": mode,
              "report": str(REPORT),
              "image": str(IMAGE) if mode != "inspect" else None,
              "map": state.get("map_name"),
              "art_actor": state.get("stage_found"),
              "premium_material": state.get("material_path")}
    return result


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Connect to running UE5.8 Editor; polish/capture its ART viewport")
    ap.add_argument("mode", choices=("inspect", "capture", "premium", "watch", "studio"))
    ap.add_argument("--ue-root")
    ap.add_argument("--public-preview", action="store_true",
                    help="EXPLICIT CONSENT: publish art-only screenshot to PUBLIC GitHub QA branch")
    ap.add_argument("--interval", type=int, default=180,
                    help="Seconds between Editor-only captures; minimum 90")
    args = ap.parse_args(argv)
    if args.interval < 90:
        ap.error("--interval must be at least 90 seconds")
    if args.public_preview:
        print("PUBLIC PREVIEW ENABLED: Unreal EDITOR art only; never PIE/account UI.",
              flush=True)
    try:
        if args.mode != "watch":
            output = capture_once(args.mode, args)
            if args.public_preview:
                output["github"] = publish_preview()
            print(json.dumps(output, ensure_ascii=False, indent=2))
            return 0
        if args.mode == "studio":
            # Apply an Editor-only material/lighting pass once, then watch ART.
            result = capture_once("premium", args)
            if args.public_preview:
                result["github"] = publish_preview()
            print(json.dumps(result, ensure_ascii=False), flush=True)
        print("STARFORT Live QA watching while this Terminal remains open. "
              "Ctrl+C stops it.", flush=True)
        last_hash = ""
        while True:
            try:
                output = capture_once("capture", args)
                content_hash = hashlib.sha256(IMAGE.read_bytes()).hexdigest()
                if args.public_preview and content_hash != last_hash:
                    output["github"] = publish_preview()
                last_hash = content_hash
                print(json.dumps(output, ensure_ascii=False), flush=True)
            except (RuntimeError, subprocess.CalledProcessError, OSError) as exc:
                print("QA capture skipped: " + str(exc)[:500], file=sys.stderr,
                      flush=True)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("STARFORT Live QA stopped.")
        return 0
    except (RuntimeError, subprocess.CalledProcessError, OSError) as exc:
        print("STARFORT QA ERROR: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
