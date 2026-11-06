"""Blender authoring of source-pose rigs and conservative game animation clips.
Run with Blender --background --factory-startup --python this_file -- hero ...
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets/heroes-3d'
# Image-normalized landmarks, measured separately in each source pose.
POSES = {
 'aldren': [[.55,.09],[.55,.28],[.50,.53],[.37,.25],[.28,.40],[.23,.47],[.77,.25],[.78,.40],[.75,.49],[.40,.57],[.35,.76],[.24,.94],[.60,.57],[.70,.78],[.80,.97]],
 'lyra': [[.57,.12],[.59,.30],[.59,.50],[.43,.25],[.31,.31],[.24,.24],[.71,.27],[.72,.38],[.80,.34],[.51,.55],[.49,.76],[.46,.95],[.64,.55],[.64,.77],[.64,.95]],
 'rovan': [[.54,.10],[.49,.29],[.47,.53],[.35,.27],[.34,.40],[.38,.48],[.63,.25],[.60,.44],[.48,.49],[.38,.55],[.33,.75],[.28,.95],[.56,.55],[.63,.74],[.76,.91]],
 'mira': [[.52,.09],[.53,.29],[.54,.50],[.36,.25],[.30,.34],[.27,.38],[.71,.25],[.73,.37],[.82,.30],[.46,.56],[.44,.77],[.42,.95],[.61,.56],[.65,.77],[.70,.97]],
 'doran': [[.52,.10],[.49,.29],[.49,.52],[.27,.25],[.28,.38],[.30,.44],[.70,.27],[.76,.44],[.78,.57],[.35,.55],[.30,.75],[.18,.96],[.61,.55],[.67,.75],[.81,.96]],
 'vesper': [[.51,.10],[.49,.29],[.47,.51],[.32,.25],[.27,.40],[.24,.49],[.62,.26],[.68,.42],[.73,.52],[.38,.55],[.35,.76],[.30,.96],[.56,.55],[.61,.76],[.65,.97]],
 'eira': [[.52,.10],[.51,.29],[.49,.51],[.35,.25],[.30,.35],[.25,.35],[.66,.26],[.75,.38],[.85,.31],[.43,.56],[.42,.77],[.40,.96],[.59,.56],[.60,.77],[.63,.97]],
}


def rig(hero):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS / f'{hero}-reconstructed.glb'))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    # Imported meshes keep their original textures and topology.
    for obj in meshes:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.select_set(False)
    points = np.concatenate([np.array([tuple(v.co) for v in m.data.vertices]) for m in meshes])
    low, high = points.min(0), points.max(0)
    factor = 2.6 / (high[2] - low[2])
    center = (low + high) / 2
    for obj in meshes:
        for vertex in obj.data.vertices:
            vertex.co = Vector(((vertex.co.x-center[0])*factor,
                                (vertex.co.y-center[1])*factor,
                                (vertex.co.z-low[2])*factor))
    # Read PNG dimensions without adding a Pillow dependency to Blender.
    header = (ASSETS / 'source' / f'{hero}.png').read_bytes()
    width, height = int.from_bytes(header[16:20], 'big'), int.from_bytes(header[20:24], 'big')
    def point(uv):
        return Vector(((.5-uv[0])*2.6*width/height, .0, (1-uv[1])*2.6))
    p = [point(uv) for uv in POSES[hero]]
    head,chest,hip,sl,el,wl,sr,er,wr,hl,kl,al,hr,kr,ar = p
    neck = head.lerp(chest,.43)
    spine = hip.lerp(chest,.56)
    joints = [
      ('pelvis',hip,spine,None),('spine',spine,chest,'pelvis'),
      ('chest',chest,neck,'spine'),('neck',neck,head,'chest'),
      ('head',head,head+Vector((0,0,.18)),'neck'),
      ('shoulder_L',chest,sl,'chest'),('upperarm_L',sl,el,'shoulder_L'),
      ('forearm_L',el,wl,'upperarm_L'),('hand_L',wl,wl+Vector((0,.10,-.05)),'forearm_L'),
      ('shoulder_R',chest,sr,'chest'),('upperarm_R',sr,er,'shoulder_R'),
      ('forearm_R',er,wr,'upperarm_R'),('hand_R',wr,wr+Vector((0,.10,-.05)),'forearm_R'),
      ('thigh_L',hl,kl,'pelvis'),('calf_L',kl,al,'thigh_L'),('foot_L',al,al+Vector((0,.15,0)),'calf_L'),
      ('thigh_R',hr,kr,'pelvis'),('calf_R',kr,ar,'thigh_R'),('foot_R',ar,ar+Vector((0,.15,0)),'calf_R'),
    ]
    armature = bpy.data.armatures.new(hero+'_skeleton')
    arm = bpy.data.objects.new(hero+'_rig',armature)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,start,end,parent in joints:
        bone=armature.edit_bones.new(name);bone.head=start;bone.tail=end
        if parent:bone.parent=armature.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    # Continuous four-influence envelopes. Long garments share torso motion.
    starts=np.array([tuple(j[1]) for j in joints]);ends=np.array([tuple(j[2]) for j in joints])
    segments=ends-starts
    lengths=(segments*segments).sum(1)
    robes=hero in ('lyra','mira','eira')
    for obj in meshes:
        coords=np.array([tuple(v.co) for v in obj.data.vertices])
        delta=coords[:,None,:]-starts[None,:,:]
        along=np.clip((delta*segments).sum(2)/lengths,0,1)
        distance=((delta-along[:,:,None]*segments)**2).sum(2)
        if robes:
            # A robe hangs from the pelvis; leg motion must not split the skirt.
            distance[coords[:,2]<1.3,13:] += .35
        indices=np.argsort(distance,axis=1)[:,:4]
        scores=np.take_along_axis(distance,indices,axis=1)
        weights=np.exp(-(scores-scores[:,0,None])/.014)
        weights/=weights.sum(1)[:,None]
        # Staff shafts and the shield remain rigid in their grip. Soft envelopes
        # would otherwise bend long weapons toward the nearest head/chest bone.
        u = .5 - coords[:,0] / (2.6*width/height)
        v = 1 - coords[:,2] / 2.6
        rigid = np.zeros(len(coords), dtype=bool)
        hand = 'hand_R'
        if hero in ('lyra','mira'):
            rigid = (u > .82) & (v < .86)
        elif hero == 'eira':
            rigid = (u < .26) & (v < .92)
            hand = 'hand_L'
        elif hero == 'aldren':
            rigid = (u > .72) & (v > .34) & (v < .68)
        bone_index = next(i for i,j in enumerate(joints) if j[0] == hand)
        indices[rigid,0] = bone_index
        weights[rigid] = [1,0,0,0]
        obj['rigid_accessory_vertices'] = int(rigid.sum())
        groups=[obj.vertex_groups.new(name=j[0]) for j in joints]
        for vi in range(len(coords)):
            for bi,w in zip(indices[vi],weights[vi]):
                if w>.0001:groups[int(bi)].add([vi],float(w),'REPLACE')
        modifier=obj.modifiers.new('Source pose skin','ARMATURE');modifier.object=arm
        obj.parent=arm
    def gesture(phase):
        # A slower wind-up, fast release, then a longer recovery.
        keys = [(0,0),(.24,-.30),(.42,1),(.58,.55),(1,0)]
        for (a,x),(b,y) in zip(keys,keys[1:]):
            if phase <= b:
                t = (phase-a)/(b-a)
                eased = t*t*(3-2*t)
                return x+(y-x)*eased
        return 0
    scene=bpy.context.scene;scene.render.fps=24
    clips=[('Idle',72),('Walk',32),('Run',24),('Attack',24),('Special',40),('Guard',32),('Hit',16),('Death',40)]
    for name,duration in clips:
        action=bpy.data.actions.new(name);arm.animation_data_create();arm.animation_data.action=action
        for frame in range(1,duration+1,2):
            phase=(frame-1)/(duration-1);pulse=math.sin(math.pi*phase)**2
            for b in arm.pose.bones:
                b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
            def turn(bone,axis,angle):arm.pose.bones[bone].rotation_euler[axis]=angle
            if name=='Idle':
                turn('chest',0,math.sin(phase*math.tau)*.012)
                turn('head',2,math.sin(phase*math.tau)*.009)

            if name in ['Walk','Run']:
                swing=math.sin(phase*math.tau)
                for side,sign in [('L',1),('R',-1)]:
                    turn('thigh_'+side,0,swing*(.17 if name=='Run' else .12)*sign)
                    turn('calf_'+side,0,max(0,-swing*sign)*.18)
                    turn('upperarm_'+side,0,-swing*.06*sign)
                arm.pose.bones['pelvis'].location.y=abs(swing)*.015
            if name=='Attack':
                strike = gesture(phase)
                if hero in ('lyra','mira','eira'):
                    turn('forearm_L',0,-strike*.14)
                    turn('chest',0,-strike*.035)
                elif hero == 'rovan':
                    turn('forearm_R',0,strike*.18)
                    turn('chest',1,strike*.055)
                else:
                    turn('chest',1,strike*.14)
                    turn('upperarm_L',0,-strike*.31)
                    turn('forearm_L',0,strike*.20)
            if name=='Special':
                for side in ['L','R']:turn('upperarm_'+side,0,-pulse*.15)
                turn('chest',0,-pulse*.045)
            if name=='Guard':turn('upperarm_R',0,-pulse*.17);turn('chest',0,pulse*.045)
            if name=='Hit':turn('chest',0,pulse*.12)
            if name=='Death':turn('pelvis',0,phase*1.2)
            for bone in arm.pose.bones:
                bone.keyframe_insert('rotation_euler',frame=frame)
                bone.keyframe_insert('location',frame=frame)
        # Endpoints are explicit to make looping idle/walk clips deterministic.
        for bone in arm.pose.bones:
            if name in ['Idle','Walk','Run']:
                bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
            bone.keyframe_insert('rotation_euler',frame=duration)
            bone.keyframe_insert('location',frame=duration)
        track=arm.animation_data.nla_tracks.new();track.name=name
        track.strips.new(name,1,action)
        arm.animation_data.action=None
        track.mute=True
    for track in arm.animation_data.nla_tracks:track.mute=False
    bpy.context.scene.frame_set(1)
    destination=ASSETS/f'{hero}-rigged.glb'
    bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',
        export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,
        export_all_influences=False,export_force_sampling=True,export_extras=True)
    print('RIGGED',hero,destination.stat().st_size,flush=True)

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(POSES)
for name in args:rig(name)
