"""Native humanoid foundation with independent weighted clothing and identity heads."""
import bpy
import bmesh
import math
import sys
import importlib.util
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets/heroes-3d'
HEROES={
 'aldren':{'cloth':(.20,.022,.022),'metal':(.30,.35,.40),'female':False,'hood':False},
 'lyra':{'cloth':(.055,.075,.17),'metal':(.25,.32,.40),'female':True,'hood':False},
 'rovan':{'cloth':(.055,.10,.055),'metal':(.23,.27,.23),'female':False,'hood':True},
 'mira':{'cloth':(.48,.43,.30),'metal':(.50,.38,.18),'female':True,'hood':False},
 'doran':{'cloth':(.18,.025,.015),'metal':(.22,.24,.25),'female':False,'hood':False},
 'vesper':{'cloth':(.085,.035,.075),'metal':(.18,.20,.23),'female':True,'hood':False},
 'eira':{'cloth':(.045,.085,.15),'metal':(.35,.43,.48),'female':True,'hood':False},
}


def material(name,color,metalness=0,roughness=.8):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metalness;p.inputs['Roughness'].default_value=roughness
    # Bake small material maps into the GLB; unsupported procedural Blender
    # nodes must not silently become a smooth, flat surface in the browser.
    n=256;rng=np.random.default_rng(73);y,x=np.mgrid[0:n,0:n]
    grain=rng.random((n,n)).astype(np.float32)
    weave=(np.sin(x*math.pi/2)*np.sin(y*math.pi/2))*.14
    height=grain*.45+weave
    brightness=.88+.19*grain+.04*np.sin((x+y)*.55)
    rgba=np.ones((n,n,4),np.float32);rgba[:,:,:3]=np.array(color)[None,None,:]*brightness[:,:,None]
    image=bpy.data.images.new(name+'_albedo',width=n,height=n);image.pixels.foreach_set(rgba.ravel());image.pack()
    texture=m.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image
    m.node_tree.links.new(texture.outputs['Color'],p.inputs['Base Color'])
    dx=np.roll(height,-1,1)-np.roll(height,1,1);dy=np.roll(height,-1,0)-np.roll(height,1,0)
    rgba[:,:,:3]=np.stack((.5-dx*.08,.5-dy*.08,np.ones_like(dx)),axis=-1)
    normal_image=bpy.data.images.new(name+'_normal',width=n,height=n,is_data=True);normal_image.pixels.foreach_set(rgba.ravel());normal_image.pack()
    texture=m.node_tree.nodes.new('ShaderNodeTexImage');texture.image=normal_image
    normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.6
    m.node_tree.links.new(texture.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])
    return m


def clear_morphs(obj,female):
    if not obj.data.shape_keys:return
    for key in obj.data.shape_keys.key_blocks:key.value=0
    key=obj.data.shape_keys.key_blocks.get('gender_female' if female else 'gender_male')
    if key:key.value=1
    basis=obj.data.shape_keys.key_blocks[0]
    coordinates=[v.co.copy() for v in basis.data]
    if key:
        coordinates=[v.co.copy() for v in key.data]
    obj.shape_key_clear()
    for v,co in zip(obj.data.vertices,coordinates):v.co=co
    obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))


def region_copy(source,name,keep,mat,arm,offset=.01,project=None):
    obj=source.copy();obj.data=source.data.copy();obj.name=name;bpy.context.collection.objects.link(obj)
    bm=bmesh.new();bm.from_mesh(obj.data)
    group_names={g.index:g.name for g in source.vertex_groups}
    deform=bm.verts.layers.deform.active
    def is_hand(v):
        return sum(w for i,w in v[deform].items() if any(s in group_names.get(i,'') for s in ['hand_','thumb_','index_','middle_','ring_','pinky_']))>.30
    rejected=[f for f in bm.faces if not keep(f.calc_center_median()) or any(is_hand(v) for v in f.verts)]
    bmesh.ops.delete(bm,geom=rejected,context='FACES')
    isolated=[v for v in bm.verts if not v.link_faces]
    if isolated:bmesh.ops.delete(bm,geom=isolated,context='VERTS')
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    for v in obj.data.vertices:v.co+=v.normal*offset
    for f in obj.data.polygons:f.use_smooth=True
    obj.data.materials.clear();obj.data.materials.append(mat)
    obj['equipment_slot']='armor';obj['armor_style']=name.split('__')[0]
    if project:
        uv=obj.data.uv_layers.active or obj.data.uv_layers.new(name='garment_uv')
        for loop in obj.data.loops:
            co=obj.data.vertices[loop.vertex_index].co
            u=.5+co.x/(1.66*.6667);v=co.z/1.66
            uv.data[loop.index].uv=(u,v)
    return obj


