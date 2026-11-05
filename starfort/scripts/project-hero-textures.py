"""Bake source artwork onto front-facing triangles in SF3D's generated UV atlas."""
import sys
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image
from scipy.ndimage import distance_transform_edt, map_coordinates

root = Path(__file__).resolve().parent.parent / "assets/heroes-3d"
for name in sys.argv[1:]:
    path = root / f"{name}-reconstructed.glb"
    scene = trimesh.load(path)
    source = Image.open(root / "source" / f"{name}.png").convert("RGBA")
    ratio = 1740 / max(source.size)
    source = source.resize((round(source.width*ratio), round(source.height*ratio)), Image.Resampling.LANCZOS)
    reference = Image.new("RGBA", (2048, 2048))
    reference.paste(source, ((2048-source.width)//2, (2048-source.height)//2))
    pixels = np.array(reference)
    indices = distance_transform_edt(pixels[:,:,3] < 180, return_distances=False, return_indices=True)
    extended = pixels[indices[0], indices[1], :3].astype(float)
    source_alpha = pixels[:,:,3].astype(float)
    for mesh in scene.geometry.values():
        material = mesh.visual.material
        image = material.baseColorTexture.convert("RGB")
        atlas = np.array(image).astype(float)
        height, width = atlas.shape[:2]
        uv = mesh.visual.uv * [width-1, height-1]
        uv[:,1] = height-1-uv[:,1]
        normals = mesh.face_normals
        for fi, face in enumerate(mesh.faces):
            facing = -normals[fi,2]
            if facing < .10:
                continue
            triangle = uv[face]
            lo = np.maximum(np.floor(triangle.min(0)).astype(int), 0)
            hi = np.minimum(np.ceil(triangle.max(0)).astype(int), [width-1,height-1])
            if np.any(hi < lo):
                continue
            matrix = np.column_stack((triangle[1]-triangle[0],triangle[2]-triangle[0]))
            if abs(np.linalg.det(matrix)) < 1e-7:
                continue
            yy,xx = np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
            grid = np.column_stack((xx.ravel(), yy.ravel()))
            weights = (grid-triangle[0]) @ np.linalg.inv(matrix).T
            inside = (weights.min(1)>=-1e-5) & (weights.sum(1)<=1.00001)
            grid,weights = grid[inside],weights[inside]
            if len(grid)==0:
                continue
            v = mesh.vertices[face]
            positions = v[0]+weights[:,0,None]*(v[1]-v[0])+weights[:,1,None]*(v[2]-v[0])
            focal = 1/(2*np.tan(np.radians(20)))
            depth = 1.6+positions[:,2]
            sx = (.5-positions[:,0]/depth*focal)*2047
            sy = (.5-positions[:,1]/depth*focal)*2047
            sampled = np.column_stack([map_coordinates(extended[:,:,c],[sy,sx],order=1,mode="nearest") for c in range(3)])
            alpha = map_coordinates(source_alpha,[sy,sx],order=1,mode="nearest")/255
            strength = np.clip((facing-.1)/.45,0,1)*alpha
            gx,gy = grid[:,0],grid[:,1]
            atlas[gy,gx] = atlas[gy,gx]*(1-strength[:,None])+sampled*strength[:,None]
        material.baseColorTexture = Image.fromarray(atlas.clip(0,255).astype("uint8"))
        material.roughnessFactor = .9
        material.metallicFactor = 0
    scene.export(path)
    print("Projected", name, flush=True)
