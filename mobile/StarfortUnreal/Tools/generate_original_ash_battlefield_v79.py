#!/usr/bin/env python3
"""Original STARFORT v79 battlefield ground asset, NOT approved premium hero art.
Requires: numpy, scipy, trimesh, pillow. Generates real textured GLB meshes.
The full battle scene additionally needs the editor assets and licensed heroes.
"""
from pathlib import Path
import argparse, math, json
import numpy as np
from scipy.ndimage import gaussian_filter, zoom
from PIL import Image
import trimesh

SEED=79421

def normalized_field(shape, coarse, seed):
    rng=np.random.default_rng(seed)
    h,w=shape
    a=rng.normal(size=(math.ceil(h/coarse)+2, math.ceil(w/coarse)+2)).astype(np.float32)
    a=zoom(a,(h/a.shape[0],w/a.shape[1]),order=3)[:h,:w]
    a=(a-a.mean())/(a.std()+1.e-6)
    return np.clip(a,-3,3)

def make_material():
    dim=1024
    n=(normalized_field((dim,dim),100,SEED)*0.32+
       normalized_field((dim,dim),28,SEED+1)*0.26+
       normalized_field((dim,dim),6,SEED+2)*0.20+
       normalized_field((dim,dim),2,SEED+3)*0.08)
    # Original weathered basalt/ash, eroded dark-soil mottling.
    n=np.clip(n,-1.5,1.5)
    rng=np.random.default_rng(SEED+4)
    veins=gaussian_filter((rng.random((dim,dim))>.997).astype(np.float32),2.2)
    veins/=max(veins.max(),1e-6)
    base=np.stack([np.full((dim,dim),88.),np.full((dim,dim),80.),np.full((dim,dim),74.)],axis=-1)
    base+=(n*19)[...,None]*np.array([1.0,.95,.9])
    base-=veins[...,None]*19.
    base=np.clip(base,8,245).astype(np.uint8)
    bimg=Image.fromarray(base,'RGB')
    grad_y,grad_x=np.gradient(gaussian_filter(n,1.0))
    normal=np.stack([np.clip(127-4*grad_x,0,255),np.clip(127-4*grad_y,0,255),np.full_like(n,239)],axis=-1).astype(np.uint8)
    nimg=Image.fromarray(normal,'RGB')
    rough=np.uint8(np.clip(225+n*7,185,252))
    # Gltf ORM: G = roughness, B = metallic (zero for stone).
    orm=np.stack([np.full_like(rough,255),rough,np.zeros_like(rough)],axis=-1)
    ormimg=Image.fromarray(orm,'RGB')
    return trimesh.visual.material.PBRMaterial(name='STARFORT_OriginalAshBasalt_PBR',
        baseColorTexture=bimg,normalTexture=nimg,metallicRoughnessTexture=ormimg,
        metallicFactor=0.0,roughnessFactor=0.98,baseColorFactor=[255,255,255,255],doubleSided=True)

def applied(mesh, material, xy_scale=0.09):
    xy=mesh.vertices[:,:2]
    uv=np.stack([(xy[:,0]*xy_scale+0.5)%1,(xy[:,1]*xy_scale+0.5)%1],axis=1)
    mesh.visual=trimesh.visual.TextureVisuals(uv=uv,material=material)
    return mesh

def terrain(material):
    rng=np.random.default_rng(SEED)
    nx,ny=181,141
    x=np.linspace(-11.5,11.5,nx)
    y=np.linspace(-8.3,8.3,ny)
    X,Y=np.meshgrid(x,y,indexing='xy')
    field=gaussian_filter(rng.normal(size=(ny,nx)),sigma=3)
    field/=field.std()+1e-6
    edge=np.maximum(0,np.sqrt((X/9.5)**2+(Y/7)**2)-.56)
    z=-.15+.085*field+0.55*edge**2+0.13*np.sin(2.3*X+.6*Y)*edge
    # Keep the hero/enemy line of sight flat enough for imported skeletal pawns.
    flatten=np.exp(-((X/6)**8+(Y/4.6)**8))
    z=z*(1-.87*flatten)
    vertices=np.stack([X,Y,z],axis=-1).reshape(-1,3)
    faces=[]
    for j in range(ny-1):
      for i in range(nx-1):
        a=j*nx+i; b=a+1; c=a+nx; d=c+1
        faces.append((a,b,c));faces.append((b,d,c))
    mesh=trimesh.Trimesh(vertices=vertices,faces=np.asarray(faces),process=False)
    mesh.fix_normals()
    return applied(mesh,material,.16)

def weathered_boulder(rng,material,radius=1.0):
    mesh=trimesh.creation.icosphere(subdivisions=2,radius=1.0)
    v=mesh.vertices.copy()
    p=np.sin(v[:,0]*10.7+v[:,1]*4.0+v[:,2]*13.3)+np.cos(v[:,0]*7.7-v[:,1]*8.2)
    a=1.0+0.11*p+0.08*rng.normal(size=v.shape[0])
    v*=a[:,None]
    v*=np.array([radius, radius*.85, radius*.66])[None,:]
    mesh.vertices=v
    mesh.fix_normals()
    return applied(mesh,material,.28)