def photo_cloth(hero,color):
    m=material(hero+'_source_cloth',color)
    source=ASSETS/'source'/('rovan-unarmed.png' if hero=='rovan' else hero+'.png')
    image=bpy.data.images.load(str(source),check_existing=True)
    texture=m.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image;texture.extension='EXTEND'
    m.node_tree.links.new(texture.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    return m


def cape(hero,arm,cloth):
    vertices=[];faces=[];rows=18;cols=20
    for row in range(rows+1):
        t=row/rows
        for col in range(cols+1):
            s=col/cols
            x=(s-.5)*(.50+.20*t)
            y=.09+.13*t+.045*math.sin(s*math.pi)+.012*math.cos(s*math.tau*6)*t
            z=1.34-t*1.05+.035*math.sin(s*math.pi)*(1-t)+.02*math.cos(s*math.tau*5)*t*t
            vertices.append((x,y,z))
    for row in range(rows):
        for col in range(cols):
            a=row*(cols+1)+col;faces.append((a,a+1,a+cols+2,a+cols+1))
    data=bpy.data.meshes.new(hero+'_cape');data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new('cape',data);bpy.context.collection.objects.link(obj);data.materials.append(cloth)
    top=obj.vertex_groups.new(name='spine_03');bottom=obj.vertex_groups.new(name='pelvis')
    for i,v in enumerate(vertices):
        t=(1.34-v[2])/1.05;w=max(0,min(.7,t*.7));top.add([i],1-w,'REPLACE');bottom.add([i],w,'REPLACE')
    obj.parent=arm;mod=obj.modifiers.new('cape_skin','ARMATURE');mod.object=arm
    solid=obj.modifiers.new('cloth_thickness','SOLIDIFY');solid.thickness=.003
    uv=data.uv_layers.new(name='woven_uv')
    for loop in data.loops:
        co=data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(co.x*8,co.z*8)
    for f in data.polygons:f.use_smooth=True
    obj['equipment_slot']='cloak'
    return obj


def identity_head(hero,arm):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS/f'{hero}-reconstructed.glb'))
    imported=[o for o in bpy.data.objects if o not in before]
    meshes=[o for o in imported if o.type=='MESH']
    for obj in meshes:
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active=obj;obj.select_set(True)
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);obj.select_set(False)
        coords=[v.co.copy() for v in obj.data.vertices]
        low=min(v.z for v in coords);high=max(v.z for v in coords);factor=2.6/(high-low)
        minx=min(v.x for v in coords);maxx=max(v.x for v in coords);cx=(minx+maxx)/2
        miny=min(v.y for v in coords);maxy=max(v.y for v in coords);cy=(miny+maxy)/2
        for v in obj.data.vertices:
            v.co=Vector((-(v.co.x-cx)*factor,-(v.co.y-cy)*factor,(v.co.z-low)*factor))
        bm=bmesh.new();bm.from_mesh(obj.data)
        cutoff=2.24 if hero=='rovan' else 2.12
        bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().z<cutoff or abs(f.calc_center_median().x)>.36],context='FACES')
        isolated=[v for v in bm.verts if not v.link_faces]
        if isolated:bmesh.ops.delete(bm,geom=isolated,context='VERTS')
        bm.to_mesh(obj.data);bm.free()
        for v in obj.data.vertices:v.co*=1.6594/2.6
        # Vertices were rotated 180 degrees above. Imported split normals
        # cannot keep their old direction after that coordinate-space change.
        obj.data.normals_split_custom_set([(0,0,0)]*len(obj.data.loops))
        for face in obj.data.polygons:face.use_smooth=True
        obj.data.update()
        obj.name='identity_head';obj.parent=arm
        obj.vertex_groups.clear();group=obj.vertex_groups.new(name='head');collar=obj.vertex_groups.new(name='spine_03')
        for v in obj.data.vertices:
            (group if v.co.z>1.46 else collar).add([v.index],1,'REPLACE')
        for mod in list(obj.modifiers):obj.modifiers.remove(mod)
        modifier=obj.modifiers.new('head_skin','ARMATURE');modifier.object=arm
        obj['identity_source']=hero
    for o in imported:
        if o.type!='MESH' and o.name in bpy.data.objects:bpy.data.objects.remove(o,do_unlink=True)


