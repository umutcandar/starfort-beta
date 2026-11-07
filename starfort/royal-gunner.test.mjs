import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createRiggedEquipment,riggedGearProfile} from './official-rigged-equipment-v266.js';
import {combatAppearance} from './official-rigged-style-v265.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const unit={team:0,heroId:'rovan',hp:100,action:'attack'};

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
