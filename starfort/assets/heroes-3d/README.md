# Starfort hero meshes

Seven textured GLB meshes reconstructed from the transparent battle artwork in battle-heroes-1/2/3.webp using Stable Fast 3D. Each model has approximately 25,000 triangles and a 2048-pixel texture atlas. Source figures are provided alongside the meshes for visual comparison.

The -rigged.glb files add 19-bone, four-influence source-pose skeletons and Idle, Walk, Run, Attack, Special, Guard, Hit and Death animation clips. They are loaded for the current party in the official battle renderer. The -reconstructed.glb files remain the static source meshes. Unseen sides are inferred from a single source view. Faces, thin weapons and cloth edges still require visual review.

Rebuild animation assets with Blender 4.5 LTS using --background --factory-startup --python scripts/rig-hero-models.py. Validate them with node scripts/check-hero-rigs.mjs.

Open hero-model-viewer.html in the locally served game to compare each mesh with its source. The heroes panel links to this viewer. Build the viewer with npm run build:rigged3d.

Optional regeneration uses scripts/generate-hero-models.py with gradio_client==1.3.0. It submits the source artwork to the Stability AI SF3D demonstration and skips existing files. Server availability and GPU quotas apply. SF3D licensing is included in SF3D-LICENSE.md. The source hero artwork belongs to this project.

## Experimental articulated archery

Rovan has an independent unarmed body, bow limbs, string morph and arrow in rovan-archery-experiment.glb. Build it with Blender --background --factory-startup --python scripts/rig-rovan-archery.py. Test mechanical contacts and flight with node scripts/check-rovan-archery.mjs. Inspect it using hero-model-viewer.html?hero=rovan&experiment=archery.

The shot mechanics pass numerical contact checks. The reconstructed body's sleeves and cape still deform poorly at the shoulder. It requires clean animation topology before promotion to the normal hero/battle asset. Modular armor replacement and production-quality role animations for the full roster remain open.

## Native humanoid character preview (work in progress)

`*-native.glb` is a separate, experimental seven-character pipeline. Open
`hero-model-viewer.html?hero=rovan&experiment=native`, or use **Yeni 3B önizlemesi**
on a hero card. It is not promoted to the official battle renderer.

The body and its original skin weights come from the pinned CC0 MakeHuman/MPFB
`RealHuman.glb` documented in `../rigged/MODEL-LICENSE.txt`. All 53 joints,
including individual finger joints, are retained. Clothing, closed boot lasts,
quad-strip hands, folded robes/coats, capes and optional breastplates are
independent meshes. The face/hair/hood comes from the existing reconstructed
hero mesh. Embroidery uses the project's artwork reprojected in limb space;
the model is real geometry, but this does **not** create complete, clean UV
textures of surfaces absent from that artwork. Material detail maps are baked
into the GLBs rather than relying on Blender-only noise nodes.

The preview includes eight clips per hero. Authored attack clips move separate
swords, shield, axe, daggers and staves with arm IK; Rovan additionally has finger
IK, a flexing bow, deforming string and a released projectile. Idle/ready poses
and role combat clips are authored procedurally; these are not motion capture.
The donor provides the walking/running/falling foundation. The viewer supports
scrubbing, pause, speed, four camera angles, source comparison, an optional
steel breastplate and cape visibility. Armour selection is a **preview control**;
it is not connected to saved inventory/loadouts.

Build locally (Blender 4.5 LTS; no external generation calls):

```sh
blender --background --factory-startup --python scripts/build-native-heroes.py
npm run build:rigged3d
node scripts/check-native-heroes.mjs
node scripts/check-native-archery.mjs
```

A subset can be rebuilt by passing hero IDs after `--`. Generated assets are
committed so ordinary web builds do not require Blender.

### Remaining visual work

These assets are **not production-quality replacements** for the illustrations.
Faces/hair retain single-view reconstruction artefacts, neck/shoulder joins need
manual retopology, garment UVs can contain baked shadows or neighbouring art,
and armour/weapon designs are simplified. Cloth is skinned, not simulated. The
seven silhouettes, facial volumes, grip shapes and full attack arcs need an
artist pass and multi-angle review before the battle defaults can change.
Geometry/contact checks verify mechanics and finite deformation; they do not
certify visual fidelity. The official renderer continues using `*-rigged.glb`.
