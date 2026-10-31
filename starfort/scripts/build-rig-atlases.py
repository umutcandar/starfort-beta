#!/usr/bin/env python3
"""Pre-render six motion states from alpha-isolated unit paintings.

Deterministic 2.5D art pipeline. It is not a 3D skeletal rig: localized
image-space deformation makes a small animation atlas while retaining the
original illustrations. Original asset remains a runtime fallback.
"""
import json
import math
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageEnhance

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
OUT=ASSETS/'rigs'
OUT.mkdir(exist_ok=True)
STATES=['idle','run','attack','cast','hit','down']
FRAMES=6
CELL_W,CELL_H=192,288
PAD=3


def warp_actor(image,state,index):
    h,w=image.shape[:2]
    f=index/FRAMES
    wave=math.sin(f*math.tau)
    t=(np.arange(h,dtype=np.float32)[:,None])/h
    xx=np.broadcast_to(np.arange(w,dtype=np.float32)[None,:],(h,w))
    yy=np.broadcast_to(np.arange(h,dtype=np.float32)[:,None],(h,w))
    # Body lean is small, feet remain rooted, capes and shoulders lag motion.
    top=np.clip((1-t)/.8,0,1)**1.7
    leg=np.clip((t-.54)/.4,0,1)
    left=np.clip((w*.52-xx)/(w*.2),0,1)
    right=np.clip((xx-w*.52)/(w*.2),0,1)
    leg_wave=(left-right)*leg*wave
    torso=top*0
    arm=np.exp(-((t-.51)/.21)**2)*np.clip((xx/w-.35)/.32,0,1)
    lift=0
    if state=='idle':
        dx=top*(.8*wave)+leg_wave*.7
        dy=top*(1.1*math.sin(f*math.tau))
    elif state=='run':
        dx=top*(4.2*wave+2)+leg_wave*8.7
        dy=top*(2.6*math.cos(f*math.tau*2)) + leg*np.abs(wave)*2
    elif state=='attack':
        strike=max(0,math.sin(f*math.pi*1.3))
        dx=top*(10*strike-3)+arm*(10*strike-2)+leg_wave*2
        dy=-arm*4*strike+top*(3*strike)
    elif state=='cast':
        lift=4+3*math.sin(f*math.tau)
        dx=top*(2*wave)+arm*(-2+4*wave)
        dy=-top*lift
    elif state=='hit':
        pulse=max(0, math.sin(f*math.pi))
        dx=top*(-11*pulse)+arm*(-4*pulse)
        dy=top*2.5*pulse
    else: # down is a deterministic collapse through a shallow lean, not a ragdoll.
        fall=min(1,f*1.6)
        dx=top*(-20*fall)+leg_wave
        dy=top*(12*fall)
    map_x=(xx-dx).astype('float32')
    map_y=(yy-dy).astype('float32')
    out=cv2.remap(image,map_x,map_y,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    return out


def make():
    report=[]
    for side in ('dawn','dusk'):
        for idx in range(1,4):
            name=f'unit-{side}-{idx}'
            source=np.array(Image.open(ASSETS/(name+'.webp')).convert('RGBA'))
            # Keep RGB premultiplied only for interpolation, restore exact alpha after warp.
            a=source[:,:,3:4].astype(np.float32)/255
            source[:,:,:3]=(source[:,:,:3].astype(np.float32)*a).astype(np.uint8)
            H,W=source.shape[:2]
            atlas=Image.new('RGBA',(CELL_W*FRAMES,CELL_H*len(STATES)),(0,0,0,0))
            for row,state in enumerate(STATES):
                for frame in range(FRAMES):
                    frame_img=warp_actor(source,state,frame)
                    if state=='down':
                        # Slowly compress fallen character, never modify game collision position.
                        ratio=1-.23*min(1,frame/4)
                        frame_img=cv2.resize(frame_img,(W,max(1,int(H*ratio))),interpolation=cv2.INTER_AREA)
                    a2=frame_img[:,:,3:4].astype(np.float32)
                    rgb=np.where(a2>0,frame_img[:,:,:3].astype(np.float32)*255/np.maximum(a2,1),0).clip(0,255).astype(np.uint8)
                    frame_img=np.concatenate([rgb,a2.astype(np.uint8)],axis=2)
                    im=Image.fromarray(frame_img,'RGBA')
                    max_w,max_h=CELL_W-PAD*2,CELL_H-PAD*2
                    if im.width>max_w or im.height>max_h:
                        scale=min(max_w/im.width,max_h/im.height)
                        im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
                    cell_x=frame*CELL_W
                    cell_y=row*CELL_H
                    x=cell_x+(CELL_W-im.width)//2
                    y=cell_y+CELL_H-PAD-im.height
                    atlas.alpha_composite(im,(x,y))
            target=OUT/(name+'-motion.webp')
            atlas.save(target,'WEBP',lossless=False,quality=84,method=5)
            report.append({'name':name,'path':'assets/rigs/'+target.name,'bytes':target.stat().st_size})
    manifest={'version':1,'states':STATES,'frames':FRAMES,'cell':[CELL_W,CELL_H],'padding':PAD,'images':report}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':make()
