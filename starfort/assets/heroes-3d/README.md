# Starfort hero meshes

Seven textured GLB meshes reconstructed from the transparent battle artwork in battle-heroes-1/2/3.webp using Stable Fast 3D. Each model has approximately 25,000 triangles and a 2048-pixel texture atlas. Source figures are provided alongside the meshes for visual comparison.

The -rigged.glb files add 19-bone, four-influence source-pose skeletons and Idle, Walk, Run, Attack, Special, Guard, Hit and Death animation clips. They are loaded for the current party in the official battle renderer. The -reconstructed.glb files remain the static source meshes. Unseen sides are inferred from a single source view. Faces, thin weapons and cloth edges still require visual review.

Rebuild animation assets with Blender 4.5 LTS using --background --factory-startup --python scripts/rig-hero-models.py. Validate them with node scripts/check-hero-rigs.mjs.

Open hero-model-viewer.html in the locally served game to compare each mesh with its source. The heroes panel links to this viewer. Build the viewer with npm run build:rigged3d.

Optional regeneration uses scripts/generate-hero-models.py with gradio_client==1.3.0. It submits the source artwork to the Stability AI SF3D demonstration and skips existing files. Server availability and GPU quotas apply. SF3D licensing is included in SF3D-LICENSE.md. The source hero artwork belongs to this project.