def broken_pillar(rng,material,height=2.5,radius=.48):
    sides=15
    segments=8
    heights=np.linspace(0,height,segments)
    positions=[]
    for j,h in enumerate(heights):
      for i in range(sides):
        ang=i/sides*math.tau
        tilt=np.array([.09*h,.05*h])
        r=radius*(.98+0.06*np.sin(i*3.12+j*.85)+.03*rng.normal())
        # Shattered uneven top, rather than a capped toy cylinder.
        zh=h+(0.12*rng.normal() if j==segments-1 else 0)
        positions.append((r*np.cos(ang)+tilt[0],r*np.sin(ang)+tilt[1],zh))
    faces=[]
    for j in range(segments-1):
      for i in range(sides):
        a=j*sides+i; b=j*sides+(i+1)%sides
        c=(j+1)*sides+i; d=(j+1)*sides+(i+1)%sides
        faces.extend([(a,b,c),(b,d,c)])
    bottom=len(positions); positions.append((0,0,0))
    top=len(positions);positions.append((.09*height,.05*height,height))
    for i in range(sides):
      faces.append((bottom,(i+1)%sides,i))
      faces.append((top,(segments-1)*sides+i,(segments-1)*sides+(i+1)%sides))
    mesh=trimesh.Trimesh(vertices=np.array(positions),faces=np.array(faces),process=False)
    mesh.fix_normals()
    return applied(mesh,material,.25)

def build(out):
    rng=np.random.default_rng(SEED+12)
    material=make_material()
    scene=trimesh.Scene()
    scene.add_geometry(terrain(material),geom_name='OriginalAshArena_Terrain')
    # Far edges frame the composition; central triangle formation remains clear.
    for k in range(30):
        side=k%4
        if side==0: x,y=rng.uniform(-11,11),rng.uniform(6.1,8.0)
        elif side==1:x,y=rng.uniform(-11,11),rng.uniform(-8.,-6.1)
        elif side==2:x,y=rng.uniform(-11.,-8.5),rng.uniform(-7.,7.)
        else:x,y=rng.uniform(8.5,11.),rng.uniform(-7.,7.)
        rock=weathered_boulder(rng,material,rng.uniform(.25,1.14))
        angle=rng.uniform(0,2*math.pi)
        transform=trimesh.transformations.rotation_matrix(angle,[0,0,1])
        transform[:3,3]=[x,y,-.14]
        scene.add_geometry(rock,geom_name=f'OriginalRock_{k:02d}',transform=transform)
    for k,(x,y) in enumerate([(-8.9,-5.9),(-8.9,6.2),(9.0,-6.4),(9.,6.1),(-7.8,7.4),(8.,7.1)]):
        mesh=broken_pillar(rng,material,height=rng.uniform(1.5,3.2),radius=rng.uniform(.40,.64))
        transform=trimesh.transformations.rotation_matrix(rng.uniform(-.18,.18),[1,0,0])
        transform[:3,3]=[x,y,-.11]
        scene.add_geometry(mesh,geom_name=f'RuinedBasaltPillar_{k}',transform=transform)
    for k in range(58):
        a=rng.uniform(0,2*math.pi)
        radius=rng.uniform(5.5,10.8)
        x=radius*math.cos(a);y=radius*.74*math.sin(a)
        rock=weathered_boulder(rng,material,rng.uniform(.07,.22))
        transform=trimesh.transformations.translation_matrix([x,y,-.08])
        scene.add_geometry(rock,geom_name=f'AshRubble_{k:02d}',transform=transform)
    # Bake every object transform into vertices. Unreal may import GLB nodes as
    # independent StaticMesh assets; placing each at zero reconstructs the arena.
    baked=trimesh.Scene()
    for index, mesh in enumerate(scene.dump(concatenate=False)):
        baked.add_geometry(mesh,geom_name=f'STARFORT_AshArenaPart_{index:03d}')
    out.parent.mkdir(parents=True,exist_ok=True)
    baked.export(str(out),file_type='glb')
    reloaded=trimesh.load(str(out),force='scene')
    meshes=[m for m in reloaded.geometry.values() if isinstance(m,trimesh.Trimesh)]
    stats={'output':str(out),'original_asset':True,'licensed_source':'original procedural STARFORT geometry',
           'mesh_parts':len(meshes),'triangles':int(sum(len(m.faces) for m in meshes)),
           'bytes':out.stat().st_size,'rigged_heroes':0,'reviewed_for_mobile':False}
    print(json.dumps(stats,indent=2))
    assert len(meshes)>=70 and stats['triangles']>=60000
    return stats

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,default=Path(__file__).parent/'StarfortAshBattlefield_v79.glb')
    args=parser.parse_args()
    build(args.out)