def boots(hero,arm,leather):
    # Closed boot last: the foot has a rounded toe box, sole and cuff rather
    # than inheriting the donor body's individual toes.
    for side,sign in [('l',1),('r',-1)]:
        foot=arm.data.bones['foot_'+side].head_local
        ankle=arm.data.bones['calf_'+side].tail_local
        knee=arm.data.bones['calf_'+side].head_local
        vertices=[];faces=[];n=24
        levels=[(.018,.067,.148,-.066),(.038,.071,.151,-.066),(.072,.069,.140,-.062),(.105,.060,.110,-.040),(.16,.048,.065,-.003),(.25,.058,.062,0),(.36,.072,.070,0),(.385,.075,.074,0)]
        for z,rx,ry,cy in levels:
            t=max(0,min(1,(z-ankle.z)/(knee.z-ankle.z)))
            cx=ankle.x+(knee.x-ankle.x)*t
            for i in range(n):
                a=i*math.tau/n
                vertices.append((cx+rx*math.cos(a),ankle.y+cy+ry*math.sin(a),z))
        for j in range(len(levels)-1):
            for i in range(n):
                a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
        faces.extend([tuple(reversed(range(n))),tuple(range((len(levels)-1)*n,len(vertices)))])
        mesh=bpy.data.meshes.new('boot_last');mesh.from_pydata(vertices,[],faces);mesh.update()
        obj=bpy.data.objects.new('base__boot_'+side,mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(leather)
        g1=obj.vertex_groups.new(name='foot_'+side);g2=obj.vertex_groups.new(name='calf_'+side)
        for v in mesh.vertices:
            w=max(0,min(1,(v.co.z-.07)/.08));g1.add([v.index],1-w,'REPLACE');g2.add([v.index],w,'REPLACE')
        obj.parent=arm;mod=obj.modifiers.new('boot_skin','ARMATURE');mod.object=arm
        for p in mesh.polygons:p.use_smooth=True
        obj['equipment_slot']='armor';obj['armor_style']='base'
        uv=mesh.uv_layers.new(name='boot_uv')
        for loop in mesh.loops:
            co=mesh.vertices[loop.vertex_index].co
            uv.data[loop.index].uv=(.5+co.x/(1.66*.6667),co.z/1.66)
        mesh.materials.clear();mesh.materials.append(photo_cloth(hero,(.08,.045,.025)))
    return obj


def project_garment(obj,arm,hero):
    spec=importlib.util.spec_from_file_location('source_poses',Path(__file__).with_name('rig-hero-models.py'))
    source=importlib.util.module_from_spec(spec);spec.loader.exec_module(source)
    landmarks=source.POSES[hero]
    if hero=='rovan':landmarks=[[.50,.10],[.50,.29],[.50,.51],[.30,.215],[.22,.335],[.13,.435],[.70,.215],[.78,.335],[.87,.435],[.39,.55],[.39,.75],[.39,.96],[.61,.55],[.61,.75],[.61,.96]]
    mappings={
        'upperarm_l':(landmarks[6],landmarks[7]),'lowerarm_l':(landmarks[7],landmarks[8]),
        'upperarm_r':(landmarks[3],landmarks[4]),'lowerarm_r':(landmarks[4],landmarks[5]),
        'thigh_l':(landmarks[12],landmarks[13]),'calf_l':(landmarks[13],landmarks[14]),
        'thigh_r':(landmarks[9],landmarks[10]),'calf_r':(landmarks[10],landmarks[11])}
    # The image is a texture reference. Limb-space reprojection keeps its
    # embroidery aligned even when the illustrated pose differs from the rig.
    header=(ASSETS/'source'/('rovan-unarmed.png' if hero=='rovan' else hero+'.png')).read_bytes()
    image_ratio=int.from_bytes(header[16:20],'big')/int.from_bytes(header[20:24],'big')
    uv=obj.data.uv_layers.active or obj.data.uv_layers.new(name='garment_uv')
    for loop in obj.data.loops:
        vertex=obj.data.vertices[loop.vertex_index];p=vertex.co
        t=max(0,min(1,(p.z-.88)/(.30)))
        center_u=landmarks[2][0]+(landmarks[1][0]-landmarks[2][0])*t
        source_v=landmarks[2][1]+(landmarks[1][1]-landmarks[2][1])*(p.z-.88)/.30
        width=abs(landmarks[6][0]-landmarks[3][0])/.34
        u=center_u+p.x*width;v=1-source_v
        candidates=[]
        groups={obj.vertex_groups[g.group].name:g.weight for g in vertex.groups}
        for name,(start,end) in mappings.items():
            weight=groups.get(name,0)
            if weight<.15:continue
            bone=arm.data.bones[name];a=bone.head_local;c=bone.tail_local
            phase=max(0,min(1,(p-a).dot(c-a)/(c-a).length_squared));center=a.lerp(c,phase)
            native=Vector((c.x-a.x,c.z-a.z));normal=Vector((-native.y,native.x)).normalized()
            offset=(Vector((p.x-center.x,p.z-center.z))).dot(normal)
            vector=Vector(((end[0]-start[0])*1.66*image_ratio,-(end[1]-start[1])*1.66))
            sn=Vector((-vector.y,vector.x)).normalized();scale=vector.length/(c-a).length
            pu=start[0]+(end[0]-start[0])*phase+sn.x*offset*scale/(1.66*image_ratio)
            pv=1-start[1]-(end[1]-start[1])*phase+sn.y*offset*scale/1.66
            candidates.append((weight,pu,pv))
        if candidates:
            _,u,v=max(candidates,key=lambda value:value[0])
        uv.data[loop.index].uv=(u,v)


def author_hands(arm,skin):
    # Compact quad strips follow each phalanx. Rest positions come from the
    # same skeleton that drives the motion; no portrait-envelope weights.
    for side in ['l','r']:
        verts=[];faces=[];weights=[];rings=12
        hand=arm.data.bones['hand_'+side];basis=hand.matrix_local.to_3x3()
        # The palm tapers at the wrist and broadens below the knuckles.
        bases=[arm.data.bones[f'{f}_01_{side}'].head_local for f in ['index','middle','ring','pinky']]
        knuckles=sum(bases,Vector())/4
        start=hand.head_local;forward=(knuckles-start).normalized()
        width=(bases[0]-bases[-1]).normalized();thickness=forward.cross(width).normalized()
        for j,(t,w,d) in enumerate([(0,.022,.018),(.25,.030,.019),(.70,.037,.017),(1,.038,.014)]):
            center=start.lerp(knuckles,t)
            for i in range(rings):
                a=math.tau*i/rings;verts.append(tuple(center+width*math.cos(a)*w+thickness*math.sin(a)*d));weights.append({'hand_'+side:1})
            if j:
                for i in range(rings):a=(j-1)*rings+i;b=(j-1)*rings+(i+1)%rings;faces.append((a,b,b+rings,a+rings))
        faces.append(tuple(range(rings-1,-1,-1)))
        faces.append(tuple(range(3*rings,4*rings)))
        for family,radius in [('index',.0085),('middle',.009),('ring',.0085),('pinky',.007),('thumb',.010)]:
            path=[];parts=[]
            for part in [1,2,3]:
                bone=arm.data.bones[f'{family}_0{part}_{side}']
                for t in [0,.25,.5,.75]:path.append(bone.head_local.lerp(bone.tail_local,t));parts.append((part,t))
            path.append(bone.tail_local);parts.append((3,1))
            origin=len(verts)
            for j,point in enumerate(path):
                tangent=(path[min(j+1,len(path)-1)]-path[max(0,j-1)]).normalized()
                normal=tangent.cross(thickness).normalized();bi=tangent.cross(normal).normalized()
                part,t=parts[j];r=radius*(1-.24*j/(len(path)-1))
                if j==len(path)-1:r*=.35
                for i in range(rings):
                    a=math.tau*i/rings;verts.append(tuple(point+r*(math.cos(a)*normal+math.sin(a)*bi)))
                    name=f'{family}_0{part}_{side}';prev='hand_'+side if part==1 else f'{family}_0{part-1}_{side}'
                    blend=max(0,.5-t*2);weights.append({name:1-blend,prev:blend})
                if j:
                    for i in range(rings):a=origin+(j-1)*rings+i;b=origin+(j-1)*rings+(i+1)%rings;faces.append((a,b,b+rings,a+rings))
            faces.append(tuple(range(len(verts)-rings,len(verts))))
        data=bpy.data.meshes.new('hand_quad_surface');data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new('articulated_hand_'+side,data);bpy.context.collection.objects.link(obj);data.materials.append(skin)
        groups={name:obj.vertex_groups.new(name=name) for name in sorted({n for w in weights for n in w})}
        for i,w in enumerate(weights):
            for name,value in w.items():
                if value>0:groups[name].add([i],value,'REPLACE')
        obj.parent=arm;modifier=obj.modifiers.new('finger_skin','ARMATURE');modifier.object=arm
        for f in data.polygons:f.use_smooth=True


def skirt(hero,arm,cloth):
    caster=hero in ['lyra','mira','eira'];bottom=.075 if caster else .39
    segments=64;rows=14;vertices=[];faces=[]
    for j in range(rows+1):
        t=j/rows;z=.86+(.075-.86)*t if caster else .86+(.39-.86)*t
        for i in range(segments+1):
            a=-math.pi/2+i/segments*math.tau
            radius=(.165+.15*t if caster else .17+.07*t)
            fold=(.009+.010*t)*math.cos(a*12)
            x=(radius+fold)*math.cos(a)
            y=(radius*.70+fold)*math.sin(a)+.015
            hem=.018*math.cos(a*8)*t**6
            vertices.append((x,y,z+hem))
    for j in range(rows):
        for i in range(segments):
            # Open long coats at the front so the legs remain independent.
            if not caster and (i<3 or i>segments-4):continue
            a=j*(segments+1)+i;faces.append((a,a+1,a+segments+2,a+segments+1))
    data=bpy.data.meshes.new('tailored_skirt');data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new('base__robe' if caster else 'base__coat_tails',data);bpy.context.collection.objects.link(obj);data.materials.append(cloth)
    group=obj.vertex_groups.new(name='pelvis');group.add(list(range(len(vertices))),1,'REPLACE')
    obj.parent=arm;mod=obj.modifiers.new('robe_skin','ARMATURE');mod.object=arm
    solid=obj.modifiers.new('woven_thickness','SOLIDIFY');solid.thickness=.003
    uv=data.uv_layers.new(name='robe_uv')
    for loop in data.loops:
        co=data.vertices[loop.vertex_index].co
        # Original embroidery is retained on a new folded, closed 3D garment.
        uv.data[loop.index].uv=(.5+co.x/(1.66*.6667),co.z/1.66)
    for f in data.polygons:f.use_smooth=True
    obj['equipment_slot']='armor';obj['armor_style']='base'


def breastplate(hero,arm,steel,gold):
    spec=importlib.util.spec_from_file_location('props',Path(__file__).with_name('rig-rovan-archery.py'))
    props=importlib.util.module_from_spec(spec);spec.loader.exec_module(props)
    root=bpy.data.objects.new('plate__harness',None);bpy.context.collection.objects.link(root)
    root['equipment_slot']='armor';root['armor_style']='plate'
    vertices=[];faces=[];rows=10;cols=32
    for j in range(rows+1):
        t=j/rows;z=.94+t*.37;rx=.167+.035*math.sin(t*math.pi*.85);ry=.12+.018*math.sin(t*math.pi)
        for i in range(cols+1):
            angle=-math.pi/2+(i/cols-.5)*2.5
            vertices.append((rx*math.cos(angle),ry*math.sin(angle)-.012,z))
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;faces.append((a,a+1,a+cols+2,a+cols+1))
    shell=props.mesh('plate__breastplate',vertices,faces,steel,root)
    shell.parent=arm;group=shell.vertex_groups.new(name='spine_03');group.add(list(range(len(vertices))),1,'REPLACE')
    mod=shell.modifiers.new('rigid_armor','ARMATURE');mod.object=arm
    solid=shell.modifiers.new('forged_wall','SOLIDIFY');solid.thickness=.008
    shell['equipment_slot']='armor';shell['armor_style']='plate'
    uv=shell.data.uv_layers.new(name='forged_uv')
    for loop in shell.data.loops:
        co=shell.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(co.x*4,co.z*4)
    for name,points in [('lower',vertices[:cols+1]),('collar',vertices[-cols-1:]),('left',[vertices[j*(cols+1)] for j in range(rows+1)]),('right',[vertices[j*(cols+1)+cols] for j in range(rows+1)])]:
        rim=props.tube('plate__rim_'+name,points,.004,gold,root);rim.parent=arm
        g=rim.vertex_groups.new(name='spine_03');g.add(list(range(len(rim.data.vertices))),1,'REPLACE');m=rim.modifiers.new('rigid_rim','ARMATURE');m.object=arm
        rim['equipment_slot']='armor';rim['armor_style']='plate'
    # Embossed eight-point crest, with a genuine centre ridge and bevel depth.
    points=[]
    for i in range(16):
        angle=i*math.tau/16;r=.055 if i%2==0 else .021
        points.append((r*math.sin(angle),-.160,1.145+r*math.cos(angle)))
    crest=props.mesh('plate__crest',[(0,-.172,1.145)]+points,[(0,i+1,(i+1)%16+1) for i in range(16)],gold,root)
    crest.parent=arm;g=crest.vertex_groups.new(name='spine_03');g.add(list(range(len(crest.data.vertices))),1,'REPLACE');m=crest.modifiers.new('rigid_crest','ARMATURE');m.object=arm
    crest['equipment_slot']='armor';crest['armor_style']='plate'


def build(hero):
    style=HEROES[hero]
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/rigged/RealHuman.glb'))
    arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
    native=[o for o in bpy.context.scene.objects if o.type=='MESH']
    for t in arm.animation_data.nla_tracks:t.mute=True
    arm.animation_data.action=None
    for b in arm.pose.bones:b.matrix_basis.identity()
    for obj in native:clear_morphs(obj,style['female'])
    body=next(o for o in native if o.name=='Body')
    for obj in native:
        if obj!=body:bpy.data.objects.remove(obj,do_unlink=True)
    leather=material('dark_leather',(.045,.028,.018),0,.65)
    cloth=material('forest_wool',style['cloth'])
    steel=material('tempered_steel',style['metal'],.72,.32)
    portrait=photo_cloth(hero,style['cloth'])
    # Surfaces retain the native hand-authored edge loops and original weights.
    jacket=region_copy(body,'base__jacket',lambda p:(.78<p.z<1.39) or (abs(p.x)>.20 and 1.03<p.z<1.34),portrait,arm,.022,True)
    if hero in ['lyra','mira','eira']:
        for vertex in jacket.data.vertices:
            groups={jacket.vertex_groups[g.group].name:g.weight for g in vertex.groups}
            side='l' if vertex.co.x>0 else 'r';weight=groups.get('lowerarm_'+side,0)
            if weight>.2:
                bone=arm.data.bones['lowerarm_'+side];axis=bone.tail_local-bone.head_local
                t=max(0,min(1,(vertex.co-bone.head_local).dot(axis)/axis.length_squared));center=bone.head_local+axis*t
                vertex.co=center+(vertex.co-center)*(1+.9*t*t*weight)
    project_garment(jacket,arm,hero)
    trousers=region_copy(body,'base__trousers',lambda p:.12<p.z<.90,portrait,arm,.019,True)
    project_garment(trousers,arm,hero)
    boots(hero,arm,leather)
    breastplate(hero,arm,steel,material('aged_brass',(.38,.23,.065),.78,.4))
    if hero!='rovan':skirt(hero,arm,portrait)
    if hero=='rovan':
        region_copy(body,'base__neck',lambda p:1.37<p.z<1.47 and abs(p.x)<.115,cloth,arm,.008)
    bpy.data.objects.remove(body,do_unlink=True)
    author_hands(arm,material('skin' if hero not in ['aldren','doran','vesper'] else 'gloves',(.30,.15,.09) if hero not in ['aldren','doran','vesper'] else (.035,.022,.016),0,.8))
    cape(hero,arm,cloth)
    identity_head(hero,arm)
    aliases={'idle':'Idle','walk':'Walk','run':'Run','fall':'Death'}
    for t in list(arm.animation_data.nla_tracks):
        if t.name not in aliases:arm.animation_data.nla_tracks.remove(t);continue
        t.name=aliases[t.name];t.strips[0].action.name=t.name;t.mute=False
    scene=bpy.context.scene;scene.frame_set(0)
    spec=importlib.util.spec_from_file_location('combat',Path(__file__).with_name('native-hero-combat.py'))
    combat=importlib.util.module_from_spec(spec);spec.loader.exec_module(combat)
    if hero=='rovan':combat.archery(arm)
    else:combat.combat(arm,hero)
    arm['hero_body_kind']='native_humanoid';arm['hero_id']=hero
    dest=ASSETS/f'{hero}-native.glb'
    bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_extras=True,export_skins=True,export_morph=True)
    print('NATIVE_HERO',hero,dest.stat().st_size,flush=True)

if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(HEROES)
    for hero in args:build(hero)
