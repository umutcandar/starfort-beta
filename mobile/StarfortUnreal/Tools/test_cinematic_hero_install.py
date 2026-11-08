#!/usr/bin/env python3
"""Unreal-independent ZIP installer tests; actual 2D files remain user-provided."""
import hashlib
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zlib
from zipfile import ZipFile,ZIP_DEFLATED

sys.path.insert(0,str(Path(__file__).resolve().parent))
from install_cinematic_hero_art import (
    CANONICAL,KINDS,PREFIX,expected_name,preflight,install,
    png_dimensions_and_integrity,
)

def chunk(kind,data):
    body=kind+data
    return (struct.pack(">I",len(data))+body+
            struct.pack(">I",zlib.crc32(body)&0xffffffff))

def png(width=132,height=132):
    pixels=(b"\0"+b"\x5a\x89\xbe\xff"*width)*height
    return (b"\x89PNG\r\n\x1a\n"+
            chunk(b"IHDR",struct.pack(">IIBBBBB",width,height,8,6,0,0,0))+
            chunk(b"tEXt",b"Comment\0"+b"X"*1550)+
            chunk(b"IDAT",zlib.compress(pixels))+
            chunk(b"IEND",b""))

def make_archive(path,*,tamper=None,extras=None,missing=None):
    assets=[]
    allbytes={}
    for hero in CANONICAL:
        for kind in KINDS:
            name=expected_name(hero,kind)
            raw=png()
            key=(hero,kind)
            if tamper and tamper[0]==key:
                raw=tamper[1](raw)
            assets.append({
                "hero":hero,"kind":kind,"file":name,
                "bytes":len(raw),
                "sha256":hashlib.sha256(raw).hexdigest(),
            })
            allbytes[PREFIX+"HeroCinematicV1/"+name]=raw
    doc={
        "schema_version":1,
        "art_kind":"two_dimensional_cinematic_hero_ui",
        "hero_ids":list(CANONICAL),
        "assets":assets,
        "real_3d_models":False,
    }
    with ZipFile(path,"w",ZIP_DEFLATED) as z:
        z.writestr(PREFIX+"manifest.json",json.dumps(doc))
        for filename,body in allbytes.items():
            if filename!=missing:
                z.writestr(filename,body)
        for filename,body in (extras or {}).items():
            z.writestr(filename,body)

class InstallerTests(unittest.TestCase):
    def test_all_28_hero_art_files_install_only_after_full_preflight(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/"StarfortUnreal"
            zip_path=Path(t)/"art.zip"
            make_archive(zip_path)
            issues,payloads=preflight(zip_path,root)
            self.assertEqual(issues,[])
            self.assertEqual(len(payloads),29)
            check=install(zip_path,root,check_only=True)
            self.assertTrue(check["valid_source_package"])
            self.assertFalse(check["installed"])
            self.assertFalse((root/PREFIX/"manifest.json").exists())
            outcome=install(zip_path,root)
            self.assertTrue(outcome["installed"])
            self.assertEqual(outcome["verified_files"],28)
            again=install(zip_path,root)
            self.assertTrue(again["installed"])
            self.assertFalse(again["real_3d_models_created"])
            self.assertFalse(again["unreal_uassets_created"])

    def test_existing_different_artist_file_blocks_every_write(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/"Game"
            zip_path=Path(t)/"art.zip"
            make_archive(zip_path)
            existing=root/PREFIX/"HeroCinematicV1/T_Rovan_Card.png"
            existing.parent.mkdir(parents=True)
            existing.write_bytes(b"artist already edited this image")
            result=install(zip_path,root)
            self.assertFalse(result["installed"])
            self.assertIn("overwritten"," ".join(result["errors"]))
            self.assertEqual(existing.read_bytes(),b"artist already edited this image")
            self.assertFalse((root/PREFIX/"manifest.json").exists())

    def test_corrupt_png_crc_rejected_even_with_updated_sha(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/"Game"
            archive=Path(t)/"art.zip"
            def modify(p):
                b=bytearray(p)
                b[40]^=1  # a valid-looking PNG with broken chunk CRC
                return bytes(b)
            make_archive(archive,tamper=(("lyra","splash"),modify))
            result=install(archive,root)
            self.assertFalse(result["valid_source_package"])
            self.assertTrue(any("CRC" in e for e in result["errors"]))
            self.assertFalse((root/PREFIX/"manifest.json").exists())

    def test_zip_traversal_and_unexpected_payload_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/"Game"
            archive=Path(t)/"art.zip"
            make_archive(archive,extras={"../../evil.py":b"print('no')"})
            result=install(archive,root)
            self.assertFalse(result["valid_source_package"])
            self.assertFalse((Path(t)/"evil.py").exists())

    def test_missing_one_skill_png_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)/"Game"
            archive=Path(t)/"art.zip"
            name=PREFIX+"HeroCinematicV1/T_Vesper_Skill_04.png"
            make_archive(archive,missing=name)
            result=install(archive,root)
            self.assertFalse(result["valid_source_package"])
            self.assertIn("Missing art files",str(result["errors"]))

    def test_file_is_genuine_crc_checked_png(self):
        data=png(160,180)
        self.assertEqual(png_dimensions_and_integrity(data),(160,180))
        with self.assertRaisesRegex(ValueError,"signature"):
            png_dimensions_and_integrity(b"RIFF0000WEBP"+data[12:])
        with self.assertRaisesRegex(ValueError,"missing"):
            png_dimensions_and_integrity(data[:-12])

if __name__=="__main__":
    unittest.main()
