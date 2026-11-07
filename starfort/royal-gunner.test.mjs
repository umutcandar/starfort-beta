import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createRiggedEquipment,riggedGearProfile} from './official-rigged-equipment-v266.js';
import {combatAppearance} from './official-rigged-style-v265.js';
import {ROYAL_GUNNER_LABELS} from './royal-gunner-locale.js';
import {createRoyalGunnerActionClips} from './official-anatomical-motion-v267.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const unit={team:0,heroId:'rovan',hp:100,action:'attack'};

test('gunner has distinct two-handed rifle and charged-shot skeletal tracks',()=>{
 const model=new THREE.Group();
 for(const name of ['spine_03','upperarm_r','lowerarm_r','upperarm_l','lowerarm_l','pelvis']){
  const bone=new THREE.Bone();bone.name=name;model.add(bone);
 }
 const clips=createRoyalGunnerActionClips(model);
 assert.deepEqual([...clips.keys()],['Attack','Special']);
 assert.ok(clips.get('Attack').duration>.5);
 assert.ok(clips.get('Special').duration>clips.get('Attack').duration);
 for(const clip of clips.values()){
  assert.ok(clip.tracks.some(track=>track.name==='upperarm_l.quaternion'));
  assert.ok(clip.tracks.some(track=>track.name==='upperarm_r.quaternion'));
  assert.ok(clip.validate());
 }
 const production=read('./official-rigged-three-v264.entry.js');
 assert.match(production,/createRoyalGunnerActionClips\(model\)/);
 assert.match(production,/unit\?\.heroId==='rovan'/);
 assert.match(production,/unit\?\.heroId!=='rovan'&&attack/);
});
test('3D hero preview link has all fourteen game languages',()=>{
 assert.equal(Object.keys(ROYAL_GUNNER_LABELS).length,14);
 for(const label of Object.values(ROYAL_GUNNER_LABELS))assert.ok(label.includes('3D')&&label.length>12);
});
test('Royal Gunner is a real animated 3D visual skin, not a fake image or server hero ID',()=>{
 const profile=riggedGearProfile(unit);
 assert.equal(profile.kind,'royal-gunner');
 assert.equal(profile.weapon,'energy-cannon');
 assert.equal(profile.offhand,'support');
 assert.equal(profile.head,'open');
 assert.equal(profile.cape,true);
 assert.equal(profile.plate,true);
 const style=combatAppearance(unit);
 assert.equal(style.tint,0x7b2840);
 assert.ok(style.metal>.4);
});
test('royal gunner gun, muzzle, cape, hair and blue PBR reactor are mesh-based',()=>{
 const root=new THREE.Group(),model=new THREE.Group();
 const gear=createRiggedEquipment(root,model,unit,{quality:'balanced',rig:'human'});
 const meshes=[];
 gear.root.traverse(obj=>{if(obj.isMesh)meshes.push(obj);});
 assert.ok(meshes.length>40,'3D equipment needs real geometry with many parts');
 assert.ok(meshes.some(obj=>obj.material.color?.getHex()===0x2f8fe7),'blue energy core material');
 assert.ok(meshes.some(obj=>obj.material.color?.getHex()===0xc79555),'blond hair geometry');
 const flash=meshes.find(obj=>obj.material.type==='MeshBasicMaterial'&&obj.material.color?.getHex()===0x8bcfff);
 assert.ok(flash,'separate animated muzzle effect');
 assert.equal(flash.visible,false);
 gear.update(Math.PI/(2*17),'Attack',true);
 assert.equal(flash.visible,true,'server-approved attack causes visual muzzle flash');
 gear.update(.1,'Idle',true);
 assert.equal(flash.visible,false,'no fire on idle');
 gear.dispose();assert.equal(root.children.length,0);
});
test('Royal Gunner previews reuse production models, builds, and server-safe visuals',()=>{
 const html=read('./royal-gunner-3d.html');
 const code=read('./royal-gunner-preview.entry.js');
 const builder=read('./scripts/build-rigged3d.mjs');
 const game=read('./app.js');
 assert.match(html,/royal-gunner-viewer\.js/);
 assert.match(html,/id="hero-canvas"/);
 assert.match(game,/royal-gunner-3d\.html/);
 assert.match(builder,/royal-gunner-preview\.entry\.js/);
 assert.match(code,/prepareAnatomicalClips/);
 assert.match(code,/createRiggedEquipment/);
 assert.match(code,/GLTFLoader/);
 assert.match(code,/pointermove/);
 assert.doesNotMatch(code,/supabase|\.rpc\(|reward\.gold|localStorage|setItem\(/i);
});
