# Starfort hero meshes

Seven textured GLB meshes reconstructed from the transparent battle artwork in battle-heroes-1/2/3.webp using Stable Fast 3D. Each model has approximately 25,000 triangles and a 2048-pixel texture atlas. Source figures are provided alongside the meshes for visual comparison.

These files currently provide static, rotatable character models. Their unseen sides are inferred from a single source view. Faces, thin weapons and cloth edges require visual review. They contain no animation skeleton.

Open hero-model-viewer.html in the locally served game to compare each mesh with its source. The heroes panel links to this viewer. Build the viewer with npm run build:rigged3d.

Optional regeneration uses scripts/generate-hero-models.py with gradio_client==1.3.0. It submits the source artwork to the Stability AI SF3D demonstration and skips existing files. Server availability and GPU quotas apply. SF3D licensing is included in SF3D-LICENSE.md. The source hero artwork belongs to this project.
