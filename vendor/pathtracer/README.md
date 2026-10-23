# Quelec: local WebGL path-tracing backend

- three-gpu-pathtracer **0.0.24**: <https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.24>
- three-mesh-bvh **0.9.2**: <https://github.com/gkjohnson/three-mesh-bvh/tree/v0.9.2>
- Compatible Three.js **0.180.0** (r180), supplied by the viewer's existing import map.
- Each library's MIT license is included in this directory.

`pathtracer.js` bundles WebGLPathTracer, PhysicalSpotLight, GradientEquirectTexture,
GenerateMeshBVHWorker and their required helpers. Only the exact `three` import is
external; Three's addons are bundled. The BVH worker bundles its own Three r180
geometry utilities because module workers do not inherit document import maps.
Both JavaScript files are loaded from this site; no runtime CDN is used.

These files were built with esbuild 0.25.10, ESM, minified, retaining legal comments:

```
export { WebGLPathTracer } from 'three-gpu-pathtracer/src/core/WebGLPathTracer.js';
export { GradientEquirectTexture } from 'three-gpu-pathtracer/src/textures/GradientEquirectTexture.js';
export { PhysicalSpotLight } from 'three-gpu-pathtracer/src/objects/PhysicalSpotLight.js';
export { GenerateMeshBVHWorker } from 'three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js';
```

Bundle this entry with `--bundle --format=esm --minify --legal-comments=inline`
and an esbuild onResolve plugin that externalizes **only** the exact bare string
`three` (filter `/^three$/`). Do not use `--external:three`: that option also
externalizes the addons and would require additional browser import mappings.
Then separately bundle the BVH package's
`src/workers/generateMeshBVH.worker.js` with the same flags and no externalization.
The worker filename and directory must be preserved.

The shared adapter's `render()` returns true only after an entire actual traced
sample exists. The interactive raster view remains visible during preparation.
This is stochastic path tracing with a BVH, multiple-importance sampling and
progressive accumulation; no raster shadow filter is presented as ray tracing.

Limitations: WebGL 2 + EXT_color_buffer_float are required; only standard/physical
materials and supported physical lights participate; camera motion resets sample
accumulation. At most 760 pixels along the long edge and 192 samples are used by
default for responsiveness. Paper height textures are converted to normal maps,
which affect shading rather than displacing the surface.

Browser verification (Chrome / WebGL 2, 2026-10-23): real scene reached 6.5 samples, camera movement reset accumulation to 0, and reactivation produced fresh samples. On disable, renderer-reported textures dropped from 24 to 2. Missing float-buffer support and cancellation preserved the normal view; no shader/page errors occurred.
