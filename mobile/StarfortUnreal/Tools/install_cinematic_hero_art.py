#!/usr/bin/env python3
"""Safely install the *real* 28-image STARFORT v74 artwork ZIP into UE project.

This is NOT a 3D generator or an Unreal Editor import. It only copies the
original binary 2D PNGs and their signed-by-content SHA-256 manifest into
ContentPipeline/Incoming, after validating every expected file.

Usage (Mac):
  python3 Tools/install_cinematic_hero_art.py
  python3 Tools/install_cinematic_hero_art.py --zip ~/Downloads/STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip
  python3 Tools/install_cinematic_hero_art.py --zip ... --check-only
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
from zipfile import ZipFile, BadZipFile

DEFAULT_ROOT=Path(__file__).resolve().parents[1]
ZIP_NAME="STARFORT_v74_Unreal_Gorsel_Entegrasyon.zip"
PREFIX="ContentPipeline/Incoming/"
CANONICAL=("rovan","aldren","lyra","vesper")
KINDS=("splash","portrait","card","skill_01","skill_02","skill_03","skill_04")
MAX_FILE=12*1024*1024
MAX_TOTAL=80*1024*1024

def find_package(project_root):
    candidates=[
        Path.cwd()/ZIP_NAME,
        project_root/ZIP_NAME,
        Path.home()/"Downloads"/ZIP_NAME,
    ]
    return next((p for p in candidates if p.is_file()),candidates[-1])

def expected_name(hero,kind):
    suffix=("Skill_"+kind.split("_",1)[1]
            if kind.startswith("skill_") else kind.capitalize())
    return "T_"+hero.capitalize()+"_"+suffix+".png"

def preflight(zip_path,root):
    archive=Path(zip_path)
    destination=Path(root)/PREFIX
    errors=[]
    payloads={}
    manifest=None
    try:
        with ZipFile(archive) as z:
            info=z.infolist()
            names=[x.filename for x in info]
            if len(set(names))!=len(names):
                return ["Duplicate filename in archive"],{}
            allowed={PREFIX+"manifest.json","README_KURULUM_TR.md"}
            expected={(h,k):PREFIX+"HeroCinematicV1/"+expected_name(h,k)
                      for h in CANONICAL for k in KINDS}
            allowed.update(expected.values())
            extras=set(names)-allowed
            if extras:errors.append("Unexpected path or extra file in ZIP")
            missing=allowed-set(names)
            # README is optional; PNG+manifest are mandatory.
            missing.discard("README_KURULUM_TR.md")
            if missing:errors.append("Missing art files: "+str(len(missing)))
            total=0
            for entry in info:
                # Never allow symlinks, directories, absolute paths or escapes.
                if entry.is_dir() or entry.filename.startswith("/") or (
                    ".." in Path(entry.filename).parts) or (
                    (entry.external_attr >> 16) & 0o170000)==0o120000:
                    errors.append("Unsafe ZIP entry")
                if entry.file_size>MAX_FILE:errors.append("Oversized ZIP entry")
                total+=entry.file_size
            if total>MAX_TOTAL:errors.append("Unreasonably large ZIP payload")
            if errors:return errors,{}
            manifest=json.loads(z.read(PREFIX+"manifest.json"))
            if manifest.get("art_kind")!="two_dimensional_cinematic_hero_ui" or (
                manifest.get("real_3d_models") is not False):
                errors.append("Source must declare 2D UI only, not 3D")
            if manifest.get("hero_ids")!=list(CANONICAL):
                errors.append("Unknown/changed server hero identity")
            rows=manifest.get("assets")
            if not isinstance(rows,list) or len(rows)!=28:
                return errors+["Expected exactly 28 hero artwork rows"],{}
            seen=set()
            for row in rows:
                if not isinstance(row,dict):
                    errors.append("Malformed PNG manifest row")
                    continue
                key=(row.get("hero"),row.get("kind"))
                if key not in expected or key in seen:
                    errors.append("Duplicate/unknown hero artwork identity")
                    continue
                seen.add(key)
                filename=expected[key]
                if row.get("file")!=Path(filename).name:
                    errors.append("Manifest filename does not match hero identity")
                    continue
                data=z.read(filename)
                if len(data)<1000 or not data.startswith(b"\x89PNG\r\n\x1a\n") or (
                    len(data)<24 or data[12:16]!=b"IHDR"):
                    errors.append("Invalid real PNG: "+Path(filename).name)
                    continue
                w,h=struct.unpack(">II",data[16:24])
                min_side=128 if key[1] in {"splash","portrait","card"} else 48
                if w<min_side or h<min_side:
                    errors.append("Insufficient artwork size: "+Path(filename).name)
                    continue
                if row.get("bytes")!=len(data) or row.get("sha256")!=hashlib.sha256(data).hexdigest():
                    errors.append("SHA-256 mismatch for "+Path(filename).name)
                    continue
                payloads[Path(filename).relative_to(PREFIX)]=data
            if seen!=set(expected):errors.append("Missing expected hero artwork identities")
            original=z.read(PREFIX+"manifest.json")
            payloads[Path("manifest.json")]=original
    except (BadZipFile,FileNotFoundError,KeyError,ValueError,TypeError,
            OSError,RuntimeError) as exc:
        return ["Artwork package missing or unreadable: "+str(exc)],{}
    # Fail atomically if another artist already changed the sources.
    for relative,data in payloads.items():
        existing=destination/relative
        if existing.exists():
            if not existing.is_file() or hashlib.sha256(existing.read_bytes()).digest()!=hashlib.sha256(data).digest():
                errors.append("Different existing artwork would be overwritten: "+str(relative))
    return errors,payloads

def install(zip_path,project_root,check_only=False):
    errors,payloads=preflight(zip_path,project_root)
    result={
      "valid_source_package":not errors,
      "source_kind":"cinematic_2d_png",
      "verified_files":len(payloads)-int(Path("manifest.json") in payloads),
      "installed":False,
      "unreal_uassets_created":False,
      "real_3d_models_created":False,
      "errors":errors,
    }
    if errors or check_only:return result
    destination=Path(project_root)/PREFIX
    # All data have already been fully hashed before anything is copied.
    for relative,data in payloads.items():
        out=destination/relative
        out.parent.mkdir(parents=True,exist_ok=True)
        if out.exists():continue
        fd,name=tempfile.mkstemp(prefix=".starfort-art-",dir=str(out.parent))
        try:
            with os.fdopen(fd,"wb") as fp:
                fp.write(data)
                fp.flush()
                os.fsync(fp.fileno())
            os.replace(name,out)
        finally:
            if Path(name).exists():Path(name).unlink()
    result["installed"]=True
    return result

def main(argv=None):
    p=argparse.ArgumentParser()
    p.add_argument("--zip",type=Path)
    p.add_argument("--project-root",type=Path,default=DEFAULT_ROOT)
    p.add_argument("--check-only",action="store_true")
    args=p.parse_args(argv)
    pack=args.zip or find_package(args.project_root)
    report=install(pack,args.project_root,args.check_only)
    print(json.dumps({"zip":str(pack),**report},ensure_ascii=False,indent=2))
    return 0 if not report["errors"] else 2

if __name__=="__main__":
    sys.exit(main())
