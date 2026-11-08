#!/usr/bin/env python3
"""STARFORT — inspect *real* GLB 3D bytes before replacing hero visuals.

stdlib only. This rejects paper manifests, WebP sprites, unrigged meshes and
visual-only pictures. It is a structural gate, NOT a human photorealism test.
Production still requires Unreal AnimBP/montage import, licences and phone QA.

Three skinned GLBs (LOD0/1/2) and one PBR weapon GLB for every server hero.
No generated character assets are bundled with this source milestone.
"""
import argparse
import json
from pathlib import Path
import struct
import sys

ROOT=Path(__file__).resolve().parents[1]
DESIGNS=ROOT/"ContentPipeline/hero_redesign_v2.json"
MAGIC=b"glTF"
JSON_CHUNK=0x4E4F534A
BIN_CHUNK=0x004E4942
COMPS={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}
MULTIPLIER={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}

def open_glb(filepath):
    path=Path(filepath)
    if not path.is_file():
        raise ValueError("real GLB file is missing")
    data=path.read_bytes()
    if len(data)<20 or data[:4]!=MAGIC:
        raise ValueError("file is not binary GLB geometry")
    magic,version,declared=struct.unpack_from("<4sII",data)
    if magic!=MAGIC or version!=2 or declared!=len(data):
        raise ValueError("GLB header length/version invalid")
    offset=12
    chunks=[]
    while offset<len(data):
        if offset+8>len(data):raise ValueError("truncated GLB chunk")
        n,t=struct.unpack_from("<II",data,offset)
        offset+=8
        if n<=0 or n%4!=0 or offset+n>len(data):
            raise ValueError("GLB chunk length invalid")
        chunks.append((t,data[offset:offset+n]))
        offset+=n
    if not chunks or chunks[0][0]!=JSON_CHUNK:
        raise ValueError("GLB JSON chunk missing")
    try:
        model=json.loads(chunks[0][1].rstrip(b" \x00").decode("utf-8"))
    except (UnicodeError,ValueError) as error:
        raise ValueError("invalid GLB JSON payload") from error
    bin_chunks=[chunk for t,chunk in chunks[1:] if t==BIN_CHUNK]
    if not bin_chunks:
        raise ValueError("GLB has no actual binary vertex/skin data")
    blob=bin_chunks[0]
    if not model.get("asset",{}).get("version","").startswith("2."):
        raise ValueError("invalid glTF 2.x schema")
    buffers=model.get("buffers",[])
    if len(buffers)!=1 or buffers[0].get("byteLength",0)>len(blob):
        raise ValueError("binary mesh buffer missing or truncated")
    for view in model.get("bufferViews",[]):
        if view.get("buffer")!=0 or view.get("byteOffset",0)<0 or view.get("byteLength",0)<=0 or (
            view.get("byteOffset",0)+view.get("byteLength",0)>len(blob)
        ):
            raise ValueError("out-of-range binary bufferView")
    return model,blob

def require_index(items,i,label):
    if not isinstance(i,int) or i<0 or i>=len(items):
        raise ValueError(label+" has invalid index")
    return items[i]

def accessor_count(model,i):
    access=require_index(model.get("accessors",[]),i,"accessor")
    n=access.get("count",0)
    if not isinstance(n,int) or n<=0:
        raise ValueError("invalid vertex/index accessor count")
    view=require_index(model.get("bufferViews",[]),
                       access.get("bufferView"),"accessor buffer view")
    bits=COMPS.get(access.get("componentType"))
    components=MULTIPLIER.get(access.get("type"))
    if bits is None or components is None:
        raise ValueError("invalid accessor component type")
    stride=view.get("byteStride",bits*components)
    if stride<bits*components:raise ValueError("impossible vertex byte stride")
    required=access.get("byteOffset",0)+(n-1)*stride+bits*components
    if required>view["byteLength"]:
        raise ValueError("accessor data is not physically present in GLB")
    return n

def texture_is_packed(model,texture_index):
    texture=require_index(model.get("textures",[]),texture_index,"texture")
    image=require_index(model.get("images",[]),texture.get("source"),"image")
    if "bufferView" not in image:
        return False  # Require baked, embedded pixels, not a broken URL.
    require_index(model.get("bufferViews",[]),image["bufferView"],"image data")
    return True

def verify_material(model,primitive):
    index=primitive.get("material")
    mat=require_index(model.get("materials",[]),index,"PBR material")
    pbr=mat.get("pbrMetallicRoughness",{})
    for label,channel in [
        ("base color",pbr.get("baseColorTexture")),
        ("normal",mat.get("normalTexture")),
        ("metallic-roughness",pbr.get("metallicRoughnessTexture")),
    ]:
        if not isinstance(channel,dict) or not texture_is_packed(model,channel.get("index")):
            raise ValueError("missing embedded "+label+" PBR texture")

