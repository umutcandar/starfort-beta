#!/usr/bin/env python3
"""Structural validation for a genuine skinned Royal Gunner GLB. Not artistic approval."""
import json, struct, sys
from pathlib import Path

def check_model(path: Path):
    data=path.read_bytes()
    if len(data)<20: raise ValueError("Truncated GLB")
    magic,version,length,chunk_len,kind=struct.unpack_from("<IIIII",data,0)
    if magic!=0x46546c67 or version!=2 or length!=len(data) or kind!=0x4e4f534a: raise ValueError("Invalid glTF2 binary")
    j=json.loads(data[20:20+chunk_len].decode("utf8"))
    meshes=j.get("meshes",[]); skins=j.get("skins",[]); animations=j.get("animations",[])
    materials=j.get("materials",[]); textures=j.get("textures",[]); images=j.get("images",[])
    accessors=j.get("accessors",[])
    count=sum(accessors[p["indices"]].get("count",0)//3 for m in meshes for p in m.get("primitives",[]) if isinstance(p.get("indices"),int) and p["indices"]<len(accessors))
    failures=[]
    if not meshes: failures.append("No triangle meshes")
    if not skins: failures.append("No skin")
    if not animations: failures.append("No animations")
    if len(materials)<3: failures.append("Fewer than 3 materials")
    if not textures or not images: failures.append("No texture images")
    if skins and max(len(s.get("joints",[])) for s in skins)<40: failures.append("Fewer than 40 rig joints")
    if skins and not any("skin" in n and "mesh" in n for n in j.get("nodes",[])): failures.append("Skin not assigned to mesh")
    if count and count<45000: failures.append("Source triangles <45000; visual review required")
    return {"meshes":len(meshes),"skins":len(skins),"animations":len(animations),"materials":len(materials),"textures":len(textures),"images":len(images),"triangles":count,"issues":failures,"quality_gate_pass":not failures}

if __name__=="__main__":
    try: r=check_model(Path(sys.argv[1]))
    except (IndexError,OSError,ValueError,KeyError) as e: r={"quality_gate_pass":False,"issues":[str(e)]}
    print(json.dumps(r,indent=2))
    sys.exit(0 if r["quality_gate_pass"] else 2)
