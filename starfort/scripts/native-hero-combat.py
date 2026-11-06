"""Native 53-joint combat authoring. Separate weapons and finger articulation."""
import bpy,math,importlib.util
from pathlib import Path
from mathutils import Vector,Matrix,Quaternion
spec=importlib.util.spec_from_file_location('archery',Path(__file__).with_name('rig-rovan-archery.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)


def strip(owner,name,action):
    owner.animation_data_create();owner.animation_data.action=None
    track=owner.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action)
    return track


def prepare(arm):
    for t in arm.animation_data.nla_tracks:t.mute=True
    arm.animation_data.action=None
    for b in arm.pose.bones:b.matrix_basis.identity()
    bpy.context.scene.frame_set(1);bpy.context.view_layer.update()


def bake(arm,name,poses):
    action=bpy.data.actions.new(name);arm.animation_data.action=action
    for frame,pose in enumerate(poses,1):
        for b in arm.pose.bones:
            b.rotation_mode='QUATERNION';b.matrix=pose[b.name];bpy.context.view_layer.update()
            for path in ['rotation_quaternion','location','scale']:b.keyframe_insert(path,frame=frame)
    strip(arm,name,action)
    return action


def fingers(arm,side,amount):
    bases=[arm.data.bones[f'{f}_01_{side}'].head_local for f in ['index','middle','ring','pinky']]
    forward=(sum(bases,Vector())/4-arm.data.bones['hand_'+side].head_local).normalized()
    width=(bases[0]-bases[-1]);width=(width-forward*width.dot(forward)).normalized()
    for family in ['index','middle','ring','pinky']:
        for segment in [1,2,3]:
            bone=arm.pose.bones[f'{family}_0{segment}_{side}'];bone.rotation_mode='QUATERNION'
            axis=bone.bone.matrix_local.to_quaternion().inverted()@width
            bone.rotation_quaternion=Quaternion(axis,-amount*(.82 if segment==1 else 1.05))
    for i in [1,2,3]:
        bone=arm.pose.bones[f'thumb_0{i}_{side}'];bone.rotation_mode='QUATERNION'
        axis=bone.bone.matrix_local.to_quaternion().inverted()@forward
        bone.rotation_quaternion=Quaternion(axis,amount*.45)


def tune_pole(arm,bone_name,joint_name,pole,steps=32):
    constraint=next(c for c in arm.pose.bones[bone_name].constraints if c.type=='IK')
    candidates=[]
    for i in range(steps):
        angle=-math.pi+i/steps*math.tau;constraint.pole_angle=angle;bpy.context.view_layer.update()
        evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        joint=evaluated.pose.bones[joint_name].head
        candidates.append(((joint-pole.location).length_squared,angle))
    constraint.pole_angle=min(candidates)[1]


def ready_clips(arm,pose):
    for track in list(arm.animation_data.nla_tracks):
        if track.name=='Idle':arm.animation_data.nla_tracks.remove(track)
    for b in arm.pose.bones:
        b.rotation_mode='QUATERNION';b.matrix=pose[b.name];bpy.context.view_layer.update()
    arms=[b.name for b in arm.pose.bones if any(n in b.name for n in ['clavicle_','upperarm_','lowerarm_','hand_','index_','middle_','ring_','pinky_','thumb_'])]
    for track in arm.animation_data.nla_tracks:
        if track.name not in ['Walk','Run']:continue
        action=track.strips[0].action
        for name in arms:
            bone=arm.pose.bones[name]
            for path,values in [('rotation_quaternion',bone.rotation_quaternion),('location',bone.location),('scale',bone.scale)]:
                data_path=f'pose.bones["{name}"].{path}'
                for index,value in enumerate(values):
                    curve=action.fcurves.find(data_path,index=index) or action.fcurves.new(data_path,index=index)
                    curve.keyframe_points.clear()
                    curve.keyframe_points.insert(1,value);curve.keyframe_points.insert(action.frame_range[1],value)
    idle=[]
    for frame in range(1,73):
        for b in arm.pose.bones:
            b.rotation_mode='QUATERNION';b.matrix=pose[b.name];bpy.context.view_layer.update()
        bone=arm.pose.bones['spine_03'];bone.rotation_quaternion=bone.rotation_quaternion@Quaternion((1,0,0),math.sin((frame-1)/72*math.tau)*.008)
        bpy.context.view_layer.update();idle.append({b.name:b.matrix.copy() for b in arm.pose.bones})
    bake(arm,'Idle',idle)


def reactions(arm,ready):
    for name,frames in [('Guard',40),('Hit',28)]:
        poses=[]
        for frame in range(1,frames+1):
            pulse=math.sin((frame-1)/(frames-1)*math.pi)**2
            for bone in arm.pose.bones:
                bone.rotation_mode='QUATERNION';bone.matrix=ready[bone.name];bpy.context.view_layer.update()
            spine=arm.pose.bones['spine_03']
            spine.rotation_quaternion=spine.rotation_quaternion@Quaternion((1,0,0),(-.16 if name=='Hit' else .08)*pulse)
            bpy.context.view_layer.update();poses.append({b.name:b.matrix.copy() for b in arm.pose.bones})
        bake(arm,name,poses)


def archery(arm):
    prepare(arm)
    scene=bpy.context.scene;scene.render.fps=24
    rest={s:arm.pose.bones['hand_'+s].matrix.copy() for s in ['l','r']}
    # Orient the anatomical palm, rather than assuming the donor bone axes
    # match the direction of its fingers.
    rotations={};palm_offsets={};palm_bases={}
    world_palm=Matrix(((0,0,1),(0,-1,0),(1,0,0)))
    for side in ['l','r']:
        hand=arm.data.bones['hand_'+side]
        bases=[arm.data.bones[f'{f}_01_{side}'].head_local for f in ['index','middle','ring','pinky']]
        center=sum(bases,Vector())/4;forward=(center-hand.head_local).normalized()
        width=(bases[0]-bases[-1]);width=(width-forward*width.dot(forward)).normalized()
        normal=width.cross(forward).normalized()
        native_palm=Matrix((width,forward,normal)).transposed()
        transform=world_palm@native_palm.inverted()
        rotations[side]=(transform@hand.matrix_local.to_3x3()).to_quaternion()
        palm_offsets[side]=transform@(hand.head_local.lerp(center,.64)-hand.head_local)
        palm_bases[side]=(native_palm,transform)
    targets={}
    for s in ['l','r']:
        target=bpy.data.objects.new('archery_wrist_'+s,None);bpy.context.collection.objects.link(target);target.rotation_mode='QUATERNION'
        pole=bpy.data.objects.new('archery_elbow_'+s,None);bpy.context.collection.objects.link(pole)
        pole.location=((.45,-.20,1.20) if s=='l' else (-.43,.22,1.42))
        ik=arm.pose.bones['lowerarm_'+s].constraints.new('IK');ik.target=target;ik.pole_target=pole;ik.chain_count=2
        copy=arm.pose.bones['hand_'+s].constraints.new('COPY_ROTATION');copy.target=target;copy.target_space='WORLD';copy.owner_space='WORLD'
        targets[s]=target
    targets['l'].location=Vector((.16,-.43,1.43))-palm_offsets['l']+Vector((.018,0,0))
    targets['r'].location=Vector((.16,-.05,1.43))-palm_offsets['r']+Vector((.018,0,0))
    for side in ['l','r']:
        tune_pole(arm,'lowerarm_'+side,'lowerarm_'+side,bpy.data.objects['archery_elbow_'+side])
    finger_targets={}
    for side in ['l','r']:
        for family in ['index','middle','ring','pinky','thumb']:
            target=bpy.data.objects.new('archery_finger_'+family+'_'+side,None);bpy.context.collection.objects.link(target)
            pole=bpy.data.objects.new('archery_finger_pole_'+family+'_'+side,None);bpy.context.collection.objects.link(pole)
            ik=arm.pose.bones[f'{family}_03_{side}'].constraints.new('IK');ik.target=target;ik.pole_target=pole;ik.chain_count=3;ik.use_tail=True
            finger_targets[(side,family)]=(target,pole)
    ready={'l':Vector((.255,-.14,.92)),'r':Vector((-.255,-.13,.92))}
    duration=64;release=43;pulls=[];poses=[]
    for frame in range(1,duration+1):
        phase=(frame-1)/(duration-1);release_phase=(release-1)/(duration-1)
        lift=a.smooth(0,1,phase/.24) if phase<.81 else a.smooth(1,0,(phase-.81)/.19)
        pull=a.smooth(0,.28,(phase-.30)/.26) if frame<release else a.smooth(.28,0,(phase-release_phase)/.035)
        grip=Vector((.16,-.43,1.43));nock=grip+Vector((0,.10+(.28 if frame>=release else pull),0))
        reach=a.smooth(0,1,(phase-.08)/.20) if phase<.80 else a.smooth(1,0,(phase-.80)/.20)
        targets['l'].location=ready['l'].lerp(grip-palm_offsets['l']+Vector((.018,0,0)),lift)
        targets['r'].location=ready['r'].lerp(nock-palm_offsets['r']+Vector((.018,0,0)),reach)
        for s in ['l','r']:
            targets[s].rotation_quaternion=rest[s].to_quaternion().slerp(rotations[s],lift)
            hand_rotation=targets[s].rotation_quaternion.to_matrix()
            delta=hand_rotation@rest[s].to_3x3().inverted()
            center=targets[s].location+delta@(arm.data.bones['hand_'+s].head_local.lerp(sum([arm.data.bones[f'{f}_01_{s}'].head_local for f in ['index','middle','ring','pinky']],Vector())/4,.64)-rest[s].translation)
            native_palm=palm_bases[s][0];normal=delta@native_palm.col[2];forward=delta@native_palm.col[1];width=delta@native_palm.col[0]
            for family,offset in [('index',.026),('middle',.008),('ring',-.010),('pinky',-.027),('thumb',.016)]:
                target,pole=finger_targets[(s,family)]
                base=targets[s].location+delta@(arm.data.bones[f'{family}_01_{s}'].head_local-rest[s].translation)
                pole.location=base-normal*.07+forward*.03
                closed=center-normal*.035-forward*.005+width*offset
                if family=='thumb':closed=center+forward*.035-normal*.012+width*.010
                opened=targets[s].location+delta@(arm.data.bones[f'{family}_03_{s}'].tail_local-rest[s].translation)
                amount=1 if s=='l' or frame<release else max(0,1-(frame-release)/4)
                target.location=opened.lerp(closed,amount)
        if frame==1:
            for (side,family),(target,pole) in finger_targets.items():
                tune_pole(arm,f'{family}_03_{side}',f'{family}_02_{side}',pole,16)
        for name,angle in [('spine_01',.04),('spine_02',.06),('spine_03',.04)]:
            bone=arm.pose.bones[name];bone.rotation_mode='XYZ';bone.rotation_euler.z=angle*lift
        bpy.context.view_layer.update();evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        poses.append({b.name:b.matrix.copy() for b in evaluated.pose.bones});pulls.append(pull/.28)
    for b in arm.pose.bones:
        for c in list(b.constraints):b.constraints.remove(c)
    for o in list(bpy.data.objects):
        if o.name.startswith('archery_'):bpy.data.objects.remove(o,do_unlink=True)
    bake(arm,'Attack',poses)
    ready_pose=poses[0]
    ready_clips(arm,ready_pose)
    reactions(arm,ready_pose)
    # Parent transform accounts for Blender's bone-tail parenting convention.
    bow=bpy.data.objects.new('rovan_bow',None);bpy.context.collection.objects.link(bow)
    bow.parent=arm;bow.parent_type='BONE';bow.parent_bone='hand_l'
    desired=Matrix.Rotation(math.pi,4,'Z');desired.translation=Vector((.16,-.43,1.43))
    hand=rotations['l'].to_matrix().to_4x4();hand.translation=Vector((.16,-.43,1.43))-palm_offsets['l']+Vector((.018,0,0))
    bow.matrix_basis=(hand@Matrix.Translation((0,arm.data.bones['hand_l'].length,0))).inverted()@desired
    bow['equipment_slot']='weapon';bow['draw_distance']=.28
    wood=a.material('polished_yew',(.085,.038,.012),0,.44);gold=a.material('antique_brass',(.36,.21,.065),.75,.36)
    leather=a.material('wrapped_grip',(.035,.020,.012),0,.85);fiber=a.material('flax',(.62,.52,.34),0,.85)
    steel=a.material('forged_arrowhead',(.22,.26,.28),.8,.3);feather=a.material('forest_fletching',(.035,.10,.047),0,.8)
    points=[]
    for i in range(65):
        z=-.55+1.10*i/64;y=.075*math.sin(abs(z)/.55*math.pi)-.10*(abs(z)/.55)**5
        points.append((0,y,z))
    limbs=a.tube('rovan_bow_limbs',points,.016,wood,bow);limbs.shape_key_add(name='Basis');key=limbs.shape_key_add(name='Draw')
    for v in key.data:
        t=(abs(v.co.z)/.55)**3;v.co.y-=.035*t;v.co.z*=1-.025*t
    a.tube('rovan_bow_grip',[(0,0,-.07),(0,0,.07)],.023,leather,bow)
    for side in [-1,1]:a.tube('rovan_bow_inlay_'+str(side),[(.015,p[1],p[2]) for p in points if .12<abs(p[2])<.50 and p[2]*side>0],.003,gold,bow)
    string=a.tube('rovan_bowstring',[(0,-.10,-.55),(0,-.10,0),(0,-.10,.55)],.0018,fiber,bow)
    string.shape_key_add(name='Basis');key=string.shape_key_add(name='Draw')
    for i,v in enumerate(key.data):
        if i//8==1:v.co.y-=.28
        else:v.co.y-=.035;v.co.z*=.975
    arrow=bpy.data.objects.new('rovan_arrow',None);bpy.context.collection.objects.link(arrow);arrow.parent=bow
    a.tube('rovan_arrow_shaft',[(0,0,0),(0,.58,0)],.0035,wood,arrow)
    a.mesh('rovan_arrow_head',[(0,.65,0),(-.017,.56,0),(0,.57,.009),(.017,.56,0),(0,.57,-.009)],[(0,1,2),(0,2,3),(0,3,4),(0,4,1),(1,4,3,2)],steel,arrow)
    for angle in [0,math.tau/3,2*math.tau/3]:
        fin=a.mesh('rovan_arrow_feather',[(0,.02,0),(.018,.025,0),(.016,.08,0),(0,.12,0)],[(0,1,2,3)],feather,arrow);fin.rotation_euler.y=angle
    for obj in [limbs,string]:
        keys=obj.data.shape_keys;keys.animation_data_create();keys.animation_data.action=bpy.data.actions.new('Attack')
        for frame,pull in enumerate(pulls,1):keys.key_blocks['Draw'].value=pull;keys.key_blocks['Draw'].keyframe_insert('value',frame=frame)
        strip(keys,'Attack',keys.animation_data.action)
    arrow.animation_data_create();arrow.animation_data.action=bpy.data.actions.new('Attack')
    for frame,pull in enumerate(pulls,1):
        arrow.location=(0,-.10-.28*pull,0) if frame<release else (0,-.38+(frame-release)*.30,0)
        visible=15<frame<release+10;arrow.scale=(1,1,1) if visible else (.0001,)*3
        arrow.keyframe_insert('location',frame=frame);arrow.keyframe_insert('scale',frame=frame)
    strip(arrow,'Attack',arrow.animation_data.action)
    for owner in [arm,limbs.data.shape_keys,string.data.shape_keys,arrow]:
        attack=next(t for t in owner.animation_data.nla_tracks if t.name=='Attack');strip(owner,'Special',attack.strips[0].action.copy())
    for t in arm.animation_data.nla_tracks:t.mute=False
    scene.frame_set(1);bpy.context.view_layer.update()
    return bow


def attach_weapon(arm,name,side,ready,rotation):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
    obj.parent=arm;obj.parent_type='BONE';obj.parent_bone='hand_'+side
    hand=rotation.to_matrix().to_4x4();hand.translation=ready
    desired=Matrix.Identity(4)
    bone=arm.data.bones['hand_'+side]
    knuckles=sum([arm.data.bones[f'{f}_01_{side}'].head_local for f in ['index','middle','ring','pinky']],Vector())/4
    offset=rotation.to_matrix()@bone.matrix_local.to_3x3().inverted()@(bone.head_local.lerp(knuckles,.64)-bone.head_local)
    desired.translation=ready+offset-Vector((.018,0,0))
    obj.matrix_basis=(hand@Matrix.Translation((0,arm.data.bones['hand_'+side].length,0))).inverted()@desired
    obj['equipment_slot']='weapon';return obj


def blade(name,parent,metal,length=.65,curve=0):
    vertices=[];faces=[];sections=16
    for j in range(sections+1):
        t=j/sections;w=.025*(1-.82*t)*(min(1,(1-t)*8))+.001
        x=curve*t*t;z=.08+length*t
        vertices.extend([(x-w,0,z),(x,-.008,z),(x+w,0,z),(x,.008,z)])
        if j:
            for k in range(4):i=(j-1)*4+k;n=(j-1)*4+(k+1)%4;faces.append((i,n,n+4,i+4))
    faces.append((0,3,2,1));faces.append(tuple(range(sections*4,sections*4+4)))
    return a.mesh(name,vertices,faces,metal,parent)


def forged_weapon(arm,hero,side,ready,rotation,kind):
    root=attach_weapon(arm,hero+'_'+kind+'_'+side,side,ready,rotation)
    steel=a.material('forged_silver',(.23,.28,.31),.85,.33);gold=a.material('aged_gold',(.40,.25,.075),.78,.36)
    wood=a.material('dark_wood',(.065,.025,.012),0,.68);grip=a.material('stitched_leather',(.035,.016,.012),0,.8)
    if kind in ['sword','dagger']:
        blade(hero+'_blade_'+side,root,steel,.65 if kind=='sword' else .29,.10 if kind=='dagger' else 0)
        a.tube(hero+'_guard_'+side,[(-.09,0,.07),(0,-.008,.09),(.09,0,.07)],.012,gold,root)
        a.tube(hero+'_handle_'+side,[(0,0,-.12),(0,0,.07)],.015,grip,root)
        a.tube(hero+'_pommel_'+side,[(0,0,-.145),(0,0,-.12)],.023,gold,root)
        for z in range(8):a.tube(hero+'_grip_wrap_'+side+str(z),[(-.015,0,-.105+z*.019),(.015,0,-.10+z*.019)],.0025,gold,root)
    elif kind=='axe':
        a.tube('doran_axe_haft',[(0,0,-.22),(0,0,.80)],.023,wood,root)
        for z in [.18,.30,.42,.54]:a.tube('axe_haft_binding'+str(z),[(0,0,z),(0,0,z+.025)],.026,gold,root)
        # Thick bevelled wedge: cutting edge, bevel shoulder and central cheek.
        outline=[(-.025,.56),(.13,.53),(.26,.45),(.31,.49),(.35,.70),(.31,.88),(.25,.91),(.13,.82),(-.025,.79)]
        verts=[(x,y,z) for y in [-.016,.016] for x,z in outline];n=len(outline)
        faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        a.mesh('doran_axe_head',verts,faces,steel,root)
        a.tube('axe_silver_edge',[(x,-.017,z) for x,z in outline[2:7]],.009,gold,root)
    elif kind=='staff':
        color={'lyra':(.18,.10,.42),'mira':(.48,.34,.12),'eira':(.10,.40,.58)}[hero]
        gem=a.material(hero+'_crystal',color,.12,.25)
        shader=gem.node_tree.nodes.get('Principled BSDF');shader.inputs['Emission Color'].default_value=(*color,1);shader.inputs['Emission Strength'].default_value=.5
        a.tube(hero+'_staff_shaft',[(0,0,-.87),(0,0,.66)],.016,wood,root)
        for z in [-.65,-.25,.25,.52]:a.tube(hero+'_staff_ferrule'+str(z),[(0,0,z),(0,0,z+.035)],.023,gold,root)
        points=[(.115*math.sin(i*math.tau/48),0,.73+.15*math.cos(i*math.tau/48)) for i in range(49)]
        a.tube(hero+'_staff_halo',points,.009,gold,root)
        verts=[(0,0,.91),(0,0,.60)]+[(.056*math.cos(i*math.tau/8),.056*math.sin(i*math.tau/8),.74) for i in range(8)]
        faces=[(0,2+i,2+(i+1)%8) for i in range(8)]+[(1,2+(i+1)%8,2+i) for i in range(8)]
        a.mesh(hero+'_staff_crystal',verts,faces,gem,root)
        for side in [-1,1]:a.tube(hero+'_staff_claw'+str(side),[(0,0,.57),(side*.075,0,.65),(side*.055,0,.78)],.009,gold,root)
    return root


def shield(arm,hero,side,ready,rotation):
    root=attach_weapon(arm,hero+'_shield',side,ready,rotation)
    steel=a.material('shield_steel',(.11,.15,.18),.75,.4);gold=a.material('shield_brass',(.40,.25,.075),.8,.32)
    outline=[(-.19,.27),(-.22,.17),(-.18,-.12),(0,-.34),(.18,-.12),(.22,.17),(.19,.27)]
    vertices=[(0,-.12,0)]+[(x,-.045,z) for x,z in outline]
    faces=[(0,1+i,1+(i+1)%len(outline)) for i in range(len(outline))]
    plate=a.mesh(hero+'_shield_face',vertices,faces,steel,root)
    thickness=plate.modifiers.new('forged_thickness','SOLIDIFY');thickness.thickness=.012
    a.tube(hero+'_shield_rim',[(x,-.052,z) for x,z in outline+[outline[0]]],.011,gold,root)
    for i in range(8):
        t=i*math.tau/8;r=.13 if i%2==0 else .045
        j=(i+1)%8;q=j*math.tau/8;r2=.13 if j%2==0 else .045
        a.mesh(hero+'_star'+str(i),[(0,-.128,0),(r*math.sin(t),-.10,r*math.cos(t)),(r2*math.sin(q),-.10,r2*math.cos(q))],[(0,1,2)],gold,root)
    return root


def combat(arm,hero):
    prepare(arm);scene=bpy.context.scene;scene.render.fps=24
    caster=hero in ['lyra','mira','eira'];dual=hero=='vesper'
    ready={'l':Vector((.265,-.16,.96)),'r':Vector((-.265,-.16,.96))}
    if caster:
        staff_side='r' if hero=='eira' else 'l';ready[staff_side].z=1.02
    else:staff_side=None
    rest={s:arm.pose.bones['hand_'+s].matrix.copy() for s in ['l','r']}
    for side in ['l','r']:
        bone=arm.data.bones['hand_'+side]
        bases=[arm.data.bones[f'{f}_01_{side}'].head_local for f in ['index','middle','ring','pinky']]
        forward=(sum(bases,Vector())/4-bone.head_local).normalized()
        width=(bases[0]-bases[-1]);width=(width-forward*width.dot(forward)).normalized()
        native=Matrix((width,forward,width.cross(forward))).transposed()
        world=Matrix(((0,0,1),(0,-1,0),(1,0,0)))
        rest[side]=(world@native.inverted()@bone.matrix_local.to_3x3()).to_4x4()
    targets={}
    for side in ['l','r']:
        target=bpy.data.objects.new('combat_wrist_'+side,None);bpy.context.collection.objects.link(target);target.rotation_mode='QUATERNION'
        pole=bpy.data.objects.new('combat_elbow_'+side,None);bpy.context.collection.objects.link(pole);pole.location=(.45 if side=='l' else -.45,.07,1.02)
        ik=arm.pose.bones['lowerarm_'+side].constraints.new('IK');ik.target=target;ik.pole_target=pole;ik.chain_count=2
        copy=arm.pose.bones['hand_'+side].constraints.new('COPY_ROTATION');copy.target=target;copy.owner_space='WORLD';copy.target_space='WORLD'
        target.location=ready[side];target.rotation_quaternion=rest[side].to_quaternion();targets[side]=target
    for side in ['l','r']:tune_pole(arm,'lowerarm_'+side,'lowerarm_'+side,bpy.data.objects['combat_elbow_'+side])
    captured={}
    for clip,frames in [('Attack',48),('Special',64),('Guard',40),('Hit',28)]:
        poses=[]
        for frame in range(1,frames+1):
            phase=(frame-1)/(frames-1)
            wind=a.smooth(0,1,phase/.30) if phase<.30 else a.smooth(1,0,(phase-.30)/.22)
            hit=a.smooth(0,1,(phase-.30)/.16) if phase<.46 else a.smooth(1,0,(phase-.46)/.54)
            pulse=math.sin(phase*math.pi)**2
            for b in arm.pose.bones:b.matrix_basis.identity()
            for side in ['l','r']:
                target=targets[side];target.location=ready[side];target.rotation_quaternion=rest[side].to_quaternion()
                fingers(arm,side,.7)
            if clip in ['Attack','Special']:
                if caster:
                    free='l' if staff_side=='r' else 'r';sign=1 if free=='l' else -1
                    targets[free].location=ready[free].lerp(Vector((sign*.12,-.55,1.25)),pulse)
                    targets[staff_side].location.z+=pulse*.16
                    targets[staff_side].rotation_quaternion=Quaternion((1,0,0),pulse*.22)@rest[staff_side].to_quaternion()
                    fingers(arm,free,.12)
                else:
                    for side in (['l','r'] if dual else ['r']):
                        sign=1 if side=='l' else -1
                        targets[side].location=ready[side]+Vector((sign*.06*wind-sign*.30*hit,-.03*wind-.40*hit,.58*wind+.05*hit))
                        targets[side].rotation_quaternion=Quaternion((1,0,0),-.28*wind+1.45*hit)@rest[side].to_quaternion()
                    if hero=='doran':targets['l'].location=targets['r'].location+Vector((.10,.02,-.16))
                bone=arm.pose.bones['spine_03'];bone.rotation_mode='XYZ';bone.rotation_euler.z=-.19*wind+.20*hit;bone.rotation_euler.x=.06*hit
                bone=arm.pose.bones['pelvis'];bone.rotation_mode='XYZ';bone.rotation_euler.z=-.07*wind+.07*hit
            elif clip=='Guard':
                targets['l'].location+=Vector((-.08,-.28,.24))*pulse
                targets['r'].location+=Vector((.05,-.13,.30))*pulse
            elif clip=='Hit':
                b=arm.pose.bones['spine_03'];b.rotation_mode='XYZ';b.rotation_euler.x=-.20*pulse;b.rotation_euler.z=.08*pulse
            bpy.context.view_layer.update();evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
            poses.append({b.name:b.matrix.copy() for b in evaluated.pose.bones})
        captured[clip]=poses
    for b in arm.pose.bones:
        for c in list(b.constraints):b.constraints.remove(c)
    for o in list(bpy.data.objects):
        if o.name.startswith('combat_'):bpy.data.objects.remove(o,do_unlink=True)
    for name,poses in captured.items():bake(arm,name,poses)
    ready_clips(arm,captured['Attack'][0])
    if caster:forged_weapon(arm,hero,staff_side,ready[staff_side],rest[staff_side].to_quaternion(),'staff')
    elif dual:
        for side in ['l','r']:forged_weapon(arm,hero,side,ready[side],rest[side].to_quaternion(),'dagger')
    else:
        forged_weapon(arm,hero,'r',ready['r'],rest['r'].to_quaternion(),'axe' if hero=='doran' else 'sword')
        if hero=='aldren':shield(arm,hero,'l',ready['l'],rest['l'].to_quaternion())
    for t in arm.animation_data.nla_tracks:t.mute=False
    scene.frame_set(1);bpy.context.view_layer.update()