def validate_model(model, *, skinned, require_animations, min_joints=40):
    nodes=model.get("nodes",[])
    skins=model.get("skins",[])
    meshes=model.get("meshes",[])
    if not nodes or not meshes:
        raise ValueError("mesh nodes missing")
    if skinned:
        if not skins or max(len(s.get("joints",[])) for s in skins)<min_joints:
            raise ValueError("missing rigged skeleton with 40+ real joints")
        for skin in skins:
            for joint in skin.get("joints",[]):
                require_index(nodes,joint,"skin joint")
    tris=0
    used_materials=set()
    for node in nodes:
        if "mesh" not in node:continue
        mesh=require_index(meshes,node["mesh"],"mesh node")
        if skinned and "skin" not in node:continue
        if skinned:require_index(skins,node["skin"],"mesh skin")
        for primitive in mesh.get("primitives",[]):
            attrs=primitive.get("attributes",{})
            required={"POSITION","NORMAL","TEXCOORD_0"}
            if skinned:required|={"JOINTS_0","WEIGHTS_0"}
            if not required.issubset(attrs):
                raise ValueError("mesh lacks actual normals/UV/skin weights")
            counts=[accessor_count(model,attrs[a]) for a in required]
            if len(set(counts))!=1:
                raise ValueError("vertex, joint and weight counts differ")
            if primitive.get("mode",4)!=4:
                raise ValueError("mesh must use triangles")
            indices=accessor_count(model,primitive.get("indices"))
            if indices%3:raise ValueError("triangle indices not divisible by three")
            tris+=indices//3
            verify_material(model,primitive)
            used_materials.add(primitive.get("material"))
    if tris<=0 or not used_materials:
        raise ValueError("no actual textured skinned triangles" if skinned else "no weapon geometry")
    clips=set()
    for animation in model.get("animations",[]):
        name=str(animation.get("name","")).strip().lower()
        channels=animation.get("channels",[])
        samplers=animation.get("samplers",[])
        # Names alone are not motion. There must be actual animated joint
        # channels backed by at least two keyframes in binary accessors.
        if not name or not channels or not samplers:
            continue
        valid=False
        for channel in channels:
            target=channel.get("target",{})
            if target.get("path") not in {"translation","rotation","scale"}:
                continue
            if skinned and target.get("node") not in {
                    joint for skin in skins for joint in skin.get("joints",[])}:
                continue
            sampler=require_index(samplers,channel.get("sampler"),"animation sampler")
            if accessor_count(model,sampler.get("input"))<2:
                continue
            if accessor_count(model,sampler.get("output"))<2:
                continue
            valid=True
            break
        if valid:clips.add(name)
    missing=set(require_animations)-clips
    if missing:raise ValueError("missing real keyed animations: "+", ".join(sorted(missing)))
    return tris,clips

def audit_design(design,root=ROOT):
    errors=[]
    counts={}
    required=design.get("required_animations",[])
    for hero in design.get("heroes",[]):
        sid=hero["server_id"]
        base=root/hero["source_dir"]
        spec=hero["files"]
        count=[]
        for lod in (0,1,2):
            path=base/spec["body_lod"+str(lod)]
            try:
                glb,_=open_glb(path)
                tris,_=validate_model(glb,skinned=True,
                    require_animations=required if lod==0 else [])
                count.append(tris)
            except (ValueError,OSError,KeyError,TypeError) as e:
                errors.append(f"{sid} LOD{lod}: {e}")
        try:
            glb,_=open_glb(base/spec["weapon"])
            tris,_=validate_model(glb,skinned=False,require_animations=[])
            counts[sid+"_weapon"]=tris
        except (ValueError,OSError,KeyError,TypeError) as e:
            errors.append(f"{sid} weapon: {e}")
        if len(count)==3:
            counts[sid]=count
            if not (8000<=count[0]<=150000 and
                    1000<=count[2]<count[1]<count[0] and
                    count[1]<=count[0]*0.80 and count[2]<=count[0]*0.50):
                errors.append(f"{sid}: authored LOD reductions/body mesh budget invalid")
    return errors,counts

def audit_contract(design):
    errors=[]
    ids=[h.get("server_id") for h in design.get("heroes",[])]
    expected={"aldren","lyra","rovan","mira","doran","vesper","eira"}
    if design.get("schema_version")!=2 or design.get("visual_generation")!=2:
        errors.append("New visual generation must be 2")
    if len(ids)!=7 or len(set(ids))!=7 or set(ids)!=expected:
        errors.append("All seven canonical player hero IDs must stay stable")
    if len(set(h.get("role") for h in design.get("heroes",[])))<5:
        errors.append("Hero visual roles must be distinctive")
    for h in design.get("heroes",[]):
        if h.get("approved") is True or h.get("review_status")!="not_generated":
            errors.append("No art can be marked generated/approved before delivery")
        if len(h.get("visual",""))<60 or len(h.get("silhouette",""))<20:
            errors.append("Incomplete bespoke art brief: "+str(h.get("server_id")))
    if len(design.get("required_animations",[]))<9:
        errors.append("Animation contract incomplete")
    return errors

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--contract-only",action="store_true",
                   help="Check only planning metadata; never confirms real 3D files")
    args=p.parse_args()
    design=json.loads(DESIGNS.read_text(encoding="utf-8"))
    errors=audit_contract(design)
    counts={}
    if not args.contract_only:
        detail,counts=audit_design(design)
        errors+=detail
    print(json.dumps({
        "visual_generation":2,"heroes":7,"mode":"contract" if args.contract_only else "actual_3d_files",
        "real_meshes_verified":not args.contract_only and not errors,
        "production_approved":False,
        "body_lod_triangle_counts":counts,
        "issues":errors
    },ensure_ascii=False,indent=2))
    return 2 if errors else 0

if __name__=="__main__":
    sys.exit(main())
