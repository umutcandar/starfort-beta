import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {ANATOMICAL_MODEL,ANATOMICAL_HERO_PRESETS,anatomicalPreset} from './official-anatomical-v267.js';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('production build contains actual CC0 MakeHuman anatomical skinned GLB',()=>{
 const file=new URL('./'+ANATOMICAL_MODEL.file,import.meta.url);
 assert.ok(existsSync(file),'Anatomical GLB must be downloaded and validated during build');
 const data=readFileSync(file);
 assert.ok(data.byteLength>ANATOMICAL_MODEL.minBytes);
 assert.ok(data.byteLength<ANATOMICAL_MODEL.maxBytes);
 assert.equal(data.readUInt32LE(0),0x46546c67);
 const jsonLength=data.readUInt32LE(12);
 const json=JSON.parse(data.subarray(20,20+jsonLength).toString());
 assert.ok(json.skins?.length>0);
 const boneNames=new Set(json.skins.flatMap(s=>s.joints.map(id=>json.nodes[id]?.name)));
 for(const bone of ANATOMICAL_MODEL.requiredBones)assert.ok(boneNames.has(bone),bone);
 const clipNames=new Set(json.animations.map(c=>c.name));
 for(const name of ANATOMICAL_MODEL.requiredAnimations)assert.ok(clipNames.has(name),name);
 assert.ok(json.images?.length>0,'Human should have actual skin texture images');
 const positions=(json.accessors||[]).filter(a=>a.type==='VEC3'&&a.min&&a.max);
 assert.ok(positions.some(a=>a.max[1]-a.min[1]>1.0),'body should have anatomical height');
});
test('source pin and asset license are documented, not floating runtime dependencies',()=>{
 assert.match(ANATOMICAL_MODEL.url,/raw\.githubusercontent\.com\/kblood\/CharacterCreator\/[a-f0-9]{40}\/output\/base_body_anim\.glb/);
 assert.ok(ANATOMICAL_MODEL.url.includes(ANATOMICAL_MODEL.commit));
 assert.match(ANATOMICAL_MODEL.license,/CC0/);
 const builder=src('./scripts/build-rigged3d.mjs');
 assert.match(builder,/download\(ANATOMICAL_MODEL\.name,ANATOMICAL_MODEL\.url\)/);
 assert.match(builder,/Human missing bone/);
 assert.match(builder,/Human missing animation/);
 assert.match(builder,/LICENSE-NOTES/);
});
test('seven heroes have explicit anatomical appearance presets',()=>{
 for(const id of ['aldren','lyra','rovan','mira','doran','vesper','eira']){
  const p=anatomicalPreset({team:0,heroId:id});
  assert.equal(typeof p.sex,'string');
  assert.ok(Number.isFinite(p.build)&&Number.isFinite(p.height));
 }
 assert.equal(Object.keys(ANATOMICAL_HERO_PRESETS).length,7);
 assert.ok(anatomicalPreset({team:1,type:'boss'}).build>
   anatomicalPreset({team:1,type:'raider'}).build);
});
