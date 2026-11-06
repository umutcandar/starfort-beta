"""Build Rovan's independent bow, deforming string, arrow and two-arm IK shot."""
import bpy
import importlib.util
import math
from pathlib import Path
from mathutils import Vector, Matrix

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('hero_rig',HERE/'rig-hero-models.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
base.POSES['rovan']=[[.50,.10],[.50,.29],[.50,.51],[.30,.24],[.19,.35],[.10,.47],[.70,.24],[.81,.35],[.90,.47],[.39,.55],[.39,.75],[.39,.96],[.61,.55],[.61,.75],[.61,.96]]

def material(name,color,metal=0,roughness=.55):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    shader=m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=roughness
    return m


def mesh(name,vertices,faces,mat,parent):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat);obj.parent=parent
    for polygon in data.polygons:polygon.use_smooth=True
    return obj


def tube(name,points,radius,mat,parent):
    vertices=[];faces=[];sides=8
    for i,point in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize();normal=Vector((1,0,0));binormal=tangent.cross(normal).normalized()
        for j in range(sides):
            a=j*math.tau/sides;v=Vector(point)+radius*(math.cos(a)*normal+math.sin(a)*binormal)
            vertices.append(tuple(v))
        if i:
            for j in range(sides):
                a=(i-1)*sides+j;b=(i-1)*sides+(j+1)%sides;c=i*sides+(j+1)%sides;d=i*sides+j
                faces.append((a,b,c,d))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple(range(len(vertices)-sides,len(vertices)))])
    return mesh(name,vertices,faces,mat,parent)


def track(owner,action):
    owner.animation_data_create();owner.animation_data.action=None
    t=owner.animation_data.nla_tracks.new();t.name='Attack';t.strips.new('Attack',1,action)


def smooth(a,b,t):
    t=max(0,min(1,t));return a+(b-a)*(t*t*(3-2*t))


def build(arm,body):
    scene=bpy.context.scene
    # Restore forest-cloth shading on inferred, washed-out side/back surfaces.
    # The frontal source texture and exposed hands/face keep their own colors.
    for obj in body:
        colors=obj.data.color_attributes.new(name='ForestCloth',type='FLOAT_COLOR',domain='POINT')
        obj.data.color_attributes.active_color_index=len(obj.data.color_attributes)-1
        obj.data.color_attributes.render_color_index=len(obj.data.color_attributes)-1
        for vertex in obj.data.vertices:
            p=vertex.co
            hand=abs(p.x)>.50 and 1.0<p.z<1.55
            face=p.z>2.05 and vertex.normal.y>.2
            shade=0 if hand or face else max(0,min(1,(.3-vertex.normal.y)/.6))
            colors.data[vertex.index].color=(1-.65*shade,1-.60*shade,1-.72*shade,1)
        for mat in obj.data.materials:
            if not mat or not mat.use_nodes:continue
            nodes=mat.node_tree.nodes;links=mat.node_tree.links
            shader=nodes.get('Principled BSDF')
            if not shader or not shader.inputs['Base Color'].is_linked:continue
            source=shader.inputs['Base Color'].links[0].from_socket
            multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
            color=nodes.new('ShaderNodeVertexColor');color.layer_name='ForestCloth'
            links.new(source,multiply.inputs[1]);links.new(color.outputs['Color'],multiply.inputs[2]);links.new(multiply.outputs[0],shader.inputs['Base Color'])
    for t in list(arm.animation_data.nla_tracks):
        if t.name in ['Attack','Special']:arm.animation_data.nla_tracks.remove(t)
        else:t.mute=True
    arm.animation_data.action=None
    for b in arm.pose.bones:b.matrix_basis=Matrix.Identity(4)
    scene.frame_set(1);bpy.context.view_layer.update()
    left=Vector((.28,.10,1.20))
    right=Vector((-.28,.08,1.20))
    targets=[]
    for side in ['L','R']:
        target=bpy.data.objects.new('wrist_target_'+side,None);bpy.context.collection.objects.link(target)
        pole=bpy.data.objects.new('elbow_pole_'+side,None);bpy.context.collection.objects.link(pole)
        pole.location=((.95 if side=='L' else -.95),-.24,1.85)
        constraint=arm.pose.bones['forearm_'+side].constraints.new('IK')
        constraint.target=target;constraint.pole_target=pole;constraint.chain_count=2
        orientation=arm.pose.bones['hand_'+side].constraints.new('COPY_ROTATION')
        orientation.target=target;orientation.target_space='WORLD';orientation.owner_space='WORLD'
        targets.append(target)
    duration=52;fps=24;release=35
    poses=[];pulls=[]
    for frame in range(1,duration+1):
        phase=(frame-1)/(duration-1)
        lift=smooth(0,1,phase/.24) if phase<.80 else smooth(1,0,(phase-.80)/.20)
        bow=left.lerp(Vector((.18,.62,1.88)),lift)
        release_phase=(release-1)/(duration-1)
        pull=smooth(0,.44,(phase-.30)/.26) if phase<release_phase else smooth(.44,0,(phase-release_phase)/.035)
        nock=bow+Vector((0,-.14-pull,0))
        reach=smooth(0,1,(phase-.08)/.20) if phase<.79 else smooth(1,0,(phase-.79)/.21)
        hand_pull=pull if frame<release else .44
        draw=right.lerp(bow+Vector((0,-.14-hand_pull,0)),reach)
        targets[0].location=bow;targets[1].location=draw
        bpy.context.view_layer.update()
        evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        poses.append({b.name:b.matrix.copy() for b in evaluated.pose.bones})
        pulls.append(pull/.44)
    for b in arm.pose.bones:
        for constraint in list(b.constraints):b.constraints.remove(constraint)
    for obj in targets:bpy.data.objects.remove(obj,do_unlink=True)
    for obj in list(bpy.data.objects):
        if obj.name.startswith('elbow_pole_'):bpy.data.objects.remove(obj,do_unlink=True)
    action=bpy.data.actions.new('Attack');arm.animation_data.action=action
    for frame,pose in enumerate(poses,1):
        for b in arm.pose.bones:
            b.rotation_mode='XYZ';b.matrix=pose[b.name]
            bpy.context.view_layer.update()
            b.keyframe_insert('rotation_euler',frame=frame)
            b.keyframe_insert('location',frame=frame)
            b.keyframe_insert('scale',frame=frame)
    track(arm,action)
    arm.animation_data.action=None
    for b in arm.pose.bones:
        b.rotation_mode='XYZ';b.matrix=poses[0][b.name]
        bpy.context.view_layer.update()
    # Other movements start from the same relaxed ready stance as the shot.
    arm_bones=['upperarm_L','forearm_L','hand_L','upperarm_R','forearm_R','hand_R']
    offsets={name:tuple(arm.pose.bones[name].rotation_euler) for name in arm_bones}
    for t in arm.animation_data.nla_tracks:
        if t.name=='Attack':continue
        for strip in t.strips:
            for curve in strip.action.fcurves:
                for name,angles in offsets.items():
                    if curve.data_path==f'pose.bones["{name}"].rotation_euler':
                        offset=angles[curve.array_index]
                        for key in curve.keyframe_points:
                            key.co.y+=offset;key.handle_left.y+=offset;key.handle_right.y+=offset
    # The bow is a separate transform node attached to the left hand bone.
    bow=bpy.data.objects.new('rovan_bow',None);bpy.context.collection.objects.link(bow)
    bow.parent=arm;bow.parent_type='BONE';bow.parent_bone='hand_L'
    bow.location=(0,-arm.data.bones['hand_L'].length+.07,0)
    bow['equipment_slot']='weapon';bow['draw_distance']=.44
    wood=material('dark_yew',(.115,.055,.025),0,.43)
    gold=material('engraved_brass',(.48,.30,.10),.75,.32)
    leather=material('bow_grip',(.055,.035,.021),0,.82)
    fiber=material('flax_bowstring',(.58,.47,.27),0,.9)
    steel=material('arrowhead_steel',(.38,.42,.45),.8,.28)
    feather=material('green_fletching',(.075,.18,.09),0,.75)
    points=[]
    for i in range(65):
        z=-.72+1.44*i/64
        y=.10*math.sin(abs(z)/.72*math.pi)-.14*(abs(z)/.72)**5
        points.append((0,y,z))
    limbs=tube('rovan_bow_limbs',points,.025,wood,bow)
    limbs.shape_key_add(name='Basis');draw=limbs.shape_key_add(name='Draw')
    for v in draw.data:
        blend=(abs(v.co.z)/.72)**3
        v.co.y-=.055*blend;v.co.z*=1-.025*blend
    tube('rovan_bow_grip',[(0,0,-.12),(0,0,.12)],.033,leather,bow)
    for side in [-1,1]:
        tube('rovan_bow_gold_'+str(side),[(.023,p[1],p[2]) for p in points if .16<abs(p[2])<.67 and p[2]*side>0],.006,gold,bow)
    string=tube('rovan_bowstring',[(0,-.14,-.72),(0,-.14,0),(0,-.14,.72)],.003,fiber,bow)
    string.shape_key_add(name='Basis');draw=string.shape_key_add(name='Draw')
    for i,v in enumerate(draw.data):
        row=i//8
        if row==1:v.co.y-=.44
        else:v.co.y-=.055;v.co.z*=.975
    arrow=bpy.data.objects.new('rovan_arrow',None);bpy.context.collection.objects.link(arrow);arrow.parent=bow
    arrow['release_frame']=release;arrow['frames_per_second']=fps
    tube('rovan_arrow_shaft',[(0,0,0),(0,.80,0)],.0055,wood,arrow)
    tip=mesh('rovan_arrow_head',[(0,.90,0),(-.025,.77,0),(0,.78,.012),(.025,.77,0),(0,.78,-.012)],[(0,1,2),(0,2,3),(0,3,4),(0,4,1),(1,4,3,2)],steel,arrow)
    for angle in [0,math.tau/3,math.tau*2/3]:
        fin=mesh('rovan_arrow_feather',[(0,.03,0),(.027,.035,0),(.024,.12,0),(0,.17,0)],[(0,1,2,3)],feather,arrow)
        fin.rotation_euler.y=angle
    for obj in [limbs,string]:
        keys=obj.data.shape_keys;keys.animation_data_create();keys.animation_data.action=bpy.data.actions.new('Attack')
        for frame,value in enumerate(pulls,1):
            keys.key_blocks['Draw'].value=value;keys.key_blocks['Draw'].keyframe_insert('value',frame=frame)
        track(keys,keys.animation_data.action)
    arrow.animation_data_create();arrow.animation_data.action=bpy.data.actions.new('Attack')
    for frame,value in enumerate(pulls,1):
        phase=(frame-1)/(duration-1)
        if frame<release:
            arrow.location=(0,-.14-.44*value,0);visible=phase>.22
        else:
            arrow.location=(0,-.58+(frame-release)*.40,0);visible=frame<release+12
        arrow.scale=(1,1,1) if visible else (.0001,.0001,.0001)
        arrow.keyframe_insert('location',frame=frame);arrow.keyframe_insert('scale',frame=frame)
    track(arrow,arrow.animation_data.action)
    # Marked Shot uses the same bow/arrow mechanics as a normal shot.
    for owner in [arm,limbs.data.shape_keys,string.data.shape_keys,arrow]:
        shot=next(t for t in owner.animation_data.nla_tracks if t.name=='Attack')
        special=owner.animation_data.nla_tracks.new();special.name='Special'
        special.strips.new('Special',1,shot.strips[0].action.copy())
    for t in arm.animation_data.nla_tracks:t.mute=False
    scene.frame_set(1);bpy.context.view_layer.update()
    arm['animation_review']='independent bow limbs, string morph, hand IK, arrow release'

if __name__=='__main__':
    base.rig('rovan',postprocess=build,model_file=base.ASSETS/'rovan-unarmed.glb',source_file=base.ASSETS/'source/rovan-unarmed.png',output_file=base.ASSETS/'rovan-archery-experiment.glb')
